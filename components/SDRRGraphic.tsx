import React from 'react';

interface Player {
  name: string;
  kills: number;
  survivalTime: string;
  photoUrl?: string;
}

interface SDRRGraphicProps {
  tournamentName: string;
  matchIdentifier: string;
  teamName: string;
  players: Player[];
  isPortrait?: boolean;
  visualConfig?: any;
  layout?: string;
}

export const SDRRGraphic: React.FC<SDRRGraphicProps> = ({
  tournamentName,
  matchIdentifier,
  teamName,
  players,
  isPortrait = false,
  visualConfig = { fontScale: 1, containerPadding: 1, spacing: 1, templateMode: false },
  layout = 'classic'
}) => {
  const scale = visualConfig.fontScale || 1;
  const padding = (visualConfig.containerPadding || 1) * 2;
  const spacing = (visualConfig.spacing || 1) * 1;
  const isTemplate = visualConfig.templateMode;

  if (layout === 'cyber_glitch') {
    return (
      <div className={`w-full h-full ${isTemplate ? 'bg-transparent' : 'bg-[#050505]'} p-8 flex flex-col items-center justify-between text-white font-sans overflow-hidden relative border-l-8 border-yellow-500`} style={{ padding: `${padding}rem` }}>
        {/* Background Decorative Text */}
        {!isTemplate && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none select-none opacity-[0.05] whitespace-nowrap z-0">
                <h1 className="font-black italic uppercase tracking-tighter" style={{ fontSize: `${15 * scale}rem` }}>SDRR_SYSTEM</h1>
            </div>
        )}

        {/* Glitch Overlay */}
        {!isTemplate && (
            <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden mix-blend-overlay opacity-30">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSJ0cmFuc3BhcmVudCIvPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSIxIiBmaWxsPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMSkiLz4KPC9zdmc+')]"></div>
                <div className="absolute top-[20%] left-0 w-full h-px bg-cyan-500 shadow-[0_0_15px_cyan] opacity-50"></div>
                <div className="absolute top-[80%] left-0 w-full h-px bg-fuchsia-500 shadow-[0_0_15px_fuchsia] opacity-50"></div>
            </div>
        )}

        {/* Header */}
        <div className={`w-full flex ${isPortrait ? 'flex-col items-center gap-4 text-center' : 'justify-between items-start'} z-10`}>
          <div className="bg-yellow-500 text-black px-6 py-2 flex items-center gap-4 skew-x-[-12deg]">
            <div className="flex gap-1">
                <div className="w-2 h-2 bg-black/40"></div>
                <div className="w-2 h-2 bg-black/40"></div>
            </div>
            <span className="font-mono font-black uppercase tracking-[0.3em] italic" style={{ fontSize: `${0.8 * scale}rem` }}>{tournamentName}</span>
          </div>
          <div className={isPortrait ? 'text-center' : 'text-right'}>
            <div className="relative">
                <h1 className="absolute -top-[1px] -left-[1px] font-black uppercase tracking-tighter text-cyan-500 mix-blend-screen opacity-50 animate-glitch-color" style={{ fontSize: `${3 * scale}rem`, lineHeight: 1 }}>SDRR_ELITE</h1>
                <h1 className="absolute top-[1px] left-[1px] font-black uppercase tracking-tighter text-fuchsia-500 mix-blend-screen opacity-50 animate-glitch-color" style={{ fontSize: `${3 * scale}rem`, lineHeight: 1 }}>SDRR_ELITE</h1>
                <h1 className="relative font-black uppercase tracking-tighter text-white animate-glitch-skew" style={{ fontSize: `${3 * scale}rem`, lineHeight: 1 }}>SDRR_ELITE</h1>
            </div>
            <p className="text-yellow-500 font-mono uppercase tracking-[0.4em] mt-2" style={{ fontSize: `${1.25 * scale}rem` }}>{matchIdentifier}</p>
          </div>
        </div>

        {/* Player Cards */}
        <div className={`w-full grid ${isPortrait ? 'grid-cols-2' : 'grid-cols-4'} z-10`} style={{ gap: `${spacing * 2}rem` }}>
          {(players || []).map((player, index) => (
            <div key={index} className={`${isTemplate ? 'bg-transparent border-transparent' : 'bg-black/60 border-l-2 border-white/10'} p-6 flex flex-col items-center relative group hover:border-yellow-500 transition-all backdrop-blur-md`}>
              <div className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-300 bg-gradient-to-b from-yellow-500 to-transparent"></div>
              
              <div className="w-full aspect-square bg-white/5 border border-white/10 rounded-none mb-6 overflow-hidden relative">
                {player.photoUrl ? (
                  <img src={player.photoUrl} alt={player.name} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white/10 font-mono text-xs">DATA_MISSING</div>
                )}
                <div className="absolute bottom-0 left-0 w-full h-1 bg-white/20">
                    <div className="h-full bg-yellow-500 w-2/3 shadow-[0_0_10px_rgba(234,179,8,0.8)]"></div>
                </div>
              </div>

              <div className="relative mb-4 w-full text-center">
                  <h2 className="absolute -top-[1px] -left-[1px] font-black uppercase tracking-widest text-cyan-500 mix-blend-screen opacity-30 w-full" style={{ fontSize: `${1.25 * scale}rem` }}>{player.name}</h2>
                  <h2 className="absolute top-[1px] left-[1px] font-black uppercase tracking-widest text-fuchsia-500 mix-blend-screen opacity-30 w-full" style={{ fontSize: `${1.25 * scale}rem` }}>{player.name}</h2>
                  <h2 className="relative font-black uppercase tracking-widest text-white w-full" style={{ fontSize: `${1.25 * scale}rem` }}>{player.name}</h2>
              </div>

              <div className="w-full space-y-3 uppercase font-mono" style={{ fontSize: `${0.875 * scale}rem` }}>
                <div className="flex justify-between border-b border-white/5 pb-2">
                  <span className="text-white/30" style={{ fontSize: `${0.7 * scale}rem` }}>Kills</span>
                  <span className="font-black text-yellow-500">{player.kills}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/30" style={{ fontSize: `${0.7 * scale}rem` }}>Survival</span>
                  <span className="font-black text-white">{player.survivalTime}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="w-full text-center z-10 mt-12 relative">
          <div className="absolute -top-8 left-1/2 -translate-x-1/2 w-32 h-[1px] bg-yellow-500/50"></div>
          <h2 className="font-black italic uppercase tracking-tighter text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.3)] relative" style={{ fontSize: `${5 * scale}rem`, lineHeight: 1 }}>
            <span className="absolute -left-[2px] top-[2px] text-cyan-500 opacity-40 mix-blend-screen">{teamName}</span>
            <span className="absolute -right-[2px] -top-[2px] text-fuchsia-500 opacity-40 mix-blend-screen">{teamName}</span>
            <span className="relative z-10">{teamName}</span>
          </h2>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-[#050505]/90 p-8 flex flex-col items-center justify-between text-white font-sans overflow-hidden relative shadow-[8px_8px_0px_0px_rgba(255,255,255,0.05)] border-2 border-white/10" style={{ padding: `${padding}rem` }}>
      {/* Background Decorative Text */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none select-none opacity-[0.02] whitespace-nowrap z-0">
          <h1 className="font-black italic uppercase tracking-tighter" style={{ fontSize: `${12 * scale}rem` }}>SDRR</h1>
      </div>

      {/* Header */}
      <div className={`w-full flex ${isPortrait ? 'flex-col items-center gap-4 text-center' : 'justify-between items-start'} z-10`}>
        <div className="h-8 bg-[#00FF00] flex items-center px-4 border-b-2 border-[#00FF00] text-black">
          <div className="flex gap-1 mr-3">
              <div className="w-1.5 h-1.5 rounded-full bg-black/40"></div>
              <div className="w-1.5 h-1.5 rounded-full bg-black/40"></div>
              <div className="w-1.5 h-1.5 rounded-full bg-black/40"></div>
          </div>
          <span className="font-mono font-black uppercase tracking-[0.2em]" style={{ fontSize: `${0.6 * scale}rem` }}>{tournamentName}</span>
        </div>
        <div className={isPortrait ? 'text-center' : 'text-right'}>
          <h1 className="font-black uppercase tracking-tighter text-[#00FF00]" style={{ fontSize: `${2.25 * scale}rem`, lineHeight: 1 }}>SDRR TEAM STATS</h1>
          <p className="text-white/40 font-mono uppercase tracking-widest" style={{ fontSize: `${1.25 * scale}rem` }}>{matchIdentifier}</p>
        </div>
      </div>

      {/* Player Cards */}
      <div className={`w-full grid ${isPortrait ? 'grid-cols-2' : 'grid-cols-4'} z-10`} style={{ gap: `${spacing}rem` }}>
        {(players || []).map((player, index) => (
          <div key={index} className="bg-white/5 border border-white/10 p-4 flex flex-col items-center relative group hover:border-[#00FF00]/50 transition-colors">
            {/* Brutalist accents */}
            <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-[#00FF00]"></div>
            <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-[#00FF00]"></div>
            <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-[#00FF00]"></div>
            <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-[#00FF00]"></div>

            <div className="w-full aspect-square bg-black/50 border border-white/10 rounded-none mb-4 overflow-hidden max-w-[160px]">
              {player.photoUrl ? (
                <img src={player.photoUrl} alt={player.name} className="w-full h-full object-cover grayscale opacity-80 group-hover:grayscale-0 group-hover:opacity-100 transition-all" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white/20 font-mono text-xs">NO_IMG</div>
              )}
            </div>
            <h2 className="font-black uppercase tracking-widest mb-4 text-white text-center" style={{ fontSize: `${1.125 * scale}rem` }}>{player.name}</h2>
            <div className="w-full space-y-2 uppercase font-mono" style={{ fontSize: `${0.875 * scale}rem` }}>
              <div className="flex justify-between border-b border-white/10 pb-1">
                <span className="text-white/40" style={{ fontSize: `${0.6 * scale}rem` }}>Finishes</span>
                <span className="font-bold text-[#00FF00]">{player.kills}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/40" style={{ fontSize: `${0.6 * scale}rem` }}>Surv. Time</span>
                <span className="font-bold text-[#00FF00]">{player.survivalTime}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="w-full text-center z-10 mt-8">
        <h2 className="font-black italic uppercase tracking-tighter text-white drop-shadow-[0_0_15px_rgba(0,255,0,0.3)]" style={{ fontSize: `${4.5 * scale}rem`, lineHeight: 1 }}>
          {teamName}
        </h2>
      </div>
    </div>
  );
};
