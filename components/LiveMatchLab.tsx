import React, { useState, useEffect, useMemo, useRef } from 'react';
import { toPng } from 'html-to-image';
import { 
  Shield, 
  Skull, 
  Trophy, 
  RotateCcw, 
  Download, 
  Trash2, 
  ChevronUp, 
  ChevronDown, 
  AlertTriangle,
  HeartPulse,
  Users,
  Swords,
  Save,
  MonitorPlay,
  Keyboard
} from 'lucide-react';
import { cn } from '@/lib/utils';

import { BrandingConfig, TeamData } from '../types';

// --- TYPES ---
interface TeamState {
  id: string;
  name: string;
  kills: number;
  playersAlive: number; // 0-4
  logoUrl?: string;
  tournamentPoints: number; // Points before this match
}

type EliminationStack = string[]; // index 0 = first to die (Rank 16), last index = last to die (Rank 1)

interface LiveState {
  teams: TeamState[];
  eliminationStack: EliminationStack;
  matchId: string;
}

interface LiveMatchLabProps {
  branding?: BrandingConfig;
  currentTeams?: TeamData[];
}

// --- CONFIG ---
const PLACEMENT_POINTS: Record<number, number> = {
  1: 15, 2: 12, 3: 10, 4: 8, 5: 6, 6: 4, 7: 2, 8: 1,
  9: 0, 10: 0, 11: 0, 12: 0, 13: 0, 14: 0, 15: 0, 16: 0
};

const CombatLink: React.FC<{ 
  attackerId: string; 
  victimId: string; 
  containerRef: React.RefObject<HTMLDivElement> 
}> = ({ attackerId, victimId, containerRef }) => {
  const [points, setPoints] = useState<{ x1: number, y1: number, x2: number, y2: number } | null>(null);

  useEffect(() => {
    const update = () => {
      if (!containerRef.current) return;
      const attacker = document.getElementById(attackerId);
      const victim = document.getElementById(victimId);
      if (!attacker || !victim) return;

      const rect = containerRef.current.getBoundingClientRect();
      const aRect = attacker.getBoundingClientRect();
      const vRect = victim.getBoundingClientRect();

      setPoints({
        x1: aRect.left - rect.left + aRect.width / 2,
        y1: aRect.top - rect.top + aRect.height / 2,
        x2: vRect.left - rect.left + vRect.width / 2,
        y2: vRect.top - rect.top + vRect.height / 2,
      });
    };

    update();
    const timer = setInterval(update, 100); // Poll for layout changes
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('resize', update);
      clearInterval(timer);
    };
  }, [attackerId, victimId, containerRef]);

  if (!points) return null;

  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible z-0">
      <defs>
        <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orientation="auto">
          <polygon points="0 0, 10 3.5, 0 7" fill="#ef4444" />
        </marker>
      </defs>
      <line 
        x1={points.x1} y1={points.y1} 
        x2={points.x2} y2={points.y2} 
        stroke="#ef4444" 
        strokeWidth="2" 
        strokeDasharray="6 4"
        markerEnd="url(#arrowhead)"
        className="animate-[dash_2s_linear_infinite]"
      />
      <style>{`
        @keyframes dash {
          to { stroke-dashoffset: -20; }
        }
      `}</style>
      <circle cx={points.x1} cy={points.y1} r="4" fill="#F2C94C" className="animate-pulse" />
      <circle cx={points.x2} cy={points.y2} r="4" fill="#ef4444" className="animate-pulse" />
    </svg>
  );
};

const INITIAL_TEAMS: TeamState[] = Array.from({ length: 16 }, (_, i) => ({
  id: `team-${i + 1}`,
  name: `TEAM ${i + 1}`,
  kills: 0,
  playersAlive: 4,
  tournamentPoints: 0
}));

// --- COMPONENT ---
const LiveMatchLab: React.FC<LiveMatchLabProps> = ({ branding, currentTeams = [] }) => {
  // 1. STATE & PERSISTENCE
  const [state, setState] = useState<LiveState>(() => {
    try {
      const raw = localStorage.getItem("liveLab_state_v2");
      if (raw) return JSON.parse(raw);
    } catch (e) {
      console.error("Failed to load state", e);
    }
    
    // Initialize from currentTeams if available, otherwise use defaults
    const initialTeams: TeamState[] = currentTeams.length > 0 
      ? currentTeams.slice(0, 16).map((t, i) => ({
          id: `team-${i + 1}`,
          name: t.name,
          kills: 0,
          playersAlive: 4,
          logoUrl: t.logoUrl,
          tournamentPoints: t.totalPoints
        }))
      : INITIAL_TEAMS.map(t => ({ ...t, tournamentPoints: 0 }));

    return { 
      teams: initialTeams, 
      eliminationStack: [],
      matchId: `MATCH-${Date.now().toString().slice(-4)}`
    };
  });

  const [history, setHistory] = useState<LiveState[]>([]); // Simple undo stack
  const [toast, setToast] = useState<{ msg: string, type: 'info' | 'warn' } | null>(null);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null); // Attacker
  const [victimTeamId, setVictimTeamId] = useState<string | null>(null); // Victim
  const [viewMode, setViewMode] = useState<'match' | 'projected'>('match');
  const exportRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const lastWPress = useRef<number>(0);

  useEffect(() => {
    localStorage.setItem("liveLab_state_v2", JSON.stringify(state));
  }, [state]);

  // --- KEYBOARD SHORTCUTS ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      // Global Shortcuts
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        undo();
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
        e.preventDefault();
        exportImage();
        return;
      }

      // Navigation
      if (e.key === 'Escape') {
        setSelectedTeamId(null);
        return;
      }

      // Team Selection Navigation (Arrows / Tab)
      if (!selectedTeamId) {
        if (['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp', 'Tab'].includes(e.key)) {
          e.preventDefault();
          setSelectedTeamId(state.teams[0].id);
        }
        return;
      }

      const currentIndex = state.teams.findIndex(t => t.id === selectedTeamId);
      const gridCols = 4; // Fixed 4-column grid

      // Navigation Logic (Prevent if Alt is held - reserved for reordering)
      if (!e.altKey) {
        if (e.key === 'ArrowRight' || (e.key === 'Tab' && !e.shiftKey)) {
          e.preventDefault();
          const nextIndex = (currentIndex + 1) % state.teams.length;
          setSelectedTeamId(state.teams[nextIndex].id);
          return;
        }
        if (e.key === 'ArrowLeft' || (e.key === 'Tab' && e.shiftKey)) {
          e.preventDefault();
          const prevIndex = (currentIndex - 1 + state.teams.length) % state.teams.length;
          setSelectedTeamId(state.teams[prevIndex].id);
          return;
        }
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          const nextIndex = (currentIndex + gridCols) % state.teams.length;
          setSelectedTeamId(state.teams[nextIndex].id);
          return;
        }
        if (e.key === 'ArrowUp') {
          e.preventDefault();
          const prevIndex = (currentIndex - gridCols + state.teams.length) % state.teams.length;
          setSelectedTeamId(state.teams[prevIndex].id);
          return;
        }
      }
      
      // --- ACTION SHORTCUTS (Requires Selection) ---
      if (selectedTeamId) {
        const team = state.teams.find(t => t.id === selectedTeamId);
        if (!team) return;

        // Kills: Q (Add), E (Remove)
        if (e.key.toLowerCase() === 'q') {
          e.preventDefault();
          if (victimTeamId) {
            relationalKill(selectedTeamId, victimTeamId);
          } else {
            updateTeam(selectedTeamId, { kills: team.kills + 1 });
          }
        }
        if (e.key.toLowerCase() === 'e') {
          e.preventDefault();
          updateTeam(selectedTeamId, { kills: Math.max(0, team.kills - 1) });
        }

        // Players Alive: Numbers 1-4
        if (['1', '2', '3', '4'].includes(e.key)) {
          e.preventDefault();
          updateTeam(selectedTeamId, { playersAlive: parseInt(e.key) });
        }

        // Revive/Reset: R
        if (e.key.toLowerCase() === 'r') {
          e.preventDefault();
          updateTeam(selectedTeamId, { playersAlive: 4 });
        }

        // Wipe: W (Double-Tap Safety)
        if (e.key.toLowerCase() === 'w') {
          e.preventDefault();
          const now = Date.now();
          if (now - lastWPress.current < 300) {
            updateTeam(selectedTeamId, { playersAlive: 0 });
            lastWPress.current = 0;
          } else {
            lastWPress.current = now;
            showToast("Double-tap W to WIPE", 'info');
          }
        }
        
        // Legacy Wipe: Delete, Backspace (Single tap)
        if (e.key === 'Delete' || e.key === 'Backspace') {
           e.preventDefault();
           updateTeam(selectedTeamId, { playersAlive: 0 });
        }
        
        // Elimination Stack Reorder (Alt + Up/Down)
        if (e.altKey && team.playersAlive === 0) {
           if (e.key === 'ArrowUp') {
             e.preventDefault();
             moveEliminationOrder(selectedTeamId, 1); // Better rank
           }
           if (e.key === 'ArrowDown') {
             e.preventDefault();
             moveEliminationOrder(selectedTeamId, -1); // Worse rank
           }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [state, selectedTeamId, history]); // Re-bind when state changes to capture latest values

  // 2. COMPUTED STANDINGS (Pure Function)
  const standings = useMemo(() => {
    const totalTeams = state.teams.length;
    const remainingTeamsCount = totalTeams - state.eliminationStack.length;
    
    // Map elimination stack to rank: index 0 (first out) -> Rank 16
    const eliminationRankMap = new Map<string, number>();
    state.eliminationStack.forEach((teamId, index) => {
      // If 16 teams total:
      // Index 0 (1st out) -> Rank 16
      // Index 1 (2nd out) -> Rank 15
      eliminationRankMap.set(teamId, totalTeams - index);
    });

    return state.teams.map(team => {
      const isEliminated = team.playersAlive === 0;
      
      // Determine Rank
      // If eliminated, use fixed rank from stack. 
      // If alive, they are effectively tied for the best possible remaining rank (e.g. Top 4)
      const rank = isEliminated ? eliminationRankMap.get(team.id) : null;
      
      // Determine Points
      // If eliminated: Get points for their specific rank
      // If alive: Get points for the current "floor" (e.g. if 4 teams left, everyone gets at least 4th place pts)
      const placementPts = rank 
        ? (PLACEMENT_POINTS[rank] || 0) 
        : (PLACEMENT_POINTS[remainingTeamsCount] || 0);

      const totalPoints = team.kills + placementPts;
      const projectedTournamentTotal = team.tournamentPoints + totalPoints;

      return {
        ...team,
        rank,
        placementPts,
        totalPoints,
        projectedTournamentTotal,
        status: isEliminated ? 'ELIMINATED' : 'ALIVE'
      };
    }).sort((a, b) => {
      if (viewMode === 'projected') {
          return b.projectedTournamentTotal - a.projectedTournamentTotal;
      }
      // Deterministic Tie-Breaker Chain
      if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints; // 1. Total Pts
      if (b.placementPts !== a.placementPts) return b.placementPts - a.placementPts; // 2. Placement Pts (favors survival)
      if (b.kills !== a.kills) return b.kills - a.kills; // 3. Kills
      return a.name.localeCompare(b.name); // 4. Name (Alphabetical stability)
    });
  }, [state]);

  // 3. ACTIONS
  const pushHistory = () => {
    setHistory(prev => [...prev.slice(-9), state]); // Keep last 10 states
  };

  const undo = () => {
    if (history.length === 0) return;
    const last = history[history.length - 1];
    setHistory(prev => prev.slice(0, -1));
    setState(last);
    showToast("Action Undone", 'info');
  };

  const updateTeam = (id: string, updates: Partial<TeamState>) => {
    pushHistory();
    setState(prev => {
      const team = prev.teams.find(t => t.id === id);
      if (!team) return prev;

      const newStats = { ...team, ...updates };
      
      // Clamp values
      if (newStats.playersAlive !== undefined) {
        newStats.playersAlive = Math.max(0, Math.min(4, newStats.playersAlive));
      }
      if (newStats.kills !== undefined) {
        newStats.kills = Math.max(0, newStats.kills);
      }

      // Handle Elimination Logic
      let newStack = [...prev.eliminationStack];
      
      // WIPE: Alive -> 0
      if (team.playersAlive > 0 && newStats.playersAlive === 0) {
        if (!newStack.includes(id)) {
          newStack.push(id); // Add to end of stack (highest rank among dead)
          showToast(`${team.name} ELIMINATED`, 'warn');
        }
      }
      
      // REVIVE: 0 -> Alive
      if (team.playersAlive === 0 && newStats.playersAlive > 0) {
        newStack = newStack.filter(stackId => stackId !== id);
        showToast(`${team.name} REVIVED`, 'info');
      }

      return {
        teams: prev.teams.map(t => t.id === id ? newStats : t),
        eliminationStack: newStack
      };
    });
  };

  const relationalKill = (attackerId: string, victimId: string) => {
    if (attackerId === victimId) {
      showToast("Cannot target own team", 'warn');
      return;
    }
    pushHistory();
    setState(prev => {
      const attacker = prev.teams.find(t => t.id === attackerId);
      const victim = prev.teams.find(t => t.id === victimId);
      if (!attacker || !victim || victim.playersAlive === 0) return prev;

      const newVictimAlive = victim.playersAlive - 1;
      let newStack = [...prev.eliminationStack];
      
      if (newVictimAlive === 0) {
        if (!newStack.includes(victimId)) {
          newStack.push(victimId);
        }
        setVictimTeamId(null); // Clear link on wipe
        showToast(`${victim.name} ELIMINATED by ${attacker.name}`, 'warn');
      } else {
        showToast(`Kill Confirmed: ${attacker.name} ➔ ${victim.name}`, 'info');
      }

      return {
        ...prev,
        teams: prev.teams.map(t => {
          if (t.id === attackerId) return { ...t, kills: t.kills + 1 };
          if (t.id === victimId) return { ...t, playersAlive: newVictimAlive };
          return t;
        }),
        eliminationStack: newStack
      };
    });
  };

  const wipeCredit = (attackerId: string, victimId: string) => {
    if (attackerId === victimId) return;
    pushHistory();
    setState(prev => {
      const attacker = prev.teams.find(t => t.id === attackerId);
      const victim = prev.teams.find(t => t.id === victimId);
      if (!attacker || !victim || victim.playersAlive === 0) return prev;

      const killsToCredit = victim.playersAlive;
      let newStack = [...prev.eliminationStack];
      if (!newStack.includes(victimId)) {
        newStack.push(victimId);
      }

      if (victimId === victimTeamId) setVictimTeamId(null);
      showToast(`WIPE CREDIT: ${attacker.name} wiped ${victim.name} (+${killsToCredit})`, 'warn');

      return {
        ...prev,
        teams: prev.teams.map(t => {
          if (t.id === attackerId) return { ...t, kills: t.kills + killsToCredit };
          if (t.id === victimId) return { ...t, playersAlive: 0 };
          return t;
        }),
        eliminationStack: newStack
      };
    });
  };

  const moveEliminationOrder = (id: string, direction: -1 | 1) => {
    pushHistory();
    setState(prev => {
      const stack = [...prev.eliminationStack];
      const idx = stack.indexOf(id);
      if (idx === -1) return prev;
      
      const newIdx = idx + direction;
      if (newIdx < 0 || newIdx >= stack.length) return prev;
      
      // Swap
      [stack[idx], stack[newIdx]] = [stack[newIdx], stack[idx]];
      
      return { ...prev, eliminationStack: stack };
    });
  };

  const startNewMatch = () => {
    if (confirm("START NEW MATCH? This will clear all kills and casualties but keep the current team roster.")) {
      pushHistory();
      setSelectedTeamId(null);
      setVictimTeamId(null);
      setState(prev => ({
        ...prev,
        teams: prev.teams.map(t => ({ ...t, kills: 0, playersAlive: 4 })),
        eliminationStack: [],
        matchId: `MATCH-${Date.now().toString().slice(-4)}`
      }));
      showToast("New Match Started", 'info');
    }
  };

  const resetLab = () => {
    if (confirm("HARD RESET? This will re-sync all teams from the tournament database and lose any manual name edits.")) {
      setSelectedTeamId(null);
      setVictimTeamId(null);
      const initialTeams: TeamState[] = currentTeams.length > 0 
        ? currentTeams.slice(0, 16).map((t, i) => ({
            id: `team-${i + 1}`,
            name: t.name,
            kills: 0,
            playersAlive: 4,
            logoUrl: t.logoUrl,
            tournamentPoints: t.totalPoints
          }))
        : INITIAL_TEAMS.map(t => ({ ...t, tournamentPoints: 0 }));

      setState({ 
        teams: initialTeams, 
        eliminationStack: [],
        matchId: `MATCH-${Date.now().toString().slice(-4)}`
      });
      setHistory([]);
      localStorage.removeItem("liveLab_state_v2");
      showToast("Lab Resynced", 'info');
    }
  };

  const factoryReset = () => {
    if (confirm("FACTORY RESET? This will wipe EVERYTHING: names, kills, points, and casualties. This cannot be undone.")) {
      pushHistory();
      setSelectedTeamId(null);
      setVictimTeamId(null);
      setState({
        teams: INITIAL_TEAMS.map(t => ({ ...t, tournamentPoints: 0 })),
        eliminationStack: [],
        matchId: `MATCH-${Date.now().toString().slice(-4)}`
      });
      setHistory([]);
      localStorage.removeItem("liveLab_state_v2");
      showToast("Factory Reset Complete", 'warn');
    }
  };

  const showToast = (msg: string, type: 'info' | 'warn') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const exportImage = async () => {
    if (!exportRef.current) return;
    try {
      const dataUrl = await toPng(exportRef.current, { pixelRatio: 2 });
      const link = document.createElement('a');
      link.download = `live_standings_${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error(err);
      alert("Export failed");
    }
  };

  // --- RENDER HELPERS ---
  const getRankColor = (rank: number | null) => {
    if (rank === 1) return 'text-[#F2C94C]'; // Gold
    if (rank === 2) return 'text-gray-300'; // Silver
    if (rank === 3) return 'text-orange-500'; // Bronze
    return 'text-white';
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans flex flex-col overflow-hidden selection:bg-[#F2C94C] selection:text-black">
      
      {/* HEADER: HUD STYLE */}
      <header className="h-14 border-b border-white/10 flex items-center justify-between px-6 bg-[#1e1b4b] relative z-20">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-[#F2C94C] rounded-full animate-pulse"></div>
            <h1 className="font-black text-lg tracking-widest text-white uppercase font-mono">
              MATCH<span className="text-[#F2C94C]">LAB</span> // LIVE
            </h1>
          </div>
          <div className="h-4 w-px bg-white/20 rotate-12"></div>
          <div className="text-[10px] font-mono text-indigo-300 uppercase tracking-widest">
            Session ID: {Date.now().toString().slice(-6)}
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex bg-black/40 p-1 rounded-sm border border-white/10 mr-4">
            <button 
                onClick={() => setViewMode('match')}
                className={cn(
                    "px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-sm transition-all",
                    viewMode === 'match' ? "bg-indigo-600 text-white" : "text-indigo-300 hover:text-white"
                )}
            >
                Match View
            </button>
            <button 
                onClick={() => setViewMode('projected')}
                className={cn(
                    "px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-sm transition-all",
                    viewMode === 'projected' ? "bg-indigo-600 text-white" : "text-indigo-300 hover:text-white"
                )}
            >
                Projected View
            </button>
          </div>

          {toast && (
            <div className={cn(
              "px-3 py-1 rounded-sm text-[10px] font-black uppercase tracking-widest animate-in fade-in slide-in-from-top-4 border",
              toast.type === 'warn' 
                ? "bg-red-500/10 border-red-500 text-red-500" 
                : "bg-[#F2C94C]/10 border-[#F2C94C] text-[#F2C94C]"
            )}>
              {toast.msg}
            </div>
          )}
          
          <div className="flex items-center gap-1 bg-[#2e1065] p-1 rounded-sm border border-white/10">
            <button onClick={undo} disabled={history.length === 0} className="p-1.5 hover:bg-white/10 rounded-sm disabled:opacity-30 text-indigo-300 hover:text-white transition-colors" title="Undo (Ctrl+Z)">
              <RotateCcw className="w-4 h-4" />
            </button>
            <button onClick={startNewMatch} className="p-1.5 hover:bg-indigo-500/20 text-indigo-300 hover:text-white rounded-sm transition-colors" title="New Match (Keep Roster)">
              <MonitorPlay className="w-4 h-4" />
            </button>
            <button onClick={resetLab} className="p-1.5 hover:bg-orange-500/20 text-orange-400 hover:text-orange-300 rounded-sm transition-colors" title="Hard Reset (Re-sync Teams)">
              <RotateCcw className="w-4 h-4" />
            </button>
            <button onClick={factoryReset} className="p-1.5 hover:bg-red-900/30 text-red-500 hover:text-red-400 rounded-sm transition-colors" title="Factory Reset (Nuke Everything)">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          <button 
            onClick={exportImage} 
            className="flex items-center gap-2 bg-[#F2C94C] text-black px-4 py-1.5 rounded-sm text-xs font-black uppercase hover:bg-[#d9b44a] transition-colors tracking-wider"
          >
            <Download className="w-4 h-4" /> Export
          </button>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Background Grid Texture */}
        <div className="absolute inset-0 opacity-[0.02] pointer-events-none" 
             style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '40px 40px' }}>
        </div>
        
        {/* LEFT: TACTICAL DECK */}
        <div className="w-1/2 p-4 flex flex-col relative z-10 border-r border-white/5 bg-[#1e1b4b]/95 backdrop-blur-sm">
          
          {/* TEAM GRID */}
          <div ref={gridRef} className="flex-1 grid grid-cols-4 gap-2 content-start relative">
            {state.teams.map(team => {
              const isSelected = team.id === selectedTeamId;
              const isVictim = team.id === victimTeamId;
              const isWiped = team.playersAlive === 0;
              const teamLogo = branding?.teamBranding?.[team.name]?.logoUrl;
              
              return (
              <div 
                key={team.id} 
                id={team.id}
                onClick={() => setSelectedTeamId(team.id)}
                onContextMenu={(e) => {
                  e.preventDefault();
                  if (isWiped || isSelected) return;
                  setVictimTeamId(isVictim ? null : team.id);
                }}
                draggable={!isWiped}
                onDragStart={(e) => {
                  if (isWiped) return;
                  e.dataTransfer.setData("victimId", team.id);
                }}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const draggedVictimId = e.dataTransfer.getData("victimId");
                  if (draggedVictimId && draggedVictimId !== team.id) {
                    wipeCredit(team.id, draggedVictimId);
                  }
                }}
                className={cn(
                  "relative flex flex-col justify-between p-2.5 rounded-sm transition-all cursor-pointer select-none border h-28 group overflow-hidden",
                  isSelected 
                    ? "bg-[#4c1d95]/40 border-[#F2C94C] shadow-[0_0_15px_rgba(242,201,76,0.15)] z-10" 
                    : isVictim
                      ? "bg-red-900/20 border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.2)] z-10"
                      : isWiped
                        ? "bg-[#0a0a0a] border-red-900/20 opacity-60"
                        : "bg-[#2e1065]/40 border-white/10 hover:border-white/30 hover:bg-[#3b0764]/60"
                )}
              >
                {/* Tech Corners */}
                {isSelected && (
                  <>
                    <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-[#F2C94C]"></div>
                    <div className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-[#F2C94C]"></div>
                    <div className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-[#F2C94C]"></div>
                    <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-[#F2C94C]"></div>
                    <div className="absolute top-1 right-1 text-[8px] font-black text-[#F2C94C] tracking-widest bg-black/50 px-1">ATTACKER</div>
                  </>
                )}

                {isVictim && (
                  <>
                    <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-red-500"></div>
                    <div className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-red-500"></div>
                    <div className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-red-500"></div>
                    <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-red-500"></div>
                    <div className="absolute top-1 right-1 text-[8px] font-black text-red-500 tracking-widest bg-black/50 px-1">VICTIM</div>
                  </>
                )}

                {/* Header */}
                <div className="flex justify-between items-start">
                  <div className="flex flex-col w-full">
                    <div className="flex justify-between items-center mb-0.5">
                        <span className={cn(
                          "text-[9px] font-mono font-bold uppercase tracking-wider", 
                          isSelected ? "text-[#F2C94C]" : "text-indigo-300"
                        )}>
                          Slot {team.id.split('-')[1].padStart(2, '0')}
                        </span>
                        {!isWiped && (
                            <button 
                                onClick={(e) => { e.stopPropagation(); updateTeam(team.id, { playersAlive: 0 }); }}
                                className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-400 transition-opacity p-0.5 rounded hover:bg-red-500/10"
                                title="Wipe Team"
                            >
                                <Skull className="w-3 h-3" />
                            </button>
                        )}
                    </div>
                    <div className="flex items-center gap-1.5">
                        {teamLogo && (
                            <img src={teamLogo} alt="" className="w-4 h-4 object-contain opacity-80" />
                        )}
                        <input 
                          value={team.name}
                          onChange={(e) => updateTeam(team.id, { name: e.target.value })}
                          className={cn(
                            "bg-transparent font-bold text-sm uppercase w-full focus:outline-none truncate tracking-tight font-sans",
                            isSelected ? "text-white" : "text-indigo-100",
                            isWiped && !isSelected && "line-through text-indigo-500/50"
                          )}
                          onClick={(e) => e.stopPropagation()} 
                          placeholder="TEAM NAME"
                        />
                    </div>
                  </div>
                </div>

                {/* Middle: Kill Counter (Digital Style) */}
                <div className="flex items-center justify-between flex-1 px-1">
                   <div className="text-[9px] font-mono text-indigo-400 uppercase rotate-180" style={{ writingMode: 'vertical-rl' }}>KILLS</div>
                   <span className={cn(
                     "text-4xl font-mono font-medium tracking-tighter", 
                     isSelected ? "text-[#F2C94C]" : "text-white",
                     isWiped && "text-indigo-500/50"
                   )}>
                    {team.kills.toString().padStart(2, '0')}
                  </span>
                </div>

                {/* Bottom: Armor/Health Bars */}
                <div className="flex gap-0.5 h-1.5 mt-auto">
                  {[1, 2, 3, 4].map(i => (
                    <div 
                      key={i}
                      onClick={(e) => { e.stopPropagation(); updateTeam(team.id, { playersAlive: i }); }}
                      className={cn(
                        "flex-1 skew-x-[-12deg] transition-all",
                        i <= team.playersAlive 
                          ? (isSelected ? "bg-[#F2C94C]" : "bg-indigo-400") 
                          : "bg-black/40"
                      )}
                    />
                  ))}
                </div>
                
                {/* Wiped Overlay */}
                {isWiped && !isSelected && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none bg-black/40 backdrop-grayscale">
                    <span className="text-red-900 font-black text-2xl uppercase -rotate-12 border-2 border-red-900/50 px-2 py-1 opacity-50">KIA</span>
                  </div>
                )}

              </div>
            );
            })}
            {/* Combat Link Visualization */}
            {selectedTeamId && victimTeamId && (
              <div className="absolute inset-0 pointer-events-none z-0 overflow-visible">
                <CombatLink 
                  attackerId={selectedTeamId} 
                  victimId={victimTeamId} 
                  containerRef={gridRef} 
                />
              </div>
            )}
          </div>

          {/* KEYBOARD VISUALIZER */}
          <div className="mt-2 mb-2 p-3 bg-[#0f0720] border border-white/10 rounded-sm">
            <div className="text-[10px] font-mono text-indigo-400 uppercase mb-3 tracking-widest flex items-center gap-2 border-b border-white/5 pb-2">
              <Keyboard className="w-3 h-3" /> Tactical Input Map
            </div>
            
            <div className="flex flex-col gap-4">
              {/* Row 1: Numbers */}
              <div className="flex justify-between px-2">
                {[
                  { k: '1', l: 'SOLO' },
                  { k: '2', l: 'DUO' },
                  { k: '3', l: 'TRIO' },
                  { k: '4', l: 'FULL' }
                ].map(item => (
                  <div key={item.k} className="flex flex-col items-center gap-1.5 group">
                    <div className="w-9 h-9 rounded border border-white/20 flex items-center justify-center font-mono text-xs bg-white/5 group-hover:border-[#F2C94C] transition-colors shadow-inner">
                      {item.k}
                    </div>
                    <span className="text-[7px] text-indigo-300 font-black tracking-tighter uppercase">{item.l}</span>
                  </div>
                ))}
              </div>

              {/* Row 2: Actions */}
              <div className="flex justify-between px-2">
                {[
                  { k: 'Q', l: victimTeamId ? 'LINK KILL' : '+KILL', c: victimTeamId ? 'text-red-500' : 'text-emerald-400', b: victimTeamId ? 'border-red-500 shadow-[0_0_10px_rgba(239,68,68,0.3)]' : 'hover:border-emerald-500/50' },
                  { k: 'W', l: 'WIPE×2', c: 'text-red-400', b: 'hover:border-red-500/50' },
                  { k: 'E', l: '-KILL', c: 'text-orange-400', b: 'hover:border-orange-500/50' },
                  { k: 'R', l: 'REVIVE', c: 'text-indigo-400', b: 'hover:border-indigo-500/50' }
                ].map(item => (
                  <div key={item.k} className="flex flex-col items-center gap-1.5 group">
                    <div className={cn(
                      "w-9 h-9 rounded border border-white/20 flex items-center justify-center font-mono text-xs bg-white/5 transition-all shadow-inner",
                      item.b
                    )}>
                      {item.k}
                    </div>
                    <span className={cn("text-[7px] font-black tracking-tighter uppercase", item.c)}>{item.l}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Navigation Hint */}
            <div className="mt-4 pt-2 border-t border-white/5 flex justify-between items-center px-1">
               <div className="flex items-center gap-2">
                  <div className="flex gap-0.5">
                    <div className="w-4 h-4 border border-white/20 rounded-[2px] flex items-center justify-center text-[8px] font-mono">↑</div>
                    <div className="w-4 h-4 border border-white/20 rounded-[2px] flex items-center justify-center text-[8px] font-mono">↓</div>
                  </div>
                  <span className="text-[8px] text-indigo-400 uppercase font-bold">Navigate</span>
               </div>
               <div className="flex items-center gap-2">
                  <div className="px-1.5 py-0.5 border border-white/20 rounded-[2px] text-[8px] font-mono">CTRL+Z</div>
                  <span className="text-[8px] text-indigo-400 uppercase font-bold">Undo</span>
               </div>
            </div>
          </div>

          {/* CASUALTY LOG (Footer) */}
          <div className="h-36 border-t border-white/10 mt-2 pt-2 flex flex-col bg-[#0f0720] -mx-4 px-4 pb-0">
            <div className="flex justify-between items-center mb-2">
               <div className="flex items-center gap-2 text-[#F2C94C] text-[10px] font-black uppercase tracking-widest">
                  <Skull className="w-3 h-3" /> Casualty Log
               </div>
               <div className="text-[9px] font-mono text-indigo-300">
                  ALT + ARROWS TO REORDER
               </div>
            </div>
            
            <div className="flex-1 overflow-x-auto flex gap-2 pb-2 scrollbar-hide">
              {[...state.eliminationStack].reverse().map((teamId, idx) => {
                const team = state.teams.find(t => t.id === teamId);
                const rank = 16 - (state.eliminationStack.length - 1 - idx);
                const isSelected = teamId === selectedTeamId;
                const teamLogo = branding?.teamBranding?.[team?.name || '']?.logoUrl;
                
                return (
                  <div 
                    key={teamId} 
                    onClick={() => setSelectedTeamId(teamId)}
                    className={cn(
                      "flex-shrink-0 w-32 bg-[#1e1b4b] border rounded-sm p-2 flex flex-col justify-center cursor-pointer hover:bg-[#2e1065] transition-colors relative group",
                      isSelected ? "border-[#F2C94C]" : "border-white/5"
                    )}
                  >
                    <div className="flex justify-between text-[9px] font-mono mb-1">
                      <span className="text-indigo-300">#{rank.toString().padStart(2, '0')}</span>
                      <span className="text-red-500 font-bold">ELIM</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        {teamLogo && (
                            <img src={teamLogo} alt="" className="w-3 h-3 object-contain opacity-80" />
                        )}
                        <div className={cn("font-bold truncate text-xs", isSelected ? "text-white" : "text-indigo-100")}>
                          {team?.name}
                        </div>
                    </div>
                    
                    {/* Hover Actions */}
                    <div className="absolute inset-0 bg-black/80 hidden group-hover:flex items-center justify-center gap-2">
                        <button onClick={(e) => { e.stopPropagation(); moveEliminationOrder(teamId, 1); }} className="text-white hover:text-[#F2C94C]"><ChevronUp className="w-4 h-4" /></button>
                        <button onClick={(e) => { e.stopPropagation(); moveEliminationOrder(teamId, -1); }} className="text-white hover:text-[#F2C94C]"><ChevronDown className="w-4 h-4" /></button>
                    </div>
                  </div>
                );
              })}
              {state.eliminationStack.length === 0 && (
                <div className="w-full h-full flex items-center justify-center text-[10px] text-indigo-900 font-mono border border-dashed border-white/10 rounded-sm">
                  // NO CASUALTIES RECORDED
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT: PREVIEW MONITOR (Clean Canvas) */}
        <div className="w-1/2 bg-[#020202] flex flex-col border-l border-white/5 relative">
          
          {/* Floating Toolbar */}
          <div className="absolute top-6 right-6 z-20 flex items-center gap-2">
             <div className="bg-[#1e1b4b]/80 backdrop-blur-md border border-indigo-500/30 px-3 py-1.5 rounded-full flex items-center gap-2 text-[10px] font-mono text-indigo-200">
                <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></div>
                LIVE PREVIEW
             </div>
          </div>

          {/* SHORTCUTS LEGEND */}
          <div className="absolute bottom-4 left-4 right-4 bg-[#1e1b4b]/80 backdrop-blur-md border border-indigo-500/30 rounded-sm p-3 flex justify-between items-center text-[9px] font-mono text-indigo-200 uppercase tracking-wider z-30 pointer-events-none">
             <div className="flex gap-4">
                <span className="flex items-center gap-1"><span className="text-white bg-white/10 px-1 rounded-[2px]">L-CLICK</span> ATTACKER</span>
                <span className="flex items-center gap-1"><span className="text-red-400 bg-red-900/40 px-1 rounded-[2px]">R-CLICK</span> VICTIM</span>
                <span className="flex items-center gap-1"><span className="text-[#F2C94C] bg-[#F2C94C]/10 px-1 rounded-[2px]">Q</span> CONFIRM KILL</span>
                <span className="flex items-center gap-1"><span className="text-white bg-white/10 px-1 rounded-[2px]">DRAG B➔A</span> WIPE CREDIT</span>
             </div>
             <div className="flex gap-4">
                <span className="flex items-center gap-1"><span className="text-white bg-white/10 px-1 rounded-[2px]">1-4</span> SQUAD</span>
                <span className="flex items-center gap-1"><span className="text-red-400 bg-red-900/40 px-1 rounded-[2px]">W×2</span> WIPE</span>
                <span className="flex items-center gap-1"><span className="text-white bg-white/10 px-1 rounded-[2px]">ALT+↕</span> REORDER</span>
             </div>
          </div>

          <div className="flex-1 overflow-auto p-12 flex items-center justify-center bg-[radial-gradient(#1e1b4b_1px,transparent_1px)] [background-size:20px_20px]">
             {/* EXPORT TARGET - BROADCAST GRAPHIC */}
             <div 
               ref={exportRef} 
               className="w-full max-w-2xl bg-[#2e1065] shadow-2xl overflow-hidden relative font-sans flex flex-col"
             >
                {/* BACKGROUND */}
                <div className="absolute inset-0 bg-[linear-gradient(to_bottom,#2e1065_0%,#1e1b4b_100%)]"></div>
                <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
                
                {/* TOP HEADER: "POINTS STANDINGS" */}
                <div className="relative z-10 pt-8 pb-4 text-center">
                    <div className="inline-block bg-[#F2C94C] text-black font-black text-sm px-4 py-1 -skew-x-12 mb-2 absolute top-8 left-12">
                        {viewMode === 'match' ? 'LIVE MATCH' : 'PROJECTED TOTALS'}
                    </div>
                    <h1 className="text-5xl font-black text-white uppercase tracking-tighter drop-shadow-lg">
                        {viewMode === 'match' ? 'LIVE STANDINGS' : 'TOURNAMENT PROJECTION'}
                    </h1>
                    <div className="text-white/60 font-bold tracking-[0.3em] uppercase text-xs mt-1">
                        {viewMode === 'match' ? 'REAL-TIME MATCH SCOREBOARD' : 'CUMULATIVE TOURNAMENT IMPACT'}
                    </div>
                    {/* Tournament Logo Placeholder Right */}
                    <div className="absolute top-6 right-12 text-white">
                        {branding?.logoUrl ? (
                            <img src={branding.logoUrl} alt="Logo" className="w-12 h-12 object-contain" />
                        ) : (
                            <Trophy className="w-12 h-12 text-white" />
                        )}
                    </div>
                </div>

                {/* HERO STATS BAR */}
                <div className="relative z-10 mx-8 mb-6 h-24 bg-gradient-to-r from-[#4c1d95] to-[#312e81] rounded-xl border border-white/10 flex overflow-hidden shadow-2xl">
                    {/* Left: "01" or Team Highlight Placeholder */}
                    <div className="w-24 bg-white/10 flex items-center justify-center border-r border-white/10">
                        <HeartPulse className="w-8 h-8 text-white/50" />
                    </div>
                    
                    {/* Stats Grid */}
                    <div className="flex-1 flex items-center justify-around px-8">
                        <div className="text-center">
                            <div className="text-white/60 text-[10px] font-bold uppercase tracking-widest mb-1">TEAMS ALIVE</div>
                            <div className="text-3xl font-black text-white tracking-tighter leading-none">
                                {state.teams.filter(t => t.playersAlive > 0).length}
                            </div>
                        </div>
                        <div className="w-px h-12 bg-white/10"></div>
                        <div className="text-center">
                            <div className="text-white/60 text-[10px] font-bold uppercase tracking-widest mb-1">TOTAL KILLS</div>
                            <div className="text-3xl font-black text-white tracking-tighter leading-none">
                                {state.teams.reduce((sum, t) => sum + t.kills, 0)}
                            </div>
                        </div>
                        <div className="w-px h-12 bg-white/10"></div>
                        <div className="text-center">
                            <div className="text-white/60 text-[10px] font-bold uppercase tracking-widest mb-1">PLAYERS ALIVE</div>
                            <div className="text-3xl font-black text-[#F2C94C] tracking-tighter leading-none">
                                {state.teams.reduce((sum, t) => sum + t.playersAlive, 0)}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Data Table */}
                <div className="relative z-10 flex-1 flex flex-col px-8 pb-8">
                    <div className="flex items-center h-8 bg-[#4c1d95] text-white text-[9px] font-black uppercase tracking-widest px-4 border-b-2 border-[#6d28d9]">
                        <div className="w-8 text-center">#</div>
                        <div className="flex-1 pl-2">TEAM NAME</div>
                        <div className="w-12 text-center">ALIVE</div>
                        <div className="w-12 text-center">KILLS</div>
                        <div className="w-12 text-center">POS.</div>
                        <div className="w-16 text-center text-[#F2C94C]">TOTAL</div>
                    </div>
                    <div className="flex flex-col border-l border-r border-b border-white/10 bg-[#0f0720]/80 backdrop-blur-sm">
                        {standings.map((team, idx) => {
                            const isAlive = team.playersAlive > 0;
                            const teamLogo = team.logoUrl;
                            
                            return (
                                <div key={team.id} className="flex items-center h-10 px-4 border-b border-white/5 relative overflow-hidden group">
                                    <div className={cn("w-8 text-center font-black text-sm", isAlive ? "text-white" : "text-indigo-400/50")}>
                                        {String(idx + 1).padStart(2, '0')}
                                    </div>
                                    <div className="flex-1 pl-2 flex items-center gap-2">
                                        {/* Logo */}
                                        <div className="w-5 h-5 bg-white/10 rounded-full flex items-center justify-center overflow-hidden">
                                            {teamLogo ? (
                                                <img src={teamLogo} alt={team.name} className="w-full h-full object-contain" />
                                            ) : (
                                                <Shield className="w-3 h-3 text-white/50" />
                                            )}
                                        </div>
                                        <span className={cn(
                                            "font-black text-sm uppercase tracking-tight truncate",
                                            isAlive ? "text-white" : "text-indigo-300/50 line-through decoration-red-900/50"
                                        )}>
                                            {team.name}
                                        </span>
                                    </div>
                                    <div className="w-12 flex justify-center gap-0.5">
                                        {[1, 2, 3, 4].map(bar => (
                                            <div 
                                                key={bar}
                                                className={cn(
                                                    "w-1 h-3 skew-x-[-12deg]",
                                                    bar <= team.playersAlive ? "bg-[#F2C94C]" : "bg-white/10"
                                                )}
                                            />
                                        ))}
                                    </div>
                                    <div className={cn("w-12 text-center font-bold text-sm", isAlive ? "text-white" : "text-indigo-400/50")}>{team.kills}</div>
                                    <div className={cn("w-12 text-center font-bold text-sm", isAlive ? "text-indigo-200" : "text-indigo-400/50")}>{team.placementPts}</div>
                                    <div className={cn("w-16 text-center font-black text-lg", isAlive ? "text-[#F2C94C]" : "text-indigo-400/50")}>
                                        {viewMode === 'match' ? team.totalPoints : team.projectedTournamentTotal}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveMatchLab;
