import React from 'react';

interface Column {
  key: string;
  label: string;
}

interface StatisticsTableProps {
  columns: Column[];
  data: any[];
  sortConfig: { key: string, direction: 'asc' | 'desc' } | null;
  onSort: (key: string) => void;
  selectedEntity: any;
  compareEntity: any;
  onRowClick: (e: React.MouseEvent, row: any) => void;
  getStatusBadge: (row: any) => React.ReactNode;
}

export const StatisticsTable: React.FC<StatisticsTableProps> = ({
  columns,
  data,
  sortConfig,
  onSort,
  selectedEntity,
  compareEntity,
  onRowClick,
  getStatusBadge
}) => {
  const getHeatmapColor = (key: string, value: number, dataArray: any[]) => {
    if (typeof value !== 'number' || isNaN(value)) return '';
    const values = dataArray.map(d => d[key]).filter(v => typeof v === 'number' && !isNaN(v));
    if (values.length === 0) return '';
    
    const max = Math.max(...values);
    const min = Math.min(...values);
    
    if (max === min) return '';
    
    const percentile = (value - min) / (max - min);
    
    // Invert for metrics where lower is better
    const lowerIsBetter = ['dpk', 'conversionRate', 'deadWeightFlag', 'earlyEliminationFlag', 'placementConsistency', 'pointsConsistency'].includes(key);
    const adjustedPercentile = lowerIsBetter ? 1 - percentile : percentile;

    if (adjustedPercentile > 0.9) return 'text-tactical-green glow-text-green font-bold';
    if (adjustedPercentile < 0.1) return 'text-tactical-red opacity-60';
    return 'text-tactical-light';
  };

  return (
    <div className="flex-1 overflow-auto bg-black/20 p-0 custom-scrollbar">
      <table className="w-full text-left text-sm font-mono border-collapse">
        <thead className="sticky top-0 bg-tactical-dark/95 backdrop-blur-md border-b border-tactical-gray z-20">
          <tr>
            {columns.map(col => (
              <th 
                key={col.key} 
                className="p-4 text-[10px] text-tactical-gray uppercase cursor-pointer hover:text-white transition-colors group"
                onClick={() => onSort(col.key)}
              >
                <div className="flex items-center gap-2">
                  {col.label}
                  <div className="flex flex-col opacity-30 group-hover:opacity-100">
                    <span className={`text-[8px] leading-none ${sortConfig?.key === col.key && sortConfig.direction === 'asc' ? 'text-tactical-green' : ''}`}>▲</span>
                    <span className={`text-[8px] leading-none ${sortConfig?.key === col.key && sortConfig.direction === 'desc' ? 'text-tactical-green' : ''}`}>▼</span>
                  </div>
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {data.map((row, idx) => {
            const isSelected = selectedEntity === row;
            const isCompared = compareEntity === row;
            let rowClass = 'data-row-hover cursor-pointer transition-all duration-200';
            if (isSelected) rowClass += ' bg-tactical-green/10 border-l-4 border-l-tactical-green shadow-[inset_4px_0_10px_rgba(0,255,0,0.1)]';
            else if (isCompared) rowClass += ' bg-tactical-red/10 border-l-4 border-l-tactical-red shadow-[inset_4px_0_10px_rgba(225,29,72,0.1)]';

            return (
              <tr 
                key={idx} 
                onClick={(e) => onRowClick(e, row)}
                className={rowClass}
              >
                {columns.map(col => {
                  const val = row[col.key];
                  const isName = col.key === 'playerName' || col.key === 'name';
                  const isTeam = col.key === 'teamName';
                  const displayVal = typeof val === 'number' ? (Number.isInteger(val) ? val : val.toFixed(2)) : val;
                  
                  return (
                    <td key={col.key} className={`p-4 ${isName ? 'text-white font-bold' : isTeam ? 'text-tactical-light italic text-xs' : getHeatmapColor(col.key, val, data)}`}>
                      <div className="flex items-center gap-2">
                        {isName && getStatusBadge(row)}
                        {displayVal}
                      </div>
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
