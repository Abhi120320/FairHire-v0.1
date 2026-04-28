from __future__ import annotations

import random
from typing import Any, Dict

import numpy as np
import pandas as pd
from fastapi import APIRouter, HTTPException

from models.schemas import (
    AdvancedExplainRequest,
    AdvancedExplainResponse,
    FeatureImportance,
    GlobalExplainResponse,
)

router = APIRouter(prefix="/api/explain", tags=["Explainability"])

_model = None
_explainer = None
_synthetic_df = None


def _initialize_model_and_explainer():
    global _model, _explainer, _synthetic_df
    if _model is not None and _explainer is not None:
        return
    from sklearn.ensemble import RandomForestClassifier
    import shap
    np.random.seed(42)
    random.seed(42)
    n_samples = 500
    df = pd.DataFrame({
        "skills_match_score": np.random.uniform(0, 10, n_samples),
        "years_exp": np.random.uniform(0, 15, n_samples),
        "edu_level": np.random.choice([1, 2, 3, 4], n_samples),
        "past_companies_count": np.random.poisson(2, n_samples),
        "location_proxy": np.random.uniform(0, 1, n_samples),
        "grad_year_proxy": np.random.uniform(0, 1, n_samples)
    })
    y = []
    for _, row in df.iterrows():
        score = (row["skills_match_score"] * 3) + (row["years_exp"] * 2) + row["edu_level"]
        if row["location_proxy"] > 0.7:
            score -= 10
        y.append(1 if score > 30 else 0)
    _synthetic_df = df
    _model = RandomForestClassifier(n_estimators=50, max_depth=5, random_state=42)
    _model.fit(df, y)
    _explainer = shap.TreeExplainer(_model)


@router.on_event("startup")
async def startup_event():
    try:
        _initialize_model_and_explainer()
    except Exception as e:
        print(f"Warning: Failed to init SHAP explainer on startup: {e}")


@router.post("/", response_model=AdvancedExplainResponse)
async def explain_candidate(payload: AdvancedExplainRequest):
    _initialize_model_and_explainer()
    if not _explainer or not _model:
        raise HTTPException(status_code=500, detail="Explainer not initialized.")
    try:
        features_dict = payload.features
        for col in _synthetic_df.columns:
            if col not in features_dict:
                features_dict[col] = _synthetic_df[col].median()
        ordered_features = {col: features_dict[col] for col in _synthetic_df.columns}
        df_instance = pd.DataFrame([ordered_features])
        shap_values = _explainer.shap_values(df_instance)
        if isinstance(shap_values, list):
            sv = shap_values[1][0]
        else:
            sv = shap_values[0]
        feature_impacts = {}
        top_pos = []
        top_neg = []
        for idx, col in enumerate(df_instance.columns):
            impact = float(sv[idx])
            feature_impacts[col] = impact
            fi = FeatureImportance(feature=col, importance=round(impact, 4))
            if impact > 0:
                top_pos.append(fi)
            else:
                top_neg.append(fi)
        top_pos.sort(key=lambda x: x.importance, reverse=True)
        top_neg.sort(key=lambda x: x.importance)
        top_pos = top_pos[:3]
        top_neg = top_neg[:3]
        bias_flag = False
        PROTECTED_PROXIES = {"location_proxy", "grad_year_proxy", "zip_code", "hs_graduation_year"}
        bias_reasons = []
        for fi in [*top_pos, *top_neg]:
            if fi.feature in PROTECTED_PROXIES and abs(fi.importance) > 0.1:
                bias_flag = True
                bias_reasons.append(f"{fi.feature.replace('_', ' ')} (impact: {round(fi.importance, 2)})")
        summary = "Your application was evaluated. "
        if top_pos:
            best = top_pos[0]
            summary += f"Your {best.feature.replace('_', ' ')} strongly helped your score (+{round(best.importance, 2)}). "
        if top_neg:
            worst = top_neg[0]
            summary += f"However, your {worst.feature.replace('_', ' ')} penalized you ({round(worst.importance, 2)})."
            
        bias_context = None
        if bias_flag:
            bias_context = f"Decision may be biased due to heavy reliance on protected attributes or proxies: {', '.join(bias_reasons)}."
            summary += f" Warning: {bias_context}"

        return AdvancedExplainResponse(
            candidate_id=payload.candidate_id,
            shap_values={k: round(v, 4) for k, v in feature_impacts.items()},
            top_positive_factors=top_pos,
            top_negative_factors=top_neg,
            plain_english_summary=summary.strip(),
            bias_flag=bias_flag,
            bias_context=bias_context
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/global", response_model=GlobalExplainResponse)
async def explain_global():
    _initialize_model_and_explainer()
    if not _explainer or not _synthetic_df is not None:
        raise HTTPException(status_code=500, detail="Explainer not initialized.")
    try:
        shap_values = _explainer.shap_values(_synthetic_df)
        if isinstance(shap_values, list):
            sv = shap_values[1]
        else:
            sv = shap_values
        mean_abs_shap = np.abs(sv).mean(axis=0)
        global_importance = []
        for idx, col in enumerate(_synthetic_df.columns):
            global_importance.append(
                FeatureImportance(feature=col, importance=round(float(mean_abs_shap[idx]), 4))
            )
        global_importance.sort(key=lambda x: x.importance, reverse=True)
        return GlobalExplainResponse(global_feature_importance=global_importance)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))
