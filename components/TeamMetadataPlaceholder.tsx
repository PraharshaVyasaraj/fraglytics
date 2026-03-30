import React from 'react';
import { Users, MapPin, Image as ImageIcon, Settings } from 'lucide-react';

const TeamMetadataPlaceholder: React.FC = () => {
  return (
    <div className="bg-tactical-dark border border-tactical-gray p-6 rounded-sm flex flex-col items-center justify-center gap-4 text-center group hover:border-tactical-light transition-all">
      <div className="w-24 h-24 bg-black border border-tactical-gray rounded-sm flex items-center justify-center mb-2 group-hover:border-tactical-red transition-colors">
        <ImageIcon className="w-10 h-10 text-tactical-gray group-hover:text-tactical-red transition-colors" />
      </div>
      <div className="space-y-1">
        <h3 className="text-white font-bold uppercase tracking-widest text-sm">Team Logo Placeholder</h3>
        <p className="text-tactical-light text-xs font-mono">ID: TEAM_SLOT_01</p>
      </div>
      <div className="flex items-center gap-2 text-tactical-light text-xs font-mono bg-black px-3 py-1 rounded-sm border border-tactical-gray">
        <MapPin className="w-3 h-3" />
        <span>00.0000, 00.0000</span>
      </div>
      <button className="mt-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-tactical-light hover:text-white transition-colors">
        <Settings className="w-3 h-3" /> Configure Slot
      </button>
    </div>
  );
};

export default TeamMetadataPlaceholder;
