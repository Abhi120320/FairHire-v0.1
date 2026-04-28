import React, { useState } from 'react';
import { Search, AlertTriangle, CheckCircle, Eye, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { SHAPDrawer } from '../components/CandidateTable';

const STATUS_STYLE = {
  'Shortlisted': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'Under Review': 'bg-amber-50 text-amber-700 border-amber-200',
  'Rejected':     'bg-red-50 text-red-700 border-red-200',
};

function getStatusFromScore(score) {
  if (score >= 70) return 'Shortlisted';
  if (score >= 50) return 'Under Review';
  return 'Rejected';
}

export default function CandidatesPage() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');
  const [minScore, setMinScore] = useState(50);
  const [openShap, setOpenShap] = useState(null);

  // Read real audit candidates from localStorage (saved by Upload.jsx after audit)
  const stored = (() => {
    try { return JSON.parse(localStorage.getItem('fairhire_candidates') || 'null'); } catch { return null; }
  })();
  const allCandidates = stored || [];

  const enriched = allCandidates.map(c => ({
    ...c,
    status: getStatusFromScore(c.score),
    biased: c.explanation?.bias_flag || c.ai_bias_analysis?.bias_verdict === 'biased',
  }));

  const filtered = enriched.filter(c => {
    const matchSearch = !search ||
      c.candidate_id.toLowerCase().includes(search.toLowerCase()) ||
      (c.skills_match || '').toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'All' || c.status === filter || (filter === 'Bias Flagged' && c.biased);
    return matchSearch && matchFilter;
  }).sort((a, b) => {
    const aPassed = a.score >= minScore;
    const bPassed = b.score >= minScore;
    if (aPassed !== bPassed) return aPassed ? -1 : 1;
    return b.score - a.score;
  });

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-6xl mx-auto px-6 py-8 space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Candidates</h1>
            <p className="text-sm text-slate-500 mt-1">
              {enriched.length > 0 ? `${enriched.length} candidates from latest audit` : 'No audit data — run a pipeline first'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input type="text" placeholder="Search candidates..."
                className="pl-9 pr-4 py-2 border border-slate-200 rounded-xl bg-white text-sm text-slate-700 w-56 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <select className="px-3 py-2 border border-slate-200 rounded-xl bg-white text-sm text-slate-600 focus:outline-none"
              value={filter} onChange={e => setFilter(e.target.value)}>
              {['All', 'Shortlisted', 'Under Review', 'Rejected', 'Bias Flagged'].map(o => <option key={o}>{o}</option>)}
            </select>
            <div className="flex items-center gap-2 px-3 py-2 border border-slate-200 rounded-xl bg-white">
              <label className="text-xs font-semibold text-slate-500">Min Score:</label>
              <input type="number" min="0" max="100" value={minScore} onChange={e => setMinScore(Number(e.target.value))} className="w-12 text-sm text-slate-700 outline-none" />
            </div>
          </div>
        </div>

        {enriched.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Total', value: enriched.length, icon: Users, color: '#0F2B4C' },
              { label: 'Shortlisted', value: enriched.filter(c => c.status === 'Shortlisted').length, icon: CheckCircle, color: '#16A34A' },
              { label: 'Under Review', value: enriched.filter(c => c.status === 'Under Review').length, icon: Eye, color: '#D97706' },
              { label: 'Bias Flagged', value: enriched.filter(c => c.biased).length, icon: AlertTriangle, color: '#DC2626' },
            ].map(s => {
              const Icon = s.icon;
              return (
                <div key={s.label} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{s.label}</span>
                    <Icon size={14} style={{ color: s.color }} />
                  </div>
                  <p className="text-3xl font-black" style={{ color: s.color }}>{s.value}</p>
                </div>
              );
            })}
          </div>
        )}

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
              <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center">
                <Users size={22} className="text-slate-300" />
              </div>
              <p className="text-sm font-semibold text-slate-400">{enriched.length === 0 ? 'No audit data' : 'No matches'}</p>
              <p className="text-xs text-slate-300">
                {enriched.length === 0 ? 'Run an audit from the Dashboard to see candidates here' : 'Try adjusting search or filter'}
              </p>
            </div>
          ) : (
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-400 uppercase bg-slate-50 border-b border-slate-100 tracking-wider">
                <tr>
                  {['Candidate ID', 'Score', 'Action'].map(h => (
                    <th key={h} className="px-5 py-3 font-semibold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((c, i) => {
                  const passed = c.score >= minScore;
                  return (
                    <motion.tr key={c.candidate_id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className={`border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors ${!passed ? 'opacity-60 bg-slate-50/50' : ''}`}>
                      <td className="px-5 py-3.5 font-mono font-bold text-xs text-indigo-600">{c.candidate_id}</td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <span className={`font-bold ${passed ? 'text-slate-800' : 'text-slate-500'}`}>{c.score}</span>
                          <div className="w-14 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full rounded-full" style={{ width: `${c.score}%`, background: passed ? (c.score >= 70 ? '#16A34A' : '#D97706') : '#94A3B8' }} />
                          </div>
                          {c.biased && <AlertTriangle size={14} className="text-amber-500" title="Bias Flagged" />}
                          {!passed && <span className="text-[9px] uppercase font-bold text-slate-400 border border-slate-200 px-1.5 py-0.5 rounded bg-white ml-1">Did Not Pass</span>}
                        </div>
                      </td>
                      <td className="px-5 py-3.5 flex items-center gap-2">
                        {passed ? (
                          <button onClick={() => alert(`Marked ${c.candidate_id} for interview`)}
                            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#0F9B7A] text-white hover:bg-[#0d8266] transition-all duration-200 shadow-sm">
                            Mark for Interview
                          </button>
                        ) : (
                          <span className="px-3 py-1.5 text-xs font-semibold rounded-lg text-slate-400 bg-slate-100 cursor-not-allowed">
                            Below Criteria
                          </span>
                        )}
                        <button onClick={() => setOpenShap(c)}
                          className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50 transition-all duration-200">
                          Explain
                        </button>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
      <AnimatePresence>
        {openShap && <SHAPDrawer candidate={openShap} onClose={() => setOpenShap(null)} />}
      </AnimatePresence>
    </div>
  );
}
