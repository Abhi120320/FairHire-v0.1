import React from 'react';
import { useParams, Link } from 'react-router-dom';
import BiasChart from '../components/BiasChart';
import { ArrowLeft, Shield, CheckCircle, AlertTriangle, EyeOff } from 'lucide-react';

export default function Report() {
  const { candidateId } = useParams();

  // Mock data for the report
  const isFair = true;
  const anonymizedText = "Experienced software engineer with 5 years in [ORG]. Proficient in Python and React. Graduated from [ORG] in [DATE]. Led a team of 4 to deliver a scalable microservice architecture.";
  const removedEntities = [
    { type: 'ORG', text: 'TechCorp Inc.' },
    { type: 'ORG', text: 'State University' },
    { type: 'DATE', text: '2020' },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in zoom-in duration-500">
      <div className="flex items-center gap-4 border-b border-gray-200 pb-6">
        <Link to="/" className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500">
          <ArrowLeft size={24} />
        </Link>
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Fairness & Explainability Report</h1>
          <p className="text-gray-500 font-medium">Candidate ID: <span className="font-mono text-gray-700">{candidateId}</span></p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Anonymization & Verdict */}
        <div className="lg:col-span-1 space-y-6">
          <div className={`glass-panel p-6 border-l-4 rounded-xl shadow-md ${isFair ? 'border-l-green-500' : 'border-l-red-500'}`}>
            <div className="flex items-start gap-4">
              {isFair ? (
                <div className="p-3 bg-green-100 text-green-600 rounded-full"><CheckCircle size={32} /></div>
              ) : (
                <div className="p-3 bg-red-100 text-red-600 rounded-full"><AlertTriangle size={32} /></div>
              )}
              <div>
                <h3 className="text-xl font-bold text-gray-900">{isFair ? 'Fairness Verified' : 'Bias Flagged'}</h3>
                <p className="text-sm text-gray-600 mt-1">This candidate evaluation lies within the accepted threshold for demographic parity.</p>
              </div>
            </div>
          </div>

          <div className="glass-panel p-6 h-[400px] flex flex-col">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-4">
              <EyeOff size={20} className="text-primary-500"/> Anonymized Resume Output
            </h3>
            <div className="bg-gray-50 flex-1 p-4 rounded-lg text-sm text-gray-700 font-mono leading-relaxed overflow-y-auto border border-gray-200">
              {anonymizedText}
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Redacted Entities</span>
              <div className="flex flex-wrap gap-2 mt-2">
                {removedEntities.map((ent, idx) => (
                  <span key={idx} className="px-2.5 py-1 bg-red-50 text-red-700 rounded-md text-xs font-bold ring-1 ring-red-100">
                    [{ent.type}]
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: AI Explanations */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-panel p-6 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Shield size={20} className="text-primary-500"/> SHAP Feature Importance
            </h3>
            <div className="h-80 w-full">
              <BiasChart />
            </div>
            <p className="text-sm text-gray-500 mt-4 bg-blue-50 p-3 rounded-lg border border-blue-100">
              <strong className="text-blue-800">Insight:</strong> The model heavily weighted experience (Years) and skills (Python, System Design) in its score prediction, with minimal weight placed on unstructured implicit markers.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
