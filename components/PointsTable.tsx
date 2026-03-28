
import React, { useState, useRef, useEffect } from 'react';
import { TeamData, PlayerDerived } from '../types';
import { Trophy, Crosshair, LayoutGrid, Table as TableIcon, ChevronDown, ChevronUp, TrendingUp, TrendingDown, Minus, Copy, MessageSquare, MonitorPlay, Check, Download, Loader2 } from 'lucide-react';
import { toPng } from 'html-to-image';

interface PointsTableProps {
  data: TeamData[];
  onTeamClick?: (team: TeamData) => void;
  onPlayerClick?: (player: PlayerDerived) => void;
  onOpenStudio?: () => void;
}

const TrendIcon = ({ trend }: { trend: TeamData['trend'] }) => {
    if (trend === 'RISING') return <TrendingUp className="w-4 h-4 text-tactical-green" />;
    if (trend === 'FALLING') return <TrendingDown className="w-4 h-4 text-tactical-red" />;
    return <Minus className="w-4 h-4 text-tactical-gray" />;
};

const SquadCard: React.FC<{ team: TeamData; displayRank: number; onTeamClick?: (t: TeamData) => void; onPlayerClick?: (p: PlayerDerived) => void }> = ({ team, displayRank, onTeamClick, onPlayerClick }) => {
  return (
    <div className={`bg-tactical-dark rounded-sm border mb-4 overflow-hidden transition-all hover:border-tactical-light/50 ${displayRank === 1 ? 'border-tactical-white/40 shadow-lg shadow-white/5' : 'border-tactical-gray'}`}>
      {/* Header / Macro Stats */}
      <div className={`px-4 sm:px-6 py-3 sm:py-4 flex flex-col md:flex-row items-center gap-4 sm:gap-6 ${displayRank === 1 ? 'bg-white/5' : ''}`}>
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className={`w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center rounded-sm font-serif text-lg sm:text-xl font-bold ${displayRank === 1 ? 'bg-white text-black' : 'bg-tactical-gray/20 text-tactical-light'}`}>
            #{displayRank}
          </div>
          <div 
            onClick={() => onTeamClick?.(team)} 
            className="cursor-pointer group"
          >
            <h3 className="font-bold text-white text-lg flex items-center gap-3 group-hover:text-tactical-red transition-colors">
              {team.name}
              <div className="flex items-center gap-1" title={`Recent Trend: ${team.trend}`}>
                 <TrendIcon trend={team.trend} />
              </div>
            </h3>
            <div className="flex gap-2 text-xs font-mono mt-1">
              {team.flags.map(f => (
                  <span key={f} className="text-[9px] px-1.5 py-0.5 border rounded-sm uppercase tracking-wider bg-black/50 border-tactical-gray text-tactical-light">
                      {f}
                  </span>
              ))}
            </div>
            <div className="flex gap-3 text-xs font-mono text-tactical-light mt-2">
              <span className="flex items-center gap-1 text-white">
                <Crosshair className="w-3 h-3" /> {team.killPoints} KP
              </span>
              <span className="flex items-center gap-1">
                <Trophy className="w-3 h-3" /> {team.placementPoints} PP
              </span>
              <span className="flex items-center gap-1 opacity-70">
                L5 Avg: {team.rollingAvgPoints?.toFixed(1) || 0}
              </span>
            </div>
          </div>
        </div>

        {/* Aggression / Efficiency Index */}
        <div className="flex-1 w-full md:w-auto grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 px-0 sm:px-4 border-l-0 sm:border-l sm:border-r border-tactical-gray/30 my-2 sm:mx-4">
          <div className="flex flex-col justify-center gap-1">
            <div className="flex justify-between text-[10px] uppercase font-bold text-tactical-light tracking-wider">
                <span>Aggression</span>
                <span className="text-white">{team.aggressionIndex?.toFixed(0) || 0}</span>
            </div>
            <div className="h-1.5 bg-black rounded-full overflow-hidden flex">
                <div 
                    className="h-full bg-tactical-red transition-all duration-500" 
                    style={{ width: `${Math.min(100, team.aggressionIndex || 0)}%` }} 
                />
            </div>
          </div>
          <div className="flex flex-col justify-center gap-1">
            <div className="flex justify-between text-[10px] uppercase font-bold text-tactical-light tracking-wider">
                <span>Efficiency</span>
                <span className="text-white">{team.efficiencyRating?.toFixed(0) || 0}</span>
            </div>
            <div className="h-1.5 bg-black rounded-full overflow-hidden flex">
                <div 
                    className="h-full bg-tactical-green transition-all duration-500" 
                    style={{ width: `${Math.min(100, (team.efficiencyRating || 0) / 30 * 100)}%` }} 
                />
            </div>
          </div>
        </div>

        {/* Total Score */}
        <div className="text-right min-w-[60px] sm:min-w-[80px] w-full sm:w-auto flex sm:flex-col justify-between sm:justify-center items-center sm:items-end border-t sm:border-t-0 border-tactical-gray/30 pt-2 sm:pt-0">
          <span className="text-[10px] text-tactical-light uppercase tracking-widest sm:hidden">Total Points</span>
          <div>
            <span className="block text-xl sm:text-2xl font-bold font-mono text-white">{team.totalPoints}</span>
            <span className="hidden sm:block text-[10px] text-tactical-light uppercase tracking-widest text-right">PTS</span>
          </div>
        </div>
      </div>

      {/* Micro Stats / Player Grid */}
      <div className="border-t border-tactical-gray/50 p-4 bg-black/20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {team.players.map((player, idx) => (
            <PlayerStats key={idx} player={player} onClick={() => onPlayerClick?.(player)} />
          ))}
        </div>
      </div>
    </div>
  );
};

const PlayerStats: React.FC<{ player: PlayerDerived; onClick?: () => void }> = ({ player, onClick }) => {
  // Carry Colors
  let borderClass = 'border-tactical-gray';
  let badgeClass = '';
  let badgeText = '';

  if (player.carryClass === 'SYSTEM_COLLAPSE') {
      borderClass = 'border-tactical-red';
      badgeClass = 'bg-tactical-red text-white';
      badgeText = 'CRITICAL';
  } else if (player.carryClass === 'HARD_CARRY') {
      borderClass = 'border-white';
      badgeClass = 'bg-white text-black';
      badgeText = 'HARD CARRY';
  } else if (player.carryClass === 'PRIMARY') {
      borderClass = 'border-tactical-light';
  }

  // Z-Score Visuals
  const zVal = player.zScoreDamage;
  const zColor = zVal > 1.5 ? 'text-tactical-green' : zVal < -1 ? 'text-tactical-red' : 'text-tactical-light';

  return (
    <div 
        onClick={onClick}
        className={`p-3 rounded-sm border text-sm relative group transition-all bg-black ${borderClass} ${player.isOutlier ? 'opacity-50' : ''} cursor-pointer hover:bg-white/5`}
    >
      <div className="flex justify-between items-start mb-2">
        <span className="font-bold text-tactical-light truncate pr-2 group-hover:text-white transition-colors">{player.playerName}</span>
        {badgeText && (
            <span className={`absolute -top-2 -right-1 text-[9px] px-1.5 py-0.5 rounded-sm shadow-sm font-bold tracking-tighter ${badgeClass}`}>
                {badgeText}
            </span>
        )}
      </div>
      
      <div className="grid grid-cols-2 gap-y-1 gap-x-2 text-xs font-mono text-tactical-light">
        <div className="flex items-center justify-between">
            <span>DMG</span>
            <span className={`font-bold ${player.damage > 1500 ? 'text-white' : ''}`}>{player.damage.toLocaleString()}</span>
        </div>
        <div className="flex items-center justify-between">
            <span>KILLS</span>
            <span className={player.finishes > 3 ? 'text-white font-bold' : ''}>{player.finishes}</span>
        </div>
        <div className="flex items-center justify-between mt-1 pt-1 border-t border-tactical-gray/30">
            <span className="text-[10px] opacity-70">Z-SCR</span>
            <span className={`text-[10px] font-bold ${zColor}`}>{zVal > 0 ? '+' : ''}{zVal.toFixed(2)}σ</span>
        </div>
        <div className="flex items-center justify-between mt-1 pt-1 border-t border-tactical-gray/30">
            <span className="text-[10px] opacity-70">SHARE</span>
            <span className="text-[10px]">{player.damageShare.toFixed(0)}%</span>
        </div>
      </div>
    </div>
  );
};

// --- TABLE VIEW COMPONENTS ---

type SortKey = keyof TeamData | 'wwcd' | 'avgPts' | 'avgDmg' | 'displayRank' | 'rollingAvgPoints' | 'efficiencyRating';
type SortDirection = 'asc' | 'desc';

interface TableRowData extends TeamData {
  displayRank: number;
}

const StandingsTable: React.FC<{ data: TableRowData[]; onTeamClick?: (t: TeamData) => void }> = ({ data, onTeamClick }) => {
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: SortDirection }>({ key: 'displayRank', direction: 'asc' });

  const getWWCD = (team: TeamData) => team.history?.filter(h => h.rank === 1).length || 0;

  const sortedData = [...data].sort((a, b) => {
    let aValue: any;
    let bValue: any;

    switch (sortConfig.key) {
      case 'wwcd':
        aValue = getWWCD(a);
        bValue = getWWCD(b);
        break;
      case 'avgPts':
        aValue = a.totalPoints / (a.matchesPlayed || 1);
        bValue = b.totalPoints / (b.matchesPlayed || 1);
        break;
      case 'avgDmg':
        aValue = a.totalDamage / (a.matchesPlayed || 1);
        bValue = b.totalDamage / (b.matchesPlayed || 1);
        break;
      default:
        aValue = a[sortConfig.key as keyof TableRowData];
        bValue = b[sortConfig.key as keyof TableRowData];
    }

    if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  const handleSort = (key: SortKey) => {
    setSortConfig(current => ({
      key,
      direction: current.key === key && current.direction === 'desc' ? 'asc' : 'desc'
    }));
  };

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortConfig.key !== col) return <ChevronDown className="w-3 h-3 opacity-20 group-hover:opacity-50" />;
    return sortConfig.direction === 'asc' 
      ? <ChevronUp className="w-3 h-3 text-tactical-red" /> 
      : <ChevronDown className="w-3 h-3 text-tactical-red" />;
  };

  const HeaderCell = ({ label, sortKey, align = 'center', className = '' }: { label: string, sortKey: SortKey, align?: 'left'|'center'|'right', className?: string }) => (
    <th 
      className={`px-4 py-3 cursor-pointer group hover:bg-white/5 transition-colors uppercase font-bold text-[10px] tracking-wider text-tactical-light ${className}`}
      onClick={() => handleSort(sortKey)}
    >
      <div className={`flex items-center gap-1 ${align === 'center' ? 'justify-center' : align === 'right' ? 'justify-end' : 'justify-start'}`}>
        {label} <SortIcon col={sortKey} />
      </div>
    </th>
  );

  return (
    <div className="overflow-x-auto bg-tactical-dark border border-tactical-gray rounded-sm shadow-xl">
      <table className="w-full text-sm">
        <thead className="bg-black border-b border-tactical-gray">
          <tr>
            <HeaderCell label="Rank" sortKey="displayRank" align="left" className="w-16" />
            <HeaderCell label="Team" sortKey="name" align="left" />
            <HeaderCell label="Trend" sortKey="trend" />
            <HeaderCell label="M" sortKey="matchesPlayed" />
            <HeaderCell label="SDRR" sortKey="wwcd" />
            <HeaderCell label="Avg Pts (L5)" sortKey="rollingAvgPoints" className="hidden lg:table-cell" />
            <HeaderCell label="Place Pts" sortKey="placementPoints" />
            <HeaderCell label="Kill Pts" sortKey="killPoints" />
            <HeaderCell label="Total Pts" sortKey="totalPoints" className="text-white bg-white/5" />
            <HeaderCell label="Avg Dmg" sortKey="avgDmg" className="hidden md:table-cell" />
            <HeaderCell label="Eff. Rating" sortKey="efficiencyRating" className="hidden sm:table-cell" />
          </tr>
        </thead>
        <tbody className="divide-y divide-tactical-gray/20">
          {sortedData.map((team) => {
             const wwcd = getWWCD(team);
             return (
              <tr 
                key={team.name} 
                className="hover:bg-white/5 transition-colors font-mono cursor-pointer"
                onClick={() => onTeamClick?.(team)}
              >
                <td className="px-4 py-3 text-white font-bold">
                  <div className={`w-8 h-8 flex items-center justify-center rounded-sm ${team.displayRank <= 3 ? 'bg-tactical-red text-white' : 'bg-tactical-gray/30 text-tactical-light'}`}>
                    #{team.displayRank}
                  </div>
                </td>
                <td className="px-4 py-3">
                    <div className="font-bold text-white flex items-center gap-2">
                        {team.name}
                        {team.flags.includes("DOMINANT") && <span className="w-1.5 h-1.5 rounded-full bg-tactical-red animate-pulse" title="Dominant"></span>}
                    </div>
                </td>
                <td className="px-4 py-3 text-center"><div className="flex justify-center"><TrendIcon trend={team.trend} /></div></td>
                <td className="px-4 py-3 text-center text-tactical-light">{team.matchesPlayed}</td>
                <td className="px-4 py-3 text-center text-white font-bold">{wwcd > 0 ? wwcd : '-'}</td>
                <td className="px-4 py-3 text-center text-tactical-light hidden lg:table-cell">{team.rollingAvgPoints?.toFixed(1) || '-'}</td>
                <td className="px-4 py-3 text-center text-tactical-light font-bold text-white/80">{team.placementPoints}</td>
                <td className="px-4 py-3 text-center text-tactical-light">{team.killPoints}</td>
                <td className="px-4 py-3 text-center text-white font-black text-lg bg-white/5">{team.totalPoints}</td>
                <td className="px-4 py-3 text-center text-tactical-light hidden md:table-cell">{(team.totalDamage / (team.matchesPlayed || 1)).toFixed(0)}</td>
                <td className="px-4 py-3 text-center text-tactical-light hidden sm:table-cell">{team.efficiencyRating?.toFixed(0) || '-'}</td>
              </tr>
             );
          })}
        </tbody>
      </table>
    </div>
  );
};


const PointsTable: React.FC<PointsTableProps> = ({ data, onTeamClick, onPlayerClick, onOpenStudio }) => {
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('table');

  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setViewMode('cards');
    }
  }, []);
  const tableRef = useRef<HTMLDivElement>(null);
  const [copyStatus, setCopyStatus] = useState<'idle' | 'discord' | 'whatsapp' | 'snapshot'>('idle');
  const [isSnapshotting, setIsSnapshotting] = useState(false);

  if (!data || data.length === 0) return null;

  // Augment data with displayRank (based on original sorted order from props)
  const processedData: TableRowData[] = data.map((team, index) => ({
    ...team,
    displayRank: index + 1
  }));

  // --- ACTIONS ---
  
  const handleDiscordCopy = () => {
    // Generate text table
    const header = `RANK   TEAM                PTS    PLACE  KILLS   SDRR`;
    const rows = processedData.map(t => {
        const rank = `#${t.displayRank}`.padEnd(7);
        const team = t.name.length > 18 ? t.name.substring(0, 16) + '..' : t.name.padEnd(20);
        const pts = t.totalPoints.toString().padEnd(7);
        const place = t.placementPoints.toString().padEnd(7);
        const kills = t.totalFinishes.toString().padEnd(8);
        const wwcd = t.history?.filter(h => h.rank === 1).length.toString() || '0';
        return `${rank}${team}${pts}${place}${kills}${wwcd}`;
    });
    const content = `\`\`\`\n${header}\n${rows.join('\n')}\n\`\`\``;
    
    navigator.clipboard.writeText(content);
    setCopyStatus('discord');
    setTimeout(() => setCopyStatus('idle'), 2000);
  };

  const handleWhatsAppCopy = () => {
    const rows = processedData.slice(0, 15).map(t => { // Top 15 usually for WA
        const emoji = t.displayRank === 1 ? '🥇' : t.displayRank === 2 ? '🥈' : t.displayRank === 3 ? '🥉' : `#${t.displayRank}`;
        const wwcd = t.history?.filter(h => h.rank === 1).length || 0;
        const wwcdStr = wwcd > 0 ? ` [${wwcd} SDRR]` : '';
        return `*${emoji} ${t.name}* - ${t.totalPoints} pts (${t.placementPoints} Place, ${t.totalFinishes} Kills)${wwcdStr}`;
    });
    const content = `*TOURNAMENT STANDINGS*\n\n${rows.join('\n')}\n\n_Generated by ScarFall Analytics_`;
    
    navigator.clipboard.writeText(content);
    setCopyStatus('whatsapp');
    setTimeout(() => setCopyStatus('idle'), 2000);
  };

  const handleDirectDownload = async () => {
      if (!tableRef.current) return;
      setIsSnapshotting(true);
      try {
          const dataUrl = await toPng(tableRef.current, { backgroundColor: '#0E0E0E', pixelRatio: 2 });
          const link = document.createElement('a');
          link.download = `scarfall_standings_${Date.now()}.png`;
          link.href = dataUrl;
          link.click();
          setCopyStatus('snapshot');
          setTimeout(() => setCopyStatus('idle'), 2000);
      } catch (e) {
          console.error(e);
      } finally {
          setIsSnapshotting(false);
      }
  };

  return (
    <div className="space-y-6 bg-tactical-black p-4 sm:p-6 rounded-lg">
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 border-b border-tactical-gray pb-4">
        <div>
          <h2 className="font-serif text-lg font-bold text-white flex items-center gap-2">
             <Trophy className="w-5 h-5 text-yellow-500" /> Tournament Standings
          </h2>
          <p className="text-xs font-mono text-tactical-light mt-1">
            {data.length} SQUADS // LIVE AGGREGATION
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
             {/* Social Bridge */}
             <div className="flex items-center bg-black/50 border border-tactical-gray/50 rounded-sm p-1">
                 <button 
                    onClick={handleDiscordCopy}
                    className="flex items-center gap-1 px-2 py-1 text-[10px] font-bold uppercase hover:bg-white/10 rounded-sm transition-colors text-indigo-400"
                    title="Copy for Discord (Code Block)"
                 >
                    {copyStatus === 'discord' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />} Discord
                 </button>
                 <div className="w-px h-3 bg-tactical-gray mx-1"></div>
                 <button 
                    onClick={handleWhatsAppCopy}
                    className="flex items-center gap-1 px-2 py-1 text-[10px] font-bold uppercase hover:bg-white/10 rounded-sm transition-colors text-green-400"
                    title="Copy for WhatsApp (Formatted)"
                 >
                    {copyStatus === 'whatsapp' ? <Check className="w-3 h-3" /> : <MessageSquare className="w-3 h-3" />} WA
                 </button>
                 <div className="w-px h-3 bg-tactical-gray mx-1"></div>
                 <button 
                    onClick={onOpenStudio}
                    className="flex items-center gap-1 px-2 py-1 text-[10px] font-bold uppercase hover:bg-white/10 rounded-sm transition-colors text-white"
                    title="Open in Broadcast Studio"
                 >
                    <MonitorPlay className="w-3 h-3" /> Studio
                 </button>
                 <div className="w-px h-3 bg-tactical-gray mx-1"></div>
                 <button 
                    onClick={handleDirectDownload}
                    disabled={isSnapshotting}
                    className="flex items-center gap-1 px-2 py-1 text-[10px] font-bold uppercase hover:bg-white/10 rounded-sm transition-colors text-white"
                    title="Download PNG Snapshot"
                 >
                    {isSnapshotting ? <Loader2 className="w-3 h-3 animate-spin"/> : copyStatus === 'snapshot' ? <Check className="w-3 h-3 text-green-500" /> : <Download className="w-3 h-3" />}
                 </button>
             </div>

            <div className="flex bg-black p-1 rounded-sm border border-tactical-gray">
                <button 
                    onClick={() => setViewMode('table')}
                    className={`flex items-center gap-2 px-3 py-1.5 text-xs font-bold uppercase rounded-sm transition-all ${viewMode === 'table' ? 'bg-tactical-white text-black shadow-sm' : 'text-tactical-light hover:text-white'}`}
                >
                    <TableIcon className="w-3 h-3" /> Table View
                </button>
                <button 
                    onClick={() => setViewMode('cards')}
                    className={`flex items-center gap-2 px-3 py-1.5 text-xs font-bold uppercase rounded-sm transition-all ${viewMode === 'cards' ? 'bg-tactical-white text-black shadow-sm' : 'text-tactical-light hover:text-white'}`}
                >
                    <LayoutGrid className="w-3 h-3" /> Detailed Cards
                </button>
            </div>
        </div>
      </div>
      
      <div id="points-table" className="animate-in fade-in duration-500 p-2 bg-tactical-black" ref={tableRef}>
        {viewMode === 'table' ? (
           <StandingsTable data={processedData} onTeamClick={onTeamClick} />
        ) : (
          <div className="space-y-4">
            {processedData.map((team) => (
              <SquadCard 
                key={team.name} 
                team={team} 
                displayRank={team.displayRank} 
                onTeamClick={onTeamClick}
                onPlayerClick={onPlayerClick}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PointsTable;
