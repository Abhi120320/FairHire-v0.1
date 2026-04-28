import React, { useState, useRef, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Shield, LayoutDashboard, Users, FileText, BarChart3,
  Bell, ChevronDown, Play, AlertTriangle, CheckCircle, TrendingDown, X, Activity
} from 'lucide-react';

import BiasGauge from '../components/BiasGauge';
import BiasTrendChart from '../components/BiasTrendChart';
import JDDiffViewer from '../components/JDDiffViewer';
import DemographicHeatmap from '../components/DemographicHeatmap';
import HiringFunnel from '../components/HiringFunnel';
import CandidateTable from '../components/CandidateTable';
import AnalysisOverlay from '../components/AnalysisOverlay';

const NOTIFICATIONS = [
  { id: 1, title: 'Bias drift detected', msg: 'Overall score rose above threshold.', time: 'Just now', type: 'danger', unread: true },
  { id: 2, title: 'Ready to audit', msg: 'Upload resumes and a JD to run the pipeline.', time: '', type: 'info', unread: false },
];

function EmptyState({ message = 'Run an audit to populate this section.' }) {
  return (
    <div className="flex flex-col items-center justify-center h-48 text-center">
      <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center mb-3">
        <Activity size={22} className="text-slate-300" />
      </div>
      <p className="text-sm font-semibold text-slate-400">No data yet</p>
      <p className="text-xs text-slate-300 mt-1 max-w-xs">{message}</p>
    </div>
  );
}

function getGrade(score) {
  if (score <= 20) return { label: 'A', color: '#16A34A' };
  if (score <= 40) return { label: 'B', color: '#0F9B7A' };
  if (score <= 60) return { label: 'C', color: '#D97706' };
  if (score <= 80) return { label: 'D', color: '#EA580C' };
  return { label: 'F', color: '#DC2626' };
}

function getScoreColor(score) {
  if (score <= 30) return '#16A34A';
  if (score <= 60) return '#D97706';
  return '#DC2626';
}

export default function Dashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const [showOverlay, setShowOverlay] = useState(false);
  const [showNotifs, setShowNotifs] = useState(false);
  const bellRef = useRef(null);
  const unreadCount = NOTIFICATIONS.filter(n => n.unread).length;

  const locationAuditData = location.state?.auditData || null;
  const [auditData, setAuditData] = useState(() => {
    if (locationAuditData) return locationAuditData;
    try {
      const stored = localStorage.getItem('fairhire_audit');
      return stored ? JSON.parse(stored) : null;
    } catch { return null; }
  });
  const auditTs = (() => { try { return localStorage.getItem('fairhire_audit_ts'); } catch { return null; } })();

  const clearAuditData = () => {
    localStorage.removeItem('fairhire_audit');
    localStorage.removeItem('fairhire_candidates');
    localStorage.removeItem('fairhire_audit_ts');
    setAuditData(null);
  };
  const biasAudit = auditData?.bias_audit || null;
  const candidates = auditData?.candidates || [];
  const summary = auditData?.pipeline_summary || null;

  const biasScore = biasAudit?.overall_bias_score ?? null;
  const grade = biasScore !== null ? getGrade(biasScore) : null;
  const flagCount = biasAudit ? (biasAudit.flagged_candidates || []).length : null;
  const isCompliant = biasScore !== null ? biasScore <= 60 : null;

  useEffect(() => {
    const handler = (e) => { if (bellRef.current && !bellRef.current.contains(e.target)) setShowNotifs(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const metricCards = [
    {
      label: 'Overall Bias Score',
      value: biasScore !== null ? biasScore.toFixed(0) : '—',
      suffix: biasScore !== null ? '/ 100' : '',
      color: biasScore !== null ? getScoreColor(biasScore) : '#94A3B8',
      bg: '#F8FAFC',
      icon: TrendingDown,
      sub: biasScore !== null ? (biasScore <= 30 ? 'Low Risk' : biasScore <= 60 ? 'Moderate Risk' : 'High Risk') : 'No audit run yet',
    },
    {
      label: 'Candidates Analyzed',
      value: summary ? summary.total_processed : '—',
      color: '#0F2B4C',
      bg: '#F8FAFC',
      icon: Users,
      sub: summary ? 'This hiring cycle' : 'No audit run yet',
    },
    {
      label: 'Bias Flags Found',
      value: flagCount !== null ? flagCount : '—',
      color: flagCount > 0 ? '#D97706' : '#94A3B8',
      bg: '#F8FAFC',
      icon: AlertTriangle,
      sub: flagCount !== null ? `${candidates.length > 0 ? ((flagCount / candidates.length) * 100).toFixed(1) : 0}% flag rate` : 'No audit run yet',
    },
    {
      label: 'Compliance Status',
      value: isCompliant !== null ? (isCompliant ? 'Compliant' : 'Review Needed') : '—',
      color: isCompliant === true ? '#16A34A' : isCompliant === false ? '#DC2626' : '#94A3B8',
      bg: '#F8FAFC',
      icon: CheckCircle,
      sub: 'NYC Local Law 144',
      isCompliance: isCompliant !== null,
    },
  ];

  return (
    <div className="min-h-screen" style={{ background: '#F8F9FA', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <AnimatePresence>
        {showOverlay && (
          <AnalysisOverlay onComplete={() => {
            setShowOverlay(false);
            navigate('/upload');
          }} />
        )}
      </AnimatePresence>

      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-screen-xl mx-auto px-6 h-16 flex items-center gap-6">
          <div className="flex items-center gap-3 shrink-0">
            <img src="/logo.png" alt="FairHire Logo" className="w-9 h-9 object-contain mix-blend-multiply" />
            <div>
              <span className="text-base font-black text-slate-900">FairHire</span>
              <span className="text-[10px] text-slate-400 block -mt-0.5 tracking-wide">AI Bias Audit Platform</span>
            </div>
          </div>

          <nav className="flex items-center gap-1 flex-grow">
            {[
              { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
              { icon: FileText, label: 'JD Analyzer', path: '/jd-analyzer' },
              { icon: Users, label: 'Candidates', path: '/candidates' },
              { icon: BarChart3, label: 'Reports', path: '/reports' },
            ].map(({ icon: Icon, label, path }) => {
              const isActive = location.pathname === path;
              return (
                <button key={label} onClick={() => navigate(path)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all hover:bg-slate-100"
                  style={isActive ? { background: '#EFF6FF', color: '#0F2B4C', fontWeight: 700 } : { color: '#64748B' }}>
                  <Icon size={15} />{label}
                </button>
              );
            })}
          </nav>

          <div className="flex items-center gap-3 shrink-0">
            <button onClick={() => navigate('/upload')}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold text-white transition-all hover:opacity-90 active:scale-95"
              style={{ background: '#0F9B7A' }}>
              <Play size={14} /> Run Audit
            </button>

            <div className="relative" ref={bellRef}>
              <button onClick={() => setShowNotifs(p => !p)} className="relative p-2 rounded-lg hover:bg-slate-100 transition-colors">
                <Bell size={18} className="text-slate-500" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">{unreadCount}</span>
                )}
              </button>
              {showNotifs && (
                <motion.div initial={{ opacity: 0, y: 8, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }}
                  className="absolute right-0 top-full mt-2 w-80 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                    <span className="text-sm font-bold text-slate-800">Notifications</span>
                    <button onClick={() => setShowNotifs(false)}><X size={14} className="text-slate-400" /></button>
                  </div>
                  <div className="divide-y divide-slate-50 max-h-72 overflow-y-auto">
                    {NOTIFICATIONS.map(n => (
                      <div key={n.id} className={`flex gap-3 px-4 py-3 hover:bg-slate-50 transition-colors cursor-pointer ${n.unread ? 'bg-blue-50/40' : ''}`}>
                        <div className="w-2 h-2 rounded-full mt-2 shrink-0" style={{
                          background: n.type === 'danger' ? '#DC2626' : n.type === 'success' ? '#16A34A' : n.type === 'warning' ? '#D97706' : '#6366F1'
                        }} />
                        <div>
                          <p className="text-xs font-bold text-slate-800">{n.title}</p>
                          <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{n.msg}</p>
                          {n.time && <p className="text-[10px] text-slate-400 mt-1">{n.time}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </div>

            <div className="flex items-center gap-2 pl-3 border-l border-slate-200">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ background: '#0F2B4C' }}>
                AH
              </div>
              <ChevronDown size={14} className="text-slate-400" />
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-screen-xl mx-auto px-6 py-6 space-y-6">

        {!auditData ? (
          <div className="bg-indigo-50 border border-indigo-100 rounded-2xl px-6 py-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0">
                <Activity size={16} className="text-indigo-600" />
              </div>
              <p className="text-sm font-medium text-indigo-800">No audit data yet — upload resumes and a job description to run your first bias audit.</p>
            </div>
            <button onClick={() => navigate('/upload')}
              className="shrink-0 px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 transition-colors">
              Run First Audit →
            </button>
          </div>
        ) : (
          <div className="bg-emerald-50 border border-emerald-100 rounded-2xl px-6 py-3 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
                <CheckCircle size={14} className="text-emerald-600" />
              </div>
              <div>
                <p className="text-xs font-semibold text-emerald-800">
                  Audit data loaded — {summary?.total_processed} candidates · {summary?.ai_scorer === 'gemini' ? 'Gemini AI' : summary?.ai_scorer === 'huggingface' ? 'HuggingFace AI' : 'Rule-based'} scoring
                </p>
                {auditTs && <p className="text-[11px] text-emerald-600 mt-0.5">Last audited: {new Date(auditTs).toLocaleString()}</p>}
              </div>
            </div>
            <button onClick={clearAuditData}
              className="shrink-0 px-3 py-1.5 border border-emerald-200 bg-white text-emerald-700 text-xs font-semibold rounded-lg hover:bg-emerald-50 transition-colors">
              Clear & Reset
            </button>
          </div>
        )}

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {metricCards.map(card => {
            const Icon = card.icon;
            return (
              <div key={card.label} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col gap-3 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{card.label}</p>
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-slate-50">
                    <Icon size={16} style={{ color: card.color }} />
                  </div>
                </div>
                <div>
                  {card.isCompliance ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold border"
                      style={{ color: card.color, borderColor: card.color + '40', background: card.color + '10' }}>
                      <CheckCircle size={14} /> {card.value}
                    </span>
                  ) : (
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-3xl font-black" style={{ color: card.color }}>{card.value}</span>
                      {card.suffix && <span className="text-sm text-slate-400 font-medium">{card.suffix}</span>}
                    </div>
                  )}
                  <p className="text-xs text-slate-400 mt-1 font-medium">{card.sub}</p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
          <div className="lg:col-span-2">
            <BiasGauge score={biasScore} />
          </div>
          <div className="lg:col-span-3">
            <BiasTrendChart />
          </div>
        </div>

        <JDDiffViewer />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <DemographicHeatmap candidates={candidates} />
          <HiringFunnel candidates={candidates} />
        </div>

        <CandidateTable candidates={candidates} />

        <div className="py-4 border-t border-slate-200 flex justify-between items-center">
          <span className="text-xs text-slate-400 font-medium">FairHire © 2026 — AI-Powered Bias Detection</span>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span className="text-xs text-slate-400 font-medium">NYC LL144 · EEOC Guidelines</span>
          </div>
        </div>
      </div>
    </div>
  );
}
