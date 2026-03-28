import React from 'react';
import { cn } from '../../lib/utils';

interface StatRowProps {
  label: string;
  value: string | number;
  variant?: 'primary' | 'secondary';
  isLast?: boolean;
}

export const StatRow: React.FC<StatRowProps> = ({ 
  label, 
  value, 
  variant = 'secondary',
  isLast = false
}) => {
  const isPrimary = variant === 'primary';

  return (
    <div className={cn(
      "flex justify-between items-center py-1.5 px-4",
      !isLast && (isPrimary ? "border-b border-black/10" : "border-b border-white/10")
    )}>
      <span className={cn(
        "text-sm font-medium uppercase tracking-wider",
        isPrimary ? "text-black/70" : "text-white/70"
      )}>
        {label}
      </span>
      <span className={cn(
        "text-xl font-bold font-mono tracking-tight",
        isPrimary ? "text-black" : "text-white"
      )}>
        {value}
      </span>
    </div>
  );
};
