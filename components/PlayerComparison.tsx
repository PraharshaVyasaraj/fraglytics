import React, { useMemo } from 'react';
import { PlayerDerived } from '../types';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Tooltip, Legend } from 'recharts';

interface PlayerComparisonProps {
  playerA: PlayerDerived;
  playerB: PlayerDerived;
  onClose: () => void;
}

export const PlayerComparison: React.FC<PlayerComparisonProps> = ({ playerA, playerB, onClose }) => {
  const isBgmi = typeof window !== 'undefined' && localStorage.getItem('fraglab_game_mode') === 'bgmi';

  const radarData = useMemo(() => {
    const maxVal = 100;
    if (isBgmi) {
      return [
        { subject: 'Impact', A: Math.min(maxVal, playerA.impactScore * 2), B: Math.min(maxVal, playerB.impactScore * 2) },
        { subject: 'Finishes', A: Math.min(maxVal, playerA.kpm * 20), B: Math.min(maxVal, playerB.kpm * 20) },
        { subject: 'Clutch', A: Math.min(maxVal, playerA.clutchRating), B: Math.min(maxVal, playerB.clutchRating) },
        { subject: 'Support', A: Math.min(maxVal, playerA.supportRating), B: Math.min(maxVal, playerB.supportRating) },
      ];
    }
    return [
      { subject: 'Impact', A: Math.min(maxVal, playerA.impactScore * 2), B: Math.min(maxVal, playerB.impactScore * 2) },
      { subject: 'Damage', A: Math.min(maxVal, playerA.damageShare), B: Math.min(maxVal, playerB.damageShare) },
      { subject: 'Clutch', A: Math.min(maxVal, playerA.clutchRating), B: Math.min(maxVal, playerB.clutchRating) },
      { subject: 'Support', A: Math.min(maxVal, playerA.supportRating), B: Math.min(maxVal, playerB.supportRating) },
      { subject: 'Efficiency', A: Math.min(maxVal, playerA.kpm * 20), B: Math.min(maxVal, playerB.kpm * 20) },
    ];
  }, [playerA, playerB, isBgmi]);

  const comparisonRows = useMemo(() => {
    if (isBgmi) {
      return [
        { label: 'Impact', a: playerA.impactScore.toFixed(1), b: playerB.impactScore.toFixed(1) },
        { label: 'Finishes', a: playerA.finishes, b: playerB.finishes },
        { label: 'Avg Finishes', a: (playerA.finishes / Math.max(1, playerA.matchesPlayed)).toFixed(2), b: (playerB.finishes / Math.max(1, playerB.matchesPlayed)).toFixed(2) },
        { label: 'Clutch', a: playerA.clutchRating.toFixed(1), b: playerB.clutchRating.toFixed(1) },
      ];
    }
    return [
      { label: 'Impact', a: playerA.impactScore.toFixed(1), b: playerB.impactScore.toFixed(1) },
      { label: 'Kills', a: playerA.finishes, b: playerB.finishes },
      { label: 'Damage', a: playerA.damage.toLocaleString(), b: playerB.damage.toLocaleString() },
      { label: 'Clutch', a: playerA.clutchRating.toFixed(1), b: playerB.clutchRating.toFixed(1) },
    ];
  }, [playerA, playerB, isBgmi]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4">
      <div className="bg-tactical-black border border-tactical-gray w-full max-w-5xl rounded-lg shadow-2xl p-8">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold text-white uppercase tracking-widest">Player Comparison</h2>
          <button onClick={onClose} className="text-tactical-light hover:text-white">Close</button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Radar Chart */}
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                <PolarGrid stroke="#334155" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} />
                <Radar name={playerA.playerName} dataKey="A" stroke="#ef4444" fill="#ef4444" fillOpacity={0.5} />
                <Radar name={playerB.playerName} dataKey="B" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.5} />
                <Legend />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          {/* Stats Table */}
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4 text-center text-xs font-mono uppercase text-tactical-light mb-2">
              <div>{playerA.playerName}</div>
              <div>Stat</div>
              <div>{playerB.playerName}</div>
            </div>
            {comparisonRows.map((row) => (
              <div key={row.label} className="grid grid-cols-3 gap-4 text-center bg-white/5 p-3 rounded-sm">
                <div className="text-white font-bold">{row.a}</div>
                <div className="text-tactical-light">{row.label}</div>
                <div className="text-white font-bold">{row.b}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
