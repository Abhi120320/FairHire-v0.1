import React, { useState } from 'react';
import { Search, User, Scale, Send, CheckCircle, AlertTriangle, ChevronRight } from 'lucide-react';

const MOCK_CANDIDATES = {
  'CAND_1001': {
    score: 58,
    decision: 'Rejected',
    reasons: [
      { factor: 'Skills Match', impact: '-0.41', description: 'Only 4 of 12 required skills were detected in your resume.' },
      { factor: 'Problem Solving', impact: '-0.28', description: 'No competitive programming or algorithmic project experience found.' },
      { factor: 'Projects & Experience', impact: '-0.19', description: 'Fewer deployed projects compared to shortlisted candidates.' },
    ],
    biasFlag: true,
  },
  'CAND_1005': {
    score: 73,
    decision: 'Shortlisted',
    reasons: [
      { factor: 'Skills Match', impact: '+0.38', description: '9 of 12 required skills matched in your resume.' },
      { factor: 'Communication', impact: '+0.21', description: 'Strong documentation and writing signals detected.' },
      { factor: 'Teamwork', impact: '+0.14', description: 'Multiple team-based and leadership roles identified.' },
    ],
    biasFlag: false,
  },
  'CAND_1012': {
    score: 44,
    decision: 'Rejected',
    reasons: [
      { factor: 'Skills Match', impact: '-0.52', description: 'Only 2 of 12 required skills matched.' },
      { factor: 'Problem Solving', impact: '-0.33', description: 'No evidence of algorithmic thinking or debugging experience.' },
      { factor: 'Projects & Experience', impact: '-0.25', description: 'No deployed or substantial portfolio projects detected.' },
    ],
    biasFlag: false,
  },
};

export default function CandidatePortal() {
  const [appId, setAppId] = useState('');
  const [result, setResult] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [reviewSent, setReviewSent] = useState(false);
  const [reviewing, setReviewing] = useState(false);

  const handleSearch = () => {
    const cand = MOCK_CANDIDATES[appId.trim().toUpperCase()];
    if (cand) { setResult({ id: appId.trim().toUpperCase(), ...cand }); setNotFound(false); }
    else { setResult(null); setNotFound(true); }
    setReviewSent(false);
  };

  const handleReview = () => {
    setReviewing(true);
    setTimeout(() => { setReviewing(false); setReviewSent(true); }, 1500);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-fade-in pb-12">
      <div className="animate-slide-up">
        <div className="flex items-center gap-3 mb-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded border border-blue-400/20 bg-blue-400/[0.05]">
            <Scale size={12} className="text-blue-400" />
            <span className="text-[9px] font-cyber font-bold text-blue-400 tracking-[0.15em]">EU AI ACT · ARTICLE 22 · CANDIDATE RIGHTS</span>
          </div>
        </div>
        <h1 className="text-3xl md:text-4xl font-cyber font-black tracking-wider">
          <span className="cyber-gradient">CANDIDATE PORTAL</span>
        </h1>
        <p className="text-white/20 mt-2 text-[10px] font-mono">YOUR_APPLICATION :: AI_DECISION_EXPLANATION</p>
      </div>

      <div className="cyber-panel p-6 border border-blue-400/10 animate-slide-up delay-100">
        <div className="flex items-start gap-3">
          <Scale size={18} className="text-blue-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-cyber font-bold text-blue-300/70 tracking-wider mb-1">YOUR RIGHTS UNDER EU AI ACT · ART. 22</p>
            <p className="text-xs font-body text-white/30 leading-relaxed">
              You have the right to request human review of any automated hiring decision made by an AI system. You also have the right to receive a clear explanation of the factors that influenced your score.
            </p>
          </div>
        </div>
      </div>

      <div className="cyber-panel p-6 animate-slide-up delay-200">
        <p className="text-[10px] font-cyber text-white/30 tracking-widest mb-4">ENTER APPLICATION ID</p>
        <div className="flex gap-3">
          <div className="flex-grow relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 text-white/15 w-4 h-4" />
            <input
              type="text"
              className="input-cyber pl-10 w-full"
              placeholder="e.g. CAND_1001"
              value={appId}
              onChange={e => setAppId(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
            />
          </div>
          <button onClick={handleSearch} className="btn-cyber flex items-center gap-2 text-[10px]">
            <Search size={14} /> LOOKUP
          </button>
        </div>
        {notFound && <p className="text-xs font-mono text-cyber-pink/60 mt-3">⚠ Application ID not found. Try CAND_1001, CAND_1005, or CAND_1012.</p>}
      </div>

      {result && (
        <div className="space-y-5 animate-slide-up">
          <div className="grid grid-cols-2 gap-4">
            <div className="stat-card">
              <p className="text-[9px] font-cyber font-bold text-white/20 tracking-[0.2em] mb-2">YOUR SCORE</p>
              <h2 className={`text-5xl font-cyber font-black ${result.score >= 60 ? 'neon-text' : 'neon-text-pink'}`}>{result.score}</h2>
              <p className="text-[10px] font-mono text-white/15 mt-1">/ 100 anonymized</p>
            </div>
            <div className="stat-card">
              <p className="text-[9px] font-cyber font-bold text-white/20 tracking-[0.2em] mb-2">OUTCOME</p>
              <h2 className={`text-2xl font-cyber font-bold mt-2 ${result.decision === 'Shortlisted' ? 'neon-text' : 'neon-text-pink'}`}>{result.decision.toUpperCase()}</h2>
              {result.biasFlag && (
                <div className="flex items-center gap-1.5 mt-3">
                  <AlertTriangle size={11} className="text-amber-400" />
                  <span className="text-[9px] font-mono text-amber-400/70">Bias flag raised — human review recommended</span>
                </div>
              )}
            </div>
          </div>

          <div className="cyber-panel p-5">
            <p className="text-[10px] font-cyber font-bold text-white/30 tracking-[0.2em] mb-4">TOP FACTORS AFFECTING YOUR SCORE</p>
            <div className="space-y-4">
              {result.reasons.map((r, i) => {
                const isPos = r.impact.startsWith('+');
                return (
                  <div key={i} className="flex items-start gap-4 p-4 rounded-lg border border-white/[0.04] bg-white/[0.02]">
                    <div className={`px-2.5 py-1.5 rounded text-sm font-mono font-bold shrink-0 ${isPos ? 'bg-emerald-400/10 text-emerald-400' : 'bg-red-400/10 text-red-400'}`}>
                      {r.impact}
                    </div>
                    <div>
                      <p className="text-xs font-cyber font-bold text-white/60 tracking-wider mb-1">{r.factor.toUpperCase()}</p>
                      <p className="text-xs font-body text-white/30 leading-relaxed">{r.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="cyber-panel p-5">
            {reviewSent ? (
              <div className="flex items-center gap-3">
                <CheckCircle size={20} className="text-emerald-400" />
                <div>
                  <p className="text-sm font-cyber font-bold text-emerald-400 tracking-wider">REVIEW REQUEST SUBMITTED</p>
                  <p className="text-xs font-body text-white/30 mt-1">A human reviewer will assess your application within 5 business days.</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-cyber font-bold text-white/50 tracking-wider mb-1">REQUEST HUMAN REVIEW</p>
                  <p className="text-xs font-body text-white/25">A qualified HR professional will manually reassess your application.</p>
                </div>
                <button onClick={handleReview} disabled={reviewing} className="btn-cyber flex items-center gap-2 text-[10px] shrink-0">
                  {reviewing ? 'SUBMITTING...' : <><Send size={12} /> REQUEST REVIEW</>}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
