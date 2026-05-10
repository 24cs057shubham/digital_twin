import React, { useState, useEffect } from 'react';
import {
    Play, Square, RotateCcw, Clock, Thermometer,
    Gauge, Droplets, AlertTriangle, CheckCircle2,
    Timer, Beaker, ArrowRight, Lock, Download,
    Activity, Zap, Wind
} from 'lucide-react';

/**
 * Recipe Steps Display Component
 * Shows the 7-step DCP production process with sequential dependencies
 */
export const RecipeStepsPanel = ({ recipeDetail, onCommand }) => {
    if (!recipeDetail) {
        return (
            <div className="glass-panel p-4 rounded-xl border border-gray-800">
                <h3 className="text-sm font-bold text-gray-400 mb-3 flex items-center gap-2">
                    <Beaker size={14} /> RECIPE STEPS
                </h3>
                <div className="text-gray-500 text-xs text-center py-4">Loading recipe...</div>
            </div>
        );
    }

    const steps = recipeDetail.all_steps || [];
    const currentStep = recipeDetail.current_step_index || 0;
    const isRunning = recipeDetail.state !== 'IDLE' && recipeDetail.state !== 'COMPLETE' && recipeDetail.state !== 'ABORTED';

    return (
        <div className="glass-panel p-4 rounded-xl border border-gray-800 bg-gray-900/50">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-cyan-400 flex items-center gap-2">
                    <Beaker size={14} /> DCP PRODUCTION RECIPE
                </h3>
                <div className="flex gap-2">
                    {!isRunning && (
                        <button
                            onClick={() => onCommand({ RECIPE_CMD: "START" })}
                            className="bg-green-600 hover:bg-green-500 px-3 py-1 rounded text-xs font-bold flex items-center gap-1 transition-all hover:scale-105"
                        >
                            <Play size={12} /> START
                        </button>
                    )}
                    {isRunning && (
                        <button
                            onClick={() => onCommand({ RECIPE_CMD: "STOP" })}
                            className="bg-red-600 hover:bg-red-500 px-3 py-1 rounded text-xs font-bold flex items-center gap-1 transition-all hover:scale-105"
                        >
                            <Square size={12} /> STOP
                        </button>
                    )}
                    <button
                        onClick={() => onCommand({ RECIPE_CMD: "RESET" })}
                        className="bg-gray-600 hover:bg-gray-500 px-2 py-1 rounded text-xs flex items-center gap-1 transition-all hover:scale-105"
                    >
                        <RotateCcw size={12} />
                    </button>
                </div>
            </div>

            {/* Progress indicator */}
            {isRunning && (
                <div className="mb-4">
                    <div className="flex justify-between text-[10px] text-gray-400 mb-1">
                        <span>Step {currentStep}/{steps.length}</span>
                        <span>{recipeDetail.step_remaining_seconds?.toFixed(0)}s remaining</span>
                    </div>
                    <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-300"
                            style={{ width: `${recipeDetail.step_progress_pct || 0}%` }}
                        />
                    </div>
                </div>
            )}

            {/* Interlock warning */}
            {recipeDetail.interlock_active && (
                <div className="bg-orange-900/30 border border-orange-500 rounded p-2 mb-4 animate-pulse">
                    <div className="text-orange-400 text-xs font-bold flex items-center gap-1">
                        <Lock size={12} /> INTERLOCK ACTIVE
                    </div>
                    <div className="text-orange-200 text-[10px] mt-1">{recipeDetail.interlock_reason}</div>
                </div>
            )}

            {/* Steps list */}
            <div className="space-y-2">
                {steps.map((step, idx) => (
                    <div
                        key={idx}
                        className={`flex items-center gap-3 p-2 rounded transition-all ${step.status === 'active'
                                ? 'bg-cyan-900/30 border border-cyan-500/50'
                                : step.status === 'complete'
                                    ? 'bg-green-900/20 border border-green-900/30'
                                    : 'bg-gray-900/30 border border-gray-800/50'
                            }`}
                    >
                        {/* Step number/status icon */}
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${step.status === 'complete' ? 'bg-green-600' :
                                step.status === 'active' ? 'bg-cyan-600 animate-pulse' :
                                    'bg-gray-700'
                            }`}>
                            {step.status === 'complete' ? <CheckCircle2 size={12} /> : step.index}
                        </div>

                        {/* Step info */}
                        <div className="flex-1 min-w-0">
                            <div className={`text-xs font-semibold truncate ${step.status === 'active' ? 'text-cyan-300' :
                                    step.status === 'complete' ? 'text-green-300' :
                                        'text-gray-400'
                                }`}>
                                {step.name}
                            </div>
                            <div className="text-[10px] text-gray-500 truncate">{step.description}</div>
                        </div>

                        {/* Duration & temp */}
                        <div className="text-right text-[10px] text-gray-500">
                            <div className="flex items-center gap-1">
                                <Timer size={10} /> {step.duration}s
                            </div>
                            {step.target_temp && (
                                <div className="flex items-center gap-1 text-orange-400">
                                    <Thermometer size={10} /> {step.target_temp}°C
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Batch time */}
            {recipeDetail.batch_elapsed_seconds > 0 && (
                <div className="mt-4 pt-3 border-t border-gray-800 text-center">
                    <div className="text-[10px] text-gray-500">BATCH TIME</div>
                    <div className="text-lg font-mono font-bold text-cyan-400">
                        {formatTime(recipeDetail.batch_elapsed_seconds)}
                    </div>
                </div>
            )}
        </div>
    );
};


/**
 * Live Monitoring Dashboard Component
 * Displays critical parameters: Temperature, Flow Rate, Pressure, etc.
 */
export const LiveMonitoringPanel = ({ telemetry }) => {
    const [reactionTimer, setReactionTimer] = useState(0);

    // Track reaction time when chlorination is active
    useEffect(() => {
        if (telemetry?.recipe_detail?.current_step_name === 'Chlorination') {
            const interval = setInterval(() => {
                setReactionTimer(prev => prev + 1);
            }, 1000);
            return () => clearInterval(interval);
        }
    }, [telemetry?.recipe_detail?.current_step_name]);

    const getTemperatureStatus = (temp) => {
        if (temp >= 73 && temp <= 77) return { status: 'optimal', color: 'text-green-400', bg: 'bg-green-500' };
        if (temp >= 70 && temp <= 80) return { status: 'acceptable', color: 'text-yellow-400', bg: 'bg-yellow-500' };
        return { status: 'warning', color: 'text-red-400', bg: 'bg-red-500' };
    };

    const tempStatus = getTemperatureStatus(telemetry?.temp || 25);

    return (
        <div className="glass-panel p-4 rounded-xl border border-gray-800 bg-gray-900/50">
            <h3 className="text-sm font-bold text-cyan-400 mb-4 flex items-center gap-2">
                <Activity size={14} className="animate-pulse" /> LIVE MONITORING
            </h3>

            {/* Primary Metrics Grid */}
            <div className="grid grid-cols-2 gap-3 mb-4">
                {/* Temperature - Most Important */}
                <div className={`col-span-2 p-4 rounded-lg border transition-all ${tempStatus.status === 'optimal' ? 'bg-green-900/20 border-green-600/50' :
                        tempStatus.status === 'acceptable' ? 'bg-yellow-900/20 border-yellow-600/50' :
                            'bg-red-900/20 border-red-600/50 animate-pulse'
                    }`}>
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2 text-xs text-gray-400">
                            <Thermometer size={14} className={tempStatus.color} />
                            PROCESS TEMPERATURE
                        </div>
                        <div className={`text-[10px] px-2 py-0.5 rounded ${tempStatus.bg} text-white font-bold`}>
                            {tempStatus.status.toUpperCase()}
                        </div>
                    </div>
                    <div className={`text-3xl font-mono font-bold ${tempStatus.color}`}>
                        {telemetry?.temp?.toFixed(1) || '--'}°C
                    </div>
                    <div className="text-[10px] text-gray-500 mt-1">
                        Target: 75°C ± 2°C | Current Setpoint: {telemetry?.reaction_temp_c || 75}°C
                    </div>
                    {/* Temperature bar */}
                    <div className="mt-2 h-2 bg-gray-800 rounded-full overflow-hidden relative">
                        <div className="absolute inset-0 flex">
                            <div className="w-[20%] bg-blue-600/30" /> {/* Cold zone */}
                            <div className="w-[10%] bg-yellow-600/30" /> {/* Warming */}
                            <div className="w-[10%] bg-green-600/50" /> {/* Optimal */}
                            <div className="w-[10%] bg-yellow-600/30" /> {/* Hot */}
                            <div className="flex-1 bg-red-600/30" /> {/* Danger */}
                        </div>
                        <div
                            className={`absolute h-full w-1 ${tempStatus.bg} transition-all`}
                            style={{ left: `${Math.min(100, Math.max(0, (telemetry?.temp || 25) / 1.2))}%` }}
                        />
                    </div>
                </div>

                {/* Cl2 Flow Rate */}
                <MetricCard
                    icon={<Droplets size={14} className="text-cyan-400" />}
                    label="Cl₂ FLOW RATE"
                    value={telemetry?.inputs?.cl2 || 0}
                    unit="%"
                    targetLabel={`${telemetry?.cl2_flow_lph || 20} L/h`}
                    color="cyan"
                />

                {/* Pressure */}
                <MetricCard
                    icon={<Gauge size={14} className="text-purple-400" />}
                    label="PRESSURE"
                    value={telemetry?.pressure?.toFixed(2) || 1.0}
                    unit="bar"
                    warning={telemetry?.pressure > 1.8}
                    critical={telemetry?.pressure > 2.5}
                    color="purple"
                />

                {/* Reaction Timer */}
                <MetricCard
                    icon={<Timer size={14} className="text-orange-400" />}
                    label="REACTION TIME"
                    value={formatTime(telemetry?.recipe_detail?.batch_elapsed_seconds || 0)}
                    color="orange"
                    isTimer
                />

                {/* Purity Estimate */}
                <MetricCard
                    icon={<Zap size={14} className="text-green-400" />}
                    label="PURITY ESTIMATE"
                    value={telemetry?.purity?.toFixed(1) || 100}
                    unit="%"
                    color="green"
                    warning={telemetry?.purity < 95}
                    critical={telemetry?.purity < 85}
                />
            </div>

            {/* Secondary Metrics */}
            <div className="grid grid-cols-3 gap-2 pt-3 border-t border-gray-800">
                <div className="text-center">
                    <div className="text-[10px] text-gray-500">AGITATOR</div>
                    <div className="text-sm font-mono font-bold text-gray-300">
                        {telemetry?.inputs?.rpm || 0} <span className="text-[10px] text-gray-500">RPM</span>
                    </div>
                </div>
                <div className="text-center">
                    <div className="text-[10px] text-gray-500">COOLING</div>
                    <div className="text-sm font-mono font-bold text-blue-300">
                        {telemetry?.inputs?.cooling || 0}%
                    </div>
                </div>
                <div className="text-center">
                    <div className="text-[10px] text-gray-500">HEATING</div>
                    <div className="text-sm font-mono font-bold text-orange-300">
                        {telemetry?.inputs?.heating || 0}%
                    </div>
                </div>
            </div>
        </div>
    );
};


/**
 * Batch Report Panel - Generate and download CSV reports
 */
export const BatchReportPanel = ({ telemetry, onCommand }) => {
    const [generating, setGenerating] = useState(false);

    const handleGenerateReport = async () => {
        setGenerating(true);

        try {
            // Trigger report generation via REST API
            const response = await fetch('http://localhost:8000/api/batch/report');
            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `batch_report_${new Date().toISOString().slice(0, 10)}.csv`;
                a.click();
                window.URL.revokeObjectURL(url);
            }
        } catch (error) {
            console.error('Error generating report:', error);
        } finally {
            setGenerating(false);
        }
    };

    return (
        <div className="glass-panel p-4 rounded-xl border border-gray-800 bg-gray-900/50">
            <h3 className="text-sm font-bold text-cyan-400 mb-3 flex items-center gap-2">
                <Download size={14} /> BATCH REPORTS
            </h3>

            <div className="space-y-3">
                {/* Data logging status */}
                <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-400">Data Logging:</span>
                    <span className={`font-bold ${telemetry?.batch_logging_active ? 'text-green-400' : 'text-gray-500'}`}>
                        {telemetry?.batch_logging_active ? '● RECORDING' : '○ IDLE'}
                    </span>
                </div>

                <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-400">Records Stored:</span>
                    <span className="font-mono text-cyan-300">{telemetry?.data_log_count || 0}</span>
                </div>

                <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-400">Log Interval:</span>
                    <span className="font-mono text-gray-300">10 seconds</span>
                </div>

                {/* Generate report button */}
                <button
                    onClick={handleGenerateReport}
                    disabled={generating}
                    className={`w-full py-2 rounded font-bold text-xs flex items-center justify-center gap-2 transition-all ${generating
                            ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                            : 'bg-cyan-600 hover:bg-cyan-500 text-white hover:scale-[1.02]'
                        }`}
                >
                    <Download size={14} />
                    {generating ? 'Generating...' : 'Download CSV Report'}
                </button>

                {/* Report contents preview */}
                <div className="mt-2 p-2 bg-gray-800/50 rounded text-[10px] text-gray-500">
                    <div className="font-bold text-gray-400 mb-1">Report Contains:</div>
                    <div>• Timestamp, Step #, Step Name</div>
                    <div>• Temperature, Pressure, Cl₂ Flow</div>
                    <div>• Control Actions, Safety Events</div>
                    <div>• Purity, Yield, Financial Value</div>
                </div>
            </div>
        </div>
    );
};


/**
 * State Machine / Interlock Status Panel
 */
export const InterlockStatusPanel = ({ telemetry }) => {
    const interlockRules = [
        {
            id: 'temp_check',
            rule: 'Temperature = 75°C ± 2°C for chlorination',
            met: telemetry?.temp >= 73 && telemetry?.temp <= 77,
            active: telemetry?.recipe_detail?.current_step_name === 'Chlorination'
        },
        {
            id: 'rpm_check',
            rule: 'Agitator RPM ≥ 50 for Cl₂ injection',
            met: telemetry?.inputs?.rpm >= 50,
            active: telemetry?.inputs?.cl2 > 0
        },
        {
            id: 'pressure_check',
            rule: 'Pressure < 2.5 bar',
            met: telemetry?.pressure < 2.5,
            active: true
        },
        {
            id: 'discharge_temp',
            rule: 'Temp < 60°C for discharge',
            met: telemetry?.temp < 60,
            active: telemetry?.inputs?.discharge > 0
        },
        {
            id: 'discharge_pressure',
            rule: 'Pressure < 1.2 bar for discharge',
            met: telemetry?.pressure < 1.2,
            active: telemetry?.inputs?.discharge > 0
        }
    ];

    return (
        <div className="glass-panel p-4 rounded-xl border border-gray-800 bg-gray-900/50">
            <h3 className="text-sm font-bold text-cyan-400 mb-3 flex items-center gap-2">
                <Lock size={14} /> STATE MACHINE INTERLOCKS
            </h3>

            <div className="space-y-2">
                {interlockRules.map((rule) => (
                    <div
                        key={rule.id}
                        className={`flex items-center gap-2 p-2 rounded text-xs transition-all ${!rule.met && rule.active
                                ? 'bg-red-900/30 border border-red-500/50'
                                : rule.met
                                    ? 'bg-green-900/20 border border-green-900/30'
                                    : 'bg-gray-900/30 border border-gray-800/50'
                            }`}
                    >
                        <div className={`w-4 h-4 rounded-full flex items-center justify-center ${!rule.met && rule.active ? 'bg-red-500 animate-pulse' :
                                rule.met ? 'bg-green-500' : 'bg-gray-600'
                            }`}>
                            {rule.met ? (
                                <CheckCircle2 size={10} className="text-white" />
                            ) : (
                                <AlertTriangle size={10} className="text-white" />
                            )}
                        </div>
                        <span className={`flex-1 ${!rule.met && rule.active ? 'text-red-300' :
                                rule.met ? 'text-green-300' : 'text-gray-400'
                            }`}>
                            {rule.rule}
                        </span>
                    </div>
                ))}
            </div>

            {/* Active interlock message */}
            {telemetry?.interlock_msg && (
                <div className="mt-3 p-2 bg-orange-900/30 border border-orange-500 rounded animate-pulse">
                    <div className="text-orange-400 text-xs font-bold">ACTIVE INTERLOCK</div>
                    <div className="text-orange-200 text-[10px] mt-1">{telemetry.interlock_msg}</div>
                </div>
            )}
        </div>
    );
};


// Helper Components

const MetricCard = ({ icon, label, value, unit, color, warning, critical, targetLabel, isTimer }) => (
    <div className={`p-3 rounded-lg border transition-all ${critical ? 'bg-red-900/30 border-red-600/50 animate-pulse' :
            warning ? 'bg-yellow-900/30 border-yellow-600/50' :
                'bg-gray-900/30 border-gray-800/50'
        }`}>
        <div className="flex items-center gap-1 text-[10px] text-gray-400 mb-1">
            {icon} {label}
        </div>
        <div className={`text-xl font-mono font-bold ${critical ? 'text-red-400' :
                warning ? 'text-yellow-400' :
                    `text-${color}-400`
            }`}>
            {value}{unit && <span className="text-sm text-gray-500 ml-1">{unit}</span>}
        </div>
        {targetLabel && <div className="text-[10px] text-gray-500 mt-1">Target: {targetLabel}</div>}
    </div>
);

// Format seconds to MM:SS or HH:MM:SS
const formatTime = (seconds) => {
    if (!seconds || seconds < 0) return '00:00';
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hrs > 0) {
        return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

export default RecipeStepsPanel;
