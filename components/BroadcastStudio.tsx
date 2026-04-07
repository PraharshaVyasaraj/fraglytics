
import React, { useState, useEffect, useRef } from 'react';
import { TeamData, BrandingConfig } from '../types';
import ExportRenderer, { ExportMode, AspectRatio, ExportTheme, ExportLayout } from './ExportRenderer';
import { X, Download, LayoutTemplate, Trophy, User, Swords, ChevronDown, MonitorPlay, Smartphone, Monitor, Square, Crown, LogOut, ChevronLeft, ChevronRight, ListOrdered, Crosshair, Copy, Palette, Layout, Type, Contact, Users, Sliders, Zap, ArrowRightLeft, Shield, Settings, ImageIcon } from 'lucide-react';
import { toPng } from 'html-to-image';

interface BroadcastStudioProps {
  isOpen: boolean;
  onClose: () => void;
  data: TeamData[];
  defaultTitle: string;
  defaultSubtitle: string;
  branding: BrandingConfig;
  initialMode?: ExportMode;
  initialFocusTeamId?: string;
  initialFocusPlayerName?: string;
}

export interface VisualConfig {
    headerScale: number;
    rankScale: number;
    statPriority: 'combat' | 'rating';
    spacing: number;
    padding: number;
    itemSpacing: number;
    containerPadding: number;
    rowHeight: number;
    fontScale: number;
}

const BroadcastStudio: React.FC<BroadcastStudioProps> = ({ isOpen, onClose, data, defaultTitle, defaultSubtitle, branding, initialMode, initialFocusTeamId, initialFocusPlayerName }) => {
  const [mode, setMode] = useState<ExportMode>('standings');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('16:9');
  
  // Design State
  const [theme, setTheme] = useState<ExportTheme>('protocol');
  const [layout, setLayout] = useState<ExportLayout>('classic');

  // Visual Tuning State
  const [visualConfig, setVisualConfig] = useState<VisualConfig>({
      headerScale: 1,
      rankScale: 1.2, 
      statPriority: 'combat',
      spacing: 1,
      padding: 1,
      itemSpacing: 1,
      containerPadding: 1,
      rowHeight: 1,
      fontScale: 1
  });

  const [title, setTitle] = useState(defaultTitle);
  const [subtitle, setSubtitle] = useState(defaultSubtitle);
  
  // Selection State
  const [focusTeamId, setFocusTeamId] = useState<string>(data[0]?.name || '');
  const [compareTeamId, setCompareTeamId] = useState<string>(data[1]?.name || '');
  const [focusPlayerName, setFocusPlayerName] = useState<string>(data[0]?.players[0]?.playerName || '');
  const [comparePlayerName, setComparePlayerName] = useState<string>(data[1]?.players[0]?.playerName || '');
  const [comparePlayerTeamId, setComparePlayerTeamId] = useState<string>(data[1]?.name || data[0]?.name || '');

  // Team Grid Specific State
  const [teamLogos, setTeamLogos] = useState<Record<string, string>>({});
  const [timerSeconds, setTimerSeconds] = useState<number>(569); // 09:29
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);

  // Tab State
  const [activeTab, setActiveTab] = useState<'content' | 'design' | 'assets' | 'edit'>('edit');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const settingsRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
        setIsSettingsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  const [customBackground, setCustomBackground] = useState<string | undefined>(branding.customBackground);
  
  // Sync player selection when team changes
  useEffect(() => {
    const team = data.find(t => t.name === focusTeamId);
    if (team && team.players.length > 0) {
        if (!team.players.some(p => p.playerName === focusPlayerName)) {
            setFocusPlayerName(team.players[0].playerName);
        }
    }
  }, [focusTeamId, data]);

  useEffect(() => {
    const team = data.find(t => t.name === comparePlayerTeamId);
    if (team && team.players.length > 0) {
        if (!team.players.some(p => p.playerName === comparePlayerName)) {
            setComparePlayerName(team.players[0].playerName);
        }
    }
  }, [comparePlayerTeamId, data]);

  // Pagination State
  const [page, setPage] = useState(1);
  const [isExporting, setIsExporting] = useState(false);
  
  // Scaling State
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.5);

  // Constants
  const ROWS_PER_PAGE_STANDINGS = 8; 
  const ROWS_PER_PAGE_PLAYERS = 8; 

  const getRowsPerPage = () => {
      if (mode === 'standings') return ROWS_PER_PAGE_STANDINGS;
      if (mode === 'player_leaderboard') return ROWS_PER_PAGE_PLAYERS;
      if (mode === 'team_grid') return 16;
      return 100; 
  };

  const getTotalPages = () => {
      if (mode === 'standings') return Math.ceil(data.length / ROWS_PER_PAGE_STANDINGS);
      if (mode === 'team_grid') return Math.ceil(data.length / 16);
      if (mode === 'player_leaderboard') {
          const playerCount = data.reduce((sum, t) => sum + t.players.length, 0);
          return Math.ceil(playerCount / ROWS_PER_PAGE_PLAYERS);
      }
      return 1;
  };

  const totalPages = getTotalPages();

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerRunning && timerSeconds > 0) {
        interval = setInterval(() => {
            setTimerSeconds(prev => prev - 1);
        }, 1000);
    } else if (timerSeconds === 0) {
        setIsTimerRunning(false);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timerSeconds]);

  useEffect(() => {
    if (isOpen) {
        setMode(initialMode || 'standings');
        setTitle(defaultTitle);
        setSubtitle(defaultSubtitle);
        setPage(1); 
        
        if (initialFocusTeamId) setFocusTeamId(initialFocusTeamId);
        else if (data.length > 0) setFocusTeamId(data[0].name);

        if (initialFocusPlayerName) setFocusPlayerName(initialFocusPlayerName);
        else {
             const bestPlayer = [...data[0].players].sort((a,b) => b.impactScore - a.impactScore)[0];
             if (bestPlayer) setFocusPlayerName(bestPlayer.playerName);
        }

        setCompareTeamId(data.length > 1 ? data[1].name : data[0].name);
    }
  }, [isOpen, defaultTitle, defaultSubtitle, data, initialMode, initialFocusTeamId, initialFocusPlayerName]);

  useEffect(() => {
    const updateScale = () => {
        if (containerRef.current) {
            const { clientWidth, clientHeight } = containerRef.current;
            let targetW = 1920; 
            let targetH = 1080;
            if (aspectRatio === '9:16') { targetW = 1080; targetH = 1920; }
            if (aspectRatio === '1:1') { targetW = 1080; targetH = 1080; }
            
            const padding = 32; // Reduced from 64
            const availableW = clientWidth - padding;
            const availableH = clientHeight - padding;
            
            const scaleW = availableW / targetW;
            const scaleH = availableH / targetH;
            
            setScale(Math.min(scaleW, scaleH, 1.1)); // Fit to screen
        }
    };
    
    window.addEventListener('resize', updateScale);
    return () => {
        window.removeEventListener('resize', updateScale);
    };
  }, [aspectRatio, isOpen, isSidebarCollapsed]);

  useEffect(() => {
      setPage(1);
  }, [mode]);

  if (!isOpen) return null;

  // Helper to ensure correct background color is captured in PNG
  const getThemeHexBg = (theme: ExportTheme): string => {
        switch (theme) {
            case 'slate': return '#1C2333';
            case 'paper': return '#F1F5F9';
            case 'violet': return '#1E1B2E';
            case 'intelligence': return '#0A0A0A';
            case 'protocol': default: return '#0E0E0E';
        }
  };

  const handleElementClick = (element: string, data?: any) => {
    if (isExporting) return;
    
    switch (element) {
      case 'header':
        setActiveTab('edit');
        setIsSidebarCollapsed(false);
        break;
      case 'team':
        setActiveTab('edit');
        setIsSidebarCollapsed(false);
        if (data?.teamId) setFocusTeamId(data.teamId);
        break;
      case 'footer':
        setActiveTab('edit');
        setIsSidebarCollapsed(false);
        break;
      default:
        break;
    }
  };

  const handleDownload = async (allPages: boolean = false) => {
      const node = document.getElementById('export-container');
      if (!node) return;
      
      setIsExporting(true);
      
      const currentTotalPages = getTotalPages();
      const originalPage = page; 

      try {
          let width = 1920;
          let height = 1080;
          if (aspectRatio === '9:16') { width = 1080; height = 1920; }
          if (aspectRatio === '1:1') { width = 1080; height = 1080; }

          const capture = async (suffix: string) => {
              // Wait for render to clear animations
              await new Promise(r => setTimeout(r, 300));
              
              const dataUrl = await toPng(node, {
                  backgroundColor: getThemeHexBg(theme), // Explicitly pass correct BG color
                  width,
                  height: node.scrollHeight > height ? node.scrollHeight : height,
                  pixelRatio: 1,
                  style: {
                      transform: 'scale(1)', // Reset scale for capture
                      transformOrigin: 'top left',
                      height: node.scrollHeight > height ? `${node.scrollHeight}px` : `${height}px`,
                      overflow: 'visible',
                      // Force kill animations in the capture context
                      animation: 'none',
                      transition: 'none'
                  }
              });
              const link = document.createElement('a');
              link.download = `scarfall_${mode}_${theme}_${suffix}_${Date.now()}.png`;
              link.href = dataUrl;
              link.click();
          };

          // Wait for isExporting to propagate and disable animations
          await new Promise(r => setTimeout(r, 100));

          if (allPages && currentTotalPages > 1) {
              for (let i = 1; i <= currentTotalPages; i++) {
                  setPage(i);
                  await new Promise(r => setTimeout(r, 400)); // Wait for page switch
                  await capture(`_pg${i}`);
              }
              setPage(originalPage); 
          } else {
              await capture(currentTotalPages > 1 ? `_pg${page}` : '');
          }

      } catch (err) {
          console.error(err);
          alert("Failed to render image.");
      } finally {
          setIsExporting(false);
      }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex flex-col animate-in fade-in duration-300">
      
      {/* Toolbar */}
      <div className="h-16 border-b border-tactical-gray bg-tactical-black px-6 flex items-center justify-between">
         <div className="flex items-center gap-3">
            <MonitorPlay className="w-6 h-6 text-white animate-pulse" />
            <span className="font-serif font-bold text-white tracking-widest uppercase">Broadcast Studio</span>
         </div>
          <div className="flex items-center gap-4">
            <button 
                onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                className="flex items-center gap-2 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest bg-white/5 text-white border border-white/10 rounded-sm hover:bg-white/10 transition-all"
                title={isSidebarCollapsed ? "Show Controls" : "Hide Controls"}
            >
                {isSidebarCollapsed ? <LayoutTemplate className="w-3 h-3" /> : <Layout className="w-3 h-3" />}
                <span className="hidden sm:inline">{isSidebarCollapsed ? "Show Controls" : "Hide Controls"}</span>
            </button>
            <div className="relative">
                <button 
                    onClick={() => handleDownload(false)}
                    disabled={isExporting}
                    className="flex items-center gap-2 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest bg-tactical-red text-white border border-tactical-red rounded-sm hover:bg-red-600 transition-all disabled:opacity-50"
                    title="Download Visuals"
                >
                    <Download className="w-3 h-3" />
                    <span className="hidden sm:inline">Download Visuals</span>
                </button>
            </div>

            <div className="relative" ref={settingsRef}>
                <button 
                    onClick={() => setIsSettingsOpen(!isSettingsOpen)} 
                    className={`p-2 rounded-full transition-colors ${isSettingsOpen ? 'bg-tactical-red text-white' : 'hover:bg-white/10 text-white'}`}
                    title="Studio Settings"
                >
                    <Settings className="w-5 h-5" />
                </button>

                {isSettingsOpen && (
                    <div className="absolute right-0 mt-2 w-80 bg-tactical-dark border border-tactical-gray rounded-sm shadow-xl z-50 overflow-hidden">
                        <div className="px-4 py-3 border-b border-tactical-gray bg-black/50 flex items-center justify-between">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-tactical-light">Studio Settings</span>
                            <button 
                                onClick={() => {
                                    setVisualConfig({
                                        headerScale: 1,
                                        rankScale: 1.2, 
                                        statPriority: 'combat',
                                        spacing: 1,
                                        padding: 1,
                                        itemSpacing: 1,
                                        containerPadding: 1,
                                        rowHeight: 1,
                                        fontScale: 1
                                    });
                                }}
                                className="text-[10px] font-bold uppercase tracking-widest text-tactical-red hover:underline"
                            >
                                Reset
                            </button>
                        </div>
                        <div className="p-4 space-y-6 max-h-[70vh] overflow-y-auto">
                            {/* Fine Tuning */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 text-white">
                                    <Sliders className="w-3 h-3 text-tactical-red" />
                                    <span className="text-[10px] font-bold uppercase tracking-widest">Fine Tuning</span>
                                </div>
                                <div className="space-y-3">
                                    <div className="space-y-1">
                                        <div className="flex justify-between text-[10px] font-mono text-tactical-light uppercase">
                                            <span>Header Scale</span>
                                            <span>{visualConfig.headerScale.toFixed(1)}x</span>
                                        </div>
                                        <input 
                                            type="range" min="0.5" max="1.5" step="0.1" value={visualConfig.headerScale}
                                            onChange={(e) => setVisualConfig(prev => ({ ...prev, headerScale: parseFloat(e.target.value) }))}
                                            className="w-full h-1 bg-tactical-gray rounded-lg appearance-none cursor-pointer accent-tactical-red"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <div className="flex justify-between text-[10px] font-mono text-tactical-light uppercase">
                                            <span>Rank Scale</span>
                                            <span>{visualConfig.rankScale.toFixed(1)}x</span>
                                        </div>
                                        <input 
                                            type="range" min="0.5" max="2" step="0.1" value={visualConfig.rankScale}
                                            onChange={(e) => setVisualConfig(prev => ({ ...prev, rankScale: parseFloat(e.target.value) }))}
                                            className="w-full h-1 bg-tactical-gray rounded-lg appearance-none cursor-pointer accent-tactical-red"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <div className="flex justify-between text-[10px] font-mono text-tactical-light uppercase">
                                            <span>Row Spacing</span>
                                            <span>{visualConfig.spacing.toFixed(1)}x</span>
                                        </div>
                                        <input 
                                            type="range" min="0.5" max="2" step="0.1" value={visualConfig.spacing}
                                            onChange={(e) => setVisualConfig(prev => ({ ...prev, spacing: parseFloat(e.target.value) }))}
                                            className="w-full h-1 bg-tactical-gray rounded-lg appearance-none cursor-pointer accent-tactical-red"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <div className="flex justify-between text-[10px] font-mono text-tactical-light uppercase">
                                            <span>Font Scale</span>
                                            <span>{visualConfig.fontScale.toFixed(1)}x</span>
                                        </div>
                                        <input 
                                            type="range" min="0.5" max="1.5" step="0.1" value={visualConfig.fontScale}
                                            onChange={(e) => setVisualConfig(prev => ({ ...prev, fontScale: parseFloat(e.target.value) }))}
                                            className="w-full h-1 bg-tactical-gray rounded-lg appearance-none cursor-pointer accent-tactical-red"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Advanced Mapping */}
                            <div className="space-y-4 pt-4 border-t border-tactical-gray/30">
                                <div className="flex items-center gap-2 text-white">
                                    <Zap className="w-3 h-3 text-yellow-500" />
                                    <span className="text-[10px] font-bold uppercase tracking-widest">Advanced Template Mapping</span>
                                </div>
                                <div className="p-3 bg-black/50 border border-dashed border-tactical-gray rounded-sm text-center">
                                    <p className="text-[10px] text-tactical-light font-mono leading-relaxed">
                                        Upload a custom image template and map data points directly to the visual layer.
                                    </p>
                                    <button className="mt-3 w-full py-2 bg-white/5 border border-white/10 hover:bg-white/10 text-white text-[10px] font-bold uppercase tracking-widest rounded-sm transition-all">
                                        Initialize Mapper
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full text-white transition-colors">
                <X className="w-5 h-5" />
            </button>
          </div>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
         {/* Sidebar Controls */}
         <div className={`bg-tactical-dark border-b lg:border-b-0 lg:border-r border-tactical-gray flex flex-col z-10 transition-all duration-300 ease-in-out overflow-hidden ${isSidebarCollapsed ? 'w-0 lg:w-0' : 'w-full lg:w-80 h-[40vh] lg:h-full'}`}>
            {/* ... Sidebar contents ... */}
            <div className="flex border-b border-tactical-gray">
                <button 
                    onClick={() => setActiveTab('edit')}
                    className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider ${activeTab === 'edit' ? 'bg-tactical-gray/50 text-white' : 'text-tactical-light hover:text-white'}`}
                >
                    Edit
                </button>
                <button 
                    onClick={() => setActiveTab('content')}
                    className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider ${activeTab === 'content' ? 'bg-tactical-gray/50 text-white' : 'text-tactical-light hover:text-white'}`}
                >
                    Content
                </button>
                <button 
                    onClick={() => setActiveTab('design')}
                    className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider ${activeTab === 'design' ? 'bg-tactical-gray/50 text-white' : 'text-tactical-light hover:text-white'}`}
                >
                    Design
                </button>
                <button 
                    onClick={() => setActiveTab('assets')}
                    className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider ${activeTab === 'assets' ? 'bg-tactical-gray/50 text-white' : 'text-tactical-light hover:text-white'}`}
                >
                    Assets
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8">
                
                {activeTab === 'edit' && (
                    <div className="space-y-6 animate-in slide-in-from-left-2">
                        {/* Quick Text Edit */}
                        <div className="space-y-4">
                            <label className="text-xs font-mono uppercase text-tactical-light font-bold flex items-center gap-2">
                                <Type className="w-3 h-3"/> Quick Text Edit
                            </label>
                            <div className="space-y-3">
                                <div>
                                    <span className="text-[10px] text-tactical-light mb-1 block uppercase">Main Title</span>
                                    <input 
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        className="w-full bg-black border border-tactical-gray p-2 text-white text-sm focus:border-tactical-red outline-none rounded-sm"
                                        placeholder="Main Title"
                                    />
                                </div>
                                <div>
                                    <span className="text-[10px] text-tactical-light mb-1 block uppercase">Subtitle</span>
                                    <input 
                                        value={subtitle}
                                        onChange={(e) => setSubtitle(e.target.value)}
                                        className="w-full bg-black border border-tactical-gray p-2 text-tactical-light text-sm focus:border-tactical-red outline-none rounded-sm"
                                        placeholder="Subtitle"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Focus Selection */}
                        <div className="space-y-4 pt-4 border-t border-tactical-gray/30">
                            <label className="text-xs font-mono uppercase text-tactical-light font-bold flex items-center gap-2">
                                <Crosshair className="w-3 h-3"/> Focus Selection
                            </label>
                            
                            <div className="space-y-3">
                                {(mode === 'team_profile' || mode === 'winner' || mode === 'faceoff') && (
                                    <div>
                                        <span className="text-[10px] text-tactical-light mb-1 block uppercase">Focus Team</span>
                                        <div className="relative">
                                            <select 
                                                value={focusTeamId}
                                                onChange={(e) => setFocusTeamId(e.target.value)}
                                                className="w-full bg-black border border-tactical-gray p-2 text-white text-xs appearance-none focus:border-tactical-red outline-none rounded-sm"
                                            >
                                                {data.map(t => <option key={t.name} value={t.name}>{t.name}</option>)}
                                            </select>
                                            <ChevronDown className="absolute right-2 top-2.5 w-3 h-3 text-white pointer-events-none" />
                                        </div>
                                    </div>
                                )}

                                {mode === 'faceoff' && (
                                    <div>
                                        <span className="text-[10px] text-tactical-light mb-1 block uppercase">Compare Team</span>
                                        <div className="relative">
                                            <select 
                                                value={compareTeamId}
                                                onChange={(e) => setCompareTeamId(e.target.value)}
                                                className="w-full bg-black border border-tactical-gray p-2 text-white text-xs appearance-none focus:border-tactical-red outline-none rounded-sm"
                                            >
                                                {data.map(t => <option key={t.name} value={t.name}>{t.name}</option>)}
                                            </select>
                                            <ChevronDown className="absolute right-2 top-2.5 w-3 h-3 text-white pointer-events-none" />
                                        </div>
                                    </div>
                                )}

                                {(mode === 'player_profile' || mode === 'mvp' || mode === 'player_comparison') && (
                                    <div className="space-y-3">
                                        <div>
                                            <span className="text-[10px] text-tactical-light mb-1 block uppercase">Focus Player Team</span>
                                            <div className="relative">
                                                <select 
                                                    value={focusTeamId}
                                                    onChange={(e) => setFocusTeamId(e.target.value)}
                                                    className="w-full bg-black border border-tactical-gray p-2 text-white text-xs appearance-none focus:border-tactical-red outline-none rounded-sm"
                                                >
                                                    {data.map(t => <option key={t.name} value={t.name}>{t.name}</option>)}
                                                </select>
                                                <ChevronDown className="absolute right-2 top-2.5 w-3 h-3 text-white pointer-events-none" />
                                            </div>
                                        </div>
                                        <div>
                                            <span className="text-[10px] text-tactical-light mb-1 block uppercase">Focus Player</span>
                                            <div className="relative">
                                                <select 
                                                    value={focusPlayerName}
                                                    onChange={(e) => setFocusPlayerName(e.target.value)}
                                                    className="w-full bg-black border border-tactical-gray p-2 text-white text-xs appearance-none focus:border-tactical-red outline-none rounded-sm"
                                                >
                                                    {data.find(t => t.name === focusTeamId)?.players.map(p => (
                                                        <option key={p.playerName} value={p.playerName}>{p.playerName}</option>
                                                    ))}
                                                </select>
                                                <ChevronDown className="absolute right-2 top-2.5 w-3 h-3 text-white pointer-events-none" />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {mode === 'player_comparison' && (
                                    <div className="space-y-3 pt-2">
                                        <div>
                                            <span className="text-[10px] text-tactical-light mb-1 block uppercase">Compare Player Team</span>
                                            <div className="relative">
                                                <select 
                                                    value={comparePlayerTeamId}
                                                    onChange={(e) => setComparePlayerTeamId(e.target.value)}
                                                    className="w-full bg-black border border-tactical-gray p-2 text-white text-xs appearance-none focus:border-tactical-red outline-none rounded-sm"
                                                >
                                                    {data.map(t => <option key={t.name} value={t.name}>{t.name}</option>)}
                                                </select>
                                                <ChevronDown className="absolute right-2 top-2.5 w-3 h-3 text-white pointer-events-none" />
                                            </div>
                                        </div>
                                        <div>
                                            <span className="text-[10px] text-tactical-light mb-1 block uppercase">Compare Player</span>
                                            <div className="relative">
                                                <select 
                                                    value={comparePlayerName}
                                                    onChange={(e) => setComparePlayerName(e.target.value)}
                                                    className="w-full bg-black border border-tactical-gray p-2 text-white text-xs appearance-none focus:border-tactical-red outline-none rounded-sm"
                                                >
                                                    {data.find(t => t.name === comparePlayerTeamId)?.players.map(p => (
                                                        <option key={p.playerName} value={p.playerName}>{p.playerName}</option>
                                                    ))}
                                                </select>
                                                <ChevronDown className="absolute right-2 top-2.5 w-3 h-3 text-white pointer-events-none" />
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Visual Quick Tuning */}
                        <div className="space-y-4 pt-4 border-t border-tactical-gray/30">
                            <label className="text-xs font-mono uppercase text-tactical-light font-bold flex items-center gap-2">
                                <Sliders className="w-3 h-3"/> Quick Tuning
                            </label>
                            <div className="space-y-4">
                                <div>
                                    <div className="flex justify-between mb-1">
                                        <span className="text-[10px] text-tactical-light uppercase">Font Scale</span>
                                        <span className="text-[10px] text-white font-mono">{visualConfig.fontScale.toFixed(2)}x</span>
                                    </div>
                                    <input 
                                        type="range" min="0.5" max="2" step="0.05"
                                        value={visualConfig.fontScale}
                                        onChange={(e) => setVisualConfig({...visualConfig, fontScale: parseFloat(e.target.value)})}
                                        className="w-full accent-tactical-red"
                                    />
                                </div>
                                <div>
                                    <div className="flex justify-between mb-1">
                                        <span className="text-[10px] text-tactical-light uppercase">Row Height</span>
                                        <span className="text-[10px] text-white font-mono">{visualConfig.rowHeight.toFixed(2)}x</span>
                                    </div>
                                    <input 
                                        type="range" min="0.5" max="2" step="0.05"
                                        value={visualConfig.rowHeight}
                                        onChange={(e) => setVisualConfig({...visualConfig, rowHeight: parseFloat(e.target.value)})}
                                        className="w-full accent-tactical-red"
                                    />
                                </div>
                            </div>
                        </div>

                        <button 
                            onClick={() => {
                                setVisualConfig({
                                    headerScale: 1,
                                    rankScale: 1,
                                    spacing: 1,
                                    padding: 1,
                                    itemSpacing: 1,
                                    containerPadding: 1,
                                    rowHeight: 1,
                                    fontScale: 1,
                                    statPriority: 'combat'
                                });
                            }}
                            className="w-full py-2 border border-tactical-gray/30 text-[10px] text-tactical-light uppercase hover:bg-tactical-gray/20 transition-colors rounded-sm"
                        >
                            Reset Visuals
                        </button>
                    </div>
                )}

                {activeTab === 'content' && (
                    <>
                        {/* Mode Selector */}
                        <div className="space-y-3">
                        <label className="text-xs font-mono uppercase text-tactical-light font-bold">Graphic Mode</label>
                        <div className="grid grid-cols-2 gap-2">
                            <button 
                                onClick={() => setMode('standings')}
                                className={`flex flex-col items-center justify-center p-3 rounded-sm border transition-all ${mode === 'standings' ? 'bg-tactical-red text-white border-tactical-red' : 'bg-black border-tactical-gray text-tactical-light hover:border-white'}`}
                            >
                                <LayoutTemplate className="w-6 h-6 mb-1" />
                                <span className="text-[10px] uppercase font-bold">Standings</span>
                            </button>
                            <button 
                                onClick={() => setMode('team_profile')}
                                className={`flex flex-col items-center justify-center p-3 rounded-sm border transition-all ${mode === 'team_profile' ? 'bg-blue-500 text-white border-blue-500' : 'bg-black border-tactical-gray text-tactical-light hover:border-white'}`}
                            >
                                <Users className="w-6 h-6 mb-1" />
                                <span className="text-[10px] uppercase font-bold">Team Profile</span>
                            </button>
                            <button 
                                onClick={() => setMode('player_profile')}
                                className={`flex flex-col items-center justify-center p-3 rounded-sm border transition-all ${mode === 'player_profile' ? 'bg-green-500 text-white border-green-500' : 'bg-black border-tactical-gray text-tactical-light hover:border-white'}`}
                            >
                                <Contact className="w-6 h-6 mb-1" />
                                <span className="text-[10px] uppercase font-bold">Player Card</span>
                            </button>
                            <button 
                                onClick={() => setMode('player_leaderboard')}
                                className={`flex flex-col items-center justify-center p-3 rounded-sm border transition-all ${mode === 'player_leaderboard' ? 'bg-purple-600 text-white border-purple-600' : 'bg-black border-tactical-gray text-tactical-light hover:border-white'}`}
                            >
                                <ListOrdered className="w-6 h-6 mb-1" />
                                <span className="text-[10px] uppercase font-bold">Stats</span>
                            </button>
                            <button 
                                onClick={() => setMode('top_fraggers')}
                                className={`flex flex-col items-center justify-center p-3 rounded-sm border transition-all ${mode === 'top_fraggers' ? 'bg-orange-600 text-white border-orange-600' : 'bg-black border-tactical-gray text-tactical-light hover:border-white'}`}
                            >
                                <Crosshair className="w-6 h-6 mb-1" />
                                <span className="text-[10px] uppercase font-bold">Fraggers</span>
                            </button>
                            <button 
                                onClick={() => setMode('winner')}
                                className={`flex flex-col items-center justify-center p-3 rounded-sm border transition-all ${mode === 'winner' ? 'bg-yellow-600 text-white border-yellow-600' : 'bg-black border-tactical-gray text-tactical-light hover:border-white'}`}
                            >
                                <Trophy className="w-6 h-6 mb-1" />
                                <span className="text-[10px] uppercase font-bold">Winner</span>
                            </button>
                            <button 
                                onClick={() => setMode('mvp')}
                                className={`flex flex-col items-center justify-center p-3 rounded-sm border transition-all ${mode === 'mvp' ? 'bg-[#F2C94C] text-black border-[#F2C94C]' : 'bg-black border-tactical-gray text-tactical-light hover:border-white'}`}
                            >
                                <Crown className="w-6 h-6 mb-1" />
                                <span className="text-[10px] uppercase font-bold">MVP</span>
                            </button>
                            <button 
                                onClick={() => setMode('faceoff')}
                                className={`flex flex-col items-center justify-center p-3 rounded-sm border transition-all ${mode === 'faceoff' ? 'bg-blue-600 text-white border-blue-600' : 'bg-black border-tactical-gray text-tactical-light hover:border-white'}`}
                            >
                                <Swords className="w-6 h-6 mb-1" />
                                <span className="text-[10px] uppercase font-bold">Faceoff</span>
                            </button>
                            <button 
                                onClick={() => setMode('hall_of_fame')}
                                className={`flex flex-col items-center justify-center p-3 rounded-sm border transition-all ${mode === 'hall_of_fame' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-black border-tactical-gray text-tactical-light hover:border-white'}`}
                            >
                                <Crown className="w-5 h-5 mb-1" />
                                <span className="text-[10px] uppercase font-bold">Awards</span>
                            </button>
                            <button 
                                onClick={() => setMode('player_comparison')}
                                className={`flex flex-col items-center justify-center p-3 rounded-sm border transition-all ${mode === 'player_comparison' ? 'bg-pink-600 text-white border-pink-600' : 'bg-black border-tactical-gray text-tactical-light hover:border-white'}`}
                            >
                                <Swords className="w-6 h-6 mb-1" />
                                <span className="text-[10px] uppercase font-bold">Compare</span>
                            </button>
                            <button 
                                onClick={() => setMode('team_grid')}
                                className={`flex flex-col items-center justify-center p-3 rounded-sm border transition-all ${mode === 'team_grid' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-black border-tactical-gray text-tactical-light hover:border-white'}`}
                            >
                                <LayoutTemplate className="w-5 h-5 mb-1" />
                                <span className="text-[10px] uppercase font-bold">Groups</span>
                            </button>
                            <button 
                                onClick={() => setMode('sdrr')}
                                className={`flex flex-col items-center justify-center p-3 rounded-sm border transition-all ${mode === 'sdrr' ? 'bg-[#00FF00] text-black border-[#00FF00]' : 'bg-black border-tactical-gray text-tactical-light hover:border-white'}`}
                            >
                                <Trophy className="w-5 h-5 mb-1" />
                                <span className="text-[10px] uppercase font-bold">SDRR</span>
                            </button>
                        </div>
                        </div>

                        {/* Text Config */}
                        <div className="space-y-4 pt-4 border-t border-tactical-gray/30">
                        <label className="text-xs font-mono uppercase text-tactical-light font-bold flex items-center gap-2"><Type className="w-3 h-3"/> Titles</label>
                        <input 
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full bg-black border border-tactical-gray p-2 text-white text-sm focus:border-tactical-red outline-none rounded-sm"
                            placeholder="Main Title"
                        />
                        <input 
                            value={subtitle}
                            onChange={(e) => setSubtitle(e.target.value)}
                            className="w-full bg-black border border-tactical-gray p-2 text-tactical-light text-sm focus:border-tactical-red outline-none rounded-sm"
                            placeholder="Subtitle"
                        />
                        </div>

                        {/* Context Selectors */}
                        <div className="space-y-4 pt-4 border-t border-tactical-gray/30">
                        <label className="text-xs font-mono uppercase text-tactical-light font-bold">Data Selection</label>
                        
                        {mode !== 'standings' && mode !== 'hall_of_fame' && mode !== 'player_leaderboard' && mode !== 'top_fraggers' && (
                            <div>
                                <span className="text-[10px] text-tactical-light mb-1 block">Focus Team</span>
                                <div className="relative">
                                    <select 
                                    value={focusTeamId}
                                    onChange={(e) => setFocusTeamId(e.target.value)}
                                    className="w-full bg-black border border-tactical-gray p-2 text-white text-xs appearance-none focus:border-tactical-red outline-none rounded-sm"
                                    >
                                    {data.map(t => <option key={t.name} value={t.name}>{t.name}</option>)}
                                    </select>
                                    <ChevronDown className="absolute right-2 top-2.5 w-3 h-3 text-white pointer-events-none" />
                                </div>
                            </div>
                        )}

                        {mode === 'faceoff' && (
                            <div className="animate-in slide-in-from-left-2">
                                <span className="text-[10px] text-tactical-light mb-1 block">Opponent Team</span>
                                <div className="relative">
                                    <select 
                                    value={compareTeamId}
                                    onChange={(e) => setCompareTeamId(e.target.value)}
                                    className="w-full bg-black border border-tactical-gray p-2 text-white text-xs appearance-none focus:border-tactical-red outline-none rounded-sm"
                                    >
                                    {data.map(t => <option key={t.name} value={t.name}>{t.name}</option>)}
                                    </select>
                                    <ChevronDown className="absolute right-2 top-2.5 w-3 h-3 text-white pointer-events-none" />
                                </div>
                            </div>
                        )}

                        {(mode === 'mvp' || mode === 'player_profile') && (
                            <div className="animate-in slide-in-from-left-2">
                                <span className="text-[10px] text-tactical-light mb-1 block">Focus Player</span>
                                <div className="relative">
                                    <select 
                                    value={focusPlayerName}
                                    onChange={(e) => setFocusPlayerName(e.target.value)}
                                    className="w-full bg-black border border-tactical-gray p-2 text-white text-xs appearance-none focus:border-tactical-red outline-none rounded-sm"
                                    >
                                    {(data.find(t => t.name === focusTeamId)?.players || []).map(p => <option key={p.playerName} value={p.playerName}>{p.playerName}</option>)}
                                    </select>
                                    <ChevronDown className="absolute right-2 top-2.5 w-3 h-3 text-white pointer-events-none" />
                                </div>
                            </div>
                        )}

                        {mode === 'player_comparison' && (
                            <div className="animate-in slide-in-from-left-2 space-y-4 pt-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] text-tactical-light uppercase font-bold">Comparison Setup</span>
                                    <button 
                                        onClick={() => {
                                            const tempTeamId = focusTeamId;
                                            const tempPlayerName = focusPlayerName;
                                            setFocusTeamId(comparePlayerTeamId);
                                            setFocusPlayerName(comparePlayerName);
                                            setComparePlayerTeamId(tempTeamId);
                                            setComparePlayerName(tempPlayerName);
                                        }}
                                        className="flex items-center gap-1 text-[10px] text-pink-500 hover:text-pink-400 font-bold uppercase transition-colors"
                                    >
                                        <ArrowRightLeft className="w-3 h-3" /> Swap
                                    </button>
                                </div>
                                <div>
                                    <span className="text-[10px] text-tactical-light mb-1 block">Focus Team</span>
                                    <div className="relative">
                                        <select 
                                        value={focusTeamId}
                                        onChange={(e) => setFocusTeamId(e.target.value)}
                                        className="w-full bg-black border border-tactical-gray p-2 text-white text-xs appearance-none focus:border-tactical-red outline-none rounded-sm"
                                        >
                                        {data.map(t => <option key={t.name} value={t.name}>{t.name}</option>)}
                                        </select>
                                        <ChevronDown className="absolute right-2 top-2.5 w-3 h-3 text-white pointer-events-none" />
                                    </div>
                                </div>
                                <div>
                                    <span className="text-[10px] text-tactical-light mb-1 block">Focus Player</span>
                                    <div className="relative">
                                        <select 
                                        value={focusPlayerName}
                                        onChange={(e) => setFocusPlayerName(e.target.value)}
                                        className="w-full bg-black border border-tactical-gray p-2 text-white text-xs appearance-none focus:border-tactical-red outline-none rounded-sm"
                                        >
                                        {(data.find(t => t.name === focusTeamId)?.players || []).map(p => <option key={p.playerName} value={p.playerName}>{p.playerName}</option>)}
                                        </select>
                                        <ChevronDown className="absolute right-2 top-2.5 w-3 h-3 text-white pointer-events-none" />
                                    </div>
                                </div>
                                <div className="pt-2 border-t border-tactical-gray/20">
                                    <span className="text-[10px] text-tactical-light mb-1 block">Opponent Team</span>
                                    <div className="relative">
                                        <select 
                                        value={comparePlayerTeamId}
                                        onChange={(e) => setComparePlayerTeamId(e.target.value)}
                                        className="w-full bg-black border border-tactical-gray p-2 text-white text-xs appearance-none focus:border-tactical-red outline-none rounded-sm"
                                        >
                                        {data.map(t => <option key={t.name} value={t.name}>{t.name}</option>)}
                                        </select>
                                        <ChevronDown className="absolute right-2 top-2.5 w-3 h-3 text-white pointer-events-none" />
                                    </div>
                                </div>
                                <div>
                                    <span className="text-[10px] text-tactical-light mb-1 block">Opponent Player</span>
                                    <div className="relative">
                                        <select 
                                        value={comparePlayerName}
                                        onChange={(e) => setComparePlayerName(e.target.value)}
                                        className="w-full bg-black border border-tactical-gray p-2 text-white text-xs appearance-none focus:border-tactical-red outline-none rounded-sm"
                                        >
                                        {(data.find(t => t.name === comparePlayerTeamId)?.players || []).map(p => <option key={p.playerName} value={p.playerName}>{p.playerName}</option>)}
                                        </select>
                                        <ChevronDown className="absolute right-2 top-2.5 w-3 h-3 text-white pointer-events-none" />
                                    </div>
                                </div>
                            </div>
                        )}
                        </div>

                        {mode === 'team_grid' && (
                            <div className="space-y-4 pt-4 border-t border-tactical-gray/30 animate-in slide-in-from-left-2">
                                <label className="text-xs font-mono uppercase text-tactical-light font-bold">Countdown Timer</label>
                                <div className="flex items-center gap-2">
                                    <input 
                                        type="number" 
                                        value={Math.floor(timerSeconds / 60)}
                                        onChange={(e) => setTimerSeconds(parseInt(e.target.value || '0') * 60 + (timerSeconds % 60))}
                                        className="w-16 bg-black border border-tactical-gray p-2 text-white text-sm text-center focus:border-tactical-red outline-none rounded-sm"
                                        placeholder="Min"
                                    />
                                    <span className="text-white font-bold">:</span>
                                    <input 
                                        type="number" 
                                        value={timerSeconds % 60}
                                        onChange={(e) => setTimerSeconds(Math.floor(timerSeconds / 60) * 60 + parseInt(e.target.value || '0'))}
                                        className="w-16 bg-black border border-tactical-gray p-2 text-white text-sm text-center focus:border-tactical-red outline-none rounded-sm"
                                        placeholder="Sec"
                                    />
                                    <button 
                                        onClick={() => setIsTimerRunning(!isTimerRunning)}
                                        className={`flex-1 p-2 rounded-sm font-bold uppercase text-xs transition-colors ${isTimerRunning ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-green-600 text-white hover:bg-green-700'}`}
                                    >
                                        {isTimerRunning ? 'Stop' : 'Start'}
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}

                {activeTab === 'assets' && (
                    <div className="space-y-6 animate-in slide-in-from-left-2">
                        {/* Global Background */}
                        <div className="space-y-3">
                            <label className="text-xs font-mono uppercase text-tactical-light font-bold flex items-center gap-2">
                                <Monitor className="w-3 h-3"/> Global Background
                            </label>
                            <div className="space-y-2">
                                <div className="relative group">
                                    <input 
                                        type="file" 
                                        accept="image/*"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) {
                                                const reader = new FileReader();
                                                reader.onload = (event) => {
                                                    setCustomBackground(event.target?.result as string);
                                                };
                                                reader.readAsDataURL(file);
                                            }
                                        }}
                                        className="hidden"
                                        id="bg-upload"
                                    />
                                    <label 
                                        htmlFor="bg-upload"
                                        className="w-full h-32 border-2 border-dashed border-tactical-gray hover:border-white transition-all rounded-sm flex flex-col items-center justify-center cursor-pointer bg-black/40 overflow-hidden"
                                    >
                                        {customBackground ? (
                                            <img src={customBackground} alt="Custom BG" className="w-full h-full object-cover opacity-60" />
                                        ) : (
                                            <>
                                                <Download className="w-6 h-6 text-tactical-light mb-2" />
                                                <span className="text-[10px] font-bold uppercase text-tactical-light">Upload Background</span>
                                            </>
                                        )}
                                    </label>
                                    {customBackground && (
                                        <button 
                                            onClick={() => setCustomBackground(undefined)}
                                            className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    )}
                                </div>
                                <p className="text-[9px] text-tactical-light font-mono uppercase">Recommended: 1920x1080 PNG/JPG</p>
                            </div>
                        </div>

                        {/* Team Logos */}
                        <div className="space-y-3 pt-4 border-t border-tactical-gray/30">
                            <label className="text-xs font-mono uppercase text-tactical-light font-bold flex items-center gap-2">
                                <Shield className="w-3 h-3"/> Team Logos
                            </label>
                            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                {data.map(team => (
                                    <div key={team.name} className="flex items-center justify-between bg-black border border-tactical-gray p-2 rounded-sm group">
                                        <div className="flex items-center gap-2 overflow-hidden">
                                            <div className="w-8 h-8 bg-white/5 rounded-sm flex items-center justify-center flex-shrink-0 border border-tactical-gray/30 overflow-hidden">
                                                {teamLogos[team.name] || team.logoUrl ? (
                                                    <img src={teamLogos[team.name] || team.logoUrl} alt="logo" className="w-full h-full object-contain" />
                                                ) : (
                                                    <Shield className="w-4 h-4 text-tactical-light/30" />
                                                )}
                                            </div>
                                            <span className="text-[10px] text-white font-bold truncate">{team.name}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <input 
                                                type="file" 
                                                accept="image/*"
                                                onChange={(e) => {
                                                    const file = e.target.files?.[0];
                                                    if (file) {
                                                        const reader = new FileReader();
                                                        reader.onload = (event) => {
                                                            setTeamLogos(prev => ({...prev, [team.name]: event.target?.result as string}));
                                                        };
                                                        reader.readAsDataURL(file);
                                                    }
                                                }}
                                                className="hidden"
                                                id={`logo-${team.name}`}
                                            />
                                            <label 
                                                htmlFor={`logo-${team.name}`}
                                                className="p-1.5 hover:bg-white/10 rounded-sm cursor-pointer text-tactical-light hover:text-white transition-colors"
                                                title="Upload Logo"
                                            >
                                                <Download className="w-3 h-3" />
                                            </label>
                                            {teamLogos[team.name] && (
                                                <button 
                                                    onClick={() => setTeamLogos(prev => {
                                                        const next = {...prev};
                                                        delete next[team.name];
                                                        return next;
                                                    })}
                                                    className="p-1.5 hover:bg-red-600/20 text-red-500 rounded-sm transition-colors"
                                                    title="Remove Logo"
                                                >
                                                    <X className="w-3 h-3" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
                {activeTab === 'design' && (
                    <div className="space-y-8 animate-in slide-in-from-left-2">
                         {/* Aspect Ratio Selector */}
                        <div className="space-y-3">
                            <label className="text-xs font-mono uppercase text-tactical-light font-bold flex items-center gap-2"><MonitorPlay className="w-3 h-3"/> Canvas Format</label>
                            <div className="grid grid-cols-3 gap-2">
                                <button onClick={() => setAspectRatio('16:9')} className={`flex flex-col items-center p-2 rounded-sm border ${aspectRatio === '16:9' ? 'bg-white text-black border-white' : 'bg-black text-tactical-light border-tactical-gray hover:border-white'}`}>
                                    <Monitor className="w-5 h-5 mb-1" />
                                    <span className="text-[9px] font-bold">16:9</span>
                                </button>
                                <button onClick={() => setAspectRatio('9:16')} className={`flex flex-col items-center p-2 rounded-sm border ${aspectRatio === '9:16' ? 'bg-white text-black border-white' : 'bg-black text-tactical-light border-tactical-gray hover:border-white'}`}>
                                    <Smartphone className="w-5 h-5 mb-1" />
                                    <span className="text-[9px] font-bold">9:16</span>
                                </button>
                                <button onClick={() => setAspectRatio('1:1')} className={`flex flex-col items-center p-2 rounded-sm border ${aspectRatio === '1:1' ? 'bg-white text-black border-white' : 'bg-black text-tactical-light border-tactical-gray hover:border-white'}`}>
                                    <Square className="w-5 h-5 mb-1" />
                                    <span className="text-[9px] font-bold">1:1</span>
                                </button>
                            </div>
                        </div>
                        
                        {/* Theme Selector */}
                        <div className="space-y-3 pt-4 border-t border-tactical-gray/30">
                            <label className="text-xs font-mono uppercase text-tactical-light font-bold flex items-center gap-2"><Palette className="w-3 h-3"/> Visual Theme</label>
                            <div className="grid grid-cols-2 gap-2">
                                <button onClick={() => setTheme('protocol')} className={`p-3 border text-left flex items-center gap-2 ${theme === 'protocol' ? 'bg-tactical-gray border-white text-white' : 'bg-black border-tactical-gray text-tactical-light'}`}>
                                    <div className="w-3 h-3 bg-tactical-black border border-white rounded-full"></div>
                                    <span className="text-xs font-bold uppercase">Protocol</span>
                                </button>
                                <button onClick={() => setTheme('slate')} className={`p-3 border text-left flex items-center gap-2 ${theme === 'slate' ? 'bg-[#1C2333] border-[#94A3B8] text-[#E2E8F0]' : 'bg-black border-tactical-gray text-tactical-light'}`}>
                                    <div className="w-3 h-3 bg-[#94A3B8] rounded-full"></div>
                                    <span className="text-xs font-bold uppercase">Steel</span>
                                </button>
                                <button onClick={() => setTheme('paper')} className={`p-3 border text-left flex items-center gap-2 ${theme === 'paper' ? 'bg-white border-blue-600 text-black' : 'bg-black border-tactical-gray text-tactical-light'}`}>
                                    <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                                    <span className="text-xs font-bold uppercase">Paper</span>
                                </button>
                                <button onClick={() => setTheme('violet')} className={`p-3 border text-left flex items-center gap-2 ${theme === 'violet' ? 'bg-[#1E1B2E] border-[#A78BFA] text-[#F5F3FF]' : 'bg-black border-tactical-gray text-tactical-light'}`}>
                                    <div className="w-3 h-3 bg-[#A78BFA] rounded-full"></div>
                                    <span className="text-xs font-bold uppercase">Dusk</span>
                                </button>
                                <button onClick={() => setTheme('emerald')} className={`p-3 border text-left flex items-center gap-2 ${theme === 'emerald' ? 'bg-emerald-950 border-emerald-400 text-emerald-50' : 'bg-black border-tactical-gray text-tactical-light'}`}>
                                    <div className="w-3 h-3 bg-emerald-400 rounded-full"></div>
                                    <span className="text-xs font-bold uppercase">Toxic</span>
                                </button>
                                <button onClick={() => setTheme('amber')} className={`p-3 border text-left flex items-center gap-2 ${theme === 'amber' ? 'bg-amber-950 border-amber-400 text-amber-50' : 'bg-black border-tactical-gray text-tactical-light'}`}>
                                    <div className="w-3 h-3 bg-amber-400 rounded-full"></div>
                                    <span className="text-xs font-bold uppercase">Hazard</span>
                                </button>
                                <button onClick={() => setTheme('rose')} className={`p-3 border text-left flex items-center gap-2 ${theme === 'rose' ? 'bg-rose-950 border-rose-400 text-rose-50' : 'bg-black border-tactical-gray text-tactical-light'}`}>
                                    <div className="w-3 h-3 bg-rose-400 rounded-full"></div>
                                    <span className="text-xs font-bold uppercase">Crimson</span>
                                </button>
                                <button onClick={() => setTheme('cyan')} className={`p-3 border text-left flex items-center gap-2 ${theme === 'cyan' ? 'bg-cyan-950 border-cyan-400 text-cyan-50' : 'bg-black border-tactical-gray text-tactical-light'}`}>
                                    <div className="w-3 h-3 bg-cyan-400 rounded-full"></div>
                                    <span className="text-xs font-bold uppercase">Neon</span>
                                </button>
                                <button onClick={() => setTheme('intelligence')} className={`p-3 border text-left flex items-center gap-2 ${theme === 'intelligence' ? 'bg-[#1A1A1A] border-[#C5A073] text-white' : 'bg-black border-tactical-gray text-tactical-light'}`}>
                                    <div className="w-3 h-3 bg-[#C5A073] rounded-full"></div>
                                    <span className="text-xs font-bold uppercase">Intelligence</span>
                                </button>
                            </div>
                        </div>

                         {/* Layout Selector */}
                         <div className="space-y-3 pt-4 border-t border-tactical-gray/30">
                            <label className="text-xs font-mono uppercase text-tactical-light font-bold flex items-center gap-2"><Layout className="w-3 h-3"/> Structure</label>
                            <div className="grid grid-cols-2 gap-2">
                                <button onClick={() => setLayout('classic')} className={`p-3 border text-left flex flex-col items-center gap-2 ${layout === 'classic' ? 'bg-white text-black border-white' : 'bg-black border-tactical-gray text-tactical-light'}`}>
                                    <div className="w-full h-8 border border-current opacity-30 flex flex-col p-1 gap-1">
                                        <div className="h-1 bg-current w-full"></div>
                                        <div className="h-3 bg-current w-full opacity-50"></div>
                                    </div>
                                    <span className="text-[10px] font-bold uppercase">Classic</span>
                                </button>
                                <button onClick={() => setLayout('sidebar')} className={`p-3 border text-left flex flex-col items-center gap-2 ${layout === 'sidebar' ? 'bg-white text-black border-white' : 'bg-black border-tactical-gray text-tactical-light'}`}>
                                    <div className="w-full h-8 border border-current opacity-30 flex p-1 gap-1">
                                        <div className="w-1/3 h-full bg-current"></div>
                                        <div className="w-2/3 h-full bg-current opacity-50"></div>
                                    </div>
                                    <span className="text-[10px] font-bold uppercase">Sidebar</span>
                                </button>
                                <button onClick={() => setLayout('main_stage')} className={`p-3 border text-left flex flex-col items-center gap-2 ${layout === 'main_stage' ? 'bg-white text-black border-white' : 'bg-black border-tactical-gray text-tactical-light'}`}>
                                    <div className="w-full h-8 border border-current opacity-30 flex flex-col p-1 gap-1">
                                        <div className="h-2 bg-current w-full skew-x-[-10deg]"></div>
                                        <div className="h-2 bg-current w-full skew-x-[-10deg] opacity-50"></div>
                                    </div>
                                    <span className="text-[10px] font-bold uppercase">Main Stage</span>
                                </button>
                                <button onClick={() => setLayout('analyst')} className={`p-3 border text-left flex flex-col items-center gap-2 ${layout === 'analyst' ? 'bg-white text-black border-white' : 'bg-black border-tactical-gray text-tactical-light'}`}>
                                    <div className="w-full h-8 border border-current opacity-30 flex flex-col p-1 gap-1">
                                        <div className="h-px bg-current w-full"></div>
                                        <div className="h-px bg-current w-full"></div>
                                        <div className="h-px bg-current w-full"></div>
                                    </div>
                                    <span className="text-[10px] font-bold uppercase">Analyst</span>
                                </button>
                                <button onClick={() => setLayout('broadcast_hero')} className={`p-3 border text-left flex flex-col items-center gap-2 ${layout === 'broadcast_hero' ? 'bg-white text-black border-white' : 'bg-black border-tactical-gray text-tactical-light'}`}>
                                    <div className="w-full h-8 border border-current opacity-30 flex flex-col p-1 gap-1 bg-purple-900/50">
                                        <div className="h-2 bg-current w-full mb-1"></div>
                                        <div className="flex gap-1 h-full">
                                            <div className="w-1/2 bg-current opacity-50"></div>
                                            <div className="w-1/2 bg-current opacity-50"></div>
                                        </div>
                                    </div>
                                    <span className="text-[10px] font-bold uppercase">Hero</span>
                                </button>
                                <button onClick={() => setLayout('statistics')} className={`p-3 border text-left flex flex-col items-center gap-2 ${layout === 'statistics' ? 'bg-white text-black border-white' : 'bg-black border-tactical-gray text-tactical-light'}`}>
                                    <div className="w-full h-8 border border-current opacity-30 flex gap-1 p-1">
                                        <div className="w-2/3 bg-current opacity-50"></div>
                                        <div className="w-1/3 flex flex-col gap-1">
                                            <div className="h-1/3 bg-current opacity-30"></div>
                                            <div className="h-1/3 bg-current opacity-30"></div>
                                            <div className="h-1/3 bg-current opacity-30"></div>
                                        </div>
                                    </div>
                                    <span className="text-[10px] font-bold uppercase">Stats</span>
                                </button>
                                <button onClick={() => setLayout('cyber_glitch')} className={`p-3 border text-left flex flex-col items-center gap-2 ${layout === 'cyber_glitch' ? 'bg-white text-black border-white' : 'bg-black border-tactical-gray text-tactical-light'}`}>
                                    <div className="w-full h-8 border border-current opacity-30 flex flex-col p-1 gap-1 relative overflow-hidden">
                                        <div className="h-2 bg-current w-full"></div>
                                        <div className="h-2 bg-current w-full opacity-50 translate-x-1"></div>
                                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
                                    </div>
                                    <span className="text-[10px] font-bold uppercase">Cyber Glitch</span>
                                </button>
                            </div>
                        </div>
                    </div>
                )}

            </div>

            {/* Action Bar */}
            <div className="mt-auto p-6 pt-4 border-t border-tactical-gray space-y-3 bg-tactical-black z-20">
               <button 
                  onClick={() => handleDownload(false)}
                  disabled={isExporting}
                  className="w-full py-4 bg-blue-600 text-white font-black uppercase tracking-widest text-sm hover:bg-blue-700 transition-all flex items-center justify-center gap-2 rounded-sm relative disabled:opacity-50"
               >
                  <Download className="w-4 h-4" /> Download Visuals
               </button>
               {totalPages > 1 && (
                   <button 
                      onClick={() => handleDownload(true)}
                      disabled={isExporting}
                      className="w-full py-4 bg-tactical-gray text-white font-black uppercase tracking-widest text-sm hover:bg-tactical-light transition-all flex items-center justify-center gap-2 rounded-sm relative disabled:opacity-50"
                   >
                      <Copy className="w-4 h-4" /> Download All ({totalPages})
                   </button>
               )}
               <button 
                  onClick={onClose}
                  className="w-full py-4 bg-tactical-red text-white font-black uppercase tracking-widest text-sm hover:bg-red-600 transition-all flex items-center justify-center gap-2 rounded-sm"
               >
                  <LogOut className="w-4 h-4" /> Exit Studio
               </button>
            </div>
         </div>

         {/* Preview Area */}
         <div className="flex-1 bg-black relative overflow-auto" ref={containerRef}>
             {/* Dynamic BG based on theme preview */}
             <div className={`fixed inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] ${theme === 'slate' ? 'from-slate-800 to-black' : theme === 'violet' ? 'from-violet-900 to-black' : 'from-tactical-gray to-black'} pointer-events-none`}></div>
             
             {/* Zoom Controls */}
             <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-30 bg-tactical-dark/80 backdrop-blur-md border border-tactical-gray rounded-full px-4 py-2 flex items-center gap-4 text-white shadow-2xl">
                 <span className="text-[10px] font-bold uppercase tracking-widest text-tactical-light">Zoom</span>
                 <input 
                     type="range" 
                     min="0.1" 
                     max="2" 
                     step="0.05" 
                     value={scale}
                     onChange={(e) => setScale(parseFloat(e.target.value))}
                     className="w-32 h-1 bg-tactical-gray rounded-lg appearance-none cursor-pointer accent-white"
                 />
                 <span className="text-xs font-mono w-12 text-right">{(scale * 100).toFixed(0)}%</span>
                 <button 
                     onClick={() => {
                         // Trigger auto-scale recalculation
                         window.dispatchEvent(new Event('resize'));
                     }}
                     className="text-[10px] font-bold uppercase tracking-widest text-tactical-red hover:text-white transition-colors ml-2"
                 >
                     Auto
                 </button>
             </div>

             {/* Pagination Controls in Preview */}
             {totalPages > 1 && !isExporting && (
                 <div className="fixed top-20 right-8 z-20 bg-tactical-dark border border-tactical-gray rounded-full px-4 py-2 flex items-center gap-4 text-white shadow-xl">
                     <button 
                        onClick={() => setPage(p => Math.max(1, p-1))}
                        disabled={page === 1}
                        className="p-1 hover:text-tactical-red disabled:opacity-30 transition-colors"
                     >
                        <ChevronLeft className="w-5 h-5" />
                     </button>
                     <span className="font-mono font-bold text-sm">PAGE {page} OF {totalPages}</span>
                     <button 
                        onClick={() => setPage(p => Math.min(totalPages, p+1))}
                        disabled={page === totalPages}
                        className="p-1 hover:text-tactical-red disabled:opacity-30 transition-colors"
                     >
                        <ChevronRight className="w-5 h-5" />
                     </button>
                 </div>
             )}

             <div className="min-h-full min-w-full flex items-center justify-center p-4">
                 {/* Dynamic Scale Container */}
                 <div 
                    className="relative shadow-2xl shadow-black border border-tactical-gray/50 transition-all duration-300 ease-out flex-shrink-0" 
                    style={{ 
                        width: (aspectRatio === '9:16' ? 1080 : aspectRatio === '1:1' ? 1080 : 1920) * scale,
                        height: (aspectRatio === '9:16' ? 1920 : aspectRatio === '1:1' ? 1080 : 1080) * scale,
                    }}
                 >
                    <div style={{
                        width: aspectRatio === '9:16' ? 1080 : aspectRatio === '1:1' ? 1080 : 1920,
                        height: aspectRatio === '9:16' ? 1920 : aspectRatio === '1:1' ? 1080 : 1080,
                        transform: `scale(${scale})`,
                        transformOrigin: 'top left'
                    }}>
                        <ExportRenderer 
                           data={data.map(t => ({ ...t, logoUrl: teamLogos[t.name] || t.logoUrl }))} 
                           mode={mode}
                           aspectRatio={aspectRatio}
                           theme={theme}
                           layout={layout}
                           branding={{...branding, customBackground}}
                           config={{ title, subtitle, focusTeamId, compareTeamId, focusPlayerName, comparePlayerName }}
                           pagination={{
                               page,
                               totalPages,
                               rowsPerPage: getRowsPerPage()
                           }}
                           visualConfig={visualConfig}
                           isExporting={isExporting}
                           timerSeconds={timerSeconds}
                           onElementClick={handleElementClick}
                        />
                    </div>
                 </div>
             </div>
             
             <div className="fixed bottom-4 right-4 text-xs font-mono text-tactical-gray flex items-center gap-2 z-20 pointer-events-none">
                <span className="w-2 h-2 rounded-full" style={{backgroundColor: branding.accentColor}}></span>
                {branding.orgName} // {aspectRatio} // Scale: {scale.toFixed(2)}x
             </div>
         </div>
      </div>
    </div>
  );
};

export default BroadcastStudio;
