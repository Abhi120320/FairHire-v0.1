import React, { useState } from 'react';
import { Info, CheckCircle, AlertTriangle, ArrowRight, X, TrendingUp } from 'lucide-react';

const CURRENT_MODEL = {
  name: 'CURRENT MODEL',
  version: 'v1.4.0',
  accuracy: 84,
  adverseImpact: 0.61,
  demographicParity: 0.24,
  topBiasedFeatures: ['Graduation Year', 'Zip Code', 'University Tier'],
  color: 'cyber-pink',
  borderColor: 'border-cyber-pink/20',
  tagClass: 'tag-red',
};

const FAIRER_MODEL = {
  name: 'FAIRER ALTERNATIVE',
  version: 'v2.0-LDA',
  accuracy: 81,
  adverseImpact: 0.86,
  demographicParity: 0.09,
  topBiasedFeatures: ['Job Title Keywords'],
  color: 'cyber-cyan',
  borderColor: 'border-cyan-400/20',
  tagClass: 'tag-green',
};

function ModelCard({ model, isCurrent, improvements }) {
  const isFairer = !isCurrent;
  return (
    <div className={`cyber-panel p-6 flex flex-col gap-4 ${isFairer ? 'border border-cyan-400/15' : ''}`} style={isFairer ? {boxShadow: '0 0 30px rgba(0,255,245,0.04)'} : {}}>
      <div className="flex items-start justify-between">
        <div>
          <span className={isCurrent ? 'tag-amber' : 'tag-green'}>{isCurrent ? 'ACTIVE' : 'RECOMMENDED'}</span>
          <h3 className="text-sm font-cyber font-black tracking-wider mt-2" style={{ color: isCurrent ? '#ff2a6d' : '#00fff5' }}>{model.name}</h3>
          <p className="text-[10px] font-mono text-white/20 mt-0.5">{model.version}</p>
        </div>
        {isFairer && <TrendingUp size={20} className="text-cyber-cyan/40" />}
      </div>

      {[
        {
          label: 'ACCURACY', current: CURRENT_MODEL.accuracy, value: model.accuracy,
          format: v => `${v}%`,
          good: v => v >= 80,
          improve: FAIRER_MODEL.accuracy - CURRENT_MODEL.accuracy,
        },
        {
          label: 'ADVERSE IMPACT RATIO', current: CURRENT_MODEL.adverseImpact, value: model.adverseImpact,
          format: v => v.toFixed(2),
          good: v => v >= 0.8,
          improve: FAIRER_MODEL.adverseImpact - CURRENT_MODEL.adverseImpact,
          note: '≥0.8 = EEOC safe',
        },
        {
          label: 'DEMOGRAPHIC PARITY', current: CURRENT_MODEL.demographicParity, value: model.demographicParity,
          format: v => v.toFixed(2),
          good: v => v <= 0.1,
          improve: FAIRER_MODEL.demographicParity - CURRENT_MODEL.demographicParity,
          note: '≤0.1 = fair',
        },
      ].map(m => {
        const isImproved = isFairer && ((m.label === 'ACCURACY') ? m.improve >= 0 : m.label === 'ADVERSE IMPACT RATIO' ? m.improve > 0 : m.improve < 0);
        return (
          <div key={m.label} className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.04]">
            <div className="flex justify-between items-center mb-1">
              <span className="text-[9px] font-cyber text-white/25 tracking-wider">{m.label}</span>
              {m.note && <span className="text-[9px] font-mono text-white/15">{m.note}</span>}
            </div>
            <div className="flex items-baseline gap-2">
              <span className={`text-2xl font-cyber font-black ${m.good(m.value) ? 'neon-text' : 'neon-text-pink'}`}>{m.format(m.value)}</span>
              {isFairer && isImproved && (
                <span className="text-[10px] font-mono text-emerald-400">
                  +{m.label === 'DEMOGRAPHIC PARITY' ? Math.abs(m.improve).toFixed(2) + ' better' : m.format(Math.abs(m.improve))} ↑
                </span>
              )}
            </div>
          </div>
        );
      })}

      <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.04]">
        <p className="text-[9px] font-cyber text-white/25 tracking-wider mb-2">TOP BIASED FEATURES</p>
        <div className="flex flex-wrap gap-2">
          {model.topBiasedFeatures.map(f => (
            <span key={f} className={isCurrent ? 'tag-red' : 'tag-amber'}>{f}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function LDASuggester() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [switched, setSwitched] = useState(false);

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      <div className="flex flex-col lg:flex-row gap-6 justify-between items-start lg:items-end animate-slide-up">
        <div>
          <div className="flex items-center gap-3 mb-3">
            <div className="flex items-center gap-2 px-3 py-1 rounded border border-emerald-400/15 bg-emerald-400/[0.04]">
              <Info size={12} className="text-emerald-400" />
              <span className="text-[9px] font-mono text-emerald-400/60 tracking-widest">EEOC COMPLIANCE TOOL</span>
            </div>
          </div>
          <h1 className="text-3xl md:text-4xl font-cyber font-black tracking-wider">
            <span className="cyber-gradient">LDA SUGGESTER</span>
          </h1>
          <p className="text-white/20 mt-2 text-[10px] font-mono tracking-wider">LESS_DISCRIMINATORY_ALTERNATIVE :: MODEL_COMPARISON</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded border border-white/[0.06] bg-white/[0.02]">
          <Info size={12} className="text-white/20 shrink-0" />
          <p className="text-[10px] font-body text-white/25">LDA = Less Discriminatory Alternative, required by EEOC guidelines when a fairer model achieves comparable accuracy.</p>
        </div>
      </div>

      {switched ? (
        <div className="cyber-panel p-5 border border-emerald-400/20 animate-slide-up">
          <div className="flex items-center gap-3">
            <CheckCircle size={20} className="text-emerald-400" />
            <div>
              <p className="text-sm font-cyber font-bold text-emerald-400 tracking-wider">MODEL SWITCHED TO v2.0-LDA</p>
              <p className="text-xs font-body text-white/30 mt-1">The fairer alternative model is now active. All new scoring will use the updated pipeline.</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="cyber-panel p-4 border border-amber-400/10 animate-slide-up delay-100">
          <div className="flex items-center gap-3">
            <AlertTriangle size={16} className="text-amber-400 shrink-0" />
            <p className="text-xs font-body text-white/30">A fairer alternative model has been identified that reduces adverse impact by <strong className="text-amber-400">+0.25</strong> with only <strong className="text-white/60">3% accuracy trade-off</strong>. EEOC guidelines recommend switching when a less discriminatory alternative exists.</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-slide-up delay-200">
        <ModelCard model={CURRENT_MODEL} isCurrent={true} />
        <ModelCard model={FAIRER_MODEL} isCurrent={false} />
      </div>

      {!switched && (
        <div className="flex justify-center animate-slide-up delay-300">
          <button onClick={() => setDialogOpen(true)} className="btn-cyber flex items-center gap-3">
            <TrendingUp size={16} />
            SWITCH TO FAIRER MODEL
            <ArrowRight size={16} />
          </button>
        </div>
      )}

      {dialogOpen && (
        <>
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40" onClick={() => setDialogOpen(false)} />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md cyber-panel p-6 animate-slide-up">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-sm font-cyber font-black neon-text tracking-wider">CONFIRM MODEL SWITCH</h3>
              <button onClick={() => setDialogOpen(false)} className="p-1 hover:bg-white/[0.05] rounded text-white/20"><X size={16} /></button>
            </div>
            <p className="text-xs font-body text-white/35 leading-relaxed mb-6">
              Switching to <strong className="text-cyber-cyan">v2.0-LDA</strong> will affect all future scoring. This action will be logged in the audit trail. Are you sure?
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDialogOpen(false)} className="btn-ghost-cyber flex-1 text-[10px]">CANCEL</button>
              <button onClick={() => { setDialogOpen(false); setSwitched(true); }} className="btn-cyber flex-1 text-[10px]">CONFIRM SWITCH</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
