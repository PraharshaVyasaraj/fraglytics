import React from 'react';
import { Insight } from '../types';
import { TrendingUp, AlertTriangle, ShieldAlert, Crosshair, BrainCircuit } from 'lucide-react';

interface AIInsightsProps {
  insights: Insight[];
  isLoading: boolean;
}

const AIInsights: React.FC<AIInsightsProps> = ({ insights, isLoading }) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8 animate-pulse">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-24 bg-tactical-dark rounded-sm border border-tactical-gray"></div>
        ))}
      </div>
    );
  }

  if (!insights || insights.length === 0) return null;

  const getIcon = (type: Insight['type']) => {
    switch (type) {
      case 'tactical': return <BrainCircuit className="w-4 h-4 text-white" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-tactical-red" />;
      case 'performance': return <Crosshair className="w-4 h-4 text-tactical-green" />;
      case 'prediction': return <TrendingUp className="w-4 h-4 text-tactical-light" />;
      default: return <ShieldAlert className="w-4 h-4 text-blue-500" />;
    }
  };

  const getStyles = (type: Insight['type']) => {
    switch (type) {
      case 'warning': return 'bg-tactical-red/5 border-tactical-red/30';
      case 'performance': return 'bg-tactical-green/5 border-tactical-green/30';
      default: return 'bg-tactical-dark border-tactical-gray';
    }
  };

  return (
    <div className="mb-10">
      <h3 className="font-serif text-sm font-bold text-white mb-4 flex items-center gap-2 uppercase tracking-widest">
        <span className="w-2 h-2 bg-tactical-red rounded-full animate-pulse"></span>
        Analyst Desk
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {insights.map((insight, index) => (
          <div 
            key={index} 
            className={`p-4 rounded-sm border ${getStyles(insight.type)} transition-all hover:bg-white/5 flex flex-col justify-between`}
          >
            <div>
              <div className="flex items-center gap-2 mb-2">
                {getIcon(insight.type)}
                <span className="text-[10px] font-mono uppercase tracking-wider text-tactical-light">{insight.type}</span>
              </div>
              <h4 className="font-bold text-white text-sm mb-2 leading-tight">{insight.title}</h4>
            </div>
            <p className="text-xs text-tactical-light leading-relaxed font-mono border-t border-white/5 pt-2 mt-2">{insight.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AIInsights;