import React from 'react';
import { AlertTriangle, Info } from 'lucide-react';

const RACES = ['Asian', 'Black', 'Hispanic', 'White'];
const GENDERS = ['Male', 'Female', 'Non-Binary'];

const SELECTION_RATES = [
  [72, 61, 38],
  [55, 43, 29],
  [68, 52, 41],
  [78, 69, 55],
];

function getCell(rate) {
  if (rate >= 70) return { bg: 'rgba(16,185,129,0.18)', border: 'rgba(16,185,129,0.3)', text: '#34d399', label: 'PASS' };
  if (rate >= 40) return { bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.25)', text: '#fbbf24', label: 'WARN' };
  return { bg: 'rgba(255,42,109,0.15)', border: 'rgba(255,42,109,0.3)', text: '#ff8fab', label: 'FAIL' };
}

export default function IntersectionalMatrix() {
  const allRates = SELECTION_RATES.flat();
  const overallAvg = Math.round(allRates.reduce((a, b) => a + b, 0) / allRates.length);
  const minRate = Math.min(...allRates);
  const maxRate = Math.max(...allRates);
  const spread = maxRate - minRate;

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      <div className="animate-slide-up">
        <div className="flex items-center gap-3 mb-3">
          <div className="flex items-center gap-2 px-3 py-1 rounded border border-purple-400/20 bg-purple-400/[0.05]">
            <Info size={12} className="text-purple-400" />
            <span className="text-[9px] font-mono text-purple-400/60 tracking-widest">INTERSECTIONAL ANALYSIS</span>
          </div>
        </div>
        <h1 className="text-3xl md:text-4xl font-cyber font-black tracking-wider">
          <span className="cyber-gradient">INTERSECTIONAL BIAS MATRIX</span>
        </h1>
        <p className="text-white/20 mt-2 text-[10px] font-mono tracking-wider">RACE × GENDER :: SELECTION_RATE_ANALYSIS</p>
      </div>

      <div className="cyber-panel p-4 border border-purple-400/10 animate-slide-up delay-100">
        <div className="flex items-start gap-3">
          <Info size={16} className="text-purple-400 mt-0.5 shrink-0" />
          <p className="text-xs font-body text-white/30 leading-relaxed">
            Single-axis analysis (gender <em>or</em> race alone) misses combined discrimination patterns. A Black female candidate may face compounded disadvantages not visible when examining either dimension in isolation. This matrix reveals those intersectional disparities.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-slide-up delay-100">
        {[
          { label: 'AVG SELECTION RATE', value: `${overallAvg}%`, color: overallAvg >= 60 ? 'neon-text' : 'text-amber-400' },
          { label: 'SPREAD (MAX − MIN)', value: `${spread}pp`, color: spread > 30 ? 'neon-text-pink' : 'text-amber-400' },
          { label: 'LOWEST RATE', value: `${minRate}%`, color: 'neon-text-pink' },
        ].map(c => (
          <div key={c.label} className="stat-card">
            <p className="text-[9px] font-cyber font-bold text-white/20 tracking-[0.2em] mb-2">{c.label}</p>
            <h2 className={`text-4xl font-cyber font-black ${c.color}`}>{c.value}</h2>
          </div>
        ))}
      </div>

      <div className="cyber-panel p-6 animate-slide-up delay-200">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xs font-cyber font-bold text-white/50 tracking-wider">SELECTION RATE HEATMAP</h3>
            <p className="text-[10px] font-mono text-white/15 mt-1">% of candidates shortlisted per intersection</p>
          </div>
          <div className="flex items-center gap-4">
            {[{ label: '≥70% PASS', color: '#34d399' }, { label: '40–70% WARN', color: '#fbbf24' }, { label: '<40% FAIL', color: '#ff8fab' }].map(l => (
              <div key={l.label} className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded" style={{ background: l.color, opacity: 0.7 }} />
                <span className="text-[9px] font-mono text-white/20">{l.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="pb-5 w-32" />
                {GENDERS.map(g => (
                  <th key={g} className="pb-5 px-4 text-center min-w-[130px]">
                    <span className="text-[10px] font-cyber font-bold text-cyber-cyan/40 tracking-wider">{g.toUpperCase()}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {RACES.map((race, ri) => (
                <tr key={race}>
                  <td className="py-3 pr-4">
                    <span className="text-[10px] font-cyber font-bold text-white/30 tracking-wider">{race.toUpperCase()}</span>
                  </td>
                  {GENDERS.map((gender, gi) => {
                    const rate = SELECTION_RATES[ri][gi];
                    const style = getCell(rate);
                    return (
                      <td key={gender} className="py-3 px-4 text-center">
                        <div
                          className="w-full rounded-lg py-4 flex flex-col items-center justify-center transition-all duration-300 hover:scale-105 cursor-default"
                          style={{ background: style.bg, border: `1px solid ${style.border}`, boxShadow: `0 0 15px ${style.border.replace('0.3', '0.1')}` }}
                        >
                          <span className="text-2xl font-cyber font-black" style={{ color: style.text }}>{rate}%</span>
                          <span className="text-[8px] font-mono mt-1" style={{ color: style.text, opacity: 0.6 }}>{style.label}</span>
                          {rate < 40 && (
                            <AlertTriangle size={10} className="mt-1" style={{ color: style.text, opacity: 0.7 }} />
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {SELECTION_RATES.some(row => row.some(v => v < 40)) && (
        <div className="cyber-panel p-5 border border-cyber-pink/15 animate-slide-up delay-300">
          <div className="flex items-start gap-4">
            <AlertTriangle size={18} className="text-cyber-pink shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-cyber font-bold text-cyber-pink/80 tracking-wider mb-1">INTERSECTIONAL DISPARITY DETECTED</p>
              <p className="text-xs font-body text-white/30 leading-relaxed">
                Certain race-gender intersections show selection rates below 40%, indicating potential compounded discrimination. EEOC 4/5ths rule may be violated. Consider targeted fairness constraints or manual review for affected groups.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
