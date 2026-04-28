import React, { useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Legend
} from 'recharts';
import { AlertTriangle, TrendingDown, Activity, ChevronDown } from 'lucide-react';

const BASE_DATA = {
  'All Roles': [
    { week: 'W1', score: 82 }, { week: 'W2', score: 79 }, { week: 'W3', score: 77 },
    { week: 'W4', score: 75 }, { week: 'W5', score: 74 }, { week: 'W6', score: 71 },
    { week: 'W7', score: 69 }, { week: 'W8', score: 72 }, { week: 'W9', score: 68 },
    { week: 'W10', score: 65 }, { week: 'W11', score: 63 }, { week: 'W12', score: 60 },
  ],
  'Software Engineer': [
    { week: 'W1', score: 85 }, { week: 'W2', score: 84 }, { week: 'W3', score: 80 },
    { week: 'W4', score: 78 }, { week: 'W5', score: 76 }, { week: 'W6', score: 74 },
    { week: 'W7', score: 72 }, { week: 'W8', score: 71 }, { week: 'W9', score: 73 },
    { week: 'W10', score: 70 }, { week: 'W11', score: 68 }, { week: 'W12', score: 65 },
  ],
  'Product Manager': [
    { week: 'W1', score: 80 }, { week: 'W2', score: 76 }, { week: 'W3', score: 73 },
    { week: 'W4', score: 71 }, { week: 'W5', score: 70 }, { week: 'W6', score: 67 },
    { week: 'W7', score: 64 }, { week: 'W8', score: 66 }, { week: 'W9', score: 62 },
    { week: 'W10', score: 59 }, { week: 'W11', score: 57 }, { week: 'W12', score: 55 },
  ],
  'Data Scientist': [
    { week: 'W1', score: 88 }, { week: 'W2', score: 87 }, { week: 'W3', score: 85 },
    { week: 'W4', score: 83 }, { week: 'W5', score: 82 }, { week: 'W6', score: 80 },
    { week: 'W7', score: 78 }, { week: 'W8', score: 76 }, { week: 'W9', score: 74 },
    { week: 'W10', score: 73 }, { week: 'W11', score: 72 }, { week: 'W12', score: 74 },
  ],
};

const ROLES = Object.keys(BASE_DATA);
const THRESHOLD = 70;

const CyberTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const score = payload[0].value;
    const below = score < THRESHOLD;
    return (
      <div className="cyber-panel px-4 py-3 min-w-[120px]">
        <p className="text-[10px] font-cyber text-white/30 tracking-widest mb-1">{label}</p>
        <p className={`text-lg font-cyber font-black ${below ? 'neon-text-pink' : 'neon-text'}`}>{score}</p>
        {below && <p className="text-[9px] font-mono text-cyber-pink/60 mt-1">BELOW THRESHOLD</p>}
      </div>
    );
  }
  return null;
};

export default function DriftMonitor() {
  const [selectedRole, setSelectedRole] = useState('All Roles');
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const data = BASE_DATA[selectedRole];
  const latestScore = data[data.length - 1].score;
  const isDrifting = latestScore < THRESHOLD;
  const trend = latestScore - data[0].score;

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      <div className="flex flex-col lg:flex-row gap-6 justify-between items-start lg:items-end animate-slide-up">
        <div>
          <div className="flex items-center gap-3 mb-3">
            <div className="flex items-center gap-2 px-3 py-1 rounded border border-cyan-400/15 bg-cyan-400/[0.04]">
              <Activity size={12} className="text-cyber-cyan" />
              <span className="text-[9px] font-mono text-cyber-cyan/60 tracking-widest">LIVE MONITOR</span>
            </div>
          </div>
          <h1 className="text-3xl md:text-4xl font-cyber font-black tracking-wider">
            <span className="cyber-gradient">DRIFT MONITOR</span>
          </h1>
          <p className="text-white/20 mt-2 text-[10px] font-mono tracking-wider">FAIRNESS_SCORE :: 12_WEEK_TREND</p>
        </div>

        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="btn-ghost-cyber flex items-center gap-3 min-w-[200px] justify-between"
          >
            <span className="text-[10px]">{selectedRole.toUpperCase()}</span>
            <ChevronDown size={14} className={`transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
          </button>
          {dropdownOpen && (
            <div className="absolute right-0 top-full mt-2 w-full cyber-panel z-20 overflow-hidden">
              {ROLES.map(role => (
                <button
                  key={role}
                  onClick={() => { setSelectedRole(role); setDropdownOpen(false); }}
                  className={`w-full px-4 py-3 text-left text-[10px] font-cyber tracking-wider transition-all duration-200 ${selectedRole === role ? 'neon-text bg-cyan-400/[0.08]' : 'text-white/30 hover:text-cyber-cyan/70 hover:bg-cyan-400/[0.04]'}`}
                >
                  {role.toUpperCase()}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {isDrifting && (
        <div className="animate-slide-up relative overflow-hidden rounded-lg border border-cyber-pink/30 bg-cyber-pink/[0.07] p-4">
          <div className="absolute inset-0 bg-cyber-pink/[0.03] animate-pulse" />
          <div className="relative flex items-start gap-4">
            <div className="w-10 h-10 rounded-lg border border-cyber-pink/30 bg-cyber-pink/[0.1] flex items-center justify-center shrink-0">
              <AlertTriangle size={20} className="text-cyber-pink animate-pulse" />
            </div>
            <div>
              <p className="text-sm font-cyber font-bold text-cyber-pink tracking-wider">BIAS DRIFT DETECTED</p>
              <p className="text-xs font-body text-white/40 mt-1">
                Fairness score dropped to <strong className="text-cyber-pink">{latestScore}</strong> — below threshold of {THRESHOLD}. Model may need retraining or recalibration.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-slide-up delay-100">
        {[
          { label: 'LATEST SCORE', value: latestScore, color: isDrifting ? 'neon-text-pink' : 'neon-text' },
          { label: 'THRESHOLD', value: THRESHOLD, color: 'text-amber-400' },
          { label: '12W TREND', value: `${trend > 0 ? '+' : ''}${trend}`, color: trend >= 0 ? 'neon-text' : 'neon-text-pink' },
        ].map(card => (
          <div key={card.label} className="stat-card">
            <p className="text-[9px] font-cyber font-bold text-white/20 tracking-[0.2em] mb-3">{card.label}</p>
            <h2 className={`text-4xl font-cyber font-black ${card.color}`}>{card.value}</h2>
          </div>
        ))}
      </div>

      <div className="cyber-panel p-6 animate-slide-up delay-200">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xs font-cyber font-bold text-white/50 tracking-wider">FAIRNESS SCORE TREND</h3>
            <p className="text-[10px] font-mono text-white/15 mt-1">weekly scan — last 12 cycles</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-0.5 bg-cyber-cyan/60" />
              <span className="text-[9px] font-mono text-white/20">SCORE</span>
            </div>
            <div className="flex items-center gap-1.5 ml-3">
              <div className="w-3 h-0.5 bg-red-500/60 border-t border-dashed border-red-500/60" style={{borderStyle:'dashed'}} />
              <span className="text-[9px] font-mono text-white/20">THRESHOLD</span>
            </div>
          </div>
        </div>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,255,245,0.04)" />
              <XAxis dataKey="week" tick={{ fill: 'rgba(0,255,245,0.3)', fontSize: 10, fontFamily: 'Share Tech Mono' }} axisLine={false} tickLine={false} />
              <YAxis domain={[40, 100]} tick={{ fill: 'rgba(0,255,245,0.3)', fontSize: 10, fontFamily: 'Share Tech Mono' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CyberTooltip />} />
              <ReferenceLine y={THRESHOLD} stroke="rgba(255, 42, 109, 0.6)" strokeDasharray="6 4" strokeWidth={2}
                label={{ value: `THRESHOLD: ${THRESHOLD}`, fill: 'rgba(255,42,109,0.6)', fontSize: 9, fontFamily: 'Share Tech Mono', position: 'right' }}
              />
              <Line
                type="monotone"
                dataKey="score"
                stroke="#00fff5"
                strokeWidth={2}
                dot={(props) => {
                  const { cx, cy, payload } = props;
                  const below = payload.score < THRESHOLD;
                  return <circle key={cx} cx={cx} cy={cy} r={4} fill={below ? '#ff2a6d' : '#00fff5'} stroke={below ? 'rgba(255,42,109,0.3)' : 'rgba(0,255,245,0.3)'} strokeWidth={6} />;
                }}
                activeDot={{ r: 6, fill: '#00fff5', stroke: 'rgba(0,255,245,0.3)', strokeWidth: 8 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
