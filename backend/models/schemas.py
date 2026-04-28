from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


class FileType(str, Enum):
    PDF = "pdf"
    DOCX = "docx"


class ProtectedAttribute(str, Enum):
    GENDER = "gender"
    RACE = "race"
    AGE = "age"
    DISABILITY = "disability"


class ParsedSection(BaseModel):
    heading: str = Field(...)
    content: str = Field(...)


class ResumeData(BaseModel):
    candidate_id: str = Field(...)
    file_name: str
    file_type: FileType
    full_text: str = Field(...)
    sections: List[ParsedSection] = Field(default_factory=list)
    skills: List[str] = Field(default_factory=list)
    experience_years: Optional[float] = None
    education: Optional[str] = None
    parsed_at: datetime = Field(default_factory=datetime.utcnow)


class ParseRequest(BaseModel):
    candidate_id: Optional[str] = None


class AdvancedParseResponse(BaseModel):
    raw_text: str = Field(...)
    name: Optional[str] = Field(None)
    email: Optional[str] = Field(None)
    phone: Optional[str] = Field(None)
    location: Optional[str] = Field(None)
    companies: List[str] = Field(default_factory=list)
    universities: List[str] = Field(default_factory=list)
    skills: List[str] = Field(default_factory=list)
    years_experience: Optional[float] = Field(None)
    dates: List[str] = Field(default_factory=list)
    extraction_method: str = Field(default="pdfminer")

class ParseResponse(BaseModel):
    success: bool
    data: Optional[AdvancedParseResponse] = None
    error: Optional[str] = None


class AdvancedAnonymizeRequest(BaseModel):
    candidate_id: str = Field(default_factory=lambda: "UNKNOWN")
    parsed_data: AdvancedParseResponse
    keep_prestige_signals: bool = Field(False)


class BiasSignal(BaseModel):
    field: str = Field(...)
    reason: str = Field(...)


class AdvancedAnonymizeResponse(BaseModel):
    anonymized_resume: Dict[str, Any] = Field(...)
    removed_fields: List[str] = Field(default_factory=list)
    bias_signals_found: List[BiasSignal] = Field(default_factory=list)
    confidence_score: float = Field(...)


class AnonymizeRequest(BaseModel):
    candidate_id: str
    text: str


class AnonymizeResponse(BaseModel):
    success: bool
    data: Optional[AdvancedAnonymizeResponse] = None
    error: Optional[str] = None


class FairnessMetric(BaseModel):
    name: str = Field(...)
    value: float
    threshold: float
    passed: bool

class GroupMetric(BaseModel):
    group: str
    selection_rate: float
    count: int

class BiasReport(BaseModel):
    report_id: str
    protected_attribute: ProtectedAttribute
    overall_selection_rate: float
    group_metrics: List[GroupMetric] = Field(default_factory=list)
    fairness_metrics: List[FairnessMetric] = Field(default_factory=list)
    is_fair: bool
    generated_at: datetime = Field(default_factory=datetime.utcnow)

class BiasRequest(BaseModel):
    protected_attribute: ProtectedAttribute
    labels: List[int]
    protected_features: List[str]
    scores: Optional[List[float]] = None

class BiasResponse(BaseModel):
    success: bool
    data: Optional[BiasReport] = None
    error: Optional[str] = None


class BiasCandidate(BaseModel):
    candidate_id: str
    skills: List[str] = Field(default_factory=list)
    years_exp: float = 0.0
    score: float = Field(0.0)
    is_hired: Optional[int] = Field(None)
    gender: Optional[str] = None
    ethnicity: Optional[str] = None
    age_group: Optional[str] = None

class AdvancedBiasRequest(BaseModel):
    candidates: List[BiasCandidate] = Field(default_factory=list)

class MetricResult(BaseModel):
    value: float
    passed: bool
    description: str

class AdvancedBiasResponse(BaseModel):
    overall_bias_score: float = Field(...)
    metric_results: Dict[str, MetricResult]
    most_biased_feature: Optional[str]
    flagged_candidates: List[str]
    recommendation: str


class FeatureImportance(BaseModel):
    feature: str
    importance: float

class AdvancedExplainRequest(BaseModel):
    candidate_id: str
    features: Dict[str, float] = Field(...)

class AdvancedExplainResponse(BaseModel):
    candidate_id: str
    shap_values: Dict[str, float]
    top_positive_factors: List[FeatureImportance]
    top_negative_factors: List[FeatureImportance]
    plain_english_summary: str
    bias_flag: bool
    bias_context: Optional[str] = None

class GlobalExplainResponse(BaseModel):
    global_feature_importance: List[FeatureImportance]

class ExplainResult(BaseModel):
    report_id: str
    method: str = Field("shap")
    base_value: float
    feature_importances: List[FeatureImportance] = Field(default_factory=list)
    summary: Optional[str] = None
    generated_at: datetime = Field(default_factory=datetime.utcnow)

class ExplainRequest(BaseModel):
    features: Dict[str, List[Any]]
    labels: List[int]
    candidate_index: int = 0

class ExplainResponse(BaseModel):
    success: bool
    data: Optional[ExplainResult] = None
    error: Optional[str] = None


class HealthResponse(BaseModel):
    status: str = "healthy"
    version: str = "0.1.0"
