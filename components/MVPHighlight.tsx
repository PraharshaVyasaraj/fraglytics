
import React, { useMemo, useRef, useState } from 'react';
import { TeamData, PlayerDerived } from '../types';
import { Medal, Zap, Skull, Crosshair, MonitorPlay, Download, Loader2, Check } from 'lucide-react';
import { toPng } from 'html-to-image';

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

  const handleDownload = async () => {
      if (!containerRef.current) return;
      setIsSnapshotting(true);
      // Wait for React to apply state update
      await new Promise(r => setTimeout(r, 100));

      try {
          const dataUrl = await toPng(containerRef.current, { backgroundColor: '#0E0E0E', pixelRatio: 2 });
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
    <div ref={containerRef} className={`bg-gradient-to-br from-tactical-dark to-black border border-purple-500/30 rounded-sm p-4 sm:p-6 relative overflow-hidden group shadow-lg shadow-purple-900/10 h-full flex flex-col justify-between ${isSnapshotting ? '' : 'animate-in fade-in zoom-in-95 duration-500 delay-100'}`}>
       <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none">
        <Medal className="w-40 h-40 text-purple-500" />
      </div>

      <div className="flex justify-between items-start relative z-10 mb-6">
        <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/10 rounded-sm text-purple-500 border border-purple-500/20">
                <Zap className="w-5 h-5" />
            </div>
            <div>
                <h3 className="font-serif text-sm font-bold text-white uppercase tracking-widest">MVP</h3>
                <p className="text-[10px] text-tactical-light font-mono">HIGHEST IMPACT</p>
            </div>
        </div>
        <div className="flex items-center gap-1">
            {onOpenStudio && (
                <button 
                onClick={onOpenStudio} 
                className="p-1.5 text-tactical-light hover:text-white hover:bg-white/10 rounded-sm transition-colors"
                title="Open MVP Card in Studio"
                >
                <MonitorPlay className="w-4 h-4" />
                </button>
            )}
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

      <div className="relative z-10 cursor-pointer" onClick={() => onPlayerClick?.(mvp, mvp.teamName)}>
         <h1 className="text-2xl sm:text-4xl font-black text-white uppercase tracking-tighter leading-none mb-1 hover:text-purple-400 transition-colors truncate">
            {mvp.playerName}
         </h1>
         <p className="text-sm font-mono text-tactical-light uppercase mb-6 flex items-center gap-2">
            <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
            {mvp.teamName}
         </p>
      </div>

      <div className="space-y-3 relative z-10 mt-auto">
         <div className="flex justify-between items-center bg-black/40 p-2 rounded-sm border border-white/5">
            <span className="text-[10px] uppercase font-bold text-tactical-light flex items-center gap-2"><Skull className="w-3 h-3"/> Kills</span>
            <span className="text-sm font-bold text-white">{mvp.finishes}</span>
         </div>
         <div className="flex justify-between items-center bg-black/40 p-2 rounded-sm border border-white/5">
            <span className="text-[10px] uppercase font-bold text-tactical-light flex items-center gap-2"><Crosshair className="w-3 h-3"/> Damage</span>
            <span className="text-sm font-bold text-white">{mvp.damage.toLocaleString()}</span>
         </div>
         <div className="flex justify-between items-center bg-purple-500/10 p-2 rounded-sm border border-purple-500/30">
            <span className="text-[10px] uppercase font-bold text-purple-400 flex items-center gap-2"><Zap className="w-3 h-3"/> Impact</span>
            <span className="text-lg font-black text-white">{mvp.impactScore.toFixed(0)}</span>
         </div>
      </div>
    </div>
  );
};

export default MVPHighlight;
