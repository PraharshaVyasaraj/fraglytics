import React, { useState, useMemo } from 'react';
import { TeamData, PlayerDerived } from '../types';
import { getGlobalPlayerRegistry } from '../services/analyticsEngine';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip, Legend, LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts';
import { ChevronRight, Activity, Shield, Users, Crosshair, Zap, BrainCircuit, MonitorPlay, GitCompare, Sliders, X, TrendingUp, Hexagon } from 'lucide-react';

interface StatisticsModeProps {
  data: TeamData[];
  onOpenStudio?: (mode: string, focusId?: string) => void;
}

type EntityType = 'players' | 'teams';
type CategoryType = 'combat' | 'survival' | 'team_dynamics' | 'custom';

const PLAYER_METRICS = {
  'RAW COMBAT': [
    { key: 'kills', label: 'Kills' },
    { key: 'damage', label: 'Damage' },
    { key: 'assists', label: 'Assists' },
    { key: 'dpk', label: 'Dmg/Kill' },
    { key: 'kpm', label: 'KPM' },
    { key: 'killEfficiencyRating', label: 'Kill Eff' },
    { key: 'assistsPerMinute', label: 'Ast/Min' },
    { key: 'damagePerKill', label: 'Dmg/Kill (True)' },
    { key: 'killAssistCombined', label: 'K+A' },
    { key: 'avgKillsPerMatch', label: 'Avg Kills' },
    { key: 'avgDamagePerMatch', label: 'Avg Dmg' },
    { key: 'avgAssistsPerMatch', label: 'Avg Ast' },
    { key: 'killToAssistRatio', label: 'K/A Ratio' },
    { key: 'aggressionIndex', label: 'Aggression' },
  ],
  'SURVIVAL': [
    { key: 'playTimeMinutes', label: 'Time (m)' },
    { key: 'survivalPercentile', label: 'Surv %' },
    { key: 'survivedToEndFlag', label: 'Wins' },
    { key: 'earlyEliminationFlag', label: 'Early Exits' },
    { key: 'survivalLead', label: 'Surv Lead' },
  ],
  'CARRY METRICS': [
    { key: 'killShare', label: 'Kill Share' },
    { key: 'damageShare', label: 'Dmg Share' },
    { key: 'soloCarryProxy', label: 'Solo Carry' },
    { key: 'deadWeightFlag', label: 'Dead Weight' },
    { key: 'killAboveTeamAvg', label: 'Kills > Avg' },
    { key: 'damageAboveTeamAvg', label: 'Dmg > Avg' },
  ],
  'MACRO / META': [
    { key: 'impactScore', label: 'Impact' },
    { key: 'combatScore', label: 'Combat Score' },
    { key: 'efficiencyScore', label: 'Efficiency' },
    { key: 'contributionRate', label: 'Contrib Rate' },
    { key: 'impactPerMinute', label: 'Impact/Min' },
  ]
};

const TEAM_METRICS = {
  'RAW COMBAT': [
    { key: 'totalFinishes', label: 'Kills' },
    { key: 'totalDamage', label: 'Damage' },
    { key: 'teamKillsPerMinute', label: 'KPM' },
    { key: 'conversionRate', label: 'Dmg/Kill' },
    { key: 'efficiencyRating', label: 'Efficiency' },
  ],
  'SURVIVAL': [
    { key: 'avgSurvivalTime', label: 'Avg Time (m)' },
    { key: 'avgPlacement', label: 'Avg Rank' },
    { key: 'placementConsistency', label: 'Rank StdDev' },
    { key: 'pointsConsistency', label: 'Pts StdDev' },
    { key: 'boomOrBustIndex', label: 'Boom/Bust' },
  ],
  'TEAM DYNAMICS': [
    { key: 'teamKillDistribution', label: 'Kill StdDev' },
    { key: 'teamDamageDistribution', label: 'Dmg StdDev' },
    { key: 'teamActivePlayerCount', label: 'Active Players' },
    { key: 'teamDeadWeightCount', label: 'Dead Weights' },
  ],
  'MACRO / META': [
    { key: 'totalPoints', label: 'Points' },
    { key: 'winRate', label: 'Win Rate' },
    { key: 'top3Rate', label: 'Top 3 Rate' },
    { key: 'top5Rate', label: 'Top 5 Rate' },
    { key: 'avgKillPointsPerMatch', label: 'Avg KP' },
    { key: 'avgPlacementPointsPerMatch', label: 'Avg PP' },
    { key: 'winProbability', label: 'Win Prob' },
  ]
};

export const StatisticsMode: React.FC<StatisticsModeProps> = ({ data, onOpenStudio }) => {
  const [entityType, setEntityType] = useState<EntityType>('players');
  const [category, setCategory] = useState<CategoryType>('combat');
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>(null);
  const [selectedEntity, setSelectedEntity] = useState<any>(null);
  const [compareEntity, setCompareEntity] = useState<any>(null);
  const [showTrendline, setShowTrendline] = useState(false);
  
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);
  const [customPlayerCols, setCustomPlayerCols] = useState<string[]>(['kills', 'damage', 'impactScore', 'soloCarryProxy']);
  const [customTeamCols, setCustomTeamCols] = useState<string[]>(['totalPoints', 'totalFinishes', 'totalDamage', 'boomOrBustIndex']);

  const globalPlayers = useMemo(() => getGlobalPlayerRegistry(data), [data]);

  const currentData = useMemo(() => {
    let baseData: any[] = entityType === 'players' ? globalPlayers : data;
    
    if (sortConfig) {
      baseData = [...baseData].sort((a: any, b: any) => {
        const aVal = a[sortConfig.key] || 0;
        const bVal = b[sortConfig.key] || 0;
        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    } else {
      // Default sort
      baseData = [...baseData].sort((a: any, b: any) => (b.totalPoints || b.impactScore || 0) - (a.totalPoints || a.impactScore || 0));
    }
    
    return baseData;
  }, [entityType, globalPlayers, data, sortConfig]);

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'desc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'desc') {
      direction = 'asc';
    }
    setSortConfig({ key, direction });
  };

  const handleRowClick = (e: React.MouseEvent, row: any) => {
    if (e.shiftKey) {
      if (selectedEntity && selectedEntity !== row) {
        setCompareEntity(row);
      }
    } else {
      setSelectedEntity(row);
      setCompareEntity(null);
    }
  };

  const getColumns = () => {
    if (entityType === 'players') {
      switch (category) {
        case 'combat':
          return [
            { key: 'playerName', label: 'Player' },
            { key: 'teamName', label: 'Team' },
            { key: 'kills', label: 'Kills' },
            { key: 'damage', label: 'Damage' },
            { key: 'dpk', label: 'Dmg/Kill' },
            { key: 'impactScore', label: 'Impact' },
            { key: 'kpm', label: 'KPM' },
            { key: 'killEfficiencyRating', label: 'Kill Eff' },
          ];
        case 'survival':
          return [
            { key: 'playerName', label: 'Player' },
            { key: 'teamName', label: 'Team' },
            { key: 'playTimeMinutes', label: 'Time (m)' },
            { key: 'survivalPercentile', label: 'Surv %' },
            { key: 'survivedToEndFlag', label: 'Wins' },
            { key: 'earlyEliminationFlag', label: 'Early Exits' },
            { key: 'survivalLead', label: 'Surv Lead' },
          ];
        case 'team_dynamics':
          return [
            { key: 'playerName', label: 'Player' },
            { key: 'teamName', label: 'Team' },
            { key: 'killShare', label: 'Kill Share' },
            { key: 'damageShare', label: 'Dmg Share' },
            { key: 'soloCarryProxy', label: 'Solo Carry' },
            { key: 'deadWeightFlag', label: 'Dead Weight' },
            { key: 'killAboveTeamAvg', label: 'Kills > Avg' },
          ];
        case 'custom':
          const activePlayerCols = customPlayerCols;
          const allPlayerMetrics = Object.values(PLAYER_METRICS).flat();
          return [
            { key: 'playerName', label: 'Player' },
            { key: 'teamName', label: 'Team' },
            ...activePlayerCols.map(key => allPlayerMetrics.find(m => m.key === key) || { key, label: key })
          ];
        default:
          return [
            { key: 'playerName', label: 'Player' },
            { key: 'teamName', label: 'Team' },
            { key: 'impactScore', label: 'Impact' },
            { key: 'soloCarryProxy', label: 'Solo Carry' },
            { key: 'survivalLead', label: 'Surv Lead' },
          ];
      }
    } else {
      switch (category) {
        case 'combat':
          return [
            { key: 'name', label: 'Team' },
            { key: 'totalFinishes', label: 'Kills' },
            { key: 'totalDamage', label: 'Damage' },
            { key: 'teamKillsPerMinute', label: 'KPM' },
            { key: 'conversionRate', label: 'Dmg/Kill' },
            { key: 'efficiencyRating', label: 'Efficiency' },
          ];
        case 'survival':
          return [
            { key: 'name', label: 'Team' },
            { key: 'avgSurvivalTime', label: 'Avg Time (m)' },
            { key: 'avgPlacement', label: 'Avg Rank' },
            { key: 'placementConsistency', label: 'Rank StdDev' },
            { key: 'pointsConsistency', label: 'Pts StdDev' },
            { key: 'boomOrBustIndex', label: 'Boom/Bust' },
          ];
        case 'team_dynamics':
          return [
            { key: 'name', label: 'Team' },
            { key: 'teamKillDistribution', label: 'Kill StdDev' },
            { key: 'teamDamageDistribution', label: 'Dmg StdDev' },
            { key: 'teamActivePlayerCount', label: 'Active Players' },
            { key: 'teamDeadWeightCount', label: 'Dead Weights' },
          ];
        case 'custom':
          const activeTeamCols = customTeamCols;
          const allTeamMetrics = Object.values(TEAM_METRICS).flat();
          return [
            { key: 'name', label: 'Team' },
            ...activeTeamCols.map(key => allTeamMetrics.find(m => m.key === key) || { key, label: key })
          ];
        default:
          return [
            { key: 'name', label: 'Team' },
            { key: 'totalPoints', label: 'Points' },
            { key: 'boomOrBustIndex', label: 'Boom/Bust' },
            { key: 'teamKillDistribution', label: 'Kill StdDev' },
          ];
      }
    }
  };

  const columns = getColumns();
  const globalAverages = useMemo(() => {
    const players = getGlobalPlayerRegistry(data);
    return {
      impact: players.reduce((s, p) => s + (p.impactScore || 0), 0) / Math.max(1, players.length),
      damage: players.reduce((s, p) => s + (p.damage || 0), 0) / Math.max(1, players.length),
      kills: players.reduce((s, p) => s + (p.finishes || 0), 0) / Math.max(1, players.length),
    };
  }, [data]);

  // Heatmap logic
  const getHeatmapColor = (key: string, value: number, dataArray: any[]) => {
    if (typeof value !== 'number' || isNaN(value)) return '';
    const values = dataArray.map(d => d[key]).filter(v => typeof v === 'number' && !isNaN(v));
    if (values.length === 0) return '';
    
    const max = Math.max(...values);
    const min = Math.min(...values);
    
    if (max === min) return '';
    
    const percentile = (value - min) / (max - min);
    
    // Invert for metrics where lower is better
    const lowerIsBetter = ['dpk', 'conversionRate', 'deadWeightFlag', 'earlyEliminationFlag', 'placementConsistency', 'pointsConsistency'].includes(key);
    const adjustedPercentile = lowerIsBetter ? 1 - percentile : percentile;

    if (adjustedPercentile > 0.9) return 'text-tactical-green glow-text-green font-bold';
    if (adjustedPercentile < 0.1) return 'text-tactical-red opacity-60';
    return 'text-tactical-light';
  };

  const getStatusBadge = (row: any) => {
    if (entityType !== 'players') return null;
    
    if (row.impactScore > globalAverages.impact * 2.2) return <span className="px-1.5 py-0.5 bg-tactical-green/20 text-tactical-green border border-tactical-green/40 rounded-[2px] text-[8px] font-bold uppercase tracking-tighter">Elite</span>;
    if (row.soloCarryProxy > 1.8) return <span className="px-1.5 py-0.5 bg-yellow-500/20 text-yellow-400 border border-yellow-500/40 rounded-[2px] text-[8px] font-bold uppercase tracking-tighter">Carry</span>;
    if (row.isOutlier) return <span className="px-1.5 py-0.5 bg-tactical-red/20 text-tactical-red border border-tactical-red/40 rounded-[2px] text-[8px] font-bold uppercase tracking-tighter">Outlier</span>;
    return null;
  };

  const renderRadarChart = () => {
    if (!selectedEntity) return null;

    let radarData = [];
    if (entityType === 'players') {
      radarData = [
        { subject: 'Lethality', A: selectedEntity.killEfficiencyRating || 0, B: compareEntity?.killEfficiencyRating || 0, fullMark: 1000 },
        { subject: 'Survival', A: (selectedEntity.survivalPercentile || 0) * 100, B: (compareEntity?.survivalPercentile || 0) * 100, fullMark: 100 },
        { subject: 'Carry', A: (selectedEntity.killShare || 0) * 100, B: (compareEntity?.killShare || 0) * 100, fullMark: 100 },
        { subject: 'Aggression', A: selectedEntity.aggressionIndex || 0, B: compareEntity?.aggressionIndex || 0, fullMark: 100 },
        { subject: 'Support', A: selectedEntity.supportRating || 0, B: compareEntity?.supportRating || 0, fullMark: 100 },
      ];
    } else {
      radarData = [
        { subject: 'Lethality', A: selectedEntity.teamKillsPerMinute || 0, B: compareEntity?.teamKillsPerMinute || 0, fullMark: 5 },
        { subject: 'Consistency', A: 100 - (selectedEntity.placementConsistency || 0) * 5, B: 100 - (compareEntity?.placementConsistency || 0) * 5, fullMark: 100 },
        { subject: 'Cohesion', A: 100 - (selectedEntity.teamKillDistribution || 0) * 10, B: 100 - (compareEntity?.teamKillDistribution || 0) * 10, fullMark: 100 },
        { subject: 'Aggression', A: selectedEntity.aggressionIndex || 0, B: compareEntity?.aggressionIndex || 0, fullMark: 100 },
        { subject: 'Efficiency', A: selectedEntity.efficiencyRating || 0, B: compareEntity?.efficiencyRating || 0, fullMark: 100 },
      ];
    }

    return (
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="65%" data={radarData}>
            <PolarGrid stroke="#333" />
            <PolarAngleAxis dataKey="subject" tick={{ fill: '#888', fontSize: 10 }} />
            <Radar name={selectedEntity.playerName || selectedEntity.name} dataKey="A" stroke="#00ff00" fill="#00ff00" fillOpacity={0.3} />
            {compareEntity && (
              <Radar name={compareEntity.playerName || compareEntity.name} dataKey="B" stroke="#ff3333" fill="#ff3333" fillOpacity={0.3} />
            )}
            <Tooltip contentStyle={{ backgroundColor: '#111', border: '1px solid #333' }} />
            {compareEntity && <Legend wrapperStyle={{ fontSize: '10px' }} />}
          </RadarChart>
        </ResponsiveContainer>
      </div>
    );
  };

  const renderTrendlineChart = () => {
    if (!selectedEntity || !selectedEntity.history) return null;

    let chartData: any[] = [];

    if (entityType === 'players') {
      const allMatches = new Set<string>();
      selectedEntity.history.forEach((h: any) => allMatches.add(h.matchId));
      if (compareEntity?.history) {
        compareEntity.history.forEach((h: any) => allMatches.add(h.matchId));
      }

      chartData = Array.from(allMatches).map((matchId, idx) => {
        const aHist = selectedEntity.history.find((h: any) => h.matchId === matchId);
        const bHist = compareEntity?.history?.find((h: any) => h.matchId === matchId);
        return {
          name: `M${idx + 1}`,
          [selectedEntity.playerName]: aHist ? aHist.impact : null,
          ...(compareEntity ? { [compareEntity.playerName]: bHist ? bHist.impact : null } : {})
        };
      });
    } else {
      const allMatches = new Set<string>();
      selectedEntity.history.forEach((h: any) => allMatches.add(h.matchId));
      if (compareEntity?.history) {
        compareEntity.history.forEach((h: any) => allMatches.add(h.matchId));
      }

      chartData = Array.from(allMatches).map((matchId, idx) => {
        const aHist = selectedEntity.history.find((h: any) => h.matchId === matchId);
        const bHist = compareEntity?.history?.find((h: any) => h.matchId === matchId);
        return {
          name: `M${idx + 1}`,
          [selectedEntity.name]: aHist ? aHist.points : null,
          ...(compareEntity ? { [compareEntity.name]: bHist ? bHist.points : null } : {})
        };
      });
    }

    return (
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
            <XAxis dataKey="name" stroke="#888" fontSize={10} />
            <YAxis stroke="#888" fontSize={10} />
            <Tooltip contentStyle={{ backgroundColor: '#111', border: '1px solid #333' }} />
            <Legend wrapperStyle={{ fontSize: '10px' }} />
            <Line type="monotone" dataKey={entityType === 'players' ? selectedEntity.playerName : selectedEntity.name} stroke="#00ff00" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
            {compareEntity && (
              <Line type="monotone" dataKey={entityType === 'players' ? compareEntity.playerName : compareEntity.name} stroke="#ff3333" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  };

  const renderSynergyMatrix = () => {
    if (entityType !== 'teams' || !selectedEntity) return null;
    
    const players = selectedEntity.players || [];
    const sortedPlayers = [...players].sort((a, b) => b.impactScore - a.impactScore);

    return (
      <div className="mt-8 border-t border-white/5 pt-6">
        <div className="flex items-center gap-3 text-purple-400 mb-4">
          <Users className="w-4 h-4" />
          <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Squad Synergy Matrix</span>
        </div>
        <div className="grid grid-cols-1 gap-3">
          {sortedPlayers.map(p => {
             let role = "Flex";
             let roleColor = "text-tactical-light";
             let roleBg = "bg-white/5";
             let roleBorder = "border-white/10";

             if (p.deadWeightFlag > 0) { 
               role = "Liability"; 
               roleColor = "text-tactical-red"; 
               roleBg = "bg-tactical-red/5";
               roleBorder = "border-tactical-red/20";
             }
             else if (p.soloCarryProxy > 1.5) { 
               role = "Backpack"; 
               roleColor = "text-yellow-500"; 
               roleBg = "bg-yellow-500/5";
               roleBorder = "border-yellow-500/20";
             }
             else if (p.survivalLead > 3) { 
               role = "Anchor"; 
               roleColor = "text-blue-400"; 
               roleBg = "bg-blue-500/5";
               roleBorder = "border-blue-500/20";
             }
             else if (p.killShare > 0.3) { 
               role = "Spearhead"; 
               roleColor = "text-tactical-green"; 
               roleBg = "bg-tactical-green/5";
               roleBorder = "border-tactical-green/20";
             }

             return (
               <div key={p.playerName} className={`${roleBg} ${roleBorder} border p-3 rounded-sm flex items-center justify-between group hover:border-white/30 transition-colors`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-1 h-8 ${roleColor.replace('text-', 'bg-')} opacity-50`}></div>
                    <div>
                      <div className="text-white text-xs font-bold font-mono">{p.playerName}</div>
                      <div className={`text-[9px] font-mono uppercase font-bold ${roleColor}`}>{role}</div>
                    </div>
                  </div>
                  <div className="text-right flex gap-4">
                     <div className="flex flex-col">
                       <span className="text-[8px] text-tactical-gray uppercase font-bold">K-Share</span>
                       <span className="text-xs text-white font-mono">{(p.killShare * 100).toFixed(0)}%</span>
                     </div>
                     <div className="flex flex-col">
                       <span className="text-[8px] text-tactical-gray uppercase font-bold">Impact</span>
                       <span className="text-xs text-tactical-green font-mono">{p.impactScore.toFixed(1)}</span>
                     </div>
                  </div>
               </div>
             );
          })}
        </div>
      </div>
    );
  };

  const renderStoryteller = () => {
    if (compareEntity) {
      // Head-to-Head Storyteller
      const nameA = selectedEntity.playerName || selectedEntity.name;
      const nameB = compareEntity.playerName || compareEntity.name;
      const aWinsLethality = (selectedEntity.killEfficiencyRating || selectedEntity.teamKillsPerMinute) > (compareEntity.killEfficiencyRating || compareEntity.teamKillsPerMinute);
      const aWinsSurvival = (selectedEntity.survivalPercentile || selectedEntity.placementConsistency) > (compareEntity.survivalPercentile || compareEntity.placementConsistency);

      return (
        <div className="text-[11px] text-tactical-light font-mono space-y-4 bg-black/40 p-5 border border-white/5 rounded-sm leading-relaxed relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-tactical-green/20 to-transparent"></div>
          <p className="flex items-center gap-2">
            <span className="text-tactical-green font-bold px-1.5 py-0.5 bg-tactical-green/10 rounded-sm">{nameA}</span> 
            <span className="text-tactical-gray italic">vs</span> 
            <span className="text-tactical-red font-bold px-1.5 py-0.5 bg-tactical-red/10 rounded-sm">{nameB}</span>
          </p>
          <div className="space-y-3">
            <p className="flex gap-2">
              <span className="text-tactical-green">»</span>
              <span>{aWinsLethality ? `${nameA} is significantly more lethal and efficient in combat.` : `${nameB} dominates in raw combat efficiency and lethality.`}</span>
            </p>
            <p className="flex gap-2">
              <span className="text-tactical-green">»</span>
              <span>{aWinsSurvival ? `${nameA} provides better survival stability.` : `${nameB} is the more consistent survivor.`}</span>
            </p>
          </div>
        </div>
      );
    }

    // Single Entity Storyteller
    return (
      <div className="text-[11px] text-tactical-light font-mono space-y-4 bg-black/40 p-5 border border-white/5 rounded-sm leading-relaxed relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-tactical-green/20 to-transparent"></div>
        {entityType === 'players' ? (
          <div className="space-y-3">
            {selectedEntity.soloCarryProxy > 1 && <p className="flex gap-2"><span className="text-yellow-500">●</span> <span><span className="text-yellow-500 font-bold uppercase text-[9px]">1v9 Warning:</span> Massive solo carry proxy detected. Player is operating far above team baseline.</span></p>}
            {selectedEntity.deadWeightFlag === 1 && <p className="flex gap-2"><span className="text-tactical-red">●</span> <span><span className="text-tactical-red font-bold uppercase text-[9px]">MIA:</span> Player logged a dead weight match (0/0/0). Critical performance drop.</span></p>}
            {selectedEntity.survivalLead > 5 && <p className="flex gap-2"><span className="text-blue-400">●</span> <span><span className="text-blue-400 font-bold uppercase text-[9px]">The Anchor:</span> Consistently outlives teammates by {selectedEntity.survivalLead.toFixed(1)} placements.</span></p>}
            {selectedEntity.killEfficiencyRating > 50 && <p className="flex gap-2"><span className="text-tactical-green">●</span> <span><span className="text-tactical-green font-bold uppercase text-[9px]">Lethal Precision:</span> High kill efficiency. Secures finishes with minimal damage spent.</span></p>}
            {(!selectedEntity.soloCarryProxy && !selectedEntity.deadWeightFlag && selectedEntity.survivalLead <= 5 && selectedEntity.killEfficiencyRating <= 50) && <p className="text-tactical-gray italic">Balanced profile. Operating within standard team parameters. No significant outliers detected.</p>}
          </div>
        ) : (
          <div className="space-y-3">
            {selectedEntity.boomOrBustIndex > 1.5 && <p className="flex gap-2"><span className="text-yellow-500">●</span> <span><span className="text-yellow-500 font-bold uppercase text-[9px]">Wildcard:</span> Extreme boom or bust index. High volatility in match outcomes.</span></p>}
            {selectedEntity.teamKillDistribution > 3 && <p className="flex gap-2"><span className="text-purple-400">●</span> <span><span className="text-purple-400 font-bold uppercase text-[9px]">Top-Heavy:</span> High kill distribution variance. Relies heavily on 1-2 players for finishes.</span></p>}
            {selectedEntity.placementConsistency < 3 && <p className="flex gap-2"><span className="text-blue-400">●</span> <span><span className="text-blue-400 font-bold uppercase text-[9px]">The Machine:</span> Incredible placement consistency. Highly predictable top finishes.</span></p>}
            {(!selectedEntity.boomOrBustIndex || selectedEntity.boomOrBustIndex <= 1.5) && selectedEntity.teamKillDistribution <= 3 && selectedEntity.placementConsistency >= 3 && <p className="text-tactical-gray italic">Standard team profile. Moderate consistency and balanced kill distribution.</p>}
          </div>
        )}
      </div>
    );
  };

  const toggleCustomColumn = (key: string) => {
    if (entityType === 'players') {
      setCustomPlayerCols(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);
    } else {
      setCustomTeamCols(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);
    }
  };

  const clearCustomColumns = () => {
    if (entityType === 'players') setCustomPlayerCols([]);
    else setCustomTeamCols([]);
  };

  const renderCustomModal = () => {
    if (!isCustomModalOpen) return null;
    
    const metricDict = entityType === 'players' ? PLAYER_METRICS : TEAM_METRICS;
    const activeCols = entityType === 'players' ? customPlayerCols : customTeamCols;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
        <div className="bg-tactical-dark border border-tactical-gray rounded-sm w-full max-w-4xl max-h-[80vh] flex flex-col shadow-2xl shadow-tactical-green/10 animate-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between p-4 border-b border-tactical-gray bg-black/50">
            <div className="flex items-center gap-3">
              <Sliders className="w-5 h-5 text-tactical-green" />
              <h2 className="text-lg font-mono font-bold text-white uppercase tracking-widest">Custom Matrix Builder</h2>
              <span className="text-xs text-tactical-light ml-2">({entityType})</span>
            </div>
            <button onClick={() => setIsCustomModalOpen(false)} className="text-tactical-light hover:text-white p-1">
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {Object.entries(metricDict).map(([groupName, metrics]) => (
                <div key={groupName} className="space-y-3">
                  <h4 className="text-xs font-bold text-tactical-green uppercase tracking-widest border-b border-tactical-gray pb-2">{groupName}</h4>
                  <div className="space-y-2">
                    {metrics.map(m => {
                      const isChecked = activeCols.includes(m.key);
                      return (
                        <label key={m.key} className="flex items-center gap-3 cursor-pointer group" onClick={() => toggleCustomColumn(m.key)}>
                          <div className={`w-4 h-4 border rounded-sm flex items-center justify-center transition-colors ${isChecked ? 'bg-tactical-green border-tactical-green' : 'border-tactical-gray group-hover:border-tactical-light'}`}>
                            {isChecked && <div className="w-2 h-2 bg-black rounded-sm" />}
                          </div>
                          <span className={`text-xs font-mono transition-colors ${isChecked ? 'text-white' : 'text-tactical-light group-hover:text-white'}`}>
                            {m.label}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="p-4 border-t border-tactical-gray bg-black/50 flex justify-between items-center">
            <button 
              onClick={clearCustomColumns}
              className="text-xs font-bold uppercase tracking-wider text-tactical-red hover:text-red-400 transition-colors"
            >
              Clear All
            </button>
            <div className="flex items-center gap-4">
              <span className="text-xs text-tactical-light font-mono">{activeCols.length} metrics selected</span>
              <button 
                onClick={() => setIsCustomModalOpen(false)}
                className="px-6 py-2 bg-tactical-green text-black text-xs font-bold uppercase tracking-wider rounded-sm hover:bg-green-400 transition-colors"
              >
                Apply Matrix
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] tactical-panel border border-tactical-gray rounded-sm overflow-hidden cyber-glitch-container relative">
      <div className="scanline pointer-events-none"></div>
      {renderCustomModal()}
      
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-tactical-gray bg-black/60 backdrop-blur-md relative z-10">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Activity className="w-6 h-6 text-tactical-green animate-pulse" />
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-tactical-green rounded-full animate-ping"></div>
          </div>
          <div>
            <h2 className="text-xl font-mono font-bold text-white uppercase tracking-[0.2em] glow-text-green">Analyst Workbench</h2>
            <div className="flex items-center gap-3 mt-0.5">
              <span className="text-[9px] text-tactical-light font-mono flex items-center gap-1">
                <div className="w-1.5 h-1.5 bg-tactical-green rounded-full"></div> SYSTEM_ONLINE
              </span>
              <span className="text-[9px] text-tactical-gray font-mono">|</span>
              <span className="text-[9px] text-tactical-light font-mono uppercase tracking-widest">Global Avg Impact: <span className="text-tactical-green">{globalAverages.impact.toFixed(1)}</span></span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="hidden lg:flex items-center gap-6 px-6 border-x border-tactical-gray/30">
             <div className="text-center">
                <div className="text-[8px] text-tactical-gray uppercase font-bold">Total Data Points</div>
                <div className="text-sm text-white font-mono font-bold">{data.length * 20}k+</div>
             </div>
             <div className="text-center">
                <div className="text-[8px] text-tactical-gray uppercase font-bold">Active Entities</div>
                <div className="text-sm text-white font-mono font-bold">{entityType === 'players' ? globalPlayers.length : data.length}</div>
             </div>
          </div>
          <div className="flex bg-black/80 border border-tactical-gray rounded-sm p-1 shadow-inner">
            <button 
              onClick={() => { setEntityType('players'); setSelectedEntity(null); setCompareEntity(null); }}
              className={`px-6 py-1.5 text-xs font-bold uppercase tracking-widest rounded-sm transition-all ${entityType === 'players' ? 'bg-tactical-green/20 text-tactical-green shadow-[0_0_10px_rgba(0,255,0,0.2)]' : 'text-tactical-light hover:text-white'}`}
            >
              Players
            </button>
            <button 
              onClick={() => { setEntityType('teams'); setSelectedEntity(null); setCompareEntity(null); }}
              className={`px-6 py-1.5 text-xs font-bold uppercase tracking-widest rounded-sm transition-all ${entityType === 'teams' ? 'bg-tactical-green/20 text-tactical-green shadow-[0_0_10px_rgba(0,255,0,0.2)]' : 'text-tactical-light hover:text-white'}`}
            >
              Teams
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden relative z-10">
        {/* Zone A: Control Panel */}
        <div className="w-52 border-r border-tactical-gray bg-black/40 p-4 flex flex-col gap-2 cyber-grid">
          <span className="text-[10px] font-mono text-tactical-gray uppercase tracking-widest mb-3 flex items-center gap-2">
            <div className="w-1 h-3 bg-tactical-green"></div> Analytics Modules
          </span>
          <button 
            onClick={() => setCategory('combat')}
            className={`flex items-center gap-3 px-4 py-3 text-[10px] font-bold uppercase tracking-widest rounded-sm border transition-all text-left group ${category === 'combat' ? 'bg-tactical-red/10 border-tactical-red/50 text-tactical-red glow-border-red' : 'bg-transparent border-transparent text-tactical-light hover:bg-white/5'}`}
          >
            <Crosshair className={`w-4 h-4 group-hover:scale-110 transition-transform ${category === 'combat' ? 'animate-pulse' : ''}`} /> Combat
          </button>
          <button 
            onClick={() => setCategory('survival')}
            className={`flex items-center gap-3 px-4 py-3 text-[10px] font-bold uppercase tracking-widest rounded-sm border transition-all text-left group ${category === 'survival' ? 'bg-blue-500/10 border-blue-500/50 text-blue-400 glow-border-green' : 'bg-transparent border-transparent text-tactical-light hover:bg-white/5'}`}
          >
            <Shield className={`w-4 h-4 group-hover:scale-110 transition-transform ${category === 'survival' ? 'animate-pulse' : ''}`} /> Survival
          </button>
          <button 
            onClick={() => setCategory('team_dynamics')}
            className={`flex items-center gap-3 px-4 py-3 text-[10px] font-bold uppercase tracking-widest rounded-sm border transition-all text-left group ${category === 'team_dynamics' ? 'bg-purple-500/10 border-purple-500/50 text-purple-400' : 'bg-transparent border-transparent text-tactical-light hover:bg-white/5'}`}
          >
            <Users className={`w-4 h-4 group-hover:scale-110 transition-transform ${category === 'team_dynamics' ? 'animate-pulse' : ''}`} /> Dynamics
          </button>
          <div className="w-full h-px bg-tactical-gray/30 my-4"></div>
          <button 
            onClick={() => { setCategory('custom'); setIsCustomModalOpen(true); }}
            className={`flex items-center justify-between px-4 py-3 text-[10px] font-bold uppercase tracking-widest rounded-sm border transition-all text-left group ${category === 'custom' ? 'bg-tactical-green/10 border-tactical-green/50 text-tactical-green glow-border-green' : 'bg-transparent border-transparent text-tactical-light hover:bg-white/5'}`}
          >
            <div className="flex items-center gap-3">
              <Sliders className={`w-4 h-4 group-hover:rotate-90 transition-transform`} /> Custom
            </div>
            {category === 'custom' && <span className="text-[8px] bg-tactical-green text-black px-1 rounded-sm font-bold">EDIT</span>}
          </button>
          
          <div className="mt-auto p-3 bg-tactical-green/5 border border-tactical-green/20 rounded-sm">
             <div className="text-[8px] text-tactical-green uppercase font-bold mb-1">Analyst Tip</div>
             <p className="text-[9px] text-tactical-light leading-relaxed font-mono">Shift+Click rows to compare two entities in the Matrix.</p>
          </div>
        </div>

        {/* Zone B: Heatmap Data Grid */}
        <div className="flex-1 overflow-auto bg-black/20 p-0 custom-scrollbar">
          <table className="w-full text-left text-sm font-mono border-collapse">
            <thead className="sticky top-0 bg-tactical-dark/95 backdrop-blur-md border-b border-tactical-gray z-20">
              <tr>
                {columns.map(col => (
                  <th 
                    key={col.key} 
                    className="p-4 text-[10px] text-tactical-gray uppercase cursor-pointer hover:text-white transition-colors group"
                    onClick={() => handleSort(col.key)}
                  >
                    <div className="flex items-center gap-2">
                      {col.label}
                      <div className="flex flex-col opacity-30 group-hover:opacity-100">
                        <span className={`text-[8px] leading-none ${sortConfig?.key === col.key && sortConfig.direction === 'asc' ? 'text-tactical-green' : ''}`}>▲</span>
                        <span className={`text-[8px] leading-none ${sortConfig?.key === col.key && sortConfig.direction === 'desc' ? 'text-tactical-green' : ''}`}>▼</span>
                      </div>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {currentData.map((row, idx) => {
                const isSelected = selectedEntity === row;
                const isCompared = compareEntity === row;
                let rowClass = 'data-row-hover cursor-pointer transition-all duration-200';
                if (isSelected) rowClass += ' bg-tactical-green/10 border-l-4 border-l-tactical-green shadow-[inset_4px_0_10px_rgba(0,255,0,0.1)]';
                else if (isCompared) rowClass += ' bg-tactical-red/10 border-l-4 border-l-tactical-red shadow-[inset_4px_0_10px_rgba(225,29,72,0.1)]';

                return (
                  <tr 
                    key={idx} 
                    onClick={(e) => handleRowClick(e, row)}
                    className={rowClass}
                  >
                    {columns.map(col => {
                      const val = row[col.key];
                      const isName = col.key === 'playerName' || col.key === 'name';
                      const isTeam = col.key === 'teamName';
                      const displayVal = typeof val === 'number' ? (Number.isInteger(val) ? val : val.toFixed(2)) : val;
                      
                      return (
                        <td key={col.key} className={`p-4 ${isName ? 'text-white font-bold' : isTeam ? 'text-tactical-light italic text-xs' : getHeatmapColor(col.key, val, currentData)}`}>
                          <div className="flex items-center gap-2">
                            {isName && getStatusBadge(row)}
                            {displayVal}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Zone C: Inspector Panel */}
        {selectedEntity && (
          <div className={`${compareEntity ? 'w-[450px]' : 'w-96'} border-l border-tactical-gray bg-black/90 backdrop-blur-xl p-6 flex flex-col overflow-y-auto animate-in slide-in-from-right-8 duration-300 shadow-[-20px_0_40px_rgba(0,0,0,0.5)] z-30`}>
            <div className="flex items-center justify-between mb-8">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                   <div className="w-2 h-2 bg-tactical-green rounded-full"></div>
                   <span className="text-[10px] text-tactical-green font-bold uppercase tracking-widest">Primary Focus</span>
                </div>
                <h3 className="text-2xl font-serif font-bold text-white uppercase glow-text-green leading-none">
                  {selectedEntity.playerName || selectedEntity.name}
                </h3>
                {compareEntity && (
                  <div className="mt-4 flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                       <div className="w-2 h-2 bg-tactical-red rounded-full"></div>
                       <span className="text-[10px] text-tactical-red font-bold uppercase tracking-widest">Comparison Target</span>
                    </div>
                    <h3 className="text-2xl font-serif font-bold text-white uppercase glow-text-red leading-none">
                      {compareEntity.playerName || compareEntity.name}
                    </h3>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 self-start">
                <div className="flex bg-black/60 border border-tactical-gray rounded-sm p-1 shadow-inner">
                  <button 
                    onClick={() => setShowTrendline(false)}
                    className={`p-2 rounded-sm transition-all ${!showTrendline ? 'bg-tactical-green/20 text-tactical-green shadow-sm' : 'text-tactical-gray hover:text-tactical-light'}`}
                    title="Radar Chart"
                  >
                    <Hexagon className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => setShowTrendline(true)}
                    className={`p-2 rounded-sm transition-all ${showTrendline ? 'bg-tactical-green/20 text-tactical-green shadow-sm' : 'text-tactical-gray hover:text-tactical-light'}`}
                    title="Trendline"
                  >
                    <TrendingUp className="w-4 h-4" />
                  </button>
                </div>
                <button onClick={() => { setSelectedEntity(null); setCompareEntity(null); }} className="text-tactical-light hover:text-white p-1 hover:bg-white/5 rounded-full transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="bg-black/40 border border-white/5 rounded-sm p-4 mb-6 relative overflow-hidden group">
               <div className="absolute top-0 left-0 w-1 h-full bg-tactical-green opacity-50"></div>
               <div className="absolute top-0 right-0 p-1">
                  <Activity className="w-3 h-3 text-tactical-green/30 group-hover:text-tactical-green transition-colors" />
               </div>
               {showTrendline ? renderTrendlineChart() : renderRadarChart()}
            </div>

            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-tactical-green/30 to-transparent"></div>
                <div className="flex items-center gap-2 text-tactical-green">
                  <BrainCircuit className="w-4 h-4 animate-pulse" />
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Neural Narrative</span>
                </div>
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-tactical-green/30 to-transparent"></div>
              </div>
              {renderStoryteller()}
            </div>

            {renderSynergyMatrix()}

            <div className="mt-8 pt-6 border-t border-tactical-gray/30 flex flex-col gap-3">
              <button 
                onClick={() => onOpenStudio && onOpenStudio(entityType === 'players' ? 'mvp' : 'team_profile', selectedEntity.playerName || selectedEntity.name)}
                className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-tactical-green/10 border border-tactical-green/30 text-tactical-green text-xs font-bold uppercase tracking-widest rounded-sm hover:bg-tactical-green/20 hover:border-tactical-green/50 transition-all group"
              >
                <MonitorPlay className="w-4 h-4 group-hover:scale-110 transition-transform" /> 
                Open {compareEntity ? 'Primary' : 'Analysis'} in Studio
              </button>
              {compareEntity && (
                <button 
                  onClick={() => onOpenStudio && onOpenStudio(entityType === 'players' ? 'mvp' : 'team_profile', compareEntity.playerName || compareEntity.name)}
                  className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-tactical-red/10 border border-tactical-red/30 text-tactical-red text-xs font-bold uppercase tracking-widest rounded-sm hover:bg-tactical-red/20 hover:border-tactical-red/50 transition-all group"
                >
                  <MonitorPlay className="w-4 h-4 group-hover:scale-110 transition-transform" /> 
                  Open Comparison in Studio
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StatisticsMode;
