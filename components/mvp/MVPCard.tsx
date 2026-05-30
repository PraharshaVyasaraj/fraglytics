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
  rank?: number;
}

export const MVPCard: React.FC<MVPCardProps> = ({ player, isPrimary = false, accentColor = '#00FF00', rank }) => {
  const displayRank = rank || (isPrimary ? 1 : 2);
  
  return (
    <div className={cn(
      "flex flex-col relative group transition-all duration-300 shrink-0",
      isPrimary ? "w-[380px] md:w-[400px] z-10" : "w-[260px] md:w-[280px]"
    )}>
      {/* Brutalist Border Container */}
      <div className={cn(
        "relative border-2 bg-black overflow-hidden flex flex-col",
        isPrimary ? "" : "border-white/20 shadow-[4px_4px_0px_0px_rgba(255,255,255,0.1)]"
      )} style={isPrimary ? { borderColor: accentColor, boxShadow: `8px 8px 0px 0px ${accentColor}4D` } : {}}>
        
        {/* Header Bar */}
        <div className={cn(
            "h-10 flex-shrink-0 flex items-center px-4 border-b-2",
            isPrimary ? "" : "bg-white/5 border-white/10 text-white/40"
        )} style={isPrimary ? { backgroundColor: accentColor, borderColor: accentColor, color: '#000' } : {}}>
            <div className="flex gap-1">
                {[1,2,3].map(i => (
                    <div key={i} className="w-1 h-4 bg-current opacity-40"></div>
                ))}
            </div>
            <div className="ml-3 font-mono text-[9px] uppercase tracking-[0.2em] font-black">
                {isPrimary ? "PRIORITY_OPERATOR_DETECTED" : "DATA_STREAM_ACTIVE"}
            </div>
            <div className="ml-auto font-mono text-[8px] opacity-50">
                {Math.random().toString(16).slice(2, 10).toUpperCase()}
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
                    "absolute bottom-0 left-1/2 -translate-x-1/2 object-contain",
                    isPrimary ? "h-[105%] w-auto" : "h-[90%] w-auto"
                )}
            />
            
            {/* Scanline Effect */}
            <div className="absolute inset-0 pointer-events-none opacity-10 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%]"></div>
        </div>

        {/* Player Name Section */}
        <div className={cn(
            "p-4 border-t-2 flex-shrink-0 flex items-center justify-between relative overflow-hidden",
            isPrimary ? "" : "bg-white border-white text-black"
        )} style={isPrimary ? { backgroundColor: accentColor, borderColor: accentColor, color: '#000' } : {}}>
            {/* Background Decorative Text */}
            <div className="absolute -right-4 -bottom-2 opacity-10 font-black text-4xl italic select-none pointer-events-none uppercase">
                {player.name}
            </div>
            
            <div className="w-full relative z-10">
                <p className="text-[8px] font-mono uppercase tracking-[0.4em] leading-none opacity-60 mb-1.5">OPERATOR_IDENTIFICATION</p>
                <h3 className="text-3xl font-black uppercase tracking-tighter leading-none italic truncate w-full group-hover:skew-x-2 transition-transform duration-75">
                    {player.name}
                </h3>
            </div>
            {isPrimary && <Star className="w-6 h-6 fill-black animate-pulse" />}
        </div>

        {/* Stats Section (List Style) */}
        <div className={cn(
            "p-2 flex-1 flex flex-col relative",
            isPrimary ? "bg-black" : "bg-black"
        )}>
            {/* Stat Visualization Bar */}
            <div className="px-3 py-2 mb-1 flex items-end gap-0.5 h-8">
                {[...Array(20)].map((_, i) => {
                    const height = 20 + Math.random() * 80;
                    return (
                        <motion.div 
                            key={i}
                            initial={{ height: 0 }}
                            animate={{ height: `${height}%` }}
                            transition={{ delay: i * 0.02, duration: 0.5 }}
                            className="flex-1"
                            style={{ backgroundColor: i < 12 ? accentColor : '#333', opacity: i < 12 ? 0.8 : 0.3 }}
                        />
                    );
                })}
            </div>

            <StatRow 
                label="IMPACT_RATING" 
                value={player.stats.mvpRating.toFixed(2)} 
                variant={isPrimary ? 'primary' : 'secondary'} 
                accentColor={accentColor}
                color="#fbbf24"
            />
            <StatRow 
                label="TOTAL_FINISHES" 
                value={player.stats.finishes} 
                variant={isPrimary ? 'primary' : 'secondary'} 
                accentColor={accentColor}
                color="#4ade80"
            />
            <StatRow 
                label="COMBAT_DAMAGE" 
                value={player.stats.damage.toLocaleString()} 
                variant={isPrimary ? 'primary' : 'secondary'} 
                accentColor={accentColor}
                color="#f87171"
            />
            <StatRow 
                label="SURVIVAL_TIME" 
                value={player.stats.avgSurvival} 
                variant={isPrimary ? 'primary' : 'secondary'} 
                accentColor={accentColor}
                color="#60a5fa"
            />
            <StatRow 
                label="KNOCKOUTS" 
                value={player.stats.knocks} 
                variant={isPrimary ? 'primary' : 'secondary'} 
                accentColor={accentColor}
                color="#a78bfa"
                isLast
            />
        </div>
      </div>

      {/* Decorative ID Number */}
      <div className="absolute -bottom-6 -right-2 font-mono text-7xl font-black opacity-[0.07] pointer-events-none select-none italic z-0">
          #{displayRank.toString().padStart(2, '0')}
      </div>
    </div>
  );
};
