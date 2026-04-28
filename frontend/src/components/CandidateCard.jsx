import React from 'react';
import { Link } from 'react-router-dom';
import MetricBadge from './MetricBadge';
import { ChevronRight } from 'lucide-react';

export default function CandidateCard({ candidate }) {
  return (
    <div className="p-5 flex items-center justify-between hover:bg-gray-50 transition-colors group">
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-3">
          <span className="font-mono text-sm font-bold text-gray-900 bg-gray-100 px-2 py-0.5 rounded">ID: {candidate.id}</span>
          <span className="text-xs font-semibold text-gray-500">{candidate.date}</span>
        </div>
        <div className="flex items-center gap-2 mt-1">
          {candidate.skills.slice(0, 3).map((skill, i) => (
            <span key={i} className="text-xs font-medium px-2.5 py-1 bg-blue-50 text-blue-700 rounded-md ring-1 ring-blue-100">
              {skill}
            </span>
          ))}
          {candidate.skills.length > 3 && (
            <span className="text-xs font-medium text-gray-500">+{candidate.skills.length - 3}</span>
          )}
        </div>
      </div>
      
      <div className="flex items-center gap-8">
        <div className="text-right">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Score</p>
          <p className="text-xl font-black text-gray-900">{candidate.score}</p>
        </div>
        
        <MetricBadge isFair={candidate.isFair} />

        <Link 
          to={`/report/${candidate.id}`} 
          className="text-gray-400 group-hover:text-primary-600 p-2 rounded-full group-hover:bg-primary-50 transition-all"
        >
          <ChevronRight size={20} />
        </Link>
      </div>
    </div>
  );
}
