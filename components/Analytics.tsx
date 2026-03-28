

import React, { useState, useMemo, useRef } from 'react';
import { TeamData, PlayerDerived } from '../types';
import {
  LineChart, Line,
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ScatterChart, Scatter,
  BarChart, Bar,
  XAxis, YAxis, ZAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Legend, Cell, ReferenceArea, Label
} from 'recharts';
import { TrendingUp, Crosshair, Shield, Activity, GitCommit, Camera, Check } from 'lucide-react';
import { toPng } from 'html-to-image';

interface AnalyticsProps {
  data: TeamData[];
  onPlayerClick?: (player: PlayerDerived) => void;
}

// --- Custom Components ---

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    if (payload[0].name === 'Trend Line') return null;

    const isRadar = payload[0].name === 'This Squad' || payload[0].name === 'Lobby Avg';
    
    return (
      <div className="bg-tactical-black/95 p-3 border border-tactical-gray shadow-2xl rounded-sm z-50 backdrop-blur-md min-w-[150px]">
        {label && !isRadar && <p className="font-serif text-xs font-bold text-white mb-2 border-b border-white/10 pb-1">{label}</p>}
        {data.name && <p className="font-serif text-sm font-bold text-white mb-2">{data.name}</p>}
        
        {payload.map((entry: any, index: number) => {
            if (entry.name === 'Trend Line') return null;
            return (
              <div key={index} className="flex justify-between items-center gap-4 text-xs font-mono mb-1">
                <span style={{ color: entry.color }} className="uppercase tracking-wider">{entry.name}:</span>
                <span className="font-bold text-white">
                  {typeof entry.value === 'number' ? entry.value.toFixed(entry.name.includes('Rate') || entry.name.includes('IDX') ? 2 : 0) : entry.value}
                </span>
              </div>
            );
        })}
        
        {data.flags && data.flags.length > 0 && (
           <div className="mt-2 pt-2 border-t border-white/10 flex flex-wrap gap-1">
             {data.flags.map((f: string) => (
               <span key={f} className="text-[9px] bg-white/10 px-1 rounded text-white">{f}</span>
             ))}
           </div>
        )}
      </div>
    );
  }
  return null;
};

const SectionHeader: React.FC<{ icon: React.ReactNode, title: string, subtitle: string, rightContent?: React.ReactNode, onSnapshot?: () => void, isSnapping?: boolean }> = ({ icon, title, subtitle, rightContent, onSnapshot, isSnapping }) => (
  <div className="mb-4 flex items-start justify-between border-b border-white/5 pb-2">
    <div className="flex items-center gap-3">
      <div className="p-1.5 bg-white/5 rounded-sm text-tactical-red">
        {icon}
      </div>
      <div>
        <h3 className="font-serif text-sm font-bold text-white uppercase tracking-wide">{title}</h3>
        <p className="text-[10px] text-tactical-light font-mono">{subtitle}</p>
      </div>
    </div>
    <div className="flex items-center gap-3">
        {rightContent}
        {onSnapshot && (
            <button 
                onClick={onSnapshot} 
                className="p-1.5 text-tactical-light hover:text-white hover:bg-white/10 rounded-sm transition-colors"
                title="Save Chart as Image"
            >
                {isSnapping ? <Check className="w-3 h-3 text-tactical-green" /> : <Camera className="w-3 h-3" />}
            </button>
        )}
    </div>
  </div>
);

const Analytics: React.FC<AnalyticsProps> = ({ data, onPlayerClick }) => {
  const [selectedTeamName, setSelectedTeamName] = useState<string>(data[0]?.name || '');
  
  const velocityRef = useRef<HTMLDivElement>(null);
  const radarRef = useRef<HTMLDivElement>(null);
  const scatterRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);

  const [snapStatus, setSnapStatus] = useState<Record<string, boolean>>({});

  const handleSnapshot = async (ref: React.RefObject<HTMLDivElement>, id: string) => {
      if (!ref.current) return;
      try {
          setSnapStatus(prev => ({ ...prev, [id]: true }));
          const dataUrl = await toPng(ref.current, { backgroundColor: '#0E0E0E', pixelRatio: 2 });
          const link = document.createElement('a');
          link.download = `scarfall_chart_${id}_${Date.now()}.png`;
          link.href = dataUrl;
          link.click();
      } catch(e) { console.error(e); } 
      finally { setTimeout(() => setSnapStatus(prev => ({ ...prev, [id]: false })), 2000); }
  };

  const hasHistory = data.some(t => t.history && t.history.length > 1);

  const momentumData = useMemo(() => {
    if (!data.length || !hasHistory) return [];
    
    const allHistory = data.flatMap(t => t.history);
    const uniqueMatchIds = Array.from(new Set(allHistory.map(h => h.matchId)));

    interface SortedMatch { id: string; day: number; match: number; }

    const sortedMatches: SortedMatch[] = uniqueMatchIds.map((id: string) => {
        const parts = id.match(/d(\d+)-m(\d+)/);
        if (parts) return { id, day: parseInt(parts[1]), match: parseInt(parts[2]) };
        return { id, day: 0, match: 0 }; 
    }).sort((a, b) => {
        if (a.day !== b.day) return a.day - b.day;
        return a.match - b.match;
    });

    const topTeams = data.slice(0, 5); 
    const chartData: any[] = [];
    const teamRunningTotals: Record<string, number> = {};
    topTeams.forEach(t => teamRunningTotals[t.name] = 0);

    sortedMatches.forEach(m => {
        const point: any = { match: `D${m.day}-M${m.match}` };
        topTeams.forEach(team => {
            const entry = team.history.find(h => h.matchId === m.id);
            if (entry) teamRunningTotals[team.name] += entry.points;
            point[team.name] = teamRunningTotals[team.name];
        });
        chartData.push(point);
    });
    return chartData;
  }, [data, hasHistory]);

  const radarData = useMemo(() => {
    const selectedTeam = data.find(t => t.name === selectedTeamName);
    if (!selectedTeam) return [];
    
    const maxDmg = Math.max(...data.map(t => t.totalDamage)) || 1;
    const maxKills = Math.max(...data.map(t => t.totalFinishes)) || 1;
    const maxSurvival = Math.max(...data.map(t => t.avgSurvivalTime)) || 1;
    const maxPlacement = Math.max(...data.map(t => t.placementPoints)) || 1;
    
    const normalize = (val: number, max: number) => (max > 0 ? (val / max) * 100 : 0);
    const lobbyAvg = {
      damage: data.reduce((s, t) => s + t.totalDamage, 0) / data.length,
      kills: data.reduce((s, t) => s + t.totalFinishes, 0) / data.length,
      survival: data.reduce((s, t) => s + t.avgSurvivalTime, 0) / data.length,
      placement: data.reduce((s, t) => s + t.placementPoints, 0) / data.length,
    };

    return [
      { subject: 'Damage', A: normalize(selectedTeam.totalDamage, maxDmg), B: normalize(lobbyAvg.damage, maxDmg), fullMark: 100 },
      { subject: 'Lethality', A: normalize(selectedTeam.totalFinishes, maxKills), B: normalize(lobbyAvg.kills, maxKills), fullMark: 100 },
      { subject: 'Survival', A: normalize(selectedTeam.avgSurvivalTime, maxSurvival), B: normalize(lobbyAvg.survival, maxSurvival), fullMark: 100 },
      { subject: 'Placement', A: normalize(selectedTeam.placementPoints, maxPlacement), B: normalize(lobbyAvg.placement, maxPlacement), fullMark: 100 },
      { subject: 'Aggression', A: Math.min(100, selectedTeam.aggressionIndex), B: Math.min(100, data.reduce((s,t) => s + t.aggressionIndex, 0) / data.length), fullMark: 100 },
    ];
  }, [data, selectedTeamName]);

  const { scatterData, regressionLine, rSquared } = useMemo(() => {
     const points = data.map(team => ({
        name: team.name,
        x: team.totalDamage,
        y: team.totalFinishes,
        z: team.totalPoints, 
        idx: team.aggressionIndex,
        flags: team.flags
      }));

      const n = points.length;
      let linePoints = [];
      let r2 = 0;

      if (n > 1) {
          let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
          points.forEach(p => {
              sumX += p.x;
              sumY += p.y;
              sumXY += p.x * p.y;
              sumXX += p.x * p.x;
          });
          
          const denominator = (n * sumXX - sumX * sumX);
          if (denominator !== 0) {
              const slope = (n * sumXY - sumX * sumY) / denominator;
              const intercept = (sumY - slope * sumX) / n;
              
              const maxX = Math.max(...points.map(p => p.x));
              linePoints = [{ x: 0, y: intercept }, { x: maxX, y: slope * maxX + intercept }];

              const yMean = sumY / n;
              const ssRes = points.reduce((acc, p) => acc + Math.pow(p.y - (slope * p.x + intercept), 2), 0);
              const ssTot = points.reduce((acc, p) => acc + Math.pow(p.y - yMean, 2), 0);
              r2 = ssTot !== 0 ? 1 - (ssRes / ssTot) : 0;
          }
      }
      return { scatterData: points, regressionLine: linePoints, rSquared: r2 };
  }, [data]);

  const avgDmg = data.reduce((s, t) => s + t.totalDamage, 0) / data.length || 0;
  const avgKills = data.reduce((s, t) => s + t.totalFinishes, 0) / data.length || 0;

  const topOperators = useMemo(() => {
    const allPlayers = data.flatMap(t => t.players.map(p => ({ ...p, team: t.name })));
    return allPlayers.sort((a, b) => b.impactScore - a.impactScore).slice(0, 10);
  }, [data]);

  if (!data || data.length === 0) return null;

  const LINE_COLORS = ['#ef4444', '#FFFFFF', '#10b981', '#3b82f6', '#f59e0b'];

  return (
    <div id="analytics-dashboard" className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-12 animate-in fade-in slide-in-from-bottom-8 duration-700 bg-tactical-black p-4 sm:p-6 rounded-lg">
      
      {hasHistory ? (
        <div ref={velocityRef} className="bg-tactical-dark p-5 rounded-sm border border-tactical-gray flex flex-col h-[350px]">
          <SectionHeader 
            icon={<TrendingUp className="w-4 h-4" />} 
            title="Squad Velocity" 
            subtitle="Cumulative Points Trajectory (Top 5)" 
            onSnapshot={() => handleSnapshot(velocityRef, 'velocity')}
            isSnapping={snapStatus['velocity']}
          />
          <div className="flex-1 w-full text-xs font-mono">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={momentumData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2A2A2A" vertical={false} />
                <XAxis dataKey="match" stroke="#7A7A7A" tick={{fill: '#7A7A7A', fontSize: 10}} tickLine={false} axisLine={{stroke: '#2A2A2A'}} />
                <YAxis stroke="#7A7A7A" tick={{fill: '#7A7A7A', fontSize: 10}} tickLine={false} axisLine={{stroke: '#2A2A2A'}} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} iconType="rect" />
                {data.slice(0, 5).map((team, idx) => (
                  <Line 
                    key={team.name}
                    type="monotone" 
                    dataKey={team.name} 
                    stroke={LINE_COLORS[idx % LINE_COLORS.length]} 
                    strokeWidth={2}
                    dot={{ r: 3, fill: '#0E0E0E', strokeWidth: 1 }}
                    activeDot={{ r: 5, fill: '#FFFFFF' }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : (
           <div className="bg-tactical-dark p-5 rounded-sm border border-tactical-gray flex flex-col h-[350px] items-center justify-center opacity-50">
             <TrendingUp className="w-8 h-8 text-tactical-light mb-2" />
             <p className="text-xs font-mono text-tactical-light uppercase">Velocity Data Unavailable (Single Match)</p>
           </div>
      )}

      <div ref={radarRef} className="bg-tactical-dark p-5 rounded-sm border border-tactical-gray flex flex-col h-[350px]">
        <div className="flex justify-between items-start">
             <SectionHeader 
                icon={<Activity className="w-4 h-4" />} 
                title="Tactical Profile" 
                subtitle="Normalized Performance Metrics" 
                onSnapshot={() => handleSnapshot(radarRef, 'radar')}
                isSnapping={snapStatus['radar']}
              />
              <select 
                className="bg-black border border-tactical-gray text-[10px] text-white px-2 py-1 rounded-sm focus:outline-none focus:border-tactical-red uppercase font-mono"
                value={selectedTeamName}
                onChange={(e) => setSelectedTeamName(e.target.value)}
              >
                {data.map(t => <option key={t.name} value={t.name}>{t.name}</option>)}
              </select>
        </div>
        <div className="flex-1 w-full relative">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
              <PolarGrid stroke="#2A2A2A" />
              <PolarAngleAxis dataKey="subject" tick={{ fill: '#7A7A7A', fontSize: 10, fontFamily: 'monospace' }} />
              <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
              <Radar name="This Squad" dataKey="A" stroke="#ef4444" strokeWidth={2} fill="#ef4444" fillOpacity={0.3} />
              <Radar name="Lobby Avg" dataKey="B" stroke="#7A7A7A" strokeWidth={1} strokeDasharray="4 4" fill="#7A7A7A" fillOpacity={0.1} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: '10px', marginTop: '-10px' }} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div ref={scatterRef} className="bg-tactical-dark p-5 rounded-sm border border-tactical-gray flex flex-col h-[350px] relative">
         <SectionHeader 
            icon={<Crosshair className="w-4 h-4" />} 
            title="Conversion Efficiency" 
            subtitle="Damage vs. Kills (Bubble Size = Total Points)" 
            onSnapshot={() => handleSnapshot(scatterRef, 'scatter')}
            isSnapping={snapStatus['scatter']}
            rightContent={
                <div className="flex items-center gap-1.5 px-2 py-1 bg-black/40 rounded border border-white/5 mr-2">
                    <GitCommit className="w-3 h-3 text-tactical-light" />
                    <span className="text-[10px] font-mono text-tactical-light">
                        R²: <span className={rSquared > 0.7 ? "text-tactical-green" : "text-white"}>{rSquared.toFixed(2)}</span>
                    </span>
                </div>
            }
         />
         <div className="flex-1 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2A2A2A" opacity={0.5} />
              <XAxis type="number" dataKey="x" name="Damage" tick={{ fontSize: 10, fill: '#7A7A7A', fontFamily: 'monospace' }} tickLine={false} axisLine={{ stroke: '#2A2A2A' }} label={{ value: 'TOTAL DAMAGE', position: 'insideBottom', offset: -10, fill: '#444', fontSize: 10 }} domain={[0, 'auto']} />
              <YAxis type="number" dataKey="y" name="Kills" tick={{ fontSize: 10, fill: '#7A7A7A', fontFamily: 'monospace' }} tickLine={false} axisLine={{ stroke: '#2A2A2A' }} label={{ value: 'TOTAL KILLS', angle: -90, position: 'insideLeft', offset: 10, fill: '#444', fontSize: 10 }} domain={[0, 'auto']} />
              <ZAxis type="number" dataKey="z" range={[50, 400]} name="Points" />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} content={<CustomTooltip />} />
              <ReferenceArea x1={avgDmg} y1={avgKills} fill="rgba(16, 185, 129, 0.05)" strokeOpacity={0}><Label value="DOMINANT" position="insideTopRight" offset={10} fill="rgba(16, 185, 129, 0.5)" fontSize={10} fontWeight="900" style={{fontFamily: 'monospace'}} /></ReferenceArea>
              <ReferenceArea x1={avgDmg} y1={0} y2={avgKills} fill="rgba(245, 158, 11, 0.05)" strokeOpacity={0}><Label value="FARMERS" position="insideBottomRight" offset={10} fill="rgba(245, 158, 11, 0.5)" fontSize={10} fontWeight="900" style={{fontFamily: 'monospace'}} /></ReferenceArea>
              <ReferenceArea x1={0} x2={avgDmg} y1={avgKills} fill="rgba(59, 130, 246, 0.05)" strokeOpacity={0}><Label value="OPPORTUNISTS" position="insideTopLeft" offset={10} fill="rgba(59, 130, 246, 0.5)" fontSize={10} fontWeight="900" style={{fontFamily: 'monospace'}} /></ReferenceArea>
              <ReferenceArea x1={0} x2={avgDmg} y1={0} y2={avgKills} fill="rgba(239, 68, 68, 0.05)" strokeOpacity={0}><Label value="PASSIVE" position="insideBottomLeft" offset={10} fill="rgba(239, 68, 68, 0.5)" fontSize={10} fontWeight="900" style={{fontFamily: 'monospace'}} /></ReferenceArea>
              <ReferenceLine x={avgDmg} stroke="#3f3f46" strokeDasharray="3 3" />
              <ReferenceLine y={avgKills} stroke="#3f3f46" strokeDasharray="3 3" />
              {regressionLine && regressionLine.length > 0 && <Scatter name="Trend Line" data={regressionLine} line={{ stroke: '#555', strokeWidth: 1, strokeDasharray: '4 4' }} shape={() => null} legendType="none" />}
              <Scatter name="Teams" data={scatterData}>
                 {scatterData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.y > avgKills && entry.x > avgDmg ? '#10b981' : entry.x > avgDmg ? '#f59e0b' : entry.y > avgKills ? '#3b82f6' : '#ef4444'} stroke="rgba(0,0,0,0.5)" strokeWidth={1} className="transition-all duration-300 hover:opacity-80" />)}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
         </div>
      </div>

      <div ref={barRef} className="bg-tactical-dark p-5 rounded-sm border border-tactical-gray flex flex-col h-[350px]">
        <SectionHeader 
          icon={<Shield className="w-4 h-4" />} 
          title="Fragger Leaderboard" 
          subtitle="Top 10 by Impact Score" 
          onSnapshot={() => handleSnapshot(barRef, 'operators')}
          isSnapping={snapStatus['operators']}
        />
        <div className="flex-1 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={topOperators} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#2A2A2A" />
              <XAxis type="number" hide />
              <YAxis dataKey="playerName" type="category" width={80} tick={{ fontSize: 10, fill: '#FFFFFF', fontWeight: 500 }} tickLine={false} axisLine={false} />
              <Tooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                        const p = payload[0].payload;
                        return (
                            <div className="bg-tactical-black p-2 border border-tactical-gray text-xs font-mono">
                                <div className="text-white font-bold">{p.playerName}</div>
                                <div className="text-tactical-light">{p.team}</div>
                                <div className="mt-1 pt-1 border-t border-white/10 flex gap-2"><span>DMG: {p.damage}</span><span>K: {p.finishes}</span></div>
                            </div>
                        )
                    }
                    return null;
                }}
              />
              <Bar 
                dataKey="impactScore" 
                barSize={12} 
                radius={[0, 4, 4, 0]} 
                onClick={(data) => onPlayerClick?.(data)}
                style={{ cursor: onPlayerClick ? 'pointer' : 'default' }}
              >
                {topOperators.map((entry, index) => <Cell key={`cell-${index}`} fill={index < 3 ? '#ef4444' : '#3f3f46'} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
};

export default Analytics;
