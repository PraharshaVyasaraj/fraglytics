import React from 'react';
import { cn } from '../../lib/utils';

interface StatRowProps {
  label: string;
  value: string | number;
  variant?: 'primary' | 'secondary';
  isLast?: boolean;
  accentColor?: string;
  color?: string;
}

export const StatRow: React.FC<StatRowProps> = ({ 
  label, 
  value, 
  variant = 'secondary',
  isLast = false,
  accentColor = '#00FF00',
  color
}) => {
  const isPrimary = variant === 'primary';

  return (
    <div className={cn(
      "flex items-center justify-between py-1.5 px-3 border-b border-white/5 last:border-0 transition-colors group/stat",
      isPrimary ? "bg-white/5" : "bg-transparent"
    )}>
      <span className={cn(
        "text-[10px] font-mono font-bold uppercase tracking-widest",
        isPrimary ? "" : "text-white/40 group-hover/stat:text-white/60"
      )} style={isPrimary ? { color: accentColor } : {}}>
        {label}
      </span>
      <span className={cn(
        "text-lg font-black font-mono tracking-tighter leading-none",
        isPrimary ? "text-white" : "text-white/90"
      )} style={color ? { color } : {}}>
        {value}
      </span>
    </div>
  );
};
