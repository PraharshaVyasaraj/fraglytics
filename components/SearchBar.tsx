import React, { useState, useEffect, useRef } from 'react';
import { Search, User, Users, X } from 'lucide-react';
import { TeamData, PlayerDerived } from '../types';

interface SearchBarProps {
  teams: TeamData[];
  onTeamClick: (team: TeamData) => void;
  onPlayerClick: (player: PlayerDerived, teamName: string) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ teams, onTeamClick, onPlayerClick }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{ type: 'team' | 'player'; name: string; teamName?: string; data: any }[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const q = query.toLowerCase();
    const teamResults = teams
      .filter(t => t.name.toLowerCase().includes(q))
      .map(t => ({ type: 'team' as const, name: t.name, data: t }));

    const playerResults: { type: 'player'; name: string; teamName: string; data: PlayerDerived }[] = [];
    teams.forEach(t => {
      t.players.forEach(p => {
        if (p.playerName.toLowerCase().includes(q)) {
          playerResults.push({ type: 'player' as const, name: p.playerName, teamName: t.name, data: p });
        }
      });
    });

    setResults([...teamResults, ...playerResults].slice(0, 8));
  }, [query, teams]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative w-full max-w-md" ref={containerRef}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-tactical-light" />
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="Search players or teams..."
          className="w-full bg-tactical-dark border border-tactical-gray rounded-sm py-2 pl-10 pr-10 text-sm text-white focus:border-tactical-red outline-none transition-all font-mono"
        />
        {query && (
          <button 
            onClick={() => setQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-tactical-light hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {isOpen && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-tactical-black border border-tactical-gray rounded-sm shadow-2xl z-[100] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="p-2 border-b border-tactical-gray bg-tactical-dark">
            <span className="text-[10px] font-bold uppercase tracking-widest text-tactical-light">Search Results</span>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {results.map((res, idx) => (
              <button
                key={`${res.type}-${res.name}-${idx}`}
                onClick={() => {
                  if (res.type === 'team') onTeamClick(res.data);
                  else onPlayerClick(res.data, res.teamName!);
                  setIsOpen(false);
                  setQuery('');
                }}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors border-b border-tactical-gray/30 last:border-0 text-left group"
              >
                <div className="p-2 bg-tactical-dark rounded-sm text-tactical-light group-hover:text-white transition-colors">
                  {res.type === 'team' ? <Users className="w-4 h-4" /> : <User className="w-4 h-4" />}
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-white">{res.name}</span>
                  <span className="text-[10px] font-mono text-tactical-light uppercase tracking-wider">
                    {res.type === 'team' ? 'Squad' : `Player • ${res.teamName}`}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchBar;
