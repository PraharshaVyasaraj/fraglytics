import React, { useMemo, useState } from 'react';
import { MVPCard, MVPPlayer } from './MVPCard';
import { Trophy, Star, Zap, Medal, ChevronLeft, ChevronRight, Play, Grid, Download } from 'lucide-react';
import { TeamData, BrandingConfig } from '../../types';
import { ASSETS } from '../../assets';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';

interface TournamentMVPProps {
  data: TeamData[];
  branding: BrandingConfig;
  isPortrait?: boolean;
  focusPlayerName?: string;
  onClose?: () => void;
}

export const TournamentMVP: React.FC<TournamentMVPProps> = ({ data, branding, isPortrait = false, focusPlayerName, onClose }) => {
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
            avgSurvival: `${Math.floor(team.avgSurvivalTime)}:${Math.floor((team.avgSurvivalTime % 1) * 60).toString().padStart(2, '0')}`,
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

  const handleExport = () => {
    // Placeholder for export logic
    console.log("Exporting MVP Report...");
  };

  return (
    <div className="fixed inset-0 z-[100] bg-[#050505] flex flex-col overflow-hidden font-sans selection:bg-white selection:text-black">
        {/* Background Grid & Gradient */}
        <div className="absolute inset-0 z-0">
            <div className="absolute inset-0 opacity-[0.05]" 
                style={{ 
                backgroundImage: `linear-gradient(${accentColor} 1px, transparent 1px), linear-gradient(90deg, ${accentColor} 1px, transparent 1px)`,
                backgroundSize: '30px 30px'
                }}>
            </div>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#050505_90%)]"></div>
            
            {/* Radar Scanning Effect */}
            <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150vw] h-[150vw] opacity-[0.03] pointer-events-none"
                style={{ 
                    background: `conic-gradient(from 0deg, ${accentColor}, transparent 60deg)` 
                }}
            />
            
            {/* Random Data Particles */}
            {[...Array(10)].map((_, i) => (
                <motion.div 
                    key={i}
                    initial={{ opacity: 0, x: Math.random() * 100 + '%' }}
                    animate={{ opacity: [0, 0.2, 0], y: ['0%', '100%'] }}
                    transition={{ duration: 10 + Math.random() * 20, repeat: Infinity, ease: "linear" }}
                    className="absolute top-0 w-px h-20 bg-gradient-to-b from-transparent via-current to-transparent"
                    style={{ color: accentColor }}
                />
            ))}
        </div>

        {/* Top Left Caution Tape Banner */}
        <div className="absolute top-0 left-0 z-50 overflow-hidden w-64 h-64 pointer-events-none">
            <div className="absolute top-12 -left-16 -rotate-45 w-[400px] py-2 flex items-center justify-center gap-4 border-y-2 border-black shadow-[0_0_20px_rgba(0,0,0,0.5)]"
                style={{ backgroundColor: accentColor }}>
                {[1,2,3,4,5].map(i => (
                    <span key={i} className="text-black font-black text-[10px] tracking-tighter uppercase italic">
                        FRAGLAB_ELITE // TOURNAMENT_MVP // 
                    </span>
                ))}
            </div>
        </div>

        {/* Corner Data Overlays */}
        <div className="absolute top-6 right-6 z-50 text-right font-mono text-[8px] text-white/30 uppercase tracking-widest pointer-events-none hidden md:block">
            <p>LAT: 28.6139° N</p>
            <p>LONG: 77.2090° E</p>
            <p>ALT: 213.4M</p>
            <div className="mt-4 flex flex-col gap-1">
                <div className="flex items-center justify-end gap-2">
                    <span className="opacity-50">CPU_LOAD</span>
                    <div className="w-12 h-1 bg-white/10 overflow-hidden">
                        <motion.div 
                            animate={{ width: ['20%', '80%', '40%'] }}
                            transition={{ duration: 3, repeat: Infinity }}
                            className="h-full"
                            style={{ backgroundColor: accentColor }}
                        />
                    </div>
                </div>
                <div className="flex items-center justify-end gap-2">
                    <span className="opacity-50">MEM_SYNC</span>
                    <div className="w-12 h-1 bg-white/10 overflow-hidden">
                        <motion.div 
                            animate={{ width: ['60%', '30%', '90%'] }}
                            transition={{ duration: 4, repeat: Infinity }}
                            className="h-full"
                            style={{ backgroundColor: accentColor }}
                        />
                    </div>
                </div>
            </div>
            <p className="mt-4 text-white/10">ENCRYPTION: AES-256-GCM</p>
        </div>

        <div className="absolute bottom-24 left-6 z-50 font-mono text-[8px] text-white/20 uppercase tracking-[0.3em] pointer-events-none hidden md:block">
            <div className="flex flex-col gap-1">
                <p className="flex items-center gap-2"><div className="w-1 h-1 bg-current"></div> SYSTEM_CORE_STABLE</p>
                <p className="flex items-center gap-2"><div className="w-1 h-1 bg-current"></div> TELEMETRY_SYNC_COMPLETE</p>
                <p className="flex items-center gap-2"><div className="w-1 h-1 bg-current"></div> NEURAL_LINK_ESTABLISHED</p>
            </div>
        </div>

        {/* Header Section */}
        <div className="relative z-10 pt-16 pb-6 flex flex-col items-center">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center relative"
            >
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-full flex items-center justify-center gap-2">
                    <div className="h-[2px] flex-1 bg-gradient-to-r from-transparent to-white/20"></div>
                    <span className="text-[8px] font-mono text-white/40 uppercase tracking-[0.5em]">BATTLE_REPORT_V4.2</span>
                    <div className="h-[2px] flex-1 bg-gradient-to-l from-transparent to-white/20"></div>
                </div>

                <h1 className="text-7xl md:text-9xl font-black italic uppercase tracking-tighter text-white leading-none mb-2 drop-shadow-[0_0_30px_rgba(255,255,255,0.1)]">
                    TOURNAMENT <span style={{ color: accentColor }}>MVP</span>
                </h1>
                
                <div className="flex items-center justify-center gap-6">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rotate-45" style={{ backgroundColor: accentColor }}></div>
                        <span className="text-sm font-mono font-black text-white tracking-[0.2em] uppercase">
                            {branding.orgName || 'FRAGLAB_ANALYTICS'}
                        </span>
                        <div className="w-2 h-2 rotate-45" style={{ backgroundColor: accentColor }}></div>
                    </div>
                </div>
            </motion.div>
        </div>

        {/* Main Content: The Cards Row */}
        <div className="relative z-10 flex-1 flex items-center justify-center px-8 pb-12 overflow-x-auto no-scrollbar">
            <AnimatePresence mode="wait">
                {viewMode === 'grid' ? (
                    <motion.div 
                        key="grid"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex items-end gap-8 min-w-max px-24"
                    >
                        {/* Primary MVP */}
                        <motion.div 
                            initial={{ opacity: 0, x: -100, filter: 'blur(10px)' }}
                            animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
                            transition={{ duration: 0.8, ease: "circOut" }}
                            className="mb-6 relative"
                        >
                            {/* Glow Effect for Primary */}
                            <div className="absolute inset-0 -z-10 blur-3xl opacity-20" style={{ backgroundColor: accentColor }}></div>
                            <MVPCard player={primaryMVP} isPrimary={true} accentColor={accentColor} rank={1} />
                        </motion.div>

                        {/* Secondary MVPs */}
                        <div className="flex items-end gap-6">
                            {secondaryMVPs.map((player, index) => (
                                <motion.div 
                                    key={player.id}
                                    initial={{ opacity: 0, y: 100, filter: 'blur(10px)' }}
                                    animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                                    transition={{ delay: 0.3 + (index * 0.15), duration: 0.6, ease: "circOut" }}
                                >
                                    <MVPCard player={player} isPrimary={false} accentColor={accentColor} rank={index + 2} />
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                ) : (
                    <motion.div 
                        key="presentation"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="w-full h-full flex items-center justify-center"
                    >
                        <div className="relative flex flex-col items-center">
                            <AnimatePresence mode="wait">
                                <motion.div 
                                    key={allMVPs[currentIndex].id}
                                    initial={{ opacity: 0, scale: 0.7, x: 200, rotateY: 45 }}
                                    animate={{ opacity: 1, scale: 1, x: 0, rotateY: 0 }}
                                    exit={{ opacity: 0, scale: 1.3, x: -200, rotateY: -45 }}
                                    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                                    className="relative z-10"
                                    style={{ perspective: '1000px' }}
                                >
                                    <MVPCard player={allMVPs[currentIndex]} isPrimary={currentIndex === 0} accentColor={accentColor} rank={currentIndex + 1} />
                                </motion.div>
                            </AnimatePresence>

                            {/* Navigation Controls */}
                            <div className="mt-16 flex items-center gap-12">
                                <button 
                                    onClick={handlePrev}
                                    className="w-14 h-14 rounded-full border-2 border-white/10 flex items-center justify-center hover:bg-white/5 transition-all group active:scale-95"
                                >
                                    <ChevronLeft className="w-8 h-8 text-white/20 group-hover:text-white group-hover:scale-110 transition-all" />
                                </button>
                                <div className="flex flex-col items-center">
                                    <div className="text-4xl font-black italic text-white leading-none tracking-tighter">
                                        {currentIndex + 1}<span className="text-white/20 mx-1">/</span>{allMVPs.length}
                                    </div>
                                    <div className="h-1 w-24 bg-white/10 mt-3 relative overflow-hidden">
                                        <motion.div 
                                            className="absolute inset-y-0 left-0"
                                            style={{ backgroundColor: accentColor }}
                                            animate={{ width: `${((currentIndex + 1) / allMVPs.length) * 100}%` }}
                                        />
                                    </div>
                                </div>
                                <button 
                                    onClick={handleNext}
                                    className="w-14 h-14 rounded-full border-2 border-white/10 flex items-center justify-center hover:bg-white/5 transition-all group active:scale-95"
                                >
                                    <ChevronRight className="w-8 h-8 text-white/20 group-hover:text-white group-hover:scale-110 transition-all" />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>

        {/* Scrolling Ticker */}
        <div className="h-10 bg-black border-y border-white/5 flex items-center overflow-hidden relative z-50">
            <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-black to-transparent z-10"></div>
            <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-black to-transparent z-10"></div>
            
            <motion.div 
                animate={{ x: [0, -1000] }}
                transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                className="flex items-center gap-12 whitespace-nowrap px-12"
            >
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="flex items-center gap-12">
                        {allMVPs.map(player => (
                            <div key={player.id} className="flex items-center gap-3">
                                <span className="text-[10px] font-mono text-white/40 uppercase">OPERATOR:</span>
                                <span className="text-xs font-black text-white uppercase italic">{player.name}</span>
                                <span className="text-[10px] font-mono text-white/40 uppercase ml-2">IMPACT:</span>
                                <span className="text-xs font-black italic" style={{ color: accentColor }}>{player.stats.mvpRating.toFixed(2)}</span>
                                <div className="w-1 h-1 bg-white/20 rounded-full mx-4"></div>
                            </div>
                        ))}
                    </div>
                ))}
            </motion.div>
        </div>

        {/* Bottom Controls */}
        <div className="relative z-50 p-6 flex justify-between items-center bg-black/90 backdrop-blur-xl border-t border-white/10">
            <div className="flex items-center gap-6">
                {onClose && (
                    <button 
                        onClick={onClose}
                        className="group relative px-8 py-2 overflow-hidden border-2 border-white/10 hover:border-white transition-all"
                    >
                        <div className="absolute inset-0 bg-white translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                        <span className="relative z-10 text-white group-hover:text-black font-black uppercase italic text-sm">
                            TERMINATE_SESSION
                        </span>
                    </button>
                )}
                <div className="h-10 w-px bg-white/10"></div>
                <div className="flex flex-col">
                    <span className="text-[9px] font-mono text-white/40 uppercase tracking-widest leading-none mb-1">NETWORK_STATUS</span>
                    <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                        <span className="text-xs font-mono text-white font-bold">ENCRYPTED_LINK_STABLE</span>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-4">
                <div className="flex bg-white/5 p-1 border border-white/10 rounded-sm">
                    <button 
                        onClick={() => setViewMode('grid')}
                        className={cn(
                            "px-4 py-2 transition-all flex items-center gap-2",
                            viewMode === 'grid' ? "bg-white text-black" : "text-white/40 hover:text-white"
                        )}
                    >
                        <Grid className="w-4 h-4" />
                        <span className="text-[10px] font-black uppercase italic">GRID_ARRAY</span>
                    </button>
                    <button 
                        onClick={() => setViewMode('presentation')}
                        className={cn(
                            "px-4 py-2 transition-all flex items-center gap-2",
                            viewMode === 'presentation' ? "bg-white text-black" : "text-white/40 hover:text-white"
                        )}
                    >
                        <Play className="w-4 h-4" />
                        <span className="text-[10px] font-black uppercase italic">FOCUS_STREAM</span>
                    </button>
                </div>
                
                <div className="h-10 w-px bg-white/10 mx-2"></div>
                
                <button 
                    onClick={handleExport}
                    className="group relative flex items-center gap-3 px-10 py-2 bg-white text-black font-black uppercase italic overflow-hidden hover:scale-105 transition-all active:scale-95"
                    style={{ backgroundColor: accentColor }}
                >
                    <div className="absolute inset-0 bg-black/10 -translate-x-full group-hover:translate-x-0 transition-transform duration-300"></div>
                    <Download className="w-5 h-5 relative z-10" />
                    <span className="relative z-10">GENERATE_INTEL</span>
                </button>
            </div>
        </div>
    </div>
  );
};

