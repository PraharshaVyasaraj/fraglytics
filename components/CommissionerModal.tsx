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