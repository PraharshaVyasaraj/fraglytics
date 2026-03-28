
import React, { useState, useMemo } from 'react';
import { TeamData } from '../types';
import { runMonteCarloSimulation, TeamPrediction } from '../services/analyticsEngine';
import { TrendingUp, RefreshCw, AlertTriangle, Target, Trophy } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell, CartesianGrid } from 'recharts';

interface PredictionWidgetProps {
  data: TeamData[];
}

const PredictionWidget: React.FC<PredictionWidgetProps> = ({ data }) => {
  const [matchesRemaining, setMatchesRemaining] = useState(3);
  const [isSimulating, setIsSimulating] = useState(false);
  const [predictions, setPredictions] = useState<TeamPrediction[]>([]);

  // Only consider top 8 teams for chart clarity, or all if fewer
  const displayData = useMemo(() => predictions.slice(0, 8), [predictions]);

  const handleSimulate = async () => {
    setIsSimulating(true);
    // Yield to UI to show spinner
    await new Promise(r => setTimeout(r, 100)); 
    
    const results = runMonteCarloSimulation(data, matchesRemaining, 2500);
    setPredictions(results);
    setIsSimulating(false);
  };

  if (!data || data.length === 0) return null;

  return (
    <div className="bg-tactical-dark border border-tactical-gray rounded-sm p-6 mb-8 relative overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-700">
       {/* Background Effect */}
       <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 blur-[100px] pointer-events-none"></div>

       <div className="flex flex-col justify-between items-start gap-4 mb-6">
           <div className="w-full flex justify-between items-start">
               <div>
                   <h3 className="font-serif text-lg font-bold text-white flex items-center gap-2">
                       <Target className="w-5 h-5 text-blue-500" /> Strategic Projection
                   </h3>
                   <p className="text-xs text-tactical-light font-mono mt-1">
                       Monte Carlo Sim (2500 runs)
                   </p>
               </div>
               
               {/* Controls in top right */}
               <div className="flex flex-col items-end gap-2">
                   <div className="flex items-center gap-2 bg-black/40 p-1.5 rounded-sm border border-white/5">
                        <span className="text-[9px] font-bold uppercase text-tactical-light">Rem. Matches:</span>
                        <input 
                            type="number" 
                            min="1" 
                            max="20" 
                            value={matchesRemaining} 
                            onChange={(e) => setMatchesRemaining(Math.max(1, parseInt(e.target.value) || 0))}
                            className="w-10 bg-black border border-tactical-gray rounded-sm text-center text-white font-mono text-xs focus:border-blue-500 outline-none p-0.5"
                        />
                   </div>
                   <button 
                      onClick={handleSimulate}
                      disabled={isSimulating}
                      className="px-3 py-1.5 bg-blue-600 text-white text-[10px] font-bold uppercase rounded-sm hover:bg-blue-500 transition-colors flex items-center gap-2 disabled:opacity-50"
                   >
                      {isSimulating ? <RefreshCw className="w-3 h-3 animate-spin"/> : <TrendingUp className="w-3 h-3"/>}
                      {isSimulating ? 'Simulating...' : 'Run Sim'}
                   </button>
               </div>
           </div>
       </div>

       {predictions.length === 0 ? (
           <div className="h-[200px] flex flex-col items-center justify-center border border-dashed border-tactical-gray rounded-sm bg-black/20">
               <Target className="w-12 h-12 text-tactical-gray mb-3 opacity-50" />
               <p className="text-sm font-mono text-tactical-light uppercase">No Projection Data</p>
               <button onClick={handleSimulate} className="mt-4 text-blue-400 hover:text-white text-xs underline">Initialize Forecast Model</button>
           </div>
       ) : (
           <div className="flex flex-col gap-6">
               {/* Chart Area */}
               <div className="h-[250px] w-full bg-black/20 rounded-sm border border-white/5 p-2">
                   <ResponsiveContainer width="100%" height="100%">
                       <BarChart data={displayData} layout="vertical" margin={{ left: 40, right: 20, top: 5, bottom: 5 }}>
                           <CartesianGrid stroke="#2A2A2A" horizontal={true} vertical={false} />
                           <XAxis type="number" hide domain={[0, 100]} />
                           <YAxis dataKey="teamName" type="category" width={90} tick={{ fontSize: 9, fill: '#fff', fontWeight: 600 }} tickLine={false} axisLine={false} />
                           <Tooltip 
                                cursor={{fill: 'rgba(255,255,255,0.05)'}}
                                content={({ active, payload }) => {
                                    if (active && payload && payload.length) {
                                        const d = payload[0].payload;
                                        return (
                                            <div className="bg-tactical-black border border-tactical-gray p-3 rounded-sm shadow-xl z-50">
                                                <div className="font-bold text-white mb-1">{d.teamName}</div>
                                                <div className="text-xs text-tactical-light font-mono">Current Pts: {d.currentPoints}</div>
                                                <div className="text-xs text-blue-400 font-mono font-bold mt-1">Win Prob: {d.winProbability.toFixed(1)}%</div>
                                                <div className="text-xs text-green-400 font-mono font-bold">Top 3 Prob: {d.top3Probability.toFixed(1)}%</div>
                                                <div className="text-[10px] text-tactical-gray mt-1">Proj. Final: {d.projectedPoints.toFixed(0)}</div>
                                            </div>
                                        );
                                    }
                                    return null;
                                }}
                           />
                           <Bar dataKey="winProbability" stackId="a" fill="#3b82f6" barSize={8} radius={[0, 4, 4, 0]} name="Win %">
                               {displayData.map((entry, index) => (
                                   <Cell key={`cell-${index}`} fill={index === 0 ? '#3b82f6' : '#1e3a8a'} />
                               ))}
                           </Bar>
                       </BarChart>
                   </ResponsiveContainer>
               </div>

               {/* Top Contenders Panel */}
               <div className="bg-black/40 border border-tactical-gray/50 rounded-sm p-4 flex flex-col">
                   <h4 className="text-xs font-bold uppercase text-tactical-light mb-3 flex items-center gap-2">
                       <Trophy className="w-3 h-3 text-yellow-500" /> Contender Probability
                   </h4>
                   <div className="space-y-2 flex-1 overflow-y-auto pr-1 custom-scrollbar max-h-[200px]">
                       {displayData.slice(0, 5).map((team, idx) => (
                           <div key={team.teamName} className="flex items-center justify-between p-2 rounded-sm hover:bg-white/5 transition-colors border-b border-white/5 last:border-0">
                               <div className="flex items-center gap-2">
                                   <div className={`text-[10px] font-mono font-bold w-4 ${idx === 0 ? 'text-yellow-500' : 'text-tactical-gray'}`}>#{idx + 1}</div>
                                   <div>
                                       <div className="text-xs font-bold text-white truncate w-24">{team.teamName}</div>
                                   </div>
                               </div>
                               <div className="text-right flex items-center gap-3">
                                   <div className="flex flex-col items-end">
                                      <span className="text-[9px] text-tactical-gray uppercase">Win</span>
                                      <span className="text-xs font-black text-blue-400">{team.winProbability.toFixed(1)}%</span>
                                   </div>
                                   <div className="w-px h-6 bg-white/10"></div>
                                   <div className="flex flex-col items-end">
                                      <span className="text-[9px] text-tactical-gray uppercase">Top 3</span>
                                      <span className="text-xs font-bold text-green-500">{team.top3Probability.toFixed(0)}%</span>
                                   </div>
                               </div>
                           </div>
                       ))}
                   </div>
                   
                   <div className="mt-3 pt-3 border-t border-tactical-gray/30 text-[9px] text-tactical-gray font-mono leading-tight">
                       <AlertTriangle className="w-3 h-3 inline mr-1 text-yellow-600" />
                       Projections based on historical volatility.
                   </div>
               </div>
           </div>
       )}
    </div>
  );
};

export default PredictionWidget;
