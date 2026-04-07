
import React, { useState, useRef } from 'react';
import { PlayerDerived, TeamData } from '../types';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { generatePlayerProfileJSON, generatePlayerHistoryCSV } from '../services/exportEngine';
import { generateScoutingReport } from '../services/gemini';
import { ArrowLeft, Crosshair, Skull, ShieldAlert, Zap, BarChart2, TrendingUp, Activity, History, MonitorPlay, Download, FileJson, FileSpreadsheet, Loader2, Check, Trophy, Gamepad2, BrainCircuit, X } from 'lucide-react';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Cell, ReferenceLine, AreaChart, Area, ComposedChart, Line, Brush } from 'recharts';
import { toPng } from 'html-to-image';

interface PlayerProfileProps {
  player: PlayerDerived;
  team: TeamData;
  onBack: () => void;
  onOpenStudio?: () => void; // New Prop
}

const PlayerProfile: React.FC<PlayerProfileProps> = ({ player, team, onBack, onOpenStudio }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const [isSnapshotting, setIsSnapshotting] = useState(false);
  const [snapDone, setSnapDone] = useState(false);
  const [scoutingReport, setScoutingReport] = useState<string | null>(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  
  // Calculate Avg Team Stats for comparison
  const avgDmg = team.totalDamage / team.players.length;
  const avgKills = team.totalFinishes / team.players.length;
  const avgTime = team.avgSurvivalTime;

  // Calculate Win Rate
  const wins = player.history?.filter(h => {
      const matchRes = team.history.find(th => th.matchId === h.matchId);
      return matchRes?.rank === 1;
  }).length || 0;
  const winRate = player.matchesPlayed > 0 ? (wins / player.matchesPlayed) * 100 : 0;

  const radarData = [
    { subject: 'Damage', A: (player.damage / Math.max(1, avgDmg)) * 100, fullMark: 150 },
    { subject: 'Kills', A: (player.finishes / Math.max(1, avgKills)) * 100, fullMark: 150 },
    { subject: 'Survival', A: (player.playTimeMinutes / Math.max(1, avgTime)) * 100, fullMark: 150 },
    { subject: 'Impact', A: Math.min(150, (player.impactScore / (team.totalPoints / team.players.length)) * 100), fullMark: 150 },
    { subject: 'Share', A: player.damageShare * 2, fullMark: 150 }, // Scale share to look good on radar
  ];

  // Current Overall Z-Scores (for the single bar chart)
  const zScoreData = [
    { name: 'Damage', val: player.zScoreDamage },
    { name: 'Kills', val: player.zScoreKills },
  ];

  const hasHistory = player.history && player.history.length > 1;
  const recentHistory = player.history ? player.history.slice(-5).reverse() : [];

  // Data for Z-Score Trend Chart (Performance Deviation)
  const deviationData = player.history?.map(h => {
      // Create a simplified match label
      const parts = h.matchId.match(/d(\d+)-m(\d+)/);
      const label = parts ? `M${parts[2]}` : h.matchId;
      return {
          match: label,
          zDmg: h.zScoreDamage || 0,
          zKills: h.zScoreKills || 0,
          rawDmg: h.damage,
          rawKills: h.finishes,
          fullMatchId: h.matchId
      };
  }) || [];

  const CustomTrendTooltip = ({ active, payload, label }: any) => {
      if (active && payload && payload.length) {
          const data = payload[0].payload;
          // Check if we are in deviation data or raw history data
          const isDeviation = data.zDmg !== undefined;
          
          return (
              <div className="bg-tactical-black p-3 border border-tactical-gray rounded-sm shadow-xl z-50 min-w-[160px]">
                  <p className="text-white font-bold text-[10px] font-mono mb-2 border-b border-gray-700 pb-1 uppercase tracking-wider">
                      {data.fullMatchId || data.matchId || label}
                  </p>
                  <div className="space-y-2">
                      {isDeviation ? (
                          <>
                            <div>
                                <div className="flex items-center gap-2 text-[9px] font-mono text-tactical-light uppercase">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                                    Damage Deviation
                                </div>
                                <div className="flex justify-between items-baseline pl-3">
                                    <span className="text-white font-bold text-xs">{data.zDmg.toFixed(2)}σ</span>
                                    <span className="text-tactical-gray text-[9px]">{data.rawDmg.toLocaleString()} raw</span>
                                </div>
                            </div>
                            <div>
                                <div className="flex items-center gap-2 text-[9px] font-mono text-tactical-light uppercase">
                                    <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
                                    Kills Deviation
                                </div>
                                <div className="flex justify-between items-baseline pl-3">
                                    <span className="text-white font-bold text-xs">{data.zKills.toFixed(2)}σ</span>
                                    <span className="text-tactical-gray text-[9px]">{data.rawKills} raw</span>
                                </div>
                            </div>
                          </>
                      ) : (
                          <>
                            {payload.map((entry: any, index: number) => (
                                <div key={index} className="flex justify-between items-center gap-4">
                                    <div className="flex items-center gap-2 text-[9px] font-mono text-tactical-light uppercase">
                                        <div className="w-1.5 h-1.5 rounded-full" style={{backgroundColor: entry.color}}></div>
                                        {entry.name}
                                    </div>
                                    <span className="text-white font-bold text-xs">{entry.value.toLocaleString()}</span>
                                </div>
                            ))}
                          </>
                      )}
                  </div>
              </div>
          );
      }
      return null;
  };

  const handleExportJSON = () => {
      const json = generatePlayerProfileJSON(player, team.name);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${player.playerName}_Profile_${Date.now()}.json`;
      link.click();
      setIsExportMenuOpen(false);
  };

  const handleExportCSV = () => {
      const csv = generatePlayerHistoryCSV(player);
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${player.playerName}_History_${Date.now()}.csv`;
      link.click();
      setIsExportMenuOpen(false);
  };

  const handleDownload = async () => {
      if (!containerRef.current) return;
      setIsSnapshotting(true);
      try {
          const dataUrl = await toPng(containerRef.current, { backgroundColor: '#0E0E0E', pixelRatio: 2 });
          const link = document.createElement('a');
          link.download = `scarfall_player_profile_${player.playerName}_${Date.now()}.png`;
          link.href = dataUrl;
          link.click();
          setSnapDone(true);
          setTimeout(() => setSnapDone(false), 2000);
      } catch (e) {
          console.error(e);
      } finally {
          setIsSnapshotting(false);
      }
  };

  const handleGenerateReport = async () => {
      setIsGeneratingReport(true);
      const statsJson = JSON.stringify({
          name: player.playerName,
          team: team.name,
          kills: player.finishes,
          damage: player.damage,
          dpk: player.dpk.toFixed(0),
          matches: player.matchesPlayed,
          survivalTime: player.playTimeMinutes,
          carryClass: player.carryClass,
          winRate: winRate.toFixed(1),
          zScoreDamage: player.zScoreDamage.toFixed(2),
          zScoreKills: player.zScoreKills.toFixed(2),
          impactScore: player.impactScore.toFixed(1),
          damageShare: player.damageShare.toFixed(1),
          kpm: player.kpm.toFixed(2)
      });
      const report = await generateScoutingReport(player.playerName, 'player', statsJson);
      setScoutingReport(report);
      setIsGeneratingReport(false);
  };

  return (
    <div ref={containerRef} className="animate-in slide-in-from-right-8 duration-500 max-w-7xl mx-auto pb-12 bg-tactical-black p-4 sm:p-6 rounded-lg">
      {/* Header */}
      <div className="flex flex-col gap-4 mb-8">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-xs font-bold font-mono text-tactical-light hover:text-white uppercase tracking-widest self-start transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Return to Squad View
        </button>
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
            <div>
            <h2 className="text-3xl md:text-5xl font-serif font-bold text-white uppercase tracking-tight break-words">
                {player.playerName}
            </h2>
            <div className="flex items-center gap-3 text-sm font-mono text-tactical-light mt-2">
                <span className="text-white font-bold">{team.name}</span>
                <span className="w-px h-3 bg-tactical-gray"></span>
                <span className={`px-2 py-0.5 rounded-sm text-[10px] uppercase font-bold border ${
                    player.carryClass === 'SYSTEM_COLLAPSE' ? 'border-tactical-red text-tactical-red bg-tactical-red/10' :
                    player.carryClass === 'HARD_CARRY' ? 'border-white text-white bg-white/10' :
                    'border-tactical-gray text-tactical-light'
                }`}>
                    {player.carryClass.replace('_', ' ')}
                </span>
            </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
                <button 
                  onClick={handleGenerateReport}
                  disabled={isGeneratingReport}
                  className="flex items-center gap-2 px-4 py-2 bg-tactical-dark border border-tactical-gray text-white font-bold uppercase text-xs tracking-wider hover:border-red-500 rounded-sm transition-colors disabled:opacity-50"
                >
                  {isGeneratingReport ? <Loader2 className="w-4 h-4 animate-spin" /> : <BrainCircuit className="w-4 h-4 text-red-500" />} AI Report
                </button>
                {onOpenStudio && (
                    <button 
                        onClick={onOpenStudio}
                        className="flex items-center gap-2 px-4 py-2 bg-tactical-dark border border-tactical-gray text-white font-bold uppercase text-xs tracking-wider hover:bg-white/10 rounded-sm transition-colors"
                    >
                        <MonitorPlay className="w-4 h-4" /> Card
                    </button>
                )}
                <button 
                    onClick={handleDownload}
                    disabled={isSnapshotting}
                    className="flex items-center gap-2 px-4 py-2 bg-tactical-dark border border-tactical-gray text-white font-bold uppercase text-xs tracking-wider hover:bg-white/10 rounded-sm transition-colors"
                >
                    {isSnapshotting ? <Loader2 className="w-4 h-4 animate-spin"/> : snapDone ? <Check className="w-4 h-4 text-green-500"/> : <Download className="w-4 h-4" />} PNG
                </button>
                
                <div className="relative">
                    <button 
                        onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
                        className="flex items-center gap-2 px-4 py-2 bg-black border border-tactical-gray text-tactical-light font-bold uppercase text-xs tracking-wider hover:text-white hover:border-white rounded-sm transition-colors"
                    >
                        <Download className="w-4 h-4" /> Data
                    </button>
                    
                    {isExportMenuOpen && (
                        <div className="absolute right-0 top-full mt-2 w-48 bg-tactical-black border border-tactical-gray rounded-sm shadow-xl z-50 p-1 flex flex-col gap-1 animate-in fade-in zoom-in-95 duration-100">
                            <button onClick={handleExportJSON} className="flex items-center gap-3 px-3 py-2 text-xs font-mono text-tactical-light hover:text-white hover:bg-white/10 text-left w-full rounded-sm transition-colors">
                                <FileJson className="w-3 h-3 text-yellow-500" /> Full Profile (JSON)
                            </button>
                            <button onClick={handleExportCSV} className="flex items-center gap-3 px-3 py-2 text-xs font-mono text-tactical-light hover:text-white hover:bg-white/10 text-left w-full rounded-sm transition-colors">
                                <FileSpreadsheet className="w-3 h-3 text-green-500" /> Match History (CSV)
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
      </div>

      {/* AI Scouting Report */}
      {scoutingReport && (
          <div className="mb-8 bg-black/50 border border-red-500/30 rounded-lg p-6 relative">
              <button 
                  onClick={() => setScoutingReport(null)}
                  className="absolute top-4 right-4 text-tactical-light hover:text-white"
              >
                  <X className="w-4 h-4" />
              </button>
              <div className="flex items-center gap-2 mb-4">
                  <BrainCircuit className="w-5 h-5 text-red-500" />
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">AI Scouting Report</h3>
              </div>
              <div className="text-tactical-light text-sm leading-relaxed">
                  <div className="markdown-body">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {scoutingReport}
                      </ReactMarkdown>
                  </div>
              </div>
          </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        
        {/* Left Col: Stats & Z-Score */}
        <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-tactical-dark p-4 border border-tactical-gray rounded-sm">
                    <div className="text-tactical-light text-[10px] uppercase font-mono mb-1 flex items-center gap-1"><Crosshair className="w-3 h-3"/> Damage Output</div>
                    <div className="text-2xl font-bold text-white">{player.damage.toLocaleString()}</div>
                    <div className={`text-[10px] mt-1 ${player.damage > avgDmg ? 'text-tactical-green' : 'text-tactical-red'}`}>
                        {player.damage > avgDmg ? '+' : ''}{((player.damage - avgDmg)).toFixed(0)} vs Avg
                    </div>
                </div>
                <div className="bg-tactical-dark p-4 border border-tactical-gray rounded-sm">
                    <div className="text-tactical-light text-[10px] uppercase font-mono mb-1 flex items-center gap-1"><Skull className="w-3 h-3"/> Confirmed Kills</div>
                    <div className="text-2xl font-bold text-white">{player.finishes}</div>
                    <div className="text-[10px] mt-1 text-tactical-gray">
                        {player.kpm.toFixed(2)} KPM
                    </div>
                </div>
                <div className="bg-tactical-dark p-4 border border-tactical-gray rounded-sm">
                    <div className="text-tactical-light text-[10px] uppercase font-mono mb-1 flex items-center gap-1"><Gamepad2 className="w-3 h-3"/> Matches</div>
                    <div className="text-2xl font-bold text-white">{player.matchesPlayed}</div>
                    <div className="text-[10px] mt-1 text-tactical-gray">Participation</div>
                </div>
                <div className="bg-tactical-dark p-4 border border-tactical-gray rounded-sm">
                    <div className="text-tactical-light text-[10px] uppercase font-mono mb-1 flex items-center gap-1"><Trophy className="w-3 h-3"/> Win Rate</div>
                    <div className="text-2xl font-bold text-white">{winRate.toFixed(0)}%</div>
                    <div className="text-[10px] mt-1 text-tactical-gray">{wins} Wins</div>
                </div>
                <div className="bg-tactical-dark p-4 border border-tactical-gray rounded-sm">
                    <div className="text-tactical-light text-[10px] uppercase font-mono mb-1 flex items-center gap-1"><Activity className="w-3 h-3"/> Survival Time</div>
                    <div className="text-2xl font-bold text-white">{player.playTimeMinutes.toFixed(1)}m</div>
                </div>
                <div className="bg-tactical-dark p-4 border border-tactical-gray rounded-sm">
                    <div className="text-tactical-light text-[10px] uppercase font-mono mb-1 flex items-center gap-1"><Zap className="w-3 h-3"/> Impact Score</div>
                    <div className="text-2xl font-bold text-white">{player.impactScore.toFixed(0)}</div>
                </div>
            </div>

            {/* Radar Chart */}
            <div className="bg-tactical-dark border border-tactical-gray rounded-sm p-4 flex flex-col items-center justify-center relative h-[300px]">
                 <div className="absolute top-4 left-4 text-xs font-mono text-tactical-light uppercase">
                    vs Team Average
                 </div>
                 <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="55%" outerRadius="65%" data={radarData}>
                    <PolarGrid stroke="#2A2A2A" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#7A7A7A', fontSize: 10, fontFamily: 'monospace' }} />
                    <PolarRadiusAxis angle={30} domain={[0, 150]} tick={false} axisLine={false} />
                    <Radar
                        name={player.playerName}
                        dataKey="A"
                        stroke="#fff"
                        strokeWidth={2}
                        fill="#fff"
                        fillOpacity={0.1}
                    />
                    <Tooltip contentStyle={{backgroundColor: '#0E0E0E', borderColor: '#333'}} />
                    </RadarChart>
                </ResponsiveContainer>
                 {/* Outlier Warning */}
                 {player.isOutlier && (
                     <div className="absolute bottom-4 flex items-center gap-2 bg-tactical-red/10 border border-tactical-red/30 px-3 py-1.5 rounded-full">
                         <ShieldAlert className="w-3 h-3 text-tactical-red" />
                         <span className="text-[10px] text-tactical-red font-bold uppercase">{player.outlierReason || 'Anomaly'}</span>
                     </div>
                 )}
            </div>
        </div>

        {/* Right Col: Advanced Charts */}
        <div className="lg:col-span-2 space-y-4">
            
            {/* Performance Deviation (Z-Score Trend) */}
            <div className="bg-tactical-dark border border-tactical-gray rounded-sm p-5 h-[320px] flex flex-col">
                <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-blue-400" /> Performance Deviation (Trend)
                </h3>
                <div className="flex-1 w-full">
                    {hasHistory ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={deviationData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#2A2A2A" vertical={false} />
                                <XAxis dataKey="match" stroke="#555" tick={{fill: '#777', fontSize: 10}} />
                                <YAxis stroke="#555" tick={{fill: '#777', fontSize: 10}} domain={[-3, 3]} />
                                <Tooltip content={<CustomTrendTooltip />} />
                                <ReferenceLine y={0} stroke="#777" strokeDasharray="3 3" />
                                <Bar dataKey="zDmg" name="Damage σ" barSize={20}>
                                    {deviationData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.zDmg >= 0 ? '#10b981' : '#ef4444'} fillOpacity={0.8} />
                                    ))}
                                </Bar>
                                <Line type="monotone" dataKey="zKills" name="Kills σ" stroke="#fff" strokeWidth={2} dot={{fill: '#000', strokeWidth: 2}} />
                                {deviationData.length > 8 && (
                                    <Brush 
                                        dataKey="match" 
                                        height={20} 
                                        stroke="#444" 
                                        fill="#0E0E0E" 
                                        travellerWidth={10}
                                    />
                                )}
                            </ComposedChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center opacity-50">
                            <Activity className="w-8 h-8 text-tactical-light mb-2" />
                            <p className="text-xs font-mono text-tactical-light uppercase">Insufficient Data for Deviation Analysis</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Combat Volume (Original Trend) */}
            <div className="bg-tactical-dark border border-tactical-gray rounded-sm p-5 h-[280px] flex flex-col">
                <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-4 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-tactical-red" /> Output Volume
                </h3>
                <div className="flex-1 w-full">
                    {hasHistory ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={player.history} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorDmg" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#2A2A2A" vertical={false} />
                                <XAxis 
                                    dataKey="matchId" 
                                    stroke="#555" 
                                    tick={{fill: '#777', fontSize: 10}} 
                                    tickFormatter={(val) => {
                                        const parts = val.match(/d(\d+)-m(\d+)/);
                                        return parts ? `M${parts[2]}` : val;
                                    }}
                                />
                                <YAxis yAxisId="left" stroke="#ef4444" tick={{fill: '#ef4444', fontSize: 10}} />
                                <YAxis yAxisId="right" orientation="right" stroke="#fff" tick={{fill: '#fff', fontSize: 10}} />
                                <Tooltip content={<CustomTrendTooltip />} />
                                <Area yAxisId="left" type="monotone" dataKey="damage" stroke="#ef4444" fillOpacity={1} fill="url(#colorDmg)" name="Damage" />
                                <Line yAxisId="right" type="monotone" dataKey="impact" stroke="#fff" strokeWidth={2} dot={{fill: '#000', strokeWidth: 2}} name="Impact Score" />
                            </ComposedChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center opacity-50">
                            <Activity className="w-8 h-8 text-tactical-light mb-2" />
                            <p className="text-xs font-mono text-tactical-light uppercase">Insufficient Data for Volume Analysis</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
      </div>

      {/* Recent Match Strip */}
      <div className="mt-8">
          <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-4 flex items-center gap-2">
             <History className="w-4 h-4 text-tactical-light" /> Recent Operations
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {recentHistory.map((h, i) => (
                  <div key={i} className="bg-tactical-dark border border-tactical-gray p-3 rounded-sm hover:border-tactical-light transition-colors group">
                      <div className="flex justify-between items-center mb-2">
                          <span className="text-[10px] font-mono text-tactical-light uppercase">{h.matchId.replace('d', 'Day ').replace('-m', ' Match ')}</span>
                          <span className="text-[10px] font-bold text-white bg-white/10 px-1.5 rounded">{h.impact.toFixed(0)}</span>
                      </div>
                      <div className="space-y-1">
                          <div className="flex justify-between text-xs font-mono">
                              <span className="text-tactical-gray">Kills</span>
                              <span className="text-white group-hover:text-tactical-red font-bold">{h.finishes}</span>
                          </div>
                          <div className="flex justify-between text-xs font-mono">
                              <span className="text-tactical-gray">Dmg</span>
                              <span className="text-white">{h.damage}</span>
                          </div>
                          {(h.zScoreDamage !== undefined) && (
                              <div className="flex justify-between text-[10px] font-mono border-t border-tactical-gray/30 pt-1 mt-1">
                                  <span className="text-tactical-gray">Dev.</span>
                                  <span className={h.zScoreDamage >= 0 ? 'text-tactical-green' : 'text-tactical-red'}>{h.zScoreDamage > 0 ? '+' : ''}{h.zScoreDamage.toFixed(2)}σ</span>
                              </div>
                          )}
                      </div>
                  </div>
              ))}
              {recentHistory.length === 0 && (
                  <div className="col-span-5 text-center p-4 text-xs text-tactical-gray font-mono uppercase border border-dashed border-tactical-gray rounded-sm">
                      No Recent Match Data
                  </div>
              )}
          </div>
      </div>
    </div>
  );
};

export default PlayerProfile;
