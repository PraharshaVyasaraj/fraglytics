import React, { useState, useRef, useEffect } from 'react';
import { Crosshair, Settings, ChevronRight, RotateCcw, ShieldCheck, Terminal, Wifi, WifiOff, Download, ChevronDown, Image as ImageIcon, FileText, Layout as LayoutIcon, Maximize, PenTool, Braces, MonitorPlay, Users, Trash2 } from 'lucide-react';
import { Workspace } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  step: 'ingestion' | 'analysis';
  onReset?: () => void;
  mode: 'manual' | 'auto';
  onToggleMode: () => void;
  search?: React.ReactNode;
  activeView?: any;
  onNavigate?: (view: any) => void;
  onOpenStudio?: () => void;
  onOpenSettings?: () => void;
  onBackToHub?: () => void;
  currentGame?: 'scarfall' | 'bgmi' | 'universal' | null;
  onChangeGame?: () => void;
}

const Layout: React.FC<LayoutProps> = ({ 
  children, 
  step, 
  onReset, 
  mode, 
  onToggleMode, 
  search,
  activeView,
  onNavigate,
  onOpenStudio,
  onOpenSettings,
  onBackToHub,
  currentGame,
  onChangeGame
}) => {
  const [isDownloadMenuOpen, setIsDownloadMenuOpen] = useState(false);
  const downloadMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (downloadMenuRef.current && !downloadMenuRef.current.contains(event.target as Node)) {
        setIsDownloadMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleDownload = async (format: 'png' | 'pdf' | 'svg' | 'json', targetId: string, filenamePrefix: string, scale: number = 1) => {
    if (format === 'json') {
      const designTokens = {
        colors: {
          tacticalBlack: '#0a0a0a',
          tacticalDark: '#141414',
          tacticalGray: '#2a2a2a',
          tacticalLight: '#8a8a8a',
          tacticalWhite: '#e0e0e0',
          tacticalRed: '#ff3333',
          tacticalGreen: '#00ffcc',
        },
        typography: {
          sans: 'Inter, ui-sans-serif, system-ui, sans-serif',
          serif: 'Playfair Display, ui-serif, Georgia, serif',
          mono: 'JetBrains Mono, ui-monospace, SFMono-Regular, monospace',
        },
        theme: 'FragLab Tactical UI',
        exportDate: new Date().toISOString()
      };
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(designTokens, null, 2));
      const gamePrefix = localStorage.getItem('fraglab_game_mode') === 'bgmi' ? 'bgmi' : 'scarfall';
      const link = document.createElement('a');
      link.download = `${gamePrefix}-design-tokens-${Date.now()}.json`;
      link.href = dataStr;
      link.click();
      setIsDownloadMenuOpen(false);
      return;
    }

    const node = document.getElementById(targetId);
    if (!node) {
      alert('Target layout not found.');
      return;
    }
    try {
      const { toPng, toSvg } = await import('html-to-image');
      
      // Ensure we capture the full scrollable area (stitching) and apply scaling
      const options = { 
        cacheBust: true, 
        backgroundColor: '#0a0a0a',
        width: node.scrollWidth,
        height: node.scrollHeight,
        pixelRatio: scale
      };
      
      if (format === 'png') {
        const dataUrl = await toPng(node, options);
        const link = document.createElement('a');
        link.download = `${filenamePrefix}${scale > 1 ? '-retina' : ''}-${Date.now()}.png`;
        link.href = dataUrl;
        link.click();
      } else if (format === 'svg') {
        const dataUrl = await toSvg(node, options);
        const link = document.createElement('a');
        link.download = `${filenamePrefix}-vector-${Date.now()}.svg`;
        link.href = dataUrl;
        link.click();
      } else if (format === 'pdf') {
        const dataUrl = await toPng(node, options);
        const { jsPDF } = await import('jspdf');
        const imgProps = new Image();
        imgProps.src = dataUrl;
        await new Promise((resolve) => { imgProps.onload = resolve; });
        
        const pdf = new jsPDF({
          orientation: imgProps.width > imgProps.height ? 'landscape' : 'portrait',
          unit: 'px',
          format: [imgProps.width, imgProps.height]
        });
        pdf.addImage(dataUrl, 'PNG', 0, 0, imgProps.width, imgProps.height);
        pdf.save(`${filenamePrefix}-${Date.now()}.pdf`);
      }
    } catch (err) {
      console.error('Failed to download visuals', err);
      alert('Failed to download visuals');
    }
    setIsDownloadMenuOpen(false);
  };

  return (
    <div id="app-visuals-container" className="min-h-screen bg-tactical-black text-tactical-white font-sans selection:bg-tactical-red selection:text-white flex flex-col">
      <header className="sticky top-0 z-50 backdrop-blur-md bg-tactical-black/95 border-b border-tactical-gray">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-2 sm:gap-4">
          
          {/* Logo Section */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <button 
              onClick={onBackToHub} 
              className={`p-1.5 sm:p-2 rounded-sm transition-colors hover:bg-tactical-gray ${step === 'analysis' ? 'bg-tactical-red' : 'bg-tactical-dark border border-tactical-gray'}`}
              title="Back to Hub"
            >
              <Crosshair className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </button>
            
            <h1 className="font-serif text-lg sm:text-xl font-bold tracking-tight text-white hidden sm:block">
              FragLab <span className="text-tactical-light font-normal hidden lg:inline">Analytics</span>
            </h1>

            {currentGame && (
              <button 
                onClick={onChangeGame}
                className="flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-mono tracking-wider font-bold bg-tactical-dark border border-tactical-gray hover:border-tactical-red hover:bg-tactical-red/5 text-tactical-light rounded-sm uppercase transition-all shrink-0 cursor-pointer"
                title="Click to Switch Game Mode"
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-tactical-green opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-tactical-green"></span>
                </span>
                <span>GAME: {currentGame?.toUpperCase()}</span>
              </button>
            )}
          </div>

          {/* Search Bar Integration */}
          {step === 'analysis' && search && (
            <div className="flex-1 max-w-md hidden md:block">
              {search}
            </div>
          )}

          {/* Workflow Breadcrumbs */}
          <div className="hidden xl:flex items-center gap-2 text-xs font-mono font-medium tracking-widest shrink-0">
            <span className={step === 'ingestion' ? 'text-white' : 'text-tactical-light'}>INGESTION</span>
            <ChevronRight className="w-3 h-3 text-tactical-gray" />
            <span className={step === 'analysis' ? 'text-tactical-red' : 'text-tactical-light'}>INTELLIGENCE</span>
            {step === 'analysis' && (
               <>
                <ChevronRight className="w-3 h-3 text-tactical-gray" />
                <span className="flex items-center gap-1 text-tactical-green bg-tactical-green/10 px-2 py-0.5 rounded-sm border border-tactical-green/20">
                  <ShieldCheck className="w-3 h-3" /> SECURE
                </span>
               </>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* System Mode Toggle */}
            <button 
                onClick={onToggleMode}
                className={`flex items-center gap-2 px-2 sm:px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest border rounded-sm transition-all ${
                    mode === 'auto' 
                    ? 'bg-tactical-green/10 text-tactical-green border-tactical-green/30 hover:bg-tactical-green/20' 
                    : 'bg-tactical-dark text-tactical-light border-tactical-gray hover:text-white'
                }`}
                title={mode === 'auto' ? 'SYSTEM ONLINE' : 'MANUAL MODE'}
            >
                {mode === 'auto' ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                <span className="hidden sm:inline">{mode === 'auto' ? 'SYSTEM ONLINE' : 'MANUAL MODE'}</span>
            </button>

            {step === 'analysis' && (
              <button 
                onClick={onReset}
                className="flex items-center gap-2 px-2 sm:px-3 py-1.5 text-xs font-medium font-mono text-tactical-light bg-tactical-dark border border-tactical-gray rounded-sm hover:bg-tactical-gray hover:text-white transition-all"
                title="RESET_OP"
              >
                <RotateCcw className="w-3 h-3" />
                <span className="hidden sm:inline">RESET_OP</span>
              </button>
            )}
            {step === 'analysis' && (
              <button 
                onClick={onOpenStudio}
                className="flex items-center gap-2 px-2 sm:px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest bg-tactical-dark border border-tactical-gray text-tactical-light rounded-sm hover:border-white hover:text-white transition-all"
                title="Open Broadcast Studio"
              >
                <MonitorPlay className="w-3 h-3" />
                <span className="hidden sm:inline">Broadcast Studio</span>
              </button>
            )}

            <div className="relative" ref={downloadMenuRef}>
              <button 
                onClick={() => setIsDownloadMenuOpen(!isDownloadMenuOpen)}
                className="flex items-center gap-2 px-2 sm:px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest bg-tactical-red text-white border border-tactical-red rounded-sm hover:bg-red-600 transition-all"
                title="Download App Visuals"
              >
                <Download className="w-3 h-3" />
                <span className="hidden sm:inline">Download Visuals</span>
                <ChevronDown className={`w-3 h-3 transition-transform ${isDownloadMenuOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {isDownloadMenuOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-tactical-dark border border-tactical-gray rounded-sm shadow-xl z-50 overflow-hidden">
                  <div className="px-3 py-2 border-b border-tactical-gray bg-black/50">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-tactical-light">Standard Export</span>
                  </div>
                  
                  <div className="p-1">
                    <button 
                      onClick={() => handleDownload('png', 'app-visuals-container', 'full-app')}
                      className="w-full flex items-center gap-3 px-3 py-2 text-xs font-medium text-white hover:bg-tactical-gray rounded-sm transition-colors text-left"
                    >
                      <ImageIcon className="w-4 h-4 text-tactical-light" />
                      Entire App (PNG)
                    </button>
                    <button 
                      onClick={() => handleDownload('pdf', 'app-visuals-container', 'full-app')}
                      className="w-full flex items-center gap-3 px-3 py-2 text-xs font-medium text-white hover:bg-tactical-gray rounded-sm transition-colors text-left"
                    >
                      <FileText className="w-4 h-4 text-tactical-light" />
                      Entire App (PDF)
                    </button>
                    <button 
                      onClick={() => handleDownload('png', 'main-content-area', 'main-content')}
                      className="w-full flex items-center gap-3 px-3 py-2 text-xs font-medium text-white hover:bg-tactical-gray rounded-sm transition-colors text-left"
                    >
                      <LayoutIcon className="w-4 h-4 text-tactical-light" />
                      Main Content Only (PNG)
                    </button>
                  </div>

                  <div className="px-3 py-2 border-y border-tactical-gray bg-black/50">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-tactical-light">Design Studio Handoff</span>
                  </div>

                  <div className="p-1">
                    <button 
                      onClick={() => handleDownload('png', 'app-visuals-container', 'full-app-handoff', 2)}
                      className="w-full flex items-center gap-3 px-3 py-2 text-xs font-medium text-tactical-green hover:bg-tactical-gray rounded-sm transition-colors text-left"
                      title="2x Resolution PNG for crisp importing into Figma/Sketch"
                    >
                      <Maximize className="w-4 h-4 text-tactical-green" />
                      High-Res PNG (2x Retina)
                    </button>
                    <button 
                      onClick={() => handleDownload('svg', 'app-visuals-container', 'full-app-vector')}
                      className="w-full flex items-center gap-3 px-3 py-2 text-xs font-medium text-tactical-green hover:bg-tactical-gray rounded-sm transition-colors text-left"
                      title="Scalable Vector Graphics format"
                    >
                      <PenTool className="w-4 h-4 text-tactical-green" />
                      SVG Vector (Web/Illustrator)
                    </button>
                    <button 
                      onClick={() => handleDownload('json', 'app-visuals-container', 'design-tokens')}
                      className="w-full flex items-center gap-3 px-3 py-2 text-xs font-medium text-tactical-green hover:bg-tactical-gray rounded-sm transition-colors text-left"
                      title="Export color palette and typography tokens"
                    >
                      <Braces className="w-4 h-4 text-tactical-green" />
                      Design Tokens (JSON)
                    </button>
                  </div>
                </div>
              )}
            </div>
            <button 
              onClick={onOpenSettings}
              className="p-2 hover:bg-tactical-gray rounded-full transition-colors text-tactical-light hover:text-white"
              title="Settings"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>
      
      <main id="main-content-area" className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-8 w-full relative pb-20 sm:pb-8">
        {/* Subtle grid background */}
        <div className="absolute inset-0 z-0 pointer-events-none opacity-5 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        <div className="relative z-10">
            {children}
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      {step === 'analysis' && onNavigate && (
        <nav className="sm:hidden fixed bottom-0 left-0 right-0 bg-tactical-black border-t border-tactical-gray z-50 px-6 py-3 flex justify-between items-center safe-area-bottom">
          <button 
            onClick={() => onNavigate({ type: 'dashboard' })}
            className={`flex flex-col items-center gap-1 transition-colors ${activeView?.type === 'dashboard' ? 'text-white' : 'text-tactical-light'}`}
          >
            <LayoutIcon className="w-5 h-5" />
            <span className="text-[10px] font-bold uppercase tracking-tighter">Home</span>
          </button>
          
          <button 
            onClick={() => onNavigate({ type: 'groups' })}
            className={`flex flex-col items-center gap-1 transition-colors ${activeView?.type === 'groups' ? 'text-white' : 'text-tactical-light'}`}
          >
            <Users className="w-5 h-5" />
            <span className="text-[10px] font-bold uppercase tracking-tighter">Groups</span>
          </button>
          
          <button 
            onClick={() => {
              onNavigate({ type: 'dashboard' });
              setTimeout(() => {
                const el = document.getElementById('points-table');
                el?.scrollIntoView({ behavior: 'smooth' });
              }, 100);
            }}
            className="flex flex-col items-center gap-1 text-tactical-light hover:text-white transition-colors"
          >
            <ShieldCheck className="w-5 h-5" />
            <span className="text-[10px] font-bold uppercase tracking-tighter">Teams</span>
          </button>

          <button 
            onClick={() => {
              onNavigate({ type: 'dashboard' });
              setTimeout(() => {
                const el = document.getElementById('operator-leaderboard');
                el?.scrollIntoView({ behavior: 'smooth' });
              }, 100);
            }}
            className="flex flex-col items-center gap-1 text-tactical-light hover:text-white transition-colors"
          >
            <Crosshair className="w-5 h-5" />
            <span className="text-[10px] font-bold uppercase tracking-tighter">Players</span>
          </button>

          <button 
            onClick={onOpenStudio}
            className="flex flex-col items-center gap-1 text-tactical-light hover:text-white transition-colors"
          >
            <MonitorPlay className="w-5 h-5" />
            <span className="text-[10px] font-bold uppercase tracking-tighter">Studio</span>
          </button>
        </nav>
      )}
      
      <footer className="border-t border-tactical-gray py-6 mt-auto bg-tactical-black">
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center text-[10px] font-mono uppercase tracking-widest text-tactical-light">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${mode === 'auto' ? 'bg-tactical-green animate-pulse' : 'bg-tactical-gray'}`}></div> 
            System Status: {mode === 'auto' ? 'Online' : 'Offline / Manual'}
          </div>
          <div className="flex items-center gap-1"><Terminal className="w-3 h-3" /> v2.4.0 // CLASSIFIED</div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;