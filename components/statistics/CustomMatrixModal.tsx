import React from 'react';
import { Sliders, X } from 'lucide-react';

interface CustomMatrixModalProps {
  isOpen: boolean;
  onClose: () => void;
  entityType: 'players' | 'teams';
  metricDict: Record<string, { key: string, label: string }[]>;
  activeCols: string[];
  onToggleColumn: (key: string) => void;
  onClear: () => void;
}

export const CustomMatrixModal: React.FC<CustomMatrixModalProps> = ({ 
  isOpen, 
  onClose, 
  entityType, 
  metricDict, 
  activeCols, 
  onToggleColumn, 
  onClear 
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-tactical-dark border border-tactical-gray rounded-sm w-full max-w-4xl max-h-[80vh] flex flex-col shadow-2xl shadow-tactical-green/10 animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-4 border-b border-tactical-gray bg-black/50">
          <div className="flex items-center gap-3">
            <Sliders className="w-5 h-5 text-tactical-green" />
            <h2 className="text-lg font-mono font-bold text-white uppercase tracking-widest">Custom Matrix Builder</h2>
            <span className="text-xs text-tactical-light ml-2">({entityType})</span>
          </div>
          <button onClick={onClose} className="text-tactical-light hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {Object.entries(metricDict).map(([groupName, metrics]) => (
              <div key={groupName} className="space-y-3">
                <h4 className="text-xs font-bold text-tactical-green uppercase tracking-widest border-b border-tactical-gray pb-2">{groupName}</h4>
                <div className="space-y-2">
                  {metrics.map(m => {
                    const isChecked = activeCols.includes(m.key);
                    return (
                      <label key={m.key} className="flex items-center gap-3 cursor-pointer group" onClick={() => onToggleColumn(m.key)}>
                        <div className={`w-4 h-4 border rounded-sm flex items-center justify-center transition-colors ${isChecked ? 'bg-tactical-green border-tactical-green' : 'border-tactical-gray group-hover:border-tactical-light'}`}>
                          {isChecked && <div className="w-2 h-2 bg-black rounded-sm" />}
                        </div>
                        <span className={`text-xs font-mono transition-colors ${isChecked ? 'text-white' : 'text-tactical-light group-hover:text-white'}`}>
                          {m.label}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="p-4 border-t border-tactical-gray bg-black/50 flex justify-between items-center">
          <button 
            onClick={onClear}
            className="text-xs font-bold uppercase tracking-wider text-tactical-red hover:text-red-400 transition-colors"
          >
            Clear All
          </button>
          <div className="flex items-center gap-4">
            <span className="text-xs text-tactical-light font-mono">{activeCols.length} metrics selected</span>
            <button 
              onClick={onClose}
              className="px-6 py-2 bg-tactical-green text-black text-xs font-bold uppercase tracking-wider rounded-sm hover:bg-green-400 transition-colors"
            >
              Apply Matrix
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
