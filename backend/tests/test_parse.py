import pytest

def test_parse_pdf_success(client, sample_pdf_content):
    """
    Test the /api/parse endpoint with a sample PDF.
    Verifies that spaCy NER and Regex logic extract the correct entities.
    """
    files = {
        "file": ("resume.pdf", sample_pdf_content, "application/pdf")
    }
    
    response = client.post("/api/parse/", files=files)
    
    assert response.status_code == 200
    json_data = response.json()
    
    assert json_data["success"] is True
    data = json_data["data"]
    
    # Assert extracted entities
    assert data["name"] == "Jane Doe"
    assert data["email"] == "jane.doe@example.com"
    assert data["phone"] == "123-456-7890"
    
    # Spacy NER tests
    assert "San Francisco" in data["location"]
    
    # Check that companies/universities were correctly partitioned
    assert any("TechCorp" in c for c in data["companies"])
    assert any("State University" in u for u in data["universities"])
    
    # Regex & Skills tests
    assert data["years_experience"] == 5.0
    
    # Ensure some expected skills are found
    extracted_skills = [s.lower() for s in data["skills"]]
    for expected_skill in ["python", "java", "react", "sql"]:
        assert expected_skill in extracted_skills
    
    # Check dates mapped
    assert any("2020" in d for d in data["dates"])

def test_parse_invalid_file_type(client):
    """Test uploading an unsupported file type."""
    files = {
        "file": ("image.png", b"fake png data", "image/png")
    }
    response = client.post("/api/parse/", files=files)
    
    assert response.status_code == 415
    assert "Unsupported file type" in response.json()["detail"]
