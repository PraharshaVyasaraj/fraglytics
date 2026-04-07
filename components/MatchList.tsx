
import React from 'react';
import { MatchData } from '../types';
import { Trophy, Skull, Calendar, ChevronRight, Sword, Crosshair, Activity, Zap, BarChart2 } from 'lucide-react';

interface MatchListProps {
  matches: MatchData[];
  onMatchClick: (matchId: string) => void;
  activeMatchId?: string;
}

const MatchList: React.FC<MatchListProps> = ({ matches, onMatchClick, activeMatchId }) => {
  if (!matches || matches.length === 0) return null;

  // Pre-calculate highlights for all matches to avoid expensive operations during render
  const matchHighlights = React.useMemo(() => {
    return matches.map(match => {
      const winner = match.teams.find(t => t.rank === 1);
      const topFragger = match.teams.flatMap(t => t.players).sort((a,b) => b.kills - a.kills)[0];
      const totalKills = match.teams.reduce((acc, t) => acc + t.totalKills, 0);
      const totalDamage = match.teams.reduce((acc, t) => acc + t.totalDamage, 0);
      
      return {
        id: match.id,
        day: match.day,
        matchInDay: match.matchInDay,
        winner,
        topFragger,
        totalKills,
        totalDamage
      };
    });
  }, [matches]);

  return (
    <div className="mb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-serif text-lg font-bold text-white flex items-center gap-3 uppercase tracking-widest">
            <div className="p-2 bg-white/5 border border-white/10 rounded-sm">
                <Sword className="w-4 h-4 text-white" />
            </div>
            Operation Log <span className="text-white/30 text-sm ml-2 font-mono hidden sm:inline-block">({matches.length} MATCHES)</span>
        </h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {matchHighlights.map((highlight) => {
          const isActive = activeMatchId === highlight.id;

          return (
            <div 
                key={highlight.id}
                onClick={() => onMatchClick(highlight.id)}
                className={`group relative overflow-hidden rounded-sm cursor-pointer transition-all duration-300
                    ${isActive 
                        ? 'bg-[#18181B] shadow-2xl ring-1 ring-blue-500/50' 
                        : 'bg-[#0A0A0A] border border-white/5 hover:bg-[#121212] hover:border-white/10'
                    }
                `}
            >
                {/* Active Strip */}
                {isActive && <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>}

                {/* Content */}
                <div className="p-4 flex flex-col h-full relative z-10">
                    
                    {/* Header: Match ID & Day */}
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <div className="text-[9px] font-bold text-white/40 uppercase tracking-widest mb-0.5">
                                Day {highlight.day}
                            </div>
                            <div className={`text-2xl font-black font-mono leading-none ${isActive ? 'text-white' : 'text-white/80 group-hover:text-white'}`}>
                                M{highlight.matchInDay}
                            </div>
                        </div>
                        {isActive ? (
                            <div className="p-1.5 bg-blue-500/10 rounded-full text-blue-400 animate-pulse">
                                <Activity className="w-3.5 h-3.5" />
                            </div>
                        ) : (
                            <div className="p-1.5 bg-white/5 rounded-full text-white/20 group-hover:text-white/50 transition-colors">
                                <BarChart2 className="w-3.5 h-3.5" />
                            </div>
                        )}
                    </div>

                    {/* Stats Rows - Minimalist */}
                    <div className="space-y-2 mb-4">
                        {/* Winner */}
                        <div className="flex items-center gap-2">
                            <Trophy className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                            <div className="overflow-hidden">
                                <div className="text-[8px] uppercase font-bold text-white/30 leading-none mb-0.5">Victor</div>
                                <div className="text-xs font-bold text-white truncate">{highlight.winner?.teamName || '-'}</div>
                            </div>
                            {highlight.winner && <div className="ml-auto text-[10px] font-mono font-bold text-cyan-400/80">{highlight.winner.totalPoints} pts</div>}
                        </div>

                        {/* MVP */}
                        <div className="flex items-center gap-2">
                            <Zap className="w-3.5 h-3.5 text-violet-400 shrink-0" />
                            <div className="overflow-hidden">
                                <div className="text-[8px] uppercase font-bold text-white/30 leading-none mb-0.5">MVP</div>
                                <div className="text-xs font-bold text-white truncate">{highlight.topFragger?.playerName || '-'}</div>
                            </div>
                            {highlight.topFragger && <div className="ml-auto text-[10px] font-mono font-bold text-violet-400/80">{highlight.topFragger.finishes} K</div>}
                        </div>
                    </div>
                    
                    {/* Footer: Subtle Metrics */}
                    <div className="mt-auto pt-3 border-t border-white/5 flex justify-between items-center text-[9px] font-mono text-white/40">
                        <div className="flex items-center gap-1.5">
                            <Skull className="w-3 h-3" />
                            <span>{highlight.totalKills} Elims</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <Crosshair className="w-3 h-3" />
                            <span>{(highlight.totalDamage/1000).toFixed(1)}k Dmg</span>
                        </div>
                    </div>
                </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MatchList;
