# FairHire

FairHire is a full-stack, AI-powered hiring bias detection platform. It consists of a FastAPI Python backend and a React/Vite/Tailwind frontend, fully dockerized with a MySQL database.

## Key Features
- **Concurrent Resume Parsing:** Upload large batches of PDF/DOCX files and extract structured data simultaneously.
- **AI-Powered Evaluation:** Leverages **Google Gemini (gemini-2.5-flash)** to intelligently grade resumes against the Job Description.
- **Bias Detection:** Uses AI and `fairlearn` to evaluate models for demographic parity and fairness.
- **Anonymization:** Removes PII (names, locations, dates) to reduce unconscious elite institution bias.
- **Persistent Storage:** All candidates and analysis records are securely stored in a MySQL Database.

---

## 🚀 Quick Start (Docker) - Recommended

Make sure you have [Docker](https://www.docker.com/) and Docker Compose installed.

### 1. Configure Environment Variables
Create a `.env` file in the root of the project with your API keys. You can use the template provided in `backend/.env.example`:
```bash
GEMINI_API_KEY=your_gemini_api_key_here
```

### 2. Build and Run
Ensure ports `8000`, `80`, and `3306` are available, then run:
```bash
docker-compose up --build -d
```
*Note: On the first run, the backend will wait a few seconds for the MySQL database to initialize.*

### 3. Access the Application
- **Frontend App:** [http://localhost:80](http://localhost:80)
- **Backend API Docs (Swagger):** [http://localhost:8000/docs](http://localhost:8000/docs)
- **Database Endpoint:** [http://localhost:8000/api/candidates](http://localhost:8000/api/candidates)

---

## 🛠 Local Setup (Without Docker)

### Backend Setup
1. Navigate to the backend folder:
   ```bash
   cd backend
   ```
2. Create and activate a virtual environment:
   ```bash
   python3 -m venv venv
   source venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Setup spaCy:
   ```bash
   python -m spacy download en_core_web_sm
   ```
5. Ensure a MySQL instance is running, or fall back to SQLite by adjusting the `DATABASE_URL` in `database.py`.
6. Start the FastAPI server:
   ```bash
   uvicorn main:app --reload
   ```

### Frontend Setup
1. Navigate to the frontend folder:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the dev server:
   ```bash
   npm run dev
   ```
# FairHire-v0.1
# FairHire-v0.1
