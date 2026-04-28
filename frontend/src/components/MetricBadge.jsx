import React from 'react';
import { CheckCircle, AlertOctagon } from 'lucide-react';

export default function MetricBadge({ isFair }) {
  if (isFair) {
    return (
      <div className="flex items-center gap-1.5 px-3 py-1 bg-green-50 text-green-700 rounded-full border border-green-200 shadow-sm">
        <CheckCircle size={14} className="stroke-[3px]" />
        <span className="text-xs font-bold tracking-wide">FAIR</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5 px-3 py-1 bg-red-50 text-red-700 rounded-full border border-red-200 shadow-sm">
      <AlertOctagon size={14} className="stroke-[3px]" />
      <span className="text-xs font-bold tracking-wide">FLAGGED</span>
    </div>
  );
}
