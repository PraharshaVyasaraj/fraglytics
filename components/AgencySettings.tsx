import React, { useRef, useState } from 'react';
import { BrandingConfig, TeamData } from '../types';
import { X, Upload, Palette, Building2, Save, Users, User, Shield, Tv } from 'lucide-react';

interface AgencySettingsProps {
  isOpen: boolean;
  onClose: () => void;
  config: BrandingConfig;
  onSave: (config: BrandingConfig) => void;
  teams: TeamData[];
}

const PRESET_COLORS = [
  '#ef4444', // Tactical Red (Default)
  '#3b82f6', // Blue
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#8b5cf6', // Violet
  '#ec4899', // Pink
  '#06b6d4', // Cyan
  '#FFFFFF', // White
];

const AgencySettings: React.FC<AgencySettingsProps> = ({ isOpen, onClose, config, onSave, teams }) => {
  const [localConfig, setLocalConfig] = useState<BrandingConfig>(config);
  const [activeTab, setActiveTab] = useState<'agency' | 'broadcast' | 'teams' | 'players'>('agency');
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const [selectedPlayer, setSelectedPlayer] = useState<{team: string, player: string} | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const publisherLogoInputRef = useRef<HTMLInputElement>(null);
  const sponsorLogoInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const teamLogoInputRef = useRef<HTMLInputElement>(null);
  const playerPhotoInputRef = useRef<HTMLInputElement>(null);

  // Sync when opening
  React.useEffect(() => {
    if (isOpen) {
        setLocalConfig(config);
        if (teams.length > 0) {
            setSelectedTeam(teams[0].name);
            if (teams[0].players.length > 0) {
                setSelectedPlayer({ team: teams[0].name, player: teams[0].players[0].playerName });
            }
        }
    }
  }, [isOpen, config, teams]);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLocalConfig(prev => ({ ...prev, logoUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePublisherLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLocalConfig(prev => ({ ...prev, publisherLogoUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSponsorLogoUpload = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLocalConfig(prev => {
          const newSponsors = [...(prev.sponsorLogos || [])];
          newSponsors[index] = reader.result as string;
          return { ...prev, sponsorLogos: newSponsors };
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleTeamLogoUpload = (e: React.ChangeEvent<HTMLInputElement>, teamName: string) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLocalConfig(prev => ({
            ...prev,
            teamBranding: {
                ...(prev.teamBranding || {}),
                [teamName]: {
                    ...(prev.teamBranding?.[teamName] || {}),
                    logoUrl: reader.result as string
                }
            }
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePlayerPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>, playerName: string) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLocalConfig(prev => ({
            ...prev,
            playerBranding: {
                ...(prev.playerBranding || {}),
                [playerName]: {
                    ...(prev.playerBranding?.[playerName] || {}),
                    photoUrl: reader.result as string
                }
            }
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  if (!isOpen) return null;

  const activeTeamData = teams.find(t => t.name === selectedTeam);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-tactical-black border border-tactical-gray w-full max-w-3xl rounded-sm shadow-2xl relative flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-6 border-b border-tactical-gray bg-tactical-dark shrink-0">
          <div>
             <h3 className="font-serif text-xl font-bold text-white uppercase tracking-wider">Branding & Assets</h3>
             <p className="text-xs text-tactical-light font-mono mt-1">Configure Agency, Broadcast, Team, and Player Visuals</p>
          </div>
          <button onClick={onClose} className="text-tactical-light hover:text-white transition-colors"><X className="w-6 h-6" /></button>
        </div>
        
        {/* Tabs */}
        <div className="flex border-b border-tactical-gray shrink-0">
            <button 
                onClick={() => setActiveTab('agency')}
                className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 ${activeTab === 'agency' ? 'bg-tactical-gray/50 text-white border-b-2 border-tactical-red' : 'text-tactical-light hover:text-white'}`}
            >
                <Building2 className="w-4 h-4" /> Agency
            </button>
            <button 
                onClick={() => setActiveTab('broadcast')}
                className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 ${activeTab === 'broadcast' ? 'bg-tactical-gray/50 text-white border-b-2 border-tactical-red' : 'text-tactical-light hover:text-white'}`}
            >
                <Tv className="w-4 h-4" /> Broadcast
            </button>
            <button 
                onClick={() => setActiveTab('teams')}
                className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 ${activeTab === 'teams' ? 'bg-tactical-gray/50 text-white border-b-2 border-tactical-red' : 'text-tactical-light hover:text-white'}`}
            >
                <Shield className="w-4 h-4" /> Teams
            </button>
            <button 
                onClick={() => setActiveTab('players')}
                className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 ${activeTab === 'players' ? 'bg-tactical-gray/50 text-white border-b-2 border-tactical-red' : 'text-tactical-light hover:text-white'}`}
            >
                <Users className="w-4 h-4" /> Players
            </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
           
           {activeTab === 'agency' && (
               <div className="space-y-8 max-w-lg">
                   {/* Organization Name */}
                   <div className="space-y-3">
                      <label className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-tactical-light font-bold">
                         <Building2 className="w-4 h-4" /> Organization Name
                      </label>
                      <input 
                         value={localConfig.orgName}
                         onChange={(e) => setLocalConfig({...localConfig, orgName: e.target.value})}
                         className="w-full bg-black border border-tactical-gray p-3 text-white focus:border-white outline-none rounded-sm text-lg font-bold"
                         placeholder="e.g. FRAGLAB ESPORTS"
                      />
                   </div>

                   {/* Logo Upload */}
                   <div className="space-y-3">
                      <label className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-tactical-light font-bold">
                         <Upload className="w-4 h-4" /> Agency Logo
                      </label>
                      <div className="flex items-center gap-6">
                         <div 
                            onClick={() => fileInputRef.current?.click()}
                            className="w-24 h-24 bg-black border border-dashed border-tactical-gray rounded-sm flex items-center justify-center cursor-pointer hover:bg-white/5 transition-colors relative overflow-hidden"
                         >
                            {localConfig.logoUrl ? (
                                <img src={localConfig.logoUrl} alt="Logo" className="w-full h-full object-contain p-2" />
                            ) : (
                                <span className="text-xs text-tactical-gray">Upload</span>
                            )}
                            <input type="file" ref={fileInputRef} onChange={handleLogoUpload} accept="image/*" className="hidden" />
                         </div>
                         <div className="flex-1 text-xs text-tactical-light leading-relaxed">
                            Upload a high-resolution PNG with transparency. This will replace the default Shield icon on all generated graphics.
                            <br/>
                            <button 
                                onClick={() => setLocalConfig({...localConfig, logoUrl: undefined})}
                                className="text-red-500 hover:underline mt-2"
                            >
                                Reset to Default
                            </button>
                         </div>
                      </div>
                   </div>

                   {/* Accent Color */}
                   <div className="space-y-3">
                      <label className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-tactical-light font-bold">
                         <Palette className="w-4 h-4" /> Brand Color
                      </label>
                      <div className="flex gap-3 flex-wrap">
                         {PRESET_COLORS.map(color => (
                            <button
                                key={color}
                                onClick={() => setLocalConfig({...localConfig, accentColor: color})}
                                className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${localConfig.accentColor === color ? 'border-white ring-2 ring-white/20' : 'border-transparent'}`}
                                style={{ backgroundColor: color }}
                            />
                         ))}
                         <div className="flex items-center bg-black border border-tactical-gray rounded-sm px-2">
                            <span className="text-tactical-light text-xs font-mono">#</span>
                            <input 
                                value={localConfig.accentColor.replace('#', '')}
                                onChange={(e) => setLocalConfig({...localConfig, accentColor: `#${e.target.value}`})}
                                className="bg-transparent border-none text-white text-xs font-mono w-16 p-1 focus:outline-none uppercase"
                                maxLength={6}
                            />
                         </div>
                      </div>
                   </div>
               </div>
           )}

           {activeTab === 'broadcast' && (
               <div className="space-y-8 max-w-lg">
                   {/* Tournament Name */}
                   <div className="space-y-3">
                      <label className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-tactical-light font-bold">
                         Tournament Name
                      </label>
                      <input 
                         value={localConfig.tournamentName || ''}
                         onChange={(e) => setLocalConfig({...localConfig, tournamentName: e.target.value})}
                         className="w-full bg-black border border-tactical-gray p-3 text-white focus:border-white outline-none rounded-sm text-lg font-bold"
                         placeholder="e.g. OVERALL STANDINGS"
                      />
                   </div>

                   {/* Tournament Stage */}
                   <div className="space-y-3">
                      <label className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-tactical-light font-bold">
                         Tournament Stage / Subtitle
                      </label>
                      <input 
                         value={localConfig.tournamentStage || ''}
                         onChange={(e) => setLocalConfig({...localConfig, tournamentStage: e.target.value})}
                         className="w-full bg-black border border-tactical-gray p-3 text-white focus:border-white outline-none rounded-sm text-lg font-bold"
                         placeholder="e.g. GRAND FINALS | END OF DAY 3"
                      />
                   </div>

                   {/* Publisher Logo Upload */}
                   <div className="space-y-3">
                      <label className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-tactical-light font-bold">
                         <Upload className="w-4 h-4" /> Publisher / Main Logo
                      </label>
                      <div className="flex items-center gap-6">
                         <div 
                            onClick={() => publisherLogoInputRef.current?.click()}
                            className="w-24 h-24 bg-black border border-dashed border-tactical-gray rounded-sm flex items-center justify-center cursor-pointer hover:bg-white/5 transition-colors relative overflow-hidden"
                         >
                            {localConfig.publisherLogoUrl ? (
                                <img src={localConfig.publisherLogoUrl} alt="Publisher Logo" className="w-full h-full object-contain p-2" />
                            ) : (
                                <span className="text-xs text-tactical-gray text-center">Upload<br/>Logo</span>
                            )}
                            <input type="file" ref={publisherLogoInputRef} onChange={handlePublisherLogoUpload} accept="image/*" className="hidden" />
                         </div>
                         <div className="flex-1 text-xs text-tactical-light leading-relaxed">
                            Upload the publisher or main tournament logo (e.g., BGMI, Krafton).
                            <br/>
                            <button 
                                onClick={() => setLocalConfig({...localConfig, publisherLogoUrl: undefined})}
                                className="text-red-500 hover:underline mt-2"
                            >
                                Remove Logo
                            </button>
                         </div>
                      </div>
                   </div>

                   {/* Sponsor Logos Upload */}
                   <div className="space-y-3">
                      <label className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-tactical-light font-bold">
                         <Upload className="w-4 h-4" /> Sponsor Logos (Up to 3)
                      </label>
                      <div className="flex items-center gap-4">
                         {[0, 1, 2].map((index) => (
                             <div key={index} className="flex flex-col items-center gap-2">
                                 <div 
                                    onClick={() => {
                                        const el = sponsorLogoInputRefs.current[index];
                                        if (el) el.click();
                                    }}
                                    className="w-20 h-20 bg-black border border-dashed border-tactical-gray rounded-sm flex items-center justify-center cursor-pointer hover:bg-white/5 transition-colors relative overflow-hidden"
                                 >
                                    {localConfig.sponsorLogos?.[index] ? (
                                        <img src={localConfig.sponsorLogos[index]} alt={`Sponsor ${index + 1}`} className="w-full h-full object-contain p-2" />
                                    ) : (
                                        <span className="text-[10px] text-tactical-gray text-center">Sponsor<br/>{index + 1}</span>
                                    )}
                                    <input 
                                        type="file" 
                                        ref={el => sponsorLogoInputRefs.current[index] = el} 
                                        onChange={(e) => handleSponsorLogoUpload(e, index)} 
                                        accept="image/*" 
                                        className="hidden" 
                                    />
                                 </div>
                                 {localConfig.sponsorLogos?.[index] && (
                                     <button 
                                         onClick={() => {
                                             const newSponsors = [...(localConfig.sponsorLogos || [])];
                                             newSponsors[index] = '';
                                             setLocalConfig({...localConfig, sponsorLogos: newSponsors});
                                         }}
                                         className="text-red-500 text-[10px] hover:underline"
                                     >
                                         Remove
                                     </button>
                                 )}
                             </div>
                         ))}
                      </div>
                   </div>
               </div>
           )}

           {activeTab === 'teams' && (
               <div className="flex gap-8 h-full">
                   {/* Team List Sidebar */}
                   <div className="w-64 border-r border-tactical-gray pr-4 overflow-y-auto space-y-1 custom-scrollbar">
                       {teams.map(team => (
                           <button
                               key={team.name}
                               onClick={() => setSelectedTeam(team.name)}
                               className={`w-full text-left px-3 py-2 text-sm font-bold uppercase rounded-sm transition-colors ${selectedTeam === team.name ? 'bg-tactical-red text-white' : 'text-tactical-light hover:bg-white/5 hover:text-white'}`}
                           >
                               {team.name}
                           </button>
                       ))}
                   </div>
                   
                   {/* Team Editor */}
                   <div className="flex-1">
                       {selectedTeam ? (
                           <div className="space-y-8 max-w-md">
                               <h4 className="text-2xl font-black text-white uppercase tracking-tighter">{selectedTeam}</h4>
                               
                               {/* Team Logo */}
                               <div className="space-y-3">
                                  <label className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-tactical-light font-bold">
                                     <Upload className="w-4 h-4" /> Team Logo
                                  </label>
                                  <div className="flex items-center gap-6">
                                     <div 
                                        onClick={() => teamLogoInputRef.current?.click()}
                                        className="w-24 h-24 bg-black border border-dashed border-tactical-gray rounded-sm flex items-center justify-center cursor-pointer hover:bg-white/5 transition-colors relative overflow-hidden"
                                     >
                                        {localConfig.teamBranding?.[selectedTeam]?.logoUrl ? (
                                            <img src={localConfig.teamBranding[selectedTeam].logoUrl} alt="Logo" className="w-full h-full object-contain p-2" />
                                        ) : (
                                            <span className="text-xs text-tactical-gray">Upload</span>
                                        )}
                                        <input type="file" ref={teamLogoInputRef} onChange={(e) => handleTeamLogoUpload(e, selectedTeam)} accept="image/*" className="hidden" />
                                     </div>
                                     <div className="flex-1 text-xs text-tactical-light leading-relaxed">
                                        Upload a transparent PNG logo for this team.
                                        <br/>
                                        <button 
                                            onClick={() => {
                                                const newBranding = {...localConfig.teamBranding};
                                                if (newBranding[selectedTeam]) {
                                                    delete newBranding[selectedTeam].logoUrl;
                                                }
                                                setLocalConfig({...localConfig, teamBranding: newBranding});
                                            }}
                                            className="text-red-500 hover:underline mt-2"
                                        >
                                            Remove Logo
                                        </button>
                                     </div>
                                  </div>
                               </div>

                               {/* Team Color */}
                               <div className="space-y-3">
                                  <label className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-tactical-light font-bold">
                                     <Palette className="w-4 h-4" /> Primary Color
                                  </label>
                                  <div className="flex items-center bg-black border border-tactical-gray rounded-sm px-2 w-32">
                                     <span className="text-tactical-light text-xs font-mono">#</span>
                                     <input 
                                         value={(localConfig.teamBranding?.[selectedTeam]?.primaryColor || '').replace('#', '')}
                                         onChange={(e) => {
                                             setLocalConfig(prev => ({
                                                 ...prev,
                                                 teamBranding: {
                                                     ...(prev.teamBranding || {}),
                                                     [selectedTeam]: {
                                                         ...(prev.teamBranding?.[selectedTeam] || {}),
                                                         primaryColor: `#${e.target.value}`
                                                     }
                                                 }
                                             }));
                                         }}
                                         className="bg-transparent border-none text-white text-xs font-mono w-full p-2 focus:outline-none uppercase"
                                         maxLength={6}
                                         placeholder="FFFFFF"
                                     />
                                  </div>
                               </div>
                           </div>
                       ) : (
                           <div className="h-full flex items-center justify-center text-tactical-gray text-sm font-mono">
                               Select a team to edit branding
                           </div>
                       )}
                   </div>
               </div>
           )}

           {activeTab === 'players' && (
               <div className="flex gap-8 h-full">
                   {/* Player List Sidebar */}
                   <div className="w-64 border-r border-tactical-gray pr-4 overflow-y-auto space-y-4 custom-scrollbar">
                       {teams.map(team => (
                           <div key={team.name} className="space-y-1">
                               <div className="text-[10px] font-black text-tactical-gray uppercase tracking-widest px-2 mb-2">{team.name}</div>
                               {team.players.map(player => (
                                   <button
                                       key={player.playerName}
                                       onClick={() => setSelectedPlayer({ team: team.name, player: player.playerName })}
                                       className={`w-full text-left px-3 py-2 text-sm font-bold uppercase rounded-sm transition-colors ${selectedPlayer?.player === player.playerName ? 'bg-tactical-red text-white' : 'text-tactical-light hover:bg-white/5 hover:text-white'}`}
                                   >
                                       {player.playerName}
                                   </button>
                               ))}
                           </div>
                       ))}
                   </div>
                   
                   {/* Player Editor */}
                   <div className="flex-1">
                       {selectedPlayer ? (
                           <div className="space-y-8 max-w-md">
                               <div>
                                   <h4 className="text-2xl font-black text-white uppercase tracking-tighter">{selectedPlayer.player}</h4>
                                   <div className="text-xs text-tactical-light font-mono uppercase">{selectedPlayer.team}</div>
                               </div>
                               
                               {/* Player Photo */}
                               <div className="space-y-3">
                                  <label className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-tactical-light font-bold">
                                     <User className="w-4 h-4" /> Player Photo
                                  </label>
                                  <div className="flex items-center gap-6">
                                     <div 
                                        onClick={() => playerPhotoInputRef.current?.click()}
                                        className="w-24 h-32 bg-black border border-dashed border-tactical-gray rounded-sm flex items-center justify-center cursor-pointer hover:bg-white/5 transition-colors relative overflow-hidden"
                                     >
                                        {localConfig.playerBranding?.[selectedPlayer.player]?.photoUrl ? (
                                            <img src={localConfig.playerBranding[selectedPlayer.player].photoUrl} alt="Photo" className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="text-xs text-tactical-gray">Upload</span>
                                        )}
                                        <input type="file" ref={playerPhotoInputRef} onChange={(e) => handlePlayerPhotoUpload(e, selectedPlayer.player)} accept="image/*" className="hidden" />
                                     </div>
                                     <div className="flex-1 text-xs text-tactical-light leading-relaxed">
                                        Upload a transparent PNG portrait for this player.
                                        <br/>
                                        <button 
                                            onClick={() => {
                                                const newBranding = {...localConfig.playerBranding};
                                                if (newBranding[selectedPlayer.player]) {
                                                    delete newBranding[selectedPlayer.player].photoUrl;
                                                }
                                                setLocalConfig({...localConfig, playerBranding: newBranding});
                                            }}
                                            className="text-red-500 hover:underline mt-2"
                                        >
                                            Remove Photo
                                        </button>
                                     </div>
                                  </div>
                               </div>

                               {/* Player Role */}
                               <div className="space-y-3">
                                  <label className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-tactical-light font-bold">
                                     <Shield className="w-4 h-4" /> Role
                                  </label>
                                  <input 
                                      value={localConfig.playerBranding?.[selectedPlayer.player]?.role || ''}
                                      onChange={(e) => {
                                          setLocalConfig(prev => ({
                                              ...prev,
                                              playerBranding: {
                                                  ...(prev.playerBranding || {}),
                                                  [selectedPlayer.player]: {
                                                      ...(prev.playerBranding?.[selectedPlayer.player] || {}),
                                                      role: e.target.value
                                                  }
                                              }
                                          }));
                                      }}
                                      className="w-full bg-black border border-tactical-gray p-3 text-white focus:border-white outline-none rounded-sm text-sm font-bold uppercase"
                                      placeholder="e.g. IGL, ASSAULTER, SUPPORT"
                                  />
                               </div>

                               {/* Country Code */}
                               <div className="space-y-3">
                                  <label className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-tactical-light font-bold">
                                     Country Code
                                  </label>
                                  <input 
                                      value={localConfig.playerBranding?.[selectedPlayer.player]?.countryCode || ''}
                                      onChange={(e) => {
                                          setLocalConfig(prev => ({
                                              ...prev,
                                              playerBranding: {
                                                  ...(prev.playerBranding || {}),
                                                  [selectedPlayer.player]: {
                                                      ...(prev.playerBranding?.[selectedPlayer.player] || {}),
                                                      countryCode: e.target.value.toUpperCase()
                                                  }
                                              }
                                          }));
                                      }}
                                      className="w-full bg-black border border-tactical-gray p-3 text-white focus:border-white outline-none rounded-sm text-sm font-bold uppercase"
                                      placeholder="e.g. IN, US, KR"
                                      maxLength={2}
                                  />
                               </div>

                           </div>
                       ) : (
                           <div className="h-full flex items-center justify-center text-tactical-gray text-sm font-mono">
                               Select a player to edit branding
                           </div>
                       )}
                   </div>
               </div>
           )}

        </div>

        <div className="p-6 border-t border-tactical-gray bg-black flex justify-end shrink-0">
           <button 
             onClick={() => { onSave(localConfig); onClose(); }}
             className="flex items-center gap-2 px-8 py-3 bg-white text-black font-black uppercase tracking-widest text-sm hover:bg-gray-200 transition-colors rounded-sm shadow-xl"
           >
             <Save className="w-4 h-4" /> Save Configuration
           </button>
        </div>
      </div>
    </div>
  );
};

export default AgencySettings;