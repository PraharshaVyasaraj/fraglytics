import React from 'react';
import { cn } from '../../lib/utils';
import { StatRow } from './StatRow';
import { motion } from 'motion/react';
import { Star } from 'lucide-react';

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
  accentColor?: string;
}

export const MVPCard: React.FC<MVPCardProps> = ({ player, isPrimary = false, accentColor = '#00FF00' }) => {
  return (
    <div className={cn(
      "flex flex-col relative group transition-all duration-300",
      isPrimary ? "w-full md:w-[420px] z-10" : "w-full md:w-[280px]"
    )}>
      {/* Brutalist Border Container */}
      <div className={cn(
        "relative border-2 bg-black overflow-hidden",
        isPrimary ? "" : "border-white/20 shadow-[4px_4px_0px_0px_rgba(255,255,255,0.1)]"
      )} style={isPrimary ? { borderColor: accentColor, boxShadow: `8px 8px 0px 0px ${accentColor}4D` } : {}}>
        
        {/* Header Bar */}
        <div className={cn(
            "h-8 flex items-center px-3 border-b-2",
            isPrimary ? "" : "bg-white/10 border-white/20 text-white/40"
        )} style={isPrimary ? { backgroundColor: accentColor, borderColor: accentColor, color: '#000' } : {}}>
            <div className="flex gap-1.5">
                <div className="w-2 h-2 rounded-full bg-current opacity-30"></div>
                <div className="w-2 h-2 rounded-full bg-current opacity-30"></div>
                <div className="w-2 h-2 rounded-full bg-current opacity-30"></div>
            </div>
            <div className="ml-auto font-mono text-[10px] uppercase tracking-widest font-bold">
                {isPrimary ? "ELITE_STATUS" : "OPERATOR_DATA"}
            </div>
        </div>

        {/* Image Section */}
        <div className="relative aspect-[4/5] overflow-hidden bg-[#0a0a0a]">
            {/* Team Info Overlay */}
            <div className="absolute top-4 left-4 z-20 flex items-center gap-3">
                <div className={cn(
                    "w-10 h-10 border-2 flex items-center justify-center bg-black/80 backdrop-blur-md",
                    isPrimary ? "" : "border-white/20"
                )} style={isPrimary ? { borderColor: accentColor } : {}}>
                    {player.teamLogo ? (
                        <img src={player.teamLogo} alt={player.teamName} className="w-full h-full object-contain p-1" />
                    ) : (
                        <span className="text-xs font-black text-white">{player.teamName.substring(0, 2)}</span>
                    )}
                </div>
                <div className="bg-black/80 backdrop-blur-md px-2 py-1 border border-white/10">
                    <p className="text-[10px] font-mono text-white/60 uppercase leading-none mb-0.5">TEAM</p>
                    <p className="text-xs font-black text-white leading-none uppercase">{player.teamName}</p>
                </div>
            </div>

            {/* Player Image */}
            <motion.img 
                whileHover={{ scale: 1.05 }}
                src={player.playerImage || `https://api.dicebear.com/7.x/avataaars/svg?seed=${player.name}&clothing=graphicShirt&hair=shortHair&accessories=sunglasses`} 
                alt={player.name}
                className={cn(
                    "absolute bottom-0 left-1/2 -translate-x-1/2 object-cover",
                    isPrimary ? "h-[110%] w-auto max-w-none" : "h-[95%] w-auto"
                )}
            />
            
            {/* Scanline Effect */}
            <div className="absolute inset-0 pointer-events-none opacity-10 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%]"></div>
        </div>

        {/* Player Name Section */}
        <div className={cn(
            "p-4 border-t-2 flex items-center justify-between",
            isPrimary ? "" : "bg-white border-white text-black"
        )} style={isPrimary ? { backgroundColor: accentColor, borderColor: accentColor, color: '#000' } : {}}>
            <div>
                <p className="text-[10px] font-mono uppercase tracking-widest leading-none opacity-60 mb-1">OPERATOR_ID</p>
                <h3 className="text-2xl font-black uppercase tracking-tighter leading-none italic">{player.name}</h3>
            </div>
            {isPrimary && <Star className="w-6 h-6 fill-black" />}
        </div>

        {/* Stats Section */}
        <div className="bg-black p-4 space-y-2">
            <StatRow 
                label="MVP_RATING" 
                value={player.stats.mvpRating.toFixed(2)} 
                variant={isPrimary ? 'primary' : 'secondary'} 
                accentColor={accentColor}
            />
            <div className="grid grid-cols-2 gap-2">
                <StatRow 
                    label="KILLS" 
                    value={player.stats.finishes} 
                    variant={isPrimary ? 'primary' : 'secondary'} 
                    accentColor={accentColor}
                />
                <StatRow 
                    label="DAMAGE" 
                    value={player.stats.damage} 
                    variant={isPrimary ? 'primary' : 'secondary'} 
                    accentColor={accentColor}
                />
            </div>
            <div className="grid grid-cols-2 gap-2">
                <StatRow 
                    label="SURVIVAL" 
                    value={player.stats.avgSurvival} 
                    variant={isPrimary ? 'primary' : 'secondary'} 
                    accentColor={accentColor}
                />
                <StatRow 
                    label="KNOCKS" 
                    value={player.stats.knocks} 
                    variant={isPrimary ? 'primary' : 'secondary'} 
                    accentColor={accentColor}
                    isLast
                />
            </div>
        </div>
      </div>

      {/* Decorative ID Number */}
      <div className="absolute -bottom-4 -right-4 font-mono text-6xl font-black opacity-10 pointer-events-none select-none italic">
          #{isPrimary ? "01" : "0" + (Math.floor(Math.random() * 8) + 2)}
      </div>
    </div>
  );
};
