import React, { useState, useMemo } from 'react';
import { TeamData, MatchData } from '../types';
import { getGlobalPlayerRegistry } from '../services/analyticsEngine';
import { Activity, Shield, Users, Crosshair, Database, BarChart2, Sliders, LayoutGrid, Search, PlaySquare, Maximize2, GitBranch, ListFilter, AlignLeft, Map as MapIcon } from 'lucide-react';
import { PLAYER_METRICS, TEAM_METRICS, BGMI_PLAYER_METRICS, BGMI_TEAM_METRICS, MATCH_METRICS } from './statistics/metrics';
import { InspectorPanel } from './statistics/InspectorPanel';
import { StatisticsTable } from './statistics/StatisticsTable';
import { SandboxCanvas } from './statistics/SandboxCanvas';

interface StatisticsModeProps {
  data: TeamData[];
  rawMatches?: MatchData[];
  onOpenStudio?: (mode: string, focusId?: string) => void;
}

type EntityType = 'players' | 'teams' | 'matches';

export const StatisticsMode: React.FC<StatisticsModeProps> = ({ data, rawMatches = [], onOpenStudio }) => {
  // Core State
  const [entityType, setEntityType] = useState<EntityType>('players');
  const [viewMode, setViewMode] = useState<'canvas' | 'table'>('canvas');
  
  // BI Configuration State
  const [xAxisKey, setXAxisKey] = useState<string>('playTimeMinutes');
  const [yAxisKey, setYAxisKey] = useState<string>('impactScore');
  const [zAxisKey, setZAxisKey] = useState<string | null>('kills');
  const [colorByKey, setColorByKey] = useState<string>('teamName');

  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>(null);
  const [selectedEntity, setSelectedEntity] = useState<any>(null);
  const [compareEntity, setCompareEntity] = useState<any>(null);
  const [showTrendline, setShowTrendline] = useState(false);
  
  const isBgmi = typeof window !== 'undefined' && localStorage.getItem('fraglab_game_mode') === 'bgmi';
  const globalPlayers = useMemo(() => getGlobalPlayerRegistry(data), [data]);

  const playerMetricsConfig = isBgmi ? BGMI_PLAYER_METRICS : PLAYER_METRICS;
  const teamMetricsConfig = isBgmi ? TEAM_METRICS : TEAM_METRICS;
  const matchMetricsConfig = isBgmi ? BGMI_MATCH_METRICS : MATCH_METRICS;

  const allPlayerMetrics = useMemo(() => Object.values(playerMetricsConfig).flat(), [playerMetricsConfig]);
  const allTeamMetrics = useMemo(() => Object.values(teamMetricsConfig).flat(), [teamMetricsConfig]);
  const allMatchMetrics = useMemo(() => Object.values(matchMetricsConfig).flat(), [matchMetricsConfig]);

  const activeMetrics = entityType === 'players' ? allPlayerMetrics : entityType === 'teams' ? allTeamMetrics : allMatchMetrics;

  const xAxisDef = activeMetrics.find(m => m.key === xAxisKey) || activeMetrics[0];
  const yAxisDef = activeMetrics.find(m => m.key === yAxisKey) || activeMetrics[1];
  const zAxisDef = zAxisKey ? activeMetrics.find(m => m.key === zAxisKey) : null;

  const globalAverages = useMemo(() => {
    return {
      impact: globalPlayers.reduce((s, p) => s + (p.impactScore || 0), 0) / Math.max(1, globalPlayers.length),
      damage: globalPlayers.reduce((s, p) => s + (p.damage || 0), 0) / Math.max(1, globalPlayers.length),
      kills: globalPlayers.reduce((s, p) => s + (p.finishes || 0), 0) / Math.max(1, globalPlayers.length),
    };
  }, [globalPlayers]);

  const matchDataAggregated = useMemo(() => {
    return rawMatches.map(match => {
      const matchTotalFinishes = match.teams.reduce((s, t) => s + t.totalKills, 0);
      const matchTotalDamage = match.teams.reduce((s, t) => s + t.totalDamage, 0);
      const highestPoints = Math.max(...match.teams.map(t => t.totalPoints), 0);
      const avgSurvivalTime = match.teams.reduce((s, t) => s + t.avgSurvivalSeconds, 0) / match.teams.length / 60;
      
      return {
        id: match.id,
        name: match.label,
        totalFinishes: matchTotalFinishes,
        totalDamage: matchTotalDamage,
        avgSurvivalTime: avgSurvivalTime,
        highestPoints: highestPoints
      };
    });
  }, [rawMatches]);

  const currentData = useMemo(() => {
    let baseData: any[] = entityType === 'players' ? globalPlayers : entityType === 'teams' ? data : matchDataAggregated;
    
    if (sortConfig) {
      baseData = [...baseData].sort((a: any, b: any) => {
        const aVal = a[sortConfig.key] || 0;
        const bVal = b[sortConfig.key] || 0;
        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    } else {
      baseData = [...baseData].sort((a: any, b: any) => (b.impactScore || b.totalPoints || b.totalFinishes || 0) - (a.impactScore || a.totalPoints || a.totalFinishes || 0));
    }
    
    return baseData;
  }, [entityType, globalPlayers, data, matchDataAggregated, sortConfig]);

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

  const getTableColumns = () => {
    return [
      { key: entityType === 'players' ? 'playerName' : 'name', label: entityType === 'players' ? 'Player' : entityType === 'matches' ? 'Match' : 'Team' },
      ...(entityType === 'players' ? [{ key: 'teamName', label: 'Team' }] : []),
      xAxisDef,
      yAxisDef,
      ...(zAxisDef ? [zAxisDef] : []),
      ...activeMetrics.filter(m => m.key !== xAxisDef.key && m.key !== yAxisDef.key && m.key !== zAxisDef?.key).slice(0, 5)
    ];
  };

  const getStatusBadge = (row: any) => {
    if (entityType !== 'players') return null;
    if (row.impactScore > globalAverages.impact * 2.2) return <span className="px-1.5 py-0.5 bg-tactical-green/20 text-tactical-green border border-tactical-green/40 rounded-[2px] text-[8px] font-bold uppercase tracking-tighter">Elite</span>;
    if (row.soloCarryProxy > 1.8) return <span className="px-1.5 py-0.5 bg-yellow-500/20 text-yellow-400 border border-yellow-500/40 rounded-[2px] text-[8px] font-bold uppercase tracking-tighter">Carry</span>;
    if (row.isOutlier) return <span className="px-1.5 py-0.5 bg-tactical-red/20 text-tactical-red border border-tactical-red/40 rounded-[2px] text-[8px] font-bold uppercase tracking-tighter">Outlier</span>;
    return null;
  };

  // Helper to ensure metric changes when entity type changes to prevent missing keys
  const handleEntityToggle = (type: EntityType) => {
    setEntityType(type);
    setSelectedEntity(null);
    setCompareEntity(null);
    if (type === 'teams') {
      setXAxisKey('avgPlacement');
      setYAxisKey('totalFinishes');
      setZAxisKey('totalPoints');
      setColorByKey('none');
    } else if (type === 'matches') {
      setXAxisKey('avgSurvivalTime');
      setYAxisKey('totalFinishes');
      setZAxisKey('highestPoints');
      setColorByKey('none');
    } else {
      setXAxisKey('playTimeMinutes');
      setYAxisKey('impactScore');
      setZAxisKey('kills');
      setColorByKey('teamName');
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] tactical-panel border border-tactical-gray rounded-sm overflow-hidden cyber-glitch-container relative">
      <div className="scanline pointer-events-none"></div>
      
      {/* Header: BI Toolbar */}
      <div className="flex items-center justify-between p-3 border-b border-tactical-gray bg-black/60 backdrop-blur-md relative z-10">
        <div className="flex items-center gap-4">
          <div className="relative p-1.5 bg-tactical-green/10 rounded-sm">
            <BarChart2 className="w-5 h-5 text-tactical-green" />
          </div>
          <div>
            <h2 className="text-sm font-mono font-bold text-white uppercase tracking-[0.2em]">Data Playground</h2>
            <div className="text-[9px] text-tactical-light font-mono opacity-70">INTERACTIVE BI ENGINE // LIVE SYNC</div>
          </div>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="flex bg-black/80 border border-tactical-gray rounded-sm p-1 shadow-inner">
            <button 
              onClick={() => handleEntityToggle('players')}
              className={`px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-sm transition-all flex items-center gap-2 ${entityType === 'players' ? 'bg-tactical-green/20 text-tactical-green shadow-[0_0_10px_rgba(0,255,0,0.2)]' : 'text-tactical-light hover:text-white'}`}
            >
              <Users className="w-3 h-3" /> Players
            </button>
            <button 
              onClick={() => handleEntityToggle('teams')}
              className={`px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-sm transition-all flex items-center gap-2 ${entityType === 'teams' ? 'bg-tactical-green/20 text-tactical-green shadow-[0_0_10px_rgba(0,255,0,0.2)]' : 'text-tactical-light hover:text-white'}`}
            >
              <Shield className="w-3 h-3" /> Teams
            </button>
            {rawMatches.length > 0 && (
              <button 
                onClick={() => handleEntityToggle('matches')}
                className={`px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-sm transition-all flex items-center gap-2 ${entityType === 'matches' ? 'bg-tactical-green/20 text-tactical-green shadow-[0_0_10px_rgba(0,255,0,0.2)]' : 'text-tactical-light hover:text-white'}`}
              >
                <MapIcon className="w-3 h-3" /> Maps
              </button>
            )}
          </div>
          <div className="w-px h-6 bg-tactical-gray/50"></div>
          <div className="flex bg-black/80 border border-tactical-gray rounded-sm p-1 shadow-inner">
             <button 
              onClick={() => setViewMode('canvas')}
              className={`px-3 py-1.5 rounded-sm transition-all ${viewMode === 'canvas' ? 'bg-tactical-green text-black' : 'text-tactical-light hover:text-white'}`}
              title="Canvas View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 rounded-sm transition-all ${viewMode === 'table' ? 'bg-tactical-green text-black' : 'text-tactical-light hover:text-white'}`}
              title="Table View"
            >
              <AlignLeft className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Workspace */}
      <div className="flex flex-1 overflow-hidden relative z-10">
        
        {/* Left Drawer: Config Panel */}
        <div className="w-64 border-r border-tactical-gray bg-black/40 p-4 flex flex-col gap-4 overflow-y-auto">
           <div className="space-y-4">
              <div className="text-[10px] font-bold text-tactical-green uppercase tracking-widest flex items-center gap-2 pb-2 border-b border-white/5">
                <Sliders className="w-3 h-3" /> Axes Configuration
              </div>
              
              {/* X Axis */}
              <div className="space-y-1">
                 <label className="text-[9px] text-tactical-gray uppercase font-bold flex items-center justify-between">
                   X-Axis (Columns)
                   <span className="text-tactical-green">↔</span>
                 </label>
                 <select 
                    value={xAxisKey} 
                    onChange={(e) => setXAxisKey(e.target.value)}
                    className="w-full bg-black border border-tactical-gray text-white text-[10px] font-mono p-2 outline-none focus:border-tactical-green rounded-sm"
                 >
                    {activeMetrics.map(m => (
                      <option key={m.key} value={m.key}>{m.label}</option>
                    ))}
                 </select>
              </div>

              {/* Y Axis */}
              <div className="space-y-1">
                 <label className="text-[9px] text-tactical-gray uppercase font-bold flex items-center justify-between">
                   Y-Axis (Rows)
                   <span className="text-tactical-green">↕</span>
                 </label>
                 <select 
                    value={yAxisKey} 
                    onChange={(e) => setYAxisKey(e.target.value)}
                    className="w-full bg-black border border-tactical-gray text-white text-[10px] font-mono p-2 outline-none focus:border-tactical-green rounded-sm"
                 >
                    {activeMetrics.map(m => (
                      <option key={m.key} value={m.key}>{m.label}</option>
                    ))}
                 </select>
              </div>

              {/* Z Axis (Size) */}
              <div className="space-y-1">
                 <label className="text-[9px] text-tactical-gray uppercase font-bold flex items-center justify-between">
                   Size (Radius)
                   <span className="text-tactical-light">⚪</span>
                 </label>
                 <select 
                    value={zAxisKey || ''} 
                    onChange={(e) => setZAxisKey(e.target.value || null)}
                    className="w-full bg-black border border-tactical-gray text-white text-[10px] font-mono p-2 outline-none focus:border-tactical-green rounded-sm"
                 >
                    <option value="">Uniform Size</option>
                    {activeMetrics.map(m => (
                      <option key={m.key} value={m.key}>{m.label}</option>
                    ))}
                 </select>
              </div>

              {/* Color By */}
              {entityType === 'players' && (
                <div className="space-y-1">
                   <label className="text-[9px] text-tactical-gray uppercase font-bold flex items-center justify-between">
                     Color By (Group)
                     <span className="text-[10px]">🎨</span>
                   </label>
                   <select 
                      value={colorByKey} 
                      onChange={(e) => setColorByKey(e.target.value)}
                      className="w-full bg-black border border-tactical-gray text-white text-[10px] font-mono p-2 outline-none focus:border-tactical-green rounded-sm"
                   >
                      <option value="none">Uniform Color</option>
                      <option value="teamName">Team Affinity</option>
                      <option value="survivedToEndFlag">Is Winner</option>
                   </select>
                </div>
              )}
           </div>
           
           <div className="mt-auto pt-4 border-t border-white/5 opacity-50 text-[9px] font-mono text-tactical-gray leading-relaxed">
             Pro Tip: Analyze correlative outliers by mapping X to a survival stat (e.g. Play Time) and Y to a combat stat (e.g. Finishes).
           </div>
        </div>

        {/* Center Canvas / Table */}
        <div className="flex-1 flex flex-col relative bg-black/20">
          {viewMode === 'canvas' ? (
            <div className="flex-1 p-4">
              <div className="w-full h-full bg-black/40 border border-white/5 rounded-sm p-4 backdrop-blur-sm shadow-[inset_0_0_40px_rgba(0,0,0,0.5)]">
                 <SandboxCanvas 
                   data={currentData}
                   xAxis={xAxisDef}
                   yAxis={yAxisDef}
                   zAxis={zAxisDef}
                   colorBy={colorByKey}
                   entityType={entityType}
                   onEntityClick={(payload) => {
                     // Click handling from scatter chart
                     // payload comes back as the row data
                     const row = payload;
                     if(selectedEntity && selectedEntity !== row && !compareEntity) {
                        setCompareEntity(row);
                     } else {
                        setSelectedEntity(row);
                        setCompareEntity(null);
                     }
                   }}
                 />
              </div>
            </div>
          ) : (
            <StatisticsTable 
              columns={getTableColumns()}
              data={currentData}
              sortConfig={sortConfig}
              onSort={handleSort}
              selectedEntity={selectedEntity}
              compareEntity={compareEntity}
              onRowClick={handleRowClick}
              getStatusBadge={getStatusBadge}
            />
          )}
        </div>

        {/* Right Drawer: Inspector Panel */}
        <InspectorPanel 
          selectedEntity={selectedEntity}
          compareEntity={compareEntity}
          entityType={entityType}
          isBgmi={isBgmi}
          onClose={() => { setSelectedEntity(null); setCompareEntity(null); }}
          showTrendline={showTrendline}
          onToggleTrendline={() => setShowTrendline(!showTrendline)}
        />
      </div>
    </div>
  );
};

export default StatisticsMode;


