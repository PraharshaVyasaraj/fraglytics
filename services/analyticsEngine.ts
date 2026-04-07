
import { PlayerAtomic, PlayerDerived, TeamMatchStats, MatchData, TeamData, CarryClass, ScoringRules, RegistryConfig } from '../types';

export const DEFAULT_SCORING_RULES: ScoringRules = {
  killMultiplier: 1,
  rankPoints: {
    1: 10,
    2: 6,
    3: 5,
    4: 4,
    5: 3,
    6: 2,
    7: 1,
    8: 1
  },
  belowThresholdPoints: 0
};

// --- MATH HELPERS ---

const safeDivide = (num: number, den: number): number => {
    return den === 0 ? 0 : num / den;
};

const calculateStdDev = (values: number[]): number => {
    if (values.length === 0) return 0;
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const squareDiffs = values.map(v => Math.pow(v - mean, 2));
    const avgSquareDiff = squareDiffs.reduce((a, b) => a + b, 0) / squareDiffs.length;
    return Math.sqrt(avgSquareDiff);
};

// --- NORMALIZATION HELPER ---

export const normalizePlayerName = (rawName: string, teamName: string): string => {
  if (!rawName) return 'UNKNOWN';
  
  let name = rawName.trim();
  // 1. Get Team Tag (First word of team name, uppercase, remove 'Team' prefix)
  const teamTag = (teamName || '').toUpperCase().replace(/^TEAM\s+/i, '').split(' ')[0];

  // 2. Check for "Tag separator Name" pattern in the raw name
  const specificTagRegex = new RegExp(`^(${teamTag})[\\s\\-_|xXiI]+(.+)$`, 'i');
  const specificMatch = name.match(specificTagRegex);
  
  if (specificMatch) {
      return `${teamTag}x${specificMatch[2].toUpperCase()}`;
  }
  
  // 3. Generic Pattern
  const genericRegex = /^([a-z0-9]{2,5})[\s\-_|xXiI]+([a-z0-9]{2,})$/i;
  const genericMatch = name.match(genericRegex);
  
  if (genericMatch) {
      return `${genericMatch[1].toUpperCase()}x${genericMatch[2].toUpperCase()}`;
  }
  
  // 4. Fallback: Prepend tag
  if (name.toUpperCase().startsWith(teamTag) && name.length > teamTag.length + 2) {
       const remainder = name.substring(teamTag.length);
       return `${teamTag}x${remainder.toUpperCase()}`;
  }

  return `${teamTag}x${name.toUpperCase()}`;
};

// --- LEVEL 1: MATCH PROCESSOR (Atomic -> MatchStats) ---

export const calculateMatchStats = (rawPlayers: PlayerAtomic[], rules: ScoringRules, day: number, matchInDay: number): TeamMatchStats[] => {
  const matchId = `d${day}-m${matchInDay}`;
  const teamsMap = new Map<string, PlayerAtomic[]>();

  // 1. Group Atomic Stats by Team
  rawPlayers.forEach(p => {
    const safeName = (p.teamName || 'Unknown Team').trim();
    const existing = teamsMap.get(safeName) || [];
    existing.push(p);
    teamsMap.set(safeName, existing);
  });

  const matchTeams: TeamMatchStats[] = [];

  teamsMap.forEach((players, teamName) => {
    // Basic Sums
    const totalDamage = players.reduce((sum, p) => sum + p.damage, 0);
    const totalKills = players.reduce((sum, p) => sum + p.kills, 0);
    const totalAssists = players.reduce((sum, p) => sum + p.assists, 0);
    const manualPoints = players.reduce((sum, p) => sum + (p.manualPoints || 0), 0);
    
    // Rank (Min of players, usually all same)
    const rank = Math.min(...players.map(p => p.teamRank || 99));

    // Scoring
    const placementPts = rules.rankPoints[rank] ?? rules.belowThresholdPoints;
    const killPts = totalKills * rules.killMultiplier;
    const totalPoints = placementPts + killPts + manualPoints;

    // Derived Player Stats
    const derivedPlayers: PlayerDerived[] = players.map(p => {
      const damageShare = totalDamage > 0 ? (p.damage / totalDamage) * 100 : 0;
      
      let carryClass: CarryClass = 'BALANCED';
      if (damageShare >= 50) carryClass = 'SYSTEM_COLLAPSE';
      else if (damageShare >= 40) carryClass = 'HARD_CARRY';
      else if (damageShare >= 30) carryClass = 'PRIMARY';

      const minutes = p.survivalTimeSeconds / 60;
      const dpm = minutes > 0 ? p.damage / minutes : 0;
      
      const impactScore = (p.kills * 3.0) + (p.assists * 1.5) + (p.damage / 200);

      const meanDmg = totalDamage / players.length;
      const stdDmg = calculateStdDev(players.map(x => x.damage)) || 1;
      const zScoreDamage = (p.damage - meanDmg) / stdDmg;

      const meanKills = totalKills / players.length;
      const stdKills = calculateStdDev(players.map(x => x.kills)) || 1;
      const zScoreKills = (p.kills - meanKills) / stdKills;

      const normalizedName = normalizePlayerName(p.playerName, teamName);

      // NEW: Advanced Metrics Calculations
      // Clutch Rating: High survival time + kills + placement
      const clutchRating = (minutes * 0.5) + (p.kills * 2) + (100 / Math.max(1, rank));
      
      // Support Rating: High assists + high survival time (staying alive to help)
      const supportRating = (p.assists * 3) + (minutes * 0.3);

      const totalPlayers = rawPlayers.length || 64; // Fallback to 64 if not available
      const playerRank = p.individualRank || rank; // Fallback to team rank
      const survivalPercentile = safeDivide(totalPlayers - playerRank, totalPlayers);
      const teamAvgKills = safeDivide(totalKills, players.length);
      const teamAvgDamage = safeDivide(totalDamage, players.length);
      const teamAvgPlayerRank = players.reduce((sum, pl) => sum + (pl.individualRank || rank), 0) / players.length;
      
      const killAboveTeamAvg = p.kills - teamAvgKills;
      const soloCarryProxy = killAboveTeamAvg * survivalPercentile;

      return {
        ...p,
        playerName: normalizedName, 
        damagePerMinute: dpm,
        killsPerMatch: p.kills,
        kpm: p.kills,
        damageShare,
        carryClass,
        impactScore,
        clutchRating,
        supportRating,
        zScoreDamage,
        zScoreKills,
        isOutlier: minutes < 1 && p.damage < 50,
        outlierReason: minutes < 1 ? 'Early Exit' : undefined,
        history: [{ 
            matchId, 
            day, 
            damage: p.damage, 
            finishes: p.kills, 
            impact: impactScore,
            zScoreDamage,
            zScoreKills
        }],
        performanceTrend: [impactScore],
        finishes: p.kills,
        playTimeMinutes: minutes,
        individualRank: p.individualRank,
        matchesPlayed: 1,
        dpk: p.kills > 0 ? p.damage / p.kills : p.damage,

        // --- 70-METRIC SUITE FIELDS (Match Level) ---
        assistsPerMinute: safeDivide(p.assists, minutes),
        damagePerKill: safeDivide(p.damage, Math.max(p.kills, 1)),
        killAssistCombined: p.kills + p.assists,
        survivalPercentile,
        pointsPerMatch: totalPoints, // Since matchesPlayed is 1 here
        killPointsPerMatch: killPts,
        placementPointsPerMatch: placementPts,
        avgKillsPerMatch: p.kills,
        avgDamagePerMatch: p.damage,
        avgAssistsPerMatch: p.assists,
        killToAssistRatio: safeDivide(p.kills, Math.max(p.assists, 1)),
        survivedToEndFlag: playerRank === 1 ? 1 : 0,
        earlyEliminationFlag: playerRank > (totalPlayers * 0.75) ? 1 : 0,

        combatScore: impactScore,
        efficiencyScore: safeDivide(impactScore, minutes),
        survivalQuality: survivalPercentile * minutes,
        aggressionIndex: safeDivide(p.damage + (p.kills * 50), minutes),
        killEfficiencyRating: safeDivide(p.kills, Math.max(p.damage, 1)) * 1000,
        contributionRate: safeDivide(p.kills + p.assists + (p.damage / 200), minutes),
        impactPerMinute: safeDivide(impactScore, minutes),
        damageSurvivalIndex: p.damage * survivalPercentile,
        killSurvivalIndex: p.kills * survivalPercentile,
        pointsEfficiency: safeDivide(totalPoints, Math.max(minutes, 1)),
        activeContributionFlag: (p.damage > 0 || p.kills > 0 || p.assists > 0) ? 1 : 0,
        deadWeightFlag: (p.damage === 0 && p.kills === 0 && p.assists === 0) ? 1 : 0,

        killShare: safeDivide(p.kills, Math.max(totalKills, 1)),
        killAboveTeamAvg,
        damageAboveTeamAvg: p.damage - teamAvgDamage,
        soloCarryProxy,
        carryPlacementBonus: soloCarryProxy * (1 + placementPts),
        survivalLead: teamAvgPlayerRank - playerRank,
        survivedLongestFlag: playerRank === Math.min(...players.map(pl => pl.individualRank || rank)) ? 1 : 0,
        survivedToEndVsTeam: (playerRank === 1 && rank === 1) ? 1 : 0,
        // --------------------------------------------
      };
    });

    // Team Flags
    const flags: string[] = [];
    if (rank === 1) flags.push("WINNER");
    if (totalKills > 15) flags.push("HIGH_LETHALITY");
    if (totalDamage > 3000 && rank > 5) flags.push("UNLUCKY");

    const avgSurvival = players.reduce((s, p) => s + p.survivalTimeSeconds, 0) / Math.max(1, players.length);
    const avgSurvivalMinutes = avgSurvival / 60;

    matchTeams.push({
      matchId,
      dayId: day,
      teamName,
      rank: rank === 99 ? 0 : rank,
      placementPoints: placementPts,
      killPoints: killPts,
      manualPointsAdjustment: manualPoints,
      totalPoints,
      totalKills,
      totalDamage,
      totalAssists,
      avgSurvivalSeconds: avgSurvival,
      players: derivedPlayers.sort((a,b) => b.damage - a.damage),
      flags,
      
      // --- 70-METRIC SUITE FIELDS (Team Match Level) ---
      teamKillDistribution: calculateStdDev(players.map(p => p.kills)),
      teamDamageDistribution: calculateStdDev(players.map(p => p.damage)),
      teamActivePlayerCount: derivedPlayers.filter(p => p.activeContributionFlag === 1).length,
      teamDeadWeightCount: derivedPlayers.filter(p => p.deadWeightFlag === 1).length,
      teamDamagePerMinute: safeDivide(totalDamage, avgSurvivalMinutes),
      teamKillsPerMinute: safeDivide(totalKills, avgSurvivalMinutes),
      // -------------------------------------------------
    });
  });

  // TIE BREAKER LOGIC: Points -> Placement -> Damage
  return matchTeams.sort((a, b) => {
      if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
      if (b.placementPoints !== a.placementPoints) return b.placementPoints - a.placementPoints;
      return b.totalDamage - a.totalDamage;
  });
};

// --- LEVEL 2: SESSION AGGREGATOR (MatchStats[] -> TeamData[]) ---

export const aggregateTournamentStats = (matches: MatchData[], registry?: RegistryConfig): TeamData[] => {
  const teamMap = new Map<string, TeamData>();
  const globalPlayerMap = new Map<string, { 
    raw: PlayerDerived, 
    matches: number, 
    totalDmg: number, 
    totalKills: number, 
    totalAssists: number, 
    totalSurvival: number, 
    totalImpact: number, 
    totalClutch: number,
    totalSupport: number,
    totalSurvivalPercentile: number,
    totalSoloCarryProxy: number,
    totalSurvivalLead: number,
    history: any[] 
  }>();

  // 1. Accumulate
  matches.forEach(match => {
    if (!match.teams) return;
    match.teams.forEach(team => {
      // --- REGISTRY GROUNDING LAYER ---
      const rawName = team.teamName || 'Unknown Team';
      const masterName = registry?.aliases[rawName] || rawName;
      
      const key = masterName.toLowerCase().trim();
      
      if (!teamMap.has(key)) {
        teamMap.set(key, {
          rank: 99,
          name: masterName, // Use Master Name
          totalPoints: 0,
          killPoints: 0,
          placementPoints: 0,
          manualPointsAdjustment: 0,
          totalDamage: 0,
          totalFinishes: 0,
          matchesPlayed: 0,
          avgSurvivalTime: 0,
          avgPlacement: 0,
          aggressionIndex: 0,
          efficiencyRating: 0,
          conversionRate: 0,
          lobbyShare: 0,
          teamClutchScore: 0,
          teamSupportScore: 0,
          damageVariance: 0,
          isWinner: false,
          flags: [],
          players: [],
          history: [],
          rollingAvgPoints: 0,
          trend: 'STABLE'
        });
      }

      const agg = teamMap.get(key)!;
      agg.totalPoints += team.totalPoints;
      agg.killPoints += team.killPoints;
      agg.placementPoints += team.placementPoints;
      agg.manualPointsAdjustment += team.manualPointsAdjustment; 
      
      agg.totalDamage += team.totalDamage;
      agg.totalFinishes += team.totalKills;
      agg.matchesPlayed += 1;
      
      agg.avgSurvivalTime += (team.avgSurvivalSeconds / 60); 
      agg.avgPlacement += team.rank;

      agg.history.push({
        matchId: match.id,
        day: match.day,
        points: team.totalPoints,
        rank: team.rank
      });

      // Player Aggregation
      if (team.players) {
        team.players.forEach(p => {
            const safePlayerName = p.playerName || 'Unknown Player';
            const pKey = `${key}-${safePlayerName.toLowerCase().trim()}`;
            
            if (!globalPlayerMap.has(pKey)) {
                globalPlayerMap.set(pKey, {
                    raw: { ...p },
                    matches: 0,
                    totalDmg: 0,
                    totalKills: 0,
                    totalAssists: 0,
                    totalSurvival: 0,
                    totalImpact: 0,
                    totalClutch: 0,
                    totalSupport: 0,
                    totalSurvivalPercentile: 0,
                    totalSoloCarryProxy: 0,
                    totalSurvivalLead: 0,
                    history: []
                });
            }
            const pAgg = globalPlayerMap.get(pKey)!;
            pAgg.matches++;
            pAgg.totalDmg += p.damage;
            pAgg.totalKills += p.kills;
            pAgg.totalAssists += p.assists;
            pAgg.totalSurvival += p.survivalTimeSeconds;
            pAgg.totalImpact += p.impactScore;
            pAgg.totalClutch += (p.clutchRating || 0);
            pAgg.totalSupport += (p.supportRating || 0);
            pAgg.totalSurvivalPercentile += (p.survivalPercentile || 0);
            pAgg.totalSoloCarryProxy += (p.soloCarryProxy || 0);
            pAgg.totalSurvivalLead += (p.survivalLead || 0);
            pAgg.history.push(p.history[0]);
        });
      }
    });
  });

  const totalLobbyDamage = Array.from(teamMap.values()).reduce((sum, t) => sum + t.totalDamage, 0);

  // 2. Finalize & Derived Global Metrics
  const finalTeams = Array.from(teamMap.values()).map(team => {
    // Reconstruct Roster
    const roster: PlayerDerived[] = [];
    globalPlayerMap.forEach((pData, pKey) => {
        if (pKey.startsWith((team.name || '').toLowerCase().trim() + '-')) {
            const p = pData.raw;
            p.damage = pData.totalDmg;
            p.kills = pData.totalKills;
            p.finishes = pData.totalKills;
            p.assists = pData.totalAssists;
            p.survivalTimeSeconds = pData.totalSurvival;
            p.impactScore = pData.totalImpact;
            p.playTimeMinutes = pData.totalSurvival / 60;
            p.damageShare = team.totalDamage > 0 ? (p.damage / team.totalDamage) * 100 : 0;
            p.history = pData.history.sort((a,b) => a.day - b.day);
            p.matchesPlayed = pData.matches;
            p.kpm = pData.matches > 0 ? p.finishes / pData.matches : 0;
            p.dpk = p.finishes > 0 ? p.damage / p.finishes : p.damage;
            
            p.clutchRating = safeDivide(pData.totalClutch, pData.matches);
            p.supportRating = safeDivide(pData.totalSupport, pData.matches);
            p.survivalPercentile = safeDivide(pData.totalSurvivalPercentile, pData.matches);
            p.soloCarryProxy = safeDivide(pData.totalSoloCarryProxy, pData.matches);
            p.survivalLead = safeDivide(pData.totalSurvivalLead, pData.matches);
            p.avgPlacement = team.avgPlacement / team.matchesPlayed;

            // Recalculate 70 metrics for aggregated player
            const minutes = p.playTimeMinutes;
            p.assistsPerMinute = safeDivide(p.assists, minutes);
            p.damagePerKill = safeDivide(p.damage, Math.max(p.kills, 1));
            p.killAssistCombined = p.kills + p.assists;
            p.avgKillsPerMatch = safeDivide(p.kills, p.matchesPlayed);
            p.avgDamagePerMatch = safeDivide(p.damage, p.matchesPlayed);
            p.avgAssistsPerMatch = safeDivide(p.assists, p.matchesPlayed);
            p.killToAssistRatio = safeDivide(p.kills, Math.max(p.assists, 1));
            
            p.combatScore = p.impactScore;
            p.efficiencyScore = safeDivide(p.impactScore, minutes);
            p.aggressionIndex = safeDivide(p.damage + (p.kills * 50), minutes);
            p.killEfficiencyRating = safeDivide(p.kills, Math.max(p.damage, 1)) * 1000;
            p.contributionRate = safeDivide(p.kills + p.assists + (p.damage / 200), minutes);
            p.impactPerMinute = safeDivide(p.impactScore, minutes);
            
            p.killShare = safeDivide(p.kills, Math.max(team.totalFinishes, 1));
            p.killAboveTeamAvg = p.kills - safeDivide(team.totalFinishes, 4); 
            p.damageAboveTeamAvg = p.damage - safeDivide(team.totalDamage, 4);
            
            // Boom or Bust: High variance in points/impact
            const impacts = p.history.map(h => h.impact);
            const avgImpact = safeDivide(p.impactScore, p.matchesPlayed);
            const variance = impacts.reduce((s, i) => s + Math.pow(i - avgImpact, 2), 0) / Math.max(1, impacts.length);
            p.boomOrBustIndex = Math.sqrt(variance);
            
            roster.push(p);
        }
    });

    // --- REGISTRY ADJUSTMENTS LAYER ---
    const adjustment = registry?.adjustments[team.name] || 0;
    team.manualPointsAdjustment += adjustment;
    team.totalPoints += adjustment;

    // Averages
    const avgSurvival = team.matchesPlayed > 0 ? team.avgSurvivalTime / team.matchesPlayed : 0;
    const conversion = team.totalFinishes > 0 ? team.totalDamage / team.totalFinishes : team.totalDamage;
    const lobbyShare = totalLobbyDamage > 0 ? (team.totalDamage / totalLobbyDamage) * 100 : 0;
    const efficiency = team.totalDamage > 0 ? (team.totalPoints / team.totalDamage) * 1000 : 0;

    const teamClutchScore = roster.reduce((sum, p) => sum + (p.clutchRating || 0), 0) / Math.max(1, roster.length);
    const teamSupportScore = roster.reduce((sum, p) => sum + (p.supportRating || 0), 0) / Math.max(1, roster.length);

    const totalMinutesPlayed = Math.max(1, team.avgSurvivalTime); 
    const combatScore = team.totalDamage + (team.totalFinishes * 50);
    const rawAggression = combatScore / totalMinutesPlayed;

    // Trends
    team.history.sort((a,b) => {
        if (a.day !== b.day) return a.day - b.day;
        return a.matchId.localeCompare(b.matchId);
    });
    const recent = team.history.slice(-5);
    const rollingAvg = recent.reduce((s, h) => s + h.points, 0) / Math.max(1, recent.length);
    let trend: 'STABLE' | 'RISING' | 'FALLING' = 'STABLE';
    if (recent.length > 1) {
        if (recent[recent.length-1].points > rollingAvg * 1.15) trend = 'RISING';
        else if (recent[recent.length-1].points < rollingAvg * 0.85) trend = 'FALLING';
    }

    // Flag Generation
    const flags: string[] = [];
    if (team.totalFinishes > team.matchesPlayed * 8) flags.push("AGGRESSIVE");
    if (conversion > 500) flags.push("LOW_LETHALITY");
    if (team.history.some(h => h.rank === 1)) flags.push("WINNER");
    if (adjustment !== 0) flags.push("ADMIN_ADJUST");

    const pointsHistory = team.history.map(h => h.points);
    const rankHistory = team.history.map(h => h.rank);
    const avgPoints = safeDivide(team.totalPoints, team.matchesPlayed);

    return {
      ...team,
      avgSurvivalTime: avgSurvival,
      conversionRate: conversion,
      lobbyShare,
      efficiencyRating: efficiency,
      teamClutchScore,
      teamSupportScore,
      aggressionIndex: rawAggression, // Will be normalized next
      rollingAvgPoints: rollingAvg,
      trend,
      players: roster.sort((a,b) => b.damage - a.damage),
      flags,

      // --- 70-METRIC SUITE FIELDS (Tournament Level) ---
      pointsPerMatch: avgPoints,
      avgPlacement: safeDivide(team.avgPlacement, team.matchesPlayed),
      placementConsistency: calculateStdDev(rankHistory),
      pointsConsistency: calculateStdDev(pointsHistory),
      boomOrBustIndex: safeDivide(Math.max(...pointsHistory, 0) - Math.min(...pointsHistory, 0), Math.max(avgPoints, 1)),
      winRate: safeDivide(rankHistory.filter(r => r === 1).length, team.matchesPlayed),
      top3Rate: safeDivide(rankHistory.filter(r => r <= 3).length, team.matchesPlayed),
      top5Rate: safeDivide(rankHistory.filter(r => r <= 5).length, team.matchesPlayed),
      avgKillPointsPerMatch: safeDivide(team.killPoints, team.matchesPlayed),
      avgPlacementPointsPerMatch: safeDivide(team.placementPoints, team.matchesPlayed),
      // winProbability is calculated separately via Monte Carlo
      // -------------------------------------------------
    };
  });

  // 3. Normalization & Ranking
  const maxAgg = Math.max(...finalTeams.map(t => t.aggressionIndex)) || 1;
  finalTeams.forEach(t => {
      t.aggressionIndex = (t.aggressionIndex / maxAgg) * 100;
  });

  // TIE BREAKER LOGIC: Total Points -> Placement Points -> Total Damage
  finalTeams.sort((a, b) => {
      if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
      if (b.placementPoints !== a.placementPoints) return b.placementPoints - a.placementPoints;
      return b.totalDamage - a.totalDamage;
  });
  
  finalTeams.forEach((t, i) => t.rank = i + 1);

  return finalTeams;
};

// --- LEVEL 3: GLOBAL REGISTRY & PREDICTION ---

export const getGlobalPlayerRegistry = (teams: TeamData[]): PlayerDerived[] => {
    const registry = new Map<string, any>();
    
    teams.forEach(team => {
        team.players.forEach(p => {
            // Treat players as separate if they have different tags or teams
            const key = `${team.name.toUpperCase()}|${p.playerName.toUpperCase()}`; 
            
            if (!registry.has(key)) {
                registry.set(key, { 
                    ...p, 
                    teamName: team.name, 
                    teamsPlayed: [team.name] 
                }); 
            } else {
                const entry = registry.get(key)!;
                entry.damage += p.damage;
                entry.finishes += p.finishes;
                entry.kills = entry.finishes;
                entry.assists = (entry.assists || 0) + (p.assists || 0);
                entry.matchesPlayed += p.matchesPlayed;
                entry.impactScore += p.impactScore; 
                entry.playTimeMinutes += p.playTimeMinutes;
                entry.clutchRating = (entry.clutchRating || 0) + (p.clutchRating || 0);
                entry.supportRating = (entry.supportRating || 0) + (p.supportRating || 0);
                entry.survivalPercentile = (entry.survivalPercentile || 0) + (p.survivalPercentile || 0);
                entry.soloCarryProxy = (entry.soloCarryProxy || 0) + (p.soloCarryProxy || 0);
                entry.survivalLead = (entry.survivalLead || 0) + (p.survivalLead || 0);
                
                if (p.history) {
                    entry.history = [...entry.history, ...p.history].sort((a: any, b: any) => a.day - b.day);
                }
                const teamList = entry.teamsPlayed || [entry.teamName];
                if (!teamList.includes(team.name)) teamList.push(team.name);
                entry.teamsPlayed = teamList;
                entry.teamName = teamList.join(' → ');
            }
        });
    });
    
    const globalPlayers = Array.from(registry.values()).map(p => {
        const minutes = p.playTimeMinutes;
        const matches = p.matchesPlayed || 1;
        
        return {
            ...p,
            damagePerMinute: minutes > 0 ? p.damage / minutes : 0,
            kpm: matches > 0 ? p.finishes / matches : 0,
            dpk: p.finishes > 0 ? p.damage / p.finishes : p.damage,
            zScoreDamage: 0, 
            zScoreKills: 0,
            
            clutchRating: p.clutchRating / matches,
            supportRating: p.supportRating / matches,
            survivalPercentile: p.survivalPercentile / matches,
            soloCarryProxy: p.soloCarryProxy / matches,
            survivalLead: p.survivalLead / matches,
            
            // Recalculate 70 metrics for global player
            assistsPerMinute: safeDivide(p.assists, minutes),
            damagePerKill: safeDivide(p.damage, Math.max(p.kills, 1)),
            killAssistCombined: p.kills + p.assists,
            avgKillsPerMatch: safeDivide(p.kills, matches),
            avgDamagePerMatch: safeDivide(p.damage, matches),
            avgAssistsPerMatch: safeDivide(p.assists, matches),
            killToAssistRatio: safeDivide(p.kills, Math.max(p.assists, 1)),
            
            combatScore: p.impactScore,
            efficiencyScore: safeDivide(p.impactScore, minutes),
            aggressionIndex: safeDivide(p.damage + (p.kills * 50), minutes),
            killEfficiencyRating: safeDivide(p.kills, Math.max(p.damage, 1)) * 1000,
            contributionRate: safeDivide(p.kills + p.assists + (p.damage / 200), minutes),
            impactPerMinute: safeDivide(p.impactScore, minutes),
        };
    });

    // Calculate Global Averages for Outlier Detection
    const avgImpact = globalPlayers.reduce((sum, p) => sum + p.impactScore, 0) / Math.max(1, globalPlayers.length);
    const avgDamage = globalPlayers.reduce((sum, p) => sum + p.damage, 0) / Math.max(1, globalPlayers.length);
    const avgKills = globalPlayers.reduce((sum, p) => sum + p.finishes, 0) / Math.max(1, globalPlayers.length);

    return globalPlayers.map(p => {
        let isOutlier = false;
        let outlierReason = '';

        if (p.impactScore > avgImpact * 2.5) {
            isOutlier = true;
            outlierReason = 'Elite Impact';
        } else if (p.damage > avgDamage * 2.5) {
            isOutlier = true;
            outlierReason = 'Heavy Damage';
        } else if (p.finishes > avgKills * 2.5) {
            isOutlier = true;
            outlierReason = 'High Lethality';
        } else if (p.matchesPlayed > 1 && p.impactScore < avgImpact * 0.2) {
            isOutlier = true;
            outlierReason = 'Underperforming';
        }

        return { ...p, isOutlier, outlierReason };
    });
};

export interface TeamPrediction {
    teamName: string;
    currentPoints: number;
    winProbability: number; // 0-100
    top3Probability: number; // 0-100
    projectedPoints: number;
}

export const runMonteCarloSimulation = (teams: TeamData[], matchesRemaining: number, iterations: number = 2000): TeamPrediction[] => {
    if (matchesRemaining <= 0) return teams.map(t => ({
        teamName: t.name,
        currentPoints: t.totalPoints,
        winProbability: t.rank === 1 ? 100 : 0,
        top3Probability: t.rank <= 3 ? 100 : 0,
        projectedPoints: t.totalPoints
    }));

    const results: Record<string, { wins: number, top3: number, totalProjected: number }> = {};
    teams.forEach(t => results[t.name] = { wins: 0, top3: 0, totalProjected: 0 });

    const teamStats = teams.map(t => {
        const pointsHistory = t.history.map(h => h.points);
        const avg = pointsHistory.length > 0 ? t.rollingAvgPoints : 5; 
        const mean = pointsHistory.length > 0 ? pointsHistory.reduce((a,b)=>a+b,0) / pointsHistory.length : 5;
        const variance = pointsHistory.length > 1 
            ? pointsHistory.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / pointsHistory.length 
            : 5;
        const stdDev = Math.sqrt(variance) || 3;
        
        return { name: t.name, current: t.totalPoints, avg, stdDev };
    });

    for (let i = 0; i < iterations; i++) {
        const simStandings = teamStats.map(t => {
            let simPoints = t.current;
            for (let m = 0; m < matchesRemaining; m++) {
                const u = 1 - Math.random();
                const v = Math.random();
                const z = Math.sqrt( -2.0 * Math.log( u ) ) * Math.cos( 2.0 * Math.PI * v );
                const matchPts = Math.max(0, t.avg + (z * t.stdDev));
                simPoints += matchPts;
            }
            return { name: t.name, finalPts: simPoints };
        });

        simStandings.sort((a, b) => b.finalPts - a.finalPts);

        simStandings.forEach((s, rank) => {
            if (rank === 0) results[s.name].wins++;
            if (rank < 3) results[s.name].top3++;
            results[s.name].totalProjected += s.finalPts;
        });
    }

    return Object.keys(results).map(name => ({
        teamName: name,
        currentPoints: teamStats.find(t => t.name === name)?.current || 0,
        winProbability: (results[name].wins / iterations) * 100,
        top3Probability: (results[name].top3 / iterations) * 100,
        projectedPoints: results[name].totalProjected / iterations
    })).sort((a, b) => b.winProbability - a.winProbability);
};

export const calculateHeadToHeadProbability = (teamA: TeamData, teamB: TeamData, iterations: number = 1000): { probA: number, probB: number } => {
    const getStats = (t: TeamData) => {
        const points = t.history.map(h => h.points);
        const mean = points.reduce((a, b) => a + b, 0) / Math.max(1, points.length);
        const variance = points.length > 1 ? points.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / points.length : 10;
        return { mean: mean || 5, stdDev: Math.sqrt(variance) || 3 }; 
    };

    const statsA = getStats(teamA);
    const statsB = getStats(teamB);

    let winsA = 0;
    
    for (let i = 0; i < iterations; i++) {
        const u1 = 1 - Math.random();
        const v1 = Math.random();
        const z1 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * v1);
        const scoreA = statsA.mean + (z1 * statsA.stdDev);

        const u2 = 1 - Math.random();
        const v2 = Math.random();
        const z2 = Math.sqrt(-2.0 * Math.log(u2)) * Math.cos(2.0 * Math.PI * v2);
        const scoreB = statsB.mean + (z2 * statsB.stdDev);

        if (scoreA > scoreB) winsA++;
    }

    const probA = (winsA / iterations) * 100;
    return { probA, probB: 100 - probA };
};

export const recalculateMatchScores = (matches: MatchData[], rules: ScoringRules): MatchData[] => {
    return matches.map(m => {
        const newTeams = (m.teams || []).map(t => {
            const placement = rules.rankPoints[t.rank] ?? rules.belowThresholdPoints;
            const kill = t.totalKills * rules.killMultiplier;
            const total = placement + kill + t.manualPointsAdjustment;
            
            const newPlayers = t.players.map(p => ({
                ...p,
                playerName: normalizePlayerName(p.playerName, t.teamName)
            }));

            return {
                ...t,
                players: newPlayers,
                placementPoints: placement,
                killPoints: kill,
                totalPoints: total
            };
        }).sort((a,b) => {
            if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
            if (b.placementPoints !== a.placementPoints) return b.placementPoints - a.placementPoints;
            return b.totalDamage - a.totalDamage;
        });
        
        return { ...m, teams: newTeams };
    });
};

export const applySlotMapping = (teams: TeamMatchStats[], slotMap: Record<number, string>): TeamMatchStats[] => {
    if (!slotMap || Object.keys(slotMap).length === 0) return teams;
    return teams.map(team => {
        const match = (team.teamName || '').match(/^(?:Team|Slot|#)?[\s-]*(\d+)$/i);
        if (match) {
            const slot = parseInt(match[1]);
            if (slotMap[slot]) {
                const newName = slotMap[slot];
                return {
                    ...team,
                    teamName: newName,
                    players: team.players.map(p => ({ 
                        ...p, 
                        teamName: newName,
                        playerName: normalizePlayerName(p.playerName, newName)
                    }))
                };
            }
        }
        return team;
    });
};
