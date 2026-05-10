import React, { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export const SimpleDashboard = () => {
    const [data, setData] = useState([]);
    const [current, setCurrent] = useState({ temp: 25, recipe_status: "IDLE" });
    const [ws, setWs] = useState(null);

    useEffect(() => {
        const socket = new WebSocket('ws://localhost:8000/ws');
        socket.onmessage = (e) => {
            const msg = JSON.parse(e.data);
            setCurrent(msg);
            setData(prev => [...prev, { time: new Date().toLocaleTimeString(), temp: msg.temp, setpoint: msg.recipe_step > 0 ? 60 : 25 }].slice(-50));
        };
        setWs(socket);
        return () => socket.close();
    }, []);

    const startBatch = () => {
        ws.send(JSON.stringify({ action: "START_BATCH" }));
    };

    return (
        <div className="p-10 bg-gray-900 text-white min-h-screen font-mono">
            <h1 className="text-2xl mb-4 text-cyan-400">Recipe Control V2</h1>

            <div className="grid grid-cols-2 gap-8">
                {/* Visual Dashboard */}
                <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                    <div className="text-6xl font-bold mb-2">{current.temp}°C</div>
                    <div className="text-sm text-gray-400">CURRENT TEMPERATURE</div>

                    <div className="mt-8 p-4 bg-black rounded text-green-400">
                        STATUS: {current.recipe_status}
                    </div>

                    <button onClick={startBatch} className="mt-4 bg-cyan-600 px-6 py-2 rounded font-bold hover:bg-cyan-500 transition-all">
                        START BATCH
                    </button>
                </div>

                {/* Graph with Ghost Lines */}
                <div className="bg-gray-800 p-4 rounded-xl border border-gray-700">
                    <h3 className="text-gray-400 text-xs mb-4">TEMPERATURE PROFILE</h3>
                    <LineChart width={500} height={300} data={data}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                        <YAxis domain={[0, 80]} />
                        <Tooltip contentStyle={{ backgroundColor: '#111' }} />

                        {/* The Ghost Line (Target) */}
                        <Line type="step" dataKey="setpoint" stroke="#4b5563" strokeDasharray="5 5" dot={false} strokeWidth={2} />

                        {/* The Real Line (Actual) */}
                        <Line type="monotone" dataKey="temp" stroke="#06b6d4" strokeWidth={3} dot={false} />
                    </LineChart>
                    <div className="flex justify-center gap-4 text-xs mt-2">
                        <span className="text-gray-500">--- Target (Ghost)</span>
                        <span className="text-cyan-400">___ Actual</span>
                    </div>
                </div>
            </div>
        </div>
    );
};
