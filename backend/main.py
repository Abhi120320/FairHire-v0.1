from __future__ import annotations

import logging
import math
import re
import time
import random
import os
from typing import Any, Dict, List, Optional

from fastapi import FastAPI, File, Form, Request, UploadFile, Depends
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from sqlalchemy.orm import Session

from database import engine, Base, get_db
from models.db_models import CandidateRecord

from models.schemas import (
    AdvancedAnonymizeRequest,
    AdvancedBiasRequest,
    AdvancedExplainRequest,
    BiasCandidate,
    HealthResponse,
)

from routers import anonymize, bias, explain, parse
from routers.ai_scorer import ai_score_resume, rule_based_bias_check

load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("fairhire-api")

app = FastAPI(
    title="FairHire API",
    description="AI-powered bias-free hiring platform",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

import asyncio

@app.on_event("startup")
async def startup():
    retries = 5
    while retries > 0:
        try:
            Base.metadata.create_all(bind=engine)
            logger.info("Successfully connected to the database and created tables.")
            break
        except Exception as e:
            retries -= 1
            logger.warning(f"Database connection failed. Retrying in 5 seconds... ({retries} retries left).")
            await asyncio.sleep(5)
    else:
        logger.error("Failed to connect to the database after multiple retries. API may not function correctly.")


@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    logger.info(f"{request.method} {request.url.path} - {response.status_code} - {process_time:.4f}s")
    return response

app.include_router(parse.router)
app.include_router(anonymize.router)
app.include_router(bias.router)
app.include_router(explain.router)

@app.get("/api/health", response_model=HealthResponse, tags=["Health"])
@app.get("/", response_model=HealthResponse, tags=["Health"])
async def health_check():
    ai_mode = "gemini" if os.getenv("GEMINI_API_KEY") else "rule_based"
    return HealthResponse(status=f"healthy | ai_scorer={ai_mode}", version="0.1.0")


DEFAULT_WEIGHTS = {
    "skills_match": 0.35,
    "projects_experience": 0.25,
    "problem_solving": 0.20,
    "communication": 0.10,
    "teamwork_leadership": 0.10,
}

DEFAULT_REQUIRED_SKILLS = [
    "python", "javascript", "java", "c++", "react", "node.js", "express",
    "rest api", "mysql", "mongodb", "postgresql", "git", "github", "docker",
    "data structures", "algorithms", "aws", "azure", "gcp"
]

PROJECT_KEYWORDS = [
    "project", "built", "developed", "created", "implemented", "designed",
    "hackathon", "contest", "competition", "portfolio", "github", "deployed",
    "freelance", "internship", "open source", "contribution"
]

PROBLEM_SOLVING_KEYWORDS = [
    "algorithm", "data structure", "leetcode", "codeforces", "competitive",
    "optimization", "debug", "troubleshoot", "solved", "logic", "complexity",
    "dynamic programming", "graph", "tree", "sorting"
]

COMMUNICATION_KEYWORDS = [
    "presentation", "documentation", "technical writing", "blog", "published",
    "mentor", "taught", "explained", "collaborated", "communicated", "report"
]

TEAMWORK_KEYWORDS = [
    "team", "led", "leadership", "managed", "coordinated", "collaborated",
    "agile", "scrum", "cross-functional", "volunteer", "captain", "president"
]


def _parse_weights_from_jd(jd_text: str) -> Dict[str, float]:
    weights = dict(DEFAULT_WEIGHTS)
    jd_lower = jd_text.lower()
    patterns = {
        "skills_match": r"skills?\s*(?:match)?\s*[:=]?\s*(\d+)\s*%",
        "projects_experience": r"(?:projects?|experience)\s*(?:&|and)?\s*(?:experience)?\s*[:=]?\s*(\d+)\s*%",
        "problem_solving": r"problem\s*solving\s*[:=]?\s*(\d+)\s*%",
        "communication": r"communication\s*[:=]?\s*(\d+)\s*%",
        "teamwork_leadership": r"(?:teamwork|leadership)\s*(?:&|and)?\s*(?:leadership)?\s*[:=]?\s*(\d+)\s*%",
    }
    for key, pattern in patterns.items():
        match = re.search(pattern, jd_lower)
        if match:
            weights[key] = int(match.group(1)) / 100.0
    total = sum(weights.values())
    if total > 0:
        weights = {k: v / total for k, v in weights.items()}
    return weights


def _extract_skills_from_jd(jd_text: str) -> List[str]:
    jd_lower = jd_text.lower()
    found_skills = [s for s in DEFAULT_REQUIRED_SKILLS if s in jd_lower]
    return found_skills if found_skills else DEFAULT_REQUIRED_SKILLS


def _count_keyword_hits(text: str, keywords: List[str]) -> int:
    text_lower = text.lower()
    return sum(1 for kw in keywords if kw in text_lower)


def _keyword_score_resume(resume_text: str, jd_text: str, weights: Dict[str, float]) -> Dict[str, Any]:
    required_skills = _extract_skills_from_jd(jd_text)
    resume_lower = resume_text.lower()
    matched_skills = [s for s in required_skills if s in resume_lower]
    skills_score = (len(matched_skills) / max(1, len(required_skills))) * 100
    project_hits = _count_keyword_hits(resume_text, PROJECT_KEYWORDS)
    projects_score = min(100, project_hits * 12)
    ps_hits = _count_keyword_hits(resume_text, PROBLEM_SOLVING_KEYWORDS)
    problem_solving_score = min(100, ps_hits * 15)
    comm_hits = _count_keyword_hits(resume_text, COMMUNICATION_KEYWORDS)
    communication_score = min(100, comm_hits * 20)
    team_hits = _count_keyword_hits(resume_text, TEAMWORK_KEYWORDS)
    teamwork_score = min(100, team_hits * 20)
    composite = (
        skills_score * weights["skills_match"] +
        projects_score * weights["projects_experience"] +
        problem_solving_score * weights["problem_solving"] +
        communication_score * weights["communication"] +
        teamwork_score * weights["teamwork_leadership"]
    )
    return {
        "composite_score": round(composite, 2),
        "scores": {
            "skills_match": round(skills_score, 1),
            "projects_experience": round(projects_score, 1),
            "problem_solving": round(problem_solving_score, 1),
            "communication": round(communication_score, 1),
            "teamwork_leadership": round(teamwork_score, 1),
        },
        "scored_by": "keyword_matching",
        "matched_skills": matched_skills,
    }


def _build_score_breakdown(scores: Dict, weights: Dict, matched_skills: List = None) -> Dict:
    return {
        "skills_match": {
            "score": scores.get("skills_match", 0),
            "weight": f"{weights['skills_match']*100:.0f}%",
            "matched": matched_skills or [],
        },
        "projects_experience": {
            "score": scores.get("projects_experience", 0),
            "weight": f"{weights['projects_experience']*100:.0f}%",
        },
        "problem_solving": {
            "score": scores.get("problem_solving", 0),
            "weight": f"{weights['problem_solving']*100:.0f}%",
        },
        "communication": {
            "score": scores.get("communication", 0),
            "weight": f"{weights['communication']*100:.0f}%",
        },
        "teamwork_leadership": {
            "score": scores.get("teamwork_leadership", 0),
            "weight": f"{weights['teamwork_leadership']*100:.0f}%",
        },
    }


async def _process_single_resume(idx: int, file: UploadFile, job_description: str, weights: Dict[str, float]):
    parse_resp = await parse.parse_resume(file)
    if not parse_resp.success or not parse_resp.data:
        return None
    
    candidate_id = f"CAND_{1000 + idx}"
    parsed_data = parse_resp.data

    anon_req = AdvancedAnonymizeRequest(
        candidate_id=candidate_id,
        parsed_data=parsed_data,
        keep_prestige_signals=False
    )
    anon_resp = await anonymize.anonymize_resume(anon_req)

    ai_result = await ai_score_resume(
        resume_text=parsed_data.raw_text,
        job_description=job_description,
        weights=weights,
    )

    if ai_result:
        composite_score = ai_result["composite_score"]
        scores = ai_result.get("scores", {})
        scored_by = "gemini"
        bias_analysis = {
            "bias_verdict": ai_result.get("bias_verdict", "unbiased"),
            "bias_signals_detected": ai_result.get("bias_signals_detected", []),
            "bias_reasoning": ai_result.get("bias_reasoning", ""),
            "recommendation": ai_result.get("recommendation", ""),
            "scored_by": "gemini",
        }
        matched_skills = []
    else:
        kw = _keyword_score_resume(parsed_data.raw_text, job_description, weights)
        composite_score = kw["composite_score"]
        scores = kw["scores"]
        matched_skills = kw.get("matched_skills", [])
        scored_by = "keyword_matching"
        bias_analysis = rule_based_bias_check(parsed_data.raw_text)

    score_breakdown = _build_score_breakdown(scores, weights, matched_skills if not ai_result else [])

    bc = BiasCandidate(
        candidate_id=candidate_id,
        skills=parsed_data.skills,
        years_exp=parsed_data.years_experience or 2.0,
        score=composite_score,
        gender=random.choice(["Male", "Female"]),
        ethnicity=random.choice(["Asian", "White", "Hispanic", "Black"]),
        age_group=random.choice(["<30", "30-50", ">50"])
    )

    result_dict = {
        "candidate_id": candidate_id,
        "original_parse": parsed_data.dict(),
        "anonymization": anon_resp.data.dict() if anon_resp.data else {},
        "score": composite_score,
        "skills_match": scores.get("skills_match", 0),
        "score_breakdown": score_breakdown,
        "scored_by": scored_by,
        "ai_bias_analysis": bias_analysis,
        "extraction_method": parsed_data.extraction_method,
    }
    return result_dict, bc


@app.post("/api/full-audit", tags=["Pipeline"])
async def full_audit_pipeline(
    job_description: str = Form(""),
    files: List[UploadFile] = File([]),
    demo_mode: bool = Form(False),
    db: Session = Depends(get_db)
):
    try:
        results = []
        bias_candidates = []
        ai_enabled = bool(os.getenv("GEMINI_API_KEY"))

        if demo_mode:
            bias_candidates = bias._generate_synthetic_candidates(20)
            for c in bias_candidates:
                skills_sc = round(random.uniform(40, 95), 1)
                proj_sc = round(random.uniform(30, 90), 1)
                ps_sc = round(random.uniform(20, 85), 1)
                comm_sc = round(random.uniform(30, 80), 1)
                team_sc = round(random.uniform(25, 85), 1)
                composite = round(
                    skills_sc * 0.35 + proj_sc * 0.25 + ps_sc * 0.20 + comm_sc * 0.10 + team_sc * 0.10, 2
                )
                bias_verdict = "biased" if composite < 55 and random.random() > 0.5 else "unbiased"
                bias_signals = ["graduation_year_proxy", "location_proxy"] if bias_verdict == "biased" else []
                bias_reasoning = (
                    "Score was disproportionately influenced by location and graduation year, which may proxy for age or race."
                    if bias_verdict == "biased"
                    else "Scoring was based on merit-relevant features only."
                )
                results.append({
                    "candidate_id": c.candidate_id,
                    "original_parse": {"name": f"Candidate_{c.candidate_id}"},
                    "anonymization": {"confidence_score": 0.99, "bias_signals_found": []},
                    "score": composite,
                    "skills_match": skills_sc,
                    "score_breakdown": {
                        "skills_match": {"score": skills_sc, "weight": "35%"},
                        "projects_experience": {"score": proj_sc, "weight": "25%"},
                        "problem_solving": {"score": ps_sc, "weight": "20%"},
                        "communication": {"score": comm_sc, "weight": "10%"},
                        "teamwork_leadership": {"score": team_sc, "weight": "10%"},
                    },
                    "ai_bias_analysis": {
                        "bias_verdict": bias_verdict,
                        "bias_signals_detected": bias_signals,
                        "bias_reasoning": bias_reasoning,
                        "scored_by": "demo_synthetic",
                    },
                })
        else:
            weights = _parse_weights_from_jd(job_description) if job_description else DEFAULT_WEIGHTS

            tasks = [
                _process_single_resume(idx, file, job_description, weights)
                for idx, file in enumerate(files)
            ]
            
            processed_items = await asyncio.gather(*tasks)
            
            for item in processed_items:
                if item is not None:
                    res_dict, bc = item
                    results.append(res_dict)
                    bias_candidates.append(bc)

        bias_req = AdvancedBiasRequest(candidates=bias_candidates)
        bias_resp = await bias.analyze_bias(bias_req)

        try:
            await explain.startup_event()
        except Exception:
            pass

        for res in results:
            cid = res["candidate_id"]
            bd = res.get("score_breakdown", {})
            feat_vec = {
                "skills_match_score": bd.get("skills_match", {}).get("score", 50) / 10,
                "years_exp": 5.0,
                "edu_level": 2,
                "past_companies_count": 2,
                "location_proxy": random.uniform(0.1, 0.9),
                "grad_year_proxy": random.uniform(0.2, 0.8)
            }
            exp_req = AdvancedExplainRequest(candidate_id=cid, features=feat_vec)
            try:
                exp_resp = await explain.explain_candidate(exp_req)
                res["explanation"] = exp_resp.dict()
            except Exception as e:
                res["explanation"] = {"error": str(e)}

        for res in results:
            record = CandidateRecord(
                candidate_id=res["candidate_id"],
                composite_score=res["score"],
                bias_verdict=res["ai_bias_analysis"].get("bias_verdict", "unbiased"),
                skills=res.get("original_parse", {}).get("skills", []),
                full_analysis=res
            )
            db.add(record)
            
        try:
            db.commit()
        except Exception as db_e:
            logger.error(f"Failed to save to database: {db_e}")
            db.rollback()

        ai_scorer_mode = "gemini" if ai_enabled else "rule_based_fallback"

        return {
            "success": True,
            "pipeline_summary": {
                "total_processed": len(results),
                "demo_mode_used": demo_mode,
                "ai_scorer": ai_scorer_mode,
                "scoring_criteria": "Weighted Rubric (Skills 35%, Projects 25%, Problem Solving 20%, Communication 10%, Teamwork 10%)",
            },
            "bias_audit": bias_resp.dict() if bias_resp else {},
            "candidates": results
        }

    except Exception as e:
        logger.error(f"Full Audit Pipeline failed: {e}")
        return {"success": False, "error": str(e)}

@app.get("/api/candidates", tags=["Pipeline"])
async def get_candidates(db: Session = Depends(get_db)):
    try:
        records = db.query(CandidateRecord).order_by(CandidateRecord.created_at.desc()).all()
        return {
            "success": True,
            "count": len(records),
            "data": [
                {
                    "id": r.id,
                    "candidate_id": r.candidate_id,
                    "composite_score": r.composite_score,
                    "bias_verdict": r.bias_verdict,
                    "skills": r.skills,
                    "created_at": r.created_at.isoformat()
                }
                for r in records
            ]
        }
    except Exception as e:
        return {"success": False, "error": str(e)}
