import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, Loader2, FileSearch, Shield, Brain, BarChart3, FileText } from 'lucide-react';

const STEPS = [
  { id: 1, icon: FileSearch, label: 'Parsing & extracting resume text', preview: 'Extracting raw text from PDF using pdfminer + Tesseract OCR fallback...' },
  { id: 2, icon: Shield, label: 'Anonymising PII & redacting bias signals', preview: 'Redacting name, email, address, phone, gender pronouns...' },
  { id: 3, icon: Brain, label: 'Running HuggingFace bias classifier', preview: 'Sending chunks to valurank/distilroberta-bias... detecting bias patterns...' },
  { id: 4, icon: BarChart3, label: 'Scoring against JD rubric criteria', preview: 'Weighting: Skills 35% · Projects 25% · Problem Solving 20% · Comm 10% · Teamwork 10%' },
  { id: 5, icon: FileText, label: 'Generating compliance audit report', preview: 'Computing fairlearn metrics: Demographic Parity, Equalized Odds, Disparate Impact...' },
];

export default function AnalysisOverlay({ onComplete }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [doneSteps, setDoneSteps] = useState([]);

  useEffect(() => {
    let step = 0;
    const interval = setInterval(() => {
      setCurrentStep(step);
      if (step > 0) setDoneSteps(prev => [...prev, step]);
      step++;
      if (step > STEPS.length) {
        clearInterval(interval);
        setTimeout(onComplete, 800);
      }
    }, 1400);
    return () => clearInterval(interval);
  }, [onComplete]);

  const progress = Math.round((doneSteps.length / STEPS.length) * 100);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F2B4C]/95 backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0.92, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 22 }}
        className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-xl mx-4"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#0F2B4C] text-white text-sm font-bold">
            <div className="w-2 h-2 rounded-full bg-[#0F9B7A] animate-pulse" />
            Running FairHire Analysis
          </div>
        </div>

        <div className="mb-6">
          <div className="flex justify-between text-xs font-bold mb-2">
            <span className="text-slate-500">Analysis Progress</span>
            <span className="text-[#0F9B7A]">{progress}%</span>
          </div>
          <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ background: 'linear-gradient(90deg, #0F9B7A, #0F2B4C)' }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
            />
          </div>
        </div>

        <div className="space-y-3 mb-6">
          {STEPS.map((step) => {
            const isDone = doneSteps.includes(step.id);
            const isActive = currentStep === step.id;
            const Icon = step.icon;

            return (
              <motion.div
                key={step.id}
                className="flex items-center gap-4 p-3 rounded-xl transition-all"
                style={{
                  background: isActive ? '#F0FDF4' : isDone ? '#F8FAFC' : 'transparent',
                  border: isActive ? '1px solid #BBF7D0' : '1px solid transparent',
                }}
                animate={isActive ? { scale: [1, 1.01, 1] } : {}}
                transition={{ repeat: 2, duration: 0.4 }}
              >
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{
                  background: isDone ? '#DCFCE7' : isActive ? '#EFF6FF' : '#F1F5F9',
                }}>
                  {isDone
                    ? <CheckCircle size={18} className="text-emerald-600" />
                    : isActive
                      ? <Loader2 size={18} className="text-blue-500 animate-spin" />
                      : <Icon size={18} className="text-slate-300" />
                  }
                </div>
                <div className="flex-grow min-w-0">
                  <p className={`text-sm font-semibold truncate ${isDone ? 'text-slate-400' : isActive ? 'text-slate-800' : 'text-slate-300'}`}>
                    {step.label}
                  </p>
                  {isActive && (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-[10px] font-mono text-slate-400 mt-1 truncate"
                    >
                      {step.preview}
                    </motion.p>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>

        <AnimatePresence>
          {doneSteps.length === STEPS.length && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-3 p-4 rounded-xl bg-emerald-50 border border-emerald-200"
            >
              <CheckCircle size={20} className="text-emerald-600 shrink-0" />
              <div>
                <p className="text-sm font-bold text-emerald-800">Analysis Complete!</p>
                <p className="text-xs text-emerald-600 mt-0.5">Redirecting to dashboard…</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}
