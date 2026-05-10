import React, { useState } from 'react';
import { User, ShieldCheck, KeyRound } from 'lucide-react';

export const LoginPage = ({ onLogin }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleLogin = (e) => {
        e.preventDefault();
        // Simulated Secure Auth
        if (username === 'worker' && password === 'dcp2026') {
            onLogin({ name: 'Operator John', role: 'WORKER' });
        } else if (username === 'owner' && password === 'admin') {
            onLogin({ name: 'Director Smith', role: 'OWNER' });
        } else {
            setError('Invalid Credentials');
        }
    };

    return (
        <div className="h-screen w-full flex items-center justify-center bg-gray-950 text-white relative overflow-hidden">
            {/* Abstract Background */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(16,185,129,0.1),transparent_70%)]" />

            <div className="glass-panel p-8 rounded-2xl w-full max-w-md z-10 border border-gray-800 shadow-2xl">
                <div className="flex justify-center mb-6">
                    <div className="p-4 bg-cyan-900/20 rounded-full border border-cyan-500/30">
                        <ShieldCheck size={32} className="text-cyan-400" />
                    </div>
                </div>

                <h1 className="text-2xl font-bold text-center mb-1">Industrial Twin Access</h1>
                <p className="text-center text-gray-500 text-sm mb-8">SECURE LOGIN REQUIRED</p>

                <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                        <label className="text-xs text-gray-400 font-bold ml-1 mb-1 block">USER ID</label>
                        <div className="relative">
                            <User size={16} className="absolute left-3 top-3 text-gray-500" />
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full bg-gray-900/50 border border-gray-700 rounded-lg py-2.5 pl-10 pr-4 focus:border-cyan-500 focus:outline-none transition-colors"
                                placeholder="Enter ID"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="text-xs text-gray-400 font-bold ml-1 mb-1 block">ACCESS KEY</label>
                        <div className="relative">
                            <KeyRound size={16} className="absolute left-3 top-3 text-gray-500" />
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-gray-900/50 border border-gray-700 rounded-lg py-2.5 pl-10 pr-4 focus:border-cyan-500 focus:outline-none transition-colors"
                                placeholder="••••••••"
                            />
                        </div>
                    </div>

                    {error && <div className="text-red-500 text-xs text-center py-2 bg-red-900/10 rounded">{error}</div>}

                    <button className="w-full py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 rounded-lg font-bold text-sm tracking-wide shadow-lg shadow-cyan-900/20 transition-all transform active:scale-95">
                        AUTHENTICATE
                    </button>
                </form>

                <div className="mt-6 text-center text-[10px] text-gray-600">
                    Authorized Personnel Only. <br /> Access is logged and monitored.
                </div>
            </div>
        </div>
    );
};
