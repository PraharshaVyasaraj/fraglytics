
import React from 'react';
import { TeamData, BrandingConfig, Insight } from '../types';
import { Shield, Trophy, Skull, Crosshair, Target, BrainCircuit, AlertTriangle, TrendingUp, Calendar, Hash, MapPin, Zap } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, CartesianGrid } from 'recharts';

interface PressKitRendererProps {
  data: TeamData[];
  branding: BrandingConfig;
  insights: Insight[];
  page: 'cover' | 1 | 2 | 3;
}

// A4 Dimensions at high DPI
const PAGE_WIDTH = 1240; 
const PAGE_HEIGHT = 1754;

const PressKitRenderer: React.FC<PressKitRendererProps> = ({ data, branding, insights, page }) => {
  const accentStyle = { color: branding.accentColor };
  const bgAccentStyle = { backgroundColor: branding.accentColor };
  const borderAccentStyle = { borderColor: branding.accentColor };

  // --- SHARED COMPONENTS ---

  const Header = ({ title, subtitle }: { title: string, subtitle: string }) => (
    <div className="flex justify-between items-end border-b-4 border-black pb-6 mb-10">
      <div className="flex items-center gap-6">
        <div className="w-16 h-16 bg-black text-white flex items-center justify-center rounded-sm">
           {branding.logoUrl ? (
               <img src={branding.logoUrl} alt="Logo" className="w-12 h-12 object-contain invert brightness-0" />
           ) : (
               <Shield className="w-10 h-10" />
           )}
        </div>
        <div>
           <h1 className="text-3xl font-black font-serif uppercase text-black tracking-tight leading-none">{branding.orgName}</h1>
           <p className="text-sm text-gray-500 font-mono tracking-widest uppercase mt-1">Official Intelligence Report</p>
        </div>
      </div>
      <div className="text-right">
        <h2 className="text-6xl font-black text-black uppercase tracking-tighter leading-none">{title}</h2>
        <div className="flex items-center justify-end gap-2 mt-2">
            <div className="h-1 w-12" style={bgAccentStyle}></div>
            <p className="text-xl font-bold font-mono uppercase text-gray-600">{subtitle}</p>
        </div>
      </div>
    </div>
  );

  const Footer = ({ pageNum }: { pageNum: string }) => (
    <div className="mt-auto pt-6 border-t-2 border-gray-200 flex justify-between items-center text-gray-400 font-mono uppercase tracking-widest text-xs">
       <div className="flex items-center gap-4">
           <span>CONFIDENTIAL // BROADCAST USE ONLY</span>
           <span className="w-px h-3 bg-gray-300"></span>
           <span>GENERATED VIA SCARFALL ANALYTICS</span>
       </div>
       <div className="font-bold text-black">PAGE {pageNum}</div>
    </div>
  );

  // --- PAGE 0: COVER PAGE ---
  if (page === 'cover') {
      const topTeam = data[0];
      return (
        <div className="bg-white text-black font-sans flex flex-col h-full box-border relative overflow-hidden" style={{ width: PAGE_WIDTH, height: PAGE_HEIGHT }}>
            {/* Background Elements */}
            <div className="absolute top-0 right-0 w-[800px] h-[1754px] bg-gray-50 -skew-x-12 translate-x-1/2 z-0"></div>
            <div className="absolute bottom-0 left-0 w-full h-32 bg-black z-10"></div>
            <div className="absolute bottom-0 left-0 w-full h-32 z-20 flex items-center justify-between px-16">
                <div className="text-white font-mono text-xl tracking-[0.5em] uppercase">Post-Match Analysis</div>
                <div className="text-white font-black text-4xl tracking-tighter">{new Date().toLocaleDateString()}</div>
            </div>

            <div className="relative z-10 p-24 flex flex-col h-full justify-center">
                <div className="mb-12">
                    <div className="inline-block px-4 py-2 bg-black text-white font-mono text-sm font-bold uppercase tracking-widest mb-6">
                        Document #{Math.floor(Math.random()*10000)}
                    </div>
                    <h1 className="text-[120px] font-black uppercase leading-[0.9] tracking-tighter mb-4">
                        Tournament<br/>
                        <span style={accentStyle}>Report</span>
                    </h1>
                    <div className="w-32 h-4" style={bgAccentStyle}></div>
                </div>

                <div className="grid grid-cols-2 gap-16 mt-12">
                    <div>
                        <h3 className="text-2xl font-bold uppercase mb-2 border-b-2 border-black pb-2">Organization</h3>
                        <div className="text-4xl font-serif text-gray-800">{branding.orgName}</div>
                    </div>
                    <div>
                        <h3 className="text-2xl font-bold uppercase mb-2 border-b-2 border-black pb-2">Session Data</h3>
                        <div className="text-4xl font-serif text-gray-800">{data.length} Squads</div>
                    </div>
                </div>

                {topTeam && (
                    <div className="mt-24 p-8 border-4 border-gray-100 bg-white shadow-2xl max-w-2xl">
                        <div className="text-sm font-bold uppercase text-gray-400 tracking-widest mb-2">Current Leader</div>
                        <div className="text-7xl font-black uppercase tracking-tight text-black">{topTeam.name}</div>
                        <div className="flex gap-8 mt-6">
                            <div>
                                <div className="text-3xl font-black" style={accentStyle}>{topTeam.totalPoints}</div>
                                <div className="text-xs font-bold uppercase text-gray-400">Points</div>
                            </div>
                            <div>
                                <div className="text-3xl font-black">{topTeam.totalFinishes}</div>
                                <div className="text-xs font-bold uppercase text-gray-400">Elims</div>
                            </div>
                            <div>
                                <div className="text-3xl font-black">{topTeam.history.filter(h=>h.rank===1).length}</div>
                                <div className="text-xs font-bold uppercase text-gray-400">Wins</div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
      );
  }

  // --- PAGE 1: EXECUTIVE SUMMARY (STANDINGS) ---
  if (page === 1) {
    const top3 = data.slice(0, 3);
    const restTeams = data.slice(3, 18); // Next 15

    return (
      <div className="bg-white text-black font-sans p-16 flex flex-col h-full box-border" style={{ width: PAGE_WIDTH, height: PAGE_HEIGHT }}>
         <Header title="Standings" subtitle="Executive Summary" />
         
         {/* Visual Podium */}
         <div className="grid grid-cols-3 gap-8 mb-12 h-64 items-end px-12">
             {/* 2nd Place */}
             {top3[1] && (
                 <div className="flex flex-col justify-end h-full">
                     <div className="text-center mb-2">
                         <div className="text-2xl font-black uppercase truncate">{top3[1].name}</div>
                         <div className="text-gray-500 font-mono text-sm">{top3[1].totalPoints} PTS</div>
                     </div>
                     <div className="h-32 bg-gray-200 w-full rounded-t-sm flex items-center justify-center text-4xl font-black text-gray-400">#2</div>
                 </div>
             )}
             {/* 1st Place */}
             {top3[0] && (
                 <div className="flex flex-col justify-end h-full">
                     <div className="text-center mb-2">
                         <div className="inline-block px-3 py-1 bg-yellow-400 text-black text-xs font-bold uppercase rounded-sm mb-1">Leader</div>
                         <div className="text-3xl font-black uppercase truncate" style={accentStyle}>{top3[0].name}</div>
                         <div className="text-black font-mono text-lg font-bold">{top3[0].totalPoints} PTS</div>
                     </div>
                     <div className="h-48 bg-black w-full rounded-t-sm flex items-center justify-center text-6xl font-black text-white border-t-4" style={borderAccentStyle}>#1</div>
                 </div>
             )}
             {/* 3rd Place */}
             {top3[2] && (
                 <div className="flex flex-col justify-end h-full">
                     <div className="text-center mb-2">
                         <div className="text-2xl font-black uppercase truncate">{top3[2].name}</div>
                         <div className="text-gray-500 font-mono text-sm">{top3[2].totalPoints} PTS</div>
                     </div>
                     <div className="h-24 bg-gray-200 w-full rounded-t-sm flex items-center justify-center text-4xl font-black text-gray-400">#3</div>
                 </div>
             )}
         </div>

         {/* Detailed Table */}
         <div className="flex-1">
            <table className="w-full text-left border-collapse">
               <thead>
                  <tr className="border-b-2 border-black bg-gray-50">
                     <th className="py-3 pl-4 text-sm font-black uppercase tracking-widest">Rank</th>
                     <th className="py-3 text-sm font-black uppercase tracking-widest">Team Name</th>
                     <th className="py-3 text-sm font-black uppercase tracking-widest text-center">Matches</th>
                     <th className="py-3 text-sm font-black uppercase tracking-widest text-center">WWCD</th>
                     <th className="py-3 text-sm font-black uppercase tracking-widest text-center">Place Pts</th>
                     <th className="py-3 text-sm font-black uppercase tracking-widest text-center">Kill Pts</th>
                     <th className="py-3 pr-4 text-sm font-black uppercase tracking-widest text-right">Total</th>
                  </tr>
               </thead>
               <tbody>
                  {restTeams.map((team, idx) => (
                     <tr key={team.name} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 pl-4 text-xl font-bold text-gray-400">#{team.rank}</td>
                        <td className="py-3 text-xl font-bold uppercase">{team.name}</td>
                        <td className="py-3 text-lg font-mono text-center text-gray-500">{team.matchesPlayed}</td>
                        <td className="py-3 text-lg font-mono text-center font-bold">{team.history?.filter(h => h.rank === 1).length || '-'}</td>
                        <td className="py-3 text-lg font-mono text-center text-gray-600">{team.placementPoints}</td>
                        <td className="py-3 text-lg font-mono text-center text-gray-600">{team.killPoints}</td>
                        <td className="py-3 pr-4 text-2xl font-black text-right">{team.totalPoints}</td>
                     </tr>
                  ))}
               </tbody>
            </table>
         </div>

         <Footer pageNum="1" />
      </div>
    );
  }

  // --- PAGE 2: OPERATOR INTEL ---
  if (page === 2) {
     const allPlayers = data.flatMap(t => t.players.map(p => ({ ...p, team: t.name })));
     
     // The "Dream Team" - Top 4 players by Impact Score
     const dreamTeam = [...allPlayers].sort((a,b) => b.impactScore - a.impactScore).slice(0, 4);
     
     // Top Fraggers Table
     const topFraggers = [...allPlayers].sort((a,b) => b.finishes - a.finishes).slice(0, 10);

     return (
      <div className="bg-white text-black font-sans p-16 flex flex-col h-full box-border" style={{ width: PAGE_WIDTH, height: PAGE_HEIGHT }}>
         <Header title="Operator Intel" subtitle="Performance Data" />
         
         {/* DREAM TEAM SECTION */}
         <div className="mb-12">
             <div className="flex items-center gap-4 mb-6">
                 <div className="bg-black text-white px-4 py-1 font-bold uppercase tracking-widest text-sm rounded-sm">Squad of the Tournament</div>
                 <div className="h-px bg-black flex-1"></div>
             </div>
             
             <div className="grid grid-cols-4 gap-6">
                 {dreamTeam.map((p, idx) => (
                     <div key={idx} className="border-2 border-gray-100 p-6 relative overflow-hidden bg-gray-50">
                         <div className="absolute top-0 right-0 bg-gray-200 text-gray-500 px-3 py-1 text-xs font-bold uppercase">{p.carryClass.replace('_', ' ')}</div>
                         <div className="mt-4 mb-2">
                             <div className="text-3xl font-black uppercase leading-none truncate" style={accentStyle}>{p.playerName}</div>
                             <div className="text-sm font-mono font-bold uppercase text-gray-500">{p.team}</div>
                         </div>
                         <div className="grid grid-cols-2 gap-4 mt-6 pt-4 border-t border-gray-200">
                             <div>
                                 <div className="text-3xl font-bold">{p.finishes}</div>
                                 <div className="text-[10px] uppercase font-bold text-gray-400">Kills</div>
                             </div>
                             <div>
                                 <div className="text-3xl font-bold">{(p.damage/1000).toFixed(1)}k</div>
                                 <div className="text-[10px] uppercase font-bold text-gray-400">Damage</div>
                             </div>
                         </div>
                     </div>
                 ))}
             </div>
         </div>

         {/* STAT LEADERBOARDS */}
         <div className="flex-1 grid grid-cols-2 gap-12">
            {/* Top Fraggers */}
            <div>
               <h3 className="text-2xl font-black uppercase mb-4 flex items-center gap-2">
                   <Skull className="w-6 h-6" /> Top Fraggers
               </h3>
               <table className="w-full text-left">
                   <thead className="border-b-2 border-black">
                       <tr>
                           <th className="py-2 text-xs font-bold uppercase text-gray-500">Player</th>
                           <th className="py-2 text-xs font-bold uppercase text-gray-500 text-right">Kills</th>
                           <th className="py-2 text-xs font-bold uppercase text-gray-500 text-right">KPM</th>
                       </tr>
                   </thead>
                   <tbody>
                       {topFraggers.map((p, idx) => (
                           <tr key={idx} className="border-b border-gray-100">
                               <td className="py-3">
                                   <div className="font-bold uppercase">{p.playerName}</div>
                                   <div className="text-[10px] uppercase text-gray-400">{p.team}</div>
                               </td>
                               <td className="py-3 text-right font-black text-xl">{p.finishes}</td>
                               <td className="py-3 text-right font-mono text-gray-500">{p.kpm.toFixed(2)}</td>
                           </tr>
                       ))}
                   </tbody>
               </table>
            </div>

            {/* Damage Dealers */}
            <div>
               <h3 className="text-2xl font-black uppercase mb-4 flex items-center gap-2">
                   <Crosshair className="w-6 h-6" /> Damage Output
               </h3>
               <table className="w-full text-left">
                   <thead className="border-b-2 border-black">
                       <tr>
                           <th className="py-2 text-xs font-bold uppercase text-gray-500">Player</th>
                           <th className="py-2 text-xs font-bold uppercase text-gray-500 text-right">Damage</th>
                           <th className="py-2 text-xs font-bold uppercase text-gray-500 text-right">Avg</th>
                       </tr>
                   </thead>
                   <tbody>
                       {[...allPlayers].sort((a,b) => b.damage - a.damage).slice(0, 10).map((p, idx) => (
                           <tr key={idx} className="border-b border-gray-100">
                               <td className="py-3">
                                   <div className="font-bold uppercase">{p.playerName}</div>
                                   <div className="text-[10px] uppercase text-gray-400">{p.team}</div>
                               </td>
                               <td className="py-3 text-right font-black text-xl">{p.damage.toLocaleString()}</td>
                               <td className="py-3 text-right font-mono text-gray-500">{(p.damage / Math.max(1, p.matchesPlayed)).toFixed(0)}</td>
                           </tr>
                       ))}
                   </tbody>
               </table>
            </div>
         </div>

         <Footer pageNum="2" />
      </div>
     );
  }

  // --- PAGE 3: TACTICAL ANALYSIS ---
  if (page === 3) {
     return (
      <div className="bg-white text-black font-sans p-16 flex flex-col h-full box-border" style={{ width: PAGE_WIDTH, height: PAGE_HEIGHT }}>
         <Header title="Tactical Analysis" subtitle="AI & Deep Dive" />
         
         <div className="flex-1">
             <div className="flex items-center gap-4 mb-8">
                 <div className="bg-black text-white px-4 py-1 font-bold uppercase tracking-widest text-sm rounded-sm">Analyst Desk</div>
                 <div className="h-px bg-black flex-1"></div>
             </div>

             {insights.length > 0 ? (
                 <div className="grid grid-cols-1 gap-6">
                    {insights.map((insight, idx) => (
                        <div key={idx} className="flex gap-8 p-8 border-l-8 bg-gray-50 shadow-sm" style={{ borderColor: insight.type === 'warning' ? '#ef4444' : insight.type === 'prediction' ? '#a855f7' : branding.accentColor }}>
                            <div className="shrink-0 pt-2">
                                {insight.type === 'warning' && <AlertTriangle className="w-16 h-16 text-red-500" />}
                                {insight.type === 'performance' && <TrendingUp className="w-16 h-16 text-green-600" />}
                                {insight.type === 'tactical' && <BrainCircuit className="w-16 h-16 text-blue-600" />}
                                {insight.type === 'prediction' && <Target className="w-16 h-16 text-purple-600" />}
                            </div>
                            <div>
                                <div className="flex items-center gap-3 mb-2">
                                    <span className="text-xs font-black uppercase tracking-widest px-2 py-1 bg-black text-white rounded-sm">{insight.type}</span>
                                </div>
                                <h3 className="text-3xl font-bold mb-4 font-serif">{insight.title}</h3>
                                <p className="text-xl text-gray-600 leading-relaxed font-serif text-justify">
                                    {insight.description}
                                </p>
                            </div>
                        </div>
                    ))}
                 </div>
             ) : (
                 <div className="flex flex-col items-center justify-center h-96 text-gray-300 border-4 border-dashed border-gray-200 rounded-lg">
                     <BrainCircuit className="w-32 h-32 mb-4" />
                     <h3 className="text-3xl font-black uppercase">No Insights Available</h3>
                     <p className="text-xl font-mono">Run AI Analyst to populate this report.</p>
                 </div>
             )}

             {/* Placeholder for Match History Chart visualization */}
             <div className="mt-12 pt-12 border-t-2 border-gray-100">
                 <div className="flex justify-between items-end mb-6">
                     <h3 className="text-2xl font-black uppercase">Velocity Chart</h3>
                     <span className="text-sm font-mono text-gray-400">CUMULATIVE POINTS (TOP 5)</span>
                 </div>
                 <div className="h-64 bg-gray-50 border border-gray-200 rounded-sm flex items-center justify-center text-gray-400 font-mono text-sm uppercase">
                     [Chart Rendering Optimized for PDF]
                 </div>
             </div>
         </div>

         {/* Sign-off */}
         <div className="bg-black text-white p-12 mt-12 flex justify-between items-center rounded-sm">
             <div>
                 <div className="text-sm font-mono text-gray-500 uppercase tracking-widest mb-1">Generated By</div>
                 <div className="text-3xl font-black uppercase">{branding.orgName}</div>
             </div>
             <div className="text-right">
                 <div className="text-sm font-mono text-gray-500 uppercase tracking-widest mb-1">Date</div>
                 <div className="text-3xl font-black uppercase">{new Date().toLocaleDateString()}</div>
             </div>
         </div>

         <Footer pageNum="3" />
      </div>
     );
  }

  return null;
};

export default PressKitRenderer;
