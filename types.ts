


export type CarryClass = 'BALANCED' | 'PRIMARY' | 'HARD_CARRY' | 'SYSTEM_COLLAPSE';

// 1️⃣ ATOMIC PLAYER STATS (Raw Telemetry)
export interface PlayerAtomic {
  playerName: string;
  teamName: string;
  matchId: string;
  dayId: number;
  
  // The Atomic Integers
  kills: number;
  assists: number;
  damage: number;
  survivalTimeSeconds: number; // CHANGED: Seconds for precision
  
  teamRank: number; // The rank of their team in this match
  individualRank?: number; // The individual placement (death order) of the player
  manualPoints?: number; // Admin adjustment
}

// 2️⃣ DERIVED PLAYER FIELDS (Calculated per Match)
export interface PlayerDerived extends PlayerAtomic {
  // Calculated Stats
  damagePerMinute: number;
  killsPerMatch: number; // In context of single match, = kills (used for aggregation)
  kpm: number; // Kills Per Match (Calculated)
  damageShare: number; // % of team damage
  impactScore: number; // Custom Formula
  
  // NEW: Advanced Metrics
  clutchRating: number;
  supportRating: number;
  performanceTrend: number[]; // Impact scores over time
  
  // Tactical Classification
  carryClass: CarryClass;
  isOutlier: boolean;
  outlierReason?: string;
  
  // Statistical Deviation (Contextual to Team)
  zScoreDamage: number;
  zScoreKills: number;

  // History & Aggregation
  history: { 
    matchId: string; 
    day: number; 
    damage: number; 
    finishes: number; 
    impact: number;
    zScoreDamage?: number;
    zScoreKills?: number;
  }[];
  finishes: number;
  playTimeMinutes: number;
  matchesPlayed: number; // Number of matches participated in
}

// 3️⃣ TEAM STATS (Per Match Context)
export interface TeamMatchStats {
  matchId: string;
  dayId: number;
  teamName: string;
  rank: number;
  
  // Scoreboard
  placementPoints: number;
  killPoints: number;
  manualPointsAdjustment: number;
  totalPoints: number;
  
  // Aggregates for this match
  totalKills: number;
  totalDamage: number;
  totalAssists: number;
  avgSurvivalSeconds: number;
  
  // Roster for this specific match
  players: PlayerDerived[];
  
  // Match-Specific Flags
  flags: string[]; 
}

// 4️⃣ MATCH OBJECT
export interface MatchData {
  id: string; // "d1-m1"
  day: number;
  matchInDay: number;
  label: string;
  teams: TeamMatchStats[]; // Results for this match
  status: 'completed' | 'pending';
}

// 🛡️ TEAM PROFILE (Aggregated / Leaderboard Row)
// Formerly 'TeamData' - Used for the Points Table
export interface TeamData {
  rank: number; // Overall Tournament Rank
  name: string;
  
  // Aggregated Totals
  totalPoints: number;
  killPoints: number;
  placementPoints: number;
  manualPointsAdjustment: number;
  
  totalDamage: number;
  totalFinishes: number;
  matchesPlayed: number;
  
  // Derived Aggregates
  avgSurvivalTime: number; // Minutes
  avgPlacement: number;
  aggressionIndex: number;
  efficiencyRating: number; // Points per 1k Damage
  conversionRate: number; // Dmg per Kill
  lobbyShare: number;
  
  // NEW: Advanced Team Metrics
  teamClutchScore: number;
  teamSupportScore: number;
  
  // Meta
  damageVariance: number; // Consistency metric
  isWinner: boolean;
  flags: string[]; // "Dominant", "Passive", etc.
  logoUrl?: string; // Optional team logo URL
  
  // Roster History (All players who have played for this team)
  players: PlayerDerived[]; // Aggregated Player Stats
  
  // Trends
  history: { matchId: string; day: number; points: number; rank: number }[];
  rollingAvgPoints: number;
  trend: 'RISING' | 'FALLING' | 'STABLE';
}

// 📆 DAY PROFILE
export interface DayData {
  dayId: number;
  matches: MatchData[];
  totalMatches: number;
}

// 🧠 SESSION (The Root State)
export interface Session {
  id: string;
  days: Record<number, DayData>;
  matches: MatchData[]; // Flat list for easy iteration
  teams: TeamData[]; // The Live Leaderboard
}

export interface Insight {
  title: string;
  description: string;
  type: 'tactical' | 'warning' | 'performance' | 'prediction';
}

export interface ScoringRules {
  killMultiplier: number;
  rankPoints: Record<number, number>;
  belowThresholdPoints: number;
}

export interface TeamBranding {
  logoUrl?: string;
  primaryColor?: string;
}

export interface PlayerBranding {
  photoUrl?: string;
  role?: string;
  countryCode?: string;
}

export interface BrandingConfig {
  orgName: string;
  accentColor: string;
  logoUrl?: string;
  customBackground?: string; // Base64 or URL for global background
  tournamentName?: string;
  tournamentStage?: string;
  publisherLogoUrl?: string;
  sponsorLogos?: string[];
  teamBranding?: Record<string, TeamBranding>;
  playerBranding?: Record<string, PlayerBranding>;
}

export interface RegistryConfig {
  aliases: Record<string, string>;
  adjustments: Record<string, number>;
}

// 📜 SNAPSHOT (Versioned History File)
export interface Snapshot {
    meta: {
      type: 'FRAGLAB_SNAPSHOT';
      version: string; // App Version
      timestamp: number;
      hash: string; // Simple unique ID for the snapshot
      label?: string; // e.g. "Grand Finals - Match 3"
    };
    config: {
      rules: ScoringRules;
      branding: BrandingConfig;
      mode: 'manual' | 'auto';
    };
    data: {
      matches: MatchData[]; // The Immutable Truth
    };
    analysis: {
      insights: Insight[];
    }
}

// Compatibility Types for UI Components
export type SortConfig = { key: keyof TeamData | 'aggressionIndex' | 'conversionRate'; direction: 'asc' | 'desc' } | null;