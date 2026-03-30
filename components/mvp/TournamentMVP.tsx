import React, { useMemo, useState } from 'react';
import { MVPCard, MVPPlayer } from './MVPCard';
import { Trophy, Star, Zap, Medal, ChevronLeft, ChevronRight, Play, Grid } from 'lucide-react';
import { TeamData, BrandingConfig } from '../../types';
import { ASSETS } from '../../assets';
import { motion, AnimatePresence } from 'motion/react';

interface TournamentMVPProps {
  data: TeamData[];
  branding: BrandingConfig;
  isPortrait?: boolean;
  focusPlayerName?: string;
}

export const TournamentMVP: React.FC<TournamentMVPProps> = ({ data, branding, isPortrait = false, focusPlayerName }) => {
  const [viewMode, setViewMode] = useState<'grid' | 'presentation'>('grid');
  
  // Process data to find top players
  const { primaryMVP, secondaryMVPs, allMVPs } = useMemo(() => {
    const characterKeys = Object.keys(ASSETS.CHARACTERS);
    
    const players: MVPPlayer[] = data.flatMap(team => 
      team.players.map(player => {
        const avatarIndex = player.playerName.length % characterKeys.length;
        const avatarUrl = ASSETS.CHARACTERS[characterKeys[avatarIndex] as keyof typeof ASSETS.CHARACTERS];

        return {
          id: player.playerName,
          name: player.playerName,
          teamName: team.name,
          stats: {
            mvpRating: player.impactScore, 
            finishes: player.finishes,
            damage: player.damage,
            avgSurvival: `${Math.floor(team.avgSurvivalTime / 60)}:${Math.floor(team.avgSurvivalTime % 60).toString().padStart(2, '0')}`,
            knocks: Math.floor(player.finishes * 0.8)
          },
          playerImage: avatarUrl
        };
      })
    );

    // Sort by MVP Rating (Impact Score)
    const sortedPlayers = players.sort((a, b) => b.stats.mvpRating - a.stats.mvpRating);

    return {
      primaryMVP: sortedPlayers[0],
      secondaryMVPs: sortedPlayers.slice(1, 5),
      allMVPs: sortedPlayers.slice(0, 5)
    };
  }, [data]);

  const [currentIndex, setCurrentIndex] = useState(() => {
    if (focusPlayerName) {
      const idx = allMVPs.findIndex(p => p.name === focusPlayerName);
      return idx !== -1 ? idx : 0;
    }
    return 0;
  });

  if (!primaryMVP) return null;

  const handleNext = () => setCurrentIndex((prev) => (prev + 1) % allMVPs.length);
  const handlePrev = () => setCurrentIndex((prev) => (prev - 1 + allMVPs.length) % allMVPs.length);

  const accentColor = branding.accentColor || '#00FF00';

  return (
    <div className="w-full h-full bg-[#050505] text-white overflow-y-auto overflow-x-hidden no-scrollbar relative font-sans selection:bg-[#00FF00] selection:text-black flex flex-col">
      
      {/* Top Navigation Bar */}
      <div className="absolute top-0 right-0 z-50 p-6 flex items-center gap-4">
          <button 
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-sm border transition-all flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest ${viewMode === 'grid' ? 'text-black' : 'bg-white/5 border-white/10 text-white/40 hover:text-white hover:border-white/30'}`}
            style={viewMode === 'grid' ? { backgroundColor: accentColor, borderColor: accentColor } : {}}
          >
            <Grid className="w-3 h-3" />
            <span className="hidden sm:inline">Grid View</span>
          </button>
          <button 
            onClick={() => setViewMode('presentation')}
            className={`p-2 rounded-sm border transition-all flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest ${viewMode === 'presentation' ? 'text-black' : 'bg-white/5 border-white/10 text-white/40 hover:text-white hover:border-white/30'}`}
            style={viewMode === 'presentation' ? { backgroundColor: accentColor, borderColor: accentColor } : {}}
          >
            <Play className="w-3 h-3" />
            <span className="hidden sm:inline">Presentation Mode</span>
          </button>
      </div>

      <AnimatePresence mode="wait">
        {viewMode === 'grid' ? (
          <motion.div 
            key="grid"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={`flex-1 flex ${isPortrait ? 'flex-col' : 'flex-row'}`}
          >
            {/* Left Pane: Massive Typography & Branding */}
            <div className={`w-full ${isPortrait ? 'h-1/3' : 'w-1/3 h-full'} relative flex flex-col justify-center p-12 border-b ${isPortrait ? 'border-b-white/10' : 'border-r border-white/10'}`}>
                {/* Background Text */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none select-none opacity-[0.03] whitespace-nowrap">
                    <h1 className={`text-[${isPortrait ? '60vw' : '40vw'}] font-black uppercase tracking-tighter leading-none italic`}>
                        MVP
                    </h1>
                </div>

                <motion.div 
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="relative z-10"
                >
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-12 h-12 rounded-full flex items-center justify-center text-black" style={{ backgroundColor: accentColor }}>
                            <Trophy className="w-6 h-6" />
                        </div>
                        <div className="h-px flex-1 bg-gradient-to-r from-transparent to-transparent" style={{ backgroundImage: `linear-gradient(to right, ${accentColor}, transparent)` }}></div>
                    </div>

                    <h2 className="text-7xl sm:text-8xl font-black uppercase tracking-tighter leading-[0.85] mb-4 italic">
                        Most <br />
                        Valuable <br />
                        Player
                    </h2>

                    <div className="space-y-4">
                        <p className="text-xl font-bold uppercase tracking-[0.3em]" style={{ color: accentColor }}>
                            {branding.orgName}
                        </p>
                        <div className="flex items-center gap-2 text-white/40 font-mono text-xs uppercase tracking-widest">
                            <Star className="w-3 h-3" />
                            <span>Tournament Series 2024</span>
                            <Star className="w-3 h-3" />
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Right Pane: The Cards Grid */}
            <div className={`w-full ${isPortrait ? 'flex-1 overflow-y-auto' : 'w-2/3 h-full'} relative bg-[#0a0a0a] p-8 lg:p-16 flex items-center justify-center`}>
                <div className="absolute inset-0 z-0 opacity-10 pointer-events-none" 
                    style={{ 
                    backgroundImage: `linear-gradient(${accentColor}1A 1px, transparent 1px), linear-gradient(90deg, ${accentColor}1A 1px, transparent 1px)`,
                    backgroundSize: '60px 60px'
                    }}>
                </div>

                <div className="relative z-10 w-full max-w-6xl">
                    <div className={`grid grid-cols-1 ${isPortrait ? '' : 'md:grid-cols-2 lg:grid-cols-3'} gap-8 items-end`}>
                        <motion.div 
                            initial={{ opacity: 0, y: 50, scale: 0.9 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            className={`${isPortrait ? 'flex justify-center mb-8' : 'md:col-span-2 lg:col-span-1 flex justify-center lg:justify-start'}`}
                        >
                            <MVPCard player={primaryMVP} isPrimary={true} accentColor={accentColor} />
                        </motion.div>

                        <div className={`${isPortrait ? 'grid grid-cols-1 gap-6' : 'md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6'}`}>
                            {secondaryMVPs.map((player, index) => (
                                <motion.div 
                                    key={player.id}
                                    initial={{ opacity: 0, y: 30 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                >
                                    <MVPCard player={player} isPrimary={false} accentColor={accentColor} />
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="presentation"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 relative flex items-center justify-center p-12"
          >
            {/* Cinematic Background */}
            <div className="absolute inset-0" style={{ background: `radial-gradient(circle at center, ${accentColor}0D 0%, transparent 70%)` }}></div>
            
            <AnimatePresence mode="wait">
                <motion.div 
                    key={allMVPs[currentIndex].id}
                    initial={{ opacity: 0, scale: 0.8, filter: 'blur(20px)' }}
                    animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                    exit={{ opacity: 0, scale: 1.2, filter: 'blur(20px)' }}
                    transition={{ duration: 0.6, ease: "circOut" }}
                    className="relative z-10 flex flex-col items-center"
                >
                    {/* Rank Indicator */}
                    <div className="mb-8 flex flex-col items-center">
                        <div className="font-mono text-sm font-black tracking-[0.5em] uppercase mb-2" style={{ color: accentColor }}>
                            RANKING #{currentIndex + 1}
                        </div>
                        <div className="flex gap-2">
                            {allMVPs.map((_, i) => (
                                <div 
                                    key={i} 
                                    className={`h-1 w-8 transition-all duration-500 ${i === currentIndex ? 'w-16' : 'bg-white/10'}`}
                                    style={i === currentIndex ? { backgroundColor: accentColor } : {}}
                                />
                            ))}
                        </div>
                    </div>

                    <MVPCard player={allMVPs[currentIndex]} isPrimary={currentIndex === 0} accentColor={accentColor} />
                    
                    {/* Background Name Text */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -z-10 opacity-[0.02] pointer-events-none select-none">
                        <h1 className="text-[30vw] font-black uppercase italic whitespace-nowrap">
                            {allMVPs[currentIndex].name}
                        </h1>
                    </div>
                </motion.div>
            </AnimatePresence>

            {/* Navigation Controls */}
            <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex items-center gap-8 z-50">
                <button 
                    onClick={handlePrev}
                    className="w-16 h-16 rounded-full border-2 border-white/10 flex items-center justify-center hover:bg-white/5 transition-all group"
                    style={{ '--hover-border': accentColor } as any}
                >
                    <ChevronLeft className="w-8 h-8 group-hover:text-current transition-colors" style={{ color: 'inherit' }} />
                </button>
                <div className="text-center">
                    <div className="text-4xl font-black italic text-white leading-none">
                        {currentIndex + 1}<span className="text-white/20">/</span>{allMVPs.length}
                    </div>
                    <div className="text-[10px] font-mono font-bold text-white/40 uppercase tracking-widest mt-2">Navigation</div>
                </div>
                <button 
                    onClick={handleNext}
                    className="w-16 h-16 rounded-full border-2 border-white/10 flex items-center justify-center hover:bg-white/5 transition-all group"
                >
                    <ChevronRight className="w-8 h-8 group-hover:text-current transition-colors" />
                </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Decorative Elements */}
      <div className="absolute bottom-10 left-10 pointer-events-none hidden xl:block opacity-20">
          <div className="flex items-center gap-4">
              <div className="w-12 h-12 border border-white/20 flex items-center justify-center">
                  <Medal className="w-6 h-6" />
              </div>
              <div>
                  <div className="text-[10px] font-mono font-bold uppercase tracking-widest text-white/40">System Status</div>
                  <div className="text-xs font-black uppercase text-white">Nominal</div>
              </div>
          </div>
      </div>
    </div>
  );
};

