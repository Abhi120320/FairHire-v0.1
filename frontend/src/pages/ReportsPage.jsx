import React from 'react';
import { FileText, Download } from 'lucide-react';

export default function ReportsPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Compliance Reports</h1>
            <p className="text-sm text-slate-500 mt-1">Generated audit and compliance reports</p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-[#0F2B4C] text-white rounded-xl text-sm font-semibold hover:bg-[#1a3d6b] transition-colors opacity-40 cursor-not-allowed" disabled>
            <Download size={15} /> Generate Report
          </button>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col items-center justify-center py-20 gap-4 text-center">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center">
            <FileText size={26} className="text-slate-300" />
          </div>
          <p className="text-base font-bold text-slate-400">No reports generated yet</p>
          <p className="text-sm text-slate-300 max-w-xs leading-relaxed">
            Run a bias audit from the Dashboard, then use the "Generate Report" button to create a compliance PDF.
          </p>
          <div className="mt-2 px-4 py-2 rounded-full bg-slate-50 border border-slate-200">
            <p className="text-xs font-semibold text-slate-400">NYC Local Law 144 · EEOC · EU AI Act Art. 22</p>
          </div>
        </div>
      </div>
    </div>
  );
}
