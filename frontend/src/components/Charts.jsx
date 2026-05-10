import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

export const KPICard = ({ title, value, unit, status = 'normal', subtext }) => {
    const colors = {
        normal: 'border-gray-600 bg-gray-800',
        warning: 'border-yellow-500 bg-yellow-500/10 text-yellow-500',
        critical: 'border-red-500 bg-red-500/10 text-red-500'
    };

    return (
        <div className={`p-4 rounded-xl border ${colors[status]} transition-all relative overflow-hidden`}>
            <div className="relative z-10">
                <div className="text-gray-400 text-xs uppercase tracking-wider mb-1">{title}</div>
                <div className="text-2xl font-mono font-bold">
                    {value} <span className="text-sm font-normal text-gray-500">{unit}</span>
                </div>
                {subtext && <div className="text-xs mt-1 opacity-70">{subtext}</div>}
            </div>
        </div>
    );
};

export const LiveCharts = ({ data }) => {
    return (
        <div className="grid grid-cols-1 gap-4 h-full">
            {/* Temp & Pressure Chart */}
            <div className="h-48 bg-gray-800/50 rounded-xl p-4 border border-gray-700">
                <h3 className="text-xs text-gray-400 mb-2">Process Conditions (Temp & Pressure)</h3>
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                        <YAxis yAxisId="left" domain={[0, 150]} hide />
                        <YAxis yAxisId="right" orientation="right" domain={[0, 5]} hide />
                        <Tooltip contentStyle={{ backgroundColor: '#111', border: '1px solid #333' }} />
                        <Line yAxisId="left" type="monotone" dataKey="temperature" stroke="#ef4444" strokeWidth={2} dot={false} isAnimationActive={false} />
                        <Line yAxisId="right" type="monotone" dataKey="pressure" stroke="#fbbf24" strokeWidth={2} dot={false} isAnimationActive={false} />
                    </LineChart>
                </ResponsiveContainer>
            </div>

            {/* Stability Score (ML) */}
            <div className="h-32 bg-gray-800/50 rounded-xl p-4 border border-gray-700">
                <h3 className="text-xs text-gray-400 mb-2">ML Process Stability Score</h3>
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                        <YAxis domain={[0, 100]} hide />
                        <Tooltip contentStyle={{ backgroundColor: '#111', border: '1px solid #333' }} />
                        <Area type="monotone" dataKey="analysis.stability_score" stroke="#10b981" fill="#10b981" fillOpacity={0.2} isAnimationActive={false} />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};
