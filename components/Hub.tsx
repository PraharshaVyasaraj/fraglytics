import React, { useRef, useState } from 'react';
import { Trophy, Plus, Upload, Calendar, Clock, Trash2, ChevronRight, Shield, Save, Edit2, Zap } from 'lucide-react';
import { Workspace, Tournament } from '../types';

interface HubProps {
  workspace: Workspace;
  onCreateTournament: () => void;
  onSelectTournament: (id: string) => void;
  onDeleteTournament: (id: string) => void;
  onLoadWorkspace: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onLoadSample: () => void;
  onSaveWorkspace: () => void;
  onRenameTournament: (id: string, newName: string) => void;
}

const Hub: React.FC<HubProps> = ({
  workspace,
  onCreateTournament,
  onSelectTournament,
  onDeleteTournament,
  onLoadWorkspace,
  onLoadSample,
  onSaveWorkspace,
  onRenameTournament
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  const handleLoadClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="min-h-screen bg-tactical-black text-tactical-white font-sans selection:bg-tactical-red selection:text-white flex flex-col">
      {/* Cinematic Header */}
      <header className="relative border-b border-tactical-gray bg-tactical-dark overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-tactical-black to-transparent"></div>
        
        <div className="relative max-w-7xl mx-auto px-6 py-16 md:py-24 flex flex-col items-center text-center z-10">
          <div className="p-4 bg-tactical-red/10 border border-tactical-red/30 rounded-full mb-6">
            <Shield className="w-12 h-12 text-tactical-red" />
          </div>
          <h1 className="text-4xl md:text-6xl font-serif font-bold text-white tracking-tight mb-4">
            FragLab <span className="text-tactical-light font-normal">Nexus</span>
          </h1>
          <p className="text-tactical-light max-w-2xl text-sm md:text-base font-mono uppercase tracking-widest">
            Local Command Center • {workspace.tournaments.length} Active Operations
          </p>
          
          <div className="flex flex-wrap justify-center gap-4 mt-10">
            <button 
              onClick={onCreateTournament}
              className="flex items-center gap-2 px-6 py-3 bg-tactical-red text-white font-bold uppercase tracking-widest text-xs rounded-sm hover:bg-red-600 transition-all shadow-lg shadow-red-900/20"
            >
              <Plus className="w-4 h-4" /> Initialize Operation
            </button>
            <button 
              onClick={onLoadSample}
              className="flex items-center gap-2 px-6 py-3 bg-tactical-dark border border-tactical-gray text-tactical-light font-bold uppercase tracking-widest text-xs rounded-sm hover:text-white hover:border-white transition-all"
            >
              <Zap className="w-4 h-4 text-tactical-red" /> Load Sample
            </button>
            <button 
              onClick={onSaveWorkspace}
              className="flex items-center gap-2 px-6 py-3 bg-tactical-dark border border-tactical-gray text-tactical-light font-bold uppercase tracking-widest text-xs rounded-sm hover:text-white hover:border-white transition-all"
            >
              <Save className="w-4 h-4" /> Save Workspace
            </button>
            <button 
              onClick={handleLoadClick}
              className="flex items-center gap-2 px-6 py-3 bg-tactical-dark border border-tactical-gray text-tactical-light font-bold uppercase tracking-widest text-xs rounded-sm hover:text-white hover:border-white transition-all"
            >
              <Upload className="w-4 h-4" /> Load Workspace
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept=".json,.fraglab-workspace,application/json"
              onChange={onLoadWorkspace}
            />
          </div>
        </div>
      </header>

      {/* Tournament Grid */}
      <main className="flex-1 max-w-7xl mx-auto px-6 py-12 w-full">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-xl font-serif font-bold text-white flex items-center gap-3">
            <Trophy className="w-5 h-5 text-tactical-light" /> 
            ACTIVE TOURNAMENTS
          </h2>
        </div>

        {workspace.tournaments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 border border-dashed border-tactical-gray rounded-sm bg-tactical-dark/50">
            <Trophy className="w-12 h-12 text-tactical-gray mb-4" />
            <p className="text-tactical-light font-mono text-sm uppercase tracking-widest">No active operations found.</p>
            <p className="text-tactical-gray text-xs mt-2">Initialize a new operation or load an existing workspace.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {workspace.tournaments.map((tournament) => (
              <div 
                key={tournament.id}
                className="group relative bg-tactical-dark border border-tactical-gray rounded-sm overflow-hidden hover:border-tactical-light transition-all flex flex-col"
              >
                <div className="p-6 flex-1">
                  <div className="flex justify-between items-start mb-4">
                    {editingId === tournament.id ? (
                      <input 
                        autoFocus
                        value={editValue}
                        onChange={e => setEditValue(e.target.value)}
                        onBlur={() => {
                          onRenameTournament(tournament.id, editValue);
                          setEditingId(null);
                        }}
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            onRenameTournament(tournament.id, editValue);
                            setEditingId(null);
                          } else if (e.key === 'Escape') {
                            setEditingId(null);
                          }
                        }}
                        className="bg-tactical-black border border-tactical-light text-white px-2 py-1 rounded text-xl font-serif font-bold w-full pr-4 outline-none mr-4"
                      />
                    ) : (
                      <div className="flex items-center gap-2 pr-4 truncate flex-1">
                        <h3 className="text-xl font-bold text-white font-serif truncate">
                          {tournament.metadata.name}
                        </h3>
                        <button 
                          onClick={() => {
                            setEditValue(tournament.metadata.name);
                            setEditingId(tournament.id);
                          }}
                          className="opacity-0 group-hover:opacity-100 p-1 text-tactical-gray hover:text-white transition-all shrink-0"
                          title="Rename Operation"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                    <div className={`px-2 py-1 rounded-sm text-[10px] font-bold uppercase tracking-widest border shrink-0 ${
                      tournament.workflowStep === 'analysis' 
                        ? 'bg-tactical-red/10 border-tactical-red/30 text-tactical-red' 
                        : 'bg-tactical-gray/20 border-tactical-gray text-tactical-light'
                    }`}>
                      {tournament.workflowStep}
                    </div>
                  </div>
                  
                  <div className="space-y-3 mb-6">
                    <div className="flex items-center gap-3 text-xs text-tactical-light font-mono">
                      <Calendar className="w-4 h-4 text-tactical-gray" />
                      <span>Created: {new Date(tournament.metadata.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-tactical-light font-mono">
                      <Clock className="w-4 h-4 text-tactical-gray" />
                      <span>Updated: {new Date(tournament.metadata.lastModified).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-tactical-light font-mono">
                      <Trophy className="w-4 h-4 text-tactical-gray" />
                      <span>Matches: {tournament.rawMatches.length}</span>
                    </div>
                  </div>
                </div>
                
                <div className="border-t border-tactical-gray p-4 bg-black/50 flex justify-between items-center">
                  <button 
                    onClick={() => onDeleteTournament(tournament.id)}
                    className="p-2 text-tactical-gray hover:text-tactical-red hover:bg-tactical-red/10 rounded-sm transition-colors"
                    title="Delete Tournament"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  
                  <button 
                    onClick={() => onSelectTournament(tournament.id)}
                    className="flex items-center gap-2 px-4 py-2 bg-white text-black text-xs font-bold uppercase tracking-widest rounded-sm hover:bg-tactical-light transition-colors"
                  >
                    Enter <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Hub;
