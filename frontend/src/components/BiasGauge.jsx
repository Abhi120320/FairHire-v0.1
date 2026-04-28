import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Activity, AlertTriangle, ShieldCheck } from 'lucide-react';

function getGrade(score) {
  if (score <= 20) return { label: 'A', color: '#16A34A', bg: '#DCFCE7', text: 'Excellent - Negligible Bias' };
  if (score <= 40) return { label: 'B', color: '#0F9B7A', bg: '#CCFBF1', text: 'Good - Low Risk' };
  if (score <= 60) return { label: 'C', color: '#D97706', bg: '#FEF3C7', text: 'Fair - Moderate Risk' };
  if (score <= 80) return { label: 'D', color: '#EA580C', bg: '#FFEDD5', text: 'Warning - High Bias Detected' };
  return { label: 'F', color: '#DC2626', bg: '#FEE2E2', text: 'Critical - Extreme Bias' };
}

function getScoreColor(score) {
  if (score <= 30) return '#16A34A';
  if (score <= 60) return '#D97706';
  return '#DC2626';
}

export default function BiasGauge({ score = null, genderBias = null, ageBias = null, ethnicityBias = null }) {
  const [animScore, setAnimScore] = useState(0);

  useEffect(() => {
    if (score === null) return;
    const timer = setTimeout(() => setAnimScore(score), 300);
    return () => clearTimeout(timer);
  }, [score]);

  if (score === null) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col items-center justify-center h-full min-h-[300px] gap-3">
        <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center">
          <Activity size={22} className="text-slate-300" />
        </div>
        <p className="text-sm font-semibold text-slate-400">Risk Assessment</p>
        <p className="text-xs text-slate-300 text-center max-w-[180px]">Run an audit to view the risk analysis</p>
      </div>
    );
  }

  const grade = getGrade(animScore);
  const scoreColor = getScoreColor(animScore);

  const miniBars = [
    { label: 'Gender Bias', score: genderBias },
    { label: 'Age Bias', score: ageBias },
    { label: 'Ethnicity Bias', score: ethnicityBias },
  ].filter(b => b.score !== null);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col h-full justify-between">
      <div>
        <div className="flex items-start justify-between mb-8">
          <div>
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
              Overall Risk Score
            </h3>
            <div className="flex items-center gap-1.5 mt-1">
              {animScore <= 30 ? (
                <ShieldCheck size={14} className="text-emerald-600" />
              ) : (
                <AlertTriangle size={14} style={{ color: scoreColor }} />
              )}
              <p className="text-xs font-medium" style={{ color: scoreColor }}>{grade.text}</p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-5xl font-black leading-none tracking-tighter" style={{ color: scoreColor }}>
              {animScore}
            </span>
            <span className="text-sm font-bold text-slate-400 ml-1">/ 100</span>
          </div>
        </div>

        {/* Linear Gradient Scale */}
        <div className="relative pt-2 pb-4">
          {/* Gradient Track */}
          <div className="h-5 rounded-full w-full relative overflow-hidden shadow-inner" style={{
            background: 'linear-gradient(to right, #16A34A 0%, #EAB308 50%, #DC2626 100%)'
          }} />
          
          {/* Segment Separators */}
          <div className="absolute top-2 bottom-4 left-0 right-0 flex pointer-events-none opacity-40 mix-blend-overlay">
            {[20, 40, 60, 80].map(mark => (
              <div key={mark} className="w-[2px] h-full bg-white absolute" style={{ left: `${mark}%` }} />
            ))}
          </div>

          {/* Draggable/Animated Marker */}
          <motion.div 
            initial={{ left: '0%' }}
            animate={{ left: `${animScore}%` }}
            transition={{ type: 'spring', stiffness: 90, damping: 20 }}
            className="absolute top-0 w-6 h-9 -ml-3 flex flex-col items-center drop-shadow-md z-10"
          >
            <div className="w-4 h-9 bg-slate-900 rounded-md border-2 border-white shadow-sm flex items-center justify-center">
              <div className="w-0.5 h-3 bg-white/60 rounded-full" />
            </div>
          </motion.div>
          
          <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-4">
            <span>Low Risk</span>
            <span>High Risk</span>
          </div>
        </div>
      </div>

      {miniBars.length > 0 && (
        <div className="space-y-4 mt-6 border-t border-slate-100 pt-5">
          <p className="text-xs font-bold text-slate-800 uppercase tracking-wide mb-1">Category Breakdown</p>
          {miniBars.map(bar => (
            <div key={bar.label}>
              <div className="flex justify-between text-xs font-semibold mb-1.5">
                <span className="text-slate-600">{bar.label}</span>
                <span style={{ color: getScoreColor(bar.score) }}>{bar.score.toFixed(0)}</span>
              </div>
              <div className="h-2 rounded-full bg-slate-100 overflow-hidden relative">
                <motion.div initial={{ width: 0 }} animate={{ width: `${bar.score}%` }}
                  transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}
                  className="absolute left-0 top-0 bottom-0 rounded-full" 
                  style={{ background: getScoreColor(bar.score) }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
