import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const data = [
  { feature: 'Experience Yrs', importance: 0.15 },
  { feature: 'Python Skill', importance: 0.12 },
  { feature: 'System Design', importance: 0.08 },
  { feature: 'Project Mgmt', importance: 0.05 },
  { feature: 'Implied Age', importance: 0.01 },
  { feature: 'Name Origin', importance: 0.002 },
];

export default function BiasChart() {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e5e7eb" />
        <XAxis type="number" hide />
        <YAxis 
          dataKey="feature" 
          type="category" 
          axisLine={false} 
          tickLine={false} 
          tick={{ fill: '#4b5563', fontSize: 13, fontWeight: 600 }}
          width={120}
        />
        <Tooltip 
          cursor={{ fill: '#f3f4f6' }}
          contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
        />
        <Bar 
          dataKey="importance" 
          fill="#3b82f6" 
          radius={[0, 4, 4, 0]}
          barSize={24}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
