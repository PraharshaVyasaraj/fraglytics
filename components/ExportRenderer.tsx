
import React, { useMemo } from 'react';
import { TeamData, PlayerDerived, BrandingConfig, ExportTheme, AspectRatio, ExportLayout, ExportMode } from '../types';
import { getThemeHexBg, getThemeStyles } from '../lib/themeEngine';
import { Shield, Calendar, Crown, Skull, Crosshair, Activity, Target, Swords, HeartPulse, Zap, Sword, User, BarChart2, Users, TrendingUp, Medal, TrendingDown, Minus, GitGraph, Trophy, Star } from 'lucide-react';
import { calculateHeadToHeadProbability } from '../services/analyticsEngine';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, PieChart, Pie, Cell, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Line } from 'recharts';
import { VisualConfig } from './BroadcastStudio';

import { TournamentMVP } from './mvp/TournamentMVP';
import { SDRRGraphic } from './SDRRGraphic';

import { IntelligenceReportView } from './IntelligenceReportView';

interface ExportRendererProps {
  data: TeamData[]; 
  mode: ExportMode;
  aspectRatio: AspectRatio;
  theme: ExportTheme;
  layout: ExportLayout;
  branding: BrandingConfig;
  config: {
    title: string;
    subtitle: string;
    focusTeamId?: string;
    compareTeamId?: string;
    focusPlayerName?: string;
    comparePlayerName?: string;
  };
  pagination?: {
    page: number;
    totalPages: number;
    rowsPerPage: number;
  };
  visualConfig?: VisualConfig;
  isExporting?: boolean;
  timerSeconds?: number;
  onElementClick?: (element: string, data?: any) => void;
}

// Helper to determine container dimensions
const getContainerStyle = (ratio: AspectRatio) => {
    switch (ratio) {
        case '9:16': return { width: 1080, height: 1920 };
        case '1:1': return { width: 1080, height: 1080 };
        case '4:3': return { width: 1440, height: 1080 };
        case '21:9': return { width: 2560, height: 1080 };
        case '16:9': 
        default: return { width: 1920, height: 1080 };
    }
};

const ExportRenderer: React.FC<ExportRendererProps> = ({ data, mode, aspectRatio, theme, layout, branding, config, pagination, visualConfig = { headerScale: 1, rankScale: 1.2, statPriority: 'combat', spacing: 1, padding: 1, itemSpacing: 1, containerPadding: 1, rowHeight: 1, fontScale: 1 }, isExporting = false, timerSeconds = 569, onElementClick }) => {
  const containerDimensions = getContainerStyle(aspectRatio);
  const themeBgHex = getThemeHexBg(theme);
  const isPortrait = aspectRatio === '9:16';
  
  const { page = 1, rowsPerPage = 10, totalPages = 1 } = pagination || {};

  const themeStyles = getThemeStyles(theme, branding);
  const isTemplate = visualConfig.templateMode;

  const tMode = (classes: string, borderToo = true) => {
    if (!isTemplate) return classes;
    let newClasses = classes.replace(/bg-[^\s/]+(?:\/\d+)?/g, 'bg-transparent')
                            .replace(/backdrop-blur-[^\s]+/g, 'backdrop-blur-none')
                            .replace(/shadow-[^\s]+/g, 'shadow-none');
    if (borderToo) {
        newClasses = newClasses.replace(/border-[^\s/]+(?:\/\d+)?/g, 'border-transparent');
    }
    return newClasses;
  };
  
  // Inline styles for dynamic colors
  const accentText = { color: themeStyles.accent };
  const accentBg = { backgroundColor: themeStyles.accent };
  const accentBorder = { borderColor: themeStyles.accent };

  // Precise Typographical Tuning derived from visualConfig
  const headerTypoStyle = {
      letterSpacing: visualConfig.tracking !== undefined ? `${visualConfig.tracking}px` : undefined,
      lineHeight: visualConfig.leading !== undefined ? visualConfig.leading : undefined,
      fontFeatureSettings: visualConfig.kerning === false ? '"kern" 0, "liga" 0' : '"kern" 1, "liga" 1',
  };

  const bodyTypoStyle = {
      fontFeatureSettings: visualConfig.kerning === false ? '"kern" 0, "liga" 0' : '"kern" 1, "liga" 1',
  };

  // --- SUB-COMPONENTS ---

  const Header = () => (
    <div 
        onClick={() => onElementClick?.('header')}
        className={`relative z-10 flex ${isPortrait ? 'flex-col items-center text-center gap-2' : 'justify-between items-end'} ${layout === 'classic' ? 'border-b-4 pb-2 mb-4' : 'mb-2'} ${!isExporting ? 'cursor-pointer hover:bg-white/5 transition-colors rounded-sm group' : ''}`} 
        style={layout === 'classic' ? accentBorder : {}}
    >
        {!isExporting && (
            <div className="absolute -top-6 left-0 text-[10px] font-bold uppercase tracking-widest text-tactical-light opacity-0 group-hover:opacity-100 transition-opacity">
                Edit Header & Branding
            </div>
        )}
        <div className={isPortrait ? 'flex flex-col items-center' : ''}>
            <div className={`flex items-center gap-4 ${isPortrait ? 'flex-col mb-1' : 'mb-2'}`}>
                <div className={`p-3 rounded-sm shadow-lg ${theme === 'paper' ? 'bg-slate-900 text-white' : 'bg-white/10 text-white'}`} style={theme === 'paper' ? {} : accentBg}>
                    {branding.logoUrl ? (
                        <img src={branding.logoUrl} alt="Logo" className="w-12 h-12 object-contain invert brightness-0" />
                    ) : (
                        <Shield className="w-12 h-12 text-inherit" />
                    )}
                </div>
                 <h1 className={`${isPortrait ? 'text-4xl' : 'text-5xl'} font-black ${themeStyles.fontHeader} tracking-tighter uppercase ${themeStyles.text}`} style={{ fontSize: `${(isPortrait ? 2.5 : 3.5) * visualConfig.fontScale}rem`, ...headerTypoStyle }}>{branding.orgName}</h1>
            </div>
            <p className={`text-xl ${themeStyles.subText} ${themeStyles.fontBody} tracking-[0.2em] font-bold`} style={{ fontSize: `${1.125 * visualConfig.fontScale}rem`, ...bodyTypoStyle }}>INTELLIGENCE REPORT</p>
        </div>
        
        {layout === 'classic' && (
            <div className={isPortrait ? 'mt-1' : 'text-right'}>
                <h2 className={`${isPortrait ? 'text-5xl' : 'text-7xl'} font-black ${themeStyles.text} uppercase tracking-tight leading-none ${themeStyles.fontHeader}`} style={{ fontSize: `${(isPortrait ? 3 : 5) * visualConfig.fontScale}rem`, ...headerTypoStyle }}>{config.title}</h2>
                <p className={`text-3xl ${themeStyles.fontBody} font-bold mt-1 uppercase`} style={{ ...accentText, fontSize: `${1.75 * visualConfig.fontScale}rem`, ...bodyTypoStyle }}>{config.subtitle}</p>
            </div>
        )}
    </div>
  );

  const Footer = () => (
    <div 
        onClick={() => onElementClick?.('footer')}
        className={`relative z-10 mt-auto pt-4 border-t flex ${isPortrait ? 'flex-col gap-3' : 'justify-between'} items-center ${themeStyles.subText} ${themeStyles.fontBody} uppercase tracking-widest ${!isExporting ? 'cursor-pointer hover:bg-white/5 transition-colors rounded-sm' : ''}`} 
        style={{ borderColor: theme === 'paper' ? '#cbd5e1' : 'rgba(255,255,255,0.1)' }}
    >
        <div className="flex items-center gap-3">
            <Calendar className="w-6 h-6" />
            <span className="text-xl" style={{ fontSize: `${1.25 * visualConfig.fontScale}rem` }}>Generated: {new Date().toLocaleDateString()}</span>
        </div>
        {totalPages > 1 && (
            <div className={`px-6 py-2 rounded-full font-bold ${themeStyles.highlight}`} style={{ fontSize: `${1 * visualConfig.fontScale}rem` }}>
                PAGE {page} OF {totalPages}
            </div>
        )}
        <div className="text-xl font-bold opacity-50" style={{ fontSize: `${1.25 * visualConfig.fontScale}rem` }}>Powered by FragLab</div>
    </div>
  );

  // --- LAYOUT WRAPPERS ---

  const LayoutWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
      if (layout === 'statistics') {
          return (
              <div className={`w-full h-full flex flex-col relative z-10 ${visualConfig.templateMode ? 'bg-transparent backdrop-blur-none' : 'bg-black/40 backdrop-blur-xl'}`} style={{ padding: `${2 * visualConfig.containerPadding}rem` }}>
                  <div className={`flex items-center justify-between mb-6 border-b ${visualConfig.templateMode ? 'border-transparent' : 'border-white/10'} pb-4`}>
                      <div className="flex items-center gap-4">
                          <div className={`p-2 ${visualConfig.templateMode ? 'bg-transparent' : 'bg-white/10'} rounded-sm`} style={visualConfig.templateMode ? {} : accentBg}>
                              {branding.logoUrl ? <img src={branding.logoUrl} alt="Logo" className="w-8 h-8 object-contain invert brightness-0" /> : <Shield className="w-8 h-8 text-white" />}
                          </div>
                          <div>
                              <h1 className="text-2xl font-black uppercase tracking-tighter text-white">{branding.orgName}</h1>
                              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-tactical-light">Statistics Dashboard</p>
                          </div>
                      </div>
                      <div className="text-right">
                          <h2 className="text-3xl font-black text-white uppercase tracking-tight">{config.title}</h2>
                          <p className="text-sm font-bold uppercase tracking-widest" style={accentText}>{config.subtitle}</p>
                      </div>
                  </div>
                  
                  <div className="flex-1 grid grid-cols-12 gap-6 overflow-hidden">
                      {/* Left Column: Main Content */}
                      <div className="col-span-8 flex flex-col gap-6 overflow-hidden">
                          <div className={`flex-1 ${visualConfig.templateMode ? 'bg-transparent border-transparent' : 'bg-white/5 border border-white/10'} rounded-sm p-6 overflow-hidden flex flex-col`}>
                              {children}
                          </div>
                      </div>
                      
                      {/* Right Column: Advanced Stats */}
                      <div className="col-span-4 flex flex-col gap-6 overflow-hidden">
                          {/* Global Stats Card */}
                          <div className={tMode("bg-white/5 border border-white/10 rounded-sm p-6")}>
                              <h3 className="text-xs font-bold uppercase tracking-widest text-tactical-light mb-4 flex items-center gap-2">
                                  <Activity className="w-3 h-3" /> Tournament Pulse
                              </h3>
                              <div className="grid grid-cols-2 gap-4">
                                  <div className="p-3 bg-black/20 rounded-sm border border-white/5">
                                      <div className="text-[10px] font-bold text-tactical-light uppercase mb-1">Total Kills</div>
                                      <div className="text-2xl font-black text-white">{data.reduce((acc, t) => acc + t.totalFinishes, 0)}</div>
                                  </div>
                                  <div className="p-3 bg-black/20 rounded-sm border border-white/5">
                                      <div className="text-[10px] font-bold text-tactical-light uppercase mb-1">Avg Points/Match</div>
                                      <div className="text-2xl font-black text-white">{(data.reduce((acc, t) => acc + t.totalPoints, 0) / Math.max(1, data.length * (data[0]?.matchesPlayed || 1))).toFixed(1)}</div>
                                  </div>
                              </div>
                          </div>

                          {/* Top Performers */}
                          <div className={tMode("flex-1 bg-white/5 border border-white/10 rounded-sm p-6 overflow-hidden flex flex-col")}>
                              <h3 className="text-xs font-bold uppercase tracking-widest text-tactical-light mb-4 flex items-center gap-2">
                                  <Trophy className="w-3 h-3" /> Top Impact Players
                              </h3>
                              <div className="flex-1 space-y-3 overflow-y-auto pr-2 custom-scrollbar">
                                  {data.flatMap(t => t.players).sort((a,b) => b.impactScore - a.impactScore).slice(0, 8).map((p, i) => (
                                      <div key={p.playerName} className="flex items-center justify-between p-2 bg-white/5 rounded-sm border border-white/5">
                                          <div className="flex items-center gap-3">
                                              <span className="text-[10px] font-black text-tactical-light">0{i+1}</span>
                                              <div>
                                                  <div className="text-xs font-bold text-white uppercase">{p.playerName}</div>
                                                  <div className="text-[9px] text-tactical-light uppercase">{p.teamName}</div>
                                              </div>
                                          </div>
                                          <div className="text-right">
                                              <div className="text-xs font-black text-white">{p.impactScore.toFixed(1)}</div>
                                              <div className="text-[8px] text-tactical-light uppercase">Impact</div>
                                          </div>
                                      </div>
                                  ))}
                              </div>
                          </div>

                          {/* Consistency Index */}
                          <div className={tMode("bg-white/5 border border-white/10 rounded-sm p-6")}>
                              <h3 className="text-xs font-bold uppercase tracking-widest text-tactical-light mb-4 flex items-center gap-2">
                                  <TrendingUp className="w-3 h-3" /> Consistency Index
                              </h3>
                              <div className="h-32 w-full">
                                  <ResponsiveContainer width="100%" height="100%">
                                      <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data.slice(0, 5).map(t => ({
                                          name: t.name,
                                          val: Math.min(100, (t.totalPoints / (data[0]?.totalPoints || 1)) * 100)
                                      }))}>
                                          <PolarGrid stroke="rgba(255,255,255,0.1)" />
                                          <PolarAngleAxis dataKey="name" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 8 }} />
                                          <Radar name="Performance" dataKey="val" stroke={themeStyles.accent} fill={themeStyles.accent} fillOpacity={0.5} />
                                      </RadarChart>
                                  </ResponsiveContainer>
                              </div>
                          </div>
                      </div>
                  </div>
                  
                  <div className="mt-6 pt-4 border-t border-white/10 flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-tactical-light">
                      <div className="flex items-center gap-4">
                          <span>Generated: {new Date().toLocaleDateString()}</span>
                          <span className="opacity-30">|</span>
                          <span>Confidential Data</span>
                      </div>
                      <div className="flex items-center gap-2">
                          <span className="p-1 bg-white/10 rounded-sm">PAGE {page}</span>
                          <span>Powered by FragLab Analytics</span>
                      </div>
                  </div>
              </div>
          );
      }

      if (layout === 'sidebar' && !isPortrait) {
          return (
              <div className="flex h-full w-full">
                  <div className={`w-[500px] ${visualConfig.templateMode ? 'bg-transparent border-transparent' : themeStyles.cardBg + ' border-r'} p-12 flex flex-col justify-between relative z-20`} style={{ borderColor: 'transparent' }}>
                      <div>
                          <Header />
                          <div className="mt-20">
                            <h2 className={`text-7xl font-black ${themeStyles.text} uppercase tracking-tight leading-none ${themeStyles.fontHeader}`}>{config.title}</h2>
                            <p className={`text-3xl ${themeStyles.fontBody} font-bold mt-4 uppercase`} style={accentText}>{config.subtitle}</p>
                            <div className={`w-24 h-2 mt-8`} style={accentBg}></div>
                          </div>
                      </div>
                      <div className={`${themeStyles.subText} ${themeStyles.fontBody} uppercase tracking-widest text-lg`}>
                          <p>Broadcast Data</p>
                          <p className="opacity-50">Confidential</p>
                      </div>
                  </div>
                  <div className="flex-1 p-16 flex flex-col relative z-10">
                      {children}
                      <Footer />
                  </div>
              </div>
          );
      }
      
      // Classic Layout
      return (
          <div className={`w-full h-full flex flex-col relative z-10`} style={{ padding: `${2 * visualConfig.containerPadding}rem` }}>
              <Header />
              <div className="flex-1 flex flex-col overflow-hidden">
                  {children}
              </div>
              <Footer />
          </div>
      );
  };

  // --- CONTENT RENDERERS ---
  
  const StandingsLayout = () => {
    if (theme === 'intelligence') {
        return (
            <div className="w-full h-full">
                <IntelligenceReportView 
                    data={data} 
                    branding={branding}
                    title={config.title}
                    subtitle={config.subtitle}
                    page={page}
                    totalPages={totalPages}
                    rowsPerPage={rowsPerPage}
                    isPortrait={isPortrait}
                    onElementClick={onElementClick}
                />
            </div>
        );
    }

    const startIdx = (page - 1) * rowsPerPage;
    const endIdx = startIdx + rowsPerPage;
    const displayData = data.slice(startIdx, endIdx);

    if (layout === 'main_stage') {
        return (
            <div className="relative z-10 flex-1 flex flex-col gap-4">
                 {displayData.map((team, idx) => {
                    const actualRank = team.rank;
                    const isTop3 = actualRank <= 3;
                    
                    let rankColor = themeStyles.accent;
                    if (actualRank === 1) rankColor = '#EAB308';
                    else if (actualRank === 2) rankColor = '#94a3b8';
                    else if (actualRank === 3) rankColor = '#C2410C';

                    return (
                            <div className={tMode(`flex items-center justify-between ${isPortrait ? 'p-2' : 'p-3'} relative overflow-hidden backdrop-blur-md bg-white/5`)} style={{ clipPath: isPortrait ? 'none' : 'polygon(20px 0, 100% 0, calc(100% - 20px) 100%, 0 100%)', borderColor: isTemplate ? 'transparent' : (isTop3 ? rankColor : 'rgba(255,255,255,0.1)'), borderWidth: isTop3 ? '2px' : '1px' }}>
                                {/* Inner Glow / Edge Lighting */}
                                <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/30 to-transparent"></div>
                                
                                {/* Watermark Logo */}
                                <div className="absolute -right-10 -top-10 opacity-[0.03] pointer-events-none transform rotate-12 scale-150">
                                    <Shield className="w-64 h-64 text-white" />
                                </div>

                                {isTop3 && <div className="absolute inset-0 opacity-20" style={{ background: `linear-gradient(90deg, ${rankColor}40 0%, transparent 100%)` }}></div>}
                                
                                <div className={`flex items-center ${isPortrait ? 'gap-4 pl-2' : 'gap-8 pl-8'} relative z-10`}>
                                    <div className={`font-black ${isTop3 ? 'text-white' : themeStyles.subText} drop-shadow-lg`} style={{ color: isTop3 ? rankColor : undefined, fontSize: `${(isPortrait ? 1.5 : 3) * visualConfig.rankScale}rem` }}>
                                        #{actualRank}
                                    </div>
                                    <div>
                                        <div className={`font-black uppercase tracking-tighter ${themeStyles.text} drop-shadow-md truncate ${isPortrait ? 'max-w-[120px]' : ''}`} style={{ fontSize: `${(isPortrait ? 1.25 : 2.5) * visualConfig.headerScale}rem` }}>{team.name}</div>
                                        <div className={`flex items-center gap-2 text-xs font-bold uppercase ${themeStyles.subText}`}>
                                            {team.trend === 'RISING' ? <TrendingUp className="w-3 h-3 text-green-500"/> : team.trend === 'FALLING' ? <TrendingDown className="w-3 h-3 text-red-500"/> : <Minus className="w-3 h-3"/>}
                                            <span className="tracking-widest">{team.trend}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className={`flex items-center ${isPortrait ? 'gap-4 pr-2' : 'gap-12 pr-12'} relative z-10`}>
                                    {!isPortrait && (
                                        <>
                                            <div className="text-center">
                                                <div className={`text-3xl font-black ${themeStyles.text}`}>{team.totalFinishes}</div>
                                                <div className={`text-xs font-bold uppercase tracking-widest ${themeStyles.subText}`}>Kills</div>
                                            </div>
                                            <div className="text-center">
                                                <div className={`text-3xl font-black ${themeStyles.text}`}>{team.placementPoints}</div>
                                                <div className={`text-xs font-bold uppercase tracking-widest ${themeStyles.subText}`}>Place</div>
                                            </div>
                                        </>
                                    )}
                                    <div className={`text-right ${isPortrait ? 'pl-4' : 'pl-8'} border-l border-white/10 relative`}>
                                        <div className="absolute -left-px top-1/2 -translate-y-1/2 w-px h-1/2 bg-white/30"></div>
                                        <div className={`font-black ${themeStyles.text} drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]`} style={{ ...accentText, fontSize: `${(isPortrait ? 2 : 6) * visualConfig.fontScale}rem` }}>{team.totalPoints}</div>
                                        <div className={`text-[10px] font-bold uppercase tracking-widest ${themeStyles.subText}`}>Total Pts</div>
                                    </div>
                                </div>
                            </div>
                    );
                })}
            </div>
        );
    }

     if (layout === 'analyst') {
        const topScore = data[0]?.totalPoints || 1;
        
        return (
            <div className="relative z-10 flex-1">
                <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="border-b" style={{ borderColor: theme === 'paper' ? '#cbd5e1' : 'rgba(255,255,255,0.1)' }}>
                        <th className={`py-3 text-sm font-bold ${themeStyles.subText} uppercase tracking-widest`}>Rnk</th>
                        <th className={`py-3 text-sm font-bold ${themeStyles.subText} uppercase tracking-widest`}>Team</th>
                        {!isPortrait && <th className={`py-3 text-sm font-bold ${themeStyles.subText} uppercase tracking-widest text-center`}>Form (Last 5)</th>}
                        {!isPortrait && <th className={`py-3 text-sm font-bold ${themeStyles.subText} uppercase tracking-widest text-center`}>Gap</th>}
                        <th className={`py-3 text-sm font-bold ${themeStyles.subText} uppercase tracking-widest text-right`}>Pts</th>
                    </tr>
                </thead>
                <tbody>
                    {displayData.map((team, idx) => {
                        const actualRank = team.rank;
                        const gapToLeader = actualRank === 1 ? '-' : `-${topScore - team.totalPoints}`;
                        const recentForm = team.history.slice(-5).map(h => h.points);
                        const maxForm = Math.max(...recentForm, 1);

                        return (
                            <tr key={team.name} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                <td className={`py-4 text-xl font-mono ${themeStyles.subText}`}>
                                    {String(actualRank).padStart(2, '0')}
                                </td>
                                <td className="py-4">
                                    <div className={`text-2xl font-bold ${themeStyles.text} uppercase tracking-tight`} style={{ fontSize: `${1.5 * visualConfig.headerScale}rem` }}>{team.name}</div>
                                </td>
                                {!isPortrait && (
                                    <td className="py-4">
                                        <div className="flex items-end justify-center gap-1 h-8">
                                            {recentForm.map((pts, i) => (
                                                <div key={i} className="w-3 rounded-t-sm" style={{ height: `${(pts / maxForm) * 100}%`, backgroundColor: themeStyles.accent, opacity: 0.5 + (i * 0.1) }}></div>
                                            ))}
                                        </div>
                                    </td>
                                )}
                                {!isPortrait && (
                                    <td className={`py-4 text-center text-lg font-mono ${actualRank === 1 ? themeStyles.text : 'text-red-400'}`}>
                                        {gapToLeader}
                                    </td>
                                )}
                                <td className={`py-4 text-right text-3xl font-black ${themeStyles.text}`}>
                                    {team.totalPoints}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
                </table>
            </div>
        );
    }

    if (layout === 'story') {
        return (
            <div className="relative z-10 flex-1 flex flex-col gap-6">
                {displayData.map((team) => {
                    const mvp = [...team.players].sort((a,b) => b.impactScore - a.impactScore)[0];
                    const killPct = (team.killPoints / Math.max(1, team.totalPoints)) * 100;
                    const placePct = 100 - killPct;

                    return (
                        <div key={team.name} className={`flex items-center gap-6 p-4 ${themeStyles.cardBg} rounded-xl border-l-8`} style={{ borderColor: themeStyles.accent }}>
                            <div className={`text-6xl font-black ${themeStyles.text} w-24 text-center`} style={{ fontSize: `${4 * visualConfig.rankScale}rem` }}>
                                {team.rank}
                            </div>
                            <div className="flex-1">
                                <div className={`text-4xl font-black uppercase tracking-tight ${themeStyles.text} mb-1`} style={{ fontSize: `${2.5 * visualConfig.headerScale}rem` }}>{team.name}</div>
                                <div className={`text-sm font-bold uppercase tracking-widest ${themeStyles.subText} flex items-center gap-2`}>
                                    <Crown className="w-4 h-4 text-yellow-500" /> MVP: <span className="text-white">{mvp?.playerName || 'N/A'}</span>
                                </div>
                            </div>
                            <div className="w-1/3">
                                <div className="flex justify-between text-xs font-bold uppercase tracking-widest mb-2">
                                    <span className="text-red-400">Kills ({team.killPoints})</span>
                                    <span className="text-blue-400">Place ({team.placementPoints})</span>
                                </div>
                                <div className="h-3 w-full bg-black/50 rounded-full overflow-hidden flex">
                                    <div className="h-full bg-red-500" style={{ width: `${killPct}%` }}></div>
                                    <div className="h-full bg-blue-500" style={{ width: `${placePct}%` }}></div>
                                </div>
                            </div>
                            <div className="text-right pl-8">
                                <div className={`text-6xl font-black ${themeStyles.text}`}>{team.totalPoints}</div>
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    }

    return (
        <div className="relative z-10 flex-1 flex flex-col justify-between overflow-hidden">
            <div className="flex flex-col gap-1.5">
                {/* Header belt */}
                <div className="flex items-center px-4 py-1.5 bg-black/40 border-y border-white/5 font-mono text-[9px] font-bold uppercase tracking-[0.25em] text-white/40 mb-1">
                    <div className="w-16 text-center">POS</div>
                    <div className="w-1/3 pl-4">TEAM / CHAMPIONSHIP ROSTER</div>
                    {!isPortrait && (
                        <div className="flex-1 flex items-center justify-around mr-12 ml-8">
                            <div className="w-24 text-center">SDRR</div>
                            <div className="w-24 text-center">PLACE PTS</div>
                            <div className="w-24 text-center">KILL PTS</div>
                        </div>
                    )}
                    <div className="w-32 text-right pr-4">TOTAL SCORE</div>
                </div>

                {/* Body Rows */}
                {displayData.map((team, idx) => {
                    const actualRank = team.rank;
                    const isTop3 = actualRank <= 3;
                    
                    let rankColor = themeStyles.accent;
                    let rankBadgeBg = 'bg-zinc-800/60 border-zinc-700/50';
                    let rankText = 'text-zinc-300';
                    let rowBg = 'bg-[#121214]/85 hover:bg-[#18181b]/95 border-white/[0.02]';
                    let borderHighlight = 'border-l-zinc-700/40';
                    let badgeAccent = 'text-zinc-400';
                    
                    if (actualRank === 1) {
                        rankColor = '#EAB308'; // Gold
                        rankBadgeBg = 'bg-amber-500/10 border-amber-500/30';
                        rankText = 'text-yellow-400 font-extrabold';
                        rowBg = 'bg-gradient-to-r from-amber-500/[0.04] to-zinc-950/90 border border-amber-500/15 hover:from-amber-500/[0.08]';
                        borderHighlight = 'border-l-yellow-500';
                        badgeAccent = 'text-yellow-500';
                    } else if (actualRank === 2) {
                        rankColor = '#38bdf8'; // Blue / Platinum style
                        rankBadgeBg = 'bg-sky-500/10 border-sky-500/30';
                        rankText = 'text-sky-400 font-extrabold';
                        rowBg = 'bg-gradient-to-r from-sky-500/[0.03] to-zinc-950/90 border border-sky-500/10 hover:from-sky-500/[0.06]';
                        borderHighlight = 'border-l-sky-400';
                        badgeAccent = 'text-sky-400';
                    } else if (actualRank === 3) {
                        rankColor = '#f97316'; // Bronze / Orange
                        rankBadgeBg = 'bg-orange-500/10 border-orange-500/30';
                        rankText = 'text-orange-400 font-extrabold';
                        rowBg = 'bg-gradient-to-r from-orange-500/[0.03] to-zinc-950/90 border border-orange-500/15 hover:from-orange-500/[0.06]';
                        borderHighlight = 'border-l-orange-500';
                        badgeAccent = 'text-orange-500';
                    }

                    // Special custom generated background if theme is Paper (light theme)
                    if (theme === 'paper') {
                        rowBg = 'bg-white hover:bg-slate-50 border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.03)]';
                        rankBadgeBg = 'bg-slate-100 border-slate-200';
                        rankText = isTop3 ? 'text-slate-900 font-black' : 'text-slate-600 font-bold';
                        borderHighlight = isTop3 ? borderHighlight : 'border-l-slate-300';
                    }

                    // Dynamic crest/logo bg
                    const hashTeamColor = (str: string) => {
                        let hash = 0;
                        for (let i = 0; i < str.length; i++) {
                            hash = str.charCodeAt(i) + ((hash << 5) - hash);
                        }
                        const colors = [
                            'from-red-600 to-rose-950',
                            'from-indigo-600 to-blue-950',
                            'from-emerald-600 to-teal-950',
                            'from-amber-600 to-yellow-950',
                            'from-purple-600 to-fuchsia-950',
                            'from-pink-600 to-rose-950',
                            'from-teal-600 to-cyan-950'
                        ];
                        return colors[Math.abs(hash) % colors.length];
                    };

                    const teamLogoURL = branding.teamBranding?.[team.name]?.logoUrl;
                    const sdrrWins = team.history?.filter(h => h.rank === 1).length || 0;

                    return (
                        <div 
                            key={team.name}
                            onClick={() => onElementClick?.('team', { teamId: team.name })}
                            className={`flex items-center justify-between p-3 rounded-md border shadow-md transition-all duration-300 relative group border-l-[6px] ${borderHighlight} ${rowBg} cursor-pointer hover:scale-[1.005]`}
                        >
                            {/* Inner ambient glow on hover for premium dark card structure */}
                            {theme !== 'paper' && (
                                <div className="absolute inset-0 bg-gradient-to-r from-white/[0.01] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-md" />
                            )}

                            {/* LEFT BRAND SECTION */}
                            <div className="flex items-center gap-6 relative z-10 flex-1 min-w-0">
                                {/* Position Badge */}
                                <div className={`w-12 h-12 flex flex-col items-center justify-center rounded-sm border font-mono ${rankBadgeBg}`}>
                                    <span className={`text-[8px] uppercase tracking-wider ${isTop3 ? badgeAccent : 'text-zinc-500 font-bold'} font-mono leading-none shadow-sm`}>RANK</span>
                                    <span className={`text-2xl font-black italic tracking-tighter leading-none mt-1 ${rankText}`}>
                                        {actualRank}
                                    </span>
                                </div>

                                {/* Composite Team Crest / Logo */}
                                <div className="relative flex-shrink-0">
                                    <div className="w-11 h-11 rounded-sm bg-black/40 border border-white/5 flex items-center justify-center overflow-hidden relative shadow-inner">
                                        {teamLogoURL ? (
                                            <img src={teamLogoURL} alt={team.name} className="w-9 h-9 object-contain" referrerPolicy="no-referrer" />
                                        ) : (
                                            <div className={`w-full h-full bg-gradient-to-br ${hashTeamColor(team.name)} flex items-center justify-center text-white font-extrabold text-lg uppercase font-serif tracking-wider shadow-inner`}>
                                                {team.name.substring(0, 2)}
                                            </div>
                                        )}
                                    </div>
                                    {isTop3 && (
                                        <div className="absolute -top-1.5 -right-1.5">
                                            {actualRank === 1 ? (
                                                <div className="bg-yellow-500 text-black text-[8px] font-black uppercase p-0.5 rounded-sm flex items-center justify-center shadow-md animate-pulse">
                                                    <Crown className="w-2.5 h-2.5" />
                                                </div>
                                            ) : (
                                                <div className="bg-white/10 border border-white/15 text-white text-[8px] font-black uppercase p-0.5 rounded-sm flex items-center justify-center shadow-sm">
                                                    <Star className="w-2.5 h-2.5 text-zinc-300" fill="currentColor" />
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Team Name, Code and Trend */}
                                <div className="flex flex-col min-w-0 flex-1">
                                    <div className="flex items-center gap-2">
                                        <h3 className={`font-serif text-xl font-black uppercase tracking-tight truncate ${theme === 'paper' ? 'text-slate-900' : 'text-white'}`} style={{ fontSize: `${1.4 * visualConfig.headerScale}rem` }}>
                                            {team.name}
                                        </h3>
                                        <span className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-white/5 border border-white/5 text-white/50 font-semibold tracking-wider">
                                            #{(branding.teamBranding?.[team.name] as any)?.tag || team.name.substring(0, 3).toUpperCase()}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-3 mt-1 text-[10px] font-mono text-zinc-500">
                                        {team.trend === 'RISING' ? (
                                            <div className="flex items-center gap-1 text-emerald-400 font-bold bg-emerald-500/5 px-1.5 py-0.5 rounded border border-emerald-500/10">
                                                <TrendingUp className="w-3 h-3 animate-bounce" />
                                                <span>RISING</span>
                                            </div>
                                        ) : team.trend === 'FALLING' ? (
                                            <div className="flex items-center gap-1 text-rose-400 font-bold bg-rose-500/5 px-1.5 py-0.5 rounded border border-rose-500/10">
                                                <TrendingDown className="w-3 h-3" />
                                                <span>FALLING</span>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-1 text-zinc-400 font-bold bg-white/5 px-1.5 py-0.5 rounded border border-white/5">
                                                <Minus className="w-3 h-3" />
                                                <span>STABLE</span>
                                            </div>
                                        )}
                                        
                                        {!isPortrait && team.players && team.players.length > 0 && (
                                            <span className="text-zinc-700/40 truncate max-w-[240px] italic font-medium ml-2 border-l border-white/5 pl-3">
                                                {team.players.slice(0, 4).map(p => p.playerName).join(' • ')}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* STATISTICS PANEL */}
                            {!isPortrait && (
                                <div className="flex-1 flex items-center justify-around mr-12 ml-8 relative z-10 flex-shrink-0">
                                    {/* SDRR Wins */}
                                    <div className="w-24 flex flex-col items-center">
                                        <span className="text-[9px] font-mono uppercase tracking-widest text-zinc-500 mb-1">SDRR</span>
                                        <div className="flex items-center gap-1">
                                            {sdrrWins > 0 ? (
                                                <div className="flex items-center gap-1 text-yellow-400 bg-yellow-500/10 border border-yellow-500/25 px-2 py-0.5 rounded-sm font-black font-mono">
                                                    <Trophy className="w-3 h-3 text-yellow-500" />
                                                    <span>{sdrrWins}</span>
                                                </div>
                                            ) : (
                                                <span className="text-zinc-600 font-medium font-mono text-lg">-</span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Placement Points */}
                                    <div className="w-24 text-center">
                                        <span className="text-[9px] font-mono uppercase tracking-widest text-zinc-500 block mb-1">PLACE PTS</span>
                                        <span className="text-lg font-bold font-mono text-zinc-300">
                                            {team.placementPoints}
                                        </span>
                                    </div>

                                    {/* Kill Points */}
                                    <div className="w-24 text-center">
                                        <span className="text-[9px] font-mono uppercase tracking-widest text-zinc-500 block mb-1">KILL PTS</span>
                                        <span className="text-lg font-bold font-mono text-zinc-300">
                                            {team.totalFinishes}
                                        </span>
                                    </div>
                                </div>
                            )}

                            {/* POWERED POINTS BOX */}
                            <div className="w-32 flex items-center justify-end relative z-10 flex-shrink-0">
                                <div className="flex flex-col items-end">
                                    <span className="text-[8.5px] font-mono tracking-widest text-zinc-500 uppercase mb-0.5">PTS</span>
                                    <div 
                                        className={`px-3 py-1 bg-black/60 border border-white/5 rounded-sm font-black text-3xl tracking-tighter shadow-md`}
                                        style={{ color: isTop3 ? rankColor : '#FFFFFF', fontFamily: 'var(--font-heading, "Inter")' }}
                                    >
                                        {team.totalPoints}
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Premium Template Signature Footer */}
            {!isExporting && (
                <div className="mt-6 flex items-center justify-between border-t border-white/5 pt-4 text-[9px] font-mono text-white/30 tracking-[0.2em] uppercase">
                    <div className="flex items-center gap-3">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        <span>FRAGLAB POWERED ANALYTICS SYSTEM</span>
                    </div>
                    <div>PAGE {page} OF {totalPages} // CUMULATIVE STANDINGS OVERVIEW</div>
                </div>
            )}
        </div>
    );
  };

  const TeamProfileLayout = () => {
      const team = data.find(t => t.name === config.focusTeamId);
      if (!team) return null;

      const isChamp = team.rank === 1;
      const isTop3 = team.rank <= 3;
      
      let themeColor = themeStyles.text;
      let accentColor = themeStyles.accent;
      let bgGradient = 'from-gray-900 to-black';

      if (isChamp) {
          themeColor = 'text-yellow-500';
          accentColor = '#eab308';
          bgGradient = 'from-yellow-950/50 to-black';
      } else if (isTop3) {
          themeColor = 'text-blue-400';
          accentColor = '#60a5fa';
          bgGradient = 'from-blue-950/50 to-black';
      }

      // Calculation logic...
      const pointsList = team.history.map(h => h.points);
      const mean = pointsList.reduce((a,b) => a+b, 0) / Math.max(1, pointsList.length);
      const variance = pointsList.reduce((a,b) => a + Math.pow(b - mean, 2), 0) / Math.max(1, pointsList.length);
      const stdDev = Math.sqrt(variance);
      const cv = mean > 0 ? (stdDev / mean) * 100 : 0;

      const dnaData = [
          { subject: 'AGG', A: Math.min(100, team.aggressionIndex), fullMark: 100 },
          { subject: 'SURV', A: Math.min(100, (team.avgSurvivalTime / 25) * 100), fullMark: 100 },
          { subject: 'CONST', A: Math.max(0, 100 - cv), fullMark: 100 },
          { subject: 'EFF', A: Math.min(100, (team.efficiencyRating / 40) * 100), fullMark: 100 },
          { subject: 'KILL', A: Math.min(100, (team.totalFinishes / (team.matchesPlayed * 10)) * 100), fullMark: 100 },
      ];

      return (
          <div className="flex-1 flex flex-col relative cursor-pointer" onClick={() => onElementClick?.('team', { teamId: team.name })}>
              <div className={`absolute inset-0 bg-gradient-to-b ${bgGradient} opacity-30 pointer-events-none`}></div>
              
              <div className={`flex ${isPortrait ? 'flex-col items-center gap-6' : 'justify-between items-start'} mb-8 relative z-10`}>
                  <div className={`flex-1 ${isPortrait ? 'text-center flex flex-col items-center w-full' : ''}`}>
                      <div className={`flex items-center gap-4 mb-2 ${isPortrait ? 'flex-col justify-center' : ''}`}>
                          <span className={`font-black ${themeColor}`} style={{ fontSize: `${4.5 * visualConfig.rankScale}rem` }}>#{team.rank}</span>
                          <div>
                              <h1 className={`font-black uppercase leading-none ${themeStyles.text} tracking-tighter`} style={{ fontSize: `${(isPortrait ? 4 : 6) * visualConfig.headerScale}rem` }}>{team.name}</h1>
                              <div className={`flex gap-4 mt-2 ${isPortrait ? 'justify-center' : ''}`}>
                                  {team.flags.map(f => (
                                      <span key={f} className={`px-3 py-1 border-2 text-xl font-bold uppercase ${themeStyles.subText}`} style={{ borderColor: theme === 'paper' ? '#94a3b8' : 'rgba(255,255,255,0.2)' }}>
                                          {f}
                                      </span>
                                  ))}
                                  <div className="flex items-center gap-2 text-xl font-bold uppercase text-white bg-white/10 px-3 py-1 rounded-sm">
                                      {team.trend === 'RISING' ? <TrendingUp className="w-5 h-5 text-green-500"/> : team.trend === 'FALLING' ? <TrendingDown className="w-5 h-5 text-red-500"/> : <Minus className="w-5 h-5"/>}
                                      {team.trend}
                                  </div>
                              </div>
                          </div>
                      </div>
                      
                      <div className={`grid ${isPortrait ? 'grid-cols-2 text-center w-full' : 'grid-cols-4'} mt-12 bg-white/5 rounded-sm backdrop-blur-sm border border-white/10`} style={{ gap: `${2 * visualConfig.itemSpacing}rem`, padding: `${1.5 * visualConfig.padding}rem` }}>
                          <div className={isPortrait ? 'border-b border-white/10 pb-4' : ''}>
                              <div className={`text-xl font-bold uppercase tracking-widest ${themeStyles.subText}`} style={{ fontSize: `${1.25 * visualConfig.fontScale}rem` }}>Total Pts</div>
                              <div className={`text-6xl font-black ${themeStyles.text}`} style={{ fontSize: `${3.75 * visualConfig.fontScale}rem` }}>{team.totalPoints}</div>
                          </div>
                          <div className={`${isPortrait ? 'border-b border-white/10 pb-4' : 'border-l border-white/10'}`} style={{ paddingLeft: isPortrait ? '0' : `${2 * visualConfig.itemSpacing}rem` }}>
                              <div className={`text-xl font-bold uppercase tracking-widest ${themeStyles.subText}`} style={{ fontSize: `${1.25 * visualConfig.fontScale}rem` }}>Wins</div>
                              <div className={`text-6xl font-black ${isChamp ? 'text-yellow-500' : themeStyles.text}`} style={{ fontSize: `${3.75 * visualConfig.fontScale}rem` }}>{team.history.filter(h=>h.rank===1).length}</div>
                          </div>
                          <div className={isPortrait ? 'pt-4' : 'border-l border-white/10'} style={{ paddingLeft: isPortrait ? '0' : `${2 * visualConfig.itemSpacing}rem` }}>
                              <div className={`text-xl font-bold uppercase tracking-widest ${themeStyles.subText}`} style={{ fontSize: `${1.25 * visualConfig.fontScale}rem` }}>Frag Pts</div>
                              <div className={`text-6xl font-black ${themeStyles.text}`} style={{ fontSize: `${3.75 * visualConfig.fontScale}rem` }}>{team.killPoints}</div>
                          </div>
                          <div className={`${isPortrait ? 'pt-4 border-l border-white/10 pl-4' : 'border-l border-white/10'}`} style={{ paddingLeft: isPortrait ? '1rem' : `${2 * visualConfig.itemSpacing}rem` }}>
                              <div className={`text-xl font-bold uppercase tracking-widest ${themeStyles.subText}`} style={{ fontSize: `${1.25 * visualConfig.fontScale}rem` }}>Matches</div>
                              <div className={`text-6xl font-black ${themeStyles.text}`} style={{ fontSize: `${3.75 * visualConfig.fontScale}rem` }}>{team.matchesPlayed}</div>
                          </div>
                      </div>
                  </div>

                  <div className={`${isPortrait ? 'w-[300px] h-[300px] mt-4' : 'w-[400px] h-[400px]'} bg-white/5 rounded-full border border-white/10 relative flex items-center justify-center p-4`}>
                        <div className="absolute top-4 left-0 w-full text-center text-xl font-bold uppercase tracking-widest text-white">Squad DNA</div>
                        <ResponsiveContainer width="100%" height="100%">
                            <RadarChart cx="50%" cy="55%" outerRadius="70%" data={dnaData}>
                                <PolarGrid stroke={theme === 'paper' ? '#ccc' : '#444'} />
                                <PolarAngleAxis dataKey="subject" tick={{ fill: theme === 'paper' ? '#666' : '#999', fontSize: 14, fontWeight: 'bold' }} />
                                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                                <Radar
                                    name={team.name}
                                    dataKey="A"
                                    stroke={accentColor}
                                    strokeWidth={4}
                                    fill={accentColor}
                                    fillOpacity={0.5}
                                    isAnimationActive={!isExporting} // KILL ANIMATION
                                />
                            </RadarChart>
                        </ResponsiveContainer>
                  </div>
              </div>

              <div className={`flex-1 flex ${isPortrait ? 'flex-col gap-4' : 'items-stretch'} relative z-10 pb-8`} style={{ gap: isPortrait ? undefined : `${1.5 * visualConfig.itemSpacing}rem` }}>
                  {team.players.map((p, idx) => {
                      const roleColor = p.carryClass === 'SYSTEM_COLLAPSE' ? '#ef4444' : p.carryClass === 'HARD_CARRY' ? '#eab308' : '#71717a';
                      return (
                          <div key={idx} className={`flex-1 bg-black/40 backdrop-blur-md border-t-8 flex flex-col justify-between relative`} style={{ borderColor: roleColor, padding: `${1.5 * visualConfig.padding}rem` }}>
                              <div>
                                  <div className="text-sm font-bold uppercase text-white/50 mb-1" style={{ fontSize: `${0.875 * visualConfig.fontScale}rem` }}>Operator</div>
                                  <div className="text-3xl font-black text-white uppercase truncate" style={{ fontSize: `${1.875 * visualConfig.fontScale}rem` }}>{p.playerName}</div>
                                  <div className="inline-block mt-2 px-2 py-1 text-xs font-bold uppercase text-black bg-white" style={{ fontSize: `${0.75 * visualConfig.fontScale}rem` }}>{p.carryClass.replace('_', ' ')}</div>
                              </div>
                              
                              <div className="space-y-3">
                                  {visualConfig.statPriority === 'rating' ? (
                                      <>
                                        <div className="flex justify-between items-end">
                                            <span className="text-white/60 font-mono text-sm uppercase" style={{ fontSize: `${0.875 * visualConfig.fontScale}rem` }}>Rating</span>
                                            <span className="text-4xl font-black text-white leading-none" style={{ fontSize: `${2.25 * visualConfig.fontScale}rem` }}>{p.impactScore.toFixed(0)}</span>
                                        </div>
                                        <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
                                            <div className="h-full" style={{ width: `${p.damageShare}%`, backgroundColor: roleColor }}></div>
                                        </div>
                                        <div className="flex justify-between text-xs font-mono text-white/60 uppercase" style={{ fontSize: `${0.75 * visualConfig.fontScale}rem` }}>
                                            <span>{p.finishes} Kills</span>
                                            <span>{(p.damage/1000).toFixed(1)}k Dmg</span>
                                        </div>
                                      </>
                                  ) : (
                                      <>
                                        <div className="flex justify-between items-end border-b border-white/10 pb-2 mb-2">
                                            <div>
                                                <div className="text-4xl font-black text-white leading-none mb-1" style={{ fontSize: `${2.25 * visualConfig.fontScale}rem` }}>{p.finishes}</div>
                                                <div className="text-[10px] uppercase font-bold text-white/50" style={{ fontSize: `${0.625 * visualConfig.fontScale}rem` }}>Kills</div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-3xl font-bold text-white leading-none mb-1" style={{ fontSize: `${1.875 * visualConfig.fontScale}rem` }}>{(p.damage/1000).toFixed(1)}k</div>
                                                <div className="text-[10px] uppercase font-bold text-white/50" style={{ fontSize: `${0.625 * visualConfig.fontScale}rem` }}>Damage</div>
                                            </div>
                                        </div>
                                        <div className="flex justify-between items-center text-xs font-mono text-white/60 uppercase" style={{ fontSize: `${0.75 * visualConfig.fontScale}rem` }}>
                                            <span>Rating: {p.impactScore.toFixed(0)}</span>
                                            <span>Share: {p.damageShare.toFixed(0)}%</span>
                                        </div>
                                      </>
                                  )}
                              </div>
                          </div>
                      );
                  })}
              </div>
          </div>
      );
  };

  const PlayerProfileLayout = () => {
      const player = data.flatMap(t => t.players.map(p => ({ ...p, teamName: t.name, teamRank: t.rank }))).find(p => p.playerName === config.focusPlayerName);
      if (!player) return null;

      const team = data.find(t => t.name === player.teamName);
      const teamAvgDmg = team ? team.totalDamage / team.players.length : 1000;
      const teamAvgKills = team ? team.totalFinishes / team.players.length : 3;

      const radarData = [
        { subject: 'DMG', A: (player.damage / Math.max(1, teamAvgDmg)) * 100, fullMark: 150 },
        { subject: 'KILLS', A: (player.finishes / Math.max(1, teamAvgKills)) * 100, fullMark: 150 },
        { subject: 'SURV', A: 80, fullMark: 100 }, 
        { subject: 'IMPACT', A: Math.min(100, (player.impactScore / 250) * 100), fullMark: 100 },
        { subject: 'SHARE', A: player.damageShare * 2, fullMark: 100 },
      ];

      const roleColor = player.carryClass === 'SYSTEM_COLLAPSE' ? '#ef4444' : player.carryClass === 'HARD_CARRY' ? '#eab308' : themeStyles.accent;

      return (
          <div className={`flex-1 flex ${isPortrait ? 'flex-col items-center overflow-y-auto' : 'gap-12 items-stretch'} cursor-pointer`} onClick={() => onElementClick?.('player', { playerName: player.playerName })}>
              <div className={`${isPortrait ? 'w-full text-center items-center pb-6 border-b border-white/10' : 'w-1/3 bg-black/40 border-r border-white/10'} flex flex-col relative`} style={{ padding: `${3 * visualConfig.padding}rem` }}>
                  <div className={`absolute top-0 left-0 w-full h-2`} style={{ backgroundColor: roleColor }}></div>
                  
                  <div className={`flex-1 flex flex-col justify-center ${isPortrait ? 'items-center mt-4' : ''}`}>
                      <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mb-4 border-2 border-white/10 shrink-0">
                          <User className="w-12 h-12 text-white" />
                      </div>
                      <h1 className={`font-black text-white uppercase leading-tight mb-2 break-words ${isPortrait ? 'text-center' : ''}`} style={{ fontSize: `${(player.playerName.length > 10 ? 3.5 : 4.5) * visualConfig.headerScale}rem` }}>{player.playerName}</h1>
                      <div className="text-2xl font-mono text-white/50 uppercase tracking-widest mb-4">{player.teamName}</div>
                      <div className={`inline-block px-4 py-2 bg-white/10 text-white font-bold uppercase tracking-widest text-lg rounded-sm border border-white/20 ${isPortrait ? 'self-center' : 'self-start'}`}>
                          {player.carryClass.replace('_', ' ')}
                      </div>
                  </div>

                  <div className={`pt-4 shrink-0 ${isPortrait ? 'text-center w-full mt-6 bg-white/5 py-4 border border-white/10' : 'mt-auto'}`}>
                      <div className="text-sm font-mono text-white/40 uppercase mb-1">Team Impact Share</div>
                      <div className="text-7xl font-black text-white leading-none">{player.damageShare.toFixed(0)}<span className="text-3xl text-white/50">%</span></div>
                  </div>
              </div>

              <div className={`${isPortrait ? 'w-full h-[300px] my-4' : 'w-1/3'} flex flex-col items-center justify-center relative`}>
                  <div className="w-full h-full absolute inset-0 bg-gradient-to-b from-transparent via-white/5 to-transparent opacity-30"></div>
                  <div className="relative z-10 w-full h-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                            <PolarGrid stroke="#444" />
                            <PolarAngleAxis dataKey="subject" tick={{ fill: '#fff', fontSize: 16, fontWeight: 'bold' }} />
                            <PolarRadiusAxis angle={30} domain={[0, 150]} tick={false} axisLine={false} />
                            <Radar name={player.playerName} dataKey="A" stroke={roleColor} strokeWidth={5} fill={roleColor} fillOpacity={0.4} isAnimationActive={!isExporting} />
                        </RadarChart>
                      </ResponsiveContainer>
                  </div>
              </div>

              <div className="w-full flex-1 flex flex-col justify-center" style={{ gap: `${2 * visualConfig.itemSpacing}rem`, padding: `${(isPortrait ? 1 : 3) * visualConfig.padding}rem` }}>
                  {visualConfig.statPriority === 'combat' ? (
                      <>
                        <div className="bg-white/5 border-l-8 border-white/20" style={{ padding: `${2 * visualConfig.padding}rem` }}>
                            <div className="text-2xl font-bold uppercase text-white/50 mb-2 tracking-widest" style={{ fontSize: `${1.5 * visualConfig.fontScale}rem` }}>Confirmed Kills</div>
                            <div className={`${isPortrait ? 'text-6xl' : 'text-9xl'} font-black text-white`} style={{ fontSize: `${(isPortrait ? 4 : 8) * visualConfig.fontScale}rem` }}>{player.finishes}</div>
                        </div>
                        <div className="bg-white/5 border-l-8" style={{ borderColor: roleColor, padding: `${2 * visualConfig.padding}rem` }}>
                            <div className="text-2xl font-bold uppercase text-white/50 mb-2 tracking-widest" style={{ fontSize: `${1.5 * visualConfig.fontScale}rem` }}>Total Damage</div>
                            <div className={`${isPortrait ? 'text-6xl' : 'text-9xl'} font-black text-white`} style={{ fontSize: `${(isPortrait ? 4 : 8) * visualConfig.fontScale}rem` }}>{(player.damage / 1000).toFixed(1)}k</div>
                        </div>
                        <div className="bg-white/5 border-l-8 border-white/20 opacity-75" style={{ padding: `${2 * visualConfig.padding}rem` }}>
                            <div className="text-xl font-bold uppercase text-white/50 mb-2 tracking-widest" style={{ fontSize: `${1.25 * visualConfig.fontScale}rem` }}>Impact Rating</div>
                            <div className="text-6xl font-black text-white" style={{ fontSize: `${3.75 * visualConfig.fontScale}rem` }}>{player.impactScore.toFixed(0)}</div>
                        </div>
                      </>
                  ) : (
                      <>
                        <div className="bg-white/5 border-l-8 border-white/20" style={{ padding: `${2 * visualConfig.padding}rem` }}>
                            <div className="text-2xl font-bold uppercase text-white/50 mb-2 tracking-widest" style={{ fontSize: `${1.5 * visualConfig.fontScale}rem` }}>Impact Rating</div>
                            <div className={`${isPortrait ? 'text-6xl' : 'text-9xl'} font-black text-white`} style={{ fontSize: `${(isPortrait ? 4 : 8) * visualConfig.fontScale}rem` }}>{player.impactScore.toFixed(0)}</div>
                        </div>
                        <div className="bg-white/5 border-l-8" style={{ borderColor: roleColor, padding: `${2 * visualConfig.padding}rem` }}>
                            <div className="text-2xl font-bold uppercase text-white/50 mb-2 tracking-widest" style={{ fontSize: `${1.5 * visualConfig.fontScale}rem` }}>Total Damage</div>
                            <div className={`${isPortrait ? 'text-5xl' : 'text-8xl'} font-black text-white`} style={{ fontSize: `${(isPortrait ? 3.5 : 7) * visualConfig.fontScale}rem` }}>{(player.damage / 1000).toFixed(1)}k</div>
                        </div>
                        <div className="bg-white/5 border-l-8 border-white/20" style={{ padding: `${2 * visualConfig.padding}rem` }}>
                            <div className="text-2xl font-bold uppercase text-white/50 mb-2 tracking-widest" style={{ fontSize: `${1.5 * visualConfig.fontScale}rem` }}>Confirmed Kills</div>
                            <div className={`${isPortrait ? 'text-5xl' : 'text-8xl'} font-black text-white`} style={{ fontSize: `${(isPortrait ? 3.5 : 7) * visualConfig.fontScale}rem` }}>{player.finishes}</div>
                        </div>
                      </>
                  )}
              </div>
          </div>
      );
  };

  const PlayerComparisonLayout = () => {
      const playerA = data.flatMap(t => t.players.map(p => ({ ...p, teamName: t.name }))).find(p => p.playerName === config.focusPlayerName);
      const playerB = data.flatMap(t => t.players.map(p => ({ ...p, teamName: t.name }))).find(p => p.playerName === config.comparePlayerName);
      
      if (!playerA || !playerB) return (
          <div className="flex-1 flex items-center justify-center text-white/20 text-4xl font-black uppercase tracking-widest">
              Select two players to compare
          </div>
      );

      // Normalization helpers
      const maxKills = Math.max(...data.flatMap(t => t.players.map(p => p.finishes))) || 10;
      const maxDamage = Math.max(...data.flatMap(t => t.players.map(p => p.damage))) || 5000;
      const maxImpact = Math.max(...data.flatMap(t => t.players.map(p => p.impactScore))) || 300;

      const radarData = [
        { subject: 'KILLS', A: (playerA.finishes / maxKills) * 100, B: (playerB.finishes / maxKills) * 100, fullMark: 100 },
        { subject: 'DAMAGE', A: (playerA.damage / maxDamage) * 100, B: (playerB.damage / maxDamage) * 100, fullMark: 100 },
        { subject: 'IMPACT', A: (playerA.impactScore / maxImpact) * 100, B: (playerB.impactScore / maxImpact) * 100, fullMark: 100 },
        { subject: 'SHARE', A: playerA.damageShare * 2, B: playerB.damageShare * 2, fullMark: 100 },
        { subject: 'CONSIST', A: 70, B: 85, fullMark: 100 }, 
      ];

      const colorA = '#3b82f6'; // Blue
      const colorB = '#ef4444'; // Red

      return (
          <div className={`flex-1 flex flex-col relative ${isPortrait ? 'p-8' : 'p-16'}`}>
              {/* Background Grid */}
              <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
              
              {/* Branding Header */}
              <div className={`flex ${isPortrait ? 'flex-col items-center text-center gap-4' : 'justify-between items-start'} mb-12 relative z-10 cursor-pointer`} onClick={() => onElementClick?.('header')}>
                  <div className="flex items-center gap-6">
                      <div className="p-4 bg-tactical-red text-white rounded-sm shadow-xl">
                          {branding.logoUrl ? (
                              <img src={branding.logoUrl} alt="Logo" className="w-12 h-12 object-contain invert brightness-0" />
                          ) : (
                              <Shield className="w-12 h-12" />
                          )}
                      </div>
                      <div>
                          <h1 className="text-6xl font-black tracking-tighter uppercase text-white leading-none">{branding.orgName}</h1>
                          <p className="text-xl text-tactical-light font-bold tracking-[0.3em] mt-1 uppercase">Intelligence Report</p>
                      </div>
                  </div>
                  
                  {!isPortrait && (
                      <div className="text-right">
                          <h2 className="text-6xl font-black text-white uppercase tracking-tight leading-none">{config.title || 'Player Comparison'}</h2>
                          <p className="text-2xl font-bold mt-2 uppercase text-tactical-red">{config.subtitle || 'Head-to-Head'}</p>
                      </div>
                  )}
              </div>

              {/* Player Names Row */}
              <div className={`flex ${isPortrait ? 'flex-col items-center' : 'justify-between items-center'} mb-8 relative z-10`}>
                  <div className={`flex-1 ${isPortrait ? 'text-center' : 'text-left'} cursor-pointer hover:brightness-125 transition-all`} onClick={() => onElementClick?.('player', { playerName: playerA.playerName })}>
                      <div className="text-xs font-mono text-blue-400 uppercase tracking-[0.3em] mb-2 opacity-70" style={{ fontSize: `${0.75 * visualConfig.fontScale}rem` }}>Player Alpha</div>
                      <h1 className={`${isPortrait ? 'text-5xl' : 'text-8xl'} font-black text-white uppercase leading-none tracking-tighter drop-shadow-[0_0_20px_rgba(59,130,246,0.3)]`} style={{ fontSize: `${(isPortrait ? 3 : 6) * visualConfig.headerScale}rem` }}>{playerA.playerName}</h1>
                      <div className="text-xl font-mono text-white/40 uppercase tracking-widest mt-1" style={{ fontSize: `${1.25 * visualConfig.fontScale}rem` }}>{playerA.teamName}</div>
                  </div>
                  
                  <div className={`flex flex-col items-center ${isPortrait ? 'py-6' : 'px-16'}`}>
                      <div className="relative">
                          <div className="text-5xl font-black text-white italic tracking-tighter relative z-10" style={{ fontSize: `${3 * visualConfig.fontScale}rem` }}>VS</div>
                          <div className="absolute inset-0 blur-2xl bg-white/20 scale-150"></div>
                      </div>
                      <div className="flex gap-1 mt-3">
                          <div className="h-1 w-12 bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.8)]"></div>
                          <div className="h-1 w-12 bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)]"></div>
                      </div>
                  </div>

                  <div className={`flex-1 ${isPortrait ? 'text-center' : 'text-right'} cursor-pointer hover:brightness-125 transition-all`} onClick={() => onElementClick?.('player', { playerName: playerB.playerName })}>
                      <div className="text-xs font-mono text-red-400 uppercase tracking-[0.3em] mb-2 opacity-70" style={{ fontSize: `${0.75 * visualConfig.fontScale}rem` }}>Player Bravo</div>
                      <h1 className={`${isPortrait ? 'text-5xl' : 'text-8xl'} font-black text-white uppercase leading-none tracking-tighter drop-shadow-[0_0_20px_rgba(239,68,68,0.3)]`} style={{ fontSize: `${(isPortrait ? 3 : 6) * visualConfig.headerScale}rem` }}>{playerB.playerName}</h1>
                      <div className="text-xl font-mono text-white/40 uppercase tracking-widest mt-1" style={{ fontSize: `${1.25 * visualConfig.fontScale}rem` }}>{playerB.teamName}</div>
                  </div>
              </div>

              {/* Main Comparison Area */}
              <div className={`flex-1 flex ${isPortrait ? 'flex-col' : 'items-stretch'} relative z-10`}>
                  {/* Player A Stats */}
                  <div className={`flex-1 flex ${isPortrait ? 'flex-row justify-around order-1' : 'flex-col justify-center items-end pr-16 order-1'}`} style={{ gap: `${2 * visualConfig.itemSpacing}rem` }}>
                      <div className={isPortrait ? 'text-center' : 'text-right group'}>
                          <div className="text-[10px] font-bold text-white/20 uppercase tracking-[0.4em] mb-1" style={{ fontSize: `${0.625 * visualConfig.fontScale}rem` }}>Kills</div>
                          <div className={`${isPortrait ? 'text-6xl' : 'text-9xl'} font-black text-blue-500 drop-shadow-[0_0_25px_rgba(59,130,246,0.4)] leading-none`} style={{ fontSize: `${(isPortrait ? 3.75 : 8) * visualConfig.fontScale}rem` }}>{playerA.finishes}</div>
                      </div>
                      <div className={isPortrait ? 'text-center' : 'text-right group'}>
                          <div className="text-[10px] font-bold text-white/20 uppercase tracking-[0.4em] mb-1" style={{ fontSize: `${0.625 * visualConfig.fontScale}rem` }}>Damage</div>
                          <div className={`${isPortrait ? 'text-6xl' : 'text-9xl'} font-black text-blue-500 drop-shadow-[0_0_25px_rgba(59,130,246,0.4)] leading-none`} style={{ fontSize: `${(isPortrait ? 3.75 : 8) * visualConfig.fontScale}rem` }}>{(playerA.damage / 1000).toFixed(1)}<span className="text-4xl opacity-30">k</span></div>
                      </div>
                      <div className={isPortrait ? 'text-center' : 'text-right group'}>
                          <div className="text-[10px] font-bold text-white/20 uppercase tracking-[0.4em] mb-1" style={{ fontSize: `${0.625 * visualConfig.fontScale}rem` }}>Impact</div>
                          <div className={`${isPortrait ? 'text-6xl' : 'text-9xl'} font-black text-blue-500 drop-shadow-[0_0_25px_rgba(59,130,246,0.4)] leading-none`} style={{ fontSize: `${(isPortrait ? 3.75 : 8) * visualConfig.fontScale}rem` }}>{playerA.impactScore.toFixed(0)}</div>
                      </div>
                  </div>

                  {/* Radar Chart */}
                  <div className={`${isPortrait ? 'h-[450px] w-full' : 'w-[700px]'} flex items-center justify-center relative order-2`}>
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-transparent to-red-500/5 rounded-full blur-[120px] opacity-40"></div>
                      <div className="w-full h-full relative z-20">
                          <ResponsiveContainer width="100%" height="100%">
                            <RadarChart cx="50%" cy="50%" outerRadius={isPortrait ? "65%" : "80%"} data={radarData}>
                                <PolarGrid stroke="#333" strokeDasharray="4 4" />
                                <PolarAngleAxis dataKey="subject" tick={{ fill: '#fff', fontSize: 16, fontWeight: 900, letterSpacing: '0.2em' }} />
                                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                                <Radar name={playerA.playerName} dataKey="A" stroke={colorA} strokeWidth={6} fill={colorA} fillOpacity={0.3} isAnimationActive={!isExporting} />
                                <Radar name={playerB.playerName} dataKey="B" stroke={colorB} strokeWidth={6} fill={colorB} fillOpacity={0.3} isAnimationActive={!isExporting} />
                            </RadarChart>
                          </ResponsiveContainer>
                      </div>
                  </div>

                  {/* Player B Stats */}
                  <div className={`flex-1 flex ${isPortrait ? 'flex-row justify-around order-3' : 'flex-col justify-center items-start pl-16 order-3'}`} style={{ gap: `${2 * visualConfig.itemSpacing}rem` }}>
                      <div className={isPortrait ? 'text-center' : 'text-left group'}>
                          <div className="text-[10px] font-bold text-white/20 uppercase tracking-[0.4em] mb-1" style={{ fontSize: `${0.625 * visualConfig.fontScale}rem` }}>Kills</div>
                          <div className={`${isPortrait ? 'text-6xl' : 'text-9xl'} font-black text-red-500 drop-shadow-[0_0_25px_rgba(239,68,68,0.4)] leading-none`} style={{ fontSize: `${(isPortrait ? 3.75 : 8) * visualConfig.fontScale}rem` }}>{playerB.finishes}</div>
                      </div>
                      <div className={isPortrait ? 'text-center' : 'text-left group'}>
                          <div className="text-[10px] font-bold text-white/20 uppercase tracking-[0.4em] mb-1" style={{ fontSize: `${0.625 * visualConfig.fontScale}rem` }}>Damage</div>
                          <div className={`${isPortrait ? 'text-6xl' : 'text-9xl'} font-black text-red-500 drop-shadow-[0_0_25px_rgba(239,68,68,0.4)] leading-none`} style={{ fontSize: `${(isPortrait ? 3.75 : 8) * visualConfig.fontScale}rem` }}>{(playerB.damage / 1000).toFixed(1)}<span className="text-4xl opacity-30">k</span></div>
                      </div>
                      <div className={isPortrait ? 'text-center' : 'text-left group'}>
                          <div className="text-[10px] font-bold text-white/20 uppercase tracking-[0.4em] mb-1" style={{ fontSize: `${0.625 * visualConfig.fontScale}rem` }}>Impact</div>
                          <div className={`${isPortrait ? 'text-6xl' : 'text-9xl'} font-black text-red-500 drop-shadow-[0_0_25px_rgba(239,68,68,0.4)] leading-none`} style={{ fontSize: `${(isPortrait ? 3.75 : 8) * visualConfig.fontScale}rem` }}>{playerB.impactScore.toFixed(0)}</div>
                      </div>
                  </div>
              </div>

              {/* Footer Comparison Bar */}
              <div className="mt-8 relative z-10">
                  <div className="bg-black/40 border border-white/10 p-4 rounded-sm backdrop-blur-md">
                      <div className="flex justify-between text-[10px] font-mono text-white/40 uppercase tracking-[0.3em] mb-3">
                          <span className="text-blue-400 font-bold">{playerA.playerName}</span>
                          <span className="hidden sm:inline">Total Impact Distribution</span>
                          <span className="text-red-400 font-bold">{playerB.playerName}</span>
                      </div>
                      <div className="h-3 bg-white/5 rounded-full overflow-hidden flex border border-white/5">
                          <div className="h-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.8)]" style={{ width: `${(playerA.damageShare / (playerA.damageShare + playerB.damageShare)) * 100}%` }}></div>
                          <div className="h-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)]" style={{ width: `${(playerB.damageShare / (playerA.damageShare + playerB.damageShare)) * 100}%` }}></div>
                      </div>
                  </div>
              </div>

              {/* Standard Footer */}
              <Footer />
          </div>
      );
  };

  const TopFraggersLayout = () => {
      const topFraggers = data
            .flatMap(t => t.players.map(p => ({ ...p, teamName: t.name })))
            .sort((a, b) => b.finishes - a.finishes || b.damage - a.damage)
            .slice(0, 5);

      const topDog = topFraggers[0];
      const runnersUp = topFraggers.slice(1, 5);

      if (!topDog) return null;

      return (
          <div className={`flex-1 flex ${isPortrait ? 'flex-col' : 'flex-row'} gap-12 relative`}>
              <div className={`flex flex-col ${isPortrait ? 'w-full' : 'w-1/3'} p-8 border-l-8 items-center justify-center text-center ${themeStyles.cardBg} cursor-pointer hover:brightness-125 transition-all`} style={accentBorder} onClick={() => onElementClick?.('player', { playerName: topDog.playerName })}>
                  <div className="mb-4">
                      <div className={`w-24 h-24 rounded-full ${themeStyles.text} flex items-center justify-center text-4xl font-black mx-auto mb-4 border-4`} style={{ borderColor: themeStyles.accent, backgroundColor: theme === 'paper' ? '#e2e8f0' : 'rgba(255,255,255,0.1)' }}>#1</div>
                      <Skull className={`${isPortrait ? 'w-32 h-32' : 'w-48 h-48'} mx-auto ${themeStyles.text} opacity-80`} strokeWidth={1} />
                  </div>
                  <div className={`font-black ${themeStyles.text} uppercase leading-none mb-2`} style={{ fontSize: `${(isPortrait ? 3 : 3.75) * visualConfig.headerScale}rem` }}>{topDog.playerName}</div>
                  <div className={`text-3xl ${themeStyles.fontBody} ${themeStyles.subText} uppercase ${isPortrait ? 'mb-4' : 'mb-8'}`}>{topDog.teamName}</div>
                  
                  <div className="flex gap-8">
                      <div>
                          <div className={`text-7xl font-black ${themeStyles.text} leading-none`} style={accentText}>{topDog.finishes}</div>
                          <div className={`text-xl font-bold uppercase ${themeStyles.subText} tracking-widest mt-1`}>Kills</div>
                      </div>
                      <div className={`w-px ${theme === 'paper' ? 'bg-slate-300' : 'bg-white/20'}`}></div>
                      <div>
                          <div className={`text-7xl font-black ${themeStyles.text} leading-none`}>{(topDog.damage/1000).toFixed(1)}k</div>
                          <div className={`text-xl font-bold uppercase ${themeStyles.subText} tracking-widest mt-1`}>Dmg</div>
                      </div>
                  </div>
              </div>

              <div className={`flex-1 flex flex-col justify-center`} style={{ gap: `${1.5 * visualConfig.itemSpacing}rem` }}>
                  {runnersUp.map((p, idx) => (
                      <div key={idx} className={`${themeStyles.cardBg} border-l-4 border-transparent flex items-center justify-between cursor-pointer hover:brightness-125 transition-all`} style={{ borderColor: idx === 0 ? themeStyles.accent : 'transparent', padding: `${1.5 * visualConfig.padding}rem`, marginBottom: `${0.5 * visualConfig.itemSpacing}rem` }} onClick={() => onElementClick?.('player', { playerName: p.playerName })}>
                          <div className="flex items-center gap-6">
                              <div className={`text-4xl font-black ${themeStyles.subText} w-12`} style={{ fontSize: `${2.25 * visualConfig.fontScale}rem` }}>#{idx + 2}</div>
                              <div>
                                  <div className={`text-4xl font-bold ${themeStyles.text} uppercase`} style={{ fontSize: `${2.25 * visualConfig.fontScale}rem` }}>{p.playerName}</div>
                                  <div className={`text-xl ${themeStyles.fontBody} ${themeStyles.subText}`} style={{ fontSize: `${1.25 * visualConfig.fontScale}rem` }}>{p.teamName}</div>
                              </div>
                          </div>
                          
                          <div className="flex items-center gap-12 text-right">
                              <div>
                                  <div className={`text-5xl font-black ${themeStyles.text}`} style={{ fontSize: `${3 * visualConfig.fontScale}rem` }}>{p.finishes}</div>
                                  <div className={`text-sm font-bold uppercase ${themeStyles.subText}`} style={{ fontSize: `${0.875 * visualConfig.fontScale}rem` }}>Kills</div>
                              </div>
                              <div className="w-32">
                                  <div className={`text-3xl font-bold ${themeStyles.text} opacity-70`} style={{ fontSize: `${1.875 * visualConfig.fontScale}rem` }}>{(p.damage).toLocaleString()}</div>
                                  <div className={`text-sm font-bold uppercase ${themeStyles.subText}`} style={{ fontSize: `${0.875 * visualConfig.fontScale}rem` }}>Damage</div>
                                  <div className={`h-2 ${theme === 'paper' ? 'bg-slate-200' : 'bg-black/50'} rounded-full mt-2 overflow-hidden`}>
                                      <div className="h-full" style={{ width: `${(p.damage / topDog.damage) * 100}%`, backgroundColor: themeStyles.accent }}></div>
                                  </div>
                              </div>
                          </div>
                      </div>
                  ))}
              </div>
          </div>
      );
  };

  const PlayerLeaderboardLayout = () => {
      // ... same implementation ...
      const allPlayers = data.flatMap(t => t.players.map(p => ({
              ...p,
              teamName: t.name,
              teamRank: t.rank
          }))).sort((a, b) => b.finishes - a.finishes || b.damage - a.damage);

      const startIdx = (page - 1) * rowsPerPage;
      const endIdx = startIdx + rowsPerPage;
      const displayPlayers = allPlayers.slice(startIdx, endIdx);

      return (
        <div className="relative z-10 flex-1">
            <table className="w-full text-left border-collapse">
            <thead>
                <tr className="border-b-2" style={{ borderColor: theme === 'paper' ? '#0f172a' : 'rgba(255,255,255,0.2)' }}>
                    <th className={`py-4 text-2xl font-black ${themeStyles.subText} uppercase tracking-widest text-center`} style={{ fontSize: `${1.5 * visualConfig.fontScale}rem` }}>Pos</th>
                    <th className={`py-4 text-2xl font-black ${themeStyles.subText} uppercase tracking-widest pl-4`} style={{ fontSize: `${1.5 * visualConfig.fontScale}rem` }}>Operator</th>
                    <th className={`py-4 text-2xl font-black ${themeStyles.subText} uppercase tracking-widest`} style={{ fontSize: `${1.5 * visualConfig.fontScale}rem` }}>Team</th>
                    {!isPortrait && <th className={`py-4 text-2xl font-black ${themeStyles.subText} uppercase tracking-widest text-center`} style={{ fontSize: `${1.5 * visualConfig.fontScale}rem` }}>Survival</th>}
                    <th className={`py-4 text-2xl font-black ${themeStyles.subText} uppercase tracking-widest text-center`} style={{ fontSize: `${1.5 * visualConfig.fontScale}rem` }}>Damage</th>
                    <th className={`py-4 text-3xl font-black ${themeStyles.text} uppercase tracking-widest text-right pr-4`} style={{ fontSize: `${1.875 * visualConfig.fontScale}rem` }}>Kills</th>
                </tr>
            </thead>
            <tbody>
                {displayPlayers.map((player, idx) => {
                    const absoluteRank = startIdx + idx + 1;
                    const rowBg = idx % 2 === 0 ? themeStyles.highlight : 'transparent';
                    
                    return (
                        <tr key={`${player.teamName}-${player.playerName}`} className={`${rowBg} border-l-4 border-transparent cursor-pointer hover:brightness-125 transition-all`} onClick={() => onElementClick?.('player', { playerName: player.playerName })}>
                            <td className="text-center" style={{ padding: `${1 * visualConfig.padding}rem` }}>
                                <span className={`font-mono text-2xl ${themeStyles.subText}`} style={{ fontSize: `${1.5 * visualConfig.fontScale}rem` }}>#{absoluteRank}</span>
                            </td>
                            <td className="pl-4" style={{ padding: `${1 * visualConfig.padding}rem` }}>
                                <div className={`text-3xl font-bold ${themeStyles.text}`} style={{ fontSize: `${1.875 * visualConfig.fontScale}rem` }}>{player.playerName}</div>
                                {player.carryClass === 'SYSTEM_COLLAPSE' && <span className="text-xs bg-red-600 text-white px-2 py-0.5 rounded">CARRY</span>}
                            </td>
                            <td style={{ padding: `${1 * visualConfig.padding}rem` }}>
                                <div className={`text-2xl font-mono ${themeStyles.subText} uppercase`} style={{ fontSize: `${1.5 * visualConfig.fontScale}rem` }}>{player.teamName}</div>
                            </td>
                            {!isPortrait && (
                                <td className="text-center" style={{ padding: `${1 * visualConfig.padding}rem` }}>
                                    <div className={`text-2xl font-mono ${themeStyles.subText}`} style={{ fontSize: `${1.5 * visualConfig.fontScale}rem` }}>{player.playTimeMinutes.toFixed(1)}m</div>
                                </td>
                            )}
                            <td className="text-center" style={{ padding: `${1 * visualConfig.padding}rem` }}>
                                <div className={`text-3xl font-mono ${themeStyles.text}`} style={{ fontSize: `${1.875 * visualConfig.fontScale}rem` }}>{player.damage}</div>
                            </td>
                            <td className="text-right pr-4" style={{ padding: `${1 * visualConfig.padding}rem` }}>
                                <span className={`text-5xl font-black ${themeStyles.text}`} style={{ ...accentText, fontSize: `${3 * visualConfig.fontScale}rem` }}>{player.finishes}</span>
                            </td>
                        </tr>
                    );
                })}
            </tbody>
            </table>
        </div>
      );
  };

  const WinnerLayout = () => {
    const team = data.find(t => t.name === config.focusTeamId) || data[0];
    if (!team) return null;

    return (
        <div className="flex-1 flex flex-col items-center justify-center relative cursor-pointer" onClick={() => onElementClick?.('team', { teamId: team.name })}>
            <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none">
                <Crown className={`${isPortrait ? 'w-[600px] h-[600px]' : 'w-[800px] h-[800px]'}`} style={accentText} />
            </div>
            
            <div className={`relative z-10 text-center ${isPortrait ? 'w-full' : 'w-3/4'} ${themeStyles.cardBg} rounded-lg backdrop-blur-sm shadow-2xl`} style={{ ...accentBorder, padding: `${(isPortrait ? 2 : 3) * visualConfig.padding}rem`, gap: `${(isPortrait ? 1 : 2) * visualConfig.spacing}rem`, display: 'flex', flexDirection: 'column' }}>
                <div className={`inline-block px-8 py-3 text-white text-3xl font-black uppercase tracking-widest rounded-sm mb-4 shadow-lg`} style={{ ...accentBg, fontSize: `${(isPortrait ? 1.5 : 1.875) * visualConfig.fontScale}rem` }}>
                    #1 Victory Royale
                </div>
                <h1 className={`font-black ${themeStyles.text} uppercase tracking-tighter mb-4 drop-shadow-xl leading-none`} style={{ fontSize: `${isPortrait ? 4.5 * visualConfig.headerScale : 8 * visualConfig.headerScale}rem` }}>{team.name}</h1>
                
                <div className={`flex ${isPortrait ? 'flex-col' : 'justify-center'} border-t border-b`} style={{ borderColor: theme === 'paper' ? '#cbd5e1' : 'rgba(255,255,255,0.1)', padding: `${(isPortrait ? 1 : 2) * visualConfig.padding}rem 0`, margin: `${(isPortrait ? 1 : 2) * visualConfig.spacing}rem 0`, gap: `${(isPortrait ? 2 : 4) * visualConfig.spacing}rem` }}>
                    <div className="text-center">
                        <div className="text-2xl font-mono uppercase tracking-widest mb-2" style={{ ...accentText, fontSize: `${(isPortrait ? 1.25 : 1.5) * visualConfig.fontScale}rem` }}>Total Points</div>
                        <div className={`text-8xl font-black ${themeStyles.text}`} style={{ fontSize: `${(isPortrait ? 4 : 6) * visualConfig.fontScale}rem` }}>{team.totalPoints}</div>
                    </div>
                    {!isPortrait && <div className={`w-px ${theme === 'paper' ? 'bg-slate-300' : 'bg-white/20'}`}></div>}
                    <div className="text-center">
                        <div className="text-2xl font-mono uppercase tracking-widest mb-2" style={{ ...accentText, fontSize: `${(isPortrait ? 1.25 : 1.5) * visualConfig.fontScale}rem` }}>Eliminations</div>
                        <div className={`text-8xl font-black ${themeStyles.text}`} style={{ fontSize: `${(isPortrait ? 4 : 6) * visualConfig.fontScale}rem` }}>{team.totalFinishes}</div>
                    </div>
                </div>
                
                <div className={`grid ${isPortrait ? 'grid-cols-2' : 'grid-cols-4'} mt-8`} style={{ gap: `${1.5 * visualConfig.itemSpacing}rem` }}>
                    {team.players.map(p => (
                        <div key={p.playerName} className={`${themeStyles.highlight} rounded-sm flex justify-between items-center border border-transparent hover:border-white/20 transition-colors`} style={{ padding: `${(isPortrait ? 0.5 : 1) * visualConfig.padding}rem` }}>
                            <div className={`text-2xl font-bold ${themeStyles.text}`} style={{ fontSize: `${(isPortrait ? 1.125 : 1.5) * visualConfig.fontScale}rem` }}>{p.playerName}</div>
                            <div className={`text-xl font-mono ${themeStyles.subText}`} style={{ fontSize: `${(isPortrait ? 1 : 1.25) * visualConfig.fontScale}rem` }}>{p.finishes} K</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
  };

  const FaceoffLayout = () => {
    const teamA = data.find(t => t.name === config.focusTeamId);
    const teamB = data.find(t => t.name === config.compareTeamId);
    
    if (!teamA || !teamB) return null;

    const starA = [...teamA.players].sort((a,b) => b.impactScore - a.impactScore)[0];
    const starB = [...teamB.players].sort((a,b) => b.impactScore - a.impactScore)[0];
    const winProbs = calculateHeadToHeadProbability(teamA, teamB);

    let styleBadge = "STANDARD BOUT";
    const totalKills = teamA.totalFinishes + teamB.totalFinishes;
    const totalMatches = teamA.matchesPlayed + teamB.matchesPlayed;
    const kpmCombined = totalMatches > 0 ? totalKills / totalMatches : 0;
    if (kpmCombined > 12) styleBadge = "TOTAL WAR";
    else if (teamA.avgSurvivalTime > 20 && teamB.avgSurvivalTime > 20) styleBadge = "TACTICAL STANDOFF";
    else if (Math.abs(teamA.aggressionIndex - teamB.aggressionIndex) > 40) styleBadge = "STYLE CLASH";

    const maxDmg = Math.max(...data.map(t => t.totalDamage)) || 1;
    const maxKills = Math.max(...data.map(t => t.totalFinishes)) || 1;
    const maxSurvival = Math.max(...data.map(t => t.avgSurvivalTime)) || 1;
    const maxPlacement = Math.max(...data.map(t => t.placementPoints)) || 1;
    
    const normalize = (val: number, max: number) => (max > 0 ? (val / max) * 100 : 0);
    const radarData = [
      { subject: 'DMG', A: normalize(teamA.totalDamage, maxDmg), B: normalize(teamB.totalDamage, maxDmg), fullMark: 100 },
      { subject: 'KILLS', A: normalize(teamA.totalFinishes, maxKills), B: normalize(teamB.totalFinishes, maxKills), fullMark: 100 },
      { subject: 'SURV', A: normalize(teamA.avgSurvivalTime, maxSurvival), B: normalize(teamB.avgSurvivalTime, maxSurvival), fullMark: 100 },
      { subject: 'PLACE', A: normalize(teamA.placementPoints, maxPlacement), B: normalize(teamB.placementPoints, maxPlacement), fullMark: 100 },
      { subject: 'AGG', A: Math.min(100, teamA.aggressionIndex), B: Math.min(100, teamB.aggressionIndex), fullMark: 100 },
    ];

    const StatButterfly = ({ label, valA, valB, unit = '', inverse = false }: any) => {
        const winA = inverse ? valA < valB : valA > valB;
        const colorA = winA ? themeStyles.accent : (theme === 'paper' ? '#94a3b8' : 'rgba(255,255,255,0.2)');
        const colorB = !winA && valA !== valB ? (theme === 'paper' ? '#3b82f6' : '#3b82f6') : (theme === 'paper' ? '#94a3b8' : 'rgba(255,255,255,0.2)');
        
        const max = Math.max(valA, valB, 1) * 1.2;
        const widthA = (valA / max) * 100;
        const widthB = (valB / max) * 100;

        return (
            <div className="flex items-center gap-4 mb-4">
                <div className="flex-1 flex justify-end items-center gap-3">
                    <span className={`text-2xl font-black ${winA ? themeStyles.text : themeStyles.subText}`}>{valA.toFixed(unit ? 1 : 0)}{unit}</span>
                    <div className={`h-4 flex-1 flex justify-end ${theme === 'paper' ? 'bg-slate-200' : 'bg-black/50'} rounded-sm overflow-hidden max-w-[200px]`}>
                        <div className="h-full" style={{ width: `${widthA}%`, backgroundColor: colorA }}></div>
                    </div>
                </div>
                <div className={`w-32 text-center text-xl font-bold uppercase tracking-widest ${themeStyles.subText}`}>{label}</div>
                <div className="flex-1 flex justify-start items-center gap-3">
                    <div className={`h-4 flex-1 ${theme === 'paper' ? 'bg-slate-200' : 'bg-black/50'} rounded-sm overflow-hidden max-w-[200px]`}>
                        <div className="h-full" style={{ width: `${widthB}%`, backgroundColor: colorB }}></div>
                    </div>
                    <span className={`text-2xl font-black ${!winA && valA !== valB ? 'text-blue-500' : themeStyles.subText}`}>{valB.toFixed(unit ? 1 : 0)}{unit}</span>
                </div>
            </div>
        );
    };

    return (
        <div className="flex-1 flex flex-col justify-between">
             <div className={`grid ${isPortrait ? 'grid-cols-1 gap-4' : 'grid-cols-5 gap-8'} items-end mb-8 relative`}>
                 <div className={`${isPortrait ? 'text-center' : 'col-span-2 text-left'}`}>
                     <div className={`flex items-center gap-4 mb-2 ${isPortrait ? 'justify-center' : ''}`}>
                         <span className={`text-3xl font-black px-4 py-1 rounded-sm text-white`} style={{ ...accentBg, fontSize: `${1.875 * visualConfig.fontScale}rem` }}>#{teamA.rank}</span>
                         <span className={`text-xl font-mono uppercase ${themeStyles.subText}`} style={{ fontSize: `${1.25 * visualConfig.fontScale}rem` }}>{teamA.flags[0] || 'CONTENDER'}</span>
                     </div>
                     <h1 className={`font-black ${themeStyles.text} uppercase leading-none truncate`} style={{ fontSize: `${(isPortrait ? 3.5 : 4.5) * visualConfig.headerScale}rem` }}>{teamA.name}</h1>
                 </div>
                 
                 <div className={`${isPortrait ? 'flex flex-row items-center justify-center gap-4' : 'col-span-1 flex flex-col items-center justify-center pb-4'}`}>
                     <div className={`text-6xl font-black italic ${themeStyles.subText} opacity-50`} style={{ fontSize: `${(isPortrait ? 3 : 3.75) * visualConfig.fontScale}rem` }}>VS</div>
                     <div className={`text-xl font-bold uppercase tracking-widest px-4 py-1 border rounded-sm ${isPortrait ? '' : 'mt-2'}`} style={{ color: themeStyles.accent, borderColor: themeStyles.accent, fontSize: `${1.25 * visualConfig.fontScale}rem` }}>{styleBadge}</div>
                 </div>

                 <div className={`${isPortrait ? 'text-center' : 'col-span-2 text-right'}`}>
                     <div className={`flex items-center gap-4 mb-2 ${isPortrait ? 'justify-center' : 'justify-end'}`}>
                         <span className={`text-xl font-mono uppercase ${themeStyles.subText}`} style={{ fontSize: `${1.25 * visualConfig.fontScale}rem` }}>{teamB.flags[0] || 'CONTENDER'}</span>
                         <span className={`text-3xl font-black px-4 py-1 rounded-sm bg-blue-600 text-white`} style={{ fontSize: `${1.875 * visualConfig.fontScale}rem` }}>#{teamB.rank}</span>
                     </div>
                     <h1 className={`font-black ${themeStyles.text} uppercase leading-none truncate`} style={{ fontSize: `${(isPortrait ? 3.5 : 4.5) * visualConfig.headerScale}rem` }}>{teamB.name}</h1>
                 </div>
             </div>

             <div className="mb-8">
                 <div className={`flex justify-between text-xl font-bold uppercase mb-2 ${themeStyles.subText}`}>
                     <span>Win Probability</span>
                     <span>Forecast</span>
                 </div>
                 <div className={`h-8 w-full ${theme === 'paper' ? 'bg-slate-200' : 'bg-black'} rounded-sm relative overflow-hidden flex border border-white/10`}>
                     <div className={`h-full flex items-center justify-start pl-4 text-sm font-bold text-black ${isExporting ? '' : 'transition-all duration-1000'}`} style={{ width: `${winProbs.probA}%`, backgroundColor: themeStyles.accent }}>
                         {winProbs.probA.toFixed(0)}%
                     </div>
                     <div className={`h-full bg-blue-600 flex items-center justify-end pr-4 text-sm font-bold text-white ${isExporting ? '' : 'transition-all duration-1000'}`} style={{ width: `${winProbs.probB}%` }}>
                         {winProbs.probB.toFixed(0)}%
                     </div>
                     <div className={`absolute top-0 bottom-0 left-1/2 w-1 z-10 -translate-x-1/2 ${theme === 'paper' ? 'bg-white' : 'bg-black'}`}></div>
                 </div>
             </div>

             <div className={`flex-1 grid ${isPortrait ? 'grid-cols-1' : 'grid-cols-2'} gap-8`}>
                 <div className={`${themeStyles.cardBg} rounded-sm border ${themeStyles.border} flex flex-col justify-center`} style={{ padding: `${(isPortrait ? 1 : 2) * visualConfig.padding}rem`, gap: `${(isPortrait ? 0.5 : 1) * visualConfig.itemSpacing}rem` }}>
                     <StatButterfly label="Avg Pts" valA={teamA.totalPoints / Math.max(1, teamA.matchesPlayed)} valB={teamB.totalPoints / Math.max(1, teamB.matchesPlayed)} />
                     <StatButterfly label="Avg Kills" valA={teamA.totalFinishes / Math.max(1, teamA.matchesPlayed)} valB={teamB.totalFinishes / Math.max(1, teamB.matchesPlayed)} />
                     <StatButterfly label="Avg Dmg" valA={teamA.totalDamage / Math.max(1, teamA.matchesPlayed)} valB={teamB.totalDamage / Math.max(1, teamB.matchesPlayed)} />
                     <StatButterfly label="Survival" valA={teamA.avgSurvivalTime} valB={teamB.avgSurvivalTime} unit="m" />
                     <StatButterfly label="Wins" valA={teamA.history.filter(h=>h.rank===1).length} valB={teamB.history.filter(h=>h.rank===1).length} />
                 </div>
                 <div className={`${themeStyles.cardBg} ${isPortrait ? 'p-2' : 'p-4'} rounded-sm border ${themeStyles.border} flex flex-col items-center justify-center min-h-[300px]`}>
                      <div className="w-full h-full relative">
                          <ResponsiveContainer width="100%" height="100%">
                            <RadarChart cx="50%" cy="50%" outerRadius={isPortrait ? "60%" : "70%"} data={radarData}>
                                <PolarGrid stroke={theme === 'paper' ? '#e2e8f0' : '#333'} />
                                <PolarAngleAxis dataKey="subject" tick={{ fill: theme === 'paper' ? '#64748b' : '#94a3b8', fontSize: 12, fontWeight: 'bold' }} />
                                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                                <Radar name={teamA.name} dataKey="A" stroke={themeStyles.accent} strokeWidth={3} fill={themeStyles.accent} fillOpacity={0.3} isAnimationActive={!isExporting} />
                                <Radar name={teamB.name} dataKey="B" stroke="#3b82f6" strokeWidth={3} fill="#3b82f6" fillOpacity={0.3} isAnimationActive={!isExporting} />
                            </RadarChart>
                          </ResponsiveContainer>
                      </div>
                 </div>
             </div>

             <div className={`mt-8 grid ${isPortrait ? 'grid-cols-1 gap-4' : 'grid-cols-2 gap-12'}`}>
                 <div className={`${themeStyles.highlight} p-6 rounded-sm flex items-center justify-between border-l-8`} style={accentBorder}>
                     <div>
                         <div className={`text-sm uppercase font-bold tracking-widest ${themeStyles.subText}`}>Key Operator</div>
                         <div className={`text-4xl font-black ${themeStyles.text}`}>{starA.playerName}</div>
                         <div className="font-mono text-2xl" style={accentText}>{starA.impactScore.toFixed(0)} RTG</div>
                     </div>
                     <div className="text-right">
                         <div className={`text-5xl font-black ${themeStyles.text}`}>{starA.finishes}</div>
                         <div className={`text-sm font-bold uppercase ${themeStyles.subText}`}>Kills</div>
                     </div>
                 </div>
                 
                 <div className={`${themeStyles.highlight} p-6 rounded-sm flex items-center justify-between border-r-8 border-blue-600 text-right`}>
                     <div className="order-2">
                         <div className={`text-sm uppercase font-bold tracking-widest ${themeStyles.subText}`}>Key Operator</div>
                         <div className={`text-4xl font-black ${themeStyles.text}`}>{starB.playerName}</div>
                         <div className="font-mono text-2xl text-blue-500">{starB.impactScore.toFixed(0)} RTG</div>
                     </div>
                     <div className="text-left order-1">
                         <div className={`text-5xl font-black ${themeStyles.text}`}>{starB.finishes}</div>
                         <div className={`text-sm font-bold uppercase ${themeStyles.subText}`}>Kills</div>
                     </div>
                 </div>
             </div>
        </div>
    );
  };

  const MVPLayout = () => {
    const focusPlayer = data.flatMap(t => t.players).find(p => p.playerName === config.focusPlayerName);
    const team = data.find(t => t.name === focusPlayer?.teamName);

    if (!focusPlayer || !team) return null;

    return (
        <div className={`flex-1 flex ${isPortrait ? 'flex-col' : 'flex-row'} gap-16 items-center`}>
             <div className={`${isPortrait ? 'w-full h-1/3' : 'w-1/3 h-full'} ${theme === 'paper' ? 'bg-slate-800' : 'bg-gradient-to-b from-gray-900 to-black'} p-8 border-l-8 relative flex flex-col justify-center items-center`} style={{ borderColor: themeStyles.accent }}>
                 <div className={`w-48 h-48 ${theme === 'paper' ? 'bg-white' : 'bg-white/10'} rounded-full flex items-center justify-center mb-8 border-4`} style={{ borderColor: themeStyles.accent }}>
                    <Skull className="w-24 h-24" style={accentText} />
                 </div>
                 <h1 className="text-6xl font-black text-white uppercase text-center leading-none mb-4">{focusPlayer.playerName}</h1>
                 <div className="text-2xl font-mono font-bold uppercase tracking-widest" style={accentText}>{team.name}</div>
             </div>

             <div className="flex-1 grid grid-cols-2 gap-8 w-full">
                 <div className={`${themeStyles.cardBg} border-l-4 border-white`} style={{ padding: `${2 * visualConfig.padding}rem` }}>
                    <div className={`text-2xl ${themeStyles.subText} font-mono uppercase`} style={{ fontSize: `${1.5 * visualConfig.fontScale}rem` }}>Kills</div>
                    <div className={`text-8xl font-black ${themeStyles.text}`} style={{ fontSize: `${6 * visualConfig.fontScale}rem` }}>{focusPlayer.finishes}</div>
                 </div>
                 <div className={`${themeStyles.cardBg} border-l-4`} style={{ ...accentBorder, padding: `${2 * visualConfig.padding}rem` }}>
                    <div className={`text-2xl ${themeStyles.subText} font-mono uppercase`} style={{ fontSize: `${1.5 * visualConfig.fontScale}rem` }}>Damage</div>
                    <div className={`text-8xl font-black ${themeStyles.text}`} style={{ fontSize: `${6 * visualConfig.fontScale}rem` }}>{(focusPlayer.damage/1000).toFixed(1)}k</div>
                 </div>
                 <div className={`${themeStyles.cardBg} border-l-4 border-white`} style={{ padding: `${2 * visualConfig.padding}rem` }}>
                    <div className={`text-2xl ${themeStyles.subText} font-mono uppercase`} style={{ fontSize: `${1.5 * visualConfig.fontScale}rem` }}>KPM</div>
                    <div className={`text-8xl font-black ${themeStyles.text}`} style={{ fontSize: `${6 * visualConfig.fontScale}rem` }}>{focusPlayer.kpm.toFixed(2)}</div>
                 </div>
                 <div className={`${themeStyles.cardBg} p-8 border-l-4`} style={accentBorder}>
                    <div className={`text-2xl ${themeStyles.subText} font-mono uppercase`}>Impact</div>
                    <div className={`text-8xl font-black ${themeStyles.text}`}>{focusPlayer.impactScore.toFixed(0)}</div>
                 </div>
             </div>
        </div>
    );
  };

  const HallOfFameLayout = () => {
    // Calculated inline to avoid hook usage inside conditional renders
    const allPlayers = data.flatMap(t => t.players.map(p => ({ ...p, teamName: t.name })));
    const awards = [
        { title: "The Warlord", val: "Highest Kill Count", p: [...allPlayers].sort((a,b) => b.finishes - a.finishes)[0], icon: <Skull className="w-12 h-12" />, color: '#ef4444' },
        { title: "The Heavy", val: "Max Damage", p: [...allPlayers].sort((a,b) => b.damage - a.damage)[0], icon: <Sword className="w-12 h-12" />, color: theme === 'paper' ? '#0f172a' : '#FFFFFF' },
        { title: "The Survivor", val: "Best Survival", p: [...allPlayers].sort((a,b) => b.playTimeMinutes - a.playTimeMinutes)[0], icon: <HeartPulse className="w-12 h-12" />, color: '#10b981' },
        { title: "The Backpack", val: "Most Impact", p: [...allPlayers].sort((a,b) => b.damageShare - a.damageShare)[0], icon: <Zap className="w-12 h-12" />, color: '#eab308' }
    ];

    return (
        <div className={`flex-1 grid ${isPortrait ? 'grid-cols-1' : 'grid-cols-2'} items-center`} style={{ gap: `${2 * visualConfig.itemSpacing}rem` }}>
            {awards.map((a, idx) => a.p && (
                <div key={idx} className={`${themeStyles.cardBg} border ${themeStyles.border} rounded-sm flex items-center gap-6 relative overflow-hidden group`} style={{ padding: `${2 * visualConfig.padding}rem` }}>
                    <div className="absolute right-0 top-0 p-6 opacity-10 scale-150" style={{color: a.color}}>{a.icon}</div>
                    <div className="w-20 h-20 rounded-full flex items-center justify-center border-2" style={{borderColor: a.color, color: a.color, backgroundColor: theme === 'paper' ? 'white' : 'black'}}>
                        {a.icon}
                    </div>
                    <div>
                        <div className="text-xl font-mono uppercase tracking-widest mb-1" style={{color: a.color, fontSize: `${1.25 * visualConfig.fontScale}rem` }}>{a.title}</div>
                        <div className={`text-4xl font-black ${themeStyles.text} uppercase`} style={{ fontSize: `${2.25 * visualConfig.fontScale}rem` }}>{a.p.playerName}</div>
                        <div className={`text-lg font-mono ${themeStyles.subText}`} style={{ fontSize: `${1.125 * visualConfig.fontScale}rem` }}>{a.p.teamName}</div>
                    </div>
                </div>
            ))}
        </div>
    );
  };

  const TeamGridLayout = () => {
    // We need 16 teams for a 2x8 grid. 
    const teamsPerPage = 16;
    const startIdx = (page - 1) * teamsPerPage;
    const displayTeams = data.slice(startIdx, startIdx + teamsPerPage);

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60).toString().padStart(2, '0');
        const s = (seconds % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    // Auto-generate group name if not provided
    const defaultSubtitle = `Group ${String.fromCharCode(64 + page)}`; // Page 1 -> Group A, Page 2 -> Group B

    return (
        <div className="relative w-full h-full flex flex-col items-center z-10 overflow-hidden" style={{ padding: `${2 * visualConfig.padding}rem` }}>
            {/* Top Ribbon (Diagonal Banner) - Decorative, keep absolute but move out of way */}
            <div className="absolute top-0 left-0 -translate-x-1/3 -translate-y-1/2 w-[600px] h-20 rotate-[-15deg] flex items-center justify-center shadow-lg z-0 opacity-80" style={accentBg}>
                <span className="text-black font-black italic text-2xl tracking-widest uppercase">Break Boundaries</span>
            </div>

            {/* Side Branding (Top Right Logo) */}
            <div className="absolute top-8 right-8 z-20">
                {branding.logoUrl ? (
                    <img src={branding.logoUrl} alt="Logo" className="w-32 h-32 object-contain" />
                ) : (
                    <div className="w-32 h-32 border-4 flex items-center justify-center rounded-lg bg-black/50" style={accentBorder}>
                        <Shield className="w-16 h-16" style={accentText} />
                    </div>
                )}
            </div>

            {/* Header Section - Now in flow for better spacing */}
            <div className="w-full flex flex-col items-center mb-12 mt-8 z-20 relative">
                <h1 className={`font-black uppercase tracking-wider mb-2 text-center ${themeStyles.text} drop-shadow-2xl`} style={{ fontSize: `${4.5 * visualConfig.headerScale}rem`, lineHeight: 1 }}>
                    {config.title || 'Playing Teams'}
                </h1>
                <div className="px-10 py-2 font-black uppercase tracking-[0.2em] text-black shadow-xl skew-x-[-10deg]" style={{ ...accentBg, fontSize: `${1.875 * visualConfig.fontScale}rem` }}>
                    <div className="skew-x-[10deg]">{config.subtitle || defaultSubtitle}</div>
                </div>
            </div>

            {/* Teams Grid Section - Flex-1 to take available space */}
            <div className="flex-1 w-full flex items-center justify-center px-4 z-10">
                <div className={`grid ${isPortrait ? 'grid-cols-4' : 'grid-cols-8'} w-full`} style={{ gap: `${1.5 * visualConfig.itemSpacing}rem` }}>
                    {displayTeams.map((team, idx) => (
                        <div key={idx} className="flex flex-col items-center w-full animate-in fade-in zoom-in duration-500" style={{ animationDelay: `${idx * 50}ms` }}>
                            {/* Logo Container */}
                            <div className="w-full aspect-square bg-white rounded-tr-[2rem] flex items-center justify-center shadow-2xl relative overflow-hidden border-b-4 border-gray-200" style={{ padding: `${1.2 * visualConfig.padding}rem` }}>
                                {team.logoUrl ? (
                                    <img src={team.logoUrl} alt={team.name} className="w-full h-full object-contain" />
                                ) : (
                                    <div className="w-full h-full border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 font-bold text-lg text-center">
                                        {team.name} Logo
                                    </div>
                                )}
                                {/* Rank/Index Badge */}
                                <div className="absolute top-0 left-0 bg-black/10 text-black/20 font-black text-4xl p-2 select-none">
                                    {String(startIdx + idx + 1).padStart(2, '0')}
                                </div>
                            </div>
                            {/* Team Name Bar */}
                            <div className="w-full text-white text-center py-3 mt-2 font-black uppercase tracking-wider shadow-lg truncate px-2 border-t-2 border-white/20" style={{ ...accentBg, fontSize: `${1.25 * visualConfig.fontScale}rem` }}>
                                {team.name}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Footer Section / Countdown */}
            <div className="w-full flex justify-between items-end mt-8 z-20">
                <div className="flex flex-col">
                    <span className={`text-xs font-mono uppercase tracking-[0.4em] opacity-50 ${themeStyles.subText}`}>Tournament Intelligence System</span>
                    <span className={`text-[10px] font-mono opacity-30 ${themeStyles.subText}`}>SECURE_LINK_ESTABLISHED // {new Date().toLocaleDateString()}</span>
                </div>
                
                <div className="flex flex-col items-end">
                    <span className="font-bold uppercase tracking-widest text-xl mb-[-5px]" style={accentText}>Starting In</span>
                    <span className={`font-black tracking-tighter drop-shadow-lg ${themeStyles.text}`} style={{ fontSize: `${6 * visualConfig.fontScale}rem`, lineHeight: 1 }}>
                        {formatTime(timerSeconds)}
                    </span>
                </div>
            </div>
        </div>
    );
  };

  return (
    <div 
        id="export-container" 
        className={`${visualConfig.templateMode ? 'bg-transparent' : themeStyles.bg} ${themeStyles.text} font-sans relative flex flex-col overflow-y-auto overflow-x-hidden no-scrollbar ${isExporting ? 'disable-blurs' : ''}`}
        style={{ 
            ...containerDimensions, 
            backgroundColor: (visualConfig.templateMode && branding.customBackground) ? 'transparent' : themeBgHex, 
            backgroundImage: branding.customBackground ? `url(${branding.customBackground})` : undefined,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            animation: isExporting ? 'none' : undefined
        }}
    >
        {/* Background Texture */}
        {!visualConfig.templateMode && (
            <div className={`absolute inset-0 z-0 opacity-20 ${themeStyles.gradient} pointer-events-none`}></div>
        )}
        
        {/* Cyber Glitch Global Background - Removed */}

        {mode === 'sdrr' ? (
            <div className="w-full h-full relative z-10">
                <SDRRGraphic 
                    tournamentName={branding.tournamentName || "TOURNAMENT NAME"} 
                    matchIdentifier={config.subtitle || "MATCH 7"} 
                    teamName={config.focusTeamId || "TEAM NAME"} 
                    players={data.find(t => t.name === config.focusTeamId)?.players.map(p => ({
                        name: p.playerName,
                        kills: p.finishes,
                        survivalTime: `${Math.floor(p.playTimeMinutes)}:${Math.floor((p.playTimeMinutes % 1) * 60).toString().padStart(2, '0')}`
                    })) || [
                        { name: 'Player 1', kills: 5, survivalTime: '25:00' },
                        { name: 'Player 2', kills: 3, survivalTime: '22:00' },
                        { name: 'Player 3', kills: 2, survivalTime: '20:00' },
                        { name: 'Player 4', kills: 4, survivalTime: '24:00' },
                    ]} 
                    isPortrait={isPortrait}
                    visualConfig={visualConfig}
                    layout={layout}
                />
            </div>
        ) : mode === 'mvp' ? (
            <div className="w-full h-full relative z-10">
                <TournamentMVP 
                  data={data} 
                  branding={branding} 
                  isPortrait={isPortrait} 
                  focusPlayerName={config.focusPlayerName}
                />
            </div>
        ) : mode === 'team_grid' ? (
            <TeamGridLayout />
        ) : mode === 'player_comparison' ? (
            <PlayerComparisonLayout />
        ) : (
            <LayoutWrapper>
                {/* Call layout functions directly to ensure they are part of the same component tree (prevents unmount/remount) */}
                {mode === 'standings' && StandingsLayout()}
                {mode === 'player_leaderboard' && PlayerLeaderboardLayout()}
                {mode === 'top_fraggers' && TopFraggersLayout()}
                {mode === 'winner' && WinnerLayout()}
                {mode === 'faceoff' && FaceoffLayout()}
                {mode === 'hall_of_fame' && HallOfFameLayout()}
                {mode === 'team_profile' && TeamProfileLayout()}
                {mode === 'player_profile' && PlayerProfileLayout()}
            </LayoutWrapper>
        )}

        {/* Pro Grain Overlay (Procedural noise texture) */}
    </div>
  );
};

export default ExportRenderer;
