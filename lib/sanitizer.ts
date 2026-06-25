import { Workspace, Tournament, BrandingConfig, ScoringRules } from '../types';

const DEFAULT_BRANDING: BrandingConfig = {
  orgName: "FragLab",
  accentColor: "#ef4444",
};

const DEFAULT_SCORING_RULES: ScoringRules = {
  killMultiplier: 1,
  rankPoints: {
    1: 10, 2: 6, 3: 5, 4: 4, 5: 3, 6: 2, 7: 1, 8: 1
  },
  belowThresholdPoints: 0,
  activeMetrics: {
    kills: true,
    assists: true,
    damage: true,
    time: true,
  }
};

export const sanitizeColor = (color: string | undefined | null, defaultColor: string = "#ef4444"): string => {
  if (!color) return defaultColor;
  const trimmed = color.trim();
  if (trimmed === "" || trimmed === "#") return defaultColor;
  return trimmed;
};

export const generateId = (prefix: string = 'id'): string => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
};

export const sanitizeBranding = (branding: Partial<BrandingConfig> | undefined | null): BrandingConfig => {
  if (!branding) return DEFAULT_BRANDING;
  
  return {
    ...DEFAULT_BRANDING,
    ...branding,
    orgName: branding.orgName || DEFAULT_BRANDING.orgName,
    accentColor: sanitizeColor(branding.accentColor, DEFAULT_BRANDING.accentColor),
    // Strip massive base64 logos if they exceed a certain size to prevent memory crashes (e.g., > 500KB)
    logoUrl: branding.logoUrl && branding.logoUrl.length > 500000 ? undefined : branding.logoUrl,
    customBackground: branding.customBackground && branding.customBackground.length > 500000 ? undefined : branding.customBackground,
  };
};

export const sanitizeTournament = (tournament: any): Tournament => {
  return {
    ...tournament,
    id: tournament.id || generateId('tournament'),
    metadata: {
      name: tournament.metadata?.name || 'Unnamed Tournament',
      createdAt: tournament.metadata?.createdAt || Date.now(),
      lastModified: tournament.metadata?.lastModified || Date.now(),
    },
    rawMatches: Array.isArray(tournament.rawMatches) ? tournament.rawMatches : [],
    scoringRules: tournament.scoringRules || DEFAULT_SCORING_RULES,
    brandingConfig: sanitizeBranding(tournament.brandingConfig),
    insights: Array.isArray(tournament.insights) ? tournament.insights : [],
    workflowStep: tournament.workflowStep || 'ingestion',
    operationMode: tournament.operationMode || 'manual',
    isAutoInsightsEnabled: !!tournament.isAutoInsightsEnabled,
  };
};

export const sanitizeWorkspace = (workspace: any): Workspace => {
  if (!workspace) {
    return {
      version: '1.0',
      tournaments: [],
      activeTournamentId: null
    };
  }

  const sanitizedTournaments = Array.isArray(workspace.tournaments) 
    ? workspace.tournaments.map(sanitizeTournament) 
    : [];

  // Ensure activeTournamentId points to an existing tournament
  let activeId = workspace.activeTournamentId;
  if (activeId && !sanitizedTournaments.some(t => t.id === activeId)) {
    activeId = sanitizedTournaments.length > 0 ? sanitizedTournaments[0].id : null;
  } else if (!activeId && sanitizedTournaments.length > 0) {
    activeId = sanitizedTournaments[0].id;
  }

  return {
    version: workspace.version || '1.0',
    tournaments: sanitizedTournaments,
    activeTournamentId: activeId
  };
};
