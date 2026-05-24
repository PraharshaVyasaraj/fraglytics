
import { utils, writeFile } from 'xlsx';
import { TeamData, MatchData, PlayerDerived, BrandingConfig, Snapshot, ScoringRules, Insight } from '../types';
import { getGlobalPlayerRegistry } from './analyticsEngine';

interface ExportConfig {
    includeZScores: boolean;
    includeOutliers: boolean;
    includeHistory: boolean;
    includeAdvanced: boolean; // New config for efficiency, aggression, etc.
    filename: string;
}

// --- HELPER: FLATTEN DATA ---

const formatSecondsToMMSS = (seconds: number): string => {
  if (!seconds) return "00:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

const flattenMatchLogs = (matches: MatchData[], config: ExportConfig) => {
    return matches.flatMap(m => {
        const sortedMatchTeams = [...m.teams].sort((a, b) => a.rank - b.rank);
        return sortedMatchTeams.map(t => {
            return {
                Match_ID: m.id,
                Day: m.day,
                Match_Num: m.matchInDay,
                Map: "Unknown", // Assuming map isn't in MatchData currently
                Team: t.teamName,
                Placement: t.rank,
                Kills: t.totalKills,
                Match_Total_Pts: t.totalPoints
            };
        });
    });
};

const flattenPlayerRegistry = (teams: TeamData[], config: ExportConfig) => {
    const sortedTeams = [...teams].sort((a, b) => a.rank - b.rank);
    return sortedTeams.flatMap(t => {
        const sortedPlayers = [...t.players].sort((a, b) => (a.individualRank || 999) - (b.individualRank || 999));
        return sortedPlayers.map(p => {
            return {
                "Team Rank": t.rank,
                "Team Name": t.name,
                "Player Rank": p.individualRank || '',
                "Player Name": p.playerName,
                "Damage": p.damage,
                "Assist": p.assists,
                "Finishes": p.finishes,
                "Play Time (Mins)": p.playTimeMinutes.toFixed(2),
                "Impact Score": p.impactScore.toFixed(2),
                "Carry Class": p.carryClass
            };
        });
    });
};

const flattenAtomicTelemetry = (matches: MatchData[]) => {
    return matches.flatMap(m => {
        const sortedMatchTeams = [...m.teams].sort((a, b) => a.rank - b.rank);
        return sortedMatchTeams.flatMap(t => {
            const sortedPlayers = [...t.players].sort((a, b) => (a.individualRank || 999) - (b.individualRank || 999));
            return sortedPlayers.map(p => ({
                "Match ID": m.id.toUpperCase(),
                "Team Rank": t.rank,
                "Team Name": t.teamName,
                "Player Rank": p.individualRank || '',
                "Player Name": p.playerName,
                "Damage": p.damage,
                "Assist": p.assists,
                "Finishes": p.kills,
                "Play Time (Mins)": (p.survivalTimeSeconds / 60).toFixed(2)
            }));
        });
    });
};

const flattenAdvancedAnalytics = (teams: TeamData[]) => {
    const sortedTeams = [...teams].sort((a, b) => a.rank - b.rank);
    return sortedTeams.map(t => {
        // Calculate team-level Z-Scores by averaging player Z-Scores
        const avgZScoreKills = t.players.reduce((sum, p) => sum + (p.zScoreKills || 0), 0) / (t.players.length || 1);
        const avgZScoreDamage = t.players.reduce((sum, p) => sum + (p.zScoreDamage || 0), 0) / (t.players.length || 1);
        
        return {
            Team: t.name,
            "Z-Score_Kills": avgZScoreKills.toFixed(2),
            "Z-Score_Damage": avgZScoreDamage.toFixed(2),
            Consistency_Variance: t.damageVariance ? t.damageVariance.toFixed(2) : "N/A",
            "Lobby_Share_%": t.lobbyShare ? `${t.lobbyShare.toFixed(1)}%` : "N/A"
        };
    });
};

// --- CORE EXPORTERS ---

export const generateMasterExcel = (teams: TeamData[], matches: MatchData[], branding: BrandingConfig, config: ExportConfig) => {
    const wb = utils.book_new();
    const sortedTeams = [...teams].sort((a, b) => a.rank - b.rank);

    // 1. STANDINGS SHEET (Overall Standings)
    const standingsData = sortedTeams.map(t => {
        return {
            Rank: t.rank,
            Team: t.name,
            Total_Points: t.totalPoints,
            Place_Points: t.placementPoints,
            Kill_Points: t.killPoints,
            WWCD: t.history.filter(h => h.rank === 1).length,
            Matches_Played: t.matchesPlayed,
            Avg_Damage: (t.totalDamage / (t.matchesPlayed || 1)).toFixed(0),
            Efficiency_Rating: t.efficiencyRating.toFixed(0),
            Aggression_Index: t.aggressionIndex.toFixed(0),
            Trend: t.trend
        };
    });

    const wsStandings = utils.json_to_sheet(standingsData);
    utils.book_append_sheet(wb, wsStandings, "Overall Standings");

    // 2. MATCH LOGS SHEET (Match-by-Match)
    const matchLogs = flattenMatchLogs(matches, config);
    const wsMatches = utils.json_to_sheet(matchLogs);
    utils.book_append_sheet(wb, wsMatches, "Match-by-Match");

    // 3. PLAYER REGISTRY SHEET (Player Leaderboard)
    const playerRegistry = flattenPlayerRegistry(sortedTeams, config);
    const wsPlayers = utils.json_to_sheet(playerRegistry);
    utils.book_append_sheet(wb, wsPlayers, "Player Leaderboard");

    // 4. ATOMIC TELEMET SHEET (Raw Player Telemetry)
    const telemetry = flattenAtomicTelemetry(matches);
    const wsTelemetry = utils.json_to_sheet(telemetry);
    utils.book_append_sheet(wb, wsTelemetry, "Raw Player Telemetry");

    // 5. ADVANCED ANALYTICS
    const advancedAnalytics = flattenAdvancedAnalytics(sortedTeams);
    const wsAdvanced = utils.json_to_sheet(advancedAnalytics);
    utils.book_append_sheet(wb, wsAdvanced, "Advanced Analytics");

    // FILE WRITE
    writeFile(wb, `${config.filename}.xlsx`);
};

export const generateRawCSV = (matches: MatchData[], config: ExportConfig) => {
    // If config has filters, we could apply them here, 
    // but typically Raw CSV implies "All Data". 
    // We will stick to the atomic telemetry for the 'Raw CSV' output.
    const telemetry = flattenAtomicTelemetry(matches);
    
    if (telemetry.length === 0) return "";

    const headers = Object.keys(telemetry[0]).join(',');
    const rows = telemetry.map(row => Object.values(row).join(','));
    
    return [headers, ...rows].join('\n');
};

export const generateAuditCSV = (matches: MatchData[]) => {
    // Reconstructs the exact "Grid View" columns for auditing data entry accuracy
    // Format: Team Rank, Team Name, Player Rank, Player Name, Damage, Assist, Finishes, Play Time (Mins)
    const headers = ['Team Rank', 'Team Name', 'Player Rank', 'Player Name', 'Damage', 'Assist', 'Finishes', 'Play Time (Mins)', 'Match Context', 'Manual Pts'];
    
    const rows: string[] = [];
    
    matches.forEach(m => {
        const matchLabel = `D${m.day}-M${m.matchInDay}`;
        const sortedMatchTeams = [...m.teams].sort((a, b) => a.rank - b.rank);
        sortedMatchTeams.forEach(t => {
            const sortedPlayers = [...t.players].sort((a, b) => (a.individualRank || 999) - (b.individualRank || 999));
            sortedPlayers.forEach(p => {
                const row = [
                    t.rank,
                    `"${t.teamName}"`,
                    p.individualRank || '',
                    `"${p.playerName}"`,
                    p.damage,
                    p.assists,
                    p.kills,
                    (p.survivalTimeSeconds / 60).toFixed(2),
                    matchLabel,
                    p.manualPoints || 0
                ];
                rows.push(row.join(','));
            });
        });
    });

    return [headers.join(','), ...rows].join('\n');
};

export const generateStandingsCSV = (teams: TeamData[]) => {
    const sortedTeams = [...teams].sort((a, b) => a.rank - b.rank);
    const headers = ['Rank', 'Team', 'Total Points', 'Place Points', 'Kill Points', 'Matches', 'Wins', 'Avg Damage', 'Total Kills', 'Trend'];
    const rows = sortedTeams.map(t => [
        t.rank,
        `"${t.name}"`,
        t.totalPoints,
        t.placementPoints,
        t.killPoints,
        t.matchesPlayed,
        t.history.filter(h => h.rank === 1).length,
        (t.totalDamage / (t.matchesPlayed || 1)).toFixed(0),
        t.totalFinishes,
        t.trend
    ].join(','));
    return [headers.join(','), ...rows].join('\n');
};

export const generateJSON = (teams: TeamData[], matches: MatchData[], branding: BrandingConfig, config: ExportConfig) => {
    const sortedTeams = [...teams].sort((a, b) => a.rank - b.rank);
    const data = {
        metadata: {
            generatedAt: new Date().toISOString(),
            organization: branding.orgName,
            version: "2.4.0",
            matchCount: matches.length,
            teamCount: sortedTeams.length
        },
        leaderboard: sortedTeams.map(t => ({
            rank: t.rank,
            name: t.name,
            points: {
                total: t.totalPoints,
                placement: t.placementPoints,
                kill: t.killPoints
            },
            stats: {
                matches: t.matchesPlayed,
                wins: t.history.filter(h => h.rank === 1).length,
                totalKills: t.totalFinishes,
                totalDamage: t.totalDamage,
                ...(config.includeAdvanced ? {
                    efficiency: t.efficiencyRating,
                    aggression: t.aggressionIndex,
                    avgSurvival: t.avgSurvivalTime
                } : {})
            },
            players: t.players.map(p => ({
                name: p.playerName,
                kills: p.finishes,
                damage: p.damage,
                ...(config.includeZScores ? { zScoreDmg: p.zScoreDamage, zScoreKills: p.zScoreKills } : {})
            }))
        })),
        matches: matches.map(m => {
            const sortedMatchTeams = [...m.teams].sort((a, b) => a.rank - b.rank);
            return {
                id: m.id,
                day: m.day,
                matchInDay: m.matchInDay,
                teams: sortedMatchTeams.map(t => ({
                    rank: t.rank,
                    name: t.teamName,
                    points: t.totalPoints,
                    kills: t.totalKills,
                    damage: t.totalDamage
                }))
            };
        })
    };
    return JSON.stringify(data, null, 2);
};

export const generateSnapshot = (
    matches: MatchData[], 
    rules: ScoringRules, 
    branding: BrandingConfig, 
    insights: Insight[],
    mode: 'manual' | 'auto',
    label?: string
): string => {
    const snapshot: Snapshot = {
        meta: {
            type: 'FRAGLAB_SNAPSHOT',
            version: '2.4.0',
            timestamp: Date.now(),
            hash: Math.random().toString(36).substring(2, 15),
            label: label || `Snapshot ${new Date().toLocaleTimeString()}`
        },
        config: {
            rules,
            branding,
            mode
        },
        data: {
            matches
        },
        analysis: {
            insights
        }
    };
    return JSON.stringify(snapshot, null, 2);
};

export const generateClipboardBridge = (matches: MatchData[]) => {
    // Tab-delimited format for Google Sheets / Excel pasting
    // Enhanced Unified 8 + Match Context + Advanced Metrics
    const headers = [
        'Match ID', 
        'Day', 
        'Team Rank', 
        'Team Name', 
        'Player Rank', 
        'Player Name', 
        'Damage', 
        'Assist', 
        'Finishes', 
        'Play Time (Mins)',
        'Impact Score',
        'Z-Score Dmg'
    ];

    const rows = matches.flatMap(m => {
        const sortedMatchTeams = [...m.teams].sort((a, b) => a.rank - b.rank);
        return sortedMatchTeams.flatMap(t => {
            const sortedPlayers = [...t.players].sort((a, b) => (a.individualRank || 999) - (b.individualRank || 999));
            return sortedPlayers.map(p => [
                m.id.toUpperCase(),
                m.day,
                t.rank,
                t.teamName,
                p.individualRank || '',
                p.playerName,
                p.damage,
                p.assists,
                p.kills,
                (p.survivalTimeSeconds / 60).toFixed(2),
                p.impactScore.toFixed(2),
                p.zScoreDamage.toFixed(2)
            ].join('\t'));
        });
    });

    return [headers.join('\t'), ...rows].join('\n');
};

// --- SINGLE TEAM EXPORTS ---

export const generateTeamProfileJSON = (team: TeamData) => {
    const exportData = {
        meta: {
            generatedAt: new Date().toISOString(),
            type: "TEAM_PROFILE_EXPORT",
            version: "1.0"
        },
        team: {
            ...team
        }
    };
    return JSON.stringify(exportData, null, 2);
};

export const generateTeamHistoryCSV = (team: TeamData) => {
    const headers = ['Match ID', 'Day', 'Rank', 'Total Points'];
    const rows = (team.history || []).map(h => [
        h.matchId,
        h.day,
        h.rank,
        h.points
    ].join(','));
    return [headers.join(','), ...rows].join('\n');
};

// --- SINGLE PLAYER EXPORTS ---

export const generatePlayerProfileJSON = (player: PlayerDerived, teamName: string) => {
    const data = {
        meta: {
            generatedAt: new Date().toISOString(),
            type: "PLAYER_PROFILE_EXPORT",
            version: "1.0"
        },
        profile: {
            name: player.playerName,
            team: teamName,
            role: player.carryClass,
            matches: player.matchesPlayed,
            totalKills: player.finishes,
            totalDamage: player.damage,
            avgSurvivalMin: player.playTimeMinutes.toFixed(1),
            impactScore: player.impactScore.toFixed(1),
            kpm: player.kpm.toFixed(2),
            damageShare: player.damageShare.toFixed(1),
            zScoreDamage: player.zScoreDamage.toFixed(2),
            zScoreKills: player.zScoreKills.toFixed(2)
        },
        history: (player.history || []).map(h => ({
            matchId: h.matchId,
            day: h.day,
            kills: h.finishes,
            damage: h.damage,
            impact: h.impact,
            zScoreDamage: h.zScoreDamage,
            zScoreKills: h.zScoreKills
        }))
    };
    return JSON.stringify(data, null, 2);
};

export const generatePlayerHistoryCSV = (player: PlayerDerived) => {
    const headers = ['Match ID', 'Day', 'Kills', 'Damage', 'Impact Score', 'Z-Score Dmg', 'Z-Score Kills'];
    const rows = (player.history || []).map(h => [
        h.matchId,
        h.day,
        h.finishes,
        h.damage,
        h.impact.toFixed(2),
        h.zScoreDamage?.toFixed(2) || '0.00',
        h.zScoreKills?.toFixed(2) || '0.00'
    ].join(','));
    return [headers.join(','), ...rows].join('\n');
};

const getMetricLabel = (id: string) => {
    const labels: Record<string, string> = {
        impactScore: 'Impact Score',
        kpm: 'Kills Per Match',
        killEfficiencyRating: 'Kill Efficiency',
        killShare: 'Kill Share %',
        clutchRating: 'Clutch Rating',
        survivalPercentile: 'Survival %',
        survivalLead: 'Survival Lead',
        avgPlacement: 'Avg Placement',
        damageShare: 'Damage Share %',
        dpm: 'Damage Per Minute',
        efficiencyScore: 'Efficiency Score',
        contributionRate: 'Contribution Rate',
        soloCarryProxy: 'Solo Carry Proxy',
        aggressionIndex: 'Aggression Index',
        boomOrBustIndex: 'Boom/Bust Index',
        combatScore: 'Combat Score'
    };
    return labels[id] || id;
};

const extractAdvancedMetrics = (p: any, slots: string[]) => {
    const base = [
        `"${p.playerName}"`, 
        `"${p.teamName}"`, 
        p.matchesPlayed, 
        p.kills, 
        p.damage, 
        p.assists, 
        p.playTimeMinutes?.toFixed(2) || 0
    ];
    
    const dynamic = slots.map(slot => {
        const val = p[slot];
        if (val === undefined || val === null) return 'N/A';
        return typeof val === 'number' ? val.toFixed(2) : val;
    });

    return [...base, ...dynamic];
};

export const generateAdvancedAnalyticsCSV = (teams: TeamData[], slots: string[]) => {
    const sortedTeams = [...teams].sort((a, b) => a.rank - b.rank);
    const players = getGlobalPlayerRegistry(sortedTeams);
    const teamRanks = new Map<string, number>();
    sortedTeams.forEach(t => teamRanks.set(t.name.toUpperCase(), t.rank));

    const sortedPlayers = [...players].sort((a, b) => {
        const rankA = teamRanks.get(a.teamName.toUpperCase()) ?? 999;
        const rankB = teamRanks.get(b.teamName.toUpperCase()) ?? 999;
        if (rankA !== rankB) return rankA - rankB;
        return (a.individualRank || 999) - (b.individualRank || 999);
    });

    const headers = [
        'Player Name', 'Team Name', 'Matches Played', 'Kills', 'Damage', 'Assists', 'Play Time (Mins)',
        ...slots.map(getMetricLabel)
    ];
    const rows = sortedPlayers.map(p => extractAdvancedMetrics(p, slots).join(','));
    return [headers.join(','), ...rows].join('\n');
};

export const generateAdvancedAnalyticsClipboard = (teams: TeamData[], slots: string[]) => {
    const sortedTeams = [...teams].sort((a, b) => a.rank - b.rank);
    const players = getGlobalPlayerRegistry(sortedTeams);
    const teamRanks = new Map<string, number>();
    sortedTeams.forEach(t => teamRanks.set(t.name.toUpperCase(), t.rank));

    const sortedPlayers = [...players].sort((a, b) => {
        const rankA = teamRanks.get(a.teamName.toUpperCase()) ?? 999;
        const rankB = teamRanks.get(b.teamName.toUpperCase()) ?? 999;
        if (rankA !== rankB) return rankA - rankB;
        return (a.individualRank || 999) - (b.individualRank || 999);
    });

    const headers = [
        'Player Name', 'Team Name', 'Matches Played', 'Kills', 'Damage', 'Assists', 'Play Time (Mins)',
        ...slots.map(getMetricLabel)
    ];
    const rows = sortedPlayers.map(p => extractAdvancedMetrics(p, slots).join('\t'));
    return [headers.join('\t'), ...rows].join('\n');
};
