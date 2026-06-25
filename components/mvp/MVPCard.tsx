import React from 'react';
import { cn } from '../../lib/utils';
import { StatRow } from './StatRow';
import { motion } from 'motion/react';
import { Star, Eye, Shield, Target, Award, Cpu, Sparkles } from 'lucide-react';

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
  gameMode?: 'bgmi' | 'scarfall';
}

export const MVPCard: React.FC<MVPCardProps> = ({ 
  player, 
  isPrimary = false, 
  accentColor = '#00FF00', 
  rank,
  gameMode = 'scarfall'
}) => {
  const displayRank = rank || (isPrimary ? 1 : 2);
  const isBgmi = gameMode === 'bgmi';

  // Calculate dynamic grades for decorative elements
  const performanceGrade = player.stats.mvpRating > 300 ? 'S+' : player.stats.mvpRating > 200 ? 'S' : 'A';

  return (
    <div className={cn(
      "flex flex-col relative shrink-0 transition-transform duration-500 ease-out select-none",
      isPrimary 
        ? "w-[390px] md:w-[410px] z-10 hover:scale-[1.02]" 
        : "w-[270px] md:w-[290px] opacity-90 hover:opacity-100 hover:scale-[1.03] hover:z-20"
    )}>
      {/* Outer Halo/Glow ring */}
      {isPrimary && (
        <div 
          className="absolute -inset-1.5 opacity-50 rounded-none blur-xl animate-pulse -z-10"
          style={{
            background: `linear-gradient(135deg, ${accentColor}, #000000, ${accentColor})`
          }}
        />
      )}

      {/* Cybernetic Container using beautiful styles */}
      <div 
        className={cn(
          "relative bg-[#07070d] overflow-hidden flex flex-col border",
          isPrimary ? "border-2 shadow-[0_0_25px_rgba(0,0,0,0.8)]" : "border-white/10"
        )} 
        style={{ 
          borderColor: isPrimary ? accentColor : 'rgba(255,255,255,0.15)',
          clipPath: 'polygon(0px 0px, calc(100% - 20px) 0px, 100% 20px, 100% 100%, 20px 100%, 0% calc(100% - 20px))'
        }}
      >
        {/* Dynamic Scanline Overlay */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,6px_100%]" />

        {/* Diagonal Tech Background Grid */}
        <div 
          className="absolute inset-0 pointer-events-none opacity-[0.02]"
          style={{
            backgroundImage: `radial-gradient(${accentColor} 1px, transparent 1px)`,
            backgroundSize: '16px 16px'
          }}
        />

        {/* Top Header Bar */}
        <div 
          className="h-10 flex-shrink-0 flex items-center px-4 border-b relative overflow-hidden"
          style={{ 
            backgroundColor: isPrimary ? `${accentColor}1A` : 'rgba(255,255,255,0.02)',
            borderColor: isPrimary ? `${accentColor}40` : 'rgba(255,255,255,0.08)'
          }}
        >
          {/* Accent block */}
          <div 
            className="w-1.5 h-4 mr-2"
            style={{ backgroundColor: accentColor }}
          />
          
          <div className="font-mono text-[9px] uppercase tracking-[0.25em] font-black flex items-center gap-2" style={{ color: isPrimary ? '#ffffff' : 'rgba(255,255,255,0.5)' }}>
            <Cpu className="w-3 h-3 text-cyan-400 animate-spin" style={{ animationDuration: '6s' }} />
            <span>{isPrimary ? "SUPREME_MVP_GRID" : "TACTICAL_PROFILES"}</span>
          </div>

          <div className="ml-auto font-mono text-[8px] opacity-40 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
            <span>SYS_ONLINE: {displayRank.toString().padStart(2, '0')}</span>
          </div>
        </div>

        {/* Player Identity and Team Plate (No avatar images) */}
        <div className="p-4 bg-gradient-to-b from-[#0a0a14] to-[#040408] border-b border-white/5 relative overflow-hidden">
          {/* S+ Grade Hologram Badge */}
          <div className="absolute top-4 right-4 z-20">
            <div 
              className="px-2 py-0.5 font-mono text-[9px] font-black uppercase flex items-center gap-1 border backdrop-blur-md shadow-lg"
              style={{ 
                borderColor: `${accentColor}40`,
                backgroundColor: 'rgba(0,0,0,0.8)',
                color: accentColor
              }}
            >
              <Sparkles className="w-2.5 h-2.5 animate-pulse" />
              <span>GRADE {performanceGrade}</span>
            </div>
          </div>

          {/* Team Brand Badge */}
          <div className="flex items-center gap-3 mb-4">
            <div 
              className="w-10 h-10 border flex items-center justify-center bg-black/90 backdrop-blur-md shadow-md"
              style={{ borderColor: isPrimary ? accentColor : 'rgba(255,255,255,0.15)' }}
            >
              {player.teamLogo ? (
                <img src={player.teamLogo} alt={player.teamName} className="w-8 h-8 object-contain p-1" />
              ) : (
                <div 
                  className="font-mono text-sm font-black text-white"
                  style={{ textShadow: `0 0 10px ${accentColor}` }}
                >
                  {player.teamName.substring(0, 2).toUpperCase()}
                </div>
              )}
            </div>

            <div className="flex flex-col justify-center">
              <span className="text-[7px] font-mono text-white/40 tracking-wider uppercase leading-none">TEAM</span>
              <span className="text-xs font-black text-white uppercase tracking-tight leading-none mt-0.5 truncate max-w-[120px]">{player.teamName}</span>
            </div>
          </div>

          {/* Character Title / Identification Name */}
          <div className="relative z-10 pt-1">
            <p className="text-[7.5px] font-mono text-cyan-400 uppercase tracking-[0.4em] leading-none mb-1.5 font-bold">OPERATOR_IDENTITY</p>
            <div className="flex items-end justify-between">
              <h3 
                className="text-4xl font-black uppercase tracking-tighter leading-none italic truncate font-sans text-white"
                style={{ textShadow: isPrimary ? `0px 0px 15px ${accentColor}40` : 'none' }}
              >
                {player.name}
              </h3>
              {isPrimary ? (
                <div className="ml-2 w-6 h-6 rounded-full flex items-center justify-center bg-black/90 border shrink-0 mb-0.5" style={{ borderColor: accentColor }}>
                  <Star className="w-3.5 h-3.5 fill-white text-white animate-pulse" style={{ color: accentColor }} />
                </div>
              ) : (
                <span className="font-mono text-xs font-black text-white/30 italic">#{displayRank}</span>
              )}
            </div>
          </div>
        </div>

        {/* Rountine Statistics Stack */}
        <div className="p-3 bg-black flex-1 flex flex-col relative gap-1">
          {/* Real-time Telemetry Equalizer Visualizer */}
          <div className="px-2 py-1.5 mb-2 flex items-end gap-0.5 h-6 bg-[#0c0c16]/50 border border-white/5 rounded-sm overflow-hidden">
            {[...Array(24)].map((_, i) => {
              const staticHeight = 15 + (Math.sin(i * 0.8) + 1.2) * 35 + Math.random() * 15;
              return (
                <div 
                  key={i}
                  className="flex-1 transition-all duration-300"
                  style={{ 
                    height: `${staticHeight}%`,
                    backgroundColor: i < 14 ? accentColor : 'rgba(255,255,255,0.1)',
                    opacity: i < 14 ? 0.85 : 0.25 
                  }}
                />
              );
            })}
          </div>

          <StatRow 
            label="IMPACT_RATING" 
            value={player.stats.mvpRating.toFixed(2)} 
            variant="primary"
            accentColor={accentColor}
            color="#fbbf24"
          />
          <StatRow 
            label={isBgmi ? "FINISHES" : "KILLS"} 
            value={player.stats.finishes} 
            variant="secondary"
            accentColor={accentColor}
            color="#4ade80"
          />
          {!isBgmi && (
            <>
              <StatRow 
                label="DAMAGE" 
                value={player.stats.damage.toLocaleString()} 
                variant="secondary"
                accentColor={accentColor}
                color="#f87171"
              />
              <StatRow 
                label="SURVIVAL" 
                value={player.stats.avgSurvival} 
                variant="secondary"
                accentColor={accentColor}
                color="#60a5fa"
                isLast
              />
            </>
          )}
        </div>
      </div>

      {/* Decorative Ghost Background Index Number */}
      <div 
        className="absolute -bottom-6 -right-3 font-mono text-8xl font-black opacity-[0.06] pointer-events-none select-none italic z-0"
        style={{ color: accentColor }}
      >
        #{displayRank.toString().padStart(2, '0')}
      </div>
    </div>
  );
};
