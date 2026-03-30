
import React, { useMemo, useRef, useState } from 'react';
import { TeamData, PlayerDerived } from '../types';
import { Medal, Zap, Skull, Crosshair, MonitorPlay, Download, Loader2, Check, Star, ArrowRight } from 'lucide-react';
import { toPng } from 'html-to-image';
import { motion } from 'motion/react';

interface MVPHighlightProps {
  data: TeamData[];
  onOpenStudio?: () => void;
  onPlayerClick?: (player: PlayerDerived, teamName: string) => void;
}

const MVPHighlight: React.FC<MVPHighlightProps> = ({ data, onOpenStudio, onPlayerClick }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isSnapshotting, setIsSnapshotting] = useState(false);
  const [snapDone, setSnapDone] = useState(false);

  const mvp = useMemo(() => {
      if (!data.length) return null;
      const allPlayers = data.flatMap(t => t.players.map(p => ({ ...p, teamName: t.name })));
      // Sort by Impact Score
      return allPlayers.sort((a,b) => b.impactScore - a.impactScore)[0];
  }, [data]);

  if (!mvp) return null;

  const handleDownload = async (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!containerRef.current) return;
      setIsSnapshotting(true);
      // Wait for React to apply state update
      await new Promise(r => setTimeout(r, 100));

      try {
          const dataUrl = await toPng(containerRef.current, { backgroundColor: '#050505', pixelRatio: 2 });
          const link = document.createElement('a');
          link.download = `scarfall_mvp_${mvp.playerName}_${Date.now()}.png`;
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
    <motion.div 
      ref={containerRef} 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`bg-[#050505] border-2 border-white/10 rounded-none p-0 relative overflow-hidden group shadow-[8px_8px_0px_0px_rgba(255,255,255,0.05)] h-full flex flex-col ${isSnapshotting ? 'shadow-none border-white/5' : ''}`}
    >
      {/* Brutalist Header Bar */}
      <div className="h-8 bg-[#00FF00] flex items-center px-4 border-b-2 border-[#00FF00] text-black">
        <div className="flex gap-1 mr-3">
            <div className="w-1.5 h-1.5 rounded-full bg-black/40"></div>
            <div className="w-1.5 h-1.5 rounded-full bg-black/40"></div>
            <div className="w-1.5 h-1.5 rounded-full bg-black/40"></div>
        </div>
        <span className="text-[10px] font-mono font-black uppercase tracking-[0.2em]">ELITE_PERFORMANCE_REPORT</span>
        <div className="ml-auto flex items-center gap-2">
            <div className="w-2 h-2 bg-black animate-pulse"></div>
            <span className="text-[9px] font-mono font-bold">LIVE_DATA</span>
        </div>
      </div>

      <div className="p-6 flex-1 flex flex-col relative">
        {/* Background Decorative Text */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none select-none opacity-[0.02] whitespace-nowrap z-0">
            <h1 className="text-9xl font-black italic uppercase tracking-tighter">IMPACT</h1>
        </div>

        <div className="flex justify-between items-start relative z-10 mb-8">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/5 border border-white/10 flex items-center justify-center text-[#00FF00]">
                    <Zap className="w-5 h-5" />
                </div>
                <div>
                    <h3 className="font-mono text-[10px] font-bold text-white/40 uppercase tracking-widest">Tournament MVP</h3>
                    <p className="text-xs text-white font-black uppercase tracking-tighter">Current Leader</p>
                </div>
            </div>
            <div className="flex items-center gap-1">
                {onOpenStudio && (
                    <button 
                        onClick={(e) => { e.stopPropagation(); onOpenStudio(); }} 
                        className="p-2 text-white/40 hover:text-[#00FF00] hover:bg-[#00FF00]/10 transition-colors border border-transparent hover:border-[#00FF00]/20"
                        title="Open in Studio"
                    >
                        <MonitorPlay className="w-4 h-4" />
                    </button>
                )}
                <button 
                    onClick={handleDownload}
                    disabled={isSnapshotting}
                    className="p-2 text-white/40 hover:text-[#00FF00] hover:bg-[#00FF00]/10 transition-colors border border-transparent hover:border-[#00FF00]/20"
                    title="Download Report"
                >
                    {isSnapshotting ? <Loader2 className="w-4 h-4 animate-spin"/> : snapDone ? <Check className="w-4 h-4 text-[#00FF00]"/> : <Download className="w-4 h-4" />}
                </button>
            </div>
        </div>

        <div className="relative z-10 cursor-pointer mb-8" onClick={() => onPlayerClick?.(mvp, mvp.teamName)}>
            <div className="flex items-center gap-2 mb-2">
                <div className="h-px w-8 bg-[#00FF00]"></div>
                <span className="text-[10px] font-mono font-bold text-[#00FF00] uppercase tracking-widest">{mvp.teamName}</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-black text-white uppercase tracking-tighter leading-none italic group-hover:text-[#00FF00] transition-colors truncate">
                {mvp.playerName}
            </h1>
        </div>

        <div className="grid grid-cols-2 gap-3 relative z-10 mt-auto">
            <div className="bg-white/5 border border-white/10 p-3 hover:border-[#00FF00]/30 transition-colors">
                <div className="flex items-center gap-2 mb-1 opacity-40">
                    <Skull className="w-3 h-3"/>
                    <span className="text-[9px] uppercase font-bold tracking-widest">Kills</span>
                </div>
                <span className="text-xl font-black text-white font-mono">{mvp.finishes}</span>
            </div>
            <div className="bg-white/5 border border-white/10 p-3 hover:border-[#00FF00]/30 transition-colors">
                <div className="flex items-center gap-2 mb-1 opacity-40">
                    <Crosshair className="w-3 h-3"/>
                    <span className="text-[9px] uppercase font-bold tracking-widest">Damage</span>
                </div>
                <span className="text-xl font-black text-white font-mono">{mvp.damage.toLocaleString()}</span>
            </div>
            <div className="col-span-2 bg-[#00FF00]/5 border-2 border-[#00FF00]/20 p-4 flex items-center justify-between group/impact cursor-pointer" onClick={() => onPlayerClick?.(mvp, mvp.teamName)}>
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <Star className="w-3 h-3 text-[#00FF00] fill-[#00FF00]"/>
                        <span className="text-[10px] uppercase font-black tracking-[0.2em] text-[#00FF00]">Impact Score</span>
                    </div>
                    <span className="text-3xl font-black text-white font-mono leading-none">{mvp.impactScore.toFixed(0)}</span>
                </div>
                <ArrowRight className="w-6 h-6 text-[#00FF00] transform group-hover/impact:translate-x-2 transition-transform" />
            </div>
        </div>
      </div>

      {/* Bottom Rail */}
      <div className="h-1 bg-white/5">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: '100%' }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="h-full bg-[#00FF00]"
          />
      </div>
    </motion.div>
  );
};

export default MVPHighlight;
