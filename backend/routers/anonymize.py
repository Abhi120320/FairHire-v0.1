from __future__ import annotations

import copy
import re
from typing import Any, Dict

from fastapi import APIRouter

from models.schemas import (
    AdvancedAnonymizeRequest,
    AdvancedAnonymizeResponse,
    AnonymizeResponse,
    BiasSignal,
)

router = APIRouter(prefix="/api/anonymize", tags=["Anonymization"])

PRESTIGE_KEYWORDS = [
    "iit", "indian institute of technology",
    "iim", "indian institute of management",
    "harvard", "yale", "princeton", "stanford",
    "mit", "massachusetts institute of technology",
    "oxford", "cambridge", "columbia", "cornell",
    "brown", "dartmouth", "upenn", "pennsylvania"
]

GENDER_PRONOUNS_MAP = {
    r"\bhe\b": "they",
    r"\bshe\b": "they",
    r"\bhis\b": "their",
    r"\bhers?\b": "their",
    r"\bhim\b": "them"
}

AGE_PATTERN = re.compile(r"\b(age(?:d)?\s*\d{1,2}|born(?:\s+in)?\s+(?:19|20)\d{2}|(?:19|20)\d{2}\s*-\s*(?:19|20)\d{2})\b", re.IGNORECASE)
GRAD_YEAR_PATTERN = re.compile(r"(B\.?A\.?|B\.?S\.?|M\.?A\.?|M\.?S\.?|Ph\.?D\.?|B\.?Tech|M\.?Tech|MBA|Bachelor[s]?|Master[s]?)[^\w\d]*(?:of\s+[a-z\s]+)?[^\w\d]*((?:19|20)\d{2})", re.IGNORECASE)

def mask_text(text: str) -> str:
    if not text:
        return text
    for pattern, replacement in GENDER_PRONOUNS_MAP.items():
        text = re.sub(pattern, replacement, text, flags=re.IGNORECASE)
    text = AGE_PATTERN.sub("[AGE REDACTED]", text)
    return text

def remove_grad_year(text: str) -> str:
    if not text:
        return text
    return GRAD_YEAR_PATTERN.sub(r"\1 [YEAR REDACTED]", text)


@router.post("/", response_model=AnonymizeResponse)
async def anonymize_resume(payload: AdvancedAnonymizeRequest):
    try:
        parsed = payload.parsed_data.dict()
        anonymized: Dict[str, Any] = copy.deepcopy(parsed)
        removed_fields = []
        bias_signals = []
        candidate_id = payload.candidate_id or "UNKNOWN"
        candidate_mask = f"CANDIDATE_{candidate_id}"

        if anonymized.get("name"):
            anonymized["name"] = candidate_mask
            removed_fields.append("name")
            bias_signals.append(BiasSignal(field="name", reason="Names can inherently trigger racial, gender, or ethnic biases."))

        if payload.parsed_data.name and payload.parsed_data.name in anonymized["raw_text"]:
            anonymized["raw_text"] = anonymized["raw_text"].replace(payload.parsed_data.name, candidate_mask)

        for field in ["email", "phone", "location"]:
            if anonymized.get(field):
                anonymized[field] = "[REDACTED]"
                removed_fields.append(field)
                bias_signals.append(BiasSignal(field=field, reason=f"{field.capitalize()} is PII and its contextual hints can imply socioeconomic status."))

        redacted_universities = []
        for uni in anonymized.get("universities", []):
            uni_lower = uni.lower()
            is_prestige = any(p in uni_lower for p in PRESTIGE_KEYWORDS)
            if is_prestige:
                bias_signals.append(BiasSignal(field="university", reason=f"Prestige signal detected ('{uni}'). Can cause elite institution bias."))
                if not payload.keep_prestige_signals:
                    redacted_universities.append("Tier-1 University")
                else:
                    redacted_universities.append(uni)
            else:
                redacted_universities.append(uni)
        anonymized["universities"] = redacted_universities

        text = anonymized.get("raw_text", "")
        if text:
            if payload.parsed_data.email:
                text = text.replace(payload.parsed_data.email, "[EMAIL REDACTED]")
            if payload.parsed_data.phone:
                text = text.replace(payload.parsed_data.phone, "[PHONE REDACTED]")
            if payload.parsed_data.location:
                text = text.replace(payload.parsed_data.location, "[LOCATION REDACTED]")
            if not payload.keep_prestige_signals:
                for uni in payload.parsed_data.universities:
                    if any(p in uni.lower() for p in PRESTIGE_KEYWORDS):
                        text = text.replace(uni, "Tier-1 University")
            text = remove_grad_year(text)
            old_text = text
            text = mask_text(text)
            if old_text != text:
                bias_signals.append(BiasSignal(field="gender/age", reason="Gendered pronouns or age references were found and neutralized in the text."))
            anonymized["raw_text"] = text

        confidence_score = 0.95
        if not payload.keep_prestige_signals:
            confidence_score = 0.99

        response_data = AdvancedAnonymizeResponse(
            anonymized_resume=anonymized,
            removed_fields=removed_fields,
            bias_signals_found=bias_signals,
            confidence_score=confidence_score
        )
        return AnonymizeResponse(success=True, data=response_data)
    except Exception as exc:
        return AnonymizeResponse(success=False, error=str(exc))
