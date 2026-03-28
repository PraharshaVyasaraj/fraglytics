import React from 'react';
import { X } from 'lucide-react';
import { ASSETS } from '../assets';

interface AvatarSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (avatarUrl: string) => void;
  currentAvatar: string;
}

export const AvatarSelectorModal: React.FC<AvatarSelectorModalProps> = ({ isOpen, onClose, onSelect, currentAvatar }) => {
  if (!isOpen) return null;

  const characterKeys = Object.keys(ASSETS.CHARACTERS);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-tactical-black border border-tactical-gray w-full max-w-4xl max-h-[80vh] flex flex-col rounded-lg shadow-2xl">
        <div className="flex justify-between items-center p-6 border-b border-tactical-gray">
          <h2 className="text-xl font-bold text-white uppercase tracking-widest">Select Operator Avatar</h2>
          <button onClick={onClose} className="text-tactical-light hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto grid grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-4">
          {characterKeys.map((key) => {
            const url = ASSETS.CHARACTERS[key as keyof typeof ASSETS.CHARACTERS];
            return (
              <button
                key={key}
                onClick={() => onSelect(url)}
                className={`aspect-square rounded-sm overflow-hidden border-2 transition-all ${
                  currentAvatar === url ? 'border-yellow-500 scale-105' : 'border-transparent hover:border-white/50'
                }`}
              >
                <img src={url} alt={key} className="w-full h-full object-cover object-top" referrerPolicy="no-referrer" />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
