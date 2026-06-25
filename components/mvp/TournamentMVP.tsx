import React, { useMemo, useState, useEffect, useRef } from 'react';
import { MVPCard, MVPPlayer } from './MVPCard';
import { 
  Trophy, Star, Zap, Medal, ChevronLeft, ChevronRight, Play, Grid, 
  Download, RotateCcw, RefreshCw, Cpu, Flame, Target, Swords, Sparkles, 
  Settings2, Palette, ShieldAlert, Crosshair, Skull, Activity, Timer 
} from 'lucide-react';
import { TeamData, BrandingConfig } from '../../types';
import { ASSETS } from '../../assets';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';
import { toPng } from 'html-to-image';

interface TournamentMVPProps {
  data: TeamData[];
  branding: BrandingConfig;
  isPortrait?: boolean;
  focusPlayerName?: string;
  onClose?: () => void;
}

type ThemePreset = {
  id: string;
  name: string;
  accent: string;
  bgGradient: string;
  glow: string;
  particleColor: string;
};

const THEME_PRESETS: ThemePreset[] = [
  { id: 'matrix', name: 'Cyber Acid', accent: '#00FF66', bgGradient: 'from-[#020d05] via-[#050508] to-[#010602]', glow: 'rgba(0, 255, 102, 0.15)', particleColor: '#00FF66' },
  { id: 'neon', name: 'Synth Rave', accent: '#FF007F', bgGradient: 'from-[#14000c] via-[#050508] to-[#0a0006]', glow: 'rgba(255, 0, 127, 0.15)', particleColor: '#FF007F' },
  { id: 'ember', name: 'Solar Flare', accent: '#FF7A00', bgGradient: 'from-[#140800] via-[#050508] to-[#0a0400]', glow: 'rgba(255, 122, 0, 0.15)', particleColor: '#FF7A00' },
  { id: 'polar', name: 'Arctic Ice', accent: '#00E0FF', bgGradient: 'from-[#000a14] via-[#050508] to-[#00050a]', glow: 'rgba(0, 224, 255, 0.15)', particleColor: '#00E0FF' },
  { id: 'championship', name: 'Grandmaster', accent: '#FFE600', bgGradient: 'from-[#141200] via-[#050508] to-[#0a0900]', glow: 'rgba(255, 230, 0, 0.15)', particleColor: '#FFE600' }
];

export const TournamentMVP: React.FC<TournamentMVPProps> = ({ 
  data, 
  branding, 
  isPortrait = false, 
  focusPlayerName, 
  onClose 
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isResetting, setIsResetting] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [captureStatus, setCaptureStatus] = useState<string | null>(null);

  // Core Configurations configured in-app
  const [selectedThemeId, setSelectedThemeId] = useState<'matrix' | 'neon' | 'ember' | 'polar' | 'championship'>(() => {
    const defaultColor = branding.accentColor?.toLowerCase();
    if (defaultColor?.includes('ff007f') || defaultColor?.includes('fuchsia') || defaultColor?.includes('pink')) return 'neon';
    if (defaultColor?.includes('ff7a00') || defaultColor?.includes('orange') || defaultColor?.includes('red')) return 'ember';
    if (defaultColor?.includes('ffe600') || defaultColor?.includes('yellow') || defaultColor?.includes('gold')) return 'championship';
    if (defaultColor?.includes('00e0ff') || defaultColor?.includes('cyan') || defaultColor?.includes('blue')) return 'polar';
    return 'matrix';
  });

  const [activeGame, setActiveGame] = useState<'scarfall' | 'bgmi'>(() => {
    return (branding.currentGame as 'scarfall' | 'bgmi') || 'scarfall';
  });

  const currentTheme = useMemo(() => {
    return THEME_PRESETS.find(t => t.id === selectedThemeId) || THEME_PRESETS[0];
  }, [selectedThemeId]);

  const accentColor = currentTheme.accent;

  // Process data to find top players
  const allMVPs = useMemo(() => {
    if (!data || data.length === 0) return [];
    
    const characterKeys = Object.keys(ASSETS.CHARACTERS);
    
    const players: MVPPlayer[] = data.flatMap(team => 
      team.players.map(player => {
        const avatarIndex = player.playerName.length % characterKeys.length;
        const avatarUrl = ASSETS.CHARACTERS[characterKeys[avatarIndex] as keyof typeof ASSETS.CHARACTERS];

        return {
          id: player.playerName,
          name: player.playerName,
          teamName: team.name,
          stats: {
            mvpRating: player.impactScore, 
            finishes: player.finishes,
            damage: player.damage,
            avgSurvival: `${Math.floor(team.avgSurvivalTime || 0)}:${Math.floor(((team.avgSurvivalTime || 0) % 1) * 60).toString().padStart(2, '0')}`,
            knocks: Math.floor(player.finishes * 0.8)
          },
          playerImage: avatarUrl
        };
      })
    );

    // Sort by MVP Rating (Impact Score)
    return players.sort((a, b) => b.stats.mvpRating - a.stats.mvpRating).slice(0, 5);
  }, [data]);

  // Current Focus Control
  const [selectedIndex, setSelectedIndex] = useState(() => {
    if (focusPlayerName && allMVPs.length > 0) {
      const idx = allMVPs.findIndex(p => p.name === focusPlayerName);
      return idx !== -1 ? idx : 0;
    }
    return 0;
  });

  const focusedPlayer = allMVPs[selectedIndex];

  // Auto cycling state
  const [isCycling, setIsCycling] = useState(false);
  useEffect(() => {
    if (!isCycling || allMVPs.length === 0) return;
    const interval = setInterval(() => {
      setSelectedIndex(prev => (prev + 1) % allMVPs.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [isCycling, allMVPs]);

  if (allMVPs.length === 0 || !focusedPlayer) {
    return (
      <div className="absolute inset-0 bg-[#040408] flex items-center justify-center font-mono text-white gap-2">
        <ShieldAlert className="w-5 h-5 text-red-500 animate-bounce" />
        <span>NO TOURNAMENT CONTENDERS TO DETERMINE MVP ARCHETYPE</span>
      </div>
    );
  }

  // Calculate Radar Axes details on pure responsive SVG
  const maxStats = {
    mvpRating: Math.max(...allMVPs.map(p => p.stats.mvpRating), 1),
    finishes: Math.max(...allMVPs.map(p => p.stats.finishes), 1),
    damage: Math.max(...allMVPs.map(p => p.stats.damage), 1),
    knocks: Math.max(...allMVPs.map(p => p.stats.knocks), 1),
    survivalVal: 20 // Simulated minutes cap
  };

  const getPointsValue = () => {
    const survParts = focusedPlayer.stats.avgSurvival.split(':');
    const mins = parseFloat(survParts[0]) || 0;
    const secs = parseFloat(survParts[1]) || 0;
    const totalMins = mins + (secs / 60);

    const rMvp = (focusedPlayer.stats.mvpRating / maxStats.mvpRating) * 100;
    const rFin = (focusedPlayer.stats.finishes / maxStats.finishes) * 100;
    const rDmg = (focusedPlayer.stats.damage / maxStats.damage) * 100;
    const rKnocks = (focusedPlayer.stats.knocks / maxStats.knocks) * 100;
    const rSurv = Math.min((totalMins / maxStats.survivalVal) * 100, 100);

    return [rMvp, rFin, rDmg, rKnocks, rSurv];
  };

  const axesRatio = getPointsValue(); // returns list of percentages [0-100]

  // Draw SVG polygon points
  const centerCoord = 140;
  const radiusVal = 100;
  const axesLabels = ["IMPACT", "FINISHES", "DAMAGE", "KNOCKOUTS", "SURVIVAL"];

  const getCoordinates = (index: number, valuePercentage: number) => {
    const angle = (Math.PI * 2 / 5) * index - Math.PI / 2; // Pentagon rotated upward
    const trueRadius = (valuePercentage / 100) * radiusVal;
    return {
      x: centerCoord + trueRadius * Math.cos(angle),
      y: centerCoord + trueRadius * Math.sin(angle)
    };
  };

  const polygonPoints = axesRatio.map((val, idx) => {
    const coords = getCoordinates(idx, val);
    return `${coords.x},${coords.y}`;
  }).join(' ');

  const handleHardReset = () => {
    setIsResetting(true);
    setTimeout(() => {
      setSelectedThemeId('matrix');
      setSelectedIndex(0);
      setActiveGame('scarfall');
      setIsResetting(false);
    }, 850);
  };

  const handleExportPNG = async () => {
    if (!containerRef.current) return;
    setIsCapturing(true);
    setCaptureStatus("ALIGNING HUD RASTER SCANNER...");

    // Wait for component transition
    await new Promise(r => setTimeout(r, 200));

    try {
      setCaptureStatus("SAMPLING DENSE STREAM PIXELS...");
      const dataUrl = await toPng(containerRef.current, {
        backgroundColor: '#040408',
        pixelRatio: 2,
        style: {
          transform: 'scale(1)',
          transformOrigin: 'top left'
        }
      });
      
      const link = document.createElement('a');
      link.download = `FRAGLAB_TOURNAMENT_MVP_${focusedPlayer.name.toUpperCase()}_${activeGame}.png`;
      link.href = dataUrl;
      link.click();
      
      setCaptureStatus("INTEL EXTRACTED_SUCCESSFULLY!");
    } catch (err) {
      console.error(err);
      setCaptureStatus("ERROR EXPORTING: INTERFERENCE DETECTED");
    } finally {
      setTimeout(() => {
        setIsCapturing(false);
        setCaptureStatus(null);
      }, 1500);
    }
  };

  // Determine Class Archetype
  const getPlayerArchetype = (name: string): { title: string; desc: string; icon: React.ReactNode } => {
    const sum = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const options = [
      { title: "BATTLE ASSAULTER", desc: "Aggressive entry fragging combat specialty.", icon: <Flame className="w-4 h-4 text-orange-500" /> },
      { title: "TACTICAL FLANKER", desc: "Advanced positioning and high impact finishes.", icon: <Target className="w-4 h-4 text-cyan-500" /> },
      { title: "SUPPORT OVERWATCH", desc: "Lethal support damage and layout utility support.", icon: <Activity className="w-4 h-4 text-emerald-500" /> },
      { title: "CLUTCH CHIEF", desc: "Supreme performance under extreme survival stakes.", icon: <Swords className="w-4 h-4 text-yellow-500" /> }
    ];
    return options[sum % options.length];
  };

  const currentArchetype = getPlayerArchetype(focusedPlayer.name);

  return (
    <div 
      ref={containerRef}
      className={cn(
        "absolute inset-0 z-[100] flex flex-col overflow-hidden font-sans select-none bg-black text-white"
      )}
    >
      {/* Full screen scan overlay */}
      <AnimatePresence>
        {(isResetting || isCapturing) && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[120] bg-[#020205]/95 backdrop-blur-md flex flex-col items-center justify-center border-2 border-dashed border-white/15"
          >
            <div className="text-center space-y-6 max-w-sm px-6">
              <RefreshCw className="w-14 h-14 animate-spin mx-auto text-cyan-400" style={{ color: accentColor }} />
              <div>
                <p className="font-mono text-[10px] tracking-[0.3em] font-black uppercase text-white/50 mb-1">
                  CORE SYSTEMS DIAGNOSTIC
                </p>
                <p className="text-sm font-bold uppercase tracking-tight" style={{ color: accentColor }}>
                  {captureStatus || "HARD_RECALIBRATING_MVP_BOARD_TELEMETRY..."}
                </p>
              </div>
              <div className="w-56 h-[3px] bg-white/5 mx-auto overflow-hidden relative border border-white/5">
                <motion.div 
                  initial={{ left: '-100%' }}
                  animate={{ left: '100%' }}
                  transition={{ duration: 0.9, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute inset-y-0 w-2/3"
                  style={{ backgroundColor: accentColor }}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cyber Background Mesh and Orbits */}
      <div className="absolute inset-0 z-0">
        <div 
          className="absolute inset-0 opacity-[0.03]" 
          style={{ 
            backgroundImage: `linear-gradient(${accentColor} 1px, transparent 1px), linear-gradient(90deg, ${accentColor} 1px, transparent 1px)`,
            backgroundSize: '36px 36px'
          }}
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_10%,#040408_95%)]" />

        {/* Floating tech nodes */}
        {[...Array(6)].map((_, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: [0, 0.15, 0], scale: [0.8, 1.2, 0.8] }}
            transition={{ duration: 7 + i * 2, repeat: Infinity, ease: "linear" }}
            className="absolute rounded-full border border-current pointer-events-none"
            style={{ 
              color: accentColor, 
              width: `${150 + i * 100}px`, 
              height: `${150 + i * 100}px`,
              left: `${15 + i * 10}%`,
              top: `${20 + i * 8}%`
            }}
          />
        ))}
      </div>

      {/* Ribbon Ticker for cyber branding stream */}
      <div className="absolute top-0 inset-x-0 h-6 bg-black border-b border-white/5 flex items-center z-50 overflow-hidden text-[9px] font-mono tracking-widest text-white/40">
        <motion.div 
          className="flex whitespace-nowrap gap-12 px-6 items-center"
          animate={{ x: [0, -1000] }}
          transition={{ duration: 24, repeat: Infinity, ease: "linear" }}
        >
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex gap-12 items-center">
              <span>ELITE FORCE DIAGRAM // SECTION_MVP_V6.0.4</span>
              <span style={{ color: accentColor }}>SYSTEM_STATUS: HIGH_PERFORMANCE</span>
              <span>ORG: {branding.orgName?.toUpperCase() || 'FRAGLAB'}</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>STABILITY LEVEL SECURE 99.98%</span>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Main Container Grid */}
      <div className="relative z-10 flex-1 flex flex-col px-4 md:px-10 pt-10 pb-8 overflow-y-auto">
        {/* Dynamic header details */}
        <div className="flex flex-col md:flex-row justify-between items-center md:items-end border-b border-white/10 pb-4 mb-4 gap-4 flex-shrink-0">
          <div className="text-center md:text-left">
            <span className="font-mono text-[9px] uppercase tracking-[0.4em] text-cyan-400 font-bold block mb-1">
              {branding.orgName || 'FRAGLAB'} CHAMPIONSHIP INSIGNIA
            </span>
            <h1 className="text-4xl md:text-5xl font-black uppercase italic tracking-tighter leading-none text-white font-sans">
              TOURNAMENT <span style={{ color: accentColor, textShadow: `0 0 20px ${accentColor}40` }}>MVP</span>
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-white/50 uppercase">ACTIVE CONFIG:</span>
            <div 
              className="px-2 py-1 font-mono text-[9px] font-black uppercase text-black italic rounded-sm shadow-md"
              style={{ backgroundColor: accentColor }}
            >
              Preset_{currentTheme.name}
            </div>
          </div>
        </div>

        {/* Dynamic Dual/Triple Layout */}
        <div className="flex-1 min-h-0 flex flex-col xl:flex-row gap-6 mt-2 relative">
          
          {/* Spotlight Stage (LEFT column) */}
          <div className={cn(
            "flex flex-col items-center justify-center bg-white/[0.01] border border-white/5 p-4 rounded-xl relative overflow-hidden shrink-0",
            isPortrait ? "w-full" : "w-full xl:w-[450px]"
          )}>
            {/* Tech grid frame background decoration */}
            <div className="absolute top-2 left-2 text-[8px] font-mono text-white/20">TARGET_SYSTEM_GRID</div>
            <div className="absolute bottom-2 right-2 text-[8px] font-mono text-white/20">0b5079eb-4664-4fb4-810e-9dc7f425fa58</div>

            <AnimatePresence mode="wait">
              <motion.div
                key={focusedPlayer.id}
                initial={{ opacity: 0, scale: 0.95, pointerEvents: 'none' }}
                animate={{ opacity: 1, scale: 1, pointerEvents: 'auto' }}
                exit={{ opacity: 0, scale: 1.02 }}
                transition={{ duration: 0.4 }}
                className="flex flex-col items-center"
              >
                <MVPCard 
                  player={focusedPlayer} 
                  isPrimary={selectedIndex === 0} 
                  accentColor={accentColor} 
                  rank={selectedIndex + 1}
                  gameMode={activeGame}
                />

                {/* Operator Class Details Sub-Card */}
                <div 
                  className="w-full max-w-[340px] mt-4 bg-block border p-3 flex gap-3 relative"
                  style={{ 
                    backgroundColor: 'rgba(0,0,0,0.85)',
                    borderColor: `${accentColor}30`
                  }}
                >
                  <div 
                    className="w-10 h-10 shrink-0 rounded-sm flex items-center justify-center bg-white/5 border border-white/10"
                    style={{ color: accentColor }}
                  >
                    {currentArchetype.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h5 className="text-[10px] font-mono font-bold uppercase text-white/40 leading-none">ARCHETYPE CLASSIFICATION</h5>
                    <h4 className="text-xs font-black text-white leading-none uppercase mt-1 tracking-tight" style={{ color: accentColor }}>
                      {currentArchetype.title}
                    </h4>
                    <p className="text-[9.5px] text-white/53 mt-1 leading-normal truncate">{currentArchetype.desc}</p>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Advanced Analytics Board (MIDDLE Pane) */}
          <div className="flex-1 flex flex-col bg-white/[0.01] border border-white/5 p-5 rounded-xl justify-between min-w-0">
            <div>
              <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-cyan-400" style={{ color: accentColor }} />
                  <h3 className="font-mono text-xs font-black uppercase text-white tracking-widest">TACTICAL WEAPON STATISTICS</h3>
                </div>
                <div className="flex gap-1.5">
                  <div className="w-2 h-2 rounded bg-red-500 animate-pulse" />
                  <span className="text-[9px] font-mono text-white/40 uppercase">CORE ANALYSIS</span>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* 5-Axis Pure responsive SVG radar chart (No dependency sizes issues) */}
                <div className="flex flex-col items-center justify-center bg-black/60 rounded-xl p-4 border border-white/5 relative">
                  <div className="absolute top-2 left-2 text-[7.5px] font-mono text-white/40 tracking-wider">RADAR COMBAT PATH</div>
                  
                  <svg width="280" height="280" className="drop-shadow-[0_0_12px_rgba(0,0,0,0.8)]">
                    {/* Ring circles backings */}
                    {[1, 2, 3, 4, 5].map((level, i) => {
                      const levelRad = (level / 5) * radiusVal;
                      return (
                        <circle 
                          key={i}
                          cx={centerCoord}
                          cy={centerCoord}
                          r={levelRad}
                          className="fill-none stroke-white/10"
                          strokeWidth="1"
                          strokeDasharray={level === 5 ? "0" : "3 3"}
                        />
                      );
                    })}

                    {/* Polygon paths grids */}
                    {[...Array(5)].map((_, idx) => {
                      const endCoord = getCoordinates(idx, 100);
                      return (
                        <line 
                          key={idx}
                          x1={centerCoord}
                          y1={centerCoord}
                          x2={endCoord.x}
                          y2={endCoord.y}
                          className="stroke-white/10"
                          strokeWidth="1"
                        />
                      );
                    })}

                    {/* Labels text */}
                    {axesLabels.map((label, idx) => {
                      const coord = getCoordinates(idx, 118);
                      // Adjust text alignment helper coordinates
                      const textAnchor = idx === 0 ? "middle" : (idx === 1 || idx === 2) ? "start" : "end";
                      const yOffset = idx === 0 ? -5 : idx === 3 || idx === 1 ? 5 : 12;
                      return (
                        <text 
                          key={label}
                          x={coord.x}
                          y={coord.y + yOffset}
                          className="font-mono text-[7.5px] font-bold tracking-widest text-[#888899]"
                          textAnchor={textAnchor}
                          fill="currentColor"
                        >
                          {label}
                        </text>
                      );
                    })}

                    {/* Vector Plot Area Outline connecting dynamic points */}
                    <polygon 
                      points={polygonPoints}
                      fill={`${accentColor}1A`}
                      stroke={accentColor}
                      strokeWidth="2.5"
                      className="transition-all duration-700 ease-out"
                    />

                    {/* Individual axis coordinates plot lights (glowing interactive dots) */}
                    {axesRatio.map((val, idx) => {
                      const coord = getCoordinates(idx, val);
                      return (
                        <circle 
                          key={idx}
                          cx={coord.x}
                          cy={coord.y}
                          r="4"
                          className="transition-all duration-700 ease-out"
                          fill={accentColor}
                          stroke="#ffffff"
                          strokeWidth="1.5"
                        />
                      );
                    })}
                  </svg>
                </div>

                {/* KPI Metrics gauges and sliders */}
                <div className="flex flex-col gap-4 justify-center">
                  <div className="bg-black/40 border border-white/5 p-4 rounded-xl flex flex-col gap-3">
                    <span className="text-[9px] font-mono text-white/40 tracking-widest uppercase">DIAGNOSTIC TELEMETRY</span>
                    
                    {/* Gauge percentage 1 */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-white/60 uppercase font-mono tracking-tight flex items-center gap-1">
                          <Trophy className="w-3 h-3 text-yellow-500" /> Overall Impact Grade
                        </span>
                        <span className="font-bold font-mono" style={{ color: accentColor }}>
                          {(focusedPlayer.stats.mvpRating).toFixed(1)} Pts
                        </span>
                      </div>
                      <div className="w-full bg-white/5 h-1.5 rounded-none overflow-hidden relative border border-white/5">
                        <motion.div 
                          className="absolute inset-y-0"
                          style={{ backgroundColor: accentColor }}
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min((focusedPlayer.stats.mvpRating / maxStats.mvpRating) * 100, 100)}%` }}
                          transition={{ duration: 0.8 }}
                        />
                      </div>
                    </div>

                    {/* Gauge percentage 2 */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-white/60 uppercase font-mono tracking-tight flex items-center gap-1">
                          <Skull className="w-3 h-3 text-red-500" /> Roster Kill Conversion
                        </span>
                        <span className="font-bold font-mono text-cyan-400">
                          {focusedPlayer.stats.finishes} kills
                        </span>
                      </div>
                      <div className="w-full bg-white/5 h-1.5 rounded-none overflow-hidden relative border border-white/5">
                        <motion.div 
                          className="absolute inset-y-0 bg-cyan-400"
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min((focusedPlayer.stats.finishes / maxStats.finishes) * 100, 100)}%` }}
                          transition={{ duration: 0.8 }}
                        />
                      </div>
                    </div>

                    {/* Gauge percentage 3 */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-white/60 uppercase font-mono tracking-tight flex items-center gap-1">
                          <Crosshair className="w-3 h-3 text-emerald-500" /> Knockout Contributions
                        </span>
                        <span className="font-bold font-mono text-[#00FF52]">
                          {focusedPlayer.stats.knocks} knocks
                        </span>
                      </div>
                      <div className="w-full bg-white/5 h-1.5 rounded-none overflow-hidden relative border border-white/5">
                        <motion.div 
                          className="absolute inset-y-0 bg-emerald-500"
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min((focusedPlayer.stats.knocks / maxStats.knocks) * 100, 100)}%` }}
                          transition={{ duration: 0.8 }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* System Logging outputs */}
                  <div className="p-3.5 bg-black border border-white/10 rounded-xl space-y-1.5 relative overflow-hidden">
                    <div className="absolute top-1 right-1 px-1.5 py-0.5 font-mono text-[6px] uppercase tracking-widest bg-white/10 text-white/50 rounded">
                      CONSOLE SECURE
                    </div>
                    <p className="font-mono text-[7.5px] text-white/30 tracking-tight leading-none mb-2">RUNNING_ELITE_MVP_GRID_DIAGNOSTICS...</p>
                    <p className="font-mono text-[10px] text-[#00FF66] leading-none mb-1">
                      LOG: <span className="text-white">Analyzing performance of</span> {focusedPlayer.name}
                    </p>
                    <p className="font-mono text-[10px] text-cyan-400 leading-none mb-1">
                      MEDAL: <span className="text-white">Team</span> {focusedPlayer.teamName} <span className="text-white">holds rank index #{selectedIndex + 1}</span>
                    </p>
                    <p className="font-mono text-[10px] text-white/40 leading-none">
                      DIAG: Conversion index {((focusedPlayer.stats.finishes / (focusedPlayer.stats.mvpRating || 1)) * 100).toFixed(0)}% // ALL SYSTEMS STABLE
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* In-Canvas Aesthetic Hud options */}
            <div className="border-t border-white/10 pt-4 mt-6">
              <span className="text-[10px] font-mono tracking-widest uppercase text-white/40 block mb-2 font-bold flex items-center gap-2">
                <Palette className="w-3.5 h-3.5" style={{ color: accentColor }} /> Aesthetic Hud Configurations
              </span>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Theme Selector presets */}
                <div className="bg-black/60 border border-white/10 rounded-lg p-2 flex flex-col justify-center">
                  <span className="text-[8px] font-mono text-white/30 tracking-widest uppercase block mb-1.5 ml-1">VECTOR COLOR MATRIX</span>
                  <div className="flex flex-wrap gap-1">
                    {THEME_PRESETS.map(preset => (
                      <button
                        key={preset.id}
                        onClick={() => setSelectedThemeId(preset.id as any)}
                        title={preset.name}
                        className={cn(
                          "w-6 h-6 rounded-full flex items-center justify-center border-2 transition-all transition-scale",
                          selectedThemeId === preset.id ? "scale-105 border-white" : "border-transparent hover:scale-105"
                        )}
                        style={{ backgroundColor: preset.accent }}
                      />
                    ))}
                  </div>
                </div>

                {/* Game mode Rules custom toggle */}
                <div className="bg-black/60 border border-white/10 rounded-lg p-2 flex flex-col justify-center">
                  <span className="text-[8px] font-mono text-white/30 tracking-widest uppercase block mb-1.5 ml-1">RULES PROTOCOL</span>
                  <div className="grid grid-cols-2 gap-1 bg-white/5 p-0.5 rounded-md border border-white/5">
                    <button
                      onClick={() => setActiveGame('scarfall')}
                      className={cn(
                        "py-1 text-[9px] font-black uppercase text-center rounded-sm transition-all",
                        activeGame === 'scarfall' ? "bg-white text-black font-extrabold" : "text-white/40 hover:text-white"
                      )}
                    >
                      Scarfall
                    </button>
                    <button
                      onClick={() => setActiveGame('bgmi')}
                      className={cn(
                        "py-1 text-[9px] font-black uppercase text-center rounded-sm transition-all",
                        activeGame === 'bgmi' ? "bg-white text-black font-extrabold" : "text-white/40 hover:text-white"
                      )}
                    >
                      BGMI
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Core Clickable Contenders list (RIGHT Column) */}
          <div className={cn(
            "flex flex-col bg-white/[0.01] border border-white/5 p-4 rounded-xl shrink-0 gap-3",
            isPortrait ? "w-full" : "w-full xl:w-[260px]"
          )}>
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <span className="font-mono text-xs uppercase font-black text-white/40 tracking-wider flex items-center gap-2">
                <Grid className="w-3.5 h-3.5 text-orange-500" style={{ color: accentColor }} /> CONTPR_ROSTER
              </span>
              <span className="text-[8px] font-mono bg-white/10 px-1 py-0.5 text-white/50 uppercase rounded">TOP 5</span>
            </div>

            {/* Clickable Contender Slots */}
            <div className="flex-1 flex flex-col gap-2 relative z-10 overflow-y-auto no-scrollbar">
              {allMVPs.map((player, idx) => {
                const isSelected = selectedIndex === idx;
                return (
                  <button
                    key={player.id}
                    onClick={() => setSelectedIndex(idx)}
                    className={cn(
                      "w-full text-left p-2 border transition-all duration-300 relative group flex items-center gap-3 bg-black flex-shrink-0 cursor-pointer",
                      isSelected 
                        ? "" 
                        : "border-white/5 hover:border-white/25 hover:bg-white/[0.02]"
                    )}
                    style={{ 
                      borderColor: isSelected ? accentColor : 'rgba(255,255,255,0.05)',
                      boxShadow: isSelected ? `2px 2px 0px 0px ${accentColor}` : 'none'
                    }}
                  >
                    {/* Compact numerical indicator */}
                    <div 
                      className="w-7 h-7 flex items-center justify-center border font-mono text-xs font-black shrink-0 animate-fade-in"
                      style={{ 
                        borderColor: isSelected ? accentColor : 'rgba(255,255,255,0.15)',
                        backgroundColor: isSelected ? `${accentColor}15` : 'transparent',
                        color: isSelected ? '#ffffff' : 'rgba(255,255,255,0.4)'
                      }}
                    >
                      {idx + 1}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black text-white truncate pr-2">{player.name}</span>
                        <span className="text-[9px] font-bold shrink-0" style={{ color: isSelected ? accentColor : '#999' }}>
                          Rating {player.stats.mvpRating.toFixed(0)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-[8.5px] tracking-tight font-mono text-white/45 truncate max-w-[150px]">{player.teamName}</span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Live Autoplay Loop toggle */}
            <div className="pt-2 border-t border-dashed border-white/15">
              <button
                onClick={() => setIsCycling(!isCycling)}
                className={cn(
                  "w-full py-2 text-[9px] font-mono uppercase tracking-wider font-extrabold border transition-all flex items-center justify-center gap-2 cursor-pointer",
                  isCycling 
                    ? "bg-[#00FF52]/10 border-[#00FF52]/40 text-[#00FF52] hover:bg-[#00FF52]/15 animate-pulse" 
                    : "bg-white/5 border-white/15 text-white/60 hover:text-white"
                )}
              >
                <RefreshCw className={cn("w-3.5 h-3.5", isCycling ? "animate-spin" : "")} style={{ animationDuration: '4s' }} />
                <span>{isCycling ? "AUTOPLAY_LIVE" : "START_AUTOPLAY"}</span>
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* Broadcaster Controller footer bar */}
      <div className="relative z-50 p-4 shrink-0 flex flex-col md:flex-row justify-between items-center gap-4 bg-[#050508] border-t border-white/10">
        <div className="flex items-center gap-6">
          {onClose && (
            <button 
              onClick={onClose}
              className="group relative px-6 py-1.5 overflow-hidden border border-white/20 hover:border-white transition-all bg-black cursor-pointer"
            >
              <span className="relative z-10 text-white font-mono uppercase font-black text-[10px]">
                TERMINATE_STAGE_SESSION
              </span>
            </button>
          )}

          <button 
            onClick={handleHardReset}
            className="group px-4 py-1.5 border border-[#ef4444]/40 hover:border-[#ef4444] transition-all bg-black text-[#ef4444] font-mono text-[10px] font-bold flex items-center gap-2 cursor-pointer"
            title="Recalibrate core system aesthetics and weights"
          >
            <RotateCcw className="w-3.5 h-3.5 text-[#ef4444]" />
            <span>RECALIBR_HUD</span>
          </button>
        </div>

        <div className="flex items-center gap-4">
          <button 
            onClick={handleExportPNG}
            disabled={isCapturing}
            className="group relative flex items-center gap-2.5 px-8 py-2 bg-white text-black font-mono text-[10px] font-black uppercase overflow-hidden hover:scale-105 active:scale-95 transition-all max-md:w-full justify-center"
            style={{ backgroundColor: accentColor }}
          >
            <Download className="w-4 h-4 text-black" />
            <span>GENERATE_STREAM_PNG</span>
          </button>
        </div>
      </div>
    </div>
  );
};
