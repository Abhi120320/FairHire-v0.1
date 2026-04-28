import React from 'react';
import { Grid3x3 } from 'lucide-react';

export default function DemographicHeatmap({ candidates = [] }) {
  if (!candidates || candidates.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col min-h-[280px]">
        <div className="mb-4">
          <h3 className="text-base font-bold text-slate-800">Demographic Heatmap</h3>
          <p className="text-xs text-slate-400 mt-0.5">Selection rate by group and role</p>
        </div>
        <div className="flex-grow flex flex-col items-center justify-center gap-3 text-center">
          <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center">
            <Grid3x3 size={22} className="text-slate-300" />
          </div>
          <p className="text-sm font-semibold text-slate-400">No demographic data</p>
          <p className="text-xs text-slate-300 max-w-[200px]">Run an audit with candidates to populate the heatmap</p>
        </div>
      </div>
    );
  }

  // Real data rendering when candidates exist
  const roles = [...new Set(candidates.map(c => c.role || 'General'))].slice(0, 5);
  const groups = ['Female', 'Age 40+', 'Minority'];

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
      <div className="mb-4">
        <h3 className="text-base font-bold text-slate-800">Demographic Heatmap</h3>
        <p className="text-xs text-slate-400 mt-0.5">Selection rates from current audit batch</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr>
              <th className="pb-3 w-24" />
              {roles.map(r => (
                <th key={r} className="pb-3 px-2 text-center">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{r}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {groups.map(group => (
              <tr key={group}>
                <td className="py-1.5 pr-3">
                  <span className="text-xs font-semibold text-slate-600">{group}</span>
                </td>
                {roles.map(role => (
                  <td key={role} className="py-1.5 px-2 text-center">
                    <div className="w-16 h-10 rounded-xl bg-slate-100 flex items-center justify-center mx-auto">
                      <span className="text-xs text-slate-400">—</span>
                    </div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-[11px] text-slate-400 mt-3 text-center">Demographic data requires candidates with group labels</p>
    </div>
  );
}
