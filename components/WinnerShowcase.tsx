
import React, { useRef, useState } from 'react';
import { TeamData } from '../types';
import { Trophy, Crown, MonitorPlay, Download, Loader2, Check } from 'lucide-react';
import { toPng } from 'html-to-image';

interface WinnerShowcaseProps {
  data: TeamData[];
  onOpenStudio?: () => void;
  onTeamClick?: (team: TeamData) => void;
}

const WinnerShowcase: React.FC<WinnerShowcaseProps> = ({ data, onOpenStudio, onTeamClick }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isSnapshotting, setIsSnapshotting] = useState(false);
  const [snapDone, setSnapDone] = useState(false);

  // Assuming data is sorted by rank, but safe check
  const winner = data.find(t => t.rank === 1);
  
  if (!winner) return null;

  const wwcd = winner.history?.filter(h => h.rank === 1).length || 0;

  const handleDownload = async () => {
      if (!containerRef.current) return;
      setIsSnapshotting(true);
      // Wait for React to apply the state update
      await new Promise(r => setTimeout(r, 100));
      
      try {
          const dataUrl = await toPng(containerRef.current, { backgroundColor: '#0E0E0E', pixelRatio: 2 });
          const link = document.createElement('a');
          link.download = `scarfall_winner_${winner.name}_${Date.now()}.png`;
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
    <div ref={containerRef} className={`bg-gradient-to-br from-tactical-dark to-black border border-yellow-500/30 rounded-sm p-6 relative overflow-hidden group shadow-lg shadow-yellow-900/10 h-full flex flex-col justify-between ${isSnapshotting ? '' : 'animate-in fade-in zoom-in-95 duration-500'}`}>
      <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none">
        <Crown className="w-48 h-48 text-yellow-500" />
      </div>
      
      <div className="flex justify-between items-start relative z-10 mb-6">
        <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-500/10 rounded-sm text-yellow-500 border border-yellow-500/20">
                <Trophy className="w-5 h-5" />
            </div>
            <div>
                <h3 className="font-serif text-sm font-bold text-white uppercase tracking-widest">Current Leader</h3>
                <p className="text-[10px] text-tactical-light font-mono">RANK #1 SQUAD</p>
            </div>
        </div>
        <div className="flex items-center gap-1">
            {onOpenStudio && (
                <button 
                onClick={onOpenStudio} 
                className="p-1.5 text-tactical-light hover:text-white hover:bg-white/10 rounded-sm transition-colors"
                title="Open Winner Card in Studio"
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

      <div className="relative z-10 cursor-pointer" onClick={() => onTeamClick?.(winner)}>
         <h1 className="text-5xl md:text-7xl font-black text-white uppercase tracking-tighter leading-none mb-3 hover:text-yellow-500 transition-colors drop-shadow-xl">
            {winner.name}
         </h1>
         <div className="flex flex-wrap gap-2 mb-8">
            {winner.flags.map(f => (
                <span key={f} className="text-[10px] uppercase font-bold px-2 py-0.5 bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 rounded-sm">
                    {f}
                </span>
            ))}
         </div>
      </div>

      <div className="grid grid-cols-3 gap-6 border-t border-white/10 pt-6 relative z-10">
         <div>
            <div className="text-xs text-tactical-light font-mono uppercase tracking-wider mb-1">Total Pts</div>
            <div className="text-4xl font-black text-white leading-none">{winner.totalPoints}</div>
         </div>
         <div className="border-l border-white/10 pl-6">
            <div className="text-xs text-tactical-light font-mono uppercase tracking-wider mb-1">Kills</div>
            <div className="text-4xl font-black text-white leading-none">{winner.totalFinishes}</div>
         </div>
         <div className="border-l border-white/10 pl-6">
            <div className="text-xs text-tactical-light font-mono uppercase tracking-wider mb-1">WWCD</div>
            <div className="text-4xl font-black text-yellow-500 leading-none">{wwcd}</div>
         </div>
      </div>
    </div>
  );
};

export default WinnerShowcase;
