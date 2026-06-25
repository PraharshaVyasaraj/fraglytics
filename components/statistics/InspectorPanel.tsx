import React from 'react';
import { X, Users, Activity, TrendingUp, GitCompare } from 'lucide-react';
import { RadarVisualizer, TrendVisualizer } from './Visualizers';

interface InspectorPanelProps {
  selectedEntity: any;
  compareEntity: any;
  entityType: 'players' | 'teams';
  isBgmi: boolean;
  onClose: () => void;
  showTrendline: boolean;
  onToggleTrendline: () => void;
}

export const InspectorPanel: React.FC<InspectorPanelProps> = ({
  selectedEntity,
  compareEntity,
  entityType,
  isBgmi,
  onClose,
  showTrendline,
  onToggleTrendline
}) => {
  if (!selectedEntity) return null;

  const renderSynergyMatrix = () => {
    if (entityType !== 'teams' || !selectedEntity) return null;
    
    const players = selectedEntity.players || [];
    const sortedPlayers = [...players].sort((a, b) => b.impactScore - a.impactScore);

    return (
      <div className="mt-8 border-t border-white/5 pt-6">
        <div className="flex items-center gap-3 text-purple-400 mb-4">
          <Users className="w-4 h-4" />
          <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Squad Synergy Matrix</span>
        </div>
        <div className="grid grid-cols-1 gap-3">
          {sortedPlayers.map(p => {
             let role = "Flex";
             let roleColor = "text-tactical-light";
             let roleBg = "bg-white/5";
             let roleBorder = "border-white/10";

             if (p.deadWeightFlag > 0) { 
               role = "Liability"; 
               roleColor = "text-tactical-red"; 
               roleBg = "bg-tactical-red/5";
               roleBorder = "border-tactical-red/20";
             }
             else if (p.soloCarryProxy > 1.5) { 
               role = "Backpack"; 
               roleColor = "text-yellow-500"; 
               roleBg = "bg-yellow-500/5";
               roleBorder = "border-yellow-500/20";
             }
             else if (p.survivalLead > 3) { 
               role = "Anchor"; 
               roleColor = "text-blue-400"; 
               roleBg = "bg-blue-500/5";
               roleBorder = "border-blue-500/20";
             }
             else if (p.killShare > 0.3) { 
               role = "Spearhead"; 
               roleColor = "text-tactical-green"; 
               roleBg = "bg-tactical-green/5";
               roleBorder = "border-tactical-green/20";
             }

             return (
               <div key={p.playerName} className={`${roleBg} ${roleBorder} border p-3 rounded-sm flex items-center justify-between group hover:border-white/30 transition-colors`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-1 h-8 ${roleColor.replace('text-', 'bg-')} opacity-50`}></div>
                    <div>
                      <div className="text-white text-xs font-bold font-mono">{p.playerName}</div>
                      <div className={`text-[9px] font-mono uppercase font-bold ${roleColor}`}>{role}</div>
                    </div>
                  </div>
                  <div className="text-right flex gap-4">
                     <div className="flex flex-col">
                       <span className="text-[8px] text-tactical-gray uppercase font-bold">K-Share</span>
                       <span className="text-xs text-white font-mono">{(p.killShare * 100).toFixed(0)}%</span>
                     </div>
                     <div className="flex flex-col">
                       <span className="text-[8px] text-tactical-gray uppercase font-bold">Impact</span>
                       <span className="text-xs text-tactical-green font-mono">{p.impactScore.toFixed(1)}</span>
                     </div>
                  </div>
               </div>
             );
          })}
        </div>
      </div>
    );
  };

  const renderStoryteller = () => {
    if (compareEntity) {
      const nameA = selectedEntity.playerName || selectedEntity.name;
      const nameB = compareEntity.playerName || compareEntity.name;
      const aWinsLethality = (selectedEntity.killEfficiencyRating || selectedEntity.teamKillsPerMinute) > (compareEntity.killEfficiencyRating || compareEntity.teamKillsPerMinute);
      const aWinsSurvival = (selectedEntity.survivalPercentile || selectedEntity.placementConsistency) > (compareEntity.survivalPercentile || compareEntity.placementConsistency);

      return (
        <div className="text-[11px] text-tactical-light font-mono space-y-4 bg-black/40 p-5 border border-white/5 rounded-sm leading-relaxed relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-tactical-green/20 to-transparent"></div>
          <p className="flex items-center gap-2">
            <span className="text-tactical-green font-bold px-1.5 py-0.5 bg-tactical-green/10 rounded-sm">{nameA}</span> 
            <span className="text-tactical-gray italic">vs</span> 
            <span className="text-tactical-red font-bold px-1.5 py-0.5 bg-tactical-red/10 rounded-sm">{nameB}</span>
          </p>
          <div className="space-y-3">
            <p className="flex gap-2">
              <span className="text-tactical-green">»</span>
              <span>{aWinsLethality ? `${nameA} is significantly more lethal and efficient in combat.` : `${nameB} dominates in raw combat efficiency and lethality.`}</span>
            </p>
            <p className="flex gap-2">
              <span className="text-tactical-green">»</span>
              <span>{aWinsSurvival ? `${nameA} provides better survival stability.` : `${nameB} is the more consistent survivor.`}</span>
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className="text-[11px] text-tactical-light font-mono space-y-4 bg-black/40 p-5 border border-white/5 rounded-sm leading-relaxed relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-tactical-green/20 to-transparent"></div>
        {entityType === 'players' ? (
          <div className="space-y-3">
            {selectedEntity.soloCarryProxy > 1 && <p className="flex gap-2"><span className="text-yellow-500">●</span> <span><span className="text-yellow-500 font-bold uppercase text-[9px]">1v9 Warning:</span> Massive solo carry proxy detected. Player is operating far above team baseline.</span></p>}
            {selectedEntity.deadWeightFlag === 1 && <p className="flex gap-2"><span className="text-tactical-red">●</span> <span><span className="text-tactical-red font-bold uppercase text-[9px]">MIA:</span> Player logged a dead weight match (0/0/0). Critical performance drop.</span></p>}
            {selectedEntity.survivalLead > 5 && <p className="flex gap-2"><span className="text-blue-400">●</span> <span><span className="text-blue-400 font-bold uppercase text-[9px]">The Anchor:</span> Consistently outlives teammates by {selectedEntity.survivalLead.toFixed(1)} placements.</span></p>}
            {selectedEntity.killEfficiencyRating > 50 && <p className="flex gap-2"><span className="text-tactical-green">●</span> <span><span className="text-tactical-green font-bold uppercase text-[9px]">Lethal Precision:</span> High kill efficiency. Secures finishes with minimal damage spent.</span></p>}
          </div>
        ) : (
          <div className="space-y-3">
            {selectedEntity.boomOrBustIndex > 1.5 && <p className="flex gap-2"><span className="text-yellow-500">●</span> <span><span className="text-yellow-500 font-bold uppercase text-[9px]">Wildcard:</span> Extreme boom or bust index. High volatility in match outcomes.</span></p>}
            {selectedEntity.teamKillDistribution > 3 && <p className="flex gap-2"><span className="text-purple-400">●</span> <span><span className="text-purple-400 font-bold uppercase text-[9px]">Top-Heavy:</span> High kill distribution variance. Relies heavily on 1-2 players for finishes.</span></p>}
            {selectedEntity.placementConsistency < 3 && <p className="flex gap-2"><span className="text-blue-400">●</span> <span><span className="text-blue-400 font-bold uppercase text-[9px]">The Machine:</span> Incredible placement consistency. Highly predictable top finishes.</span></p>}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`${compareEntity ? 'w-[450px]' : 'w-96'} border-l border-tactical-gray bg-black/90 backdrop-blur-xl p-6 flex flex-col overflow-y-auto animate-in slide-in-from-right-8 duration-300 shadow-[-20px_0_40px_rgba(0,0,0,0.5)] z-30`}>
      <div className="flex items-center justify-between mb-8">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
             <div className="w-2 h-2 bg-tactical-green rounded-full"></div>
             <span className="text-[10px] text-tactical-green font-bold uppercase tracking-widest">Primary Focus</span>
          </div>
          <h3 className="text-2xl font-serif font-bold text-white uppercase glow-text-green leading-none">
            {selectedEntity.playerName || selectedEntity.name}
          </h3>
          {compareEntity && (
            <div className="mt-4 flex flex-col gap-1">
              <div className="flex items-center gap-2">
                 <div className="w-2 h-2 bg-tactical-red rounded-full"></div>
                 <span className="text-[10px] text-tactical-red font-bold uppercase tracking-widest">Comparative Baseline</span>
              </div>
              <h4 className="text-xl font-serif font-bold text-white/70 uppercase leading-none">
                {compareEntity.playerName || compareEntity.name}
              </h4>
            </div>
          )}
        </div>
        <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors">
          <X className="w-5 h-5 text-white" />
        </button>
      </div>

      <div className="space-y-8">
        <div className="flex items-center justify-between border-b border-white/5 pb-2">
          <div className="flex gap-4">
            <button 
              onClick={() => showTrendline && onToggleTrendline()}
              className={`text-[9px] font-bold uppercase tracking-widest pb-2 border-b-2 transition-all ${!showTrendline ? 'text-tactical-green border-tactical-green' : 'text-tactical-light border-transparent'}`}
            >
              Nexus Radar
            </button>
            <button 
              onClick={() => !showTrendline && onToggleTrendline()}
              className={`text-[9px] font-bold uppercase tracking-widest pb-2 border-b-2 transition-all ${showTrendline ? 'text-tactical-green border-tactical-green' : 'text-tactical-light border-transparent'}`}
            >
              Timeline Trend
            </button>
          </div>
          <div className="text-[8px] text-tactical-gray font-mono uppercase">Live Synthesis</div>
        </div>

        {showTrendline ? (
          <TrendVisualizer selectedEntity={selectedEntity} compareEntity={compareEntity} entityType={entityType} />
        ) : (
          <RadarVisualizer selectedEntity={selectedEntity} compareEntity={compareEntity} entityType={entityType} isBgmi={isBgmi} />
        )}

        <div className="space-y-4">
          <div className="flex items-center gap-3 text-tactical-green">
            <Activity className="w-4 h-4" />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Tactical Storytelling</span>
          </div>
          {renderStoryteller()}
        </div>

        {renderSynergyMatrix()}
      </div>
    </div>
  );
};
