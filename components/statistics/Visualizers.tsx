import React from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip, Legend, LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts';

interface RadarVisualizerProps {
  selectedEntity: any;
  compareEntity: any;
  entityType: 'players' | 'teams';
  isBgmi: boolean;
}

export const RadarVisualizer: React.FC<RadarVisualizerProps> = ({ selectedEntity, compareEntity, entityType, isBgmi }) => {
  if (!selectedEntity) return null;

  let radarData = [];
  if (entityType === 'players') {
    const finishesRating = isBgmi 
      ? ((selectedEntity.finishes / Math.max(1, selectedEntity.matchesPlayed)) * 250)
      : (selectedEntity.killEfficiencyRating || 0);
    const compareFinishesRating = isBgmi && compareEntity
      ? ((compareEntity.finishes / Math.max(1, compareEntity.matchesPlayed)) * 250)
      : (compareEntity?.killEfficiencyRating || 0);

    radarData = [
      { subject: isBgmi ? 'Finishes' : 'Lethality', A: finishesRating, B: compareFinishesRating, fullMark: 1000 },
      { subject: 'Survival', A: (selectedEntity.survivalPercentile || 0) * 100, B: (compareEntity?.survivalPercentile || 0) * 100, fullMark: 100 },
      { subject: isBgmi ? 'Finish Share' : 'Carry', A: (selectedEntity.killShare || 0) * 100, B: (compareEntity?.killShare || 0) * 100, fullMark: 100 },
      { subject: 'Aggression', A: selectedEntity.aggressionIndex || 0, B: compareEntity?.aggressionIndex || 0, fullMark: 100 },
      { subject: 'Support', A: selectedEntity.supportRating || 0, B: compareEntity?.supportRating || 0, fullMark: 100 },
    ];
  } else {
    radarData = [
      { subject: isBgmi ? 'Finishes/Min' : 'Lethality', A: selectedEntity.teamKillsPerMinute || 0, B: compareEntity?.teamKillsPerMinute || 0, fullMark: 5 },
      { subject: 'Consistency', A: 100 - (selectedEntity.placementConsistency || 0) * 5, B: 100 - (compareEntity?.placementConsistency || 0) * 5, fullMark: 100 },
      { subject: isBgmi ? 'Finish StdDev' : 'Cohesion', A: 100 - (selectedEntity.teamKillDistribution || 0) * 10, B: 100 - (compareEntity?.teamKillDistribution || 0) * 10, fullMark: 100 },
      { subject: 'Aggression', A: selectedEntity.aggressionIndex || 0, B: compareEntity?.aggressionIndex || 0, fullMark: 100 },
      { subject: 'Efficiency', A: selectedEntity.efficiencyRating || 0, B: compareEntity?.efficiencyRating || 0, fullMark: 100 },
    ];
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="65%" data={radarData}>
          <PolarGrid stroke="#333" />
          <PolarAngleAxis dataKey="subject" tick={{ fill: '#888', fontSize: 10 }} />
          <Radar name={selectedEntity.playerName || selectedEntity.name} dataKey="A" stroke="#00ff00" fill="#00ff00" fillOpacity={0.3} />
          {compareEntity && (
            <Radar name={compareEntity.playerName || compareEntity.name} dataKey="B" stroke="#ff3333" fill="#ff3333" fillOpacity={0.3} />
          )}
          <Tooltip contentStyle={{ backgroundColor: '#111', border: '1px solid #333' }} />
          {compareEntity && <Legend wrapperStyle={{ fontSize: '10px' }} />}
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
};

interface TrendVisualizerProps {
  selectedEntity: any;
  compareEntity: any;
  entityType: 'players' | 'teams';
}

export const TrendVisualizer: React.FC<TrendVisualizerProps> = ({ selectedEntity, compareEntity, entityType }) => {
  if (!selectedEntity || !selectedEntity.history) return null;

  let chartData: any[] = [];

  if (entityType === 'players') {
    const allMatches = new Set<string>();
    selectedEntity.history.forEach((h: any) => allMatches.add(h.matchId));
    if (compareEntity?.history) {
      compareEntity.history.forEach((h: any) => allMatches.add(h.matchId));
    }

    chartData = Array.from(allMatches).map((matchId, idx) => {
      const aHist = selectedEntity.history.find((h: any) => h.matchId === matchId);
      const bHist = compareEntity?.history?.find((h: any) => h.matchId === matchId);
      return {
        name: `M${idx + 1}`,
        [selectedEntity.playerName]: aHist ? aHist.impact : null,
        ...(compareEntity ? { [compareEntity.playerName]: bHist ? bHist.impact : null } : {})
      };
    });
  } else {
    const allMatches = new Set<string>();
    selectedEntity.history.forEach((h: any) => allMatches.add(h.matchId));
    if (compareEntity?.history) {
      compareEntity.history.forEach((h: any) => allMatches.add(h.matchId));
    }

    chartData = Array.from(allMatches).map((matchId, idx) => {
      const aHist = selectedEntity.history.find((h: any) => h.matchId === matchId);
      const bHist = compareEntity?.history?.find((h: any) => h.matchId === matchId);
      return {
        name: `M${idx + 1}`,
        [selectedEntity.name]: aHist ? aHist.points : null,
        ...(compareEntity ? { [compareEntity.name]: bHist ? bHist.points : null } : {})
      };
    });
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#333" />
          <XAxis dataKey="name" stroke="#888" fontSize={10} />
          <YAxis stroke="#888" fontSize={10} />
          <Tooltip contentStyle={{ backgroundColor: '#111', border: '1px solid #333' }} />
          <Legend wrapperStyle={{ fontSize: '10px' }} />
          <Line type="monotone" dataKey={entityType === 'players' ? selectedEntity.playerName : selectedEntity.name} stroke="#00ff00" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
          {compareEntity && (
            <Line type="monotone" dataKey={entityType === 'players' ? compareEntity.playerName : compareEntity.name} stroke="#ff3333" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
