import React, { useState } from 'react';
import { Fan, ThermometerSnowflake, Droplets, TriangleAlert } from 'lucide-react';

const ReactorControls = ({ telemetry, onControl, status }) => {
    const [rpm, setRpm] = useState(0);
    const [cooling, setCooling] = useState(50);
    const [feed, setFeed] = useState(0);

    const update = (key, val) => {
        onControl({ command: true, [key]: val });
    };

    const handleDump = () => {
        onControl({ command: true, dump_valve: true });
        setTimeout(() => onControl({ command: true, dump_valve: false }), 5000);
    };

    return (
        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-xl">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" /> Operator Station
                </h2>
                <span className="text-xs font-mono text-gray-500">{status}</span>
            </div>

            <div className="space-y-6">

                {/* Agitator Control */}
                <div>
                    <label className="flex items-center gap-2 text-sm text-gray-300 mb-2">
                        <Fan size={16} className={telemetry?.agitation_rpm > 10 ? 'animate-spin' : ''} />
                        Agitation Speed ({rpm} RPM)
                    </label>
                    <input
                        type="range" min="0" max="600" step="10"
                        value={rpm}
                        onChange={(e) => { setRpm(e.target.value); update('rpm', e.target.value); }}
                        className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                    />
                </div>

                {/* Cooling Control */}
                <div>
                    <label className="flex items-center gap-2 text-sm text-gray-300 mb-2">
                        <ThermometerSnowflake size={16} className="text-cyan-400" />
                        Cooling Jacket Valve ({cooling}%)
                    </label>
                    <input
                        type="range" min="0" max="100" step="1"
                        value={cooling}
                        onChange={(e) => { setCooling(e.target.value); update('cooling_valve', e.target.value); }}
                        className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                    />
                </div>

                {/* Feed Control */}
                <div>
                    <label className="flex items-center gap-2 text-sm text-gray-300 mb-2">
                        <Droplets size={16} className="text-purple-400" />
                        Reactant Feed Rate ({feed} L/min)
                    </label>
                    <input
                        type="range" min="0" max="20" step="1"
                        value={feed}
                        onChange={(e) => { setFeed(e.target.value); update('feed_rate', e.target.value); }}
                        className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
                    />
                </div>

                {/* Emergency Controls */}
                <div className="pt-6 border-t border-gray-700">
                    <button
                        onClick={handleDump}
                        className="w-full py-3 bg-red-900/30 hover:bg-red-900/50 border border-red-800 text-red-500 rounded-lg font-bold flex items-center justify-center gap-2 text-sm transition-all"
                    >
                        <TriangleAlert size={18} /> EMERGENCY DUMP
                    </button>
                    <p className="text-[10px] text-gray-500 text-center mt-2">
                        Activating will vent pressure and drain reactor contents immediately.
                    </p>
                </div>

            </div>
        </div>
    );
};

export default ReactorControls;
