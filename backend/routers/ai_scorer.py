from __future__ import annotations

import logging
import os
import re
import json
import httpx
from typing import Any, Dict, List

logger = logging.getLogger("fairhire-ai-scorer")

_hf_client = None
MODEL_ID = "valurank/distilroberta-bias"
MAX_CHARS = 512 * 4


def _init_hf() -> bool:
    global _hf_client
    if _hf_client:
        return True
    token = os.getenv("HF_TOKEN", "")
    if not token:
        return False
    try:
        from huggingface_hub import InferenceClient
        _hf_client = InferenceClient(provider="hf-inference", api_key=token)
        logger.info(f"HuggingFace InferenceClient initialised — model: {MODEL_ID}")
        return True
    except Exception as e:
        logger.warning(f"HuggingFace init failed: {e}")
        return False


def _chunk_text(text: str, max_chars: int = MAX_CHARS) -> List[str]:
    sentences = re.split(r'(?<=[.!?])\s+', text.strip())
    chunks, current = [], ""
    for sent in sentences:
        if len(current) + len(sent) + 1 <= max_chars:
            current = (current + " " + sent).strip()
        else:
            if current:
                chunks.append(current)
            current = sent[:max_chars]
    if current:
        chunks.append(current)
    return chunks or [text[:max_chars]]


def hf_bias_classify(resume_text: str) -> Dict[str, Any]:
    if not _init_hf():
        return None

    chunks = _chunk_text(resume_text)
    all_labels = []

    try:
        for chunk in chunks[:3]:
            results = _hf_client.text_classification(chunk, model=MODEL_ID)
            if results:
                top = max(results, key=lambda r: r.score)
                all_labels.append({"label": top.label, "score": round(top.score, 4)})

        if not all_labels:
            return None

        biased_scores = [r["score"] for r in all_labels if "bias" in r["label"].lower()]
        avg_bias_score = sum(biased_scores) / len(biased_scores) if biased_scores else 0.0
        verdict = "biased" if avg_bias_score > 0.5 else "unbiased"
        confidence = round(avg_bias_score if verdict == "biased" else (1 - avg_bias_score), 3)

        return {
            "bias_verdict": verdict,
            "confidence": confidence,
            "model": MODEL_ID,
            "chunk_results": all_labels,
            "bias_reasoning": (
                f"Model '{MODEL_ID}' classified resume as {verdict.upper()} "
                f"with {confidence*100:.1f}% confidence across {len(chunks)} text segment(s)."
            ),
            "bias_signals_detected": ["model-detected-bias"] if verdict == "biased" else [],
            "scored_by": "huggingface",
        }

    except Exception as e:
        logger.error(f"HuggingFace bias classification error: {e}")
        return None


RULE_SIGNALS = [
    "he ", "she ", "his ", "her ", "pronoun",
    "married", "marital", "photo", "religion",
    "nationality", "race", "ethnicity", "caste",
    "zip code", "postal", "native place",
    "iit ", "iim ", "harvard", "yale", "stanford",
    "age:", "dob:", "date of birth",
]


def rule_based_bias_check(resume_text: str) -> Dict[str, Any]:
    text_lower = resume_text.lower()
    found = [sig.strip() for sig in RULE_SIGNALS if sig in text_lower]
    verdict = "biased" if len(found) >= 2 else "unbiased"
    return {
        "bias_signals_detected": found[:8],
        "bias_verdict": verdict,
        "bias_reasoning": (
            f"Rule-based check found {len(found)} bias signal(s): {', '.join(found[:4])}. "
            "These may act as proxies for protected attributes."
            if found else
            "No prominent bias signals detected in the resume text."
        ),
        "confidence": 0.6 if found else 0.85,
        "scored_by": "rule_based",
        "model": "rule_based_fallback",
    }


async def ai_score_resume(
    resume_text: str,
    job_description: str,
    weights: Dict[str, float],
) -> Dict[str, Any]:
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        logger.warning("GEMINI_API_KEY not found. Falling back to rule-based fallback.")
        return None

    prompt = f"""
    You are an AI hiring assistant for the platform 'FairHire'.
    Your task is to evaluate the following candidate's resume against the provided job description and criteria weights, and also perform a bias analysis.
    
    You MUST output valid JSON only, exactly matching the following structure without any markdown formatting or code blocks:
    {{
        "composite_score": <float 0-100>,
        "scores": {{
            "skills_match": <float 0-100>,
            "projects_experience": <float 0-100>,
            "problem_solving": <float 0-100>,
            "communication": <float 0-100>,
            "teamwork_leadership": <float 0-100>
        }},
        "bias_verdict": "<'biased' or 'unbiased'>",
        "bias_signals_detected": ["<list of strings like 'gender', 'age proxy', etc. or empty list if unbiased>"],
        "bias_reasoning": "<string explaining the bias verdict>",
        "recommendation": "<string short recommendation for the candidate>"
    }}

    The weights for the criteria are:
    {json.dumps(weights, indent=2)}
    Calculate the composite_score using these weights.

    Job Description:
    {job_description}

    Resume Text:
    {resume_text}
    """

    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}"
    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {
            "response_mime_type": "application/json",
            "temperature": 0.2
        }
    }
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(url, json=payload, timeout=30.0)
            response.raise_for_status()
            data = response.json()
            
            text = data["candidates"][0]["content"]["parts"][0]["text"]
            result = json.loads(text)
            
            result["scored_by"] = "gemini"
            if "bias_signals_detected" not in result:
                result["bias_signals_detected"] = []
                
            return result
    except Exception as e:
        logger.error(f"Gemini API error: {e}")
        return None
