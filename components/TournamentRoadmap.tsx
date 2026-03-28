
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Trophy, Shield, Swords, ZoomIn, ZoomOut, Move, Settings2, RefreshCcw, Eye, EyeOff, Maximize, MousePointer2 } from 'lucide-react';

export interface StageData {
  title: string;
  teams: string;
  subtitle: string;
  details: string[];
  type?: 'standard' | 'danger' | 'gold';
}

export interface RoadmapConfig {
    groupStage?: StageData;
    quarterFinals?: StageData;
    lowerBracket1?: StageData;
    lowerBracket2?: StageData;
    semiFinals?: StageData;
    grandFinals?: StageData;
}

interface RoadmapProps {
  theme?: 'dark' | 'light';
  config?: RoadmapConfig;
  isExporting?: boolean;
}

// Reusable Node Component
const StageBox: React.FC<{ 
  title: string; 
  teams: string; 
  subtitle: string; 
  x: number; 
  y: number; 
  width: number; 
  height: number;
  type?: 'standard' | 'danger' | 'gold';
  details?: string[];
  scale: number;
}> = ({ title, teams, subtitle, x, y, width, height, type = 'standard', details, scale }) => {
  
  let borderColor = '#3f3f46'; // tactical-gray
  let bgColor = '#1A1A1A'; // tactical-dark
  let textColor = '#FFFFFF';

  if (type === 'danger') {
      borderColor = '#ef4444';
      bgColor = '#2a0a0a';
  } else if (type === 'gold') {
      borderColor = '#eab308';
      bgColor = '#2a1a0a';
  }

  // Adjust font sizes based on box width/scale to prevent overflow
  const headerSize = Math.max(10, width / 14);
  const subSize = Math.max(8, width / 20);
  const detailSize = Math.max(7, width / 24);

  return (
    <foreignObject x={x} y={y} width={width} height={height} style={{ overflow: 'visible' }}>
      <div className={`h-full w-full border-2 rounded-sm flex flex-col p-[5%] relative overflow-hidden group transition-all hover:scale-[1.02] shadow-2xl`} 
           style={{ borderColor, backgroundColor: bgColor }}>
        
        {/* Header */}
        <div className="flex justify-between items-start mb-[2%] border-b border-white/10 pb-[2%]">
            <h3 className="font-bold uppercase tracking-wider leading-none truncate" style={{ color: textColor, fontSize: `${headerSize}px` }}>{title}</h3>
            <span className="font-mono bg-white/10 px-[3%] rounded text-white/80 whitespace-nowrap" style={{ fontSize: `${detailSize}px` }}>{teams}</span>
        </div>
        
        {/* Body */}
        <div className="flex-1 flex flex-col justify-center">
            <p className="text-gray-400 font-mono leading-tight mb-[4%]" style={{ fontSize: `${subSize}px` }}>{subtitle}</p>
            {details && (
                <div className="space-y-[2%]">
                    {details.map((d, i) => (
                        <div key={i} className="uppercase font-bold flex items-center gap-1 opacity-70" style={{ fontSize: `${detailSize}px` }}>
                            <div className={`w-[0.4em] h-[0.4em] rounded-full ${d.includes('Elim') ? 'bg-red-500' : 'bg-green-500'}`}></div>
                            <span style={{ color: d.includes('Elim') ? '#f87171' : '#fff' }} className="truncate">{d}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>

        {/* Icon Overlay */}
        <div className="absolute bottom-[5%] right-[5%] opacity-10 pointer-events-none">
            {type === 'gold' ? <Trophy style={{ width: width*0.2, height: width*0.2 }} /> : type === 'danger' ? <Swords style={{ width: width*0.2, height: width*0.2 }} /> : <Shield style={{ width: width*0.2, height: width*0.2 }} />}
        </div>
      </div>
    </foreignObject>
  );
};

const ConnectionLine: React.FC<{ startX: number, startY: number, endX: number, endY: number, type?: 'solid' | 'dashed', color?: string, label?: string }> = ({ startX, startY, endX, endY, type = 'solid', color = '#52525b', label }) => {
    const midX = (startX + endX) / 2;
    // Smoother cubic bezier
    const path = `M ${startX} ${startY} C ${midX} ${startY}, ${midX} ${endY}, ${endX} ${endY}`;

    return (
        <g>
            <path d={path} stroke={color} strokeWidth="2" fill="none" strokeDasharray={type === 'dashed' ? "5,5" : "none"} className="drop-shadow-md" />
            {label && (
                <foreignObject x={midX - 30} y={(startY + endY) / 2 - 10} width={60} height={20}>
                    <div className="text-[9px] font-bold text-center bg-black text-gray-300 border border-gray-700 rounded px-1 shadow-sm whitespace-nowrap overflow-hidden text-ellipsis">{label}</div>
                </foreignObject>
            )}
            <circle cx={startX} cy={startY} r="2" fill={color} />
            <circle cx={endX} cy={endY} r="2" fill={color} />
        </g>
    );
};

const TournamentRoadmap: React.FC<RoadmapProps> = ({ config, isExporting = false }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // --- STATE ---
  
  // Viewport Transform
  const [view, setView] = useState({ x: 0, y: 0, scale: 1 });
  const [isDragging, setIsDragging] = useState(false);
  const [lastMouse, setLastMouse] = useState({ x: 0, y: 0 });

  // Layout Configuration
  const [layout, setLayout] = useState({
      boxWidth: 200,
      boxHeight: 120,
      colGap: 120,
      verticalSpread: 220, // Distance from Center Y to Top/Bottom rows
  });

  const [uiVisible, setUiVisible] = useState(true);
  const [showSettings, setShowSettings] = useState(false);

  // --- HANDLERS ---

  const handleWheel = (e: React.WheelEvent) => {
      e.stopPropagation();
      const zoomSensitivity = 0.001;
      const newScale = Math.max(0.1, Math.min(5, view.scale - e.deltaY * zoomSensitivity));
      setView(prev => ({ ...prev, scale: newScale }));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
      setIsDragging(true);
      setLastMouse({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - lastMouse.x;
      const dy = e.clientY - lastMouse.y;
      setView(prev => ({ ...prev, x: prev.x + dx, y: prev.y + dy }));
      setLastMouse({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => setIsDragging(false);

  const resetView = () => setView({ x: 0, y: 0, scale: 1 });

  // --- LAYOUT CALCULATION ---

  // Base center point (relative to SVG center)
  // We'll define coordinates relative to 0,0 being the center of the diagram, 
  // then translate by container center + view.x/y
  
  // Columns X (Centered around 0)
  // Total width approx = 4 * Width + 3 * Gap
  // Let's fix columns: C1, C2, C3, C4
  
  const C1_X = -1.5 * (layout.boxWidth + layout.colGap);
  const C2_X = -0.5 * (layout.boxWidth + layout.colGap);
  const C3_X = 0.5 * (layout.boxWidth + layout.colGap);
  const C4_X = 1.5 * (layout.boxWidth + layout.colGap);

  const ROW_MID_Y = -layout.boxHeight / 2;
  const ROW_TOP_Y = ROW_MID_Y - layout.verticalSpread;
  const ROW_BOT_Y = ROW_MID_Y + layout.verticalSpread;

  // Defaults
  const stages = {
      groupStage: config?.groupStage || { title: "Group Stage", teams: "160 TEAMS", subtitle: "8 Groups × 20 Teams", details: ['#1-8 → Q.Finals', '#9-12 → LB Rd 1', '#13-20 → Eliminated'], type: 'standard' },
      quarterFinals: config?.quarterFinals || { title: "Quarter Finals", teams: "64 TEAMS", subtitle: "8 Groups × 8 Teams", details: ['#1 → Semi Finals', '#2-4 → LB Rd 2', '#5-8 → Eliminated'], type: 'standard' },
      lowerBracket1: config?.lowerBracket1 || { title: "Lower Bracket R1", teams: "32 TEAMS", subtitle: "4 Groups × 8 Teams", details: ['#1-8 → LB Rd 2', '#9-32 → Eliminated'], type: 'danger' },
      lowerBracket2: config?.lowerBracket2 || { title: "Lower Bracket R2", teams: "32 TEAMS", subtitle: "8 (LB1) + 24 (QF)", details: ['#1-24 → Semi Finals', '#25-32 → Eliminated'], type: 'danger' },
      semiFinals: config?.semiFinals || { title: "Semi Finals", teams: "32 TEAMS", subtitle: "8 (QF) + 24 (LB2)", details: ['#1-16 → Grand Finals', '#17-32 → Eliminated'], type: 'standard' },
      grandFinals: config?.grandFinals || { title: "Grand Finals", teams: "16 TEAMS", subtitle: "12 Matches • No Groups", details: ['#1 → CHAMPION'], type: 'gold' }
  };

  // Helper to get connection points
  const getRight = (x: number, y: number) => ({ x: x + layout.boxWidth, y: y + layout.boxHeight / 2 });
  const getLeft = (x: number, y: number) => ({ x: x, y: y + layout.boxHeight / 2 });

  return (
    <div 
        ref={containerRef}
        className="w-full h-full bg-[#0E0E0E] relative overflow-hidden select-none cursor-move"
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
    >
        {/* BACKGROUND GRID */}
        <div 
            className="absolute inset-0 pointer-events-none opacity-20"
            style={{
                backgroundImage: 'linear-gradient(#333 1px, transparent 1px), linear-gradient(90deg, #333 1px, transparent 1px)',
                backgroundSize: '40px 40px',
                backgroundPosition: `${view.x}px ${view.y}px`,
                transform: `scale(${view.scale})`,
                transformOrigin: '0 0' // Affects grid scale visual
            }}
        />

        {/* CONTROLS UI - Hidden during export */}
        {!isExporting && (
            <div className={`absolute top-4 right-4 z-20 flex flex-col gap-2 transition-opacity duration-300 ${uiVisible ? 'opacity-100' : 'opacity-0 hover:opacity-100'}`}>
                <div className="flex bg-tactical-dark border border-tactical-gray rounded-sm shadow-xl p-1">
                    <button onClick={() => setUiVisible(!uiVisible)} className="p-2 text-white hover:bg-white/10 rounded-sm" title={uiVisible ? "Hide UI (Clean Mode)" : "Show UI"}>
                        {uiVisible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4 text-tactical-red" />}
                    </button>
                    <div className="w-px bg-tactical-gray mx-1"></div>
                    <button onClick={() => setView(p => ({ ...p, scale: p.scale * 1.1 }))} className="p-2 text-white hover:bg-white/10 rounded-sm"><ZoomIn className="w-4 h-4" /></button>
                    <button onClick={() => setView(p => ({ ...p, scale: p.scale * 0.9 }))} className="p-2 text-white hover:bg-white/10 rounded-sm"><ZoomOut className="w-4 h-4" /></button>
                    <button onClick={resetView} className="p-2 text-white hover:bg-white/10 rounded-sm" title="Reset View"><RefreshCcw className="w-4 h-4" /></button>
                    <div className="w-px bg-tactical-gray mx-1"></div>
                    <button onClick={() => setShowSettings(!showSettings)} className={`p-2 rounded-sm transition-colors ${showSettings ? 'bg-white text-black' : 'text-white hover:bg-white/10'}`}><Settings2 className="w-4 h-4" /></button>
                </div>

                {/* Layout Editor Panel */}
                {showSettings && (
                    <div className="bg-tactical-dark border border-tactical-gray rounded-sm shadow-xl p-4 w-64 animate-in slide-in-from-right-2">
                        <h4 className="text-xs font-bold text-white uppercase mb-3 flex items-center gap-2"><Move className="w-3 h-3" /> Layout Engine</h4>
                        
                        <div className="space-y-3">
                            <div>
                                <div className="flex justify-between text-[10px] text-tactical-light mb-1">
                                    <span>Box Width</span><span>{layout.boxWidth}px</span>
                                </div>
                                <input type="range" min="150" max="400" value={layout.boxWidth} onChange={(e) => setLayout({...layout, boxWidth: parseInt(e.target.value)})} className="w-full accent-tactical-red h-1 bg-black rounded-lg appearance-none cursor-pointer" />
                            </div>
                            <div>
                                <div className="flex justify-between text-[10px] text-tactical-light mb-1">
                                    <span>Vertical Spread</span><span>{layout.verticalSpread}px</span>
                                </div>
                                <input type="range" min="120" max="400" value={layout.verticalSpread} onChange={(e) => setLayout({...layout, verticalSpread: parseInt(e.target.value)})} className="w-full accent-tactical-red h-1 bg-black rounded-lg appearance-none cursor-pointer" />
                            </div>
                            <div>
                                <div className="flex justify-between text-[10px] text-tactical-light mb-1">
                                    <span>Column Gap</span><span>{layout.colGap}px</span>
                                </div>
                                <input type="range" min="50" max="300" value={layout.colGap} onChange={(e) => setLayout({...layout, colGap: parseInt(e.target.value)})} className="w-full accent-tactical-red h-1 bg-black rounded-lg appearance-none cursor-pointer" />
                            </div>
                            <button onClick={() => setLayout({ boxWidth: 200, boxHeight: 120, colGap: 120, verticalSpread: 220 })} className="w-full mt-2 py-1.5 bg-white/5 hover:bg-white/10 text-[10px] uppercase font-bold text-white rounded-sm border border-white/10">
                                Reset Layout
                            </button>
                        </div>
                    </div>
                )}
            </div>
        )}

        {/* RENDER LAYER */}
        <svg className="w-full h-full" style={{ display: 'block' }}>
            {/* The Group holding everything, transformed by Pan/Zoom */}
            {/* We center the group first by translating to 50% 50% of container, then applying view transform */}
            <g transform={`translate(${view.x}, ${view.y})`}>
                {/* To center the diagram initially, we translate the group to the center of the viewport */}
                <g transform={`translate(${containerRef.current ? containerRef.current.clientWidth / 2 : 500}, ${containerRef.current ? containerRef.current.clientHeight / 2 : 300}) scale(${view.scale})`}>
                    
                    {/* --- CONNECTIONS (Layer 0) --- */}
                    
                    {/* GS -> QF */}
                    <ConnectionLine 
                        startX={getRight(C1_X, ROW_MID_Y).x} startY={getRight(C1_X, ROW_MID_Y).y} 
                        endX={getLeft(C2_X, ROW_TOP_Y).x} endY={getLeft(C2_X, ROW_TOP_Y).y} 
                        color="#10b981" label="#1-8" 
                    />
                    
                    {/* GS -> LB R1 */}
                    <ConnectionLine 
                        startX={getRight(C1_X, ROW_MID_Y).x} startY={getRight(C1_X, ROW_MID_Y).y} 
                        endX={getLeft(C2_X, ROW_BOT_Y).x} endY={getLeft(C2_X, ROW_BOT_Y).y} 
                        color="#f59e0b" label="#9-12" 
                    />

                    {/* QF -> Semi (Direct) */}
                    <ConnectionLine 
                        startX={getRight(C2_X, ROW_TOP_Y).x} startY={getRight(C2_X, ROW_TOP_Y).y} 
                        endX={getLeft(C4_X, ROW_TOP_Y).x} endY={getLeft(C4_X, ROW_TOP_Y).y} 
                        color="#10b981" label="#1" 
                    />

                    {/* QF -> LB R2 (Drop) */}
                    <ConnectionLine 
                        startX={getRight(C2_X, ROW_TOP_Y).x} startY={getRight(C2_X, ROW_TOP_Y).y} 
                        endX={getLeft(C3_X, ROW_MID_Y).x} endY={getLeft(C3_X, ROW_MID_Y).y} 
                        type="dashed" color="#f59e0b" label="#2-4" 
                    />

                    {/* LB R1 -> LB R2 */}
                    <ConnectionLine 
                        startX={getRight(C2_X, ROW_BOT_Y).x} startY={getRight(C2_X, ROW_BOT_Y).y} 
                        endX={getLeft(C3_X, ROW_MID_Y).x} endY={getLeft(C3_X, ROW_MID_Y).y} 
                        color="#10b981" label="#1-8" 
                    />

                    {/* LB R2 -> Semi */}
                    <ConnectionLine 
                        startX={getRight(C3_X, ROW_MID_Y).x} startY={getRight(C3_X, ROW_MID_Y).y} 
                        endX={getLeft(C4_X, ROW_TOP_Y).x} endY={getLeft(C4_X, ROW_TOP_Y).y} 
                        color="#10b981" label="#1-24" 
                    />

                    {/* Semi -> Grand Finals */}
                    <ConnectionLine 
                        startX={getRight(C4_X, ROW_TOP_Y).x} startY={getRight(C4_X, ROW_TOP_Y).y} 
                        endX={getLeft(C4_X, ROW_BOT_Y).x} endY={getLeft(C4_X, ROW_BOT_Y).y} 
                        color="#ef4444" label="TOP 16" 
                    />


                    {/* --- NODES (Layer 1) --- */}

                    <StageBox 
                        x={C1_X} y={ROW_MID_Y} width={layout.boxWidth} height={layout.boxHeight}
                        title={stages.groupStage.title}
                        teams={stages.groupStage.teams}
                        subtitle={stages.groupStage.subtitle}
                        details={stages.groupStage.details}
                        type={stages.groupStage.type as any}
                        scale={view.scale}
                    />

                    <StageBox 
                        x={C2_X} y={ROW_TOP_Y} width={layout.boxWidth} height={layout.boxHeight}
                        title={stages.quarterFinals.title}
                        teams={stages.quarterFinals.teams}
                        subtitle={stages.quarterFinals.subtitle}
                        details={stages.quarterFinals.details}
                        type={stages.quarterFinals.type as any}
                        scale={view.scale}
                    />

                    <StageBox 
                        x={C2_X} y={ROW_BOT_Y} width={layout.boxWidth} height={layout.boxHeight}
                        title={stages.lowerBracket1.title}
                        teams={stages.lowerBracket1.teams}
                        subtitle={stages.lowerBracket1.subtitle}
                        details={stages.lowerBracket1.details}
                        type={stages.lowerBracket1.type as any}
                        scale={view.scale}
                    />

                    <StageBox 
                        x={C3_X} y={ROW_MID_Y} width={layout.boxWidth} height={layout.boxHeight}
                        title={stages.lowerBracket2.title}
                        teams={stages.lowerBracket2.teams}
                        subtitle={stages.lowerBracket2.subtitle}
                        details={stages.lowerBracket2.details}
                        type={stages.lowerBracket2.type as any}
                        scale={view.scale}
                    />

                    <StageBox 
                        x={C4_X} y={ROW_TOP_Y} width={layout.boxWidth} height={layout.boxHeight}
                        title={stages.semiFinals.title}
                        teams={stages.semiFinals.teams}
                        subtitle={stages.semiFinals.subtitle}
                        details={stages.semiFinals.details}
                        type={stages.semiFinals.type as any}
                        scale={view.scale}
                    />

                    <StageBox 
                        x={C4_X} y={ROW_BOT_Y} width={layout.boxWidth} height={layout.boxHeight}
                        title={stages.grandFinals.title}
                        teams={stages.grandFinals.teams}
                        subtitle={stages.grandFinals.subtitle}
                        details={stages.grandFinals.details}
                        type={stages.grandFinals.type as any}
                        scale={view.scale}
                    />
                </g>
            </g>
        </svg>
    </div>
  );
};

export default TournamentRoadmap;
