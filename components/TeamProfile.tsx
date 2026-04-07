
import React, { useRef, useState } from 'react';
import { TeamData, PlayerDerived } from '../types';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { generateTeamProfileJSON, generateTeamHistoryCSV } from '../services/exportEngine';
import { generateScoutingReport } from '../services/gemini';
import { ArrowLeft, Trophy, Crosshair, Target, Activity, Shield, Users, TrendingUp, TrendingDown, Minus, GitGraph, MonitorPlay, Download, Loader2, Check, X, Skull, Zap, Clock, ExternalLink, FileJson, FileSpreadsheet, BrainCircuit } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';
import { toPng } from 'html-to-image';

interface TeamProfileProps {
  team: TeamData;
  onBack: () => void;
  onPlayerClick: (player: PlayerDerived) => void;
  onOpenStudio?: () => void; // New Prop
}

const COLORS = ['#ef4444', '#10b981', '#3b82f6', '#f59e0b', '#8b5cf6'];

const PlayerCardModal: React.FC<{ player: PlayerDerived, team: TeamData, onClose: () => void, onViewFull: () => void }> = ({ player, team, onClose, onViewFull }) => {
    // Calculate Win Rate based on match history intersection
    const wins = player.history?.filter(h => {
        const matchRes = team.history.find(th => th.matchId === h.matchId);
        return matchRes?.rank === 1;
    }).length || 0;
    
    const winRate = player.matchesPlayed > 0 ? (wins / player.matchesPlayed) * 100 : 0;
    const avgDmg = team.totalDamage / Math.max(1, team.matchesPlayed);
    const avgKills = team.totalFinishes / Math.max(1, team.matchesPlayed);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in zoom-in-95 duration-200" onClick={onClose}>
            <div className="bg-tactical-dark border border-tactical-gray w-full max-w-md rounded-sm shadow-2xl relative overflow-hidden" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="p-6 bg-black border-b border-tactical-gray relative">
                    <button onClick={onClose} className="absolute top-4 right-4 text-tactical-light hover:text-white transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-tactical-dark border border-tactical-gray rounded-full flex items-center justify-center">
                            <Users className="w-8 h-8 text-tactical-light" />
                        </div>
                        <div>
                            <div className="text-xs font-bold text-tactical-light uppercase mb-1">{team.name}</div>
                            <h2 className="text-2xl font-black text-white uppercase leading-none">{player.playerName}</h2>
                            <div className={`inline-block mt-2 px-2 py-0.5 text-[10px] font-bold uppercase rounded-sm border ${
                                player.carryClass === 'SYSTEM_COLLAPSE' ? 'border-tactical-red text-tactical-red bg-tactical-red/10' :
                                player.carryClass === 'HARD_CARRY' ? 'border-white text-white bg-white/10' :
                                'border-tactical-gray text-tactical-light'
                            }`}>
                                {player.carryClass.replace('_', ' ')}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-6 grid grid-cols-2 gap-4">
                    <div className="bg-black/30 p-3 rounded-sm border border-tactical-gray/50">
                        <div className="flex items-center gap-2 text-[10px] uppercase font-bold text-tactical-light mb-1">
                            <Skull className="w-3 h-3" /> Career Kills
                        </div>
                        <div className="text-2xl font-bold text-white">{player.finishes}</div>
                        <div className="text-[10px] text-tactical-gray mt-1">{player.kpm.toFixed(2)} KPM</div>
                    </div>
                    <div className="bg-black/30 p-3 rounded-sm border border-tactical-gray/50">
                        <div className="flex items-center gap-2 text-[10px] uppercase font-bold text-tactical-light mb-1">
                            <Crosshair className="w-3 h-3" /> Total Damage
                        </div>
                        <div className="text-2xl font-bold text-white">{(player.damage/1000).toFixed(1)}k</div>
                        <div className="text-[10px] text-tactical-gray mt-1">Avg: {(player.damage / Math.max(1, player.matchesPlayed)).toFixed(0)}</div>
                    </div>
                    <div className="bg-black/30 p-3 rounded-sm border border-tactical-gray/50">
                        <div className="flex items-center gap-2 text-[10px] uppercase font-bold text-tactical-light mb-1">
                            <Trophy className="w-3 h-3 text-yellow-500" /> Win Rate
                        </div>
                        <div className="text-2xl font-bold text-white">{winRate.toFixed(0)}%</div>
                        <div className="text-[10px] text-tactical-gray mt-1">{wins} Wins / {player.matchesPlayed} Matches</div>
                    </div>
                    <div className="bg-black/30 p-3 rounded-sm border border-tactical-gray/50">
                        <div className="flex items-center gap-2 text-[10px] uppercase font-bold text-tactical-light mb-1">
                            <Zap className="w-3 h-3" /> Impact Rating
                        </div>
                        <div className="text-2xl font-bold text-white">{player.impactScore.toFixed(0)}</div>
                        <div className="text-[10px] text-tactical-gray mt-1">{player.damageShare.toFixed(0)}% Share</div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="p-4 bg-black border-t border-tactical-gray flex justify-between items-center">
                    <div className="text-[10px] text-tactical-gray font-mono">
                        SURVIVAL: <span className="text-white">{player.playTimeMinutes.toFixed(0)}m</span>
                    </div>
                    <button 
                        onClick={onViewFull}
                        className="flex items-center gap-2 px-4 py-2 bg-white text-black font-bold uppercase text-xs rounded-sm hover:bg-tactical-light transition-colors"
                    >
                        Full Profile <ExternalLink className="w-3 h-3" />
                    </button>
                </div>
            </div>
        </div>
    );
};

const TeamProfile: React.FC<TeamProfileProps> = ({ team, onBack, onPlayerClick, onOpenStudio }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isSnapshotting, setIsSnapshotting] = useState(false);
  const [snapDone, setSnapDone] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerDerived | null>(null);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const [scoutingReport, setScoutingReport] = useState<string | null>(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  const historyData = team.history.map((h, i) => {
    // Parse matchId to get friendly label if possible
    const parts = h.matchId.match(/d(\d+)-m(\d+)/);
    const label = parts ? `M${parts[2]} (D${parts[1]})` : h.matchId;

    return {
        match: label,
        points: h.points,
        rank: h.rank,
        cumulative: team.history.slice(0, i + 1).reduce((sum, x) => sum + x.points, 0)
    };
  });

  const damageData = team.players.map(p => ({
    name: p.playerName,
    value: p.damage
  }));

  // Calculate Consistency (Coefficient of Variation)
  // Lower CV = More Consistent
  const pointsList = team.history.map(h => h.points);
  const mean = pointsList.reduce((a,b) => a+b, 0) / Math.max(1, pointsList.length);
  const variance = pointsList.reduce((a,b) => a + Math.pow(b - mean, 2), 0) / Math.max(1, pointsList.length);
  const stdDev = Math.sqrt(variance);
  const cv = mean > 0 ? (stdDev / mean) * 100 : 0;
  
  let consistencyLabel = 'Volatile';
  let consistencyColor = 'text-tactical-red';
  if (cv < 40) { consistencyLabel = 'Disciplined'; consistencyColor = 'text-tactical-green'; }
  else if (cv < 80) { consistencyLabel = 'Balanced'; consistencyColor = 'text-white'; }

  const handleDownload = async () => {
      if (!containerRef.current) return;
      setIsSnapshotting(true);
      try {
          const dataUrl = await toPng(containerRef.current, { backgroundColor: '#0E0E0E', pixelRatio: 2 });
          const link = document.createElement('a');
          link.download = `scarfall_team_profile_${team.name}_${Date.now()}.png`;
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

  const handleExportJSON = () => {
      const json = generateTeamProfileJSON(team);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${team.name}_Profile_${Date.now()}.json`;
      link.click();
      setIsExportMenuOpen(false);
  };

  const handleExportCSV = () => {
      const csv = generateTeamHistoryCSV(team);
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${team.name}_History_${Date.now()}.csv`;
      link.click();
      setIsExportMenuOpen(false);
  };

  const handleGenerateReport = async () => {
      setIsGeneratingReport(true);
      const statsJson = JSON.stringify({
          name: team.name,
          rank: team.rank,
          points: team.totalPoints,
          kills: team.totalFinishes,
          damage: team.totalDamage,
          matches: team.matchesPlayed,
          consistency: consistencyLabel,
          cv: cv.toFixed(1),
          efficiency: team.efficiencyRating.toFixed(1),
          aggression: team.aggressionIndex.toFixed(1),
          trend: team.trend,
          players: team.players.map(p => ({
              name: p.playerName,
              kills: p.finishes,
              damage: p.damage,
              dpk: p.dpk.toFixed(0),
              impact: p.impactScore.toFixed(1),
              carryClass: p.carryClass
          }))
      });
      const report = await generateScoutingReport(team.name, 'team', statsJson);
      setScoutingReport(report);
      setIsGeneratingReport(false);
  };

  return (
    <div ref={containerRef} className="animate-in slide-in-from-right-8 duration-500 bg-tactical-black p-4 sm:p-6 rounded-lg relative">
      {/* Player Modal */}
      {selectedPlayer && (
          <PlayerCardModal 
              player={selectedPlayer} 
              team={team} 
              onClose={() => setSelectedPlayer(null)} 
              onViewFull={() => {
                  onPlayerClick(selectedPlayer);
                  setSelectedPlayer(null);
              }} 
          />
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <button 
            onClick={onBack}
            className="flex items-center gap-2 text-xs font-bold font-mono text-tactical-light hover:text-white uppercase tracking-widest mb-2 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Return to Dashboard
          </button>
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <h2 className="text-3xl sm:text-4xl font-serif font-bold text-white uppercase tracking-tight break-words">
                {team.name}
            </h2>
            {team.rank <= 3 && <Trophy className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-500" />}
          </div>
          <div className="flex flex-wrap gap-2 text-xs font-mono text-tactical-light mt-2 items-center">
             <span className="bg-tactical-dark px-2 py-0.5 border border-tactical-gray rounded-sm text-white font-bold">RANK #{team.rank}</span>
             <span className="w-px h-3 bg-tactical-gray"></span>
             <span className="flex items-center gap-1">
                TREND: {team.trend === 'RISING' ? <span className="text-tactical-green flex items-center gap-1"><TrendingUp className="w-3 h-3"/> Rising</span> : team.trend === 'FALLING' ? <span className="text-tactical-red flex items-center gap-1"><TrendingDown className="w-3 h-3"/> Falling</span> : <span className="flex items-center gap-1"><Minus className="w-3 h-3"/> Stable</span>}
             </span>
             {team.flags.length > 0 && <span className="w-px h-3 bg-tactical-gray"></span>}
             {team.flags.map(f => <span key={f} className="text-tactical-red font-bold px-2 py-0.5 bg-tactical-red/10 border border-tactical-red/20 rounded-sm">{f}</span>)}
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2 self-start md:self-auto">
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
                    <MonitorPlay className="w-4 h-4" /> Create Card
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

      {/* KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        <div className="bg-tactical-dark p-4 border border-tactical-gray rounded-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity"><Trophy className="w-8 h-8" /></div>
          <div className="text-xs text-tactical-light font-mono uppercase tracking-widest mb-1">Total Points</div>
          <div className="text-2xl font-bold text-white">{team.totalPoints}</div>
          <div className="text-[10px] text-tactical-gray mt-2">Placed + Kill Pts</div>
        </div>
        <div className="bg-tactical-dark p-4 border border-tactical-gray rounded-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity"><Crosshair className="w-8 h-8" /></div>
          <div className="text-xs text-tactical-light font-mono uppercase tracking-widest mb-1">Kill Count</div>
          <div className="text-2xl font-bold text-white">{team.totalFinishes}</div>
          <div className="text-[10px] text-tactical-gray mt-2">{(team.totalFinishes / (team.matchesPlayed || 1)).toFixed(1)} per Match</div>
        </div>
        <div className="bg-tactical-dark p-4 border border-tactical-gray rounded-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity"><Target className="w-8 h-8" /></div>
          <div className="text-xs text-tactical-light font-mono uppercase tracking-widest mb-1">Avg Damage</div>
          <div className="text-2xl font-bold text-white">{(team.totalDamage / (team.matchesPlayed || 1)).toFixed(0)}</div>
          <div className="text-[10px] text-tactical-gray mt-2">Conversion: {team.conversionRate.toFixed(0)} dmg/kill</div>
        </div>
        <div className="bg-tactical-dark p-4 border border-tactical-gray rounded-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity"><Activity className="w-8 h-8" /></div>
          <div className="text-xs text-tactical-light font-mono uppercase tracking-widest mb-1">Aggression</div>
          <div className="text-2xl font-bold text-white">{team.aggressionIndex.toFixed(0)}</div>
          <div className="text-[10px] text-tactical-gray mt-2">Survival-Adjusted IDX</div>
        </div>
        <div className="bg-tactical-dark p-4 border border-tactical-gray rounded-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity"><GitGraph className="w-8 h-8" /></div>
          <div className="text-xs text-tactical-light font-mono uppercase tracking-widest mb-1">Consistency</div>
          <div className={`text-2xl font-bold ${consistencyColor}`}>{consistencyLabel}</div>
          <div className="text-[10px] text-tactical-gray mt-2">CV: {cv.toFixed(0)}% (Low is good)</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* Match Performance Chart */}
        <div className="lg:col-span-2 bg-tactical-dark border border-tactical-gray rounded-sm p-5 h-[350px] flex flex-col">
           <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-4 flex items-center gap-2">
             <TrendingUp className="w-4 h-4 text-tactical-red" /> Performance Trajectory
           </h3>
           <div className="flex-1 w-full text-xs font-mono">
             <ResponsiveContainer width="100%" height="100%">
               <AreaChart data={historyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                 <defs>
                    <linearGradient id="colorPoints" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                    </linearGradient>
                 </defs>
                 <CartesianGrid strokeDasharray="3 3" stroke="#2A2A2A" vertical={false} />
                 <XAxis dataKey="match" stroke="#555" tick={{fill: '#777'}} />
                 <YAxis stroke="#555" tick={{fill: '#777'}} />
                 <Tooltip 
                    contentStyle={{ backgroundColor: '#0E0E0E', borderColor: '#333' }}
                    itemStyle={{ color: '#fff' }}
                    labelStyle={{ color: '#888', marginBottom: '0.5rem' }}
                 />
                 <Area type="monotone" dataKey="points" stroke="#ef4444" fillOpacity={1} fill="url(#colorPoints)" strokeWidth={2} name="Points Earned" />
                 <Area type="step" dataKey="cumulative" stroke="#fff" fill="transparent" strokeDasharray="3 3" name="Cumulative" />
               </AreaChart>
             </ResponsiveContainer>
           </div>
        </div>

        {/* Damage Share Pie */}
        <div className="bg-tactical-dark border border-tactical-gray rounded-sm p-5 h-[350px] flex flex-col">
           <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-4 flex items-center gap-2">
             <Users className="w-4 h-4 text-tactical-light" /> Damage Distribution
           </h3>
           <div className="flex-1 w-full relative">
             <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={damageData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {damageData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="rgba(0,0,0,0.5)" />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0E0E0E', borderColor: '#333' }}
                    itemStyle={{ color: '#fff' }}
                  />
                </PieChart>
             </ResponsiveContainer>
             {/* Legend Overlay */}
             <div className="absolute bottom-0 left-0 right-0 flex justify-center gap-3 flex-wrap">
                {damageData.map((d, i) => (
                    <div key={d.name} className="flex items-center gap-1.5 text-[10px] uppercase font-mono text-tactical-light">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }}></div>
                        {d.name}
                    </div>
                ))}
             </div>
           </div>
        </div>
      </div>

      {/* Roster Table */}
      <div className="bg-tactical-dark border border-tactical-gray rounded-sm overflow-hidden">
         <div className="bg-black/40 px-6 py-4 border-b border-tactical-gray flex justify-between items-center">
            <h3 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
                <Shield className="w-4 h-4" /> Active Roster
            </h3>
            <span className="text-[10px] text-tactical-light font-mono">SELECT OPERATOR FOR STATS</span>
         </div>
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4">
            {team.players.map(player => (
                <div 
                    key={player.playerName}
                    onClick={() => setSelectedPlayer(player)}
                    className="p-4 bg-black border border-tactical-gray rounded-sm hover:border-tactical-light cursor-pointer group transition-all"
                >
                    <div className="flex justify-between items-start mb-3">
                        <div className="font-bold text-white group-hover:text-tactical-red transition-colors">{player.playerName}</div>
                        <div className={`text-[9px] px-1.5 py-0.5 rounded-sm font-bold uppercase ${
                            player.carryClass === 'SYSTEM_COLLAPSE' ? 'bg-tactical-red text-white' :
                            player.carryClass === 'HARD_CARRY' ? 'bg-white text-black' :
                            'bg-tactical-gray text-tactical-light'
                        }`}>
                            {player.carryClass.replace('_', ' ')}
                        </div>
                    </div>
                    <div className="space-y-2 text-xs font-mono text-tactical-light">
                        <div className="flex justify-between"><span>Dmg Share</span><span className="text-white font-bold">{player.damageShare.toFixed(1)}%</span></div>
                        <div className="flex justify-between"><span>Z-Score</span><span className={player.zScoreDamage > 0 ? 'text-tactical-green' : 'text-tactical-red'}>{player.zScoreDamage.toFixed(2)}</span></div>
                        <div className="w-full bg-tactical-gray/30 h-1 rounded-full mt-2 overflow-hidden">
                            <div className="bg-white h-full" style={{ width: `${Math.min(100, (player.damage / 2000) * 100)}%` }}></div>
                        </div>
                    </div>
                </div>
            ))}
         </div>
      </div>
    </div>
  );
};

export default TeamProfile;
