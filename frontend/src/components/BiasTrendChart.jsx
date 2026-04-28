import React from 'react';
import { Activity } from 'lucide-react';

export default function BiasTrendChart() {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col gap-4 h-full min-h-[300px]">
      <div>
        <h3 className="text-base font-bold text-slate-800">Bias Trend</h3>
        <p className="text-xs text-slate-400 mt-0.5">Weekly fairness score history</p>
      </div>
      <div className="flex-grow flex flex-col items-center justify-center text-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center">
          <Activity size={22} className="text-slate-300" />
        </div>
        <p className="text-sm font-semibold text-slate-400">No trend data yet</p>
        <p className="text-xs text-slate-300 max-w-[200px]">Run multiple audits over time to see the trend chart populate</p>
      </div>
    </div>
  );
}
