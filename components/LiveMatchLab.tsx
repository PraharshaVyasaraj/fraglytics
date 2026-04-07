import React, { useState, useEffect, useMemo, useRef } from 'react';
import { toPng } from 'html-to-image';
import { motion, AnimatePresence } from 'motion/react';
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
  Keyboard,
  Activity,
  Target,
  Zap,
  Radio,
  Crosshair,
  Terminal
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

interface CombatEvent {
  id: string;
  timestamp: number;
  attacker: string;
  victim: string;
  type: 'kill' | 'wipe';
  killsCredited: number;
}

// --- CONFIG ---
const PLACEMENT_POINTS: Record<number, number> = {
  1: 15, 2: 12, 3: 10, 4: 8, 5: 6, 6: 4, 7: 2, 8: 1,
  9: 0, 10: 0, 11: 0, 12: 0, 13: 0, 14: 0, 15: 0, 16: 0
};

const INITIAL_TEAMS: TeamState[] = Array.from({ length: 16 }, (_, i) => ({
  id: `team-${i + 1}`,
  name: `OPERATOR_${(i + 1).toString().padStart(2, '0')}`,
  kills: 0,
  playersAlive: 4,
  tournamentPoints: 0
}));

// --- COMPONENT ---
const LiveMatchLab: React.FC<LiveMatchLabProps> = ({ branding, currentTeams = [] }) => {
  const accentColor = branding?.accentColor || '#fbbf24'; // Default to Amber
  const [isBooting, setIsBooting] = useState(true);
  
  // 1. STATE & PERSISTENCE
  const [state, setState] = useState<LiveState>(() => {
    try {
      const raw = localStorage.getItem("liveLab_state_v3");
      if (raw) return JSON.parse(raw);
    } catch (e) {
      console.error("Failed to load state", e);
    }
    
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
      matchId: `OP-SESSION-${Date.now().toString().slice(-4)}`
    };
  });

  const [history, setHistory] = useState<LiveState[]>([]);
  const [combatLog, setCombatLog] = useState<CombatEvent[]>([]);
  const [toast, setToast] = useState<{ msg: string, type: 'info' | 'warn' | 'system' } | null>(null);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [victimTeamId, setVictimTeamId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'match' | 'projected'>('match');
  const exportRef = useRef<HTMLDivElement>(null);
  const lastWPress = useRef<number>(0);
  const [screenFlash, setScreenFlash] = useState(false);

  // --- DYNAMIC INTEL FEED LOGIC ---
  const intelFeed = useMemo(() => {
    const items: string[] = [];
    const topTeam = [...state.teams].sort((a, b) => b.kills - a.kills)[0];
    const aliveTeams = state.teams.filter(t => t.playersAlive > 0);
    
    if (topTeam && topTeam.kills > 0) {
      items.push(`[DOMINANCE] ${topTeam.name.toUpperCase()} LEADING WITH ${topTeam.kills} NEUTRALIZATIONS`);
    }
    
    if (aliveTeams.length <= 3 && aliveTeams.length > 1) {
      items.push(`[CRITICAL] FINAL ${aliveTeams.length} SQUADS REMAINING // ENGAGEMENT_PROBABILITY: HIGH`);
    }

    if (state.eliminationStack.length > 0) {
      const lastWiped = state.teams.find(t => t.id === state.eliminationStack[state.eliminationStack.length - 1]);
      if (lastWiped) {
        items.push(`[TERMINATED] ${lastWiped.name.toUpperCase()} HAS BEEN REMOVED FROM THE GRID`);
      }
    }

    const totalKills = state.teams.reduce((acc, t) => acc + t.kills, 0);
    if (totalKills > 20) {
      items.push(`[LIT_ZONE] TOTAL COMBAT VOLUME EXCEEDS THRESHOLD // KILLS: ${totalKills}`);
    }

    items.push(`[UPLINK] SESSION_${state.matchId} // ENCRYPTION_LEVEL: MAX // MONITORING_ALL_CHANNELS...`);
    
    return items;
  }, [state]);

  useEffect(() => {
    localStorage.setItem("liveLab_state_v3", JSON.stringify(state));
  }, [state]);

  const triggerFlash = () => {
    setScreenFlash(true);
    setTimeout(() => setScreenFlash(false), 200);
  };

  useEffect(() => {
    const timer = setTimeout(() => setIsBooting(false), 2500);
    return () => clearTimeout(timer);
  }, []);

  // --- KEYBOARD SHORTCUTS ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        undo();
        return;
      }

      if (e.key === 'Escape') {
        setSelectedTeamId(null);
        setVictimTeamId(null);
        return;
      }

      if (!selectedTeamId) {
        if (['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp', 'Tab'].includes(e.key)) {
          e.preventDefault();
          setSelectedTeamId(state.teams[0].id);
        }
        return;
      }

      const currentIndex = state.teams.findIndex(t => t.id === selectedTeamId);
      const gridCols = 4;

      if (!e.altKey) {
        if (e.key === 'ArrowRight' || (e.key === 'Tab' && !e.shiftKey)) {
          e.preventDefault();
          setSelectedTeamId(state.teams[(currentIndex + 1) % state.teams.length].id);
          return;
        }
        if (e.key === 'ArrowLeft' || (e.key === 'Tab' && e.shiftKey)) {
          e.preventDefault();
          setSelectedTeamId(state.teams[(currentIndex - 1 + state.teams.length) % state.teams.length].id);
          return;
        }
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          setSelectedTeamId(state.teams[(currentIndex + gridCols) % state.teams.length].id);
          return;
        }
        if (e.key === 'ArrowUp') {
          e.preventDefault();
          setSelectedTeamId(state.teams[(currentIndex - gridCols + state.teams.length) % state.teams.length].id);
          return;
        }
      }
      
      if (selectedTeamId) {
        const team = state.teams.find(t => t.id === selectedTeamId);
        if (!team) return;

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

        if (['1', '2', '3', '4'].includes(e.key)) {
          e.preventDefault();
          updateTeam(selectedTeamId, { playersAlive: parseInt(e.key) });
        }

        if (e.key.toLowerCase() === 'r') {
          e.preventDefault();
          updateTeam(selectedTeamId, { playersAlive: 4 });
        }

        if (e.key.toLowerCase() === 'w') {
          e.preventDefault();
          const now = Date.now();
          if (now - lastWPress.current < 300) {
            updateTeam(selectedTeamId, { playersAlive: 0 });
            lastWPress.current = 0;
          } else {
            lastWPress.current = now;
            showToast("DOUBLE-TAP [W] TO CONFIRM WIPE", 'warn');
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [state, selectedTeamId, victimTeamId, history]);

  // 2. COMPUTED STANDINGS
  const standings = useMemo(() => {
    const totalTeams = state.teams.length;
    const remainingTeamsCount = totalTeams - state.eliminationStack.length;
    const eliminationRankMap = new Map<string, number>();
    state.eliminationStack.forEach((teamId, index) => {
      eliminationRankMap.set(teamId, totalTeams - index);
    });

    return state.teams.map(team => {
      const isEliminated = team.playersAlive === 0;
      const rank = isEliminated ? eliminationRankMap.get(team.id) : null;
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
      if (viewMode === 'projected') return b.projectedTournamentTotal - a.projectedTournamentTotal;
      if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
      if (b.placementPts !== a.placementPts) return b.placementPts - a.placementPts;
      return b.kills - a.kills;
    });
  }, [state, viewMode]);

  // 3. ACTIONS
  const pushHistory = () => setHistory(prev => [...prev.slice(-19), state]);

  const undo = () => {
    if (history.length === 0) return;
    const last = history[history.length - 1];
    setHistory(prev => prev.slice(0, -1));
    setState(last);
    showToast("SYSTEM_ROLLBACK_SUCCESSFUL", 'system');
  };

  const updateTeam = (id: string, updates: Partial<TeamState>) => {
    const team = state.teams.find(t => t.id === id);
    if (!team) return;

    pushHistory();
    
    const newStats = { ...team, ...updates };
    let newStack = [...state.eliminationStack];
    let wipeHappened = false;
    
    if (team.playersAlive > 0 && newStats.playersAlive === 0) {
      if (!newStack.includes(id)) {
        newStack.push(id);
        wipeHappened = true;
      }
    }
    
    if (team.playersAlive === 0 && newStats.playersAlive > 0) {
      newStack = newStack.filter(stackId => stackId !== id);
      showToast(`OPERATOR_REBOOT: ${team.name}`, 'info');
    }

    setState(prev => ({
      ...prev,
      teams: prev.teams.map(t => t.id === id ? { ...t, ...updates } : t),
      eliminationStack: newStack
    }));

    if (wipeHappened) {
      addCombatEvent('wipe', 'SYSTEM', team.name, 0);
      showToast(`OPERATOR_WIPED: ${team.name}`, 'warn');
      triggerFlash();
    }
  };

  const relationalKill = (attackerId: string, victimId: string) => {
    if (attackerId === victimId) return;
    const attacker = state.teams.find(t => t.id === attackerId);
    const victim = state.teams.find(t => t.id === victimId);
    if (!attacker || !victim || victim.playersAlive === 0) return;

    pushHistory();
    
    const newVictimAlive = victim.playersAlive - 1;
    const newStack = [...state.eliminationStack];
    let wipeHappened = false;
    
    if (newVictimAlive === 0) {
      if (!newStack.includes(victimId)) newStack.push(victimId);
      wipeHappened = true;
      setVictimTeamId(null);
    }

    setState(prev => ({
      ...prev,
      teams: prev.teams.map(t => {
        if (t.id === attackerId) return { ...t, kills: t.kills + 1 };
        if (t.id === victimId) return { ...t, playersAlive: newVictimAlive };
        return t;
      }),
      eliminationStack: newStack
    }));

    if (wipeHappened) {
      addCombatEvent('wipe', attacker.name, victim.name, 1);
      showToast(`SQUAD_TERMINATED: ${victim.name} BY ${attacker.name}`, 'warn');
      triggerFlash();
    } else {
      addCombatEvent('kill', attacker.name, victim.name, 1);
      showToast(`TARGET_NEUTRALIZED: ${victim.name}`, 'info');
    }
  };

  const addCombatEvent = (type: 'kill' | 'wipe', attacker: string, victim: string, kills: number) => {
    const newEvent: CombatEvent = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: Date.now(),
      attacker,
      victim,
      type,
      killsCredited: kills
    };
    setCombatLog(prev => [newEvent, ...prev].slice(0, 50));
  };

  const showToast = (msg: string, type: 'info' | 'warn' | 'system') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const exportImage = async () => {
    if (!exportRef.current) return;
    try {
      const dataUrl = await toPng(exportRef.current, { pixelRatio: 2 });
      const link = document.createElement('a');
      link.download = `FRAGLAB_INTEL_${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white font-mono flex flex-col overflow-hidden selection:bg-white selection:text-black">
      
      {/* Screen Flash Effect */}
      <AnimatePresence>
        {screenFlash && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[2000] bg-red-500/20 pointer-events-none"
          />
        )}
      </AnimatePresence>

      {/* Boot Overlay */}
      <AnimatePresence>
        {isBooting && (
          <motion.div 
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1000] bg-black flex flex-col items-center justify-center p-12"
          >
            <div className="w-full max-w-md space-y-4">
              <div className="flex items-center gap-4 mb-8">
                <Terminal className="w-8 h-8 animate-pulse" style={{ color: accentColor }} />
                <h1 className="text-2xl font-black tracking-tighter uppercase">FRAGLAB_OS_BOOTING...</h1>
              </div>
              <div className="space-y-1">
                {[
                  'INITIALIZING_CORE_SYSTEMS...',
                  'ESTABLISHING_UPLINK_ENCRYPTION...',
                  'SYNCING_OPERATOR_TELEMETRY...',
                  'CALIBRATING_TACTICAL_RADAR...',
                  'SYSTEM_READY_FOR_DEPLOYMENT'
                ].map((text, i) => (
                  <motion.div 
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.3 }}
                    className="text-[10px] text-white/40 tracking-widest uppercase flex items-center gap-2"
                  >
                    <span className="text-green-500">[OK]</span> {text}
                  </motion.div>
                ))}
              </div>
              <div className="mt-8 h-1 bg-white/5 overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: '100%' }}
                  transition={{ duration: 2, ease: "easeInOut" }}
                  className="h-full"
                  style={{ backgroundColor: accentColor }}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Background Tactical Grid */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03]" 
             style={{ 
               backgroundImage: `linear-gradient(${accentColor} 1px, transparent 1px), linear-gradient(90deg, ${accentColor} 1px, transparent 1px)`,
               backgroundSize: '40px 40px' 
             }}>
        </div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#050505_90%)]"></div>
        
        {/* Scanlines Effect */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.05] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%]"></div>

        {/* Radar Scanning Sweep */}
        <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200vw] h-[200vw] opacity-[0.02] pointer-events-none"
            style={{ background: `conic-gradient(from 0deg, ${accentColor}, transparent 60deg)` }}
        />
      </div>

      {/* TOP HUD BAR */}
      <header className="h-16 border-b border-white/10 flex items-center justify-between px-6 bg-black/80 backdrop-blur-md relative z-50">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="relative">
                <Radio className="w-5 h-5 text-red-500 animate-pulse" />
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-ping"></div>
            </div>
            <div>
                <h1 className="font-black text-xl tracking-tighter text-white uppercase flex items-center gap-2">
                    FRAGLAB <span className="text-white/30 font-light">|</span> <span style={{ color: accentColor }}>LIVE_MATCH_LAB</span>
                </h1>
                <div className="flex items-center gap-2 text-[8px] text-white/40 tracking-[0.3em] uppercase">
                    <Activity className="w-2 h-2" />
                    SYSTEM_ACTIVE // {state.matchId}
                </div>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          {/* View Mode Toggle */}
          <div className="flex bg-white/5 p-1 rounded border border-white/10">
            <button 
                onClick={() => setViewMode('match')}
                className={cn(
                    "px-4 py-1.5 text-[10px] font-black uppercase tracking-widest transition-all",
                    viewMode === 'match' ? "bg-white text-black" : "text-white/40 hover:text-white"
                )}
            >
                MATCH_INTEL
            </button>
            <button 
                onClick={() => setViewMode('projected')}
                className={cn(
                    "px-4 py-1.5 text-[10px] font-black uppercase tracking-widest transition-all",
                    viewMode === 'projected' ? "bg-white text-black" : "text-white/40 hover:text-white"
                )}
            >
                PROJECTED_RANK
            </button>
          </div>

          <AnimatePresence>
            {toast && (
                <motion.div 
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className={cn(
                        "px-4 py-1.5 rounded text-[10px] font-black uppercase tracking-widest border shadow-lg",
                        toast.type === 'warn' ? "bg-red-500/20 border-red-500 text-red-500" : 
                        toast.type === 'system' ? "bg-blue-500/20 border-blue-500 text-blue-500" :
                        "bg-green-500/20 border-green-500 text-green-500"
                    )}
                >
                    {toast.msg}
                </motion.div>
            )}
          </AnimatePresence>
          
          <div className="flex items-center gap-2 border-l border-white/10 pl-4">
            <button onClick={undo} disabled={history.length === 0} className="p-2 hover:bg-white/5 rounded transition-colors disabled:opacity-20" title="UNDO_COMMAND [CTRL+Z]">
              <RotateCcw className="w-4 h-4" />
            </button>
            <button onClick={exportImage} className="flex items-center gap-2 bg-white text-black px-5 py-2 rounded text-[10px] font-black uppercase hover:bg-white/80 transition-colors tracking-widest">
              <Download className="w-4 h-4" /> EXPORT_INTEL
            </button>
          </div>
        </div>
      </header>

      {/* MAIN COMMAND INTERFACE */}
      <main className="flex-1 flex overflow-hidden relative z-10">
        
        {/* LEFT: OPERATOR DECK */}
        <div className="w-[65%] p-6 flex flex-col overflow-y-auto custom-scrollbar border-r border-white/5 bg-black/40 relative">
          
          {/* Tactical Map Overlay (Watermark) */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full opacity-[0.02] pointer-events-none p-12">
            <svg viewBox="0 0 100 100" className="w-full h-full" style={{ stroke: accentColor, fill: 'none' }}>
                <path d="M10,10 L90,10 L90,90 L10,90 Z" strokeWidth="0.5" />
                <path d="M10,50 L90,50 M50,10 L50,90" strokeWidth="0.2" strokeDasharray="2,2" />
                <circle cx="50" cy="50" r="30" strokeWidth="0.5" strokeDasharray="5,5" />
                <path d="M20,20 Q50,10 80,20 T80,80 Q50,90 20,80 T20,20" strokeWidth="0.5" />
                <rect x="45" y="45" width="10" height="10" strokeWidth="0.5" />
            </svg>
          </div>

          <div className="grid grid-cols-4 gap-4 relative z-10">
            {state.teams.map((team, idx) => {
              const isSelected = team.id === selectedTeamId;
              const isVictim = team.id === victimTeamId;
              const isWiped = team.playersAlive === 0;
              
              return (
                <motion.div 
                  key={team.id}
                  layoutId={team.id}
                  onClick={() => setSelectedTeamId(team.id)}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    if (isWiped || isSelected) return;
                    setVictimTeamId(isVictim ? null : team.id);
                  }}
                  className={cn(
                    "relative group h-32 border transition-all cursor-pointer overflow-hidden",
                    isSelected 
                        ? "bg-white/10 border-white shadow-[0_0_20px_rgba(255,255,255,0.1)] z-20" 
                        : isVictim
                            ? "bg-red-500/10 border-red-500 z-20"
                            : isWiped
                                ? "bg-black/80 border-white/5 opacity-40 grayscale"
                                : "bg-white/[0.02] border-white/10 hover:border-white/30"
                  )}
                >
                  {/* Tactical Decorations */}
                  <div className="absolute top-0 left-0 w-1 h-1 bg-white/20"></div>
                  <div className="absolute top-0 right-0 w-1 h-1 bg-white/20"></div>
                  <div className="absolute bottom-0 left-0 w-1 h-1 bg-white/20"></div>
                  <div className="absolute bottom-0 right-0 w-1 h-1 bg-white/20"></div>

                  {/* Status Indicator */}
                  <div className={cn(
                    "absolute top-0 left-0 w-full h-0.5",
                    isWiped ? "bg-red-900" : isSelected ? "bg-white" : isVictim ? "bg-red-500" : "bg-white/10"
                  )}></div>

                  <div className="p-3 h-full flex flex-col justify-between relative">
                    {/* Glitch Overlay on Hover */}
                    <motion.div 
                        whileHover={{ opacity: [0, 0.1, 0, 0.2, 0] }}
                        transition={{ duration: 0.2, repeat: Infinity }}
                        className="absolute inset-0 bg-white pointer-events-none opacity-0"
                    />
                    
                    <div className="flex justify-between items-start">
                        <div className="flex flex-col">
                            <span className="text-[8px] text-white/30 tracking-widest uppercase">OP_ID: {team.id.split('-')[1].padStart(2, '0')}</span>
                            <input 
                                value={team.name}
                                onChange={(e) => updateTeam(team.id, { name: e.target.value })}
                                className={cn(
                                    "bg-transparent font-black text-xs uppercase w-full focus:outline-none truncate tracking-tighter mt-1",
                                    isWiped ? "text-white/20" : "text-white"
                                )}
                                onClick={(e) => e.stopPropagation()}
                            />
                        </div>
                        {isWiped && <Skull className="w-3 h-3 text-red-900" />}
                    </div>

                    <div className="flex items-end justify-between">
                        <div className="flex flex-col">
                            <span className="text-[8px] text-white/20 uppercase mb-1">COMBAT_DATA</span>
                            <div className="flex gap-1">
                                {[1, 2, 3, 4].map(i => (
                                    <div 
                                        key={i}
                                        onClick={(e) => { e.stopPropagation(); updateTeam(team.id, { playersAlive: i }); }}
                                        className={cn(
                                            "w-3 h-1.5 transition-all",
                                            i <= team.playersAlive 
                                                ? (isSelected ? "bg-white" : "bg-white/60") 
                                                : "bg-white/5"
                                        )}
                                    />
                                ))}
                            </div>
                        </div>
                        <div className="text-right">
                            <span className="text-[8px] text-white/20 uppercase block">KILLS</span>
                            <span className={cn(
                                "text-2xl font-black leading-none tracking-tighter",
                                isWiped ? "text-white/10" : "text-white"
                            )}>
                                {team.kills.toString().padStart(2, '0')}
                            </span>
                        </div>
                    </div>
                  </div>

                  {/* Selection Overlays */}
                  {isSelected && (
                    <div className="absolute top-1 right-1 px-1 bg-white text-black text-[7px] font-black tracking-widest">ATTACKER</div>
                  )}
                  {isVictim && (
                    <div className="absolute top-1 right-1 px-1 bg-red-500 text-white text-[7px] font-black tracking-widest">TARGET</div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* RIGHT: INTEL PANEL */}
        <div className="w-[35%] flex flex-col bg-black/60 backdrop-blur-xl border-l border-white/10">
          
          {/* STANDINGS PREVIEW */}
          <div className="flex-1 flex flex-col p-6 overflow-hidden">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-white/40" />
                    <h2 className="text-xs font-black tracking-[0.3em] uppercase text-white/60">LIVE_TELEMETRY</h2>
                </div>
                <div className="text-[8px] text-white/20 uppercase tracking-widest">
                    SORT: {viewMode === 'projected' ? 'PROJECTED_TOTAL' : 'MATCH_SCORE'}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
                <div className="space-y-1">
                    {standings.map((team, idx) => (
                        <motion.div 
                            key={team.id}
                            layout
                            className={cn(
                                "flex items-center justify-between p-2 text-[10px] border-l-2 transition-all",
                                team.status === 'ELIMINATED' ? "bg-red-500/5 border-red-900/50 opacity-50" : "bg-white/[0.03] border-white/20"
                            )}
                        >
                            <div className="flex items-center gap-3">
                                <span className="w-4 text-white/20 font-black">{(idx + 1).toString().padStart(2, '0')}</span>
                                <span className="font-black uppercase tracking-tighter truncate w-32">{team.name}</span>
                            </div>
                            <div className="flex items-center gap-6">
                                <div className="flex flex-col items-end">
                                    <span className="text-[7px] text-white/20">KILLS</span>
                                    <span className="font-bold">{team.kills}</span>
                                </div>
                                <div className="flex flex-col items-end">
                                    <span className="text-[7px] text-white/20">PTS</span>
                                    <span className="font-bold" style={{ color: accentColor }}>{team.totalPoints}</span>
                                </div>
                                {viewMode === 'projected' && (
                                    <div className="flex flex-col items-end border-l border-white/10 pl-4">
                                        <span className="text-[7px] text-white/20">PROJECTED</span>
                                        <span className="font-black text-white">{team.projectedTournamentTotal}</span>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
          </div>

          {/* COMBAT LOG */}
          <div className="h-48 border-t border-white/10 p-6 bg-black/40">
            <div className="flex items-center gap-2 mb-4">
                <Zap className="w-3 h-3 text-white/40" />
                <h2 className="text-[9px] font-black tracking-[0.3em] uppercase text-white/40">COMBAT_LOG</h2>
            </div>
            <div className="space-y-1 overflow-y-auto h-28 custom-scrollbar pr-2">
                {combatLog.length === 0 && (
                    <div className="text-[8px] text-white/10 uppercase italic">Waiting for combat data...</div>
                )}
                {combatLog.map(event => (
                    <div key={event.id} className="text-[9px] flex items-center gap-2 border-b border-white/5 pb-1">
                        <span className="text-white/20">[{new Date(event.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}]</span>
                        <span className="text-white font-bold uppercase">{event.attacker}</span>
                        <span className="text-white/30">➔</span>
                        <span className={cn("font-bold uppercase", event.type === 'wipe' ? "text-red-500" : "text-white/60")}>{event.victim}</span>
                        <span className="ml-auto text-[8px] bg-white/5 px-1 text-white/40 uppercase">{event.type}</span>
                    </div>
                ))}
            </div>
          </div>

          {/* INTEL STREAM TICKER */}
          <div className="h-6 border-t border-white/10 bg-black/90 flex items-center overflow-hidden relative">
            <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-black to-transparent z-10 flex items-center pl-4">
                <span className="text-[7px] font-black text-white/40 tracking-widest">INTEL_FEED</span>
            </div>
            <motion.div 
                animate={{ x: ['100%', '-100%'] }}
                transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                className="whitespace-nowrap flex items-center gap-16 pl-[10%]"
            >
                {intelFeed.map((text, i) => (
                    <div key={i} className="flex items-center gap-4">
                        <div className="w-1 h-1 bg-white/20 rotate-45"></div>
                        <span className="text-[8px] text-white/60 font-mono tracking-[0.3em] uppercase">
                            {text}
                        </span>
                    </div>
                ))}
            </motion.div>
            <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-black to-transparent z-10"></div>
          </div>
        </div>
      </main>

      {/* FOOTER: SYSTEM STATUS */}
      <footer className="h-10 border-t border-white/10 bg-black flex items-center justify-between px-6 relative z-50">
        <div className="flex items-center gap-6 text-[8px] text-white/30 uppercase tracking-widest">
            <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                UPLINK_STABLE
            </div>
            <div className="flex items-center gap-2">
                <Target className="w-3 h-3" />
                ACTIVE_OPERATORS: {state.teams.filter(t => t.playersAlive > 0).length} / {state.teams.length}
            </div>
            <div className="flex items-center gap-2">
                <Crosshair className="w-3 h-3" />
                TOTAL_NEUTRALIZATIONS: {state.teams.reduce((acc, t) => acc + t.kills, 0)}
            </div>
        </div>
        <div className="flex items-center gap-4 text-[8px] text-white/20 uppercase tracking-widest">
            <span>[Q] ADD_KILL</span>
            <span>[E] REMOVE_KILL</span>
            <span>[1-4] SET_ALIVE</span>
            <span>[W] WIPE_SQUAD</span>
            <div className="h-3 w-px bg-white/10"></div>
            <span>FRAGLAB_OS_V2.5</span>
        </div>
      </footer>

      {/* HIDDEN EXPORT RENDERER */}
      <div className="fixed -left-[9999px] top-0">
        <div ref={exportRef} className="w-[1200px] bg-[#050505] p-12 border-4 border-white/10">
            <div className="flex justify-between items-end mb-12 border-b-2 border-white/20 pb-8">
                <div>
                    <h1 className="text-6xl font-black tracking-tighter uppercase">LIVE_INTEL_REPORT</h1>
                    <p className="text-xl text-white/40 tracking-[0.5em] mt-2 uppercase">SESSION: {state.matchId}</p>
                </div>
                <div className="text-right">
                    <p className="text-sm text-white/40 uppercase tracking-widest">TIMESTAMP</p>
                    <p className="text-2xl font-bold">{new Date().toLocaleString()}</p>
                </div>
            </div>
            <div className="grid grid-cols-2 gap-12">
                <div className="space-y-4">
                    <h2 className="text-2xl font-black tracking-widest uppercase mb-6 flex items-center gap-3">
                        <div className="w-2 h-8 bg-white"></div>
                        TOP_PERFORMANCE
                    </h2>
                    {standings.slice(0, 8).map((team, idx) => (
                        <div key={team.id} className="flex items-center justify-between p-4 bg-white/5 border-l-4 border-white/20">
                            <div className="flex items-center gap-6">
                                <span className="text-4xl font-black text-white/10">{(idx + 1).toString().padStart(2, '0')}</span>
                                <span className="text-2xl font-black uppercase">{team.name}</span>
                            </div>
                            <div className="flex gap-12">
                                <div className="text-right">
                                    <p className="text-xs text-white/40 uppercase">KILLS</p>
                                    <p className="text-3xl font-black">{team.kills}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-white/40 uppercase">POINTS</p>
                                    <p className="text-3xl font-black" style={{ color: accentColor }}>{team.totalPoints}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
                <div className="space-y-8">
                    <div>
                        <h2 className="text-2xl font-black tracking-widest uppercase mb-6 flex items-center gap-3">
                            <div className="w-2 h-8 bg-red-500"></div>
                            RECENT_COMBAT
                        </h2>
                        <div className="space-y-2">
                            {combatLog.slice(0, 10).map(event => (
                                <div key={event.id} className="text-lg flex items-center gap-4 border-b border-white/5 pb-2">
                                    <span className="text-white font-black uppercase">{event.attacker}</span>
                                    <span className="text-white/20">➔</span>
                                    <span className="text-white/60 font-black uppercase">{event.victim}</span>
                                    <span className="ml-auto text-xs bg-white/10 px-2 py-1 text-white/60 uppercase">{event.type}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="p-8 bg-white/5 border border-white/10">
                        <p className="text-xs text-white/40 uppercase tracking-[0.3em] mb-4">SYSTEM_VERIFICATION</p>
                        <div className="grid grid-cols-2 gap-8 text-sm">
                            <div>
                                <p className="text-white/20">TOTAL_KILLS</p>
                                <p className="text-2xl font-bold">{state.teams.reduce((acc, t) => acc + t.kills, 0)}</p>
                            </div>
                            <div>
                                <p className="text-white/20">ACTIVE_SQUADS</p>
                                <p className="text-2xl font-bold">{state.teams.filter(t => t.playersAlive > 0).length}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div className="mt-12 pt-8 border-t border-white/10 text-center">
                <p className="text-xs text-white/20 tracking-[1em] uppercase">FRAGLAB ANALYTICS // SECURE_DATA_TRANSMISSION</p>
            </div>
        </div>
      </div>

    </div>
  );
};

export default LiveMatchLab;
