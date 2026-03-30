
import React from 'react';
import { TeamData, BrandingConfig } from '../types';
import { Shield, ArrowUpRight, ArrowDownRight, Minus, Trophy } from 'lucide-react';

interface IntelligenceReportViewProps {
    data: TeamData[];
    branding: BrandingConfig;
    title?: string;
    subtitle?: string;
    page?: number;
    totalPages?: number;
    isPortrait?: boolean;
    onElementClick?: (element: string, data?: any) => void;
}

export const IntelligenceReportView: React.FC<IntelligenceReportViewProps> = ({
    data,
    branding,
    title = "OVERALL STANDINGS",
    subtitle = "GRAND FINALS | END OF DAY 3",
    page = 1,
    totalPages = 3,
    isPortrait = false,
    onElementClick
}) => {
    // Sort data for standings
    const sortedData = [...data].sort((a, b) => b.totalPoints - a.totalPoints);

    return (
        <div className="w-full h-full bg-[#0A0A0A] p-6 lg:p-12 flex flex-col relative overflow-hidden font-sans">
            <div 
                onClick={() => onElementClick?.('header')}
                className={`flex items-center ${isPortrait ? 'gap-4 mb-6' : 'gap-6 mb-8'} cursor-pointer hover:bg-white/5 transition-colors rounded-sm group`}
            >
                <div className={`${isPortrait ? 'w-12 h-12' : 'w-16 h-16'} bg-[#E11D48] flex items-center justify-center rounded-sm`}>
                    <Shield className={`${isPortrait ? 'w-6 h-6' : 'w-10 h-10'} text-white`} />
                </div>
                <div className="flex flex-col">
                    <h1 className={`${isPortrait ? 'text-2xl' : 'text-5xl'} font-bold tracking-tighter text-white uppercase leading-none`}>
                        FRAGLAB ANALYTICS
                    </h1>
                    <span className="text-[8px] lg:text-xs font-mono tracking-[0.5em] text-[#7A7A7A] uppercase mt-1">
                        INTELLIGENCE REPORT
                    </span>
                </div>
            </div>

            {/* Main Stage (The Paper) */}
            <div className={`flex-1 bg-[#F5F2ED] rounded-sm ${isPortrait ? 'p-6' : 'p-12'} flex ${isPortrait ? 'flex-col' : 'gap-12'} relative shadow-2xl overflow-hidden`}>
                {/* Left Content (The Table) */}
                <div className="flex-1 flex flex-col min-w-0">
                    <div className="mb-6">
                        <h2 className={`${isPortrait ? 'text-4xl' : 'text-7xl'} font-black font-serif text-outline leading-none mb-4`}>
                            {title}
                        </h2>
                        <div className="inline-block bg-[#C5A073] px-4 py-1 rounded-sm">
                            <span className="text-[10px] lg:text-xs font-bold text-[#1A1A1A] uppercase tracking-widest">
                                {subtitle}
                            </span>
                        </div>
                    </div>

                    {/* Standings Table */}
                    <div className="flex-1 overflow-hidden">
                        <div className={`grid ${isPortrait ? 'grid-cols-[40px_1fr_60px_60px]' : 'grid-cols-[60px_1fr_120px_120px_120px_120px]'} border-b border-[#1A1A1A]/20 pb-2 mb-2`}>
                            {(isPortrait ? ['POS', 'TEAM', 'FIN', 'TOT'] : ['POS', 'TEAM NAME', 'MATCHES PLAYED', 'FINISH PTS', 'POSITION PTS', 'TOTAL PTS']).map((h, i) => (
                                <span key={i} className={`text-[8px] lg:text-[10px] font-bold text-[#1A1A1A]/60 uppercase tracking-widest ${i > 1 ? 'text-right' : ''}`}>
                                    {h}
                                </span>
                            ))}
                        </div>

                        <div className="space-y-1 overflow-y-auto max-h-full">
                            {sortedData.slice(0, isPortrait ? 12 : 8).map((team, index) => {
                                // Mock trend logic for visual fidelity
                                const trend = index < 3 ? 'up' : index > 5 ? 'down' : 'stable';
                                const wwcds = team.history.filter(h => h.rank === 1).length;

                                return (
                                    <div 
                                        key={team.name} 
                                        onClick={() => onElementClick?.('team', { teamId: team.name })}
                                        className={`grid ${isPortrait ? 'grid-cols-[40px_1fr_60px_60px]' : 'grid-cols-[60px_1fr_120px_120px_120px_120px]'} items-center py-2 lg:py-3 border-b border-[#1A1A1A]/5 group hover:bg-[#1A1A1A]/5 transition-all cursor-pointer ${
                                            trend === 'up' ? 'border-l-4 border-[#10b981]' : 
                                            trend === 'down' ? 'border-l-4 border-[#E11D48]' : 'border-l-4 border-[#71717a]'
                                        } pl-2 lg:pl-4`}
                                    >
                                        <span className={`${isPortrait ? 'text-lg' : 'text-2xl'} font-black text-[#1A1A1A]`}>{index + 1}</span>
                                        
                                        <div className="flex items-center gap-2 lg:gap-3 min-w-0">
                                            <div className="w-5 h-5 lg:w-6 lg:h-6 border border-[#1A1A1A]/20 rounded-full flex items-center justify-center flex-shrink-0">
                                                <Shield className="w-2 h-2 lg:w-3 lg:h-3 text-[#1A1A1A]/40" />
                                            </div>
                                            <span className={`${isPortrait ? 'text-sm' : 'text-xl'} font-bold text-[#1A1A1A] uppercase tracking-tight truncate`}>{team.name}</span>
                                            {!isPortrait && wwcds > 0 && (
                                                <div className="flex items-center gap-1 bg-[#C5A073]/20 px-2 py-0.5 rounded-sm border border-[#C5A073]/30">
                                                    <span className="text-[8px] font-bold text-[#C5A073] uppercase tracking-widest">SDRR</span>
                                                    <span className="text-[10px] font-black text-[#C5A073]">x{wwcds}</span>
                                                </div>
                                            )}
                                        </div>

                                        {!isPortrait && <span className="text-right text-lg font-bold text-[#1A1A1A]">{team.matchesPlayed}</span>}
                                        <span className="text-right text-sm lg:text-lg font-bold text-[#1A1A1A]">{team.killPoints}</span>
                                        {!isPortrait && <span className="text-right text-lg font-bold text-[#1A1A1A]">{team.placementPoints}</span>}
                                        <span className={`text-right ${isPortrait ? 'text-xl' : 'text-3xl'} font-black text-[#1A1A1A]`}>{team.totalPoints}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Right Sidebar (Sponsors) */}
                <div className={`${isPortrait ? 'h-24 flex-row border-l-0 border-t mt-4 pt-4' : 'w-48 flex-col border-l pl-12 pt-12'} flex gap-4 lg:gap-8 border-[#1A1A1A]/10`}>
                    <div className={`${isPortrait ? 'flex-1' : 'w-full aspect-square'} border-2 border-dashed border-[#1A1A1A]/20 rounded-sm flex items-center justify-center text-center p-2 lg:p-4`}>
                        <span className="text-[8px] lg:text-[10px] font-bold text-[#1A1A1A]/30 uppercase tracking-widest">Sponsor 1</span>
                    </div>
                    <div className={`${isPortrait ? 'flex-1' : 'w-full aspect-square'} border-2 border-dashed border-[#1A1A1A]/20 rounded-full flex items-center justify-center text-center p-2 lg:p-4`}>
                        <span className="text-[8px] lg:text-[10px] font-bold text-[#1A1A1A]/30 uppercase tracking-widest">Sponsor 2</span>
                    </div>
                    <div className={`${isPortrait ? 'flex-1' : 'mt-auto'} flex flex-col items-center gap-2`}>
                        <span className="text-[6px] lg:text-[8px] font-bold text-[#1A1A1A]/40 uppercase tracking-widest">Powered By</span>
                        <div className={`w-full ${isPortrait ? 'h-8' : 'h-12'} border border-[#1A1A1A]/20 rounded-sm flex items-center justify-center`}>
                            <span className="text-[8px] lg:text-[10px] font-bold text-[#1A1A1A]/60 uppercase tracking-widest">Sponsor 3</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer Section */}
            <div className={`flex items-center justify-between ${isPortrait ? 'mt-4' : 'mt-8'} font-mono text-[8px] lg:text-[10px] text-[#7A7A7A] uppercase tracking-[0.3em]`}>
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
