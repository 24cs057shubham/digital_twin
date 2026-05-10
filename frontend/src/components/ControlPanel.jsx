import React, { useState } from 'react';
import { Settings, Thermometer, Gauge, Zap, Play, ClipboardList } from 'lucide-react';

export const ControlPanel = ({ onCommand, telemetry }) => {
    const [temp, setTemp] = useState(45);
    const [flow, setFlow] = useState(0.8);

    const recipe = telemetry?.recipe_status;
    const isRecipeRunning = recipe && recipe !== "IDLE" && recipe !== "RECIPE COMPLETE";

    const send = (key, val) => onCommand({ command: 'MANUAL', [key]: val });

    return (
        <div className="glass-panel p-6 rounded-2xl h-full flex flex-col gap-6">

            {/* Automation Section */}
            <div className="bg-cyan-900/20 p-4 rounded-xl border border-cyan-800/50">
                <div className="flex items-center gap-2 mb-3 text-cyan-400 font-bold text-sm uppercase tracking-wider">
                    <ClipboardList size={16} /> Batch Automation
                </div>

                {isRecipeRunning ? (
                    <div className="space-y-2">
                        <div className="flex justify-between text-xs text-white">
                            <span>Current Step:</span>
                            <span className="font-mono text-cyan-300">{recipe.step_name}</span>
                        </div>
                        <div className="flex justify-between text-xs text-gray-400">
                            <span>Progress:</span>
                            <span>{recipe.step_index} / {recipe.total_steps}</span>
                        </div>
                        <div className="w-full bg-gray-700 h-2 rounded-full overflow-hidden">
                            <div className="bg-cyan-500 h-full animate-pulse" style={{ width: '60%' }}></div>
                        </div>
                        <div className="text-center text-[10px] text-gray-400 mt-1">
                            {recipe.time_remaining}s remaining in this phase
                        </div>
                    </div>
                ) : (
                    <button
                        onClick={() => onCommand({ START_RECIPE: true })}
                        className="w-full py-3 bg-cyan-600 hover:bg-cyan-500 rounded text-white font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-cyan-900/20"
                    >
                        <Play size={16} /> START BATCH SEQUENCE
                    </button>
                )}
            </div>

            {/* Manual Overrides */}
            <div className={`space-y-6 transition-opacity ${isRecipeRunning ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
                <div className="flex items-center gap-2 text-gray-500 font-bold text-xs uppercase">
                    <Settings size={14} /> Manual Overrides
                </div>

                <ControlSlider
                    label="Heater SP (°C)" icon={<Thermometer size={16} />}
                    value={temp} min={20} max={100} step={1} color="accent-red-500"
                    onChange={(v) => { setTemp(v); send('SET_TEMP', v); }}
                />
                <ControlSlider
                    label="Cl2 Feed (L/min)" icon={<Zap size={16} />}
                    value={flow} min={0} max={2.0} step={0.1} color="accent-green-500"
                    onChange={(v) => { setFlow(v); send('SET_CL2_FLOW', v); }}
                />
            </div>

            {/* Fault Injection */}
            <div className="mt-auto pt-6 border-t border-gray-700">
                <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => onCommand({ INJECT_BLOCKAGE: true })} className="py-2 px-4 bg-red-900/20 border border-red-900/50 rounded text-[10px] text-red-500 hover:bg-red-900/40">
                        INJECT BLOCKAGE
                    </button>
                    <button onClick={() => onCommand({ INJECT_WEAR: true })} className="py-2 px-4 bg-orange-900/20 border border-orange-900/50 rounded text-[10px] text-orange-500 hover:bg-orange-900/40">
                        WEAR BEARING
                    </button>
                </div>
            </div>
        </div>
    );
};

const ControlSlider = ({ label, icon, value, onChange, min, max, step, color }) => (
    <div>
        <div className="flex justify-between items-center mb-2 text-sm text-gray-400">
            <span className="flex items-center gap-2">{icon} {label}</span>
            <span className="font-mono text-white">{value}</span>
        </div>
        <input
            type="range"
            className={`w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer hover:bg-gray-600 transition-all ${color}`}
            min={min} max={max} step={step} value={value}
            onChange={(e) => onChange(e.target.value)}
        />
    </div>
);
