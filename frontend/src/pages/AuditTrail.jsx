import React, { useState, useMemo } from 'react';
import { Search, Download, ShieldCheck, AlertTriangle, CheckCircle, Filter } from 'lucide-react';

const MOCK_DECISIONS = Array.from({ length: 40 }, (_, i) => {
  const decisions = ['Shortlisted', 'Rejected', 'Shortlisted', 'Rejected', 'Rejected'];
  const decision = decisions[i % decisions.length];
  const score = Math.floor(Math.random() * 60) + 35;
  const date = new Date(2026, 3, 1 + Math.floor(i / 3), 9 + (i % 8), (i * 7) % 60);
  return {
    id: `CAND_${1000 + i}`,
    timestamp: date.toISOString(),
    score,
    decision,
    model: i < 15 ? 'v1.2.0' : i < 30 ? 'v1.3.0' : 'v1.4.0',
    reviewer: i % 5 === 0 ? `HR_${String.fromCharCode(65 + (i % 6))}` : null,
    biasFlag: score < 55 && i % 3 === 0,
  };
});

function exportCSV(rows) {
  const headers = ['Timestamp', 'Candidate ID', 'AI Score', 'Decision', 'Model Version', 'Human Reviewer', 'Bias Flag'];
  const lines = [headers.join(','), ...rows.map(r => [
    r.timestamp, r.id, r.score, r.decision, r.model, r.reviewer || 'None', r.biasFlag ? 'Yes' : 'No'
  ].join(','))];
  const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = 'fairhire_audit_trail.csv'; a.click();
  URL.revokeObjectURL(url);
}

export default function AuditTrail() {
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const filtered = useMemo(() => MOCK_DECISIONS.filter(r => {
    const matchSearch = r.id.toLowerCase().includes(search.toLowerCase()) || r.decision.toLowerCase().includes(search.toLowerCase());
    const matchFrom = !dateFrom || new Date(r.timestamp) >= new Date(dateFrom);
    const matchTo = !dateTo || new Date(r.timestamp) <= new Date(dateTo + 'T23:59:59');
    return matchSearch && matchFrom && matchTo;
  }), [search, dateFrom, dateTo]);

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      <div className="flex flex-col lg:flex-row gap-6 justify-between items-start lg:items-end animate-slide-up">
        <div>
          <div className="flex items-center gap-3 mb-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded border border-emerald-400/20 bg-emerald-400/[0.06]">
              <ShieldCheck size={12} className="text-emerald-400" />
              <span className="text-[9px] font-cyber font-bold text-emerald-400 tracking-[0.15em]">NYC LOCAL LAW 144 COMPLIANT</span>
            </div>
          </div>
          <h1 className="text-3xl md:text-4xl font-cyber font-black tracking-wider">
            <span className="cyber-gradient">DECISION AUDIT TRAIL</span>
          </h1>
          <p className="text-white/20 mt-2 text-[10px] font-mono tracking-wider">CHRONOLOGICAL_LOG :: AI_HIRING_DECISIONS</p>
        </div>
        <button
          onClick={() => exportCSV(filtered)}
          className="btn-cyber flex items-center gap-2 text-[10px]"
        >
          <Download size={14} /> EXPORT CSV
        </button>
      </div>

      <div className="cyber-panel p-4 animate-slide-up delay-100">
        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-grow relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/15 w-3.5 h-3.5" />
            <input
              type="text"
              placeholder="Search candidate ID or decision..."
              className="input-cyber pl-9 w-full text-xs"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Filter size={12} className="text-cyber-cyan/30" />
              <span className="text-[9px] font-cyber text-white/20 tracking-widest">DATE RANGE</span>
            </div>
            <input type="date" className="input-cyber !py-2 text-xs w-36" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
            <span className="text-white/15 font-mono text-xs">→</span>
            <input type="date" className="input-cyber !py-2 text-xs w-36" value={dateTo} onChange={e => setDateTo(e.target.value)} />
          </div>
          <span className="text-[10px] font-mono text-white/20 whitespace-nowrap">{filtered.length} records</span>
        </div>
      </div>

      <div className="cyber-panel overflow-hidden animate-slide-up delay-200">
        <div className="overflow-x-auto max-h-[560px]">
          <table className="w-full text-sm text-left">
            <thead className="text-[9px] font-cyber text-cyan-400/25 uppercase bg-cyan-400/[0.02] border-b border-cyan-400/[0.04] sticky top-0 z-10 tracking-[0.15em]">
              <tr>
                <th className="px-5 py-3">Timestamp</th>
                <th className="px-5 py-3">Candidate ID</th>
                <th className="px-5 py-3">AI Score</th>
                <th className="px-5 py-3">Decision</th>
                <th className="px-5 py-3">Model</th>
                <th className="px-5 py-3">Reviewer</th>
                <th className="px-5 py-3">Bias Flag</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row, idx) => (
                <tr key={idx} className="border-b border-white/[0.03] last:border-0 hover:bg-cyan-400/[0.02] transition-colors">
                  <td className="px-5 py-3 text-[10px] font-mono text-white/20">{new Date(row.timestamp).toLocaleString()}</td>
                  <td className="px-5 py-3 font-cyber font-bold text-cyber-cyan/50 text-[10px]">{row.id}</td>
                  <td className="px-5 py-3 font-mono font-bold text-xs">
                    <span className={row.score >= 60 ? 'neon-text' : row.score >= 45 ? 'text-amber-400' : 'neon-text-pink'}>{row.score}</span>
                  </td>
                  <td className="px-5 py-3">
                    {row.decision === 'Shortlisted'
                      ? <span className="tag-green flex items-center gap-1 w-max"><CheckCircle size={9} /> {row.decision}</span>
                      : <span className="tag-red w-max">{row.decision}</span>}
                  </td>
                  <td className="px-5 py-3 text-[10px] font-mono text-white/20">{row.model}</td>
                  <td className="px-5 py-3 text-[10px] font-mono text-white/30">{row.reviewer || <span className="text-white/10">—</span>}</td>
                  <td className="px-5 py-3">
                    {row.biasFlag
                      ? <span className="tag-amber flex items-center gap-1 w-max"><AlertTriangle size={9} /> FLAG</span>
                      : <span className="text-white/10 text-[10px] font-mono">—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
