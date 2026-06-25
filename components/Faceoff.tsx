
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { TeamData, PlayerDerived } from '../types';
import { calculateHeadToHeadProbability } from '../services/analyticsEngine';
import { Swords, MonitorPlay, Skull, Shield, Zap, TrendingUp, AlertTriangle, History, BarChart2, Activity, Download, Loader2, Check } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, Tooltip, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend } from 'recharts';
import { toPng } from 'html-to-image';

interface FaceoffProps {
  data: TeamData[];
  onOpenStudio?: () => void;
}

// --- HELPER COMPONENTS ---

const StatButterfly: React.FC<{ label: string, valA: number, valB: number, unit?: string, inverse?: boolean, max?: number, isSnapshotting?: boolean }> = ({ label, valA, valB, unit = '', inverse = false, max, isSnapshotting = false }) => {
  const safeMax = max || Math.max(valA, valB, 1) * 1.2;
  const widthA = (valA / safeMax) * 100;
  const widthB = (valB / safeMax) * 100;
  
  const winA = inverse ? valA < valB : valA > valB;
  const colorA = winA ? 'bg-tactical-red' : 'bg-white/20';
  const colorB = !winA && valA !== valB ? 'bg-blue-500' : 'bg-white/20';

  return (
    <div className="flex items-center gap-4 mb-2 group hover:bg-white/5 p-1 rounded-sm transition-colors">
        {/* Left Bar (Reversed) */}
        <div className="flex-1 flex justify-end items-center gap-2">
            <span className={`text-[10px] font-black font-mono ${winA ? 'text-tactical-red' : 'text-tactical-light'}`}>{valA.toFixed(1)}{unit}</span>
            <div className="h-1.5 flex-1 flex justify-end bg-black/50 rounded-sm overflow-hidden max-w-[80px]">
                <div className={`h-full ${colorA} ${isSnapshotting ? '' : 'transition-all duration-700'}`} style={{ width: `${widthA}%` }}></div>
            </div>
        </div>

        {/* Center Label */}
        <div className="w-24 text-center text-[9px] font-bold uppercase tracking-widest text-tactical-gray group-hover:text-white transition-colors">{label}</div>

        {/* Right Bar */}
        <div className="flex-1 flex justify-start items-center gap-2">
            <div className="h-1.5 flex-1 bg-black/50 rounded-sm overflow-hidden max-w-[80px]">
                <div className={`h-full ${colorB} ${isSnapshotting ? '' : 'transition-all duration-700'}`} style={{ width: `${widthB}%` }}></div>
            </div>
            <span className={`text-[10px] font-black font-mono ${!winA && valA !== valB ? 'text-blue-400' : 'text-tactical-light'}`}>{valB.toFixed(1)}{unit}</span>
        </div>
    </div>
  );
};

// --- SUB-VIEWS ---

const ComparativeRadar: React.FC<{ teamA: TeamData, teamB: TeamData, lobbyAvg: any, isSnapshotting?: boolean }> = ({ teamA, teamB, lobbyAvg, isSnapshotting = false }) => {
    // Normalize Data for Radar (0-100 scale)
    const maxPts = Math.max(teamA.totalPoints, teamB.totalPoints, 1) * 1.2;
    const maxKills = Math.max(teamA.totalFinishes, teamB.totalFinishes, 1) * 1.2;
    const maxSurv = 30; // Max Minutes
    const maxAgg = 100;
    const maxPlace = 10; // Top 10 placement points approx

    const data = [
        { subject: 'Points', A: (teamA.totalPoints/maxPts)*100, B: (teamB.totalPoints/maxPts)*100, fullMark: 100 },
        { subject: 'Kills', A: (teamA.totalFinishes/maxKills)*100, B: (teamB.totalFinishes/maxKills)*100, fullMark: 100 },
        { subject: 'Survival', A: (teamA.avgSurvivalTime/maxSurv)*100, B: (teamB.avgSurvivalTime/maxSurv)*100, fullMark: 100 },
        { subject: 'Aggression', A: teamA.aggressionIndex, B: teamB.aggressionIndex, fullMark: 100 },
        { subject: 'Place Pts', A: (teamA.placementPoints/Math.max(teamA.placementPoints, teamB.placementPoints, 1))*100, B: (teamB.placementPoints/Math.max(teamA.placementPoints, teamB.placementPoints, 1))*100, fullMark: 100 },
    ];

    return (
        <div className="h-[200px] w-full relative">
            <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
                    <PolarGrid stroke="#333" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#777', fontSize: 9, fontFamily: 'monospace' }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                    <Radar name={teamA.name} dataKey="A" stroke="#ef4444" strokeWidth={2} fill="#ef4444" fillOpacity={0.2} isAnimationActive={!isSnapshotting} />
                    <Radar name={teamB.name} dataKey="B" stroke="#3b82f6" strokeWidth={2} fill="#3b82f6" fillOpacity={0.2} isAnimationActive={!isSnapshotting} />
                    <Legend iconType="rect" wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }}/>
                    <Tooltip 
                        content={({ payload }) => {
                            if (!payload || !payload.length) return null;
                            const subject = payload[0].payload.subject;
                            return (
                                <div className="bg-black border border-tactical-gray p-2 text-xs font-mono">
                                    <div className="text-white mb-1 font-bold">{subject}</div>
                                    <div className="text-tactical-red">{teamA.name}: {Number(payload[0].value || 0).toFixed(0)}</div>
                                    <div className="text-blue-400">{teamB.name}: {Number(payload[1].value || 0).toFixed(0)}</div>
                                </div>
                            );
                        }}
                    />
                </RadarChart>
            </ResponsiveContainer>
        </div>
    );
};

const HeadToHeadLog: React.FC<{ teamA: TeamData, teamB: TeamData }> = ({ teamA, teamB }) => {
    // Merge histories to find common matches
    const history = useMemo(() => {
        const matches: any[] = [];
        teamA.history.forEach(hA => {
            const hB = teamB.history.find(h => h.matchId === hA.matchId);
            if (hB) {
                matches.push({
                    matchId: hA.matchId,
                    day: hA.day,
                    rankA: hA.rank,
                    rankB: hB.rank,
                    ptsA: hA.points,
                    ptsB: hB.points,
                    winner: hA.rank < hB.rank ? 'A' : 'B' // Lower rank wins
                });
            }
        });
        return matches.sort((a, b) => b.day - a.day || b.matchId.localeCompare(a.matchId)); // Newest first
    }, [teamA, teamB]);

    const winsA = history.filter(h => h.winner === 'A').length;
    const winsB = history.filter(h => h.winner === 'B').length;

    return (
        <div className="flex flex-col h-full">
            <div className="flex justify-between items-center mb-2 px-2">
                <span className="text-[10px] font-bold text-tactical-red">{winsA} Wins</span>
                <span className="text-[9px] font-mono text-tactical-light uppercase">Direct H2H (Rank)</span>
                <span className="text-[10px] font-bold text-blue-400">{winsB} Wins</span>
            </div>
            <div className="flex-1 overflow-y-auto max-h-[150px] space-y-1 pr-1 custom-scrollbar">
                {history.map((h) => (
                    <div key={h.matchId} className="flex items-center justify-between text-[10px] font-mono bg-black/40 p-1.5 rounded-sm border border-white/5 hover:bg-white/5 transition-colors">
                        <div className={`w-8 text-center font-bold ${h.winner === 'A' ? 'text-tactical-red' : 'text-tactical-gray'}`}>#{h.rankA}</div>
                        <div className="text-tactical-light">{h.matchId.replace('d','D').replace('-m',' M')}</div>
                        <div className={`w-8 text-center font-bold ${h.winner === 'B' ? 'text-blue-400' : 'text-tactical-gray'}`}>#{h.rankB}</div>
                    </div>
                ))}
                {history.length === 0 && <div className="text-center text-xs text-tactical-gray py-4">No common matches found</div>}
            </div>
        </div>
    );
};

// --- MAIN COMPONENT ---

const Faceoff: React.FC<FaceoffProps> = ({ data, onOpenStudio }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [teamAId, setTeamAId] = useState<string>(data[0]?.name || '');
  const [teamBId, setTeamBId] = useState<string>(data[1]?.name || '');
  const [probabilities, setProbabilities] = useState({ probA: 50, probB: 50 });
  const [activeTab, setActiveTab] = useState<'stats' | 'matchup'>('stats');
  const [isSnapshotting, setIsSnapshotting] = useState(false);
  const [snapDone, setSnapDone] = useState(false);

  const teamA = useMemo(() => data.find(t => t.name === teamAId), [data, teamAId]);
  const teamB = useMemo(() => data.find(t => t.name === teamBId), [data, teamBId]);

  const lobbyAvg = useMemo(() => {
      return {
          points: data.reduce((s, t) => s + t.totalPoints, 0) / data.length,
      };
  }, [data]);

  // Derived Matchup Stats
  const comparison = useMemo(() => {
      if (!teamA || !teamB) return null;
      
      // Star Players
      const starA = [...teamA.players].sort((a,b) => b.impactScore - a.impactScore)[0];
      const starB = [...teamB.players].sort((a,b) => b.impactScore - a.impactScore)[0];

      // Style Badges
      let styleBadge = "STANDARD BOUT";
      const totalKills = teamA.totalFinishes + teamB.totalFinishes;
      const totalMatches = teamA.matchesPlayed + teamB.matchesPlayed;
      const kpmCombined = totalMatches > 0 ? totalKills / totalMatches : 0;

      if (kpmCombined > 12) styleBadge = "TOTAL WAR";
      else if (teamA.avgSurvivalTime > 20 && teamB.avgSurvivalTime > 20) styleBadge = "TACTICAL STANDOFF";
      else if (Math.abs(teamA.aggressionIndex - teamB.aggressionIndex) > 40) styleBadge = "STYLE CLASH";
      else if (Math.abs(teamA.totalPoints - teamB.totalPoints) < 10) styleBadge = "GRUDGE MATCH";

      // Calculate Consistency (Coefficient of Variation)
      const getCV = (t: TeamData) => {
          const pts = t.history.map(h => h.points);
          if(!pts.length) return 0;
          const mean = pts.reduce((a,b)=>a+b,0)/pts.length;
          const variance = pts.reduce((a,b)=>a+Math.pow(b-mean,2),0)/pts.length;
          return mean > 0 ? (Math.sqrt(variance)/mean) * 100 : 0;
      };

      return { starA, starB, styleBadge, cvA: getCV(teamA), cvB: getCV(teamB) };
  }, [teamA, teamB]);

  // Run Probability Engine
  useEffect(() => {
      if (teamA && teamB) {
          const result = calculateHeadToHeadProbability(teamA, teamB);
          setProbabilities(result);
      }
  }, [teamA, teamB]);

  const handleDownload = async () => {
      if (!containerRef.current) return;
      setIsSnapshotting(true);
      // Wait for React to apply state update
      await new Promise(r => setTimeout(r, 200));

      try {
          const dataUrl = await toPng(containerRef.current, { backgroundColor: '#0E0E0E', pixelRatio: 2 });
          const gamePrefix = localStorage.getItem('fraglab_game_mode') === 'bgmi' ? 'bgmi' : 'scarfall';
          const link = document.createElement('a');
          link.download = `${gamePrefix}_faceoff_${teamA?.name}_vs_${teamB?.name}_${Date.now()}.png`;
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

  if (!data || data.length < 2 || !teamA || !teamB || !comparison) return null;

  return (
    <div ref={containerRef} className="bg-tactical-black border border-tactical-gray rounded-sm mb-8 relative overflow-hidden flex flex-col">
      {/* Cinematic Background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-gray-900 via-black to-black opacity-80 pointer-events-none"></div>
      
      {/* Header */}
      <div className="relative z-10 border-b border-tactical-gray/30 p-4 flex justify-between items-center bg-black/40">
         <div className="flex items-center gap-2">
            <Swords className="w-5 h-5 text-white" />
            <h3 className="font-serif text-lg font-bold text-white uppercase tracking-wider">Faceoff Console</h3>
         </div>
         <div className="flex gap-2">
             <div className="flex bg-black border border-tactical-gray rounded-sm p-0.5">
                 <button onClick={() => setActiveTab('stats')} className={`px-3 py-1 text-[10px] font-bold uppercase rounded-sm transition-colors ${activeTab === 'stats' ? 'bg-white text-black' : 'text-tactical-light hover:text-white'}`}>Analysis</button>
                 <button onClick={() => setActiveTab('matchup')} className={`px-3 py-1 text-[10px] font-bold uppercase rounded-sm transition-colors ${activeTab === 'matchup' ? 'bg-white text-black' : 'text-tactical-light hover:text-white'}`}>Log</button>
             </div>
             {onOpenStudio && (
                 <button 
                    onClick={onOpenStudio} 
                    className="flex items-center gap-1 px-3 py-1 bg-white/5 border border-white/10 rounded-sm text-[10px] uppercase font-bold text-white hover:bg-white/10 transition-colors"
                 >
                    <MonitorPlay className="w-3 h-3" /> Studio
                 </button>
             )}
             <button 
                onClick={handleDownload}
                disabled={isSnapshotting}
                className="flex items-center gap-1 px-3 py-1 bg-white/5 border border-white/10 rounded-sm text-[10px] uppercase font-bold text-white hover:bg-white/10 transition-colors"
             >
                {isSnapshotting ? <Loader2 className="w-3 h-3 animate-spin"/> : snapDone ? <Check className="w-3 h-3 text-green-500"/> : <Download className="w-3 h-3" />}
             </button>
         </div>
      </div>

      <div className="p-6 relative z-10">
          
          {/* HERO SECTION */}
          <div className="flex justify-between items-end mb-6">
              {/* Team A Hero */}
              <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                      <span className="bg-tactical-red text-white text-[10px] font-bold px-1.5 py-0.5 rounded-sm">#{teamA.rank}</span>
                      <select 
                        value={teamAId}
                        onChange={(e) => setTeamAId(e.target.value)}
                        className="bg-black border border-tactical-gray text-xs text-white font-mono uppercase focus:outline-none cursor-pointer p-1 rounded-sm max-w-[120px]"
                      >
                        {data.map(t => <option key={t.name} value={t.name} className="bg-black text-white">{t.name}</option>)}
                      </select>
                  </div>
                  <h1 className="text-2xl lg:text-3xl font-black text-white uppercase leading-none tracking-tighter truncate">{teamA.name}</h1>
              </div>

              {/* VS BADGE */}
              <div className="px-4 pb-1 flex flex-col items-center">
                  <div className="text-xl font-black italic text-tactical-gray/20">VS</div>
                  <div className="text-[9px] font-bold text-yellow-500 uppercase tracking-widest bg-yellow-500/10 px-2 py-0.5 rounded-sm border border-yellow-500/20 whitespace-nowrap">
                      {comparison.styleBadge}
                  </div>
              </div>

              {/* Team B Hero */}
              <div className="flex-1 text-right flex flex-col items-end">
                  <div className="flex items-center gap-2 mb-1 justify-end">
                      <select 
                        value={teamBId}
                        onChange={(e) => setTeamBId(e.target.value)}
                        className="bg-black border border-tactical-gray text-xs text-white font-mono uppercase focus:outline-none cursor-pointer p-1 rounded-sm max-w-[120px] text-right"
                      >
                        {data.map(t => <option key={t.name} value={t.name} className="bg-black text-white">{t.name}</option>)}
                      </select>
                      <span className="bg-blue-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-sm">#{teamB.rank}</span>
                  </div>
                  <h1 className="text-2xl lg:text-3xl font-black text-white uppercase leading-none tracking-tighter truncate">{teamB.name}</h1>
              </div>
          </div>

          {/* PREDICTION BAR */}
          <div className="mb-6">
              <div className="flex justify-between text-[9px] font-bold uppercase text-tactical-light mb-1">
                  <span>Win Probability</span>
                  <span>Forecast</span>
              </div>
              <div className="h-3 bg-black rounded-sm relative overflow-hidden border border-white/10 flex">
                  {/* Remove transitions during snapshot */}
                  <div className={`h-full bg-tactical-red flex items-center justify-start pl-2 text-[8px] font-bold text-black ${isSnapshotting ? '' : 'transition-all duration-1000'}`} style={{ width: `${probabilities.probA}%` }}>
                      {probabilities.probA > 20 && `${probabilities.probA.toFixed(0)}%`}
                  </div>
                  <div className={`h-full bg-blue-600 flex items-center justify-end pr-2 text-[8px] font-bold text-white ${isSnapshotting ? '' : 'transition-all duration-1000'}`} style={{ width: `${probabilities.probB}%` }}>
                      {probabilities.probB > 20 && `${probabilities.probB.toFixed(0)}%`}
                  </div>
                  <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-black z-10 -translate-x-1/2"></div>
              </div>
          </div>

          {/* CONTENT TABS */}
          {activeTab === 'stats' && (
              <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 ${isSnapshotting ? '' : 'animate-in slide-in-from-right-4'}`}>
                  {/* LEFT: TALE OF THE TAPE */}
                  <div className="bg-black/20 border border-tactical-gray/30 p-3 rounded-sm">
                      <div className="flex items-center gap-2 mb-3 text-[10px] font-bold uppercase text-tactical-light border-b border-tactical-gray/30 pb-2">
                          <BarChart2 className="w-3 h-3" /> Tale of the Tape
                      </div>
                      <StatButterfly label="Avg Pts" valA={teamA.totalPoints / Math.max(1, teamA.matchesPlayed)} valB={teamB.totalPoints / Math.max(1, teamB.matchesPlayed)} isSnapshotting={isSnapshotting} />
                      <StatButterfly label="Avg Kills" valA={teamA.totalFinishes / Math.max(1, teamA.matchesPlayed)} valB={teamB.totalFinishes / Math.max(1, teamB.matchesPlayed)} isSnapshotting={isSnapshotting} />
                      <StatButterfly label="Avg Dmg" valA={teamA.totalDamage / Math.max(1, teamA.matchesPlayed)} valB={teamB.totalDamage / Math.max(1, teamB.matchesPlayed)} isSnapshotting={isSnapshotting} />
                      <StatButterfly label="Survival" valA={teamA.avgSurvivalTime} valB={teamB.avgSurvivalTime} unit="m" isSnapshotting={isSnapshotting} />
                      <StatButterfly label="Win %" valA={(teamA.history.filter(h=>h.rank===1).length / teamA.matchesPlayed)*100} valB={(teamB.history.filter(h=>h.rank===1).length / teamB.matchesPlayed)*100} unit="%" isSnapshotting={isSnapshotting} />
                      <StatButterfly label="Volatility" valA={comparison.cvA} valB={comparison.cvB} unit="%" inverse={true} isSnapshotting={isSnapshotting} />
                  </div>

                  {/* RIGHT: RADAR */}
                  <div className="bg-black/20 border border-tactical-gray/30 p-3 rounded-sm flex flex-col items-center justify-center">
                        <div className="w-full flex items-center gap-2 mb-1 text-[10px] font-bold uppercase text-tactical-light border-b border-tactical-gray/30 pb-2">
                          <Activity className="w-3 h-3" /> Tactical Footprint
                        </div>
                        <ComparativeRadar teamA={teamA} teamB={teamB} lobbyAvg={lobbyAvg} isSnapshotting={isSnapshotting} />
                  </div>
              </div>
          )}

          {activeTab === 'matchup' && (
              <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 ${isSnapshotting ? '' : 'animate-in slide-in-from-right-4 h-[250px]'}`}>
                  {/* LEFT: H2H LOG */}
                  <div className="bg-black/20 border border-tactical-gray/30 p-3 rounded-sm h-full">
                      <div className="flex items-center gap-2 mb-3 text-[10px] font-bold uppercase text-tactical-light border-b border-tactical-gray/30 pb-2">
                          <History className="w-3 h-3" /> Encounter Log
                      </div>
                      <HeadToHeadLog teamA={teamA} teamB={teamB} />
                  </div>

                  {/* RIGHT: KEY MATCHUP */}
                  <div className="bg-black/20 border border-tactical-gray/30 p-3 rounded-sm flex flex-col justify-center h-full">
                      <div className="text-[10px] font-bold uppercase text-tactical-light mb-4 flex items-center gap-2 justify-center">
                          <Zap className="w-3 h-3 text-yellow-500" /> Star Duel
                      </div>
                      <div className="flex justify-between items-center">
                          {/* Player A */}
                          <div className="text-left">
                              <div className="text-xs font-black text-white">{comparison.starA.playerName}</div>
                              <div className="text-[9px] text-tactical-red font-mono">{comparison.starA.impactScore.toFixed(0)} RTG</div>
                          </div>
                          
                          <div className="h-8 w-px bg-white/10 mx-2"></div>

                          {/* Player B */}
                          <div className="text-right">
                              <div className="text-xs font-black text-white">{comparison.starB.playerName}</div>
                              <div className="text-[9px] text-blue-400 font-mono">{comparison.starB.impactScore.toFixed(0)} RTG</div>
                          </div>
                      </div>
                      
                      <div className="mt-4 grid grid-cols-3 gap-2 text-[9px] text-tactical-light text-center uppercase">
                          <div>
                              <div className="text-white font-bold">{comparison.starA.finishes}</div>
                              <div>Kills</div>
                          </div>
                          <div className="flex items-center justify-center font-bold text-tactical-gray">VS</div>
                          <div>
                              <div className="text-white font-bold">{comparison.starB.finishes}</div>
                              <div>Kills</div>
                          </div>
                      </div>
                  </div>
              </div>
          )}

      </div>
    </div>
  );
};

export default Faceoff;
