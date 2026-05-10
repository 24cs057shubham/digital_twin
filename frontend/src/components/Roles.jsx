import React, { useState, useEffect } from 'react';
import {
    User, ShieldAlert, Heart, Activity, Zap, DollarSign,
    TrendingUp, Lock, FileText, Settings, AlertTriangle,
    PlayCircle, StopCircle, RotateCcw, Thermometer, Gauge,
    Droplets, Timer, Beaker, CheckCircle2, Download, Wind
} from 'lucide-react';
import {
    RecipeStepsPanel,
    LiveMonitoringPanel,
    BatchReportPanel,
    InterlockStatusPanel
} from './RecipePanel';

/**
 * Worker View - Operator Interface
 * Primary control panel for plant operators
 */
export const WorkerView = ({ telemetry, onCommand }) => {
    // Sync with live telemetry values
    const [cl2, setCl2] = useState(0);
    const [rpm, setRpm] = useState(100);
    const [cooling, setCooling] = useState(50);
    const [discharge, setDischarge] = useState(0);
    const [hr, setHr] = useState(75);

    // Sync local state with telemetry when it updates
    React.useEffect(() => {
        if (telemetry?.inputs) {
            if (telemetry.inputs.cl2 !== undefined) setCl2(telemetry.inputs.cl2);
            if (telemetry.inputs.rpm !== undefined) setRpm(telemetry.inputs.rpm);
            if (telemetry.inputs.cooling !== undefined) setCooling(telemetry.inputs.cooling);
            if (telemetry.inputs.discharge !== undefined) setDischarge(telemetry.inputs.discharge);
        }
        if (telemetry?.worker_heart_rate !== undefined) setHr(telemetry.worker_heart_rate);
    }, [telemetry]);

    const update = (key, val) => {
        const numVal = parseFloat(val);
        onCommand({ [key]: numVal });
        // Immediate local update for responsive UI
        if (key === 'cl2_valve') setCl2(numVal);
        if (key === 'agitator_rpm') setRpm(numVal);
        if (key === 'cooling_valve') setCooling(numVal);
        if (key === 'discharge_valve') setDischarge(numVal);
        if (key === 'worker_heart_rate') setHr(numVal);
    };

    const isDeadMan = telemetry?.safety_scram;
    const interlockMsg = telemetry?.interlock_msg;

    return (
        <div className="h-full flex flex-col gap-4 overflow-y-auto">
            {/* Dead Man / Scram Overlay */}
            {isDeadMan && (
                <div className="bg-red-900/90 absolute inset-0 z-50 flex items-center justify-center flex-col backdrop-blur">
                    <ShieldAlert size={64} className="text-red-500 animate-pulse mb-4" />
                    <h1 className="text-3xl font-bold text-white">EMERGENCY SCRAM ACTIVE</h1>
                    <p className="text-gray-300 mb-8">Biometric Stress Threshold Exceeded</p>
                    <button
                        onClick={() => { update('reset_safety', true); update('worker_heart_rate', 75); setHr(75); }}
                        className="bg-red-600 hover:bg-red-500 px-8 py-3 rounded font-bold transition-all hover:scale-105 active:scale-95 shadow-lg"
                    >
                        OVERRIDE & RESET
                    </button>
                </div>
            )}

            {/* Live Monitoring Dashboard */}
            <LiveMonitoringPanel telemetry={telemetry} />

            {/* Recipe Steps Panel */}
            <RecipeStepsPanel recipeDetail={telemetry?.recipe_detail} onCommand={onCommand} />

            {/* Manual Control Panel */}
            <div className="glass-panel p-4 rounded-xl border-l-4 border-cyan-500 shadow-xl">
                <h2 className="text-cyan-400 font-bold mb-4 flex items-center gap-2 text-sm">
                    <User size={16} /> MANUAL CONTROLS
                </h2>

                {/* Interlock Warning */}
                {interlockMsg && (
                    <div className="bg-orange-500/20 border border-orange-500 text-orange-200 p-3 rounded mb-4 text-xs font-bold animate-pulse">
                        ⚠ {interlockMsg}
                    </div>
                )}

                <div className="space-y-6">
                    {/* Chlorine Feed Control */}
                    <ControlSlider
                        label="Chlorine Feed Valve"
                        value={cl2}
                        min={0}
                        max={100}
                        unit="%"
                        color="cyan"
                        icon={<Droplets size={14} />}
                        onChange={(val) => { setCl2(val); update('cl2_valve', val); }}
                        warning={telemetry?.temp < 70 && cl2 > 0}
                        warningText="Temp below 70°C"
                    />

                    {/* Agitator RPM Control */}
                    <ControlSlider
                        label="Agitator RPM"
                        value={rpm}
                        min={0}
                        max={300}
                        unit="RPM"
                        color="purple"
                        icon={<Wind size={14} />}
                        onChange={(val) => { setRpm(val); update('agitator_rpm', val); }}
                    />

                    {/* Cooling Valve Control */}
                    <ControlSlider
                        label="Cooling Valve"
                        value={cooling}
                        min={0}
                        max={100}
                        unit="%"
                        color="blue"
                        icon={<Thermometer size={14} />}
                        onChange={(val) => { setCooling(val); update('cooling_valve', val); }}
                    />

                    {/* Discharge Valve (Interlocked) */}
                    <ControlSlider
                        label="Discharge Valve"
                        value={discharge}
                        min={0}
                        max={100}
                        unit="%"
                        color="red"
                        icon={<Gauge size={14} />}
                        onChange={(val) => { setDischarge(val); update('discharge_valve', val); }}
                        interlocked
                        interlockedConditions={[
                            { label: 'Pressure < 1.2 bar', met: telemetry?.pressure < 1.2 },
                            { label: 'Temp < 60°C', met: telemetry?.temp < 60 }
                        ]}
                    />

                    {/* Biometric Simulator */}
                    <div className="pt-4 border-t border-gray-700">
                        <ControlSlider
                            label="Sim Heart Rate"
                            value={hr}
                            min={60}
                            max={180}
                            unit="BPM"
                            color="red"
                            icon={<Heart size={14} className="animate-pulse" />}
                            onChange={(val) => { setHr(val); update('worker_heart_rate', val); }}
                            warning={hr > 120}
                            critical={hr > 150}
                            warningText={hr > 150 ? 'DEAD-MAN TRIGGER!' : 'Elevated'}
                        />
                        <div className="text-[10px] text-gray-500 mt-2 text-center">
                            (&gt; 150 BPM triggers Dead-Man Switch)
                        </div>
                    </div>
                </div>
            </div>

            {/* Interlock Status */}
            <InterlockStatusPanel telemetry={telemetry} />
        </div>
    );
};

/**
 * Owner View - Strategist/Engineer Interface
 * Advanced controls, PID tuning, batch parameters, and fault injection
 */
export const OwnerView = ({ telemetry, onCommand }) => {
    const [recipeType, setRecipeType] = useState('Standard');
    const [pid, setPid] = useState({ kp: 2.0, ki: 0.1, kd: 0.5 });
    const [batchSizeG, setBatchSizeG] = useState(1000);
    const [reactionTemp, setReactionTemp] = useState(75);
    const [cl2Flow, setCl2Flow] = useState(20);

    // Sync values from telemetry
    useEffect(() => {
        if (telemetry?.initial_phenol_g !== undefined) setBatchSizeG(telemetry.initial_phenol_g);
        if (telemetry?.reaction_temp_c !== undefined) setReactionTemp(telemetry.reaction_temp_c);
        if (telemetry?.cl2_flow_lph !== undefined) setCl2Flow(telemetry.cl2_flow_lph);
    }, [telemetry]);

    const sendPID = () => {
        onCommand({ pid_tune: pid });
    };

    const loadRecipe = () => {
        let recipeData = [];
        if (recipeType === 'Standard') {
            recipeData = [
                { state: "HEATING", desc: "Standard Pre-heat", temp_setpoint: 60.0, duration: 15 },
                { state: "REACTING", desc: "Chlorine Dose", temp_setpoint: 65.0, duration: 30 },
                { state: "COOLING", desc: "Cooling Phase", temp_setpoint: 25.0, duration: 15 }
            ];
        } else if (recipeType === 'HighPurity') {
            recipeData = [
                { state: "HEATING", desc: "Slow Heat Ramp", temp_setpoint: 55.0, duration: 30 },
                { state: "REACTING", desc: "Extended Reaction", temp_setpoint: 60.0, duration: 60 },
                { state: "COOLING", desc: "Rapid Cool", temp_setpoint: 20.0, duration: 20 }
            ];
        } else if (recipeType === 'Maintenance') {
            recipeData = [
                { state: "IDLE", desc: "System Flush", temp_setpoint: 80.0, duration: 10 },
                { state: "COOLING", desc: "Safety Cool", temp_setpoint: 30.0, duration: 10 }
            ];
        }
        onCommand({ RECIPE_CMD: "LOAD", RECIPE_DATA: recipeData });
    };

    return (
        <div className="h-full min-h-0 flex flex-col gap-4 overflow-y-auto">

            {/* Recipe Steps Panel */}
            <RecipeStepsPanel recipeDetail={telemetry?.recipe_detail} onCommand={onCommand} />

            {/* Live Monitoring */}
            <LiveMonitoringPanel telemetry={telemetry} />

            <div className="glass-panel p-6 rounded-2xl border-l-4 border-yellow-500 flex flex-col gap-6 shadow-xl">
                <h2 className="text-yellow-400 font-bold flex items-center gap-2 text-lg">
                    <Lock size={20} /> STRATEGIST VIEW
                </h2>

                {/* --- BATCH PARAMETERS --- */}
                <div className="bg-gray-900/50 p-4 rounded-xl border border-gray-700">
                    <h3 className="text-xs font-bold text-gray-400 mb-3 flex items-center gap-2">
                        <Settings size={12} /> BATCH PARAMETERS
                    </h3>
                    <div className="space-y-3">
                        <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-400">Initial Phenol Amount</span>
                            <select
                                className="bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white"
                                value={batchSizeG}
                                onChange={(e) => {
                                    const val = parseInt(e.target.value, 10);
                                    setBatchSizeG(val);
                                    onCommand({ initial_phenol_g: val });
                                }}
                            >
                                <option value={500}>500 g</option>
                                <option value={1000}>1000 g (1.0 kg)</option>
                                <option value={1500}>1500 g</option>
                            </select>
                        </div>

                        <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-400">Reaction Temperature</span>
                            <select
                                className="bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white"
                                value={reactionTemp}
                                onChange={(e) => {
                                    const val = parseInt(e.target.value, 10);
                                    setReactionTemp(val);
                                    onCommand({ reaction_temp_c: val });
                                }}
                            >
                                <option value={70}>70°C</option>
                                <option value={75}>75°C (Standard)</option>
                                <option value={80}>80°C</option>
                            </select>
                        </div>

                        <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-400">Chlorine Flow Rate</span>
                            <select
                                className="bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white"
                                value={cl2Flow}
                                onChange={(e) => {
                                    const val = parseInt(e.target.value, 10);
                                    setCl2Flow(val);
                                    onCommand({ cl2_flow_lph: val });
                                }}
                            >
                                <option value={15}>15 L/h</option>
                                <option value={20}>20 L/h (Standard)</option>
                                <option value={25}>25 L/h</option>
                            </select>
                        </div>
                    </div>

                    <div className="mt-3 text-[10px] text-gray-500 space-y-1">
                        <div>• Higher temperature → faster reaction but lower purity</div>
                        <div>• Higher flow rate → shorter batch time but more cooling needed</div>
                        <div>• Larger batch → more profit but longer processing time</div>
                    </div>
                </div>

                {/* --- PID CONTROL --- */}
                <div className="bg-gray-900/50 p-4 rounded-xl border border-gray-700">
                    <h3 className="text-xs font-bold text-gray-400 mb-3 flex items-center gap-2">
                        <Settings size={12} /> PID TEMPERATURE CONTROL
                    </h3>

                    <div className="mb-3 p-2 bg-gray-800/50 rounded text-[10px] text-gray-400">
                        <div className="font-bold text-gray-300 mb-1">Automatic Control Logic:</div>
                        <div>• If temp &gt; 78°C → Increase cooling</div>
                        <div>• If temp &lt; 72°C → Increase heating</div>
                        <div>• PID maintains target ± 2°C</div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 mb-3">
                        <div>
                            <label className="text-[10px] text-gray-500 block">Kp (Proportional)</label>
                            <input
                                type="number"
                                step="0.1"
                                value={pid.kp}
                                onChange={e => setPid({ ...pid, kp: parseFloat(e.target.value) || 0 })}
                                className="w-full bg-gray-800 border border-gray-600 rounded text-xs px-2 py-1 text-center"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] text-gray-500 block">Ki (Integral)</label>
                            <input
                                type="number"
                                step="0.01"
                                value={pid.ki}
                                onChange={e => setPid({ ...pid, ki: parseFloat(e.target.value) || 0 })}
                                className="w-full bg-gray-800 border border-gray-600 rounded text-xs px-2 py-1 text-center"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] text-gray-500 block">Kd (Derivative)</label>
                            <input
                                type="number"
                                step="0.01"
                                value={pid.kd}
                                onChange={e => setPid({ ...pid, kd: parseFloat(e.target.value) || 0 })}
                                className="w-full bg-gray-800 border border-gray-600 rounded text-xs px-2 py-1 text-center"
                            />
                        </div>
                    </div>
                    <button
                        onClick={sendPID}
                        className="w-full bg-gray-700 hover:bg-gray-600 py-2 rounded text-xs font-bold mb-3 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg"
                    >
                        UPDATE PID PARAMETERS
                    </button>

                    {/* PID Visualizer */}
                    <div className="space-y-1">
                        <PIDBar label="P" value={telemetry?.pid_state?.p} color="blue" />
                        <PIDBar label="I" value={telemetry?.pid_state?.i} color="green" />
                        <PIDBar label="D" value={telemetry?.pid_state?.d} color="purple" />
                    </div>
                </div>

                {/* --- BATCH REPORTS --- */}
                <BatchReportPanel telemetry={telemetry} onCommand={onCommand} />

                {/* --- FAULT INJECTION --- */}
                <div className="bg-red-950/20 p-4 rounded-xl border border-red-900/50">
                    <h3 className="text-xs font-bold text-red-400 mb-3 flex items-center gap-2">
                        <AlertTriangle size={12} /> FAULT INJECTION (Testing)
                    </h3>
                    <div className="space-y-2">
                        {['cooling_failure', 'sensor_drift', 'valve_stuck'].map(f => (
                            <button
                                key={f}
                                onClick={() => onCommand({ toggle_fault: f })}
                                className={`w-full text-left px-3 py-2 rounded text-xs flex justify-between items-center border transition-all hover:scale-[1.02] active:scale-[0.98] ${telemetry?.faults?.[f] ? 'bg-red-900/50 border-red-500 text-red-200' : 'bg-gray-800/50 border-gray-700 text-gray-400 hover:bg-gray-800'
                                    }`}
                            >
                                <span>{f.replace('_', ' ').toUpperCase()}</span>
                                <div className={`w-2 h-2 rounded-full transition-all ${telemetry?.faults?.[f] ? 'bg-red-500 animate-pulse' : 'bg-gray-600'}`}></div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Interlock Status */}
                <InterlockStatusPanel telemetry={telemetry} />
            </div>
        </div>
    );
};


// Helper Components

const ControlSlider = ({
    label, value, min, max, unit, color, icon, onChange,
    warning, critical, warningText, interlocked, interlockedConditions
}) => (
    <div className={`bg-gray-900/30 p-4 rounded-lg border transition-all ${critical ? 'border-red-500 bg-red-900/20' :
            warning ? 'border-yellow-500/50 bg-yellow-900/10' :
                'border-gray-800/50'
        }`}>
        <label className="flex justify-between text-sm mb-2">
            <span className="text-gray-300 font-semibold flex items-center gap-2">
                {icon}
                {label}
                {interlocked && (
                    <span className="text-[10px] text-orange-400 bg-orange-900/30 px-2 py-0.5 rounded border border-orange-800">
                        INTERLOCKED
                    </span>
                )}
            </span>
            <span className={`font-mono font-bold text-${color}-300`}>
                {typeof value === 'number' ? value.toFixed(0) : value}{unit}
            </span>
        </label>

        <input
            type="range"
            min={min}
            max={max}
            value={value}
            onChange={(e) => onChange(parseFloat(e.target.value))}
            className={`w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-${color}-500 transition-all hover:accent-${color}-400 shadow-lg`}
        />

        {warning && warningText && (
            <div className="text-[10px] text-yellow-400 mt-1">{warningText}</div>
        )}

        {interlocked && interlockedConditions && (
            <div className="mt-2 space-y-1">
                {interlockedConditions.map((cond, idx) => (
                    <div key={idx} className={`text-[10px] flex items-center gap-1 ${cond.met ? 'text-green-400' : 'text-red-400'}`}>
                        {cond.met ? <CheckCircle2 size={10} /> : <AlertTriangle size={10} />}
                        {cond.label}
                    </div>
                ))}
            </div>
        )}
    </div>
);

const PIDBar = ({ label, value, color }) => (
    <div className="flex text-[10px] gap-2">
        <div className="w-8 text-gray-500">{label}</div>
        <div className="flex-1 bg-gray-800 h-2 rounded overflow-hidden">
            <div
                className={`h-full bg-${color}-500 transition-all`}
                style={{ width: `${Math.min(100, Math.abs(value || 0) * 10)}%` }}
            />
        </div>
        <div className="w-12 text-right text-gray-400 font-mono">
            {(value || 0).toFixed(2)}
        </div>
    </div>
);
