from __future__ import annotations

import math
import random
from typing import Dict, List, Tuple

import numpy as np
from fastapi import APIRouter
from sklearn.feature_extraction.text import CountVectorizer
from sklearn.metrics.pairwise import cosine_similarity

from models.schemas import (
    AdvancedBiasRequest,
    AdvancedBiasResponse,
    BiasCandidate,
    MetricResult,
)

router = APIRouter(prefix="/api/analyze-bias", tags=["Bias Detection"])


def _generate_synthetic_candidates(num: int = 100) -> List[BiasCandidate]:
    candidates = []
    genders = ["Male", "Female", "Non-Binary"]
    ethnicities = ["Asian", "White", "Hispanic", "Black"]
    age_groups = ["<30", "30-50", ">50"]
    skill_sets = [
        ["Python", "React", "SQL"],
        ["Java", "Spring", "AWS"],
        ["JavaScript", "Node.js", "Docker"],
        ["Python", "Machine Learning", "TensorFlow"],
    ]

    for i in range(num):
        gender = random.choice(genders)
        ethnicity = random.choice(ethnicities)
        age_group = random.choice(age_groups)
        skills = random.choice(skill_sets)
        years_exp = random.uniform(1.0, 15.0)
        base_score = min(100.0, years_exp * 5 + random.uniform(0, 30))
        if gender == "Female":
            base_score = max(0.0, base_score - 15.0)
        if ethnicity == "Black":
            base_score = max(0.0, base_score - 10.0)
        is_hired = 1 if base_score > 60.0 else 0
        if random.random() < 0.2:
            is_hired = 1 - is_hired
        candidates.append(BiasCandidate(
            candidate_id=f"CAND_{i+1000}",
            skills=skills,
            years_exp=round(years_exp, 1),
            score=round(base_score, 1),
            is_hired=is_hired,
            gender=gender,
            ethnicity=ethnicity,
            age_group=age_group,
        ))
    return candidates


def _compute_individual_fairness(candidates: List[BiasCandidate]) -> Tuple[float, List[str]]:
    if len(candidates) < 2:
        return 1.0, []
    corpus = [" ".join(c.skills) for c in candidates]
    vectorizer = CountVectorizer().fit_transform(corpus)
    vectors = vectorizer.toarray()
    max_exp = max(c.years_exp for c in candidates) if any(c.years_exp for c in candidates) else 1.0
    exp_features = np.array([c.years_exp / max_exp for c in candidates]).reshape(-1, 1) * 2.0
    feature_matrix = np.hstack((vectors, exp_features))
    similarities = cosine_similarity(feature_matrix)
    scores = np.array([c.score for c in candidates])
    flagged = set()
    violations = 0
    total_comparisons = 0
    for i in range(len(candidates)):
        for j in range(i + 1, len(candidates)):
            sim = similarities[i, j]
            if sim > 0.85:
                total_comparisons += 1
                score_diff = abs(scores[i] - scores[j])
                if score_diff > 15.0:
                    violations += 1
                    flagged.add(candidates[i].candidate_id)
                    flagged.add(candidates[j].candidate_id)
    metric = max(0.0, 1.0 - (violations / max(1, total_comparisons)))
    return metric, list(flagged)


@router.post("/", response_model=AdvancedBiasResponse)
async def analyze_bias(payload: AdvancedBiasRequest):
    try:
        from fairlearn.metrics import (
            demographic_parity_difference,
            demographic_parity_ratio,
            equalized_odds_difference,
        )
        candidates = payload.candidates
        if not candidates:
            candidates = _generate_synthetic_candidates(100)
        y_true = np.array([c.is_hired if c.is_hired is not None else (1 if c.score > 60 else 0) for c in candidates])
        y_pred = np.array([1 if c.score >= 60 else 0 for c in candidates])
        features_map = {
            "gender": np.array([c.gender or "Unknown" for c in candidates]),
            "ethnicity": np.array([c.ethnicity or "Unknown" for c in candidates]),
            "age_group": np.array([c.age_group or "Unknown" for c in candidates]),
        }
        worst_dpd = -1.0
        most_biased_feat = None
        feature_metrics: Dict[str, Dict[str, float]] = {}
        for feat_name, sensitive_array in features_map.items():
            if len(np.unique(sensitive_array)) > 1:
                dpd = demographic_parity_difference(y_true, y_pred, sensitive_features=sensitive_array)
                dpr = demographic_parity_ratio(y_true, y_pred, sensitive_features=sensitive_array)
                try:
                    eod = equalized_odds_difference(y_true, y_pred, sensitive_features=sensitive_array)
                except Exception:
                    eod = 0.0
                feature_metrics[feat_name] = {"dpd": dpd, "dpr": dpr, "eod": eod}
                if dpd > worst_dpd:
                    worst_dpd = dpd
                    most_biased_feat = feat_name
        if most_biased_feat is None:
            most_biased_feat = "gender"
            feature_metrics["gender"] = {"dpd": 0.0, "dpr": 1.0, "eod": 0.0}
        metrics_obj = feature_metrics[most_biased_feat]

        def _sanitize(val):
            try:
                f_val = float(val)
                if math.isnan(f_val) or math.isinf(f_val):
                    return 0.0
                return f_val
            except Exception:
                return 0.0

        dpd_val = _sanitize(metrics_obj.get("dpd", 0.0))
        dpr_val = _sanitize(metrics_obj.get("dpr", 1.0))
        eod_val = _sanitize(metrics_obj.get("eod", 0.0))
        ind_fairness_val, flagged = _compute_individual_fairness(candidates)
        metric_results = {
            "Demographic Parity Difference": MetricResult(value=round(dpd_val, 4), passed=dpd_val <= 0.1, description="Flags if selection rate difference between groups > 0.1"),
            "Disparate Impact Ratio": MetricResult(value=round(dpr_val, 4), passed=dpr_val >= 0.8, description="Flags if minority-to-majority selection ratio < 0.8 (US EEOC)"),
            "Equalized Odds": MetricResult(value=round(eod_val, 4), passed=eod_val <= 0.1, description="Flags if true positive rate difference > 0.1"),
            "Individual Fairness": MetricResult(value=round(ind_fairness_val, 4), passed=ind_fairness_val >= 0.8, description="Similarity-based comparison; pass if highly similar pairs have similar scores.")
        }
        bias_penalty = 0.0
        if dpd_val > 0.1: bias_penalty += (dpd_val * 100)
        if eod_val > 0.1: bias_penalty += (eod_val * 100)
        if dpr_val < 0.8: bias_penalty += ((1.0 - dpr_val) * 100)
        if ind_fairness_val < 0.8: bias_penalty += ((1.0 - ind_fairness_val) * 100)
        overall_score = min(100.0, max(0.0, bias_penalty))
        if overall_score > 40:
            rec = (f"Severe Bias Detected across {most_biased_feat}! "
                   f"Your ATS model penalizes certain groups disproportionately. "
                   f"Re-train without proxy variables, or implement fair-scoring thresholds.")
        elif overall_score > 15:
            rec = "Moderate Bias. Review candidate features and equalize criteria across groups."
        else:
            rec = "System is behaving fairly based on known metrics. Continually monitor."
        return AdvancedBiasResponse(
            overall_bias_score=round(float(overall_score), 2),
            metric_results=metric_results,
            most_biased_feature=most_biased_feat,
            flagged_candidates=flagged[:10],
            recommendation=rec
        )
    except Exception as exc:
        raise
