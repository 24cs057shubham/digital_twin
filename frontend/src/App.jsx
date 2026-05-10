import React, { useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stage, PerspectiveCamera } from '@react-three/drei';
import DCPReactorModel from './components/DCPReactorModel';
import { WorkerView, OwnerView } from './components/Roles';
import { LoginPage } from './components/Login';
import { useTelemetry } from './services/api';
import { Scan, Activity, LogOut, TriangleAlert, Wrench, Play, ListChecks } from 'lucide-react';

function App() {
  const { telemetry, audit, tempHistory, sendControl, status } = useTelemetry();
  const [currentUser, setCurrentUser] = useState(null);

  if (!currentUser) return <LoginPage onLogin={setCurrentUser} />;
  const role = currentUser.role;

  return (
    <div className="h-screen w-full flex flex-col overflow-hidden bg-gray-950 text-white selection:bg-cyan-500/30">

      {/* Header */}
      <header className="h-14 border-b border-gray-800 bg-gray-900/50 backdrop-blur-md flex items-center justify-between px-6 z-10">
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 bg-cyan-500/10 rounded flex items-center justify-center border border-cyan-500/50">
            <Scan size={18} className="text-cyan-400" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-[0.2em] text-cyan-100">DCP-TWIN PRO</h1>
            <div className="flex items-center gap-3 text-[10px] text-gray-500">
              <span className={`${status === 'CONNECTED' ? 'text-green-400' : 'text-red-400'} animate-pulse`}>
                ● {status === 'CONNECTED' ? '5G CONNECTED' : 'DISCONNECTED'}
              </span>
              <span>USER: {currentUser.name}</span>
            </div>
          </div>
        </div>

        {/* Recipe Status Display */}
        <div className={`flex items-center gap-2 bg-black/40 border px-3 py-1 rounded transition-all ${
          telemetry?.recipe_status === 'BATCH COMPLETE' ? 'border-green-500/50' :
          telemetry?.recipe_status === 'ABORTED' ? 'border-red-500/50' :
          'border-gray-800'
        }`}>
          <div className="text-[10px] text-gray-400">BATCH STATUS:</div>
          <div className={`text-xs font-mono font-bold ${
            telemetry?.recipe_status === 'BATCH COMPLETE' ? 'text-green-400' :
            telemetry?.recipe_status === 'ABORTED' ? 'text-red-400' :
            'text-cyan-400'
          }`}>
            {telemetry?.recipe_status || "OFFLINE"}
          </div>
          {role === 'WORKER' && (telemetry?.recipe_status === 'READY' || telemetry?.recipe_status === 'BATCH COMPLETE' || telemetry?.recipe_status === 'ABORTED' || !telemetry?.recipe_status) && (
            <button onClick={() => sendControl({ RECIPE_CMD: "START" })} className="ml-2 bg-cyan-700 hover:bg-cyan-600 px-2 py-0.5 rounded text-[10px] flex items-center gap-1 transition-all hover:scale-105">
              <Play size={8} /> START
            </button>
          )}
          {(telemetry?.recipe_status === 'BATCH COMPLETE' || telemetry?.recipe_status === 'ABORTED') && (
            <button onClick={() => sendControl({ RECIPE_CMD: "RESET" })} className="ml-2 bg-gray-700 hover:bg-gray-600 px-2 py-0.5 rounded text-[10px] flex items-center gap-1 transition-all hover:scale-105">
              RESET
            </button>
          )}
        </div>

        <div className="flex items-center gap-4">
          <div className="bg-gray-800 px-3 py-1 rounded text-xs font-mono text-gray-400 border border-gray-700">
            ROLE: <span className={role === 'OWNER' ? 'text-yellow-400 font-bold' : 'text-cyan-400 font-bold'}>{role}</span>
          </div>
          <button onClick={() => setCurrentUser(null)} className="text-gray-500 hover:text-white"><LogOut size={18} /></button>
        </div>
      </header>

      {/* Main Grid */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 p-6 overflow-hidden">
        <div className="lg:col-span-3 h-full min-h-0 overflow-y-auto">
          {role === 'WORKER' ? <WorkerView telemetry={telemetry} onCommand={sendControl} /> : <OwnerView telemetry={telemetry} onCommand={sendControl} />}
        </div>

        <div className="lg:col-span-6 h-full relative">
          <div className={`absolute inset-0 rounded-2xl overflow-hidden border shadow-2xl bg-gradient-to-b from-gray-900/80 to-black/80 backdrop-blur-sm transition-colors ${telemetry?.safety_scram ? 'border-red-500 shadow-red-900/50' : 'border-gray-800'
            }`}>
            <div className="absolute top-4 left-0 right-0 flex justify-center z-10 pointer-events-none">
              <div className="bg-black/40 border border-white/5 px-4 py-1 rounded-full text-[10px] text-gray-400 tracking-widest backdrop-blur">
                Zero-Latency Mirror
              </div>
            </div>
            <Canvas shadows dpr={[1, 2]}>
              <PerspectiveCamera makeDefault position={[5, 2, 5]} fov={40} />
              <OrbitControls maxPolarAngle={Math.PI / 1.8} enablePan={false} />
              <Stage environment="city" intensity={0.4} adjustCamera={false}>
                <DCPReactorModel telemetry={telemetry} />
              </Stage>
            </Canvas>
            <div className="absolute bottom-6 left-6 font-mono text-xs text-cyan-500/50">
              MOLES_DCP: {telemetry?.moles_dcp} <br /> MOLES_CL2: {telemetry?.moles_cl2}
            </div>
          </div>
        </div>

        <div className="lg:col-span-3 h-full glass-panel p-4 overflow-hidden flex flex-col border border-gray-800/50">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-500 text-xs font-bold flex items-center gap-2">
              <Activity size={14} className={status === 'CONNECTED' ? 'text-green-400 animate-pulse' : 'text-gray-500'} /> 
              LIVE TELEMETRY
            </h3>
            <div className={`w-2 h-2 rounded-full ${status === 'CONNECTED' ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`}></div>
          </div>
          <div className="space-y-3 font-mono text-xs flex-1 overflow-y-auto">
            <TelemetryItem label="TEMP (PROCESS)" value={telemetry?.temp} unit="°C" critical={telemetry?.temp > 75} />
            <TelemetryItem label="PRESSURE" value={telemetry?.pressure} unit="BAR" warning={telemetry?.pressure > 2.0} />
            <TelemetryItem label="AGITATOR" value={telemetry?.inputs?.rpm} unit="RPM" />
            <TelemetryItem label="COOLING" value={telemetry?.inputs?.cooling} unit="%" />
            <TelemetryItem label="CL2 VALVE" value={telemetry?.inputs?.cl2} unit="%" />
            <TelemetryItem label="DISCHARGE" value={telemetry?.inputs?.discharge} unit="%" />
            <TelemetryItem label="HEART RATE" value={telemetry?.worker_heart_rate} unit="BPM" warning={telemetry?.worker_heart_rate > 120} />
            <TelemetryItem label="BATCH VALUE" value={telemetry?.financial_value} unit="$" />

            <div className="pt-4 border-t border-gray-800 mt-4">
              <div className="text-[10px] text-gray-500 mb-2 font-bold tracking-widest">AI CORTEX ANALYSIS</div>
              {telemetry?.ai_analysis && telemetry.ai_analysis.length > 0 ? (
                telemetry.ai_analysis.map((alert, i) => (
                  <div key={i} className={`p-3 rounded mb-2 border-l-2 ${alert.type === 'critical' ? 'bg-red-900/20 border-red-500 text-red-200 animate-pulse' :
                      alert.type === 'warning' ? 'bg-yellow-900/20 border-yellow-500 text-yellow-200' :
                        'bg-orange-900/20 border-orange-500 text-orange-200'
                    }`}>
                    <div className="flex items-center gap-2 font-bold">
                      {alert.type === 'critical' ? <TriangleAlert size={14} /> : <Wrench size={14} />}
                      {alert.type.toUpperCase()}
                    </div>
                    <div className="mt-1 opacity-80">{alert.msg}</div>
                  </div>
                ))
              ) : (<div className="text-green-500/50 p-2 border border-dashed border-green-900/30 rounded text-center">System Nominal.</div>)}
              {telemetry?.safety_scram && <div className="text-red-500 font-bold bg-red-900/20 p-2 rounded mt-2 border border-red-500">SAFETY SCRAM TRIGGERED</div>}
            </div>

            <div className="mt-8 bg-gray-900/50 p-3 rounded border border-gray-800">
              <div className="text-[10px] text-gray-500 mb-2 font-bold">GOLDEN BATCH COMPLIANCE</div>
              <div className="text-center text-[10px] text-cyan-500 mt-1 font-mono">
                {telemetry?.temp !== undefined && telemetry?.golden_temp !== undefined ? (
                  <>Deviation: {(telemetry.temp - telemetry.golden_temp).toFixed(1)}°C</>
                ) : (
                  <>No baseline data</>
                )}
              </div>
            </div>

            <div className="mt-6 bg-gray-900/50 p-3 rounded border border-gray-800">
              <div className="flex items-center gap-2 text-[10px] text-gray-500 mb-2 font-bold">
                <ListChecks size={12} className="text-cyan-400" /> EVENT & ACTION TIMELINE
              </div>
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {audit && audit.length > 0 ? (
                  audit.slice(0, 20).map((entry, idx) => (
                    <div key={`${entry.timestamp}-${idx}`} className={`text-[10px] p-2 rounded border ${
                      entry.level === 'CRITICAL' ? 'border-red-500/50 bg-red-900/10 text-red-300' :
                      entry.level === 'WARNING' ? 'border-yellow-500/50 bg-yellow-900/10 text-yellow-300' :
                      'border-gray-800/60 bg-black/20 text-gray-300'
                    }`}>
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-gray-400">{formatTime(entry.timestamp)}</span>
                        <span className="font-bold">{entry.level}</span>
                      </div>
                      <div className="mt-1">{entry.message}</div>
                    </div>
                  ))
                ) : (
                  <div className="text-[10px] text-gray-500 text-center border border-dashed border-gray-800 p-2 rounded">
                    No events yet.
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 bg-gray-900/50 p-3 rounded border border-gray-800">
              <div className="text-[10px] text-gray-500 mb-2 font-bold">TEMPERATURE TREND:</div>
              <div className="font-mono text-[10px] text-cyan-300 whitespace-pre leading-4">
                {renderTempTrend(tempHistory)}
              </div>
            </div>

            <div className="mt-6 bg-gray-900/50 p-3 rounded border border-gray-800">
              <div className="text-[10px] text-gray-500 mb-2 font-bold">MATERIAL TRACKING:</div>
              <div className="font-mono text-[10px] text-cyan-300 whitespace-pre leading-4">
                {renderMaterialBalance(telemetry)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const TelemetryItem = ({ label, value, unit, critical, warning }) => (
  <div className={`flex justify-between border-b border-gray-800/50 pb-2 transition-all ${critical ? 'text-red-500 animate-pulse' : warning ? 'text-yellow-500' : 'text-gray-300'}`}>
    <span className="text-gray-600 font-bold">{label}</span>
    <span className="font-mono font-semibold">{value !== undefined && value !== null ? `${value} ${unit}` : '--'}</span>
  </div>
);

const formatTime = (iso) => {
  if (!iso) return '--:--:--';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '--:--:--';
  return date.toLocaleTimeString();
};

const renderTempTrend = (history = []) => {
  const blocks = '▁▂▃▄▅▆▇█';
  if (!history.length) {
    return [
      'Ideal:  ──────────── 75°C',
      'Actual: ' + '▁'.repeat(16),
      'Time:    0   10   20   30 min'
    ].join('\n');
  }
  const values = history.slice(-16);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const bar = values.map((v) => {
    const idx = Math.min(7, Math.max(0, Math.round(((v - min) / range) * 7)));
    return blocks[idx];
  }).join('');
  return [
    'Ideal:  ──────────── 75°C',
    `Actual: ${bar}`,
    'Time:    0   10   20   30 min'
  ].join('\n');
};

const renderMaterialBalance = (telemetry) => {
  const phenolTotalG = telemetry?.initial_phenol_g ?? 1000;
  const phenolStartMol = 10.0 * (phenolTotalG / 1000);
  const cl2TotalMol = 150;
  const dcpTheoG = 980;
  const phenolMol = telemetry?.moles_phenol ?? phenolStartMol;
  const dcpMol = telemetry?.moles_dcp ?? 0;

  const phenolUsedMol = Math.max(0, phenolStartMol - phenolMol);
  const phenolUsedG = Math.min(phenolTotalG, (phenolUsedMol / phenolStartMol) * phenolTotalG);
  const phenolPct = Math.min(100, (phenolUsedG / phenolTotalG) * 100);

  // Approximate Cl2 consumed based on stoichiometry (2 mol Cl2 per mol phenol)
  const cl2ConsumedMol = Math.min(cl2TotalMol, phenolUsedMol * 2);
  const cl2Pct = Math.min(100, (cl2ConsumedMol / cl2TotalMol) * 100);

  const dcpCurrentG = Math.min(dcpTheoG, (dcpMol / phenolStartMol) * dcpTheoG);
  const dcpPct = Math.min(100, (dcpCurrentG / dcpTheoG) * 100);

  return [
    `Phenol Used: ${phenolUsedG.toFixed(0)}/${phenolTotalG} g (${phenolPct.toFixed(0)}%)`,
    `Cl₂ Consumed: ${cl2ConsumedMol.toFixed(0)}/${cl2TotalMol} moles (${cl2Pct.toFixed(0)}%)`,
    `Theoretical Yield: ${dcpTheoG} g DCP`,
    `Current Yield: ${dcpCurrentG.toFixed(0)} g (${dcpPct.toFixed(0)}%)`
  ].join('\n');
};

export default App;
