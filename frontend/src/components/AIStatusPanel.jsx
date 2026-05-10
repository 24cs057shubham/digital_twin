import React, { useState } from 'react';
import { Activity, BrainCircuit, PlayCircle, X } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export const AIStatusPanel = ({ analysis, onRunSim }) => {
    const [simResults, setSimResults] = useState(null);
    const [loading, setLoading] = useState(false);

    const runSimulation = async () => {
        setLoading(true);
        try {
            // In real app, this is an API call
            const res = await fetch('http://localhost:8000/api/simulate-future', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ hours: 4 })
            });
            const data = await res.json();
            setSimResults(data.projection);
        } catch (e) {
            console.error(e);
        }
        setLoading(false);
    };

    return (
        <div className="glass-panel p-6 rounded-2xl h-full flex flex-col relative overflow-hidden">
            {/* Background circuit pulse animation effect could go here */}

            <div className="flex justify-between items-start mb-4">
                <h2 className="text-lg font-bold flex items-center gap-2 text-purple-400">
                    <BrainCircuit size={20} /> Cortex AI Layer
                </h2>
                <button
                    onClick={runSimulation}
                    className="flex items-center gap-2 bg-purple-600 hover:bg-purple-500 px-3 py-1 rounded text-xs font-bold transition-all shadow-lg shadow-purple-900/50"
                >
                    <PlayCircle size={14} /> {loading ? 'Simulating...' : 'Run "What-If"'}
                </button>
            </div>

            {/* Dynamic Alerts */}
            <div className="flex-1 space-y-2 overflow-y-auto mb-4 custom-scrollbar">
                {analysis?.alerts && analysis.alerts.length > 0 ? (
                    analysis.alerts.map((alert, i) => (
                        <div key={i} className="bg-red-500/10 border-l-2 border-red-500 p-3 text-xs text-red-200 animate-pulse">
                            <span className="font-bold">ANOMALY:</span> {alert}
                        </div>
                    ))
                ) : (
                    <div className="text-gray-500 text-xs text-center py-4 border border-dashed border-gray-700 rounded">
                        System Optimal. No anomalies detected.
                    </div>
                )}

                {/* RUL Message */}
                {analysis?.rul_prediction && (
                    <div className="bg-orange-500/10 border-l-2 border-orange-500 p-3 text-xs text-orange-300">
                        <span className="font-bold">MAINTENANCE:</span> {analysis.rul_prediction}
                    </div>
                )}
            </div>

            {/* Simulation Modal Overlay */}
            {simResults && (
                <div className="absolute inset-0 bg-gray-900/95 z-20 p-4 flex flex-col backdrop-blur-xl">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-purple-400 font-bold">Projected Product Purity (4H)</h3>
                        <button onClick={() => setSimResults(null)}><X size={18} /></button>
                    </div>
                    <div className="flex-1">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={simResults}>
                                <defs>
                                    <linearGradient id="colorPurity" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#a855f7" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <XAxis dataKey="time" hide />
                                <YAxis domain={[90, 100]} hide />
                                <Tooltip contentStyle={{ backgroundColor: '#000', border: '1px solid #333' }} />
                                <Area type="monotone" dataKey="purity" stroke="#a855f7" fillOpacity={1} fill="url(#colorPurity)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                    <p className="text-[10px] text-gray-500 mt-2 text-center">
                        Monte Carlo Projection based on current Arrhenius kinetics.
                    </p>
                </div>
            )}
        </div>
    );
};
