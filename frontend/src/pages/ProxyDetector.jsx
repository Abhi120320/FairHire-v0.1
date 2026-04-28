import React, { useState } from 'react';
import { AlertTriangle, Eye, Shield } from 'lucide-react';

const FEATURES = ['Zip Code', 'University Name', 'Graduation Year', 'Job Title', 'School Tier'];
const PROTECTED = ['Gender', 'Race', 'Age'];

const CORRELATIONS = [
  [0.12, 0.61, 0.08],
  [0.08, 0.45, 0.11],
  [0.07, 0.19, 0.72],
  [0.31, 0.28, 0.22],
  [0.15, 0.58, 0.09],
];

const THRESHOLD = 0.4;

function getColor(val) {
  if (val >= 0.7) return { bg: 'rgba(255,42,109,0.35)', border: 'rgba(255,42,109,0.5)', text: '#ff8fab' };
  if (val >= 0.5) return { bg: 'rgba(255,42,109,0.18)', border: 'rgba(255,42,109,0.3)', text: '#ffa0b4' };
  if (val >= 0.4) return { bg: 'rgba(255,165,0,0.15)', border: 'rgba(255,165,0,0.3)', text: '#ffb347' };
  if (val >= 0.2) return { bg: 'rgba(0,255,245,0.04)', border: 'rgba(0,255,245,0.06)', text: 'rgba(0,255,245,0.4)' };
  return { bg: 'rgba(0,255,245,0.01)', border: 'rgba(255,255,255,0.04)', text: 'rgba(255,255,255,0.2)' };
}

export default function ProxyDetector() {
  const [hovered, setHovered] = useState(null);

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      <div className="animate-slide-up">
        <div className="flex items-center gap-3 mb-3">
          <div className="flex items-center gap-2 px-3 py-1 rounded border border-cyber-pink/15 bg-cyber-pink/[0.04]">
            <Eye size={12} className="text-cyber-pink" />
            <span className="text-[9px] font-mono text-cyber-pink/60 tracking-widest">PROXY ANALYSIS</span>
          </div>
        </div>
        <h1 className="text-3xl md:text-4xl font-cyber font-black tracking-wider">
          <span className="cyber-gradient">PROXY DETECTOR</span>
        </h1>
        <p className="text-white/20 mt-2 text-[10px] font-mono tracking-wider">CORRELATION_MATRIX :: NEUTRAL_FEATURES × PROTECTED_ATTRIBUTES</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-slide-up delay-100">
        {[
          { label: 'HIGH RISK', count: CORRELATIONS.flat().filter(v => v >= 0.5).length, color: 'neon-text-pink' },
          { label: 'MEDIUM RISK', count: CORRELATIONS.flat().filter(v => v >= 0.4 && v < 0.5).length, color: 'text-amber-400' },
          { label: 'CLEAN', count: CORRELATIONS.flat().filter(v => v < 0.4).length, color: 'neon-text' },
        ].map(c => (
          <div key={c.label} className="stat-card">
            <p className="text-[9px] font-cyber font-bold text-white/20 tracking-[0.2em] mb-2">{c.label}</p>
            <h2 className={`text-4xl font-cyber font-black ${c.color}`}>{c.count}</h2>
            <p className="text-[10px] font-mono text-white/15 mt-1">feature pairs</p>
          </div>
        ))}
      </div>

      <div className="cyber-panel p-6 animate-slide-up delay-200">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xs font-cyber font-bold text-white/50 tracking-wider">CORRELATION HEATMAP</h3>
            <p className="text-[10px] font-mono text-white/15 mt-1">cells &gt; 0.4 may indicate proxy discrimination</p>
          </div>
          <div className="flex items-center gap-4">
            {[{ label: 'LOW', bg: 'rgba(0,255,245,0.1)' }, { label: 'MED', bg: 'rgba(255,165,0,0.3)' }, { label: 'HIGH', bg: 'rgba(255,42,109,0.4)' }].map(l => (
              <div key={l.label} className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded" style={{ background: l.bg }} />
                <span className="text-[9px] font-mono text-white/20">{l.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="pb-4 w-44" />
                {PROTECTED.map(p => (
                  <th key={p} className="pb-4 px-3 text-center">
                    <span className="text-[10px] font-cyber font-bold text-cyber-pink/50 tracking-wider">{p.toUpperCase()}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {FEATURES.map((feat, fi) => (
                <tr key={feat}>
                  <td className="py-2 pr-4">
                    <span className="text-[10px] font-mono text-white/30">{feat}</span>
                  </td>
                  {PROTECTED.map((prot, pi) => {
                    const val = CORRELATIONS[fi][pi];
                    const style = getColor(val);
                    const isHighRisk = val >= THRESHOLD;
                    const isHovered = hovered?.fi === fi && hovered?.pi === pi;
                    return (
                      <td key={prot} className="py-2 px-3 text-center">
                        <div className="relative inline-block">
                          <div
                            className="w-16 h-14 rounded-lg flex flex-col items-center justify-center cursor-pointer transition-all duration-300"
                            style={{
                              background: style.bg,
                              border: `1px solid ${style.border}`,
                              transform: isHovered ? 'scale(1.1)' : 'scale(1)',
                              boxShadow: isHovered && isHighRisk ? '0 0 20px rgba(255,42,109,0.3)' : isHovered ? '0 0 15px rgba(0,255,245,0.15)' : 'none',
                            }}
                            onMouseEnter={() => setHovered({ fi, pi })}
                            onMouseLeave={() => setHovered(null)}
                          >
                            <span className="text-sm font-mono font-bold" style={{ color: style.text }}>{val.toFixed(2)}</span>
                            {isHighRisk && <AlertTriangle size={9} className="text-cyber-pink/70 mt-0.5" />}
                          </div>
                          {isHovered && isHighRisk && (
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-20 w-56 cyber-panel p-3 pointer-events-none">
                              <p className="text-[9px] font-cyber font-bold text-cyber-pink/80 tracking-wider mb-1">⚠ PROXY RISK</p>
                              <p className="text-[9px] font-body text-white/40 leading-relaxed">
                                <strong className="text-white/60">{feat}</strong> may act as a proxy for <strong className="text-cyber-pink/70">{prot}</strong>. Correlation: {val.toFixed(2)}
                              </p>
                            </div>
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

      <div className="cyber-panel p-5 border border-amber-400/10 animate-slide-up delay-300">
        <div className="flex items-start gap-4">
          <div className="w-9 h-9 rounded-lg border border-amber-400/20 bg-amber-400/[0.07] flex items-center justify-center shrink-0">
            <Shield size={16} className="text-amber-400" />
          </div>
          <div>
            <p className="text-xs font-cyber font-bold text-amber-400/80 tracking-wider mb-1">REMEDIATION GUIDANCE</p>
            <p className="text-xs font-body text-white/30 leading-relaxed">
              Features with correlation &gt; 0.4 to protected attributes should be audited for removal or transformation before use in scoring models. Consider using fairness-aware feature selection or apply counterfactual fairness constraints during model training.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
