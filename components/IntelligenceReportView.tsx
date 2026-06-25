
import React from 'react';
import { TeamData, BrandingConfig } from '../types';
import { Shield, ArrowUpRight, ArrowDownRight, Minus, Trophy, Activity, Crown, TrendingUp } from 'lucide-react';

interface IntelligenceReportViewProps {
    data: TeamData[];
    branding: BrandingConfig;
    title?: string;
    subtitle?: string;
    page?: number;
    totalPages?: number;
    rowsPerPage?: number;
    isPortrait?: boolean;
    onElementClick?: (element: string, data?: any) => void;
    visualConfig?: any;
}

export const IntelligenceReportView: React.FC<IntelligenceReportViewProps> = ({
    data,
    branding,
    title = "OVERALL STANDINGS",
    subtitle = "GRAND FINALS | END OF DAY 3",
    page = 1,
    totalPages = 3,
    rowsPerPage = 10,
    isPortrait = false,
    onElementClick,
    visualConfig = {}
}) => {
    // Sort data for standings by team rank ascending (e.g. 1 to 16)
    const sortedData = [...data].sort((a, b) => a.rank - b.rank);
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

    return (
        <div className={`w-full h-full ${isTemplate ? 'bg-transparent' : 'bg-[#050505]'} p-4 lg:p-8 flex flex-col relative overflow-hidden font-sans`}>
            {/* Ambient Background Elements */}
            {!isTemplate && (
                <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-20">
                    <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-cyan-500/10 blur-[120px] rounded-full"></div>
                    <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-500/10 blur-[120px] rounded-full"></div>
                    <div className="absolute inset-0 bg-[radial-gradient(#ffffff05_1px,transparent_1px)] [background-size:20px_20px]"></div>
                </div>
            )}

            <div 
                onClick={() => onElementClick?.('header')}
                className={`relative z-10 flex items-center justify-between ${isPortrait ? 'mb-6' : 'mb-8'} cursor-pointer group`}
            >
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <div className="absolute inset-0 bg-cyan-500 blur-md opacity-20 group-hover:opacity-40 transition-opacity"></div>
                        <div className={`${isPortrait ? 'w-10 h-10' : 'w-14 h-14'} bg-black border border-white/20 flex items-center justify-center rounded-sm relative z-10`}>
                            <Shield className={`${isPortrait ? 'w-5 h-5' : 'w-8 h-8'} text-cyan-400`} />
                        </div>
                    </div>
                    <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                             <h1 className={`${isPortrait ? 'text-xl' : 'text-4xl'} font-black tracking-tighter text-white uppercase leading-none`}>
                                FRAGLAB<span className="text-cyan-500">PRO</span>
                            </h1>
                            <div className="h-4 w-[2px] bg-white/20 hidden sm:block"></div>
                            <span className="hidden sm:inline text-[10px] font-mono text-white/40 tracking-widest uppercase italic">Advanced Data Node</span>
                        </div>
                        <span className="text-[8px] lg:text-[10px] font-mono tracking-[0.6em] text-white/30 uppercase mt-1.5 flex items-center gap-2">
                            <span className="w-1 h-1 bg-cyan-500 rounded-full animate-pulse"></span>
                            INTELLIGENCE_STREAM_INITIATED
                        </span>
                    </div>
                </div>

                <div className="hidden lg:flex items-center gap-6">
                    <div className="flex flex-col items-end">
                        <span className="text-[9px] font-mono text-white/20 uppercase tracking-widest mb-1">Session ID</span>
                        <span className="text-xs font-bold text-white/60 font-mono tracking-tighter">FLX-2026-BETA-77</span>
                    </div>
                    <div className="h-8 w-px bg-white/10"></div>
                    <div className="flex flex-col items-end">
                        <span className="text-[9px] font-mono text-white/20 uppercase tracking-widest mb-1">Server Latency</span>
                        <span className="text-xs font-bold text-emerald-500 font-mono tracking-tighter">14ms</span>
                    </div>
                </div>
            </div>

            {/* Main Stage (Modern Web Layout) - Shifting from paper to digital dashboard aesthetic */}
            <div className={`flex-1 flex ${isPortrait ? 'flex-col' : 'gap-6'} relative overflow-hidden font-sans`}>
                
                {/* Left Column (Main Feed) */}
                <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
                    
                    {/* Page Header / Title Area */}
                    <div className="mb-4 flex items-end justify-between border-b border-white/5 pb-3">
                        <div>
                            <span className="text-[9px] font-mono tracking-[0.4em] text-cyan-400 uppercase mb-1.5 block opacity-60">System Context // Standings_Analytics_v4</span>
                            <h2 className={`${isPortrait ? 'text-3xl' : 'text-5xl'} font-black text-white italic tracking-tighter leading-none`}>
                                {title}
                            </h2>
                        </div>
                        <div className="text-right hidden sm:block">
                            <span className="text-[9px] font-mono text-white/20 block mb-1 uppercase tracking-widest leading-none">Global Sink Status</span>
                            <div className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-sm">
                                <Activity className="w-2.5 h-2.5 text-emerald-500" />
                                <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-tighter">Live Connection</span>
                            </div>
                        </div>
                    </div>

                    {/* Top 3 Hero Cards (Podium) - Editorial "Web Style" Feature */}
                    {page === 1 && (
                        <div className={`grid ${isPortrait ? 'grid-cols-1' : 'grid-cols-3'} gap-3 mb-4`}>
                            {sortedData.slice(0, 3).map((team, idx) => {
                                const isFirst = team.rank === 1;
                                const accent = isFirst ? 'from-amber-600/30 to-black/40 border-amber-500/50 shadow-[0_0_20px_rgba(234,179,8,0.15)]' : 
                                              team.rank === 2 ? 'from-cyan-600/30 to-black/40 border-cyan-500/50 shadow-[0_0_20px_rgba(6,182,212,0.1)]' :
                                              'from-orange-600/30 to-black/40 border-orange-500/50 shadow-[0_0_20px_rgba(249,115,22,0.1)]';
                                
                                return (
                                    <div 
                                        key={team.name}
                                        onClick={() => onElementClick?.('team', { teamId: team.name })}
                                        className={`relative group cursor-pointer bg-gradient-to-br ${accent} border p-4 rounded-md overflow-hidden transition-all hover:scale-[1.01] hover:brightness-110 active:scale-[0.99]`}
                                    >
                                        <div className="absolute -right-6 -bottom-6 opacity-5 group-hover:opacity-10 transition-opacity">
                                            {isFirst ? <Crown className="w-32 h-32 text-amber-500" /> : <Shield className="w-32 h-32 text-white" />}
                                        </div>
                                        
                                        <div className="flex justify-between items-start relative z-10 mb-3">
                                            <div className={`w-10 h-10 flex items-center justify-center rounded-sm font-black text-xl shadow-lg transform -rotate-3 group-hover:rotate-0 transition-transform ${isFirst ? 'bg-amber-500 text-black' : 'bg-white/10 text-white'}`}>
                                                {team.rank}
                                            </div>
                                            <div className="text-right">
                                                <span className="text-[9px] font-mono text-white/40 uppercase tracking-widest block leading-none mb-0.5">Points</span>
                                                <span className="text-3xl font-black text-white italic tracking-tighter leading-none">{team.totalPoints}</span>
                                            </div>
                                        </div>
                                        
                                        <div className="relative z-10">
                                            <h3 className="text-xl font-black text-white uppercase italic tracking-tighter mb-1 truncate drop-shadow-sm">{team.name}</h3>
                                            <div className="flex items-center gap-2">
                                                <div className="flex items-center gap-1 text-[8px] font-bold text-white/70 bg-black/40 px-1.5 py-0.5 rounded border border-white/10">
                                                    <Trophy className={`w-2.5 h-2.5 ${isFirst ? 'text-amber-500' : 'text-white/40'}`} />
                                                    <span>{team.history.filter(h => h.rank === 1).length} WINS</span>
                                                </div>
                                                <div className="flex items-center gap-1 text-[8px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                                                    <TrendingUp className="w-2.5 h-2.5" />
                                                    <span>ELITE</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Standard List (Modern Web Feed / Stream) */}
                    <div className="flex-1 flex flex-col gap-1.5 overflow-y-auto custom-scrollbar pr-1 pb-4">
                        {(() => {
                            const teamsPerPage = rowsPerPage;
                            const startIndex = (page - 1) * teamsPerPage;
                            const displayData = (page === 1) ? sortedData.slice(3, startIndex + teamsPerPage) : sortedData.slice(startIndex, startIndex + teamsPerPage);
                            
                            return displayData.map((team, index) => {
                                const overallIndex = (page === 1) ? index + 3 : startIndex + index;
                                const isRising = team.trend === 'RISING';
                                
                                return (
                                    <div 
                                        key={team.name}
                                        onClick={() => onElementClick?.('team', { teamId: team.name })}
                                        className={tMode("group transition-all hover:bg-white/[0.08] bg-white/[0.03] border border-white/5 p-2 px-3 rounded flex items-center justify-between cursor-pointer")}
                                    >
                                        <div className="flex items-center gap-4 flex-1 min-w-0">
                                            <div className="w-8 h-8 flex items-center justify-center font-black text-white/20 border border-white/5 rounded-sm group-hover:bg-white group-hover:text-black group-hover:border-white transition-all transform group-hover:scale-110">
                                                {overallIndex + 1}
                                            </div>
                                            <div className="flex flex-col min-w-0">
                                                <h4 className="text-lg font-bold text-white uppercase italic tracking-tighter truncate leading-none group-hover:translate-x-1 transition-transform">{team.name}</h4>
                                                <div className="flex items-center gap-2 mt-1">
                                                    {isRising ? (
                                                        <span className="flex items-center gap-1 text-[8px] font-bold text-emerald-400 uppercase tracking-widest bg-emerald-500/5 px-1 py-0.5 rounded">
                                                            <ArrowUpRight className="w-2 h-2" /> Momentum
                                                        </span>
                                                    ) : team.trend === 'FALLING' ? (
                                                        <span className="flex items-center gap-1 text-[8px] font-bold text-rose-400 uppercase tracking-widest bg-rose-500/5 px-1 py-0.5 rounded">
                                                            <ArrowDownRight className="w-2 h-2" /> Performance Risk
                                                        </span>
                                                    ) : (
                                                        <span className="text-[8px] font-bold text-white/20 uppercase tracking-widest">Steady Execution</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-8 text-right">
                                            {!isPortrait && (
                                                <>
                                                    <div className="flex flex-col min-w-[60px]">
                                                        <span className="text-[7px] font-mono text-white/20 uppercase tracking-widest leading-none mb-0.5">MP</span>
                                                        <span className="text-sm font-bold text-white/60">{team.matchesPlayed}</span>
                                                    </div>
                                                    <div className="flex flex-col min-w-[60px]">
                                                        <span className="text-[7px] font-mono text-white/20 uppercase tracking-widest leading-none mb-0.5">Kills</span>
                                                        <span className="text-sm font-bold text-white/60">{team.killPoints}</span>
                                                    </div>
                                                    <div className="flex flex-col min-w-[60px]">
                                                        <span className="text-[7px] font-mono text-white/20 uppercase tracking-widest leading-none mb-0.5">Rank Pts</span>
                                                        <span className="text-sm font-bold text-white/50">{team.placementPoints}</span>
                                                    </div>
                                                </>
                                            )}
                                            <div className="flex flex-col items-end min-w-[70px]">
                                                <span className="text-[7px] font-mono text-cyan-400/60 uppercase tracking-[0.3em] leading-none mb-0.5">Aggregate</span>
                                                <span className="text-2xl font-black text-white italic group-hover:text-cyan-400 transition-colors leading-none">{team.totalPoints}</span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            });
                        })()}
                    </div>
                </div>

                {/* Right Column (Advanced Analytics Sidebar) - Dashboard Style */}
                {!isPortrait && (
                    <div className="w-72 flex flex-col gap-4">
                        {/* Summary Narrative Card */}
                        <div className={tMode("bg-white/5 border border-white/10 rounded p-4")}>
                            <h3 className="text-[9px] font-bold text-white/40 uppercase tracking-[0.4em] mb-3 flex items-center gap-2">
                                <Activity className="w-3 h-3 text-cyan-400" /> Analyst Stream
                            </h3>
                            <p className="text-[11px] text-white/60 leading-relaxed mb-4 italic">
                                Tactical oversight identifies a <span className="text-white font-bold">14.2% shift</span> in mid-table dynamics. Roster consistency remains the primary differentiator for Top 3 sustainment.
                            </p>
                            <div className="space-y-4">
                                <div className="p-2.5 bg-black/40 rounded border border-white/5">
                                    <div className="flex justify-between text-[8px] uppercase text-white/30 mb-1.5 font-mono">
                                        <span>Data Flow Integrity</span>
                                        <span className="text-emerald-500">OPTIMAL // 99.8</span>
                                    </div>
                                    <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                                        <div className="h-full bg-emerald-500 w-[99.8%] animate-pulse"></div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Top Performers (Mini List) */}
                        <div className="flex-1 bg-white/[0.02] border border-white/5 rounded p-4 mt-2 overflow-hidden flex flex-col">
                            <h3 className="text-[9px] font-bold text-white/30 uppercase tracking-[0.4em] mb-3">
                                High Alpha Personnel
                            </h3>
                            <div className="flex-1 flex flex-col gap-2.5 overflow-y-auto custom-scrollbar">
                                {data.flatMap(t => t.players).sort((a,b) => b.impactScore - a.impactScore).slice(0, 6).map((player, i) => (
                                    <div key={player.playerName} className="flex items-center justify-between group cursor-default hover:bg-white/5 p-1 px-1.5 rounded transition-colors">
                                        <div className="flex items-center gap-2.5">
                                            <span className="text-[8px] font-mono text-white/20">0{i+1}</span>
                                            <div>
                                                <div className="text-[10px] font-bold text-white uppercase group-hover:text-cyan-400 transition-colors leading-none mb-0.5">{player.playerName}</div>
                                                <div className="text-[7px] text-white/20 uppercase tracking-widest">{player.teamName}</div>
                                            </div>
                                        </div>
                                        <span className="text-[10px] font-black text-white italic">{player.impactScore.toFixed(1)}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Security Visual Seal */}
                        <div className="bg-transparent border-2 border-cyan-500/20 p-3 rounded-sm relative overflow-hidden group hover:border-cyan-500/40 transition-colors">
                            <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-cyan-500"></div>
                            <div className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-cyan-500"></div>
                            <div className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-cyan-500"></div>
                            <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-cyan-500"></div>
                            
                            <span className="text-[7px] font-black text-white/20 uppercase tracking-[0.5em] block mb-1">Secure Intel v7</span>
                            <div className="text-sm font-black text-cyan-400 italic tracking-tighter uppercase leading-none truncate font-mono">
                                FRAGLAB_GEN_#{Math.floor(Math.random() * 9000) + 1000}
                            </div>
                        </div>
                    </div>
                )}
            </div>


            {/* Footer Section */}
            <div className={`flex items-center justify-between ${isPortrait ? 'mt-2' : 'mt-4'} font-mono text-[8px] lg:text-[10px] text-[#7A7A7A] uppercase tracking-[0.3em]`}>
                <div className="flex items-center gap-4">
                    <Calendar className="w-3 h-3" />
                    <span className="hidden sm:inline">Generated: {new Date().toLocaleDateString('en-GB')}</span>
                </div>
                
                <div className="bg-[#1A1A1A] px-4 py-1 rounded-full text-white font-bold">
                    PAGE {page} OF {totalPages}
                </div>

                <div className="hidden sm:block">
                    POWERED BY FRAGLAB ANALYTICS
                </div>
            </div>
        </div>
    );
};

const Calendar = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
        <line x1="16" y1="2" x2="16" y2="6"></line>
        <line x1="8" y1="2" x2="8" y2="6"></line>
        <line x1="3" y1="10" x2="21" y2="10"></line>
    </svg>
);
