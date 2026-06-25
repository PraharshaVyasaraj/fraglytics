import React, { useMemo } from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ZAxis, Cell, Legend } from 'recharts';

interface MetricDef {
  key: string;
  label: string;
}

interface SandboxCanvasProps {
  data: any[];
  xAxis: MetricDef;
  yAxis: MetricDef;
  zAxis: MetricDef | null;
  colorBy: string;
  entityType: 'players' | 'teams';
  onEntityClick: (entity: any) => void;
}

// Generate stable deterministic colors
const stringToColor = (str: string) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const c = (hash & 0x00FFFFFF).toString(16).toUpperCase();
  return '#' + '00000'.substring(0, 6 - c.length) + c;
}

const PRESET_COLORS = [
  '#00ff00', '#ff00ff', '#00ffff', '#ffff00', '#ff8800', 
  '#0088ff', '#8800ff', '#ff0088', '#88ff00', '#ff4444'
];

export const SandboxCanvas: React.FC<SandboxCanvasProps> = ({
  data,
  xAxis,
  yAxis,
  zAxis,
  colorBy,
  entityType,
  onEntityClick
}) => {
  const groupedData = useMemo(() => {
    const groups: { [key: string]: any[] } = {};
    data.forEach(item => {
      // Ensure we have numbers for axes
      if (typeof item[xAxis.key] !== 'number' || typeof item[yAxis.key] !== 'number') return;
      
      const groupKey = colorBy === 'none' ? 'All' : (item[colorBy] || 'Unknown');
      if (!groups[groupKey]) groups[groupKey] = [];
      groups[groupKey].push(item);
    });
    return groups;
  }, [data, xAxis, yAxis, colorBy]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const pData = payload[0].payload;
      const name = entityType === 'players' ? pData.playerName : pData.name;
      const team = pData.teamName;
      
      return (
        <div className="bg-black/95 border border-tactical-gray p-3 rounded-sm shadow-xl z-50">
          <div className="text-white font-bold font-mono text-sm mb-1">{name}</div>
          {team && <div className="text-tactical-light text-xs font-mono mb-2">{team}</div>}
          
          <div className="space-y-1">
            <div className="flex justify-between gap-4 text-xs">
              <span className="text-tactical-gray">{xAxis.label}:</span>
              <span className="text-tactical-green font-mono">{Number(pData[xAxis.key] || 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between gap-4 text-xs">
              <span className="text-tactical-gray">{yAxis.label}:</span>
              <span className="text-tactical-green font-mono">{Number(pData[yAxis.key] || 0).toFixed(2)}</span>
            </div>
            {zAxis && (
              <div className="flex justify-between gap-4 text-xs pt-1 border-t border-white/10 mt-1">
                <span className="text-tactical-gray">{zAxis.label} (Size):</span>
                <span className="text-white font-mono">{Number(pData[zAxis.key] || 0).toFixed(2)}</span>
              </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full h-full relative cursor-crosshair">
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#222" />
          <XAxis 
            type="number" 
            dataKey={xAxis.key} 
            name={xAxis.label} 
            stroke="#888" 
            tick={{ fill: '#888', fontSize: 10 }}
            domain={['auto', 'auto']}
            tickFormatter={(val) => Number.isInteger(val) ? val.toString() : val.toFixed(1)}
          >
          </XAxis>
          <YAxis 
            type="number" 
            dataKey={yAxis.key} 
            name={yAxis.label} 
            stroke="#888" 
            tick={{ fill: '#888', fontSize: 10 }}
            domain={['auto', 'auto']}
            tickFormatter={(val) => Number.isInteger(val) ? val.toString() : val.toFixed(1)}
          >
          </YAxis>
          <ZAxis 
            type="number" 
            dataKey={zAxis ? zAxis.key : 'temp_const'} 
            range={zAxis ? [40, 400] : [60, 60]} 
            name={zAxis?.label || 'Size'} 
          />
          <Tooltip 
            cursor={{ strokeDasharray: '3 3', stroke: '#555' }} 
            content={<CustomTooltip />} 
            isAnimationActive={false}
          />
          {colorBy !== 'none' && (
             <Legend 
               wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} 
               iconType="circle"
             />
          )}

          {Object.entries(groupedData).map(([key, groupData], index) => {
            const seriesColor = colorBy === 'none' ? '#00ff00' : (PRESET_COLORS[index % PRESET_COLORS.length] || stringToColor(key));
            return (
              <Scatter 
                key={key} 
                name={key} 
                data={groupData} 
                fill={seriesColor}
                fillOpacity={0.6}
                onClick={(e) => onEntityClick(e)}
                className="hover:opacity-100 transition-opacity"
              >
                {
                  groupData.map((entry, i) => (
                    <Cell key={`cell-${i}`} fill={seriesColor} className="hover:stroke-white hover:stroke-2 hover:fill-opacity-100 cursor-pointer" />
                  ))
                }
              </Scatter>
            );
          })}
        </ScatterChart>
      </ResponsiveContainer>
      
      {/* Axis Labels overlays */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[10px] text-tactical-gray font-bold uppercase tracking-widest bg-black/50 px-2 py-0.5 rounded-sm pointer-events-none">
        {xAxis.label}
      </div>
      <div className="absolute left-2 top-1/2 -translate-y-1/2 -rotate-90 text-[10px] text-tactical-gray font-bold uppercase tracking-widest bg-black/50 px-2 py-0.5 rounded-sm pointer-events-none origin-center whitespace-nowrap">
        {yAxis.label}
      </div>
    </div>
  );
};
