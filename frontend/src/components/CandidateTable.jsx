import React, { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ReferenceLine, Cell, ResponsiveContainer
} from 'recharts';
import { X, AlertTriangle, CheckCircle, UserCheck, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function SHAPDrawer({ candidate, minScore, onClose }) {
  const shapFeatures = candidate.explanation?.top_positive_factors
    ? [
        ...(candidate.explanation.top_positive_factors || []).map(f => ({ feature: f.feature.replace(/_/g, ' '), val: f.importance })),
        ...(candidate.explanation.top_negative_factors || []).map(f => ({ feature: f.feature.replace(/_/g, ' '), val: f.importance })),
      ]
    : [];
  const maxVal = shapFeatures.length ? Math.max(...shapFeatures.map(d => Math.abs(d.val))) : 1;

  const passed = candidate.score >= minScore;
  let lowestArea = { key: 'overall qualifications', score: 100 };
  if (!passed) {
    Object.entries(candidate.score_breakdown || {}).forEach(([key, val]) => {
      const s = typeof val === 'object' ? val.score : val;
      if (s < lowestArea.score) lowestArea = { key: key.replace(/_/g, ' '), score: s };
    });
  }

  return (
    <AnimatePresence>
      <motion.div key="overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/25 backdrop-blur-sm z-40" onClick={onClose} />
      <motion.div key="drawer" initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white border-l border-slate-200 shadow-2xl z-50 flex flex-col overflow-y-auto">
        <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 sticky top-0 bg-white">
          <div>
            <h3 className="text-sm font-bold text-slate-800">SHAP Explainability</h3>
            <p className="text-xs font-mono text-[#0F9B7A] mt-0.5">{candidate.candidate_id}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700 transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-6 flex-grow">
          {!passed && (
            <div className="p-4 rounded-xl bg-red-50 border border-red-100 flex items-start gap-3">
              <X size={16} className="text-red-600 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm text-red-800 font-bold mb-1">Rejection Reasoning</p>
                <p className="text-xs text-red-700 leading-relaxed">
                  This candidate scored <strong>{candidate.score}</strong>, which is below the minimum required threshold of <strong>{minScore}</strong>. 
                  Their lowest performing area was <strong className="capitalize">{lowestArea.key}</strong> (Score: {lowestArea.score}). 
                  We recommend pursuing candidates with stronger qualifications in this domain.
                </p>
              </div>
            </div>
          )}

          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Score Breakdown</p>
            <div className="space-y-3">
              {Object.entries(candidate.score_breakdown || {}).map(([key, val]) => {
                const score = typeof val === 'object' ? val.score : val;
                const weight = typeof val === 'object' ? val.weight : '';
                return (
                  <div key={key}>
                    <div className="flex justify-between text-xs font-medium mb-1.5">
                      <span className="text-slate-600">{key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} <span className="text-slate-400">({weight})</span></span>
                      <span className="text-slate-800 font-bold">{score}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${score}%`, background: score >= 60 ? '#10B981' : score >= 40 ? '#F59E0B' : '#EF4444' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {shapFeatures.length > 0 && (
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">SHAP Feature Impact</p>
              <div className="h-52 bg-slate-50 rounded-xl border border-slate-100 p-3">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={shapFeatures} layout="vertical" margin={{ top: 0, right: 15, left: 5, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#F1F5F9" />
                    <XAxis type="number" domain={[-maxVal - 0.1, maxVal + 0.1]} hide />
                    <YAxis dataKey="feature" type="category" axisLine={false} tickLine={false}
                      tick={{ fill: '#64748B', fontSize: 10, fontWeight: 500 }} width={90} />
                    <ReferenceLine x={0} stroke="#CBD5E1" strokeWidth={2} />
                    <Tooltip formatter={val => [val > 0 ? `+${val.toFixed(2)}` : val.toFixed(2), 'Impact']}
                      contentStyle={{ fontSize: 12, border: '1px solid #E2E8F0', borderRadius: 8 }} />
                    <Bar dataKey="val" radius={4} barSize={14}>
                      {shapFeatures.map((entry, i) => (
                        <Cell key={i} fill={entry.val >= 0 ? '#0F9B7A' : '#DC2626'} fillOpacity={0.8} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">AI Analysis</p>
            <p className="text-sm text-slate-700 leading-relaxed">
              {candidate.explanation?.plain_english_summary || candidate.ai_bias_analysis?.bias_reasoning || 'No explanation available.'}
            </p>
          </div>

          {(candidate.explanation?.bias_flag || candidate.ai_bias_analysis?.bias_verdict === 'biased') && (
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-3">
              <AlertTriangle size={16} className="text-amber-600 mt-0.5 shrink-0" />
              <p className="text-sm text-amber-800 font-medium">Bias flag active — human review strongly recommended.</p>
            </div>
          )}

          {candidate.ai_bias_analysis && (
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                AI Verdict — <span className="capitalize">{candidate.ai_bias_analysis.scored_by}</span>
              </p>
              <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${
                candidate.ai_bias_analysis.bias_verdict === 'biased'
                  ? 'bg-red-50 text-red-700 border border-red-200'
                  : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              }`}>
                {candidate.ai_bias_analysis.bias_verdict === 'biased'
                  ? <><AlertTriangle size={11} /> Biased</>
                  : <><CheckCircle size={11} /> Unbiased</>}
              </span>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-slate-100 sticky bottom-0 bg-white">
          <button className="w-full flex items-center justify-center gap-2 py-3 bg-[#0F2B4C] hover:bg-[#1a3d6b] text-white font-semibold rounded-xl text-sm transition-colors">
            <UserCheck size={16} /> Request Human Review
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

export default function CandidateTable({ candidates = [] }) {
  const [openShap, setOpenShap] = useState(null);
  const [minScore, setMinScore] = useState(50);

  if (!candidates || candidates.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h3 className="text-base font-bold text-slate-800">Candidate Analysis</h3>
          <p className="text-xs text-slate-400 mt-0.5">All scored candidates from the latest audit</p>
        </div>
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
          <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center">
            <Users size={22} className="text-slate-300" />
          </div>
          <p className="text-sm font-semibold text-slate-400">No candidates yet</p>
          <p className="text-xs text-slate-300">Upload resumes and run the audit pipeline to see results here</p>
        </div>
      </div>
    );
  }

  const sortedCandidates = [...candidates].sort((a, b) => {
    const aPassed = a.score >= minScore;
    const bPassed = b.score >= minScore;
    if (aPassed !== bPassed) return aPassed ? -1 : 1;
    return b.score - a.score;
  });

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center flex-wrap gap-4">
        <div>
          <h3 className="text-base font-bold text-slate-800">Candidate Analysis</h3>
          <p className="text-xs text-slate-400 mt-0.5">Showing all {candidates.length} candidates</p>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-slate-500">Min Score Criteria:</label>
          <input 
            type="number" 
            min="0" max="100" 
            value={minScore} 
            onChange={e => setMinScore(Number(e.target.value))}
            className="w-16 px-2 py-1 border border-slate-200 rounded-lg text-sm text-slate-700 outline-none focus:border-indigo-400"
          />
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-slate-400 uppercase bg-slate-50 border-b border-slate-100 tracking-wider">
            <tr>
              {['Candidate ID', 'Score', 'Action'].map(h => (
                <th key={h} className="px-6 py-3 font-semibold">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedCandidates.map((c, i) => {
              const isBiased = c.explanation?.bias_flag || c.ai_bias_analysis?.bias_verdict === 'biased';
              const passed = c.score >= minScore;
              
              return (
                <motion.tr key={c.candidate_id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className={`border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors ${!passed ? 'opacity-60 bg-slate-50/50' : ''}`}>
                  <td className="px-6 py-3.5 font-mono text-xs font-bold text-[#0F9B7A]">{c.candidate_id}</td>
                  <td className="px-6 py-3.5">
                    <div className="flex items-center gap-2">
                      <span className={`font-bold ${passed ? 'text-slate-800' : 'text-slate-500'}`}>{c.score}</span>
                      <div className="w-14 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${c.score}%`, background: passed ? (c.score >= 70 ? '#16A34A' : '#D97706') : '#94A3B8' }} />
                      </div>
                      {isBiased && <AlertTriangle size={14} className="text-amber-500" title="Bias Flagged" />}
                      {!passed && <span className="text-[9px] uppercase font-bold text-slate-400 border border-slate-200 px-1.5 py-0.5 rounded bg-white ml-1">Did Not Pass</span>}
                    </div>
                  </td>
                  <td className="px-6 py-3.5 flex items-center gap-2">
                    {passed ? (
                      <button onClick={() => {
                          const email = `${c.candidate_id.replace(/[^a-zA-Z0-9]/g, '').toLowerCase()}@example.com`;
                          const subject = encodeURIComponent("Interview Invitation - FairHire");
                          const body = encodeURIComponent(`Hello,\n\nWe were very impressed by your profile and would like to invite you to an interview.\n\nPlease let us know your availability for next week.\n\nBest regards,\nThe Hiring Team`);
                          window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;
                        }}
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
      </div>
      <AnimatePresence>
        {openShap && <SHAPDrawer candidate={openShap} minScore={minScore} onClose={() => setOpenShap(null)} />}
      </AnimatePresence>
    </div>
  );
}
