import React, { useState, useCallback } from 'react';
import { UploadCloud, FileText, Briefcase, Loader2, CheckCircle, Zap, ArrowRight, Play } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const JOB_TEMPLATES = [
  { name: "Software Engineer", text: "Role: Software Engineer\n\nScoring Criteria:\nSystem Design & Architecture: 25%\nData Structures & Algorithms: 25%\nProgramming Languages (Java/Python/C++): 20%\nTesting & Debugging: 15%\nVersion Control & CI/CD: 15%" },
  { name: "Product Manager", text: "Role: Product Manager\n\nScoring Criteria:\nProduct Strategy & Roadmap: 30%\nUser Experience (UX) Focus: 20%\nData-Driven Decision Making: 20%\nCross-functional Leadership: 15%\nAgile/Scrum Experience: 15%" },
  { name: "Business Analyst", text: "Role: Business Analyst\n\nScoring Criteria:\nRequirements Gathering: 25%\nData Analysis & SQL: 25%\nProcess Modeling: 20%\nStakeholder Communication: 15%\nBusiness Intelligence (BI) Tools: 15%" },
  { name: "Solutions Architect", text: "Role: Solutions Architect\n\nScoring Criteria:\nSystem Design & Architecture: 30%\nCloud Platforms (AWS/Azure/GCP): 25%\nTechnical Leadership: 20%\nSecurity & Compliance: 15%\nClient-facing Communication: 10%" },
  { name: "Technical Project Manager", text: "Role: Technical Project Manager\n\nScoring Criteria:\nAgile/Scrum Methodologies: 30%\nRisk & Resource Management: 25%\nTechnical Background: 20%\nStakeholder Communication: 15%\nBudgeting & Planning: 10%" },
  { name: "DevOps Manager", text: "Role: DevOps Manager\n\nScoring Criteria:\nCI/CD Pipeline Architecture: 25%\nCloud Infrastructure & IaC: 25%\nTeam Leadership & Mentoring: 20%\nMonitoring & Incident Response: 15%\nSecurity Practices (DevSecOps): 15%" },
  { name: "UI/UX Designer", text: "Role: UI/UX Designer\n\nScoring Criteria:\nUser Research & Testing: 25%\nWireframing & Prototyping: 25%\nVisual Design & Typography: 20%\nInteraction Design: 15%\nDesign Systems (Figma): 15%" },
  { name: "Data Analyst", text: "Role: Data Analyst\n\nScoring Criteria:\nSQL & Data Extraction: 30%\nData Visualization (Tableau/PowerBI): 25%\nStatistical Analysis: 20%\nPython/R Programming: 15%\nBusiness Acumen: 10%" },
  { name: "Sales Engineer", text: "Role: Sales Engineer\n\nScoring Criteria:\nTechnical Presentations/Demos: 30%\nProduct Knowledge & Architecture: 25%\nSales Strategy & Quota Attainment: 20%\nCustomer Relationship Building: 15%\nProof of Concept (PoC) Execution: 10%" },
  { name: "Customer Success Manager", text: "Role: Customer Success Manager\n\nScoring Criteria:\nCustomer Onboarding & Retention: 30%\nAccount Management: 25%\nProduct Adoption Strategy: 20%\nChurn Reduction & Upselling: 15%\nCommunication & Empathy: 10%" },
  { name: "Technical Recruiter", text: "Role: Technical Recruiter\n\nScoring Criteria:\nSourcing & Pipeline Building: 30%\nTechnical Role Understanding: 25%\nCandidate Experience: 20%\nStakeholder/Hiring Manager Alignment: 15%\nNegotiation & Closing: 10%" }
];

export default function Upload() {
  const [dragActive, setDragActive] = useState(false);
  const [files, setFiles] = useState([]);
  const [jobDesc, setJobDesc] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processStep, setProcessStep] = useState(0);
  const navigate = useNavigate();

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      addFiles(Array.from(e.dataTransfer.files));
    }
  }, []);

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files.length > 0) {
      addFiles(Array.from(e.target.files));
    }
  };

  const addFiles = (newFiles) => {
    const valid = newFiles.filter(f => f.name.endsWith('.pdf') || f.name.endsWith('.docx'));
    setFiles(prev => [...prev, ...valid]);
  };

  const runAudit = async (demoMode = false) => {
    if (!demoMode && files.length === 0) {
      alert("Please upload at least one resume.");
      return;
    }
    setIsProcessing(true);
    setProcessStep(1);
    try {
      const formData = new FormData();
      formData.append('job_description', jobDesc);
      formData.append('demo_mode', demoMode);
      if (!demoMode) {
        files.forEach(f => formData.append('files', f));
      }
      setTimeout(() => setProcessStep(2), 1500);
      setTimeout(() => setProcessStep(3), 3000);
      const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      const API_URL = isLocal ? 'http://localhost:8000' : (import.meta.env.VITE_API_URL || 'http://localhost:8000');
      const response = await fetch(`${API_URL}/api/full-audit`, { method: 'POST', body: formData });
      const data = await response.json();
      if (data.success) {
        // Persist data to localStorage so it survives page navigation
        try {
          localStorage.setItem('fairhire_audit', JSON.stringify(data));
          localStorage.setItem('fairhire_candidates', JSON.stringify(data.candidates || []));
          localStorage.setItem('fairhire_audit_ts', new Date().toISOString());
        } catch (e) { console.warn('localStorage quota exceeded', e); }
        setTimeout(() => {
          setIsProcessing(false);
          setProcessStep(0);
          navigate('/', { state: { auditData: data } });
        }, 4500);
      } else {
        alert("Pipeline Error: " + data.error);
        setIsProcessing(false);
        setProcessStep(0);
      }
    } catch (err) {
      alert("Network Error: Could not connect to API.");
      setIsProcessing(false);
      setProcessStep(0);
    }
  };

  const STEPS = [
    { text: "Parsing resumes & extracting features", id: 1 },
    { text: "Anonymizing PII & redacting bias signals", id: 2 },
    { text: "Running Fairlearn & SHAP Explainability", id: 3 },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 sm:p-8">
      <div className="w-full max-w-5xl space-y-8 animate-fade-in bg-white p-6 sm:p-10 rounded-2xl shadow-sm border border-slate-200">
        
        {/* Header with Logo */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-6">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="FairHire Logo" className="w-12 h-12 object-contain mix-blend-multiply" />
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">FairHire</h1>
              <p className="text-xs text-slate-500 font-medium tracking-wide uppercase mt-0.5">AI Recruitment Auditor</p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 w-fit">
            <Zap className="w-3.5 h-3.5 text-indigo-600" />
            <span className="text-xs font-semibold text-indigo-700">Audit Pipeline</span>
          </div>
        </div>

        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Run Bias Audit</h2>
          <p className="text-slate-500 mt-1 text-sm leading-relaxed max-w-2xl">
            Upload candidate resumes and define evaluation criteria to run FairHire's AI-powered fairness analysis.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

        <div className="space-y-4 animate-slide-up">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-7 h-7 rounded-lg bg-indigo-100 flex items-center justify-center">
              <FileText className="text-indigo-600 w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-800">Upload Resumes</h2>
              <p className="text-xs text-slate-400">PDF or DOCX format</p>
            </div>
          </div>

          <div
            className={`cyber-panel p-10 text-center transition-all duration-300 cursor-pointer group border-2 border-dashed ${
              dragActive ? 'border-indigo-400 bg-indigo-50' : 'border-slate-200 hover:border-indigo-300 hover:bg-slate-50'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <div className="flex justify-center mb-4">
              <div className={`p-4 rounded-2xl transition-all duration-300 ${
                dragActive ? 'bg-indigo-100' : 'bg-slate-100 group-hover:bg-indigo-50'
              }`}>
                <UploadCloud size={32} className={`transition-colors ${dragActive ? 'text-indigo-600' : 'text-slate-400 group-hover:text-indigo-500'}`} />
              </div>
            </div>
            <h3 className="text-sm font-semibold text-slate-700 mb-1">Drag & drop files here</h3>
            <p className="text-slate-400 mb-6 text-xs">or click to browse your files</p>
            <input type="file" id="file-upload" className="hidden" accept=".pdf,.docx" multiple onChange={handleChange} />
            <label htmlFor="file-upload" className="btn-cyber cursor-pointer">
              <UploadCloud size={16} />
              Browse Files
            </label>
          </div>

          {files.length > 0 && (
            <div className="cyber-panel p-4 animate-slide-up">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Queued Files</span>
                <span className="tag-cyan">{files.length} files</span>
              </div>
              <div className="space-y-2 max-h-36 overflow-y-auto">
                {files.map((f, i) => (
                  <div key={i} className="flex items-center justify-between bg-slate-50 px-3 py-2 rounded-lg border border-slate-100 text-sm">
                    <span className="font-medium text-slate-700 truncate text-xs">{f.name}</span>
                    <span className="text-slate-400 text-xs font-mono ml-2">{(f.size / 1024).toFixed(1)} KB</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-4 animate-slide-up delay-200">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-7 h-7 rounded-lg bg-purple-100 flex items-center justify-center">
              <Briefcase className="text-purple-600 w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-800">Evaluation Criteria</h2>
              <p className="text-xs text-slate-400">Job description & scoring weights</p>
            </div>
          </div>
          
          {/* Quick Templates */}
          <div className="flex flex-wrap gap-1.5 mb-2">
            {JOB_TEMPLATES.map((tpl) => (
              <button
                key={tpl.name}
                onClick={() => setJobDesc(tpl.text)}
                className="text-[10px] px-2 py-1 rounded-md bg-slate-50 text-slate-600 border border-slate-200 hover:bg-purple-50 hover:text-purple-700 hover:border-purple-200 transition-colors whitespace-nowrap"
              >
                {tpl.name}
              </button>
            ))}
          </div>

          <textarea
            className="input-cyber h-36 lg:h-[220px] resize-none leading-relaxed"
            placeholder={"Paste job description with scoring priorities...\n\nExample:\nSkills Match: 35%\nProjects & Experience: 25%\nProblem Solving: 20%\nCommunication: 10%\nTeamwork: 10%"}
            value={jobDesc}
            onChange={(e) => setJobDesc(e.target.value)}
          />
        </div>
      </div>

      {isProcessing && (
        <div className="cyber-panel p-5 animate-slide-up border border-indigo-100 bg-indigo-50/40">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
            <span className="text-sm font-semibold text-indigo-700">Pipeline Running</span>
          </div>
          <div className="space-y-3">
            {STEPS.map((s) => (
              <div key={s.id} className={`flex items-center gap-3 transition-all duration-500 ${processStep >= s.id ? 'opacity-100' : 'opacity-30'}`}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{
                  background: processStep > s.id ? '#DCFCE7' : processStep === s.id ? '#EEF2FF' : '#F1F5F9',
                }}>
                  {processStep > s.id
                    ? <CheckCircle size={16} className="text-emerald-600" />
                    : processStep === s.id
                      ? <Loader2 size={16} className="animate-spin text-indigo-600" />
                      : <span className="text-slate-300 text-xs font-bold">{s.id}</span>
                  }
                </div>
                <span className={`text-sm font-medium ${processStep >= s.id ? 'text-slate-800' : 'text-slate-400'}`}>{s.text}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-end items-center gap-3 pt-2">
        <button
          disabled={isProcessing}
          onClick={() => runAudit(true)}
          className="btn-ghost-cyber flex items-center gap-2 disabled:opacity-40 w-full md:w-auto justify-center"
        >
          <Play size={15} />
          Demo Mode (20 Synthetic)
        </button>

        <button
          disabled={isProcessing || files.length === 0}
          onClick={() => runAudit(false)}
          className="btn-cyber flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed w-full md:w-auto justify-center"
        >
          {isProcessing ? (
            <><Loader2 size={15} className="animate-spin" /> Processing...</>
          ) : (
            <>Run Bias Audit <ArrowRight size={15} /></>
          )}
        </button>
      </div>
      </div>
    </div>
  );
}
