
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { TeamData, PlayerDerived, ScoringRules } from '../types';
import { getGlobalPlayerRegistry } from '../services/analyticsEngine';
import { Search, Filter, ArrowUpDown, ChevronUp, ChevronDown, Crosshair, Skull, Shield, Zap, MonitorPlay, LayoutGrid, List, TrendingUp, ChevronRight, Activity, Target, ArrowRightLeft, Download, Loader2, Check, AlertCircle } from 'lucide-react';
import { toPng } from 'html-to-image';

interface OperatorLeaderboardProps {
  data: TeamData[];
  onPlayerClick?: (player: PlayerDerived, teamName: string) => void;
  onOpenStudio?: () => void;
  scoringRules?: ScoringRules;
}

type SortField = 'impactScore' | 'finishes' | 'damage' | 'playTimeMinutes' | 'playerName' | 'teamName' | 'consistency' | 'dpk';

// --- HELPER COMPONENTS ---

const Sparkline: React.FC<{ data: number[], color?: string }> = ({ data, color = '#ef4444' }) => {
    if (!data || data.length < 2) return <span className="text-[10px] text-tactical-gray">-</span>;
    
    const height = 24;
    const width = 60;
    const max = Math.max(...data, 1);
    const min = Math.min(...data);
    const range = max - min || 1;
    
    const points = data.map((val, i) => {
        const x = (i / (data.length - 1)) * width;
        const y = height - ((val - min) / range) * height;
        return `${x},${y}`;
    }).join(' ');

    return (
        <svg width={width} height={height} className="overflow-visible">
            <polyline 
                points={points} 
                fill="none" 
                stroke={color} 
                strokeWidth="2" 
                vectorEffect="non-scaling-stroke"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            {/* Last point dot */}
            <circle cx={width} cy={height - ((data[data.length-1] - min) / range) * height} r="2" fill="#fff" />
        </svg>
    );
};

const RoleBadge: React.FC<{ role: string }> = ({ role }) => {
    const config: Record<string, { label: string, color: string, bg: string }> = {
        'SYSTEM_COLLAPSE': { label: 'COLLAPSE', color: 'text-red-500', bg: 'bg-red-500/10 border-red-500/30' },
        'HARD_CARRY': { label: 'CARRY', color: 'text-yellow-500', bg: 'bg-yellow-500/10 border-yellow-500/30' },
        'PRIMARY': { label: 'PRIMARY', color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/30' },
        'BALANCED': { label: 'SUPPORT', color: 'text-tactical-light', bg: 'bg-tactical-gray/30 border-tactical-gray' },
    };
    const style = config[role] || config['BALANCED'];
    
    return (
        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-sm border uppercase tracking-wider ${style.color} ${style.bg}`}>
            {style.label}
        </span>
    );
};

const PlayerCard: React.FC<{ player: any, onClick?: () => void, showDamage?: boolean }> = ({ player, onClick, showDamage = true }) => {
    const isTransfer = player.teamName && player.teamName.includes('→');
    
    return (
        <div 
            onClick={onClick}
            className="group bg-tactical-dark border border-tactical-gray rounded-sm p-4 hover:border-tactical-red transition-all cursor-pointer relative"
        >
            <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-sm">
                <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:opacity-10 transition-opacity">
                    <Crosshair className="w-24 h-24" />
                </div>
            </div>
            
            {player.isOutlier && (
                <div className="absolute top-0 left-0 z-20">
                    <div className="relative group/tooltip">
                        <div className="bg-tactical-red text-white p-1 rounded-br-sm">
                            <AlertCircle className="w-3 h-3" />
                        </div>
                        <div className="absolute left-0 bottom-full mb-1 hidden group-hover/tooltip:block bg-tactical-black border border-tactical-red p-2 rounded-sm shadow-xl z-50 w-32 pointer-events-none">
                            <p className="text-[10px] font-bold text-tactical-red uppercase mb-1">Outlier Detected</p>
                            <p className="text-[9px] text-white leading-tight">{player.outlierReason}</p>
                            <div className="absolute left-2 top-full w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[4px] border-t-tactical-red"></div>
                        </div>
                    </div>
                </div>
            )}
            
            <div className="flex justify-between items-start mb-3 relative z-10">
                <div>
                    <div className="text-lg font-black text-white group-hover:text-tactical-red transition-colors truncate w-32">{player.playerName}</div>
                    <div className={`text-xs font-mono ${isTransfer ? 'text-yellow-500 flex items-center gap-1' : 'text-tactical-light'}`}>
                        {isTransfer && <ArrowRightLeft className="w-3 h-3" />}
                        {player.teamName}
                    </div>
                </div>
                <div className="text-right">
                    <div className="text-2xl font-black text-white">{player.impactScore.toFixed(0)}</div>
                    <div className="text-[9px] text-tactical-light uppercase tracking-widest">Rating</div>
                </div>
            </div>

            <div className="grid grid-cols-3 gap-2 mb-4 relative z-10">
                <div className="bg-black/40 p-2 rounded-sm border border-white/5">
                    <div className="text-[9px] text-tactical-light uppercase">Kills</div>
                    <div className="text-sm font-bold text-white">{player.finishes}</div>
                </div>
                <div className="bg-black/40 p-2 rounded-sm border border-white/5">
                    <div className="text-[9px] text-tactical-light uppercase">{showDamage ? 'Damage' : 'Matches'}</div>
                    <div className="text-sm font-bold text-white">{showDamage ? `${(player.damage/1000).toFixed(1)}k` : player.matchesPlayed}</div>
                </div>
                <div className="bg-black/40 p-2 rounded-sm border border-white/5">
                    <div className="text-[9px] text-tactical-light uppercase">KPM</div>
                    <div className="text-sm font-bold text-white">{player.kpm.toFixed(2)}</div>
                </div>
            </div>

            <div className="flex justify-between items-end relative z-10">
                <RoleBadge role={player.carryClass} />
                <div className="h-6">
                    <Sparkline data={player.recentKills} />
                </div>
            </div>
        </div>
    );
};

// --- MAIN COMPONENT ---

const MobileScrollIndicator: React.FC<{ containerRef: React.RefObject<HTMLDivElement | null> }> = ({ containerRef }) => {
  return null;
};

const OperatorLeaderboard: React.FC<OperatorLeaderboardProps> = ({ data, onPlayerClick, onOpenStudio, scoringRules }) => {
  const activeMetrics = scoringRules?.activeMetrics || { kills: true, assists: true, damage: true, time: true };
  const showDamage = activeMetrics.damage ?? true;
  const showTime = activeMetrics.time ?? true;

  const containerRef = useRef<HTMLDivElement>(null);
  const tableScrollContainerRef = useRef<HTMLDivElement>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('impactScore');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setViewMode('cards');
    }
  }, []);
  const [expandedPlayerId, setExpandedPlayerId] = useState<string | null>(null);
  const [isSnapshotting, setIsSnapshotting] = useState(false);
  const [snapDone, setSnapDone] = useState(false);

  // 1. Process & Enrich Data using GLOBAL REGISTRY (handles roster changes)
  const processedPlayers = useMemo(() => {
    if (!data || data.length === 0) return [];
    
    // Get globally unique players (merges duplicates from transfer market)
    const globalPlayers = getGlobalPlayerRegistry(data);

    return globalPlayers.map(p => {
        // Calculate Consistency (CV Score)
        let consistency = 50;
        const killHistory = p.history?.map((h: any) => h.finishes) || [];
        if (killHistory.length > 1) {
            const mean = killHistory.reduce((a:number,b:number)=>a+b,0) / killHistory.length;
            const variance = killHistory.reduce((a:number,b:number)=>a + Math.pow(b-mean, 2), 0) / killHistory.length;
            const stdDev = Math.sqrt(variance);
            const cv = mean > 0 ? stdDev / mean : 0;
            consistency = Math.max(0, Math.min(100, (1 - (cv * 0.5)) * 100));
        }

        return {
            ...p,
            consistency,
            recentKills: p.history?.slice(-5).map((h: any) => h.finishes) || [],
            id: p.playerName // Unique ID is now player name as duplicates are merged
        };
    }).filter(p => 
      ((p.playerName || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
       (p.teamName || '').toLowerCase().includes(searchTerm.toLowerCase()))
    ).filter(p => roleFilter === 'ALL' || p.carryClass === roleFilter)
    .sort((a, b) => {
        let valA: any = a[sortField as keyof typeof a];
        let valB: any = b[sortField as keyof typeof b];
        
        if (sortField === 'playerName' || sortField === 'teamName') {
            valA = (valA?.toString() || '').toLowerCase();
            valB = (valB?.toString() || '').toLowerCase();
        }

        if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
        if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
        return 0;
    });
  }, [data, searchTerm, sortField, sortDirection, roleFilter]);

  // Max values for Heatmap Scaling
  const maxDamage = Math.max(...processedPlayers.map(p => p.damage), 1);
  const maxKills = Math.max(...processedPlayers.map(p => p.finishes), 1);

  // Handlers
  const handleSort = (field: SortField) => {
      if (sortField === field) {
          setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
      } else {
          setSortField(field);
          setSortDirection('desc');
      }
  };

  const toggleExpand = (id: string) => {
      setExpandedPlayerId(prev => prev === id ? null : id);
  };

  const SortIcon = ({ field }: { field: SortField }) => {
      if (sortField !== field) return <ArrowUpDown className="w-3 h-3 opacity-20" />;
      return sortDirection === 'asc' ? <ChevronUp className="w-3 h-3 text-tactical-red" /> : <ChevronDown className="w-3 h-3 text-tactical-red" />;
  };

  const handleDownload = async () => {
      if (!containerRef.current) return;
      setIsSnapshotting(true);
      try {
          const dataUrl = await toPng(containerRef.current, { backgroundColor: '#0E0E0E', pixelRatio: 2 });
          const link = document.createElement('a');
          link.download = `operator_leaderboard_${Date.now()}.png`;
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

  return (
    <div id="operator-leaderboard" ref={containerRef} className="bg-tactical-black border border-tactical-gray rounded-sm mb-12 animate-in fade-in slide-in-from-bottom-8">
        
        {/* Header Control Bar */}
        <div className="p-4 border-b border-tactical-gray bg-tactical-dark/50 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
            <div className="flex flex-col">
                <h3 className="font-serif text-lg font-bold text-white flex items-center gap-2">
                    <Crosshair className="w-5 h-5 text-tactical-red" /> Global Operator Registry
                </h3>
                <p className="text-[10px] font-mono text-tactical-light uppercase tracking-wide mt-1">
                    {processedPlayers.length} Unique Operators • Transfer Market Active
                </p>
            </div>
            
            <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
                 {/* Role Filter */}
                 <div className="flex items-center gap-2 bg-black border border-tactical-gray rounded-sm px-2 py-1.5 flex-1 xl:flex-none">
                     <Filter className="w-3 h-3 text-tactical-light" />
                     <select 
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value)}
                        className="bg-transparent text-xs text-white font-bold uppercase focus:outline-none w-full xl:w-32 cursor-pointer"
                     >
                         <option value="ALL" className="bg-black text-white">All Roles</option>
                         <option value="SYSTEM_COLLAPSE" className="bg-black text-white">Collapse</option>
                         <option value="HARD_CARRY" className="bg-black text-white">Hard Carry</option>
                         <option value="PRIMARY" className="bg-black text-white">Primary</option>
                         <option value="BALANCED" className="bg-black text-white">Support</option>
                     </select>
                 </div>

                 {/* Search */}
                 <div className="relative flex-1 xl:flex-none">
                    <Search className="w-3 h-3 absolute left-3 top-1/2 -translate-y-1/2 text-tactical-light" />
                    <input 
                        type="text" 
                        placeholder="SEARCH DATABASE..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-8 pr-4 py-1.5 bg-black border border-tactical-gray rounded-sm text-xs text-white focus:border-white outline-none w-full xl:w-48 font-mono placeholder:text-tactical-gray"
                    />
                 </div>

                 {/* View Toggles */}
                 <div className="flex bg-black border border-tactical-gray rounded-sm p-0.5">
                     <button 
                        onClick={() => setViewMode('table')}
                        className={`p-1.5 rounded-sm transition-all ${viewMode === 'table' ? 'bg-tactical-light text-white' : 'text-tactical-light hover:text-white'}`}
                        title="Table View"
                     >
                         <List className="w-4 h-4" />
                     </button>
                     <button 
                        onClick={() => setViewMode('cards')}
                        className={`p-1.5 rounded-sm transition-all ${viewMode === 'cards' ? 'bg-tactical-light text-white' : 'text-tactical-light hover:text-white'}`}
                        title="Card Grid View"
                     >
                         <LayoutGrid className="w-4 h-4" />
                     </button>
                 </div>

                 <div className="flex gap-1">
                    {onOpenStudio && (
                        <button 
                            onClick={onOpenStudio} 
                            className="p-1.5 bg-tactical-white text-black rounded-sm hover:bg-tactical-light transition-colors border border-white"
                            title="Open in Studio"
                        >
                            <MonitorPlay className="w-4 h-4" />
                        </button>
                    )}
                    <button 
                        onClick={handleDownload} 
                        disabled={isSnapshotting}
                        className="p-1.5 bg-tactical-white text-black rounded-sm hover:bg-tactical-light transition-colors border border-white"
                        title="Download PNG"
                    >
                        {isSnapshotting ? <Loader2 className="w-4 h-4 animate-spin"/> : snapDone ? <Check className="w-4 h-4 text-green-500"/> : <Download className="w-4 h-4" />}
                    </button>
                 </div>
            </div>
        </div>

        {/* --- VIEW: CARD GRID --- */}
        {viewMode === 'cards' && (
            <div className="p-4 grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-4 bg-black/50">
                {processedPlayers.map((player) => (
                    <PlayerCard 
                        key={player.id} 
                        player={player} 
                        showDamage={showDamage}
                        onClick={() => onPlayerClick?.(player, player.teamName.split('→').pop()?.trim() || player.teamName)} 
                    />
                ))}
            </div>
        )}

        {/* --- VIEW: TABLE --- */}
        {viewMode === 'table' && (
            <div className="relative">
                <div ref={tableScrollContainerRef} className="overflow-x-auto">
                    <table className="w-full text-left text-sm border-collapse">
                    <thead className="bg-black text-[10px] font-mono uppercase text-tactical-light tracking-wider border-b border-tactical-gray">
                        <tr>
                            <th className="p-3 w-10 text-center">#</th>
                            <th className="p-3 w-48 cursor-pointer hover:text-white" onClick={() => handleSort('playerName')}>
                                <div className="flex items-center gap-1">Operator <SortIcon field="playerName" /></div>
                            </th>
                            <th className="p-3 w-40 cursor-pointer hover:text-white" onClick={() => handleSort('teamName')}>
                                <div className="flex items-center gap-1">History <SortIcon field="teamName" /></div>
                            </th>
                            <th className="p-3 w-24 text-center cursor-pointer hover:text-white" onClick={() => handleSort('finishes')}>
                                <div className="flex items-center gap-1 justify-center">Kills <SortIcon field="finishes" /></div>
                            </th>
                            <th className="p-3 w-28 text-center cursor-pointer hover:text-white" onClick={() => handleSort(showDamage ? 'damage' : 'playTimeMinutes')}>
                                <div className="flex items-center gap-1 justify-center">{showDamage ? 'Damage' : 'Matches'} <SortIcon field={showDamage ? 'damage' : 'playTimeMinutes'} /></div>
                            </th>
                            {showDamage && (
                                <th className="p-3 w-24 text-center cursor-pointer hover:text-white hidden md:table-cell" onClick={() => handleSort('dpk')}>
                                    <div className="flex items-center gap-1 justify-center">DPK <SortIcon field="dpk" /></div>
                                </th>
                            )}
                            <th className="p-3 w-32 text-center cursor-pointer hover:text-white hidden lg:table-cell" onClick={() => handleSort('consistency')}>
                                <div className="flex items-center gap-1 justify-center">C.Rat <SortIcon field="consistency" /></div>
                            </th>
                            <th className="p-3 w-32 hidden xl:table-cell">Impact Share</th>
                            <th className="p-3 w-24 text-center hidden md:table-cell">Form (L5)</th>
                            <th className="p-3 w-20 text-right cursor-pointer hover:text-white" onClick={() => handleSort('impactScore')}>
                                <div className="flex items-center gap-1 justify-end">Rating <SortIcon field="impactScore" /></div>
                            </th>
                            <th className="p-3 w-8"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-tactical-gray/20">
                        {processedPlayers.map((player, idx) => {
                            const isExpanded = expandedPlayerId === player.id;
                            const isTransfer = player.teamName.includes('→');
                            
                            // Heatmap Opacity
                            const dmgOpacity = Math.max(0.1, player.damage / maxDamage);
                            const killOpacity = Math.max(0.1, player.finishes / maxKills);

                            return (
                                <React.Fragment key={player.id}>
                                    <tr 
                                        className={`group hover:bg-white/5 transition-colors cursor-pointer ${isExpanded ? 'bg-white/5' : ''}`}
                                        onClick={() => toggleExpand(player.id)}
                                    >
                                        <td className="p-3 text-center font-mono text-tactical-gray text-xs">{idx + 1}</td>
                                        
                                        {/* Player Identity */}
                                        <td className="p-3">
                                            <div className="font-bold text-white group-hover:text-tactical-red transition-colors flex items-center gap-2">
                                                {player.playerName}
                                                {player.isOutlier && (
                                                    <div className="relative group/tooltip">
                                                        <AlertCircle className="w-3 h-3 text-tactical-red" />
                                                        <div className="absolute left-0 bottom-full mb-2 hidden group-hover/tooltip:block bg-tactical-black border border-tactical-red p-2 rounded-sm shadow-xl z-50 w-40 pointer-events-none">
                                                            <p className="text-[10px] font-bold text-tactical-red uppercase mb-1">Outlier Detected</p>
                                                            <p className="text-[9px] text-white leading-tight">{player.outlierReason}</p>
                                                            <div className="absolute left-2 top-full w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[4px] border-t-tactical-red"></div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="mt-1">
                                                <RoleBadge role={player.carryClass} />
                                            </div>
                                        </td>
                                        
                                        <td className="p-3">
                                            <div className={`font-mono text-xs uppercase ${isTransfer ? 'text-yellow-500 font-bold' : 'text-tactical-light'}`} title={player.teamName}>
                                                {isTransfer ? (
                                                    <div className="flex items-center gap-1">
                                                        <ArrowRightLeft className="w-3 h-3" />
                                                        Transfer
                                                    </div>
                                                ) : player.teamName}
                                            </div>
                                        </td>
                                        
                                        {/* Kills Heatmap */}
                                        <td className="p-3 text-center" style={{ backgroundColor: `rgba(234, 179, 8, ${killOpacity * 0.15})` }}>
                                            <div className="font-bold text-white">{player.finishes}</div>
                                            <div className="text-[9px] text-tactical-gray">{player.kpm.toFixed(2)} /m</div>
                                        </td>
                                        
                                        {/* Damage Heatmap or Matches */}
                                        <td className="p-3 text-center" style={{ backgroundColor: !showDamage ? undefined : `rgba(239, 68, 68, ${dmgOpacity * 0.15})` }}>
                                            <div className="font-bold text-white">{!showDamage ? player.matchesPlayed : (player.damage).toLocaleString()}</div>
                                            <div className="text-[9px] text-tactical-gray">{!showDamage ? 'Matches Played' : `Avg: ${(player.damage / Math.max(1, player.matchesPlayed || 1)).toFixed(0)}`}</div>
                                        </td>

                                        {/* DPK */}
                                        {showDamage && (
                                            <td className="p-3 text-center hidden md:table-cell">
                                                <div className={`font-mono text-xs font-bold ${player.dpk < 300 ? 'text-tactical-green' : player.dpk > 800 ? 'text-tactical-red' : 'text-white'}`}>
                                                    {(player.dpk || 0).toFixed(0)}
                                                </div>
                                            </td>
                                        )}

                                        {/* Consistency */}
                                        <td className="p-3 text-center hidden lg:table-cell">
                                            <div className="flex flex-col items-center gap-1">
                                                <span className="text-xs font-bold text-white">{player.consistency.toFixed(0)}</span>
                                                <div className="w-16 h-1 bg-black rounded-full overflow-hidden">
                                                    <div 
                                                        className={`h-full ${player.consistency > 80 ? 'bg-tactical-green' : player.consistency > 50 ? 'bg-white' : 'bg-tactical-red'}`} 
                                                        style={{ width: `${player.consistency}%` }} 
                                                    />
                                                </div>
                                            </div>
                                        </td>

                                        {/* Team Share Bar */}
                                        <td className="p-3 hidden xl:table-cell">
                                            <div className="flex items-center gap-2 text-[9px] font-mono text-tactical-light mb-1">
                                                <span>{player.damageShare.toFixed(0)}%</span>
                                            </div>
                                            <div className="w-full bg-black h-1.5 rounded-full overflow-hidden border border-tactical-gray/30">
                                                <div className="bg-tactical-red h-full" style={{ width: `${player.damageShare}%` }}></div>
                                            </div>
                                        </td>

                                        {/* Sparkline */}
                                        <td className="p-3 text-center hidden md:table-cell">
                                            <div className="flex justify-center h-6">
                                                <Sparkline data={player.recentKills} />
                                            </div>
                                        </td>

                                        <td className="p-3 text-right">
                                            <div className="font-black text-lg text-white font-mono">{player.impactScore.toFixed(0)}</div>
                                        </td>

                                        <td className="p-3 text-center">
                                            <ChevronRight className={`w-4 h-4 text-tactical-light transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                                        </td>
                                    </tr>

                                    {/* DRILL DOWN PANEL */}
                                    {isExpanded && (
                                        <tr className="bg-black/80 border-b border-tactical-gray">
                                            <td colSpan={11} className="p-0">
                                                <div className="p-4 flex gap-8 animate-in slide-in-from-top-2">
                                                    {/* History Mini-Table */}
                                                    <div className="flex-1">
                                                        <div className="flex justify-between items-center mb-2">
                                                            <h4 className="text-[10px] font-bold uppercase text-tactical-light flex items-center gap-2"><Activity className="w-3 h-3" /> Unified Match Log</h4>
                                                            {isTransfer && <span className="text-[10px] bg-yellow-500/10 text-yellow-500 px-2 py-0.5 border border-yellow-500/20 rounded-sm">Roster Changes Detected: {player.teamName}</span>}
                                                        </div>
                                                        <table className="w-full text-xs font-mono text-left">
                                                            <thead>
                                                                <tr className="text-tactical-gray border-b border-tactical-gray/30">
                                                                    <th className="py-1">Match</th>
                                                                    <th className="py-1">Kills</th>
                                                                    {showDamage && <th className="py-1">Damage</th>}
                                                                    <th className="py-1">Rating</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {player.history.map((h: any, i: number) => (
                                                                    <tr key={i} className="border-b border-tactical-gray/10 hover:bg-white/5">
                                                                        <td className="py-1 text-tactical-light">{h.matchId}</td>
                                                                        <td className="py-1 text-white">{h.finishes}</td>
                                                                        {showDamage && <td className="py-1 text-white">{h.damage}</td>}
                                                                        <td className="py-1 text-yellow-500 font-bold">{h.impact.toFixed(0)}</td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>

                                                    {/* Quick Stats */}
                                                    <div className="w-64 border-l border-tactical-gray/30 pl-8 flex flex-col justify-center space-y-4">
                                                        <button 
                                                            onClick={(e) => { 
                                                                e.stopPropagation(); 
                                                                // If multiple teams, pick the last one or default
                                                                const targetTeam = player.teamName.includes('→') ? player.teamName.split('→').pop().trim() : player.teamName;
                                                                onPlayerClick?.(player, targetTeam); 
                                                            }}
                                                            className="flex items-center gap-2 text-xs font-bold uppercase text-white hover:text-tactical-red transition-colors"
                                                        >
                                                            <Target className="w-4 h-4" /> Full Profile
                                                        </button>
                                                        <div className="space-y-1">
                                                            <div className="flex justify-between text-xs text-tactical-light">
                                                                <span>Matches Played</span>
                                                                <span className="text-white">{player.matchesPlayed}</span>
                                                            </div>
                                                            <div className="flex justify-between text-xs text-tactical-light">
                                                                <span>Survival Avg</span>
                                                                <span className="text-white">{player.playTimeMinutes.toFixed(1)}m</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            );
                        })}
                    </tbody>
                </table>
            </div>
            <MobileScrollIndicator containerRef={tableScrollContainerRef} />
          </div>
        )}
    </div>
  );
};

export default React.memo(OperatorLeaderboard, (prevProps, nextProps) => prevProps.data === nextProps.data);
