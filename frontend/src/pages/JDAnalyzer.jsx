import React, { useState } from 'react';
import { FileText, Sparkles, Loader2, Copy, CheckCircle, AlertTriangle } from 'lucide-react';

const BIAS_PATTERNS = [
  { pattern: /\b(young|youthful)\b/gi, reason: "Age-discriminatory — violates the ADEA.", fix: 'motivated' },
  { pattern: /\b(energetic|dynamic|fresh graduate)\b/gi, reason: "'Energetic/dynamic' can signal age bias.", fix: 'driven' },
  { pattern: /\bnative english speaker(s)?\b/gi, reason: "Nationality-discriminatory under Title VII.", fix: 'strong written and verbal communication skills' },
  { pattern: /\b(iit|iim|ivy league|top.tier university|prestigious university)\b/gi, reason: "Prestige bias proxies for socioeconomic status and can create disparate impact.", fix: 'accredited degree or equivalent experience' },
  { pattern: /\b(handsome|beautiful|attractive|fit|slim)\b/gi, reason: "Appearance-based language is discriminatory.", fix: '' },
  { pattern: /\b(guys|manpower|mankind)\b/gi, reason: "Gendered language — use inclusive alternatives.", fix: 'team/people/humanity' },
  { pattern: /\b(he or she|his\/her)\b/gi, reason: "Use gender-neutral pronouns (they/them).", fix: 'they/them' },
  { pattern: /\b(chairman|stewardess|fireman|policeman)\b/gi, reason: "Gendered job title — use the neutral form.", fix: 'chair/flight attendant/firefighter/officer' },
  { pattern: /\b(culture fit|cultural fit)\b/gi, reason: "'Culture fit' often proxies for in-group bias.", fix: 'values alignment' },
];

function analyzeText(text) {
  return text.split('\n').filter(l => l.trim()).map(line => {
    const flags = [];
    BIAS_PATTERNS.forEach(({ pattern, reason, fix }) => {
      const matches = [...line.matchAll(pattern)];
      matches.forEach(m => flags.push({ match: m[0], reason, fix }));
    });
    return { text: line, biased: flags.length > 0, flags };
  });
}

function debiasLine(text, flags) {
  let result = text;
  flags.forEach(f => {
    result = result.replace(new RegExp(f.match, 'gi'), f.fix || '[removed]');
  });
  return result;
}

export default function JDAnalyzer() {
  const [jd, setJd] = useState('');
  const [analyzed, setAnalyzed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [tooltip, setTooltip] = useState(null);
  const [copied, setCopied] = useState(false);

  const analyze = () => {
    if (!jd.trim()) return;
    setLoading(true);
    setTimeout(() => { setLoading(false); setAnalyzed(true); }, 700);
  };

  const lines = analyzed ? analyzeText(jd) : [];
  const biasedCount = lines.filter(l => l.biased).length;
  const cleanJD = lines.map(l => debiasLine(l.text, l.flags)).join('\n');

  const highlightLine = (line) => {
    let result = line.text;
    line.flags.forEach(f => {
      result = result.replace(new RegExp(f.match, 'gi'),
        `<mark style="background:#FEE2E2;color:#991B1B;padding:1px 4px;border-radius:4px;font-weight:600">${f.match}</mark>`);
    });
    return result;
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span className="text-xs font-semibold text-indigo-700">Bias Pattern Detection</span>
            </div>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">JD Bias Analyzer</h1>
          <p className="text-slate-500 text-sm mt-1">Paste any job description to detect biased language and get a clean, fair version.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
            <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
              <FileText size={15} className="text-slate-400" /> Paste Job Description
            </h3>
            <textarea value={jd}
              onChange={e => { setJd(e.target.value); setAnalyzed(false); }}
              className="w-full h-64 border border-slate-200 rounded-xl p-3 text-sm text-slate-700 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-200 leading-relaxed placeholder-slate-300"
              placeholder="Paste your job description here…" />
            <div className="flex gap-2">
              {analyzed && (
                <button onClick={() => { setJd(''); setAnalyzed(false); }}
                  className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-500 hover:bg-slate-50 transition-colors">
                  Clear
                </button>
              )}
              <button onClick={analyze} disabled={!jd.trim() || loading}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-[#0F2B4C] text-white rounded-xl text-sm font-semibold hover:bg-[#1a3d6b] transition-colors disabled:opacity-40">
                {loading ? <><Loader2 size={14} className="animate-spin" /> Analyzing…</> : <><Sparkles size={14} /> Analyze for Bias</>}
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {!analyzed ? (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-10 flex flex-col items-center justify-center text-center h-full min-h-64">
                <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
                  <Sparkles size={24} className="text-slate-300" />
                </div>
                <p className="text-sm font-semibold text-slate-400">Analysis results appear here</p>
                <p className="text-xs text-slate-300 mt-1">Paste a JD and click Analyze</p>
              </div>
            ) : biasedCount === 0 ? (
              <div className="bg-white rounded-2xl border border-emerald-200 shadow-sm p-10 flex flex-col items-center justify-center text-center h-full">
                <CheckCircle size={36} className="text-emerald-500 mb-3" />
                <p className="text-base font-bold text-emerald-700">No bias detected!</p>
                <p className="text-sm text-slate-400 mt-2 max-w-xs leading-relaxed">This job description looks fair based on our pattern library.</p>
              </div>
            ) : (
              <>
                <div className="bg-white border border-red-100 rounded-2xl shadow-sm p-5">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-bold text-slate-700 flex items-center gap-1.5">
                      <AlertTriangle size={14} className="text-red-500" /> {biasedCount} biased line{biasedCount !== 1 ? 's' : ''} found
                    </h4>
                  </div>
                  <div className="space-y-2">
                    {lines.map((line, i) => (
                      <div key={i} className="relative text-sm p-3 rounded-lg leading-relaxed"
                        style={{ background: line.biased ? '#FEF2F2' : '#F8F9FA', border: line.biased ? '1px solid #FECACA' : '1px solid #F1F5F9' }}
                        onMouseEnter={() => line.biased && setTooltip(i)}
                        onMouseLeave={() => setTooltip(null)}>
                        {line.biased && <AlertTriangle size={11} className="text-red-400 inline mr-1.5" />}
                        <span style={{ color: line.biased ? '#991B1B' : '#475569' }}
                          dangerouslySetInnerHTML={{ __html: line.biased ? highlightLine(line) : line.text }} />
                        {tooltip === i && (
                          <div className="absolute left-0 z-20 w-72 bg-slate-900 text-white text-xs rounded-xl p-3 shadow-xl mt-1" style={{ top: '100%' }}>
                            {line.flags.map((f, fi) => (
                              <div key={fi} className="mb-1.5 last:mb-0">
                                <p className="font-bold text-amber-300">"{f.match}"</p>
                                <p className="text-slate-300">{f.reason}</p>
                                {f.fix && <p className="text-emerald-300 mt-0.5">Fix: "{f.fix}"</p>}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="text-sm font-bold text-emerald-800 flex items-center gap-1.5">
                      <CheckCircle size={14} /> Clean JD
                    </h4>
                    <button onClick={() => { navigator.clipboard.writeText(cleanJD); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                      className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 hover:underline">
                      <Copy size={12} /> {copied ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                  <p className="text-sm text-emerald-900 leading-relaxed whitespace-pre-line">{cleanJD}</p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
