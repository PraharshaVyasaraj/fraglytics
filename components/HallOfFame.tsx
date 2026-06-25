
import React, { useMemo, useRef, useState } from 'react';
import { TeamData, PlayerDerived } from '../types';
import { getGlobalPlayerRegistry } from '../services/analyticsEngine';
import { Crown, Skull, HeartPulse, Zap, Sword, MonitorPlay, Download, Loader2, Check } from 'lucide-react';
import { toPng } from 'html-to-image';

interface HallOfFameProps {
  data: TeamData[];
  onPlayerClick?: (player: PlayerDerived, teamName: string) => void;
  onOpenStudio?: () => void;
}

const AwardCard: React.FC<{ 
  title: string, 
  subtitle: string, 
  player: PlayerDerived, 
  teamName: string, 
  icon: React.ReactNode, 
  color: string,
  statLabel: string,
  statValue: string | number,
  onClick?: () => void
}> = ({ title, subtitle, player, teamName, icon, color, statLabel, statValue, onClick }) => (
  <div 
    onClick={onClick}
    className={`relative overflow-hidden bg-tactical-dark border border-tactical-gray rounded-sm p-4 group hover:border-${color} transition-all cursor-pointer hover:-translate-y-1 shadow-lg hover:shadow-${color}/10`}
  >
    <div className={`absolute -right-4 -top-4 w-24 h-24 bg-${color} rounded-full opacity-5 blur-2xl group-hover:opacity-10 transition-opacity`}></div>
    
    <div className="flex items-start justify-between mb-3 relative z-10">
      <div>
        <h4 className={`text-sm font-bold uppercase tracking-widest text-${color}`}>{title}</h4>
        <p className="text-[10px] text-tactical-light font-mono">{subtitle}</p>
      </div>
      <div className={`p-2 rounded-full bg-${color}/10 text-${color}`}>
        {icon}
      </div>
    </div>
    
    <div className="relative z-10">
      <div className="text-xl font-bold text-white truncate">{player.playerName}</div>
      <div className="text-xs text-tactical-light font-mono mb-3 truncate" title={teamName}>{teamName}</div>
      
      <div className="flex items-center gap-2 pt-2 border-t border-white/5">
        <span className="text-[10px] uppercase font-bold text-tactical-light">{statLabel}</span>
        <span className="text-sm font-mono font-bold text-white">{statValue}</span>
      </div>
    </div>
  </div>
);

const HallOfFame: React.FC<HallOfFameProps> = ({ data, onPlayerClick, onOpenStudio }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isSnapshotting, setIsSnapshotting] = useState(false);
  const [snapDone, setSnapDone] = useState(false);

  const awards = useMemo(() => {
    if (!data.length) return null;
    
    // Get unique players with accumulated stats
    const allPlayers = getGlobalPlayerRegistry(data);

    // 1. The Warlord (Most Kills)
    const warlord = [...allPlayers].sort((a, b) => b.finishes - a.finishes)[0];
    
    // 2. The Heavy (Highest Damage)
    const heavy = [...allPlayers].sort((a, b) => b.damage - a.damage)[0];
    
    // 3. The Survivor (Highest Avg Survival)
    const survivor = [...allPlayers].sort((a, b) => b.playTimeMinutes - a.playTimeMinutes)[0];
    
    // 4. The Carry (Highest Damage Share)
    const carry = [...allPlayers].sort((a, b) => b.damageShare - a.damageShare)[0];

    return { warlord, heavy, survivor, carry };
  }, [data]);

  const handleDownload = async () => {
      if (!containerRef.current) return;
      setIsSnapshotting(true);
      try {
          const dataUrl = await toPng(containerRef.current, { backgroundColor: '#0E0E0E', pixelRatio: 2 });
          const gamePrefix = localStorage.getItem('fraglab_game_mode') === 'bgmi' ? 'bgmi' : 'scarfall';
          const link = document.createElement('a');
          link.download = `${gamePrefix}_hall_of_fame_${Date.now()}.png`;
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

  if (!awards) return null;

  return (
    <div className="mb-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
       <div className="flex items-center justify-between mb-4">
           <div className="flex items-center gap-3">
               <Crown className="w-5 h-5 text-yellow-500" />
               <h3 className="font-serif text-lg font-bold text-white">Hall of Fame</h3>
           </div>
           <div className="flex items-center gap-2">
                <button 
                    onClick={onOpenStudio}
                    className="p-1.5 text-tactical-light hover:text-white hover:bg-white/10 rounded-sm transition-colors"
                    title="Open in Broadcast Studio"
                >
                    <MonitorPlay className="w-4 h-4" />
                </button>
                <button 
                    onClick={handleDownload}
                    disabled={isSnapshotting}
                    className="p-1.5 text-tactical-light hover:text-white hover:bg-white/10 rounded-sm transition-colors"
                    title="Download PNG"
                >
                    {isSnapshotting ? <Loader2 className="w-4 h-4 animate-spin"/> : snapDone ? <Check className="w-4 h-4 text-green-500"/> : <Download className="w-4 h-4" />}
                </button>
           </div>
       </div>
       
       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-2 sm:p-4 rounded-lg" ref={containerRef}>
          {awards.warlord && (
             <AwardCard 
               title="The Warlord"
               subtitle="Highest Kill Count"
               player={awards.warlord}
               teamName={awards.warlord.teamName}
               icon={<Skull className="w-4 h-4" />}
               color="tactical-red"
               statLabel="CONFIRMED KILLS"
               statValue={awards.warlord.finishes}
               onClick={() => onPlayerClick?.(awards.warlord, awards.warlord.teamName.split('→').pop()?.trim() || awards.warlord.teamName)}
             />
          )}
          {awards.heavy && (
             <AwardCard 
               title="The Heavy"
               subtitle="Maximum Damage Output"
               player={awards.heavy}
               teamName={awards.heavy.teamName}
               icon={<Sword className="w-4 h-4" />}
               color="white"
               statLabel="TOTAL DAMAGE"
               statValue={awards.heavy.damage.toLocaleString()}
               onClick={() => onPlayerClick?.(awards.heavy, awards.heavy.teamName.split('→').pop()?.trim() || awards.heavy.teamName)}
             />
          )}
           {awards.survivor && (
             <AwardCard 
               title="The Survivor"
               subtitle="Longevity Expert"
               player={awards.survivor}
               teamName={awards.survivor.teamName}
               icon={<HeartPulse className="w-4 h-4" />}
               color="tactical-green"
               statLabel="AVG SURVIVAL"
               statValue={`${awards.survivor.playTimeMinutes.toFixed(1)}m`}
               onClick={() => onPlayerClick?.(awards.survivor, awards.survivor.teamName.split('→').pop()?.trim() || awards.survivor.teamName)}
             />
          )}
          {awards.carry && (
             <AwardCard 
               title="The Backpack"
               subtitle="Team Damage Share"
               player={awards.carry}
               teamName={awards.carry.teamName}
               icon={<Zap className="w-4 h-4" />}
               color="yellow-500"
               statLabel="DAMAGE SHARE"
               statValue={`${awards.carry.damageShare.toFixed(1)}%`}
               onClick={() => onPlayerClick?.(awards.carry, awards.carry.teamName.split('→').pop()?.trim() || awards.carry.teamName)}
             />
          )}
       </div>
    </div>
  );
};

export default HallOfFame;
