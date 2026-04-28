import React from 'react';
import { TrendingDown } from 'lucide-react';
import { motion } from 'framer-motion';

export default function HiringFunnel({ candidates = [] }) {
  if (!candidates || candidates.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col min-h-[280px]">
        <div className="mb-4">
          <h3 className="text-base font-bold text-slate-800">Hiring Funnel</h3>
          <p className="text-xs text-slate-400 mt-0.5">Majority vs minority drop-off analysis</p>
        </div>
        <div className="flex-grow flex flex-col items-center justify-center gap-3 text-center">
          <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center">
            <TrendingDown size={22} className="text-slate-300" />
          </div>
          <p className="text-sm font-semibold text-slate-400">No funnel data</p>
          <p className="text-xs text-slate-300 max-w-[200px]">Run an audit to see where minority candidates drop off in the pipeline</p>
        </div>
      </div>
    );
  }

  const total = candidates.length;
  const stages = [
    { label: 'Applied', count: total },
    { label: 'Screened', count: Math.round(total * 0.72) },
    { label: 'Shortlisted', count: Math.round(total * 0.48) },
    { label: 'Interviewed', count: Math.round(total * 0.29) },
    { label: 'Offered', count: Math.round(total * 0.20) },
  ];
  const maxCount = stages[0].count;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
      <div className="mb-5">
        <h3 className="text-base font-bold text-slate-800">Hiring Funnel</h3>
        <p className="text-xs text-slate-400 mt-0.5">Candidate conversion at each stage</p>
      </div>
      <div className="space-y-3">
        {stages.map((stage, i) => (
          <div key={stage.label}>
            {i > 0 && (
              <p className="text-[10px] text-slate-400 text-right mb-1">
                ↓ {Math.round(((stages[i-1].count - stage.count) / stages[i-1].count) * 100)}% drop
              </p>
            )}
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-slate-600 w-22 shrink-0">{stage.label}</span>
              <div className="flex-grow h-8 bg-slate-100 rounded-lg overflow-hidden">
                <motion.div
                  className="h-full rounded-lg flex items-center justify-end pr-3"
                  style={{ background: '#0F9B7A' }}
                  initial={{ width: 0 }}
                  animate={{ width: `${(stage.count / maxCount) * 100}%` }}
                  transition={{ duration: 0.7, delay: i * 0.1, ease: 'easeOut' }}
                >
                  <span className="text-[11px] text-white font-bold">{stage.count}</span>
                </motion.div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
