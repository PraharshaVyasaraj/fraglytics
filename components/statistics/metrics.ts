export const MATCH_METRICS = {
  'MATCH DATA': [
    { key: 'totalFinishes', label: 'Match Total Kills' },
    { key: 'totalDamage', label: 'Match Total Damage' },
    { key: 'avgSurvivalTime', label: 'Global Avg Time' },
    { key: 'highestPoints', label: 'Highest Team Points' },
  ]
};

export const BGMI_MATCH_METRICS = {
  'MATCH DATA': [
    { key: 'totalFinishes', label: 'Match Total Finishes' },
    { key: 'totalDamage', label: 'Match Total Damage' },
    { key: 'avgSurvivalTime', label: 'Global Avg Time' },
    { key: 'highestPoints', label: 'Highest Team Points' },
  ]
};

export const PLAYER_METRICS = {
  'RAW COMBAT': [
    { key: 'kills', label: 'Kills' },
    { key: 'damage', label: 'Damage' },
    { key: 'assists', label: 'Assists' },
    { key: 'dpk', label: 'Dmg/Kill' },
    { key: 'kpm', label: 'KPM' },
    { key: 'killEfficiencyRating', label: 'Kill Eff' },
    { key: 'assistsPerMinute', label: 'Ast/Min' },
    { key: 'damagePerKill', label: 'Dmg/Kill (True)' },
    { key: 'killAssistCombined', label: 'K+A' },
    { key: 'avgKillsPerMatch', label: 'Avg Kills' },
    { key: 'avgDamagePerMatch', label: 'Avg Dmg' },
    { key: 'avgAssistsPerMatch', label: 'Avg Ast' },
    { key: 'killToAssistRatio', label: 'K/A Ratio' },
    { key: 'aggressionIndex', label: 'Aggression' },
  ],
  'SURVIVAL': [
    { key: 'playTimeMinutes', label: 'Time (m)' },
    { key: 'survivalPercentile', label: 'Surv %' },
    { key: 'survivedToEndFlag', label: 'Wins' },
    { key: 'earlyEliminationFlag', label: 'Early Exits' },
    { key: 'survivalLead', label: 'Surv Lead' },
  ],
  'CARRY METRICS': [
    { key: 'killShare', label: 'Kill Share' },
    { key: 'damageShare', label: 'Dmg Share' },
    { key: 'soloCarryProxy', label: 'Solo Carry' },
    { key: 'deadWeightFlag', label: 'Dead Weight' },
    { key: 'killAboveTeamAvg', label: 'Kills > Avg' },
    { key: 'damageAboveTeamAvg', label: 'Dmg > Avg' },
  ],
  'MACRO / META': [
    { key: 'impactScore', label: 'Impact' },
    { key: 'combatScore', label: 'Combat Score' },
    { key: 'efficiencyScore', label: 'Efficiency' },
    { key: 'contributionRate', label: 'Contrib Rate' },
    { key: 'impactPerMinute', label: 'Impact/Min' },
  ]
};

export const TEAM_METRICS = {
  'RAW COMBAT': [
    { key: 'totalFinishes', label: 'Kills' },
    { key: 'totalDamage', label: 'Damage' },
    { key: 'teamKillsPerMinute', label: 'KPM' },
    { key: 'conversionRate', label: 'Dmg/Kill' },
    { key: 'efficiencyRating', label: 'Efficiency' },
  ],
  'SURVIVAL': [
    { key: 'avgSurvivalTime', label: 'Avg Time (m)' },
    { key: 'avgPlacement', label: 'Avg Rank' },
    { key: 'placementConsistency', label: 'Rank StdDev' },
    { key: 'pointsConsistency', label: 'Pts StdDev' },
    { key: 'boomOrBustIndex', label: 'Boom/Bust' },
  ],
  'TEAM DYNAMICS': [
    { key: 'teamKillDistribution', label: 'Kill StdDev' },
    { key: 'teamDamageDistribution', label: 'Dmg StdDev' },
    { key: 'teamActivePlayerCount', label: 'Active Players' },
    { key: 'teamDeadWeightCount', label: 'Dead Weights' },
  ],
  'MACRO / META': [
    { key: 'totalPoints', label: 'Points' },
    { key: 'winRate', label: 'Win Rate' },
    { key: 'top3Rate', label: 'Top 3 Rate' },
    { key: 'top5Rate', label: 'Top 5 Rate' },
    { key: 'avgKillPointsPerMatch', label: 'Avg KP' },
    { key: 'avgPlacementPointsPerMatch', label: 'Avg PP' },
    { key: 'winProbability', label: 'Win Prob' },
  ]
};

export const BGMI_PLAYER_METRICS = {
  'RAW COMBAT': [
    { key: 'kills', label: 'Finishes' },
    { key: 'kpm', label: 'FPM (Finishes/Min)' },
    { key: 'avgKillsPerMatch', label: 'Avg Finishes' },
    { key: 'aggressionIndex', label: 'Aggression' },
  ],
  'SURVIVAL': [
    { key: 'playTimeMinutes', label: 'Time (m)' },
    { key: 'survivalPercentile', label: 'Surv %' },
    { key: 'survivedToEndFlag', label: 'Wins' },
  ],
  'CARRY METRICS': [
    { key: 'killShare', label: 'Finish Share' },
    { key: 'soloCarryProxy', label: 'Solo Carry' },
    { key: 'killAboveTeamAvg', label: 'Finishes > Avg' },
  ],
  'MACRO / META': [
    { key: 'impactScore', label: 'Impact' },
    { key: 'combatScore', label: 'Combat Score' },
    { key: 'efficiencyScore', label: 'Efficiency' },
    { key: 'contributionRate', label: 'Contrib Rate' },
  ]
};

export const BGMI_TEAM_METRICS = {
  'RAW COMBAT': [
    { key: 'totalFinishes', label: 'Finishes' },
    { key: 'teamKillsPerMinute', label: 'FPM' },
    { key: 'efficiencyRating', label: 'Efficiency' },
  ],
  'SURVIVAL': [
    { key: 'avgSurvivalTime', label: 'Avg Time (m)' },
    { key: 'avgPlacement', label: 'Avg Rank' },
    { key: 'placementConsistency', label: 'Rank StdDev' },
    { key: 'pointsConsistency', label: 'Pts StdDev' },
  ],
  'TEAM DYNAMICS': [
    { key: 'teamKillDistribution', label: 'Finish StdDev' },
    { key: 'teamActivePlayerCount', label: 'Active Players' },
  ],
  'MACRO / META': [
    { key: 'totalPoints', label: 'Points' },
    { key: 'winRate', label: 'Win Rate' },
    { key: 'top3Rate', label: 'Top 3 Rate' },
    { key: 'top5Rate', label: 'Top 5 Rate' },
    { key: 'avgKillPointsPerMatch', label: 'Avg FP' },
    { key: 'avgPlacementPointsPerMatch', label: 'Avg PP' },
  ]
};
