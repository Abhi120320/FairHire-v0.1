import React, { useState } from 'react';
import { Copy, CheckCircle, AlertTriangle, FileText, Sparkles, Loader2 } from 'lucide-react';

const BIAS_PATTERNS = [
  { pattern: /\b(young|youthful)\b/gi, reason: "Age-discriminatory — violates the ADEA.", fix: 'motivated' },
  { pattern: /\b(energetic|dynamic|fresh)\b/gi, reason: "'Energetic/dynamic' can signal age bias.", fix: 'driven' },
  { pattern: /\bnative english speaker(s)?\b/gi, reason: "Nationality-discriminatory under Title VII.", fix: 'strong written and verbal communication skills' },
  { pattern: /\b(iit|iim|ivy league|top.tier university|prestigious university)\b/gi, reason: "Prestige bias proxies for socioeconomic status.", fix: 'accredited degree or equivalent experience' },
  { pattern: /\b(handsome|beautiful|attractive|fit)\b/gi, reason: "Appearance-based language is discriminatory.", fix: '' },
  { pattern: /\b(guys|manpower|mankind)\b/gi, reason: "Gendered language — use inclusive alternatives.", fix: 'team/people/humanity' },
  { pattern: /\b(he or she|his\/her)\b/gi, reason: "Use gender-neutral pronouns (they/them).", fix: 'they/them' },
];

function analyzeText(text) {
  const lines = text.split('\n').filter(l => l.trim());
  return lines.map(line => {
    const flagged = [];
    BIAS_PATTERNS.forEach(({ pattern, reason, fix }) => {
      const matches = [...line.matchAll(pattern)];
      matches.forEach(m => flagged.push({ match: m[0], reason, fix }));
    });
    return { text: line, biased: flagged.length > 0, flags: flagged };
  });
}

function debiasLine(line, flags) {
  let result = line;
  flags.forEach(f => {
    if (f.fix) result = result.replace(new RegExp(f.match, 'gi'), f.fix);
    else result = result.replace(new RegExp(f.match, 'gi'), '[removed]');
  });
  return result;
}

export default function JDDiffViewer() {
  const [jd, setJd] = useState('');
  const [analyzed, setAnalyzed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [tooltip, setTooltip] = useState(null);
  const [copied, setCopied] = useState(false);

  const analyze = () => {
    if (!jd.trim()) return;
    setLoading(true);
    setTimeout(() => { setLoading(false); setAnalyzed(true); }, 900);
  };

  const lines = analyzed ? analyzeText(jd) : [];
  const biasedCount = lines.filter(l => l.biased).length;
  const cleanJD = lines.map(l => debiasLine(l.text, l.flags)).join('\n');
  const reducePercent = lines.length > 0 ? Math.round((biasedCount / lines.length) * 100) : 0;

  const highlightLine = (line) => {
    let result = line.text;
    line.flags.forEach(f => {
      result = result.replace(
        new RegExp(f.match, 'gi'),
        `<mark style="background:#FEE2E2;color:#991B1B;padding:1px 4px;border-radius:4px;font-weight:600">${f.match}</mark>`
      );
    });
    return result;
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div>
          <h3 className="text-base font-bold text-slate-800">JD Bias Diff Viewer</h3>
          <p className="text-xs text-slate-400 mt-0.5">Paste any job description to detect and fix biased language</p>
        </div>
        <div className="flex items-center gap-3">
          {analyzed && biasedCount > 0 && (
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-700">
              <CheckCircle size={12} /> {reducePercent}% bias reduced after fix
            </span>
          )}
          {analyzed && (
            <button onClick={() => { navigator.clipboard.writeText(cleanJD); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
              className="flex items-center gap-2 px-4 py-2 bg-[#0F2B4C] text-white rounded-lg text-xs font-semibold hover:bg-[#1a3d6b] transition-colors">
              <Copy size={13} /> {copied ? 'Copied!' : 'Copy Clean JD'}
            </button>
          )}
        </div>
      </div>

      {!analyzed ? (
        <div className="space-y-4">
          <textarea
            value={jd}
            onChange={e => { setJd(e.target.value); setAnalyzed(false); }}
            className="w-full h-40 border border-slate-200 rounded-xl p-4 text-sm text-slate-700 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-200 leading-relaxed placeholder-slate-300"
            placeholder={"Paste a job description here and click Analyze…\n\nExample:\n  We are looking for a young, energetic engineer…\n  Native English speaker preferred…"}
          />
          <div className="flex justify-end">
            <button onClick={analyze} disabled={!jd.trim() || loading}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#0F2B4C] text-white rounded-xl text-sm font-semibold hover:bg-[#1a3d6b] transition-colors disabled:opacity-40">
              {loading ? <><Loader2 size={14} className="animate-spin" /> Analyzing…</> : <><Sparkles size={14} /> Analyze for Bias</>}
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex justify-between items-center mb-4">
            <span className="text-xs font-semibold text-slate-400 flex items-center gap-2">
              <AlertTriangle size={13} className="text-amber-500" />
              {biasedCount} biased line{biasedCount !== 1 ? 's' : ''} detected out of {lines.length}
            </span>
            <button onClick={() => { setAnalyzed(false); setJd(''); }}
              className="text-xs text-slate-400 hover:text-slate-700 hover:underline">← Edit JD</button>
          </div>

          {biasedCount === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 gap-3 text-center">
              <CheckCircle size={32} className="text-emerald-500" />
              <p className="text-sm font-bold text-emerald-700">No bias detected!</p>
              <p className="text-xs text-slate-400">This job description looks fair based on our pattern analysis.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2 h-2 rounded-full bg-red-500" />
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Original JD</span>
                </div>
                <div className="space-y-2">
                  {lines.map((line, i) => (
                    <div key={i} className="relative text-sm p-3 rounded-lg leading-relaxed transition-colors"
                      style={{ background: line.biased ? '#FEF2F2' : '#F8F9FA', border: line.biased ? '1px solid #FECACA' : '1px solid #F1F5F9' }}
                      onMouseEnter={() => line.biased && setTooltip(i)}
                      onMouseLeave={() => setTooltip(null)}>
                      {line.biased && <AlertTriangle size={11} className="text-red-400 inline mr-1.5 shrink-0" />}
                      <span style={{ color: line.biased ? '#991B1B' : '#475569' }}
                        dangerouslySetInnerHTML={{ __html: line.biased ? highlightLine(line) : line.text }} />
                      {tooltip === i && line.biased && (
                        <div className="absolute left-0 z-20 w-72 bg-slate-900 text-white text-xs rounded-xl p-3 shadow-xl mt-1" style={{ top: '100%' }}>
                          {line.flags.map((f, fi) => (
                            <div key={fi} className="mb-1.5 last:mb-0">
                              <p className="font-bold text-amber-300">"{f.match}"</p>
                              <p className="text-slate-300">{f.reason}</p>
                            </div>
                          ))}
                          <div className="absolute -top-1.5 left-6 w-3 h-3 bg-slate-900 rotate-45" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Debiased JD</span>
                </div>
                <div className="space-y-2">
                  {lines.map((line, i) => {
                    const fixed = debiasLine(line.text, line.flags);
                    return (
                      <div key={i} className="text-sm p-3 rounded-lg leading-relaxed"
                        style={{ background: line.biased ? '#F0FDF4' : '#F8F9FA', border: line.biased ? '1px solid #BBF7D0' : '1px solid #F1F5F9', color: line.biased ? '#166534' : '#475569' }}>
                        {line.biased && <CheckCircle size={11} className="text-emerald-500 inline mr-1.5 shrink-0" />}
                        {fixed}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
