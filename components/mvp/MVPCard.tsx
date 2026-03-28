import React from 'react';
import { cn } from '../../lib/utils';
import { StatRow } from './StatRow';

export interface MVPPlayer {
  id: string;
  name: string;
  teamName: string;
  teamLogo?: string;
  playerImage?: string;
  stats: {
    mvpRating: number;
    finishes: number;
    damage: number;
    avgSurvival: string;
    knocks: number;
  };
}

interface MVPCardProps {
  player: MVPPlayer;
  isPrimary?: boolean;
}

export const MVPCard: React.FC<MVPCardProps> = ({ player, isPrimary = false }) => {
  return (
    <div className={cn(
      "flex flex-col relative group transition-transform hover:-translate-y-1 duration-300",
      isPrimary ? "w-full md:w-[380px] z-10 shadow-2xl shadow-yellow-500/20" : "w-full md:w-[240px] shadow-lg"
    )}>
      {/* Image Section */}
      <div className={cn(
        "relative bg-gradient-to-b from-tactical-gray to-black aspect-[4/5] overflow-hidden border-2",
        isPrimary ? "border-yellow-500" : "border-tactical-gray"
      )}>
        {/* Team Logo Overlay */}
        <div className="absolute top-4 left-4 w-12 h-12 z-20 drop-shadow-md">
           {player.teamLogo ? (
             <img src={player.teamLogo} alt={player.teamName} className="w-full h-full object-contain" />
           ) : (
             <div className="w-full h-full bg-black/40 backdrop-blur-sm rounded-full flex items-center justify-center text-[10px] font-bold border border-white/10 text-white">
               {player.teamName.substring(0, 3)}
             </div>
           )}
        </div>

        {/* Player Image */}
        <img 
          src={player.playerImage || `https://api.dicebear.com/7.x/avataaars/svg?seed=${player.name}&clothing=graphicShirt&hair=shortHair&accessories=sunglasses`} 
          alt={player.name}
          className={cn(
            "absolute bottom-0 left-1/2 -translate-x-1/2 object-cover transition-transform duration-500 group-hover:scale-105",
            isPrimary ? "h-[110%] w-auto max-w-none" : "h-[90%] w-auto"
          )}
        />
        
        {/* Gradient Overlay for Text Readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none"></div>
      </div>

      {/* Player Name Bar */}
      <div className={cn(
        "py-3 px-4 text-center uppercase font-black tracking-wider text-xl truncate relative z-10",
        isPrimary ? "bg-yellow-500 text-black" : "bg-tactical-dark text-white border-x border-tactical-gray" 
      )}>
        {player.name}
      </div>

      {/* Stats Panel */}
      <div className={cn(
        "flex flex-col pt-2 pb-4",
        isPrimary ? "bg-[#F2C94C] text-black" : "bg-black/90 text-white border-x border-b border-tactical-gray"
      )}>
        <StatRow 
          label="MVP Rating" 
          value={player.stats.mvpRating.toFixed(2)} 
          variant={isPrimary ? 'primary' : 'secondary'} 
        />
        <StatRow 
          label="Finishes" 
          value={player.stats.finishes} 
          variant={isPrimary ? 'primary' : 'secondary'} 
        />
        <StatRow 
          label="Damage" 
          value={player.stats.damage} 
          variant={isPrimary ? 'primary' : 'secondary'} 
        />
        <StatRow 
          label="Avg. Surv." 
          value={player.stats.avgSurvival} 
          variant={isPrimary ? 'primary' : 'secondary'} 
        />
        <StatRow 
          label="Knocks" 
          value={player.stats.knocks} 
          variant={isPrimary ? 'primary' : 'secondary'} 
          isLast
        />
      </div>
    </div>
  );
};
