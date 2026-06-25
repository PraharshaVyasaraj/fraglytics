import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Terminal, X, Play, AlertCircle, ChevronRight, Maximize2, Minimize2, Bookmark, Save, Info, ArrowRight, Download, FileJson, Layers, BookOpen, HelpCircle } from 'lucide-react';
import { executeFScript } from '../services/f-script';
import { Session, TeamData, MatchData } from '../types';
import { utils, writeFile } from 'xlsx';

interface FConsoleProps {
  isOpen: boolean;
  onClose: () => void;
  teams: TeamData[];
  matches: MatchData[];
}

interface CommandHistory {
  id: string;
  command: string;
  result?: any[];
  error?: string;
  timestamp: number;
  executionTimeMs?: number;
}

interface Macro {
  id: string;
  name: string;
  command: string;
}

interface TourStep {
  title: string;
  description: string;
  command: string;
}

const TOUR_STEPS: TourStep[] = [
  {
    title: "1. The Global Context",
    description: "F-Script has access to $PLAYERS, $TEAMS, and $MATCHES. Let's start by querying all players.",
    command: "emit($PLAYERS)"
  },
  {
    title: "2. Filtering Data",
    description: "Use the |> operator to pipe data into functions like filter(). Let's find players with more than 10 kills.",
    command: "emit($PLAYERS |> filter(kills > 10))"
  },
  {
    title: "3. Sorting Results",
    description: "You can chain multiple pipes. Let's sort the filtered results by damage.",
    command: "emit($PLAYERS |> filter(kills > 10) |> sort(damage, 'DESC'))"
  },
  {
    title: "4. Limiting Output",
    description: "Finally, let's just take the top 3 players from our sorted list.",
    command: "emit($PLAYERS |> filter(kills > 10) |> sort(damage, 'DESC') |> take(3))"
  }
];

const LIBRARY_TEMPLATES = [
  {
    name: 'Aggressive Rotation Heatmap',
    description: 'Finds teams with more than 20 total kills, mapping their efficiency.',
    code: `let aggressive = $TEAMS |> filter(totalFinishes > 20);\nemit(aggressive |> select(name, totalFinishes, avgSurvivalTime, killPoints));`
  },
  {
    name: 'End-Game Survival Efficiency',
    description: 'Top 10 players based on longest survival time.',
    code: `let top_survival = $PLAYERS |> sort(survivalTimeSeconds, 'DESC') |> take(10);\nemit(top_survival |> pluck(playerName, teamName, survivalTimeSeconds, kills, damage));`
  },
  {
    name: 'High-Efficiency Players (Low DPK)',
    description: 'Players who secure kills with the least amount of damage (Damage per Kill).',
    code: `let efficient = $PLAYERS |> filter(kills > 5) |> sort(dpk, 'ASC') |> take(10);\nemit(efficient |> pluck(playerName, teamName, kills, damage, dpk));`
  },
  {
    name: 'Dominant Teams Profile',
    description: 'Lists all teams that have won a match along with win rate metrics.',
    code: `let dominant = $TEAMS |> filter(isWinner == true);\nemit(dominant |> select(name, totalPoints, matchesPlayed, winRate));`
  }
];

export const FConsole: React.FC<FConsoleProps> = ({ isOpen, onClose, teams, matches }) => {
  const [history, setHistory] = useState<CommandHistory[]>([]);
  const [currentCommand, setCurrentCommand] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const endOfHistoryRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [macros, setMacros] = useState<Macro[]>([]);
  const [showMacroList, setShowMacroList] = useState(false);
  const [macroNameInput, setMacroNameInput] = useState('');
  const [isSavingMacro, setIsSavingMacro] = useState(false);
  const [isBatchMode, setIsBatchMode] = useState(false);
  const [showLibrary, setShowLibrary] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const focusInput = () => {
    if (isBatchMode) {
      setTimeout(() => textareaRef.current?.focus(), 50);
    } else {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  // Autocomplete state
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [suggestionIndex, setSuggestionIndex] = useState(0);

  // Compute all available keys and team/player names natively available in the data
  const autocompleteOptions = React.useMemo(() => {
    const options = new Set<string>();
    // Globals & Functions
    ['$TEAMS', '$PLAYERS', '$MATCHES', 'emit', 'filter', 'sort', 'take', 'limit', 'pluck', 'select', 'let'].forEach(o => options.add(o));
    
    if (teams && teams.length > 0) {
        const sampleTeam = teams[0];
        Object.keys(sampleTeam).forEach(k => options.add(k));
        if (sampleTeam.players && sampleTeam.players.length > 0) {
            Object.keys(sampleTeam.players[0]).forEach(k => options.add(k));
        }
        teams.forEach(t => {
            if (t.shortName) options.add(`"${t.shortName}"`);
            if (t.name) options.add(`"${t.name}"`);
            t.players?.forEach(p => {
                if (p.name) options.add(`"${p.name}"`);
            });
        });
    }
    return Array.from(options);
  }, [teams]);

  // Update suggestions based on user typing
  useEffect(() => {
    const match = currentCommand.match(/([a-zA-Z0-9_$"']+)$/);
    const currentWord = match ? match[1] : '';
    if (currentWord.length > 0) {
        const filtered = autocompleteOptions.filter(o => 
            o.toLowerCase().startsWith(currentWord.toLowerCase()) && 
            o !== currentWord && 
            o !== `"${currentWord}"`
        );
        setSuggestions(filtered.slice(0, 5));
        setSuggestionIndex(0);
    } else {
        setSuggestions([]);
    }
  }, [currentCommand, autocompleteOptions]);

  const applySuggestion = (suggestion: string) => {
      const match = currentCommand.match(/([a-zA-Z0-9_$"']+)$/);
      if (match) {
          const newCommand = currentCommand.substring(0, match.index) + suggestion;
          setCurrentCommand(newCommand);
      }
      setSuggestions([]);
      focusInput();
  };

  // Tour State
  const [showTour, setShowTour] = useState(false);
  const [tourStep, setTourStep] = useState(0);

  // Check initial tour state
  useEffect(() => {
    const tourSeen = localStorage.getItem('f_script_tour_seen');
    if (!tourSeen && isOpen) {
      setShowTour(true);
    }
  }, [isOpen]);

  const dismissTour = () => {
    setShowTour(false);
    localStorage.setItem('f_script_tour_seen', 'true');
  };

  const nextTourStep = () => {
    if (tourStep < TOUR_STEPS.length - 1) {
      setTourStep(prev => prev + 1);
    } else {
      dismissTour();
    }
  };

  const tryTourCommand = (command: string) => {
    setCurrentCommand(command);
    focusInput();
  };

  // Load macros from local storage
  useEffect(() => {
    const savedMacros = localStorage.getItem('f_script_macros');
    if (savedMacros) {
      try {
        setMacros(JSON.parse(savedMacros));
      } catch (e) {
        console.error("Failed to parse macros");
      }
    }
  }, []);

  // Save macros to local storage
  useEffect(() => {
    localStorage.setItem('f_script_macros', JSON.stringify(macros));
  }, [macros]);

  const saveMacro = () => {
    if (!macroNameInput.trim() || !currentCommand.trim()) return;
    
    const newMacro: Macro = {
      id: Math.random().toString(36).substr(2, 9),
      name: macroNameInput.trim(),
      command: currentCommand.trim(),
    };

    setMacros(prev => [...prev, newMacro]);
    setIsSavingMacro(false);
    setMacroNameInput('');
  };

  const executeMacro = (macro: Macro) => {
    setCurrentCommand(macro.command);
    setShowMacroList(false);
    // Focus input so user can press enter to run, or they can click run
    focusInput();
  };

  const deleteMacro = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setMacros(prev => prev.filter(m => m.id !== id));
  };


  // Auto scroll to bottom
  useEffect(() => {
    endOfHistoryRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history, isOpen]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      focusInput();
    }
  }, [isOpen, isBatchMode]);

  const exportJSON = (entry: CommandHistory) => {
    if (!entry.result || entry.result.length === 0) return;
    
    let toExport = entry.result;
    if (toExport.length === 1 && Array.isArray(toExport[0])) {
      toExport = toExport[0];
    }

    const blob = new Blob([JSON.stringify(toExport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `f_script_export_${entry.timestamp}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportCSV = (entry: CommandHistory) => {
    if (!entry.result || entry.result.length === 0) return;
    
    let toExport = entry.result;
    if (toExport.length === 1 && Array.isArray(toExport[0])) {
      toExport = toExport[0];
    }
    
    if (toExport.length === 0) return;
    
    const ws = utils.json_to_sheet(toExport);
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, "F-Script Data");
    writeFile(wb, `f_script_export_${entry.timestamp}.csv`);
  };

  const executeCommand = () => {
    if (!currentCommand.trim()) return;

    const commandStr = currentCommand;
    setCurrentCommand('');

    // Prepare session
    const session: Session = {
      id: "live-session",
      days: {},
      matches,
      teams,
    };

    const startTime = performance.now();
    const { output, error } = executeFScript(commandStr, session);
    const endTime = performance.now();
    const executionTimeMs = parseFloat((endTime - startTime).toFixed(2));

    const newEntry: CommandHistory = {
      id: Math.random().toString(36).substr(2, 9),
      command: commandStr,
      result: error ? undefined : output,
      error: error,
      timestamp: Date.now(),
      executionTimeMs,
    };

    setHistory(prev => [...prev, newEntry]);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (suggestions.length > 0) {
        e.preventDefault();
        applySuggestion(suggestions[suggestionIndex]);
      } else {
        if (isBatchMode) {
           if (e.ctrlKey || e.metaKey || e.shiftKey) {
             e.preventDefault();
             executeCommand();
           }
        } else {
           executeCommand();
        }
      }
    } else if (e.key === 'Tab') {
      if (suggestions.length > 0) {
        e.preventDefault();
        applySuggestion(suggestions[suggestionIndex]);
      }
    } else if (e.key === 'ArrowUp') {
      if (suggestions.length > 0) {
        e.preventDefault();
        setSuggestionIndex((prev) => (prev - 1 + suggestions.length) % suggestions.length);
      }
    } else if (e.key === 'ArrowDown') {
      if (suggestions.length > 0) {
        e.preventDefault();
        setSuggestionIndex((prev) => (prev + 1) % suggestions.length);
      }
    }
  };

  const renderResult = (result: any[], isError?: boolean, errorMsg?: string) => {
    if (isError) {
      return (
        <div className="text-red-400 font-mono text-xs flex items-start gap-2 mt-1 whitespace-pre-wrap">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          {errorMsg}
        </div>
      );
    }

    if (!result || result.length === 0) {
      return <div className="text-tactical-gray text-xs italic mt-1 ml-6">No output (Did you forget to use emit()?)</div>;
    }

    return (
      <div className="mt-2 space-y-2 ml-6 text-xs font-mono text-tactical-light overflow-x-auto">
        {result.map((item, index) => {
          if (Array.isArray(item)) {
            // Render array nicely (like a table or block)
            if (item.length === 0) return <div key={index}>[ Empty Collection ]</div>;
            
            // Check if objects
            if (typeof item[0] === 'object' && item[0] !== null) {
               return (
                  <div key={index} className="bg-black/50 p-2 rounded border border-tactical-gray/50 max-h-60 overflow-y-auto overflow-x-auto">
                    <pre className="text-tactical-green">{JSON.stringify(item, null, 2)}</pre>
                  </div>
               );
            }
            return <div key={index}>[{item.join(', ')}]</div>;
          }
          if (typeof item === 'object' && item !== null) {
            return (
              <div key={index} className="bg-black/50 p-2 rounded border border-tactical-gray/50">
                <pre className="text-tactical-green">{JSON.stringify(item, null, 2)}</pre>
              </div>
            );
          }
          return <div key={index}>{String(item)}</div>;
        })}
      </div>
    );
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className={`fixed bottom-4 right-4 z-[100] flex flex-col bg-[#0f0f12] border border-tactical-gray shadow-2xl rounded-sm backdrop-blur-md overflow-hidden ${
            isExpanded ? 'w-[80vw] h-[80vh]' : 'w-[500px] h-[400px]'
          } max-w-[calc(100vw-2rem)] max-h-[calc(100vh-2rem)]`}
          style={{ boxShadow: '0 0 30px rgba(0,255,204,0.1)' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-3 py-2 border-b border-tactical-gray bg-black/60 select-none">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-tactical-green" />
              <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-tactical-green">
                F-Script Engine <span className="opacity-50">| Data Vector Terminal</span>
              </span>
            </div>
            <div className="flex items-center gap-2 text-tactical-gray">
              <button onClick={() => { setShowTour(true); setTourStep(0); }} className="hover:text-tactical-green transition-colors mr-2 text-xs flex items-center gap-1" title="Interactive Quick Start">
                 <Info className="w-3.5 h-3.5" />
                 <span className="hidden sm:inline">Tour</span>
              </button>
              <button onClick={() => setIsExpanded(!isExpanded)} className="hover:text-white transition-colors">
                {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
              <button onClick={onClose} className="hover:text-tactical-red transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex-1 flex overflow-hidden">
            <div className="flex-1 flex flex-col overflow-hidden relative">
              {/* History */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <div className="space-y-1 mb-4 border-b border-tactical-gray/30 pb-4">
              <p className="text-tactical-light font-mono text-xs">FragLab Reactive Terminal [Version 1.0.0]</p>
              <p className="text-tactical-gray font-mono text-[10px]">Type F expressions and press Enter. Example: <span className="text-tactical-green">emit($PLAYERS |&gt; filter(kills &gt; 15) |&gt; sort(damage))</span></p>
            </div>
            
            {history.map((entry) => (
              <div key={entry.id} className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="flex items-center gap-2 text-tactical-light font-mono text-sm">
                  <ChevronRight className="w-4 h-4 text-tactical-gray shrink-0" />
                  <span className="text-white break-all">{entry.command}</span>
                  <div className="ml-auto flex items-center gap-2 shrink-0">
                    {!entry.error && entry.result && entry.result.length > 0 && (
                      <div className="flex items-center gap-1 mr-2 opacity-50 hover:opacity-100 transition-opacity">
                        <button onClick={() => exportJSON(entry)} title="Export JSON" className="p-1 hover:bg-tactical-gray/20 rounded text-tactical-green">
                          <FileJson className="w-3 h-3" />
                        </button>
                        <button onClick={() => exportCSV(entry)} title="Export CSV" className="p-1 hover:bg-tactical-gray/20 rounded text-tactical-green">
                          <Download className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                    {entry.executionTimeMs !== undefined && (
                      <span className="text-[10px] text-tactical-green font-mono" title={`Execution time: ${entry.executionTimeMs}ms`}>
                        {entry.executionTimeMs}ms
                      </span>
                    )}
                    <span className="text-[9px] text-tactical-gray border border-tactical-gray/30 px-1 rounded bg-black/30">
                      {new Date(entry.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
                {renderResult(entry.result || [], !!entry.error, entry.error)}
              </div>
            ))}
            <div ref={endOfHistoryRef} />
          </div>

          {/* Input Area */}
          <div className="relative p-3 bg-black/40 border-t border-tactical-gray">
            
            {/* Macro Dropdown Menu */}
            <AnimatePresence>
              {showMacroList && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute bottom-full mb-2 right-3 w-64 bg-tactical-dark border border-tactical-gray/50 rounded-sm shadow-xl z-50 overflow-hidden"
                >
                  <div className="px-3 py-2 border-b border-tactical-gray/50 bg-black/50 text-[10px] font-bold text-tactical-gray uppercase tracking-wider flex justify-between items-center">
                    Saved Macros
                    <button onClick={() => setShowMacroList(false)} className="hover:text-white"><X className="w-3 h-3" /></button>
                  </div>
                  <div className="max-h-48 overflow-y-auto p-1">
                    {macros.length === 0 ? (
                      <div className="text-center p-3 text-xs text-tactical-gray italic">No macros saved yet.</div>
                    ) : (
                      macros.map(m => (
                        <div 
                          key={m.id}
                          className="flex items-center justify-between p-2 hover:bg-tactical-gray/20 rounded cursor-pointer group"
                          onClick={() => executeMacro(m)}
                        >
                          <div className="overflow-hidden">
                            <div className="text-tactical-green font-mono text-xs font-bold truncate">{m.name}</div>
                            <div className="text-tactical-light font-mono text-[10px] truncate opacity-50">{m.command}</div>
                          </div>
                          <button 
                            onClick={(e) => deleteMacro(m.id, e)}
                            className="text-tactical-gray hover:text-tactical-red opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Delete Macro"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Tour Popover */}
            <AnimatePresence>
              {showTour && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="absolute bottom-full mb-3 left-3 right-3 bg-tactical-dark border border-tactical-green/30 shadow-[0_4px_20px_rgba(0,255,204,0.15)] rounded-sm overflow-hidden z-40"
                >
                  <div className="flex bg-black/60 px-3 py-2 border-b border-tactical-green/20 items-center justify-between">
                    <div className="flex items-center gap-2 text-tactical-green font-bold text-xs uppercase tracking-wider">
                      <Info className="w-3.5 h-3.5" />
                      Interactive Quick Start ({tourStep + 1}/{TOUR_STEPS.length})
                    </div>
                    <button onClick={dismissTour} className="text-tactical-gray hover:text-white transition-colors">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="p-3">
                    <h4 className="text-white text-sm font-bold mb-1">{TOUR_STEPS[tourStep].title}</h4>
                    <p className="text-tactical-gray text-xs mb-3 leading-relaxed">{TOUR_STEPS[tourStep].description}</p>
                    <div className="flex items-center justify-between mt-2 pt-3 border-t border-tactical-gray/20">
                      <button 
                        onClick={() => tryTourCommand(TOUR_STEPS[tourStep].command)}
                        className="text-xs bg-tactical-green/10 hover:bg-tactical-green/30 text-tactical-green border border-tactical-green/30 px-3 py-1.5 rounded-sm font-mono flex items-center gap-2 transition-colors"
                      >
                        Try it: {TOUR_STEPS[tourStep].command}
                      </button>
                      
                      <button 
                        onClick={nextTourStep}
                        className="text-xs text-white bg-tactical-gray/20 hover:bg-tactical-gray/40 px-3 py-1.5 rounded-sm flex items-center gap-1 transition-colors"
                      >
                        {tourStep < TOUR_STEPS.length - 1 ? 'Next Step' : 'Finish Tour'}
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Save Macro Popover/Inline Row */}
            <AnimatePresence>
              {isSavingMacro && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-2 flex items-center gap-2 overflow-hidden"
                >
                  <div className="flex bg-tactical-dark border border-tactical-gray/50 rounded-sm overflow-hidden flex-1 max-w-sm">
                    <input
                      type="text"
                      value={macroNameInput}
                      onChange={(e) => setMacroNameInput(e.target.value)}
                      placeholder="Macro Name (e.g. 'Top Fraggers')"
                      className="bg-transparent text-white text-xs px-2 py-1 outline-none flex-1 font-mono"
                      autoFocus
                      onKeyDown={(e) => e.key === 'Enter' && saveMacro()}
                    />
                    <button 
                      onClick={saveMacro}
                      disabled={!macroNameInput.trim()}
                      className="bg-tactical-green/20 hover:bg-tactical-green/40 text-tactical-green px-3 text-xs font-bold transition-colors disabled:opacity-50"
                    >
                      SAVE
                    </button>
                    <button 
                      onClick={() => setIsSavingMacro(false)}
                      className="bg-tactical-gray/20 hover:bg-tactical-red/20 hover:text-tactical-red text-tactical-gray px-2 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="relative flex items-center gap-2 bg-tactical-dark border border-tactical-gray/50 rounded-sm px-2 focus-within:border-tactical-green transition-colors">
              <span className="text-tactical-green font-mono font-bold select-none">&gt;&gt;</span>
              
              {/* Autocomplete Popup */}
              <AnimatePresence>
                  {suggestions.length > 0 && (
                      <motion.div 
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 5 }}
                          className="absolute bottom-full left-0 mb-1 w-64 bg-tactical-dark border border-tactical-gray/50 rounded-sm shadow-lg overflow-hidden z-20"
                      >
                          {suggestions.map((suggestion, idx) => (
                              <div
                                  key={suggestion}
                                  onClick={() => applySuggestion(suggestion)}
                                  className={`px-3 py-1.5 font-mono text-xs cursor-pointer ${
                                      idx === suggestionIndex 
                                          ? 'bg-tactical-green/20 text-tactical-green border-l-2 border-tactical-green pl-2.5' 
                                          : 'text-tactical-light hover:bg-tactical-gray/20 border-l-2 border-transparent pl-2.5'
                                  }`}
                              >
                                  {suggestion}
                              </div>
                          ))}
                      </motion.div>
                  )}
              </AnimatePresence>

              {isBatchMode ? (
                <textarea
                  ref={textareaRef}
                  value={currentCommand}
                  onChange={(e) => setCurrentCommand(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Enter multi-line F script... (Ctrl+Enter to run)"
                  className="flex-1 bg-transparent text-white font-mono text-sm py-2 px-1 focus:outline-none placeholder:text-tactical-gray/50 resize-none min-h-[5rem]"
                  spellCheck={false}
                />
              ) : (
                <input
                  ref={inputRef}
                  type="text"
                  value={currentCommand}
                  onChange={(e) => setCurrentCommand(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Enter F script..."
                  className="flex-1 bg-transparent text-white font-mono text-sm py-2 px-1 focus:outline-none placeholder:text-tactical-gray/50"
                  spellCheck={false}
                  autoComplete="off"
                />
              )}
              
              {/* Macro Actions */}
              <div className="flex items-start gap-1 border-l border-tactical-gray/30 pl-2 self-stretch pt-1">
                <button
                  onClick={() => setIsBatchMode(!isBatchMode)}
                  className={`p-1.5 transition-colors rounded ${isBatchMode ? 'bg-tactical-green/20 text-tactical-green' : 'text-tactical-gray hover:text-tactical-light hover:bg-tactical-gray/20'}`}
                  title="Toggle Batch Mode"
                >
                  <Layers className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setShowMacroList(!showMacroList)}
                  className={`p-1.5 transition-colors rounded ${showMacroList ? 'bg-tactical-green/20 text-tactical-green' : 'text-tactical-gray hover:text-tactical-light hover:bg-tactical-gray/20'}`}
                  title="Saved Macros"
                >
                  <Bookmark className="w-4 h-4" />
                </button>
                <button
                  onClick={() => { setShowLibrary(false); setShowHelp(!showHelp); }}
                  className={`p-1.5 transition-colors rounded ${showHelp ? 'bg-tactical-green/20 text-tactical-green' : 'text-tactical-gray hover:text-tactical-light hover:bg-tactical-gray/20'}`}
                  title="F-Script Help & Reference"
                >
                  <HelpCircle className="w-4 h-4" />
                </button>
                <button
                  onClick={() => { setShowHelp(false); setShowLibrary(!showLibrary); }}
                  className={`p-1.5 transition-colors rounded ${showLibrary ? 'bg-tactical-green/20 text-tactical-green' : 'text-tactical-gray hover:text-tactical-light hover:bg-tactical-gray/20'}`}
                  title="Template Library"
                >
                  <BookOpen className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setIsSavingMacro(true)}
                  disabled={!currentCommand.trim()}
                  className="p-1.5 text-tactical-gray hover:text-tactical-green hover:bg-tactical-green/10 transition-colors rounded disabled:opacity-50"
                  title="Save current script as Macro"
                >
                  <Save className="w-4 h-4" />
                </button>
                <button 
                  onClick={executeCommand}
                  disabled={!currentCommand.trim()}
                  className="p-1.5 text-tactical-gray hover:text-tactical-green disabled:opacity-50 transition-colors ml-1"
                >
                  <Play className="w-4 h-4 fill-current" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Library Pane */}
        {showLibrary && (
           <div className="w-64 lg:w-72 border-l border-tactical-gray/40 bg-tactical-dark flex flex-col overflow-hidden shrink-0">
              <div className="px-3 py-2 border-b border-tactical-gray/30 bg-black/50 text-[10px] font-bold text-tactical-green uppercase tracking-wider flex justify-between items-center">
                 Template Library
                 <button onClick={() => setShowLibrary(false)} className="hover:text-white"><X className="w-3 h-3" /></button>
              </div>
              <div className="flex-1 overflow-y-auto p-2 space-y-2">
                 {LIBRARY_TEMPLATES.map((tpl, i) => (
                    <div 
                      key={i}
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData('text/plain', tpl.code);
                      }}
                      onClick={() => {
                         setCurrentCommand(prev => prev ? prev + '\n' + tpl.code : tpl.code);
                         if (!isBatchMode && tpl.code.includes('\n')) setIsBatchMode(true);
                         focusInput();
                      }}
                      className="p-2 border border-tactical-gray/30 rounded-sm bg-black/30 hover:bg-tactical-gray/20 hover:border-tactical-green/50 cursor-grab active:cursor-grabbing transition-colors"
                      title="Click to insert, or drag into input box"
                    >
                       <div className="text-tactical-green text-xs font-bold mb-1">{tpl.name}</div>
                       <div className="text-tactical-light text-[10px] mb-2 leading-tight opacity-80">{tpl.description}</div>
                       <div className="bg-black/50 p-1.5 rounded border border-tactical-gray/20 font-mono text-[9px] text-tactical-gray whitespace-pre-wrap truncate max-h-16 overflow-hidden">
                           {tpl.code}
                       </div>
                    </div>
                 ))}
              </div>
           </div>
        )}

        {/* Help Pane */}
        {showHelp && (
           <div className="w-64 lg:w-80 border-l border-tactical-gray/40 bg-tactical-dark flex flex-col overflow-hidden shrink-0">
              <div className="px-3 py-2 border-b border-tactical-gray/30 bg-black/50 text-[10px] font-bold text-tactical-green uppercase tracking-wider flex justify-between items-center">
                 F-Script Reference
                 <button onClick={() => setShowHelp(false)} className="hover:text-white"><X className="w-3 h-3" /></button>
              </div>
              <div className="flex-1 overflow-y-auto p-3 space-y-4 text-xs text-tactical-light">
                 <div>
                    <h3 className="text-tactical-green font-bold mb-1 uppercase tracking-wider text-[10px]">Globals</h3>
                    <ul className="space-y-1 list-disc list-inside text-tactical-gray font-mono text-[10px]">
                       <li><span className="text-white">$TEAMS</span>: Array of all loaded teams</li>
                       <li><span className="text-white">$PLAYERS</span>: Array of all loaded players</li>
                       <li><span className="text-white">$MATCHES</span>: Array of all loaded matches</li>
                    </ul>
                 </div>
                 
                 <div>
                    <h3 className="text-tactical-green font-bold mb-1 uppercase tracking-wider text-[10px]">Core Operators</h3>
                    <ul className="space-y-1 list-disc list-inside text-tactical-gray font-mono text-[10px]">
                       <li><span className="text-white">|&gt;</span>: Pipe operator, passes result to next function</li>
                       <li><span className="text-white">emit(x)</span>: Standard output function</li>
                       <li><span className="text-white">let x = y</span>: Variable assignment</li>
                    </ul>
                 </div>

                 <div>
                    <h3 className="text-tactical-green font-bold mb-1 uppercase tracking-wider text-[10px]">Pipe Functions</h3>
                    <div className="space-y-2">
                       <div className="p-1.5 bg-black/30 border border-tactical-gray/30 rounded-sm">
                          <code className="text-tactical-green text-[10px]">filter(cond)</code>
                          <p className="text-[10px] text-tactical-gray mt-1">Keeps items matching condition.<br/>Eg: <span className="text-white">filter(kills &gt; 5)</span></p>
                       </div>
                       <div className="p-1.5 bg-black/30 border border-tactical-gray/30 rounded-sm">
                          <code className="text-tactical-green text-[10px]">sort(prop, dir)</code>
                          <p className="text-[10px] text-tactical-gray mt-1">Sorts by property.<br/>Eg: <span className="text-white">sort(damage, 'DESC')</span></p>
                       </div>
                       <div className="p-1.5 bg-black/30 border border-tactical-gray/30 rounded-sm">
                          <code className="text-tactical-green text-[10px]">pluck(...props)</code>
                          <p className="text-[10px] text-tactical-gray mt-1">Picks specific properties as an array structure.<br/>Eg: <span className="text-white">pluck(name, kills)</span></p>
                       </div>
                       <div className="p-1.5 bg-black/30 border border-tactical-gray/30 rounded-sm">
                          <code className="text-tactical-green text-[10px]">select(...props)</code>
                          <p className="text-[10px] text-tactical-gray mt-1">Similar to pluck, preserves object structure.<br/>Eg: <span className="text-white">select(name)</span></p>
                       </div>
                       <div className="p-1.5 bg-black/30 border border-tactical-gray/30 rounded-sm">
                          <code className="text-tactical-green text-[10px]">take(n)</code>
                          <p className="text-[10px] text-tactical-gray mt-1">Limits results to Top N.<br/>Eg: <span className="text-white">take(10)</span></p>
                       </div>
                    </div>
                 </div>

              </div>
           </div>
        )}
      </div>
      </motion.div>
      )}
    </AnimatePresence>
  );
};

export default FConsole;
