
import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import Layout from './components/Layout';
import DataInput from './components/DataInput';
import PointsTable from './components/PointsTable';
import Analytics from './components/Analytics';
import AIInsights from './components/AIInsights';
import HallOfFame from './components/HallOfFame';
import Faceoff from './components/Faceoff';
import TeamProfile from './components/TeamProfile';
import PlayerProfile from './components/PlayerProfile';
import OperatorLeaderboard from './components/OperatorLeaderboard';
import CommissionerModal from './components/CommissionerModal';
import BroadcastStudio from './components/BroadcastStudio';
import AgencySettings from './components/AgencySettings'; 
import PressKitModal from './components/PressKitModal';
import WinnerShowcase from './components/WinnerShowcase';
import MVPHighlight from './components/MVPHighlight';
import { TournamentMVP } from './components/mvp/TournamentMVP';
import DataNexus from './components/DataNexus'; 
import PredictionWidget from './components/PredictionWidget'; 
import MatchList from './components/MatchList'; // Imported MatchList
import SearchBar from './components/SearchBar';
import { TeamData, Insight, MatchData, ScoringRules, PlayerDerived, BrandingConfig, Snapshot } from './types';
import { generateInsights } from './services/gemini';
import { aggregateTournamentStats, DEFAULT_SCORING_RULES, recalculateMatchScores } from './services/analyticsEngine';
import { Loader2, Shield, LayoutGrid, Sword, Download, FileSpreadsheet, FileSpreadsheet as TableIcon, FileJson, Image, Share2, Settings, Calendar, ChevronDown, Trophy, BrainCircuit, Zap, Power, Upload, Save, MonitorPlay, Building2, FileText, Copy, Table, Eye, EyeOff, Database, History, Lock, LogOut, LayoutTemplate, User, Swords, Crosshair } from 'lucide-react';
import { utils, writeFile } from 'xlsx';
import { ExportMode } from './components/ExportRenderer';
import { generateSnapshot } from './services/exportEngine';

import LiveMatchLab from './components/LiveMatchLab';

// Type for View Control
type ViewScope = 
  | { type: 'tournament' }
  | { type: 'day', day: number }
  | { type: 'match', matchId: string };

type ActiveView = 
  | { type: 'dashboard' }
  | { type: 'team', teamName: string }
  | { type: 'player', playerName: string, teamName: string, from: 'dashboard' | 'team' }
  | { type: 'mvp' }
  | { type: 'live-lab' };

const DEFAULT_BRANDING: BrandingConfig = {
    orgName: 'ScarFall Analytics',
    accentColor: '#ef4444',
};

const App: React.FC = () => {
  const [workflowStep, setWorkflowStep] = useState<'ingestion' | 'analysis'>('ingestion');
  const [operationMode, setOperationMode] = useState<'manual' | 'auto'>('manual');
  
  // Store raw matches to allow switching views
  const [rawMatches, setRawMatches] = useState<MatchData[]>([]);
  
  // Filter/View State
  const [viewScope, setViewScope] = useState<ViewScope>({ type: 'tournament' });
  const [activeView, setActiveView] = useState<ActiveView>({ type: 'dashboard' });

  const [insights, setInsights] = useState<Insight[]>([]);
  
  // Scoring & Settings State
  const [scoringRules, setScoringRules] = useState<ScoringRules>(DEFAULT_SCORING_RULES);
  const [brandingConfig, setBrandingConfig] = useState<BrandingConfig>(DEFAULT_BRANDING);
  
  // Modals
  const [isRulesOpen, setIsRulesOpen] = useState(false);
  const [isStudioOpen, setIsStudioOpen] = useState(false);
  const [studioMode, setStudioMode] = useState<ExportMode>('standings'); 
  // Studio Context state
  const [studioFocusTeam, setStudioFocusTeam] = useState<string | undefined>(undefined);
  const [studioFocusPlayer, setStudioFocusPlayer] = useState<string | undefined>(undefined);

  const [isAgencyOpen, setIsAgencyOpen] = useState(false);
  const [isPressKitOpen, setIsPressKitOpen] = useState(false);
  const [isNexusOpen, setIsNexusOpen] = useState(false); 
  
  // AI Analyst State
  const [isAutoInsightsEnabled, setIsAutoInsightsEnabled] = useState(false);
  
  // Snapshot / History Mode
  const [isSnapshotMode, setIsSnapshotMode] = useState(false);
  const [snapshotMeta, setSnapshotMeta] = useState<{ version: string, timestamp: number, hash: string } | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Load Input Ref
  const loadInputRef = useRef<HTMLInputElement>(null);

  // --- BROWSER HISTORY INTEGRATION ---
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
        if (event.state) {
            setActiveView(event.state);
        } else {
            setActiveView({ type: 'dashboard' });
        }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigateTo = (view: ActiveView) => {
      setActiveView(view);
      window.history.pushState(view, '');
  };

  // --- ESCAPE KEY LISTENER ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsRulesOpen(false);
        setIsStudioOpen(false);
        setIsAgencyOpen(false);
        setIsPressKitOpen(false);
        setIsNexusOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // --- DATA COMPUTATION ---

  // Derived data based on selection AND scoring rules
  // Returns both the Aggregated Team Data and the Filtered Match List
  const { displayData: currentDisplayData, filteredMatches: currentFilteredMatches } = useMemo(() => {
    // 1. Recalculate specific match scores based on current rules
    const recalculatedMatches = recalculateMatchScores(rawMatches, scoringRules);
    
    // 2. Filter Matches based on Scope
    let filteredMatches: MatchData[] = [];

    if (viewScope.type === 'tournament') {
        filteredMatches = recalculatedMatches;
    } 
    else if (viewScope.type === 'day') {
        filteredMatches = recalculatedMatches.filter(m => m.day === viewScope.day);
    } 
    else if (viewScope.type === 'match') {
        const match = recalculatedMatches.find(m => m.id === viewScope.matchId);
        filteredMatches = match ? [match] : [];
    }
    
    // 3. Aggregate based on filtered matches
    // Note: If viewScope is 'match', we still use aggregateTournamentStats to get TeamData format
    const displayData = aggregateTournamentStats(filteredMatches);

    return { displayData, filteredMatches };
  }, [viewScope, rawMatches, scoringRules]);

  // Compute available Days and Matches for UI selectors
  const structure = useMemo(() => {
      const days = Array.from<number>(new Set(rawMatches.map(m => m.day))).sort((a, b) => a - b);
      const matchesByDay: Record<number, MatchData[]> = {};
      days.forEach(d => {
          matchesByDay[d] = rawMatches.filter(m => m.day === d).sort((a,b) => a.matchInDay - b.matchInDay);
      });
      return { days, matchesByDay };
  }, [rawMatches]);

  // --- EFFECTS ---

  // Validate Active View when Data/Scope changes
  useEffect(() => {
      if (activeView.type === 'team') {
          const exists = currentDisplayData.find(t => t.name === activeView.teamName);
          if (!exists && currentDisplayData.length > 0) {
              // Only redirect if data exists but team is missing (e.g. filtered out)
              setActiveView({ type: 'dashboard' }); 
          }
      }
      if (activeView.type === 'player') {
          const team = currentDisplayData.find(t => t.name === activeView.teamName);
          if (team) {
              const playerExists = team.players.some(p => p.playerName === activeView.playerName);
              if (!playerExists) setActiveView({ type: 'team', teamName: activeView.teamName });
          } else if (currentDisplayData.length > 0) {
              setActiveView({ type: 'dashboard' });
          }
      }
  }, [currentDisplayData, activeView]);

  const handleLoading = (loading: boolean, message: string) => {
    setIsLoading(loading);
    setLoadingMessage(message);
  };

  const generateInsightsForData = async (data: TeamData[]) => {
    if (!data || data.length === 0 || operationMode === 'manual') return;
    setIsAnalyzing(true);
    try {
      const newInsights = await generateInsights(data);
      setInsights(newInsights);
    } catch (e) {
      console.error("Failed to generate insights", e);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Effect to manage Auto-Insights behavior
  useEffect(() => {
    if (operationMode === 'manual' && !isSnapshotMode) {
        setIsAutoInsightsEnabled(false);
        setInsights([]);
        return;
    }

    if (isAutoInsightsEnabled && currentDisplayData.length > 0 && activeView.type === 'dashboard' && !isSnapshotMode) {
      generateInsightsForData(currentDisplayData);
    } else if (!isSnapshotMode) {
      setInsights([]); 
    }
  }, [isAutoInsightsEnabled, currentDisplayData, operationMode, activeView, isSnapshotMode]); 

  const handleDataLoaded = useCallback(async (matches: MatchData[]) => {
    if (matches.length > 0) {
        handleLoading(true, "Aggregating Tournament Data...");
        setRawMatches(matches);
    }
    setWorkflowStep('analysis');
    handleLoading(false, "");
  }, []);

  const handleScopeChange = (scope: ViewScope) => {
    setViewScope(scope);
  };

  const handleReset = () => {
    if(confirm("Are you sure you want to reset the current operation? All unsaved data will be lost.")) {
      setWorkflowStep('ingestion');
      setRawMatches([]);
      setViewScope({ type: 'tournament' });
      setActiveView({ type: 'dashboard' });
      setInsights([]);
      setIsAnalyzing(false);
      setScoringRules(DEFAULT_SCORING_RULES);
      setIsAutoInsightsEnabled(false); 
      setIsSnapshotMode(false);
      setSnapshotMeta(null);
      window.history.pushState(null, '', window.location.pathname); // Clear history
    }
  };

  const handleTeamClick = (team: TeamData) => {
    navigateTo({ type: 'team', teamName: team.name });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePlayerClick = (player: PlayerDerived, teamName?: string, from: 'dashboard' | 'team' = 'dashboard') => {
    const tName = teamName || (activeView.type === 'team' ? activeView.teamName : player.teamName);
    navigateTo({ type: 'player', playerName: player.playerName, teamName: tName, from });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Studio Launcher
  const handleOpenStudio = (mode: ExportMode, context?: { teamId?: string, playerName?: string }) => {
      setStudioMode(mode);
      setStudioFocusTeam(undefined);
      setStudioFocusPlayer(undefined);
      
      if (context?.teamId) setStudioFocusTeam(context.teamId);
      if (context?.playerName) setStudioFocusPlayer(context.playerName);
      
      setIsStudioOpen(true);
  };

  // --- SAVE / LOAD STATE ---
  const handleExportState = () => {
      const stateToSave = {
          version: '1.2',
          timestamp: Date.now(),
          mode: operationMode,
          rules: scoringRules,
          branding: brandingConfig,
          data: rawMatches,
          autoInsights: isAutoInsightsEnabled,
          insights: insights
      };
      
      const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(stateToSave, null, 2))}`;
      const link = document.createElement("a");
      link.href = jsonString;
      link.download = `scarfall_${brandingConfig.orgName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.json`;
      link.click();
  };
  
  // --- PUBLISH SNAPSHOT ---
  const handlePublishSnapshot = () => {
      if (!rawMatches.length) return;
      const jsonContent = generateSnapshot(rawMatches, scoringRules, brandingConfig, insights, operationMode, `Full Export ${new Date().toLocaleDateString()}`);
      
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(jsonContent);
      const link = document.createElement("a");
      link.setAttribute("href", dataStr);
      link.setAttribute("download", `SNAPSHOT_${brandingConfig.orgName.replace(/\s+/g, '_')}_${Date.now()}.json`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  const handleLoadState = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
          try {
              const json = JSON.parse(event.target?.result as string);
              
              if (json.meta && json.meta.type === 'SCARFALL_SNAPSHOT') {
                  const snapshot = json as Snapshot;
                  setRawMatches(snapshot.data.matches);
                  setScoringRules(snapshot.config.rules);
                  setBrandingConfig(snapshot.config.branding);
                  setOperationMode(snapshot.config.mode);
                  setInsights(snapshot.analysis.insights || []);
                  
                  setIsSnapshotMode(true);
                  setSnapshotMeta({ 
                      version: snapshot.meta.version, 
                      timestamp: snapshot.meta.timestamp, 
                      hash: snapshot.meta.hash 
                  });
                  
                  setWorkflowStep('analysis');
                  setViewScope({ type: 'tournament' });
                  alert(`Snapshot Loaded: ${snapshot.meta.label || 'Archive'}`);
                  return;
              }

              if (!json.data || !Array.isArray(json.data)) {
                  alert("Invalid save file: Missing match data.");
                  return;
              }

              setOperationMode(json.mode || 'manual');
              setScoringRules(json.rules || DEFAULT_SCORING_RULES);
              if (json.branding) setBrandingConfig(json.branding);
              if (json.autoInsights !== undefined) setIsAutoInsightsEnabled(json.autoInsights);
              if (json.insights) setInsights(json.insights);

              const migratedMatches: MatchData[] = json.data.map((m: MatchData) => ({
                  ...m,
                  teams: m.teams.map(t => ({
                      ...t,
                      players: t.players.map(p => ({
                          ...p,
                          kpm: p.kpm ?? p.kills,
                          matchesPlayed: p.matchesPlayed ?? 1
                      }))
                  }))
              }));

              setRawMatches(migratedMatches);
              setWorkflowStep('ingestion'); 
              setViewScope({ type: 'tournament' });
              setActiveView({ type: 'dashboard' });
              setIsSnapshotMode(false);
              setSnapshotMeta(null);
              
              const ver = json.version || '1.0';
              alert(`Session loaded successfully (v${ver}). ${migratedMatches.length} matches restored.`);

          } catch (err) {
              console.error(err);
              alert("Failed to parse save file. Ensure it is a valid ScarFall JSON.");
          }
      };
      reader.readAsText(file);
      if (loadInputRef.current) loadInputRef.current.value = '';
  };

  const toggleMode = () => {
      setOperationMode(prev => prev === 'manual' ? 'auto' : 'manual');
  };

  const activeTeamData = activeView.type === 'team' || activeView.type === 'player' 
     ? currentDisplayData.find(t => t.name === activeView.teamName) 
     : null;

  const activePlayerData = activeView.type === 'player' && activeTeamData
     ? activeTeamData.players.find(p => p.playerName === activeView.playerName)
     : null;

  const getIngestionContext = () => {
      if (viewScope.type === 'day') return { day: viewScope.day, match: 1 };
      if (viewScope.type === 'match') {
          const parts = viewScope.matchId.match(/d(\d+)-m(\d+)/);
          if (parts) return { day: parseInt(parts[1]), match: parseInt(parts[2]) };
      }
      return {};
  };
  const ingestionContext = getIngestionContext();

  const StudioShortcut = ({ icon, label, onClick }: { icon: React.ReactNode, label: string, onClick: () => void }) => (
     <button onClick={onClick} className="flex flex-col items-center justify-center p-4 bg-tactical-dark border border-tactical-gray rounded-sm hover:border-tactical-light hover:bg-white/5 transition-all group">
         <div className="p-3 bg-black rounded-full mb-3 text-white group-hover:scale-110 transition-transform">
             {icon}
         </div>
         <span className="text-[10px] font-bold uppercase tracking-widest text-tactical-light group-hover:text-white">{label}</span>
     </button>
  );

  return (
    <div className="relative">
      <Layout 
        step={workflowStep} 
        onReset={handleReset} 
        mode={operationMode} 
        onToggleMode={toggleMode}
        activeView={activeView}
        onNavigate={navigateTo}
        onOpenStudio={() => handleOpenStudio('standings')}
        search={
          <SearchBar 
            teams={currentDisplayData} 
            onTeamClick={handleTeamClick} 
            onPlayerClick={(p, t) => handlePlayerClick(p, t, 'dashboard')} 
          />
        }
      >
        
        {isLoading && (
          <div className="fixed inset-0 bg-tactical-black/90 backdrop-blur-md z-50 flex flex-col items-center justify-center gap-6 animate-in fade-in duration-300">
            <div className="relative">
              <div className="absolute inset-0 bg-tactical-red/20 rounded-full animate-ping"></div>
              <Loader2 className="w-12 h-12 animate-spin text-tactical-red relative z-10" />
            </div>
            <div className="text-center space-y-2">
              <h3 className="font-serif text-xl font-bold text-white">{loadingMessage}</h3>
              <p className="font-mono text-xs text-tactical-light uppercase tracking-widest">Processing Intelligence</p>
            </div>
          </div>
        )}

        {isSnapshotMode && snapshotMeta && (
            <div className="fixed top-20 left-1/2 -translate-x-1/2 z-40 bg-black/90 border border-tactical-red text-white px-6 py-2 rounded-full flex items-center gap-4 shadow-2xl animate-in slide-in-from-top-4">
                <History className="w-4 h-4 text-tactical-red animate-pulse" />
                <div className="flex flex-col">
                    <span className="text-xs font-bold uppercase tracking-widest text-tactical-red">Archive Mode Active</span>
                    <span className="text-[10px] text-tactical-light font-mono">Snapshot: {new Date(snapshotMeta.timestamp).toLocaleString()} • ID: {snapshotMeta.hash}</span>
                </div>
                <button 
                    onClick={handleReset} 
                    className="ml-2 p-1.5 hover:bg-tactical-red hover:text-white rounded-full transition-colors text-tactical-light"
                    title="Exit Archive Mode"
                >
                    <LogOut className="w-3 h-3" />
                </button>
            </div>
        )}

        <CommissionerModal 
          isOpen={isRulesOpen} 
          onClose={() => setIsRulesOpen(false)}
          currentRules={scoringRules}
          onSave={setScoringRules}
        />

        <AgencySettings
          isOpen={isAgencyOpen}
          onClose={() => setIsAgencyOpen(false)}
          config={brandingConfig}
          onSave={setBrandingConfig}
          teams={currentDisplayData}
        />

        <BroadcastStudio 
          isOpen={isStudioOpen}
          onClose={() => setIsStudioOpen(false)}
          data={currentDisplayData}
          defaultTitle={getExportMetadata(viewScope).title}
          defaultSubtitle={getExportMetadata(viewScope).subtitle}
          branding={brandingConfig}
          initialMode={studioMode}
          initialFocusTeamId={studioFocusTeam}
          initialFocusPlayerName={studioFocusPlayer}
        />

        <PressKitModal
          isOpen={isPressKitOpen}
          onClose={() => setIsPressKitOpen(false)}
          data={currentDisplayData}
          branding={brandingConfig}
          insights={insights}
        />

        <DataNexus 
           isOpen={isNexusOpen}
           onClose={() => setIsNexusOpen(false)}
           data={currentDisplayData}
           matches={currentFilteredMatches} // Pass filtered matches for scoped exports
           branding={brandingConfig}
        />

        {workflowStep === 'ingestion' && (
          <div className="flex flex-col items-center justify-center min-h-[70vh] w-full max-w-5xl mx-auto">
            <div className="text-center mb-12 space-y-4 animate-in slide-in-from-bottom-4 fade-in duration-700">
              <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-sm border text-[10px] font-mono uppercase tracking-widest mb-4 ${operationMode === 'auto' ? 'bg-tactical-dark border-tactical-gray text-tactical-green' : 'bg-tactical-dark border-tactical-gray text-tactical-light'}`}>
                  <Shield className="w-3 h-3" /> {operationMode === 'auto' ? 'Secure Environment' : 'Offline / Manual Input'}
              </div>
              <h2 className="text-3xl md:text-6xl font-serif font-bold text-white leading-tight">
                {brandingConfig.orgName}
              </h2>
              <p className="text-tactical-light max-w-lg mx-auto leading-relaxed text-xs md:text-base font-sans px-4">
                Tactical telemetry ingestion engine. Process competitive data via {operationMode === 'auto' ? 'Gemini AI' : 'Manual CSV'} to generate predicted dominance metrics and rotation analysis.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-6 px-4">
                 <button 
                    onClick={handlePublishSnapshot}
                    disabled={rawMatches.length === 0}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-tactical-dark border border-tactical-red/50 text-tactical-red rounded-sm text-[10px] sm:text-xs font-bold uppercase tracking-wider hover:bg-tactical-red hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Export Read-Only Snapshot"
                 >
                    <History className="w-4 h-4" /> Publish Snapshot
                 </button>

                 <div className="hidden sm:block w-px h-8 bg-tactical-gray mx-2"></div>

                 <button 
                    onClick={handleExportState}
                    disabled={rawMatches.length === 0}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-tactical-dark border border-tactical-gray rounded-sm text-[10px] sm:text-xs font-bold uppercase tracking-wider text-tactical-light hover:text-white hover:border-white disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                 >
                    <Save className="w-4 h-4" /> Save Work
                 </button>
                 <div className="relative w-full sm:w-auto">
                    <button 
                       onClick={() => loadInputRef.current?.click()}
                       className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-white text-black rounded-sm text-[10px] sm:text-xs font-bold uppercase tracking-wider hover:bg-tactical-light transition-all"
                    >
                       <Upload className="w-4 h-4" /> Load State
                    </button>
                    <input 
                       type="file" 
                       ref={loadInputRef} 
                       className="hidden" 
                       accept=".json"
                       onChange={handleLoadState}
                    />
                 </div>
              </div>
            </div>
            
            <div className="w-full">
              <DataInput 
                initialData={rawMatches} 
                onDataLoaded={handleDataLoaded} 
                onLoading={handleLoading} 
                mode={operationMode}
                initialDay={ingestionContext.day}
                initialMatch={ingestionContext.match}
                readOnly={isSnapshotMode}
              />
            </div>
          </div>
        )}

        {workflowStep === 'analysis' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
              {/* Mission Header & Controls */}
              <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-6 border-b border-tactical-gray pb-6">
                  <div>
                    <h2 className="font-serif text-2xl font-bold text-white flex items-center gap-3">
                       {viewScope.type === 'tournament' && <><Trophy className="w-6 h-6 text-yellow-500" /> FULL EVENT STANDINGS</>}
                       {viewScope.type === 'day' && <><Calendar className="w-6 h-6 text-tactical-red" /> DAY {viewScope.day} SUMMARY</>}
                       {viewScope.type === 'match' && <><Sword className="w-6 h-6 text-tactical-light" /> MATCH {viewScope.matchId} RESULTS</>}
                       {isSnapshotMode && <span className="ml-2 text-xs bg-tactical-red text-white px-2 py-1 rounded-full uppercase tracking-widest font-bold">Archive</span>}
                    </h2>
                    <p className="text-sm text-tactical-light font-mono mt-1">
                        Displaying {currentDisplayData.length} Teams • {
                            viewScope.type === 'tournament' ? 'Cumulative Data' : 
                            viewScope.type === 'day' ? 'Day Aggregation' : 'Single Match Scoreboard'
                        }
                    </p>
                  </div>
                  
                  <div className="flex flex-col gap-4">
                      {/* --- Level 1: Scope Selector (Improved Navigation) --- */}
                      <div className="flex items-center gap-1 bg-black border border-tactical-gray rounded-sm p-1 self-start md:self-end">
                        <button
                            onClick={() => handleScopeChange({ type: 'tournament' })}
                            className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-sm transition-all flex items-center gap-2 ${viewScope.type === 'tournament' ? 'bg-tactical-white text-black shadow-sm' : 'text-tactical-light hover:text-white hover:bg-white/5'}`}
                        >
                           <Trophy className="w-3 h-3" /> All
                        </button>
                        <div className="w-px h-6 bg-tactical-gray mx-1"></div>
                        {structure.days.map(d => (
                            <button 
                                key={d}
                                onClick={() => handleScopeChange({ type: 'day', day: d })}
                                className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-sm transition-all flex items-center gap-2 ${viewScope.type === 'day' && viewScope.day === d ? 'bg-tactical-red text-white shadow-sm shadow-red-900/20' : 'text-tactical-light hover:text-white hover:bg-white/5'}`}
                            >
                                <Calendar className="w-3 h-3" /> Day {d}
                            </button>
                        ))}
                      </div>
                      
                      {/* --- Level 2: Tools --- */}
                      <div className="flex flex-wrap items-center justify-end gap-4 mt-2">
                         <button 
                            onClick={() => setWorkflowStep('ingestion')}
                            className={`flex items-center gap-2 text-[10px] uppercase font-bold tracking-widest transition-all px-3 py-1.5 rounded-sm border bg-tactical-dark border-tactical-gray text-tactical-light hover:text-white hover:border-white ${isSnapshotMode ? 'opacity-50 pointer-events-none' : ''}`}
                            title={isSnapshotMode ? "Editing disabled in Archive Mode" : "Edit Data"}
                         >
                            {isSnapshotMode ? <Lock className="w-3 h-3" /> : <Upload className="w-3 h-3" />}
                            Edit Source
                         </button>

                         <div className="w-px h-3 bg-tactical-gray hidden sm:block"></div>

                         <button 
                            onClick={() => operationMode === 'auto' && !isSnapshotMode && setIsAutoInsightsEnabled(!isAutoInsightsEnabled)}
                            disabled={operationMode === 'manual' || isSnapshotMode}
                            className={`flex items-center gap-2 text-[10px] uppercase font-bold tracking-widest transition-all px-3 py-1.5 rounded-sm border ${
                                (operationMode === 'manual' || isSnapshotMode) ? 'bg-tactical-dark border-tactical-gray text-tactical-gray opacity-50 cursor-not-allowed' :
                                isAutoInsightsEnabled ? 'bg-tactical-green/10 border-tactical-green text-tactical-green' : 'bg-tactical-dark border-tactical-gray text-tactical-light hover:border-white'
                            }`}
                         >
                            {isAutoInsightsEnabled ? <BrainCircuit className="w-3 h-3 animate-pulse" /> : <Power className="w-3 h-3" />}
                            AI Analyst
                         </button>

                         <div className="w-px h-3 bg-tactical-gray hidden sm:block"></div>

                         <button onClick={() => setIsRulesOpen(true)} disabled={isSnapshotMode} className={`text-tactical-light hover:text-white flex items-center gap-1 text-[10px] uppercase font-bold tracking-widest ${isSnapshotMode ? 'opacity-50 cursor-not-allowed' : ''}`}><Settings className="w-3 h-3" /> Rules</button>
                         <button onClick={() => setIsAgencyOpen(true)} disabled={isSnapshotMode} className={`text-tactical-light hover:text-white flex items-center gap-1 text-[10px] uppercase font-bold tracking-widest ${isSnapshotMode ? 'opacity-50 cursor-not-allowed' : ''}`}><Building2 className="w-3 h-3" /> Agency</button>
                         
                         <div className="w-px h-3 bg-tactical-gray hidden sm:block"></div>
                         
                         <div className="flex gap-1">
                            <button 
                                onClick={() => setIsNexusOpen(true)} 
                                title="Open Data Nexus (Excel/CSV Exports)" 
                                className="px-3 py-1.5 bg-tactical-dark border border-tactical-gray rounded-sm hover:bg-white/10 transition-colors flex items-center gap-2"
                            >
                                <Database className="w-3 h-3 text-white" />
                                <span className="text-[10px] font-bold uppercase tracking-widest text-white">Export Data</span>
                            </button>
                         </div>
                         <div className="flex gap-1">
                             <button 
                                onClick={() => handleOpenStudio('standings')}
                                className="px-3 py-1.5 bg-tactical-dark text-white border border-tactical-gray rounded-sm text-[10px] font-bold uppercase tracking-wider hover:bg-white/10 transition-all flex items-center gap-2"
                                title="PNG Studio"
                             >
                                <MonitorPlay className="w-3 h-3" />
                             </button>
                             <button 
                                onClick={() => setIsPressKitOpen(true)}
                                className="px-3 py-1.5 bg-tactical-white text-black border border-white rounded-sm text-[10px] font-bold uppercase tracking-wider hover:bg-tactical-light hover:text-white hover:border-tactical-light transition-all flex items-center gap-2"
                                title="PDF Brief"
                             >
                                <FileText className="w-3 h-3" /> Brief
                             </button>
                         </div>
                      </div>
                  </div>
              </div>
              
              {activeView.type === 'dashboard' && (
                <>
                  {/* STUDIO SHORTCUTS */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                     <StudioShortcut 
                        icon={<LayoutTemplate className="w-6 h-6"/>} 
                        label="Standings Generator" 
                        onClick={() => handleOpenStudio('standings')} 
                     />
                     <StudioShortcut 
                        icon={<User className="w-6 h-6"/>} 
                        label="Player Card" 
                        onClick={() => handleOpenStudio('mvp')} 
                     />
                     <StudioShortcut 
                        icon={<Swords className="w-6 h-6"/>} 
                        label="Faceoff Builder" 
                        onClick={() => handleOpenStudio('faceoff')} 
                     />
                     <StudioShortcut 
                        icon={<Crosshair className="w-6 h-6"/>} 
                        label="Top Fraggers" 
                        onClick={() => handleOpenStudio('top_fraggers')} 
                     />
                     <StudioShortcut 
                        icon={<Trophy className="w-6 h-6"/>} 
                        label="MVP Presentation" 
                        onClick={() => navigateTo({ type: 'mvp' })} 
                     />
                     <StudioShortcut 
                        icon={<MonitorPlay className="w-6 h-6 text-red-500"/>} 
                        label="Live Match Lab" 
                        onClick={() => navigateTo({ type: 'live-lab' })} 
                     />
                  </div>

                  {/* TOP ROW: Winner & MVP */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                      <div className="md:col-span-2">
                          <WinnerShowcase 
                              data={currentDisplayData} 
                              onOpenStudio={() => handleOpenStudio('winner')}
                              onTeamClick={handleTeamClick}
                          />
                      </div>
                      <div className="md:col-span-1">
                          <MVPHighlight 
                              data={currentDisplayData}
                              onOpenStudio={() => handleOpenStudio('mvp')}
                              onPlayerClick={(p, t) => handlePlayerClick(p, t, 'dashboard')}
                          />
                      </div>
                  </div>

                  <HallOfFame 
                    data={currentDisplayData} 
                    onPlayerClick={(p, t) => handlePlayerClick(p, t, 'dashboard')} 
                    onOpenStudio={() => handleOpenStudio('hall_of_fame')}
                  />
                  
                  <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                    <div className="xl:col-span-2 space-y-8">
                      {isAutoInsightsEnabled && operationMode === 'auto' && !isSnapshotMode && (
                          <AIInsights insights={insights} isLoading={isAnalyzing} />
                      )}
                      {/* Show Insights in Snapshot Mode if available */}
                      {isSnapshotMode && insights.length > 0 && (
                          <AIInsights insights={insights} isLoading={false} />
                      )}

                      {/* Display Filtered Match List */}
                      <MatchList 
                          matches={currentFilteredMatches}
                          activeMatchId={viewScope.type === 'match' ? viewScope.matchId : undefined}
                          onMatchClick={(matchId) => handleScopeChange({ type: 'match', matchId })}
                      />

                      {(!isAutoInsightsEnabled || operationMode === 'manual') && !isSnapshotMode && (
                          <div className="p-6 bg-tactical-dark border border-tactical-gray rounded-sm border-dashed flex flex-col items-center justify-center text-center opacity-60 hover:opacity-100 transition-opacity mb-8">
                              <BrainCircuit className="w-8 h-8 text-tactical-light mb-2" />
                              <h4 className="text-white font-bold text-sm uppercase">{operationMode === 'manual' ? 'System Offline' : 'AI Analyst Standby'}</h4>
                              <p className="text-xs text-tactical-light font-mono mt-1 max-w-xs">
                                {operationMode === 'manual' 
                                  ? "AI features are disabled in Manual Mode. Switch to Online Mode in the header to activate prediction engine." 
                                  : "Enable the AI Analyst in the toolbar to generate tactical insights and predictions for this view."}
                              </p>
                              {operationMode === 'auto' && (
                                <button 
                                    onClick={() => setIsAutoInsightsEnabled(true)}
                                    className="mt-4 px-4 py-2 bg-white/5 border border-white/10 hover:bg-white/10 text-white text-xs font-bold uppercase rounded-sm transition-all"
                                >
                                    Activate Neural Engine
                                </button>
                              )}
                          </div>
                      )}
                      <Analytics 
                        data={currentDisplayData} 
                        onPlayerClick={(p) => handlePlayerClick(p, undefined, 'dashboard')}
                      />
                    </div>
                    <div className="xl:col-span-1">
                      <Faceoff 
                        data={currentDisplayData} 
                        onOpenStudio={() => handleOpenStudio('faceoff')}
                      />
                      {/* PREDICTION WIDGET (MOVED HERE) */}
                      {viewScope.type === 'tournament' && (
                          <PredictionWidget data={currentDisplayData} />
                      )}
                    </div>
                  </div>

                  <PointsTable 
                    data={currentDisplayData} 
                    onTeamClick={handleTeamClick}
                    onPlayerClick={(p) => handlePlayerClick(p, undefined, 'dashboard')}
                    onOpenStudio={() => handleOpenStudio('standings')}
                  />

                  {/* OPERATOR LEADERBOARD (Always Visible) */}
                  <div className="mt-12">
                      <OperatorLeaderboard 
                        data={currentDisplayData}
                        onPlayerClick={(p, t) => handlePlayerClick(p, t, 'dashboard')}
                        onOpenStudio={() => handleOpenStudio('player_leaderboard')}
                      />
                  </div>
                </>
              )}

              {activeView.type === 'team' && activeTeamData && (
                <TeamProfile 
                   team={activeTeamData} 
                   onBack={() => navigateTo({ type: 'dashboard' })} 
                   onPlayerClick={(p) => handlePlayerClick(p, undefined, 'team')} 
                   onOpenStudio={() => handleOpenStudio('team_profile', { teamId: activeTeamData.name })}
                />
              )}

              {activeView.type === 'player' && activePlayerData && activeTeamData && (
                 <PlayerProfile 
                    player={activePlayerData}
                    team={activeTeamData}
                    onBack={() => {
                        if (activeView.from === 'team') {
                            navigateTo({ type: 'team', teamName: activeTeamData.name });
                        } else {
                            navigateTo({ type: 'dashboard' });
                        }
                    }}
                    onOpenStudio={() => handleOpenStudio('player_profile', { teamId: activeTeamData.name, playerName: activePlayerData.playerName })}
                 />
              )}

              {activeView.type === 'mvp' && (
                  <div className="relative z-10 min-h-screen bg-black">
                      <button 
                          onClick={() => navigateTo({ type: 'dashboard' })}
                          className="absolute top-4 left-4 z-50 px-4 py-2 bg-black/50 text-white rounded-sm hover:bg-black transition-colors text-xs font-bold uppercase tracking-widest border border-white/20"
                      >
                          ← Back
                      </button>
                      <TournamentMVP data={currentDisplayData} branding={brandingConfig} />
                  </div>
              )}

              {activeView.type === 'live-lab' && (
                  <div className="relative z-10 min-h-screen bg-black">
                      <button 
                          onClick={() => navigateTo({ type: 'dashboard' })}
                          className="absolute top-4 left-4 z-50 px-4 py-2 bg-black/50 text-white rounded-sm hover:bg-black transition-colors text-xs font-bold uppercase tracking-widest border border-white/20"
                      >
                          ← Back
                      </button>
                      <LiveMatchLab 
                        branding={brandingConfig} 
                        currentTeams={currentDisplayData}
                      />
                  </div>
              )}
          </div>
        )}
      </Layout>
    </div>
  );
};

// Helper for metadata (title/subtitle for exports)
const getExportMetadata = (viewScope: ViewScope) => {
    if (viewScope.type === 'tournament') return { title: 'Tournament Standings', subtitle: 'Grand Finals - Cumulative' };
    if (viewScope.type === 'day') return { title: `Day ${viewScope.day} Standings`, subtitle: 'Daily Aggregation' };
    if (viewScope.type === 'match') return { title: `Match ${viewScope.matchId} Results`, subtitle: 'Match Report' };
    return { title: 'Standings', subtitle: 'Report' };
};

export default App;
