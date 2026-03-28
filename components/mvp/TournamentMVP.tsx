import React, { useMemo } from 'react';
import { MVPCard, MVPPlayer } from './MVPCard';
import { Trophy } from 'lucide-react';
import { TeamData, BrandingConfig } from '../../types';
import { ASSETS } from '../../assets';

interface TournamentMVPProps {
  data: TeamData[];
  branding: BrandingConfig;
}

export const TournamentMVP: React.FC<TournamentMVPProps> = ({ data, branding }) => {
  
  // Process data to find top players
  const { primaryMVP, secondaryMVPs } = useMemo(() => {
    const characterKeys = Object.keys(ASSETS.CHARACTERS);
    
    const allPlayers: MVPPlayer[] = data.flatMap(team => 
      team.players.map(player => {
        const avatarIndex = player.playerName.length % characterKeys.length;
        const avatarUrl = ASSETS.CHARACTERS[characterKeys[avatarIndex] as keyof typeof ASSETS.CHARACTERS];

        return {
          id: player.playerName,
          name: player.playerName,
          teamName: team.name,
          stats: {
            mvpRating: player.impactScore, // Using impactScore as MVP rating
            finishes: player.finishes,
            damage: player.damage,
            avgSurvival: `${Math.floor(team.avgSurvivalTime / 60)}:${Math.floor(team.avgSurvivalTime % 60).toString().padStart(2, '0')}`, // Approx from team
            knocks: Math.floor(player.finishes * 0.8) // Est. knocks if not tracked, or use real if available
          },
          playerImage: avatarUrl
        };
      })
    );

    // Sort by MVP Rating (Impact Score)
    const sortedPlayers = allPlayers.sort((a, b) => b.stats.mvpRating - a.stats.mvpRating);

    return {
      primaryMVP: sortedPlayers[0],
      secondaryMVPs: sortedPlayers.slice(1, 5)
    };
  }, [data]);


  if (!primaryMVP) return null;

  return (
    <div className="w-full h-full bg-[#0E0E0E] text-white overflow-hidden relative font-sans selection:bg-yellow-400 selection:text-black flex flex-col">
      
      {/* Background Grid Effect */}
      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none" 
           style={{ 
             backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px)',
             backgroundSize: '40px 40px'
           }}>
      </div>

      {/* Diagonal Banner (Top Left) */}
      <div className="absolute -top-10 -left-20 bg-[#F2C94C] text-black font-black text-2xl py-4 px-32 -rotate-[35deg] z-20 shadow-lg border-b-4 border-black">
        BREAK BOUNDARIES
      </div>

      {/* Main Content Container */}
      <div className="relative z-10 w-full h-full px-12 py-12 flex flex-col">
        
        {/* Header Section */}
        <div className="flex justify-between items-start mb-8">
          <div className="text-center w-full relative">
            <h1 className="text-8xl font-black uppercase tracking-tighter italic text-white" style={{ textShadow: '0 4px 0 rgba(0,0,0,0.5)' }}>
              Tournament MVP
            </h1>
            <p className="text-2xl font-bold text-white/50 uppercase tracking-[0.5em] mt-2">
              {branding.orgName}
            </p>
          </div>
          
          {/* Right Corner Logo */}
          <div className="absolute top-0 right-0 hidden md:block">
            <div className="bg-white/10 backdrop-blur-sm p-4 rounded-bl-3xl border-l border-b border-white/20">
              <div className="text-center">
                <Trophy className="w-12 h-12 mx-auto text-white mb-1" />
                <div className="text-xs font-bold tracking-widest uppercase">Series MVP</div>
              </div>
            </div>
          </div>
        </div>

        {/* MVP Section - Flex Layout */}
        <div className="flex-1 flex flex-col xl:flex-row items-end justify-center gap-8 xl:gap-16 w-full pb-12">
          
          {/* Primary MVP (Left Side) */}
          <div className="flex-shrink-0 mx-auto xl:mx-0 transform scale-110 origin-bottom">
            <MVPCard player={primaryMVP} isPrimary={true} />
          </div>

          {/* Secondary Cards (Right Side) */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 w-full xl:w-auto">
            {secondaryMVPs.map((player) => (
              <MVPCard key={player.id} player={player} isPrimary={false} />
            ))}
          </div>
        </div>

      </div>
      
      {/* Bottom Gradient Fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#0E0E0E] to-transparent z-0 pointer-events-none"></div>
    </div>
  );
};

