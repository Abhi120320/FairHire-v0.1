from __future__ import annotations

import io
import re
from typing import Optional

from fastapi import APIRouter, File, HTTPException, UploadFile, status

from models.schemas import AdvancedParseResponse, ParseResponse

router = APIRouter(prefix="/api/parse", tags=["Resume Parsing"])

PREDEFINED_SKILLS = {
    "python", "java", "javascript", "typescript", "react", "angular", "vue",
    "node.js", "sql", "aws", "docker", "kubernetes", "git", "machine learning",
    "deep learning", "nlp", "tensorflow", "pytorch", "pandas", "scikit-learn",
    "agile", "c++", "c#", "go", "ruby", "swift", "fastapi"
}

EMAIL_PATTERN = re.compile(r"[\w\.-]+@[\w\.-]+\.\w+")
PHONE_PATTERN = re.compile(r"\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}")
EXP_PATTERN = re.compile(r"(\d+)(?:\s*|-)(?:years?|yrs?)(?:\s+of)?\s+experience", re.IGNORECASE)

OCR_TEXT_THRESHOLD = 50

_nlp_model = None

def _get_nlp():
    global _nlp_model
    if _nlp_model is not None:
        return _nlp_model
    import spacy
    try:
        _nlp_model = spacy.load("en_core_web_sm")
    except OSError:
        _nlp_model = spacy.blank("en")
    return _nlp_model

def _extract_text_pdf_pdfminer(content: bytes) -> str:
    from pdfminer.high_level import extract_text
    return extract_text(io.BytesIO(content))

def _extract_text_pdf_tesseract(content: bytes) -> str:
    from pdf2image import convert_from_bytes
    import pytesseract
    pages = convert_from_bytes(content, dpi=300)
    return "\n".join(pytesseract.image_to_string(page) for page in pages)

def _extract_text_image_tesseract(content: bytes) -> str:
    import pytesseract
    from PIL import Image
    image = Image.open(io.BytesIO(content))
    return pytesseract.image_to_string(image)

def _extract_text_docx(content: bytes) -> str:
    from docx import Document
    doc = Document(io.BytesIO(content))
    return "\n".join(para.text for para in doc.paragraphs if para.text.strip())

def _extract_information(text: str, extraction_method: str) -> AdvancedParseResponse:
    nlp = _get_nlp()
    doc = nlp(text)
    name = None
    location = None
    companies = []
    universities = []
    dates = []
    for ent in doc.ents:
        if ent.label_ == "PERSON" and not name:
            name = ent.text.strip()
        elif ent.label_ == "GPE":
            if not location:
                location = ent.text.strip()
        elif ent.label_ == "DATE":
            dates.append(ent.text.strip())
        elif ent.label_ == "ORG":
            org_text = ent.text.strip()
            lower_org = org_text.lower()
            if any(kw in lower_org for kw in ["university", "college", "institute", "tech", "academy"]):
                if org_text not in universities:
                    universities.append(org_text)
            else:
                if org_text not in companies:
                    companies.append(org_text)

    if not name:
        lines = [line.strip() for line in text.splitlines() if line.strip()]
        if lines:
            first_line = lines[0]
            if re.match(r"^[A-Z][a-z]+\s+[A-Z][a-z]+$", first_line):
                name = first_line

    if not location:
        loc_match = re.search(r"location\s*:\s*([^\n]+)", text, re.IGNORECASE)
        if loc_match:
            location = loc_match.group(1).strip()

    if not companies:
        company_match = re.search(r"\bat\s+([A-Z][A-Za-z0-9&.,\- ]+)", text)
        if company_match:
            company_name = company_match.group(1).strip().rstrip(".")
            if company_name and company_name not in companies:
                companies.append(company_name)

    if not universities:
        for uni_match in re.finditer(r"([A-Z][A-Za-z&.,\- ]*University[A-Za-z&.,\- ]*)", text):
            uni_name = uni_match.group(1).strip().rstrip(".")
            if uni_name and uni_name not in universities:
                universities.append(uni_name)

    if not dates:
        dates = [match.group(0) for match in re.finditer(r"\b(?:19|20)\d{2}\b", text)]
    email_match = EMAIL_PATTERN.search(text)
    email = email_match.group(0) if email_match else None
    phone_match = PHONE_PATTERN.search(text)
    phone = phone_match.group(0) if phone_match else None
    exp_match = EXP_PATTERN.search(text)
    years_experience = float(exp_match.group(1)) if exp_match else None
    text_lower = text.lower()
    skills = [skill for skill in PREDEFINED_SKILLS if re.search(rf"\b{re.escape(skill)}\b", text_lower)]
    return AdvancedParseResponse(
        raw_text=text,
        name=name,
        email=email,
        phone=phone,
        location=location,
        companies=companies,
        universities=universities,
        skills=skills,
        years_experience=years_experience,
        dates=dates,
        extraction_method=extraction_method,
    )


@router.post("/", response_model=ParseResponse)
async def parse_resume(file: UploadFile = File(...)):
    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No filename provided."
        )
    ext = file.filename.rsplit(".", 1)[-1].lower()
    if ext not in ("pdf", "docx"):
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=f"Unsupported file type: {ext}. Accepted: pdf, docx."
        )
    content = await file.read()
    raw_text = ""
    extraction_method = "pdfminer"
    try:
        if ext == "docx":
            raw_text = _extract_text_docx(content)
            extraction_method = "pdfminer"
        else:
            raw_text = _extract_text_pdf_pdfminer(content)
            if len(raw_text.strip()) < OCR_TEXT_THRESHOLD:
                raw_text = _extract_text_pdf_tesseract(content)
                extraction_method = "tesseract"
    except Exception as exc:
        return ParseResponse(success=False, error=f"Text extraction failed: {str(exc)}")
    try:
        data = _extract_information(raw_text, extraction_method)
        return ParseResponse(success=True, data=data)
    except HTTPException as he:
        raise he
    except Exception as exc:
        return ParseResponse(success=False, error=f"Information extraction failed: {str(exc)}")
