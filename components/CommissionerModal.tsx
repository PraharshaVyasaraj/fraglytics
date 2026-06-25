import React, { useState } from 'react';
import { ScoringRules } from '../types';
import { X, Save, RotateCcw } from 'lucide-react';
import { DEFAULT_SCORING_RULES } from '../services/analyticsEngine';

interface CommissionerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentRules: ScoringRules;
  onSave: (rules: ScoringRules) => void;
}

const CommissionerModal: React.FC<CommissionerModalProps> = ({ isOpen, onClose, currentRules, onSave }) => {
  const [rules, setRules] = useState<ScoringRules>(currentRules);

  if (!isOpen) return null;

  const handleRankChange = (rank: number, val: string) => {
    setRules(prev => ({
        ...prev,
        rankPoints: { ...prev.rankPoints, [rank]: parseInt(val) || 0 }
    }));
  };

  const resetDefaults = () => setRules(DEFAULT_SCORING_RULES);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-tactical-black border border-tactical-gray w-full max-w-lg rounded-sm shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-4 border-b border-tactical-gray">
          <h3 className="font-serif text-lg font-bold text-white">Commissioner Engine</h3>
          <button onClick={onClose} className="text-tactical-light hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        
        <div className="p-6 max-h-[70vh] overflow-y-auto">
           {/* Active Telemetry Metrics configuration */}
           <div className="mb-6 p-4 bg-tactical-dark/30 border border-tactical-gray/30 rounded-sm">
              <label className="block text-xs font-mono uppercase tracking-widest text-tactical-light mb-3">Active Telemetry Metrics</label>
              <div className="space-y-2">
                <div className="flex items-center justify-between pb-1">
                  <span className="text-xs font-bold text-white uppercase tracking-wider">Kills & Finishes (Base)</span>
                  <span className="text-[9px] font-mono bg-tactical-red/20 text-tactical-red border border-tactical-red/30 px-1.5 py-0.5 rounded uppercase">Required</span>
                </div>
                
                <label className="flex items-center justify-between cursor-pointer group pt-1 border-t border-tactical-gray/20">
                  <span className="text-xs text-tactical-light group-hover:text-white transition-colors">Player Assists</span>
                  <input 
                    type="checkbox"
                    checked={rules.activeMetrics?.assists ?? true}
                    onChange={(e) => setRules(prev => ({
                      ...prev,
                      activeMetrics: {
                        kills: true,
                        assists: e.target.checked,
                        damage: prev.activeMetrics?.damage ?? true,
                        time: prev.activeMetrics?.time ?? true,
                      }
                    }))}
                    className="accent-tactical-red cursor-pointer w-4 h-4 rounded bg-tactical-dark border border-tactical-gray"
                  />
                </label>

                <label className="flex items-center justify-between cursor-pointer group pt-1 border-t border-tactical-gray/20">
                  <span className="text-xs text-tactical-light group-hover:text-white transition-colors">Damage Dealt</span>
                  <input 
                    type="checkbox"
                    checked={rules.activeMetrics?.damage ?? true}
                    onChange={(e) => setRules(prev => ({
                      ...prev,
                      activeMetrics: {
                        kills: true,
                        assists: prev.activeMetrics?.assists ?? true,
                        damage: e.target.checked,
                        time: prev.activeMetrics?.time ?? true,
                       }
                    }))}
                    className="accent-tactical-red cursor-pointer w-4 h-4 rounded bg-tactical-dark border border-tactical-gray"
                  />
                </label>

                <label className="flex items-center justify-between cursor-pointer group pt-1 border-t border-tactical-gray/20">
                  <span className="text-xs text-tactical-light group-hover:text-white transition-colors">Survival Time (Seconds)</span>
                  <input 
                    type="checkbox"
                    checked={rules.activeMetrics?.time ?? true}
                    onChange={(e) => setRules(prev => ({
                      ...prev,
                      activeMetrics: {
                        kills: true,
                        assists: prev.activeMetrics?.assists ?? true,
                        damage: prev.activeMetrics?.damage ?? true,
                        time: e.target.checked,
                      }
                    }))}
                    className="accent-tactical-red cursor-pointer w-4 h-4 rounded bg-tactical-dark border border-tactical-gray"
                  />
                </label>
              </div>
           </div>

           {/* Kill Points */}
           <div className="mb-6">
              <label className="block text-xs font-mono uppercase tracking-widest text-tactical-light mb-2">Kill Point Multiplier</label>
              <input 
                type="number" 
                step="0.5"
                value={rules.killMultiplier}
                onChange={(e) => setRules({...rules, killMultiplier: parseFloat(e.target.value) || 0})}
                className="w-full bg-tactical-dark border border-tactical-gray p-2 text-white font-mono focus:border-tactical-red outline-none"
              />
           </div>

           {/* Rank Points */}
           <div>
              <label className="block text-xs font-mono uppercase tracking-widest text-tactical-light mb-2">Placement Points</label>
              <div className="grid grid-cols-2 gap-3">
                 {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(rank => (
                    <div key={rank} className="flex items-center gap-2">
                       <span className="w-8 text-xs font-bold text-tactical-light">#{rank}</span>
                       <input 
                          type="number"
                          value={rules.rankPoints[rank] || 0}
                          onChange={(e) => handleRankChange(rank, e.target.value)}
                          className="flex-1 bg-tactical-dark border border-tactical-gray p-2 text-white font-mono text-sm focus:border-tactical-red outline-none"
                       />
                    </div>
                 ))}
                 <div className="flex items-center gap-2 col-span-2 mt-2 pt-2 border-t border-tactical-gray/30">
                    <span className="w-auto text-xs font-bold text-tactical-light">11+ (Others)</span>
                    <input 
                       type="number"
                       value={rules.belowThresholdPoints}
                       onChange={(e) => setRules({...rules, belowThresholdPoints: parseInt(e.target.value) || 0})}
                       className="flex-1 bg-tactical-dark border border-tactical-gray p-2 text-white font-mono text-sm focus:border-tactical-red outline-none"
                    />
                 </div>
              </div>
           </div>
        </div>

        <div className="p-4 border-t border-tactical-gray flex justify-between items-center bg-tactical-dark">
           <button 
             onClick={resetDefaults}
             className="flex items-center gap-2 text-xs font-bold text-tactical-light hover:text-white uppercase tracking-wider"
           >
             <RotateCcw className="w-3 h-3" /> Reset
           </button>
           <button 
             onClick={() => { onSave(rules); onClose(); }}
             className="flex items-center gap-2 px-4 py-2 bg-white text-black font-bold text-sm uppercase tracking-wider hover:bg-tactical-light transition-colors"
           >
             <Save className="w-4 h-4" /> Save Rules
           </button>
        </div>
      </div>
    </div>
  );
};

export default CommissionerModal;