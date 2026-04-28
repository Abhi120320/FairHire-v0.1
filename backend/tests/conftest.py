import pytest
from fastapi.testclient import TestClient
from main import app
import os

@pytest.fixture
def client():
    """Fixture to provide a TestClient instance."""
    return TestClient(app)

@pytest.fixture
def sample_pdf_content():
    """Generates a simple valid PDF in memory using ReportLab (if available) or raw bytes."""
    try:
        from reportlab.pdfgen import canvas
        import io
        
        buffer = io.BytesIO()
        c = canvas.Canvas(buffer)
        c.drawString(100, 750, "Jane Doe")
        c.drawString(100, 730, "Software Engineer at TechCorp Inc.")
        c.drawString(100, 710, "Email: jane.doe@example.com | Phone: 123-456-7890")
        c.drawString(100, 690, "Graduated from State University in 2020.")
        c.drawString(100, 670, "I have 5 years of experience in software development.")
        c.drawString(100, 650, "Skills: Python, Java, React, SQL.")
        c.drawString(100, 630, "Location: San Francisco, CA")
        c.save()
        return buffer.getvalue()
    except ImportError:
        pytest.skip("reportlab not installed, skipping PDF generation")
