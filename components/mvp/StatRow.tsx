import React from 'react';
import { cn } from '../../lib/utils';

interface StatRowProps {
  label: string;
  value: string | number;
  variant?: 'primary' | 'secondary';
  isLast?: boolean;
  accentColor?: string;
}

export const StatRow: React.FC<StatRowProps> = ({ 
  label, 
  value, 
  variant = 'secondary',
  isLast = false,
  accentColor = '#00FF00'
}) => {
  const isPrimary = variant === 'primary';

  return (
    <div className={cn(
      "flex flex-col py-2 px-3 border-2 transition-colors",
      isPrimary 
        ? "bg-white/5 border-white/10 hover:bg-white/10" 
        : "bg-white/5 border-white/10 hover:bg-white/10"
    )} style={isPrimary ? { backgroundColor: `${accentColor}10`, borderColor: `${accentColor}33` } : {}}>
      <div className="flex justify-between items-baseline">
        <span className={cn(
          "text-[9px] font-mono font-bold uppercase tracking-[0.2em]",
          isPrimary ? "" : "text-white/40"
        )} style={isPrimary ? { color: accentColor } : {}}>
          {label}
        </span>
        <div className={cn(
            "h-1 w-1 rounded-full",
            isPrimary ? "" : "bg-white/20"
        )} style={isPrimary ? { backgroundColor: accentColor } : {}}></div>
      </div>
      <span className={cn(
        "text-xl font-black font-mono tracking-tighter leading-none mt-1",
        isPrimary ? "text-white" : "text-white/90"
      )}>
        {value}
      </span>
    </div>
  );
};
