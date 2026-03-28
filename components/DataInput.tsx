import React, { useState, useRef, useEffect, useMemo } from 'react';
import { TeamMatchStats, MatchData, PlayerAtomic } from '../types';
import { parseRawData, extractScoreboardImages } from '../services/gemini';
import { calculateMatchStats, applySlotMapping, DEFAULT_SCORING_RULES } from '../services/analyticsEngine';
import { Loader2, Database, ScanLine, Upload, X, Layers, PlayCircle, Plus, Calendar, Sword, FileSpreadsheet, Download, FileText, CheckCircle2, AlertCircle, Lock, Table as TableIcon, Grid, Eraser, Trash2, Copy, Users, RotateCcw, ClipboardList, Save, Wand2, Merge, ArrowRight, CheckSquare, Square, Calculator, Redo, Undo, RefreshCw, FileStack, Globe } from 'lucide-react';

interface DataInputProps {
  initialData?: MatchData[];
  onDataLoaded: (matches: MatchData[]) => void;
  onLoading: (isLoading: boolean, message: string) => void;
  mode: 'manual' | 'auto';
  initialDay?: number;
  initialMatch?: number;
  readOnly?: boolean; // NEW: Snapshot Mode support
}

interface QueuedImage {
  id: string;
  file: File;
  status: 'waiting' | 'processing' | 'done' | 'error';
  preview: string;
  day: number;
  matchInDay: number;
}

interface GridRow {
  rank: string; // Team Rank
  team: string;
  playerRank: string; // Individual Player Position
  player: string;
  kills: string;
  assists: string;
  damage: string;
  time: string;
  adjustment: string; // Manual Points (+/-)
}

interface InputCacheEntry {
  aiText: string;
  csvText: string;
  gridRows: GridRow[];
  slotListText: string;
}

// Helper for ID generation
const getMatchId = (day: number, match: number) => `d${day}-m${match}`;

const formatSecondsToMMSS = (seconds: number): string => {
  if (!seconds) return "00:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

const DataInput: React.FC<DataInputProps> = ({ initialData, onDataLoaded, onLoading, mode, initialDay, initialMatch, readOnly = false }) => {
  const [activeInputType, setActiveInputType] = useState<'paste' | 'ocr' | 'csv' | 'master_csv' | 'grid'>('grid');
  
  // Per-match input cache
  const [inputCache, setInputCache] = useState<Record<string, InputCacheEntry>>({});
  const [masterCsvText, setMasterCsvText] = useState('');

  const [isProcessing, setIsProcessing] = useState(false);
  
  // History State
  const [gridUndoStack, setGridUndoStack] = useState<Record<string, GridRow[][]>>({});
  const [gridRedoStack, setGridRedoStack] = useState<Record<string, GridRow[][]>>({});
  
  // Selection State
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());
  const [bulkField, setBulkField] = useState<keyof GridRow>('kills');
  const [bulkValue, setBulkValue] = useState('');

  // Hierarchy State: Day -> Match -> Teams(TeamMatchStats)
  const [tournamentData, setTournamentData] = useState<Record<number, Record<number, TeamMatchStats[]>>>({
    1: { 1: [] }
  });

  const [activeDay, setActiveDay] = useState<number>(1);
  const [activeMatch, setActiveMatch] = useState<number>(1);

  // Modals
  const [isSlotMapOpen, setIsSlotMapOpen] = useState(false);
  const [isStandardizeOpen, setIsStandardizeOpen] = useState(false);
  const [standardizeScope, setStandardizeScope] = useState<'current' | 'global'>('current');
  
  // Batch OCR State
  const [imageQueue, setImageQueue] = useState<QueuedImage[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- HYDRATION LOGIC ---
  useEffect(() => {
    if (initialData && initialData.length > 0) {
      const newData: Record<number, Record<number, TeamMatchStats[]>> = {};
      const newCacheUpdate: Record<string, InputCacheEntry> = {};
      
      let maxDay = 1;
      let lastMatch = 1;

      initialData.forEach(match => {
        if (!newData[match.day]) newData[match.day] = {};
        newData[match.day][match.matchInDay] = match.teams;
        
        // Also hydrate grid rows from existing data so user can edit them
        const matchId = getMatchId(match.day, match.matchInDay);
        const rows: GridRow[] = [];
        match.teams.forEach(t => {
            t.players.forEach(p => {
                rows.push({
                    rank: t.rank.toString(),
                    team: t.teamName,
                    playerRank: p.individualRank ? p.individualRank.toString() : '',
                    player: p.playerName,
                    kills: p.kills.toString(),
                    assists: p.assists.toString(),
                    damage: p.damage.toString(),
                    time: formatSecondsToMMSS(p.survivalTimeSeconds),
                    adjustment: (p.manualPoints || 0).toString()
                });
            });
        });
        // Pad
        while(rows.length < 10) rows.push({ rank: '', team: '', playerRank: '', player: '', kills: '', assists: '', damage: '', time: '', adjustment: '' });
        
        // Store in accumulator
        newCacheUpdate[matchId] = { 
            aiText: '', 
            csvText: '', 
            slotListText: '', 
            gridRows: rows 
        };

        if (match.day > maxDay) maxDay = match.day;
        if (match.day === maxDay && match.matchInDay > lastMatch) lastMatch = match.matchInDay;
        else if (match.day > maxDay) lastMatch = match.matchInDay;
      });

      setTournamentData(newData);
      
      // Batch update cache to ensure all matches are populated
      setInputCache(prev => ({
          ...prev,
          ...newCacheUpdate
      }));
      
      if (initialDay && initialMatch) {
          setActiveDay(initialDay);
          setActiveMatch(initialMatch);
      } else {
          setActiveDay(maxDay);
          setActiveMatch(lastMatch);
      }
    }
  }, [initialData, initialDay, initialMatch]);

  // Reset Selection on match change
  useEffect(() => {
    setSelectedIndices(new Set());
    setBulkValue('');
  }, [activeDay, activeMatch]);

  // --- Computed Helpers ---
  const currentMatchId = getMatchId(activeDay, activeMatch);
  
  const currentAiText = inputCache[currentMatchId]?.aiText || '';
  const currentCsvText = inputCache[currentMatchId]?.csvText || '';
  const currentGridRows = inputCache[currentMatchId]?.gridRows || Array(16).fill({ rank: '', team: '', playerRank: '', player: '', kills: '', assists: '', damage: '', time: '', adjustment: '' });
  const currentSlotListText = inputCache[currentMatchId]?.slotListText || '';

  const currentSlotMap = useMemo(() => {
    const map: Record<number, string> = {};
    const lines = currentSlotListText.split('\n');
    lines.forEach(line => {
      const match = line.match(/^(\d+)[\.\-\s]+(.+)$/);
      if (match) {
        map[parseInt(match[1])] = match[2].trim();
      }
    });
    return map;
  }, [currentSlotListText]);

  // Unique Teams for Standardization (Scoped)
  const standardizationTargets = useMemo(() => {
    const targets = new Map<string, number>();

    if (standardizeScope === 'current') {
        currentGridRows.forEach(r => {
            if (r.team?.trim()) {
                const t = r.team.trim();
                targets.set(t, (targets.get(t) || 0) + 1);
            }
        });
    } else {
        // Global: Scan tournamentData (Committed)
        Object.values(tournamentData).forEach(day => {
            Object.values(day).forEach(teams => {
                teams.forEach(t => {
                    const name = t.teamName.trim();
                    targets.set(name, (targets.get(name) || 0) + 1);
                });
            });
        });
        // Global: Scan inputCache (Uncommitted Grid)
        Object.values(inputCache).forEach((cache) => {
             (cache as InputCacheEntry).gridRows.forEach(r => {
                 if (r.team?.trim()) {
                     const t = r.team.trim();
                     targets.set(t, (targets.get(t) || 0) + 1);
                 }
             });
        });
    }
    
    return Array.from(targets.entries()).sort((a,b) => a[0].localeCompare(b[0])); // [name, count][]
  }, [standardizeScope, currentGridRows, tournamentData, inputCache]);

  const uniqueTeamsInGrid = useMemo(() => {
      const teams = new Set<string>();
      currentGridRows.forEach(r => {
          if (r.team?.trim()) teams.add(r.team.trim());
      });
      return Array.from(teams).sort();
  }, [currentGridRows]);

  const suggestions = useMemo(() => {
    const teams = new Set<string>();
    const players = new Set<string>();

    Object.values(tournamentData).forEach(day => {
        Object.values(day).forEach(matchTeams => {
            matchTeams.forEach(t => {
                teams.add(t.teamName);
                t.players.forEach(p => players.add(p.playerName));
            });
        });
    });

    return {
        teams: Array.from(teams).sort(),
        players: Array.from(players).sort()
    };
  }, [tournamentData]);

  const updateCache = (type: 'aiText' | 'csvText' | 'gridRows' | 'slotListText', value: any) => {
      if (readOnly) return;
      setInputCache(prev => ({
          ...prev,
          [currentMatchId]: {
              ...(prev[currentMatchId] || { aiText: '', csvText: '', gridRows: Array(16).fill({ rank: '', team: '', playerRank: '', player: '', kills: '', assists: '', damage: '', time: '', adjustment: '' }), slotListText: '' }),
              [type]: value
          }
      }));
  };

  const days = Object.keys(tournamentData).map(Number).sort((a, b) => a - b);
  const matchesInActiveDay = Object.keys(tournamentData[activeDay] || {}).map(Number).sort((a, b) => a - b);
  
  const totalMatches = days.reduce((acc, d) => acc + Object.keys(tournamentData[d]).length, 0);

  // --- Logic Methods ---

  const addDay = () => {
    if (readOnly) return;
    const newDay = Math.max(...days) + 1;
    setTournamentData(prev => ({ ...prev, [newDay]: { 1: [] } }));
    setActiveDay(newDay);
    setActiveMatch(1);
  };

  const deleteDay = (dayToDelete: number) => {
    if (readOnly) return;
    if (days.length <= 1) return;
    let newActiveDay = activeDay;
    if (activeDay === dayToDelete) {
        const otherDays = days.filter(d => d !== dayToDelete);
        newActiveDay = otherDays[otherDays.length - 1];
    }
    setTournamentData(prev => {
        const next = { ...prev };
        delete next[dayToDelete];
        return next;
    });
    if (activeDay === dayToDelete) {
        setActiveDay(newActiveDay);
        const matches = Object.keys(tournamentData[newActiveDay] || {}).map(Number).sort((a,b) => a-b);
        setActiveMatch(matches[0] || 1);
    }
  };

  const addMatchToDay = (day: number) => {
    if (readOnly) return;
    const existingMatches = Object.keys(tournamentData[day]).map(Number);
    const newMatch = Math.max(...existingMatches) + 1;
    setTournamentData(prev => ({
        ...prev,
        [day]: { ...prev[day], [newMatch]: [] }
    }));
    setActiveMatch(newMatch);
  };

  const deleteMatch = (day: number, matchToDelete: number) => {
    if (readOnly) return;
    const existingMatches = Object.keys(tournamentData[day]).map(Number);
    if (existingMatches.length <= 1) return;
    let newActiveMatch = activeMatch;
    if (activeMatch === matchToDelete) {
        const otherMatches = existingMatches.filter(m => m !== matchToDelete);
        newActiveMatch = otherMatches[otherMatches.length - 1];
    }
    setTournamentData(prev => {
        const dayData = { ...prev[day] };
        delete dayData[matchToDelete];
        return { ...prev, [day]: dayData };
    });
    if (activeMatch === matchToDelete) {
        setActiveMatch(newActiveMatch);
    }
  };

  const updateMatchData = (day: number, match: number, newData: TeamMatchStats[]) => {
    if (readOnly) return;
    setTournamentData(prev => ({
        ...prev,
        [day]: { ...prev[day], [match]: newData }
    }));
  };

  // --- HISTORY SYSTEM ---

  const pushToHistory = () => {
      setGridUndoStack(prev => {
          const currentStack = prev[currentMatchId] || [];
          const newStack = [...currentStack, [...currentGridRows]].slice(-20);
          return { ...prev, [currentMatchId]: newStack };
      });
      setGridRedoStack(prev => {
          const next = { ...prev };
          delete next[currentMatchId];
          return next;
      });
  };

  const handleUndoGrid = () => {
      if (readOnly) return;
      const currentStack = gridUndoStack[currentMatchId];
      if (currentStack && currentStack.length > 0) {
          const prevState = currentStack[currentStack.length - 1];
          const newStack = currentStack.slice(0, -1);
          setGridRedoStack(prev => ({ ...prev, [currentMatchId]: [...(prev[currentMatchId] || []), [...currentGridRows]] }));
          setGridUndoStack(prev => ({ ...prev, [currentMatchId]: newStack }));
          updateCache('gridRows', prevState);
      }
  };

  const handleRedoGrid = () => {
      if (readOnly) return;
      const currentStack = gridRedoStack[currentMatchId];
      if (currentStack && currentStack.length > 0) {
          const nextState = currentStack[currentStack.length - 1];
          const newRedoStack = currentStack.slice(0, -1);
          setGridUndoStack(prev => ({ ...prev, [currentMatchId]: [...(prev[currentMatchId] || []), [...currentGridRows]] }));
          setGridRedoStack(prev => ({ ...prev, [currentMatchId]: newRedoStack }));
          updateCache('gridRows', nextState);
      }
  };

  // --- GRID INTERACTION with AUTO-CONSISTENCY ---

  const handleGridChange = (index: number, field: keyof GridRow, value: string) => {
      if (readOnly) return;
      
      let newRows = [...currentGridRows];
      newRows[index] = { ...newRows[index], [field]: value };

      // --- TACTICAL CONSISTENCY ENGINE ---
      const currentRank = newRows[index].rank;

      if (currentRank && currentRank.trim() !== '') {
          // Rule 1: If Team Name changed, propagate to all players with same Rank
          if (field === 'team') {
              newRows = newRows.map(row => 
                  row.rank === currentRank ? { ...row, team: value } : row
              );
          }
          // Rule 2: If Rank changed, inherit Team Name from that Rank group (if it exists)
          else if (field === 'rank') {
              // Find any sibling with the same rank that has a valid team name
              const sibling = newRows.find(r => r.rank === value && r.team && r.team.trim() !== '');
              if (sibling) {
                  newRows[index] = { ...newRows[index], team: sibling.team };
              }
          }
      }

      updateCache('gridRows', newRows);
  };

  const handleGridPaste = (e: React.ClipboardEvent, startRowIndex: number, startColKey: keyof GridRow) => {
    if (readOnly) return;
    e.preventDefault();
    const clipboardData = e.clipboardData.getData('text');
    if (!clipboardData) return;
    pushToHistory();
    const rows = clipboardData.split(/\r\n|\n|\r/).filter(row => row.trim() !== '');
    
    const keys: (keyof GridRow)[] = ['rank', 'team', 'playerRank', 'player', 'kills', 'assists', 'damage', 'time', 'adjustment'];
    const startColIndex = keys.indexOf(startColKey);
    const newRows = [...currentGridRows];
    
    // Ensure we have enough rows
    while (newRows.length < startRowIndex + rows.length) {
        newRows.push({ rank: '', team: '', playerRank: '', player: '', kills: '', assists: '', damage: '', time: '', adjustment: '' });
    }

    // Apply Paste
    rows.forEach((row, rIdx) => {
        const targetRowIdx = startRowIndex + rIdx;
        const cells = row.split('\t'); 
        cells.forEach((cell, cIdx) => {
            const targetColIndex = startColIndex + cIdx;
            if (targetColIndex < keys.length) {
                const key = keys[targetColIndex];
                newRows[targetRowIdx] = { ...newRows[targetRowIdx], [key]: cell.trim() };
            }
        });
    });

    // --- POST-PASTE CONSISTENCY CHECK ---
    // Group by Rank and unify Team Names based on the pasted content
    const rankTeamMap = new Map<string, string>();
    
    // 1. Identify valid Team Names for each Rank in the new dataset
    // We prioritize the most frequent name or just the first valid one found
    newRows.forEach(row => {
        if(row.rank && row.rank.trim() && row.team && row.team.trim()) {
            // If map doesn't have it, set it. 
            // In a more complex version we could count frequency, but first-found usually works for pasted blocks
            if (!rankTeamMap.has(row.rank.trim())) {
                rankTeamMap.set(row.rank.trim(), row.team.trim());
            }
        }
    });

    // 2. Apply the map to ensure consistency
    const consistentRows = newRows.map(row => {
        if (row.rank && row.rank.trim() && rankTeamMap.has(row.rank.trim())) {
            const standardName = rankTeamMap.get(row.rank.trim())!;
            if (row.team !== standardName) {
                return { ...row, team: standardName };
            }
        }
        return row;
    });

    updateCache('gridRows', consistentRows);
  };

  // --- GRID MANIPULATION ---

  const toggleRowSelection = (index: number) => {
      setSelectedIndices(prev => {
          const next = new Set(prev);
          if (next.has(index)) next.delete(index);
          else next.add(index);
          return next;
      });
  };

  const toggleAllRows = () => {
      if (selectedIndices.size === currentGridRows.length) setSelectedIndices(new Set());
      else setSelectedIndices(new Set(currentGridRows.map((_, i) => i)));
  };

  const applyBulkEdit = () => {
      if (readOnly) return;
      if (selectedIndices.size === 0) return;
      pushToHistory();
      const newRows = [...currentGridRows];
      const opRegex = /^([\+\-\*\/])\s*([\d\.]+)$/; 
      const match = bulkValue.trim().match(opRegex);
      selectedIndices.forEach(idx => {
          let newVal = bulkValue;
          const currentValStr = newRows[idx][bulkField];
          if (['kills', 'assists', 'damage', 'adjustment', 'rank', 'playerRank'].includes(bulkField) && match) {
              const op = match[1];
              const operand = parseFloat(match[2]);
              const currentNum = parseFloat(currentValStr) || 0;
              if (!isNaN(operand)) {
                  let result = currentNum;
                  if (op === '+') result += operand;
                  if (op === '-') result -= operand;
                  if (op === '*') result *= operand;
                  if (op === '/') result /= operand;
                  newVal = Math.round(result).toString();
              }
          }
          newRows[idx] = { ...newRows[idx], [bulkField]: newVal };
      });
      updateCache('gridRows', newRows);
      setBulkValue(''); 
  };

  const handleCloneRoster = () => {
    if (readOnly) return;
    const sourceData = tournamentData[1]?.[1];
    if (!sourceData || sourceData.length === 0) {
        alert("No data found in Day 1 / Match 1 to clone.");
        return;
    }
    pushToHistory();
    const newRows: GridRow[] = [];
    sourceData.forEach(team => {
        team.players.forEach(p => {
            newRows.push({
                rank: '', 
                team: team.teamName,
                playerRank: '',
                player: p.playerName,
                kills: '0',
                assists: '0',
                damage: '0',
                time: '0',
                adjustment: '0'
            });
        });
    });
    while(newRows.length < 16) newRows.push({ rank: '', team: '', playerRank: '', player: '', kills: '', assists: '', damage: '', time: '', adjustment: '' });
    updateCache('gridRows', newRows);
  };

  const handleConsolidateDuplicates = () => {
      if (readOnly) return;
      pushToHistory();
      const map = new Map<string, GridRow>();
      currentGridRows.forEach(row => {
        const tName = row.team || '';
        const pName = row.player || '';
        
        if(!pName.trim() && !tName.trim()) return;
        
        const key = `${tName.trim().toLowerCase()}-${pName.trim().toLowerCase()}`;
        if(map.has(key)) {
             const existing = map.get(key)!;
             const newKills = (parseInt(existing.kills)||0) + (parseInt(row.kills)||0);
             const newAssists = (parseInt(existing.assists)||0) + (parseInt(row.assists)||0);
             const newDmg = (parseInt(existing.damage)||0) + (parseInt(row.damage)||0);
             const newAdj = (parseInt(existing.adjustment)||0) + (parseInt(row.adjustment)||0);
             map.set(key, { ...existing, kills: newKills.toString(), assists: newAssists.toString(), damage: newDmg.toString(), rank: existing.rank || row.rank, adjustment: newAdj.toString() });
        } else {
            map.set(key, row);
        }
      });
      const mergedRows = Array.from(map.values());
      while(mergedRows.length < 16) mergedRows.push({ rank: '', team: '', playerRank: '', player: '', kills: '', assists: '', damage: '', time: '', adjustment: '' });
      updateCache('gridRows', mergedRows);
  };

  const handleApplyTeamNames = (nameMap: Record<string, string>) => {
      if (readOnly) return;
      
      if (standardizeScope === 'current') {
          // Local Only
          pushToHistory();
          const newRows = currentGridRows.map(row => {
              if (row.team && row.team.trim() && nameMap[row.team.trim()]) return { ...row, team: nameMap[row.team.trim()] };
              return row;
          });
          updateCache('gridRows', newRows);
      } else {
          // Global Application
          // 1. Update Tournament Data (Committed)
          const newTournamentData = { ...tournamentData };
          Object.keys(newTournamentData).forEach(d => {
              const day = parseInt(d);
              Object.keys(newTournamentData[day]).forEach(m => {
                  const match = parseInt(m);
                  newTournamentData[day][match] = newTournamentData[day][match].map(team => {
                      if (nameMap[team.teamName]) {
                          const newName = nameMap[team.teamName];
                          return {
                              ...team,
                              teamName: newName,
                              players: team.players.map(p => ({ ...p, teamName: newName }))
                          };
                      }
                      return team;
                  });
              });
          });
          setTournamentData(newTournamentData);

          // 2. Update Input Cache (Uncommitted Grids)
          const newInputCache = { ...inputCache };
          Object.keys(newInputCache).forEach(key => {
              newInputCache[key] = {
                  ...newInputCache[key],
                  gridRows: newInputCache[key].gridRows.map(row => {
                      if (row.team && nameMap[row.team]) {
                          return { ...row, team: nameMap[row.team] };
                      }
                      return row;
                  })
              };
          });
          setInputCache(newInputCache);
      }

      setIsStandardizeOpen(false);
  };

  const clearGrid = () => {
      if (readOnly) return;
      if (confirm("Clear all grid data?")) {
        pushToHistory();
        updateCache('gridRows', Array(16).fill({ rank: '', team: '', playerRank: '', player: '', kills: '', assists: '', damage: '', time: '', adjustment: '' }));
      }
  };

  const enforceFullConsistency = () => {
      if (readOnly) return;
      pushToHistory();
      const rankTeamMap = new Map<string, string>();
      currentGridRows.forEach(row => {
          if (row.rank && row.rank.trim() && row.team && row.team.trim() && !rankTeamMap.has(row.rank.trim())) {
              rankTeamMap.set(row.rank.trim(), row.team.trim());
          }
      });
      const fixedRows = currentGridRows.map(row => {
          if (row.rank && row.rank.trim() && rankTeamMap.has(row.rank.trim())) {
              return { ...row, team: rankTeamMap.get(row.rank.trim())! };
          }
          return row;
      });
      updateCache('gridRows', fixedRows);
  };

  // --- PROCESSING / COMMIT ---

  const processGridData = () => {
      if (readOnly) return;
      setIsProcessing(true);
      onLoading(true, "Compiling Atomic Stats...");
      try {
          const parsedPlayers: PlayerAtomic[] = [];
          currentGridRows.forEach(row => {
              if ((!row.team || !row.team.trim()) && (!row.player || !row.player.trim())) return; 
              
              // Helper to strip non-numeric characters from rank inputs (e.g. "#1" -> 1)
              const parseRank = (val: string) => {
                  const cleaned = (val || '').replace(/[^0-9]/g, '');
                  return parseInt(cleaned) || 0;
              };

              const rank = parseRank(row.rank) || 99;
              const teamName = (row.team || '').trim() || 'Unknown Team';
              const individualRank = parseRank(row.playerRank);
              const playerName = (row.player || '').trim() || 'Unknown Player';
              const kills = parseInt(row.kills) || 0;
              const assists = parseInt(row.assists) || 0;
              const damage = parseInt(row.damage) || 0;
              const manualPoints = parseInt(row.adjustment) || 0;
              
              let survivalSeconds = 0;
              const timeStr = (row.time || '').toString().trim();
              if (timeStr.includes(':')) {
                  const parts = timeStr.split(':');
                  survivalSeconds = (parseInt(parts[0]) * 60) + (parseInt(parts[1] || '0'));
              } else {
                  survivalSeconds = (parseFloat(timeStr) || 0) * 60; // Assume float is minutes
              }

              parsedPlayers.push({
                  teamRank: rank,
                  teamName: teamName,
                  individualRank: individualRank,
                  playerName: playerName,
                  kills: kills,
                  assists: assists,
                  damage: damage,
                  survivalTimeSeconds: survivalSeconds,
                  manualPoints: manualPoints,
                  matchId: getMatchId(activeDay, activeMatch),
                  dayId: activeDay
              });
          });

          if (parsedPlayers.length > 0) {
              // Calculate MatchStats (Single Match Context)
              const newData = calculateMatchStats(parsedPlayers, DEFAULT_SCORING_RULES, activeDay, activeMatch);
              const mappedData = applySlotMapping(newData, currentSlotMap);
              updateMatchData(activeDay, activeMatch, mappedData);
          } else {
              alert("Grid appears empty.");
          }
      } catch (e) {
          console.error(e);
          alert("Error processing grid.");
      } finally {
          setIsProcessing(false);
          onLoading(false, "");
      }
  };

  // --- INGESTION HANDLERS ---
  
  const stageDataToGrid = (teams: TeamMatchStats[], append: boolean = true) => {
      if (readOnly) return;
      const incomingRows: GridRow[] = teams.flatMap(t => t.players.map(p => ({
          rank: t.rank.toString(),
          team: t.teamName,
          playerRank: p.individualRank ? p.individualRank.toString() : '',
          player: p.playerName,
          kills: p.kills.toString(),
          assists: p.assists.toString(),
          damage: p.damage.toString(),
          time: formatSecondsToMMSS(p.survivalTimeSeconds),
          adjustment: (p.manualPoints || 0).toString()
      })));
      
      const existingRows = append ? currentGridRows.filter(r => (r.team && r.team.trim()) || (r.player && r.player.trim())) : [];
      const combined = [...existingRows, ...incomingRows];
      while(combined.length < 16) combined.push({ rank: '', team: '', playerRank: '', player: '', kills: '', assists: '', damage: '', time: '', adjustment: '' });
      
      pushToHistory();
      updateCache('gridRows', combined);
      setActiveInputType('grid'); 
  };

  const handleParseAI = async () => {
    if (readOnly || !currentAiText.trim() || mode === 'manual') return;
    setIsProcessing(true);
    onLoading(true, "Parsing Raw Telemetry...");
    try {
      const data = await parseRawData(currentAiText, activeDay, activeMatch);
      stageDataToGrid(data);
      updateCache('aiText', ''); 
    } catch (e) { console.error(e); } finally { setIsProcessing(false); onLoading(false, ""); }
  };

  const handleParseCSV = () => {
    if (readOnly || !currentCsvText.trim()) return;
    setIsProcessing(true);
    onLoading(true, "Parsing CSV Data...");
    try {
        const lines = currentCsvText.trim().split('\n');
        const parsedPlayers: PlayerAtomic[] = [];
        const delimiter = lines[0].includes('\t') ? '\t' : ',';
        const hasHeader = (lines[0] || '').toLowerCase().includes('rank') || (lines[0] || '').toLowerCase().includes('team');
        const startIdx = hasHeader ? 1 : 0;

        for (let i = startIdx; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;
            const cols = line.split(delimiter).map(c => c.trim().replace(/^"|"$/g, ''));
            if (cols.length < 4) continue; 

            // Format: Team Pos, Team Name, Player Pos, Player Name, Damage, Assist, Finishes, Play Time
            // Indices: 0, 1, 2, 3, 4, 5, 6, 7
            
            // Safe parse for ranks
            const safeParseRank = (val: string) => parseInt((val||'').replace(/[^0-9]/g, '')) || 0;

            const rank = safeParseRank(cols[0]) || 99;
            const teamName = cols[1] || 'Unknown Team';
            const individualRank = safeParseRank(cols[2]); 
            const playerName = cols[3] || 'Unknown Player';
            const damage = parseInt(cols[4]) || 0;
            const assists = parseInt(cols[5]) || 0;
            const kills = parseInt(cols[6]) || 0;
            
            let timeStr = cols[7] || '0';
            let seconds = 0;
            if (timeStr.includes(':')) {
                const parts = timeStr.split(':');
                seconds = (parseInt(parts[0]) * 60) + (parseInt(parts[1] || '0'));
            } else {
                seconds = (parseFloat(timeStr) || 0) * 60;
            }

            // Check for manual points in 9th column (index 8), default to 0
            const manualPoints = cols[8] ? (parseInt(cols[8]) || 0) : 0;

            parsedPlayers.push({
                teamRank: rank,
                teamName: teamName,
                individualRank: individualRank,
                playerName: playerName,
                kills: kills,
                assists: assists,
                damage: damage,
                survivalTimeSeconds: seconds,
                manualPoints: manualPoints,
                dayId: activeDay,
                matchId: getMatchId(activeDay, activeMatch)
            });
        }

        if (parsedPlayers.length > 0) {
             const derived = calculateMatchStats(parsedPlayers, DEFAULT_SCORING_RULES, activeDay, activeMatch);
             stageDataToGrid(derived);
             updateCache('csvText', ''); 
        } else {
            alert("Could not parse any valid rows. Please check format: Team Rank, Team, P.Rank, Player, Dmg, Ast, Kills, Time");
        }
    } catch (e) {
        console.error("CSV Parse Error", e);
        alert("Failed to parse CSV.");
    } finally {
        setIsProcessing(false);
        onLoading(false, "");
    }
  };

  const handleParseMasterCSV = () => {
    if (readOnly || !masterCsvText.trim()) return;
    setIsProcessing(true);
    onLoading(true, "Processing Master CSV...");
    try {
        const lines = masterCsvText.trim().split('\n');
        const delimiter = lines[0].includes('\t') ? '\t' : ',';
        const hasHeader = (lines[0] || '').toLowerCase().includes('day') || (lines[0] || '').toLowerCase().includes('match');
        const startIdx = hasHeader ? 1 : 0;

        // Group atoms by Day and Match
        const groups: Record<string, PlayerAtomic[]> = {}; // Key: "dX-mY"

        for (let i = startIdx; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;
            const cols = line.split(delimiter).map(c => c.trim().replace(/^"|"$/g, ''));
            // Expected Master Format:
            // 0: Day, 1: Match, 2: Team Rank, 3: Team Name, 4: Player Rank, 5: Player Name, 
            // 6: Kills, 7: Assists, 8: Damage, 9: Time, 10: Manual Pts
            
            if (cols.length < 6) continue;

            const day = parseInt(cols[0]) || 1;
            const match = parseInt(cols[1]) || 1;
            const matchId = getMatchId(day, match);

            let timeStr = cols[9] || '0';
            let seconds = 0;
            if (timeStr.includes(':')) {
                const parts = timeStr.split(':');
                seconds = (parseInt(parts[0]) * 60) + (parseInt(parts[1] || '0'));
            } else {
                seconds = (parseFloat(timeStr) || 0) * 60;
            }

            const p: PlayerAtomic = {
                dayId: day,
                matchId: matchId,
                teamRank: parseInt(cols[2]) || 99,
                teamName: cols[3] || 'Unknown Team',
                individualRank: parseInt(cols[4]) || 0,
                playerName: cols[5] || 'Unknown Player',
                kills: parseInt(cols[6]) || 0,
                assists: parseInt(cols[7]) || 0,
                damage: parseInt(cols[8]) || 0,
                survivalTimeSeconds: seconds,
                manualPoints: parseInt(cols[10]) || 0
            };

            if (!groups[matchId]) groups[matchId] = [];
            groups[matchId].push(p);
        }

        if (Object.keys(groups).length === 0) {
            alert("No valid data found in Master CSV.");
            setIsProcessing(false);
            onLoading(false, "");
            return;
        }

        // Process Groups and Update State
        const newData: Record<number, Record<number, TeamMatchStats[]>> = {};
        const newCacheUpdates: Record<string, { gridRows: GridRow[] }> = {};
        
        let firstDay = 0; 
        let firstMatch = 0;

        Object.entries(groups).forEach(([mId, players]) => {
            const day = players[0].dayId;
            const match = parseInt(mId.split('-m')[1]);
            
            if (!newData[day]) newData[day] = {};
            
            if (firstDay === 0) { firstDay = day; firstMatch = match; }

            const teamStats = calculateMatchStats(players, DEFAULT_SCORING_RULES, day, match);
            newData[day][match] = teamStats;

            // Generate Grid Rows for Cache
            const rows: GridRow[] = [];
            teamStats.forEach(t => {
                t.players.forEach(p => {
                    rows.push({
                        rank: t.rank.toString(),
                        team: t.teamName,
                        playerRank: p.individualRank ? p.individualRank.toString() : '',
                        player: p.playerName,
                        kills: p.kills.toString(),
                        assists: p.assists.toString(),
                        damage: p.damage.toString(),
                        time: formatSecondsToMMSS(p.survivalTimeSeconds),
                        adjustment: (p.manualPoints || 0).toString()
                    });
                });
            });
            // Pad
            while(rows.length < 16) rows.push({ rank: '', team: '', playerRank: '', player: '', kills: '', assists: '', damage: '', time: '', adjustment: '' });
            
            newCacheUpdates[mId] = { gridRows: rows };
        });

        // Merge with existing tournament data (replace strategy for simplicity given 'Master' context, but we merge days)
        setTournamentData(prev => {
            const updated = { ...prev };
            Object.keys(newData).forEach(d => {
                const dayNum = parseInt(d);
                if (!updated[dayNum]) updated[dayNum] = {};
                Object.assign(updated[dayNum], newData[dayNum]);
            });
            return updated;
        });

        // Update Cache
        setInputCache(prev => {
            const nextCache = { ...prev };
            Object.entries(newCacheUpdates).forEach(([mId, data]) => {
                nextCache[mId] = {
                    ...(nextCache[mId] || { aiText: '', csvText: '', slotListText: '' }),
                    gridRows: data.gridRows
                };
            });
            return nextCache;
        });

        setMasterCsvText('');
        if (firstDay > 0) {
            setActiveDay(firstDay);
            setActiveMatch(firstMatch);
        }
        alert(`Successfully imported ${Object.keys(groups).length} matches from Master CSV.`);

    } catch (e) {
        console.error(e);
        alert("Error parsing Master CSV.");
    } finally {
        setIsProcessing(false);
        onLoading(false, "");
        setActiveInputType('grid'); // Switch to grid to show result
    }
  };

  const downloadTemplate = (type: 'csv' | 'excel' | 'master') => {
      let headers = "";
      let example = "";
      let filename = "";

      if (type === 'master') {
          headers = "Day,Match,Team Rank,Team Name,Player Rank,Player Name,Kills,Assists,Damage,Time,Manual Pts";
          example = "1,1,1,Team Soul,1,SoulxMortal,4,2,800,24:00,0\n1,1,1,Team Soul,2,SoulxViper,2,5,600,24:00,0\n1,2,5,GodLike,1,Jonathan,8,1,1400,18:30,0";
          filename = "scarfall_master_template.csv";
      } else {
          headers = type === 'excel' 
             ? "Team Rank\tTeam Name\tPlayer Rank\tPlayer Name\tDamage\tAssist\tFinishes\tPlay Time\tManual Points" 
             : "Team Rank,Team Name,Player Rank,Player Name,Damage,Assist,Finishes,Play Time,Manual Points";
          
          const sep = type === 'excel' ? '\t' : ',';
          example = `#1${sep}Team NXT${sep}1${sep}NXTxPREDATOR${sep}736${sep}0${sep}3${sep}23 Mins${sep}0`;
          filename = type === 'excel' ? "scarfall_excel_template.xls" : "scarfall_data_template.csv";
      }
      
      const content = `data:text/${type === 'excel' ? 'plain' : 'csv'};charset=utf-8,${encodeURIComponent(`${headers}\n${example}`)}`;
      const link = document.createElement("a");
      link.href = content;
      link.download = filename;
      link.click();
  };

  const finalizeReport = () => {
    const flatMatches: MatchData[] = [];
    days.forEach(d => {
        Object.keys(tournamentData[d]).map(Number).sort((a,b) => a-b).forEach(m => {
            const teams = tournamentData[d][m];
            if (teams.length > 0) {
                flatMatches.push({
                    id: getMatchId(d, m),
                    day: d,
                    matchInDay: m,
                    label: `Day ${d} - Match ${m}`,
                    teams: teams,
                    status: 'completed'
                });
            }
        });
    });
    if (flatMatches.length === 0) return;
    if (imageQueue.some(img => img.status === 'waiting' || img.status === 'processing')) return;
    onDataLoaded(flatMatches);
  };
  
  const isQueueActive = imageQueue.some(img => img.status === 'waiting' || img.status === 'processing');
  const visibleQueue = imageQueue.filter(img => img.day === activeDay && img.matchInDay === activeMatch);
  
  // Paste handler for images
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (activeInputType !== 'ocr' || mode === 'manual' || readOnly) return;
      const items = e.clipboardData?.items;
      if (!items) return;
      const newImages: QueuedImage[] = [];
      for (const item of items) {
        if (item.type.indexOf('image') !== -1 || item.type === 'application/pdf') {
          const blob = item.getAsFile();
          if (blob) {
            newImages.push({
              id: Math.random().toString(36).substr(2, 9),
              file: blob,
              status: 'waiting',
              preview: blob.type.startsWith('image/') ? URL.createObjectURL(blob) : '',
              day: activeDay,
              matchInDay: activeMatch
            });
          }
        }
      }
      if (newImages.length > 0) setImageQueue(prev => [...prev, ...newImages]);
    };
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [activeInputType, activeDay, activeMatch, mode, readOnly]);

  const handleFilesSelected = (files: FileList | null) => {
    if (readOnly || !files || mode === 'manual') return;
    const newImages: QueuedImage[] = [];
    Array.from(files).forEach(file => {
      if (file.type.startsWith('image/') || file.type === 'application/pdf') {
        newImages.push({
          id: Math.random().toString(36).substr(2, 9),
          file: file,
          status: 'waiting',
          preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : '',
          day: activeDay,
          matchInDay: activeMatch
        });
      }
    });
    setImageQueue(prev => [...prev, ...newImages]);
  };

  useEffect(() => {
    const processQueue = async () => {
      const waitingImages = imageQueue.filter(img => img.status === 'waiting');
      if (waitingImages.length === 0 || isProcessing || mode === 'manual' || readOnly) return;
      
      const targetDay = waitingImages[0].day;
      const targetMatch = waitingImages[0].matchInDay;
      const batchForMatch = waitingImages.filter(img => img.day === targetDay && img.matchInDay === targetMatch);

      setIsProcessing(true);
      const batchIds = new Set(batchForMatch.map(img => img.id));
      setImageQueue(prev => prev.map(img => batchIds.has(img.id) ? { ...img, status: 'processing' } : img));

      try {
        const imagePayloads = await Promise.all(batchForMatch.map(async (img) => {
             return new Promise<{data: string, mimeType: string}>((resolve, reject) => {
                 const reader = new FileReader();
                 reader.onloadend = () => {
                     const base64String = reader.result as string;
                     const base64Data = base64String.split(',')[1];
                     const mimeType = base64String.split(';')[0].split(':')[1];
                     resolve({ data: base64Data, mimeType });
                 };
                 reader.onerror = reject;
                 reader.readAsDataURL(img.file);
             });
        }));

        const data = await extractScoreboardImages(imagePayloads, targetDay, targetMatch);
        if (data.length > 0) {
            stageDataToGrid(data);
            setImageQueue(prev => prev.map(img => batchIds.has(img.id) ? { ...img, status: 'done' } : img));
        } else {
            setImageQueue(prev => prev.map(img => batchIds.has(img.id) ? { ...img, status: 'error' } : img));
        }
      } catch (error) {
        console.error(error);
        setImageQueue(prev => prev.map(img => batchIds.has(img.id) ? { ...img, status: 'error' } : img));
      } finally {
        setIsProcessing(false);
      }
    };
    processQueue();
  }, [imageQueue, isProcessing, mode, readOnly]);

  return (
    <div className={`max-w-5xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-700 ${readOnly ? 'pointer-events-none opacity-80' : ''}`}>
      <datalist id="team-suggestions">
          {suggestions.teams.map(t => <option key={t} value={t} />)}
      </datalist>
      <datalist id="player-suggestions">
          {suggestions.players.map(p => <option key={p} value={p} />)}
      </datalist>

      {/* --- STANDARDIZE MODAL --- */}
      {isStandardizeOpen && !readOnly && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
              <div className="bg-tactical-black border border-tactical-gray w-full max-w-lg rounded-sm shadow-2xl relative max-h-[80vh] flex flex-col">
                  <div className="flex items-center justify-between p-4 border-b border-tactical-gray bg-tactical-dark">
                      <h3 className="font-serif text-lg font-bold text-white uppercase tracking-wider flex items-center gap-2">
                          <Wand2 className="w-5 h-5 text-tactical-red" /> Team Name Standardizer
                      </h3>
                      <button onClick={() => setIsStandardizeOpen(false)} className="text-tactical-light hover:text-white transition-colors"><X className="w-5 h-5" /></button>
                  </div>
                  
                  {/* Scope Selector */}
                  <div className="bg-black/50 p-2 flex border-b border-tactical-gray/30">
                      <button 
                        onClick={() => setStandardizeScope('current')} 
                        className={`flex-1 py-1.5 text-xs font-bold uppercase rounded-sm transition-all ${standardizeScope === 'current' ? 'bg-tactical-light text-black shadow-sm' : 'text-tactical-light hover:text-white'}`}
                      >
                          Current Match
                      </button>
                      <button 
                        onClick={() => setStandardizeScope('global')} 
                        className={`flex-1 py-1.5 text-xs font-bold uppercase rounded-sm transition-all ${standardizeScope === 'global' ? 'bg-tactical-red text-white shadow-sm' : 'text-tactical-light hover:text-white'}`}
                      >
                          <Globe className="w-3 h-3 inline mr-1" />
                          Global (All Matches)
                      </button>
                  </div>

                  <div className="p-4 overflow-y-auto flex-1">
                      <p className="text-xs text-tactical-light mb-4 flex items-center gap-2">
                          <AlertCircle className="w-3 h-3" />
                          {standardizeScope === 'global' 
                            ? "Correcting team names across ALL matches in the tournament." 
                            : "Correcting team names in the CURRENT match only."}
                      </p>
                      <form id="standardize-form" onSubmit={(e) => {
                          e.preventDefault();
                          const formData = new FormData(e.currentTarget);
                          const map: Record<string, string> = {};
                          standardizationTargets.forEach(([team]) => {
                              const newVal = formData.get(team) as string;
                              if (newVal && newVal !== team) {
                                  map[team] = newVal;
                              }
                          });
                          handleApplyTeamNames(map);
                      }}>
                          <div className="space-y-2">
                              {standardizationTargets.map(([team, count]) => (
                                  <div key={team} className="flex items-center gap-2 bg-black/30 p-2 rounded-sm border border-tactical-gray/30">
                                      <div className="flex-1 text-sm font-mono text-tactical-light truncate" title={team}>
                                          {team} 
                                          {standardizeScope === 'global' && <span className="ml-2 text-[9px] bg-white/10 px-1 rounded text-white/50">{count} matches</span>}
                                      </div>
                                      <ArrowRight className="w-3 h-3 text-tactical-gray" />
                                      <input 
                                          name={team}
                                          defaultValue={team}
                                          className="flex-1 bg-black border border-tactical-gray p-1.5 text-white text-sm focus:border-tactical-red outline-none rounded-sm"
                                          list="team-suggestions"
                                      />
                                  </div>
                              ))}
                          </div>
                      </form>
                  </div>
                  <div className="p-4 border-t border-tactical-gray flex justify-end gap-2 bg-tactical-dark">
                      <button onClick={() => setIsStandardizeOpen(false)} className="px-4 py-2 text-tactical-light hover:text-white text-xs font-bold uppercase">Cancel</button>
                      <button type="submit" form="standardize-form" className={`px-6 py-2 text-white font-bold uppercase text-xs tracking-wider rounded-sm transition-colors ${standardizeScope === 'global' ? 'bg-tactical-red hover:bg-red-600' : 'bg-tactical-green text-black hover:bg-white'}`}>
                          {standardizeScope === 'global' ? 'Apply Globally' : 'Apply Local Fixes'}
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* SLOT MAP MODAL */}
      {isSlotMapOpen && !readOnly && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
              <div className="bg-tactical-black border border-tactical-gray w-full max-w-lg rounded-sm shadow-2xl relative">
                  <div className="flex items-center justify-between p-4 border-b border-tactical-gray bg-tactical-dark">
                      <h3 className="font-serif text-lg font-bold text-white uppercase tracking-wider flex items-center gap-2">
                          <ClipboardList className="w-5 h-5" /> Slot List Intelligence
                      </h3>
                      <button onClick={() => setIsSlotMapOpen(false)} className="text-tactical-light hover:text-white transition-colors"><X className="w-5 h-5" /></button>
                  </div>
                  <div className="p-6">
                      <div className="mb-4 bg-tactical-dark p-3 rounded-sm border border-tactical-gray/50">
                          <div className="text-[10px] text-tactical-light font-mono uppercase tracking-widest mb-1">Targeting</div>
                          <div className="text-white font-bold text-lg">DAY {activeDay} // MATCH {activeMatch}</div>
                      </div>
                      <p className="text-xs text-tactical-light mb-4 leading-relaxed">
                          Paste your slot list below. Format: 1. Team Name, 2 - Team Name
                      </p>
                      <textarea 
                          value={currentSlotListText}
                          onChange={(e) => updateCache('slotListText', e.target.value)}
                          className="w-full h-48 bg-black border border-tactical-gray p-3 text-white font-mono text-xs focus:border-tactical-white outline-none rounded-sm resize-none"
                          placeholder={`1. Team Soul\n2. GodLike...`}
                      />
                  </div>
                  <div className="p-4 border-t border-tactical-gray flex justify-end">
                      <button onClick={() => setIsSlotMapOpen(false)} className="px-6 py-2 bg-white text-black font-bold uppercase text-xs tracking-wider rounded-sm">Save</button>
                  </div>
              </div>
          </div>
      )}

      {/* DAY NAV */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1 no-scrollbar">
         {days.map(day => (
            <div key={day} className="relative group flex-shrink-0">
                <button
                    onClick={() => { setActiveDay(day); setActiveMatch(1); }}
                    className={`px-4 sm:px-6 py-2 rounded-sm text-[10px] sm:text-xs font-bold font-mono uppercase tracking-wider transition-all flex items-center gap-2 border ${
                        activeDay === day ? 'bg-tactical-red text-white border-tactical-red pr-8' : 'bg-black text-tactical-light border-tactical-gray hover:border-white'
                    }`}
                >
                    <Calendar className="w-3 h-3" /> DAY {day}
                </button>
                {activeDay === day && days.length > 1 && !readOnly && (
                    <button onClick={(e) => { e.stopPropagation(); deleteDay(day); }} className="absolute top-1/2 right-1.5 -translate-y-1/2 p-1 text-white/70 hover:text-white hover:bg-black/20 rounded-full transition-colors"><X className="w-3 h-3" /></button>
                )}
            </div>
         ))}
         {!readOnly && <button onClick={addDay} className="flex-shrink-0 px-3 py-2 rounded-sm bg-tactical-dark border border-tactical-gray hover:bg-white/10 text-white transition-colors"><Plus className="w-3 h-3" /></button>}
      </div>

      {/* MATCH NAV */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar pl-2 sm:pl-4 border-l-2 border-tactical-red">
         {matchesInActiveDay.map(matchId => (
             <button
                key={matchId}
                onClick={() => setActiveMatch(matchId)}
                className={`group relative flex items-center gap-2 px-3 sm:px-5 py-2 sm:py-3 rounded-t-sm text-[10px] sm:text-xs font-bold font-mono tracking-wider transition-all min-w-[100px] sm:min-w-[120px] justify-between border-t border-x flex-shrink-0 ${
                    activeMatch === matchId 
                    ? 'bg-tactical-dark border-tactical-gray text-white border-b-black mb-[-1px] z-10 pr-7 sm:pr-9' 
                    : 'bg-black border-transparent text-tactical-light hover:text-white hover:bg-white/5 border-b-tactical-gray'
                }`}
             >
                {activeMatch === matchId && <div className="absolute top-0 left-0 right-0 h-0.5 bg-tactical-red"></div>}
                <div className="flex items-center gap-2">
                    <Sword className={`w-3 h-3 ${activeMatch === matchId ? 'text-tactical-red' : 'text-tactical-gray'}`} />
                    <span>MATCH {matchId}</span>
                </div>
                {activeMatch === matchId && matchesInActiveDay.length > 1 && !readOnly && (
                     <div onClick={(e) => { e.stopPropagation(); deleteMatch(activeDay, matchId); }} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-tactical-light hover:text-white hover:bg-black/20 rounded-full cursor-pointer z-20"><X className="w-3 h-3" /></div>
                )}
             </button>
         ))}
         {!readOnly && <button onClick={() => addMatchToDay(activeDay)} className="flex-shrink-0 px-3 sm:px-4 py-2 sm:py-3 rounded-t-sm bg-black border-b-tactical-gray text-tactical-light hover:text-white transition-all border-dashed border border-transparent hover:border-tactical-gray flex items-center gap-2 text-[10px] sm:text-xs font-bold"><Plus className="w-3 h-3" /> NEW</button>}
         <div className="flex-1 border-b border-tactical-gray"></div>
      </div>

      {/* MAIN CARD */}
      <div className="bg-tactical-dark rounded-b-sm rounded-tr-sm border border-tactical-gray overflow-hidden -mt-6 relative z-0 shadow-2xl">
        <div className="flex border-b border-tactical-gray bg-black/40 overflow-x-auto no-scrollbar">
          {/* TACTICAL GRID */}
          <button onClick={() => setActiveInputType('grid')} className={`flex-1 min-w-[110px] sm:min-w-[140px] py-3 sm:py-4 text-[10px] sm:text-xs font-bold tracking-wider uppercase flex items-center justify-center gap-2 transition-all ${activeInputType === 'grid' ? 'text-white bg-tactical-dark border-b-2 border-b-tactical-green' : 'text-tactical-light hover:text-white'}`}>
            <Grid className="w-3.5 h-3.5" /> <span className="hidden xs:inline">Tactical</span> Grid
          </button>
          <div className="w-px bg-tactical-gray"></div>
          {/* LEGACY CSV */}
          <button onClick={() => setActiveInputType('csv')} className={`flex-1 min-w-[110px] sm:min-w-[140px] py-3 sm:py-4 text-[10px] sm:text-xs font-bold tracking-wider uppercase flex items-center justify-center gap-2 transition-all ${activeInputType === 'csv' ? 'text-white bg-tactical-dark border-b-2 border-b-tactical-white' : 'text-tactical-light hover:text-white'}`}>
            <TableIcon className="w-3.5 h-3.5" /> <span className="hidden xs:inline">Legacy</span> CSV
          </button>
          <div className="w-px bg-tactical-gray"></div>
          {/* MASTER CSV */}
          <button onClick={() => setActiveInputType('master_csv')} className={`flex-1 min-w-[110px] sm:min-w-[140px] py-3 sm:py-4 text-[10px] sm:text-xs font-bold tracking-wider uppercase flex items-center justify-center gap-2 transition-all ${activeInputType === 'master_csv' ? 'text-white bg-tactical-dark border-b-2 border-b-yellow-500' : 'text-tactical-light hover:text-white'}`}>
            <FileStack className="w-3.5 h-3.5" /> <span className="hidden xs:inline">Master</span> CSV
          </button>
          <div className="w-px bg-tactical-gray"></div>
          {/* AI */}
          <button onClick={() => mode === 'auto' && setActiveInputType('paste')} disabled={mode === 'manual'} className={`flex-1 min-w-[110px] sm:min-w-[140px] py-3 sm:py-4 text-[10px] sm:text-xs font-bold tracking-wider uppercase flex items-center justify-center gap-2 transition-all ${mode === 'manual' ? 'opacity-50' : activeInputType === 'paste' ? 'text-white bg-tactical-dark border-b-2 border-b-blue-500' : 'text-tactical-light hover:text-white'}`}>
            {mode === 'manual' ? <Lock className="w-3 h-3" /> : <Database className="w-3.5 h-3.5" />} <span className="hidden xs:inline">Raw Text</span> (AI)
          </button>
          <div className="w-px bg-tactical-gray"></div>
          {/* SCAN */}
          <button onClick={() => mode === 'auto' && setActiveInputType('ocr')} disabled={mode === 'manual'} className={`flex-1 min-w-[110px] sm:min-w-[140px] py-3 sm:py-4 text-[10px] sm:text-xs font-bold tracking-wider uppercase flex items-center justify-center gap-2 transition-all ${mode === 'manual' ? 'opacity-50' : activeInputType === 'ocr' ? 'text-white bg-tactical-dark border-b-2 border-b-tactical-red' : 'text-tactical-light hover:text-white'}`}>
            {mode === 'manual' ? <Lock className="w-3 h-3" /> : <ScanLine className="w-3.5 h-3.5" />} <span className="hidden xs:inline">Batch</span> Scan
          </button>
        </div>

        <div className="p-3 sm:p-4 md:p-8 min-h-[300px] flex flex-col justify-center bg-gradient-to-b from-tactical-dark to-black relative">
          
          {readOnly && (
              <div className="absolute inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/40">
                  <div className="bg-black border border-tactical-gray p-4 rounded-sm flex items-center gap-4">
                      <Lock className="w-5 h-5 text-tactical-red" />
                      <span className="text-white font-bold uppercase tracking-widest text-sm">Input Locked (Read-Only Mode)</span>
                  </div>
              </div>
          )}

          {/* GRID UI */}
          {activeInputType === 'grid' && (
             <div className="flex flex-col gap-4 h-full animate-in fade-in">
                
                {/* TOOLBAR */}
                <div className="flex flex-wrap justify-between items-center bg-black/30 p-3 rounded-sm border border-tactical-gray/50 gap-2">
                   <div className="flex items-center gap-2">
                       <div className="text-xs font-mono text-tactical-light flex items-center gap-2"><span className="text-white font-bold">STAGING AREA</span></div>
                       <div className="w-px h-4 bg-tactical-gray/50 mx-1"></div>
                       {/* History Controls */}
                       <button onClick={handleUndoGrid} disabled={!gridUndoStack[currentMatchId]?.length} className="p-1.5 text-tactical-light hover:text-white disabled:opacity-30 rounded-sm hover:bg-white/5" title="Undo (Ctrl+Z)"><Undo className="w-3.5 h-3.5"/></button>
                       <button onClick={handleRedoGrid} disabled={!gridRedoStack[currentMatchId]?.length} className="p-1.5 text-tactical-light hover:text-white disabled:opacity-30 rounded-sm hover:bg-white/5" title="Redo (Ctrl+Y)"><Redo className="w-3.5 h-3.5"/></button>
                   </div>
                   
                   <div className="flex items-center gap-2 flex-wrap">
                     <button onClick={() => setIsSlotMapOpen(true)} className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold uppercase bg-tactical-gray text-white rounded-sm hover:bg-white/20">Slot Map</button>
                     <div className="w-px h-4 bg-tactical-gray/50 mx-1"></div>
                     <button onClick={() => { setIsStandardizeOpen(true); setStandardizeScope('current'); }} className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold uppercase text-blue-400 border border-blue-400/30 rounded-sm hover:bg-blue-400/10" title="Rename teams in bulk"><Wand2 className="w-3 h-3"/> Standardize</button>
                     <button onClick={enforceFullConsistency} className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold uppercase text-green-400 border border-green-400/30 rounded-sm hover:bg-green-400/10" title="Sync Team Names by Rank"><RefreshCw className="w-3 h-3"/> Sync Teams</button>
                     <button onClick={handleConsolidateDuplicates} className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold uppercase text-purple-400 border border-purple-400/30 rounded-sm hover:bg-purple-400/10" title="Merge rows with same Name+Team"><Merge className="w-3 h-3"/> Merge Dups</button>
                     <div className="w-px h-4 bg-tactical-gray/50 mx-1"></div>
                     <button onClick={handleCloneRoster} className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold uppercase text-tactical-light border border-tactical-gray rounded-sm hover:text-white">Clone D1</button>
                     <button onClick={clearGrid} className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold uppercase text-tactical-red border border-tactical-red/30 rounded-sm hover:bg-tactical-red/10">Clear</button>
                   </div>
                </div>

                {/* BULK EDIT BAR */}
                {selectedIndices.size > 0 && !readOnly && (
                    <div className="bg-tactical-dark border border-tactical-gray p-2 rounded-sm flex items-center gap-4 animate-in slide-in-from-top-2">
                        <div className="text-[10px] font-bold uppercase text-tactical-light px-2">{selectedIndices.size} Selected</div>
                        <div className="w-px h-4 bg-tactical-gray"></div>
                        <div className="flex items-center gap-2 flex-1">
                             <Calculator className="w-3.5 h-3.5 text-yellow-500" />
                             <select 
                                value={bulkField}
                                onChange={(e) => setBulkField(e.target.value as keyof GridRow)}
                                className="bg-black border border-tactical-gray text-xs text-white p-1.5 rounded-sm outline-none focus:border-yellow-500"
                             >
                                 <option value="kills">Kills</option>
                                 <option value="damage">Damage</option>
                                 <option value="assists">Assists</option>
                                 <option value="time">Time</option>
                                 <option value="adjustment">Adjust</option>
                                 <option value="rank">Team Rank</option>
                                 <option value="playerRank">Player Rank</option>
                             </select>
                             <input 
                                value={bulkValue}
                                onChange={(e) => setBulkValue(e.target.value)}
                                placeholder="+10 or 5 or *1.2"
                                className="bg-black border border-tactical-gray text-xs text-white p-1.5 rounded-sm outline-none focus:border-yellow-500 w-32"
                             />
                             <button 
                                onClick={applyBulkEdit}
                                className="px-3 py-1.5 bg-yellow-500/10 border border-yellow-500 text-yellow-500 text-[10px] font-bold uppercase rounded-sm hover:bg-yellow-500 hover:text-black transition-colors"
                             >
                                Apply Bulk
                             </button>
                        </div>
                    </div>
                )}

                <div className="overflow-x-auto border border-tactical-gray rounded-sm bg-black max-h-[600px] overflow-y-auto">
                    <table className="w-full text-left text-xs font-mono border-collapse relative">
                        <thead className="sticky top-0 z-10">
                            <tr className="bg-tactical-dark text-tactical-light border-b border-tactical-gray">
                                <th className="p-2 border-r border-tactical-gray/30 w-8 text-center bg-tactical-dark z-20 sticky left-0">
                                    <div onClick={toggleAllRows} className="cursor-pointer flex justify-center">
                                        {selectedIndices.size === currentGridRows.length && currentGridRows.length > 0 ? <CheckSquare className="w-3.5 h-3.5 text-white" /> : <Square className="w-3.5 h-3.5 text-tactical-gray" />}
                                    </div>
                                </th>
                                <th className="p-2 border-r border-tactical-gray/30 w-12 text-center">#</th>
                                <th className="p-2 border-r border-tactical-gray/30 w-16 text-center">T.Pos</th>
                                <th className="p-2 border-r border-tactical-gray/30 w-48">Team</th>
                                <th className="p-2 border-r border-tactical-gray/30 w-16 text-center text-tactical-green">P.Pos</th>
                                <th className="p-2 border-r border-tactical-gray/30 w-48">Player</th>
                                <th className="p-2 w-20 text-center border-r border-tactical-gray/30">Kills</th>
                                <th className="p-2 w-20 text-center border-r border-tactical-gray/30">Ast</th>
                                <th className="p-2 w-24 text-center border-r border-tactical-gray/30">Dmg</th>
                                <th className="p-2 w-20 text-center border-r border-tactical-gray/30">Time</th>
                                <th className="p-2 w-16 text-center text-yellow-500 font-bold">Adj.</th>
                            </tr>
                        </thead>
                        <tbody>
                            {currentGridRows.map((row, idx) => (
                                <tr key={idx} className={`border-b border-tactical-gray/20 group ${selectedIndices.has(idx) ? 'bg-white/10' : 'hover:bg-white/5'}`}>
                                    <td className="p-0 border-r border-tactical-gray/30 text-center sticky left-0 z-10 bg-black group-hover:bg-tactical-dark/50">
                                        <div onClick={() => toggleRowSelection(idx)} className="cursor-pointer h-full flex items-center justify-center py-2">
                                            {selectedIndices.has(idx) ? <CheckSquare className="w-3.5 h-3.5 text-tactical-green" /> : <Square className="w-3.5 h-3.5 text-tactical-gray" />}
                                        </div>
                                    </td>
                                    <td className="p-0 border-r border-tactical-gray/30 text-center text-tactical-gray">{idx+1}</td>
                                    <td className="p-0 border-r border-tactical-gray/30"><input value={row.rank} onChange={(e) => handleGridChange(idx, 'rank', e.target.value)} onPaste={(e)=>handleGridPaste(e,idx,'rank')} className="w-full bg-transparent p-2 text-white text-center focus:outline-none focus:bg-white/10" placeholder="-" /></td>
                                    <td className="p-0 border-r border-tactical-gray/30 relative">
                                        <input value={row.team} onChange={(e) => handleGridChange(idx, 'team', e.target.value)} onPaste={(e)=>handleGridPaste(e,idx,'team')} list="team-suggestions" className="w-full bg-transparent p-2 text-white font-bold focus:outline-none focus:bg-white/10" placeholder="Team" />
                                    </td>
                                    <td className="p-0 border-r border-tactical-gray/30"><input value={row.playerRank} onChange={(e) => handleGridChange(idx, 'playerRank', e.target.value)} onPaste={(e)=>handleGridPaste(e,idx,'playerRank')} className="w-full bg-transparent p-2 text-tactical-green text-center focus:outline-none focus:bg-white/10" placeholder="#" /></td>
                                    <td className="p-0 border-r border-tactical-gray/30"><input value={row.player} onChange={(e) => handleGridChange(idx, 'player', e.target.value)} onPaste={(e)=>handleGridPaste(e,idx,'player')} list="player-suggestions" className="w-full bg-transparent p-2 text-white focus:outline-none focus:bg-white/10" placeholder="Player" /></td>
                                    <td className="p-0 border-r border-tactical-gray/30"><input value={row.kills} onChange={(e) => handleGridChange(idx, 'kills', e.target.value)} onPaste={(e)=>handleGridPaste(e,idx,'kills')} className="w-full bg-transparent p-2 text-center text-white focus:outline-none focus:bg-white/10" placeholder="0" /></td>
                                    <td className="p-0 border-r border-tactical-gray/30"><input value={row.assists} onChange={(e) => handleGridChange(idx, 'assists', e.target.value)} onPaste={(e)=>handleGridPaste(e,idx,'assists')} className="w-full bg-transparent p-2 text-center text-white focus:outline-none focus:bg-white/10" placeholder="0" /></td>
                                    <td className="p-0 border-r border-tactical-gray/30"><input value={row.damage} onChange={(e) => handleGridChange(idx, 'damage', e.target.value)} onPaste={(e)=>handleGridPaste(e,idx,'damage')} className="w-full bg-transparent p-2 text-center text-white focus:outline-none focus:bg-white/10" placeholder="0" /></td>
                                    <td className="p-0 border-r border-tactical-gray/30"><input value={row.time} onChange={(e) => handleGridChange(idx, 'time', e.target.value)} onPaste={(e)=>handleGridPaste(e,idx,'time')} className="w-full bg-transparent p-2 text-center text-white focus:outline-none focus:bg-white/10" placeholder="00:00" /></td>
                                    <td className="p-0"><input value={row.adjustment} onChange={(e) => handleGridChange(idx, 'adjustment', e.target.value)} onPaste={(e)=>handleGridPaste(e,idx,'adjustment')} className="w-full bg-transparent p-2 text-center text-yellow-500 font-bold focus:outline-none focus:bg-white/10" placeholder="+/-" /></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <button onClick={() => updateCache('gridRows', [...currentGridRows, ...Array(4).fill({ rank: '', team: '', playerRank: '', player: '', kills: '', assists: '', damage: '', time: '', adjustment: '' })])} className="w-full py-2 bg-tactical-dark text-tactical-light text-[10px] font-bold uppercase tracking-widest hover:bg-white/5">+ Add Rows</button>
                </div>
                <button onClick={processGridData} className="w-full py-3 bg-tactical-green text-black rounded-sm text-sm font-bold uppercase tracking-wider hover:bg-white flex items-center justify-center gap-2 transition-colors">
                    {isProcessing && <Loader2 className="w-4 h-4 animate-spin"/>} 
                    <Save className="w-4 h-4" /> Save Match Data
                </button>
             </div>
          )}

          {/* AI UI */}
          {activeInputType === 'paste' && mode === 'auto' && (
            <div className="flex flex-col gap-4 h-full animate-in fade-in">
              <div className="bg-black/30 p-2 rounded-sm border border-tactical-gray/50 flex justify-between items-center">
                 <span className="text-[10px] text-tactical-light uppercase">Target: <span className="text-white font-bold">D{activeDay} / M{activeMatch}</span></span>
                 <button onClick={() => setIsSlotMapOpen(true)} className="px-2 py-1 text-[10px] bg-tactical-gray text-white rounded-sm">Slot Map</button>
              </div>
              <textarea placeholder="Paste Raw Text..." className="w-full flex-1 p-4 bg-black/50 border border-tactical-gray rounded-sm font-mono text-xs text-white resize-none min-h-[200px] focus:outline-none" value={currentAiText} onChange={(e) => updateCache('aiText', e.target.value)} />
              <button onClick={handleParseAI} disabled={isProcessing || !currentAiText} className="w-full py-3 bg-white text-black rounded-sm font-bold uppercase text-sm hover:bg-gray-200 flex justify-center items-center gap-2">{isProcessing && <Loader2 className="w-4 h-4 animate-spin"/>} Process to Grid</button>
            </div>
          )}

          {/* CSV UI */}
          {activeInputType === 'csv' && (
             <div className="flex flex-col gap-4 h-full animate-in fade-in">
                <div className="flex justify-between items-center bg-black/30 p-3 rounded-sm border border-tactical-gray/50">
                   <span className="text-xs text-tactical-light">Target: <span className="text-white font-bold">D{activeDay} / M{activeMatch}</span></span>
                   <button onClick={() => downloadTemplate('csv')} className="text-[10px] font-bold uppercase text-tactical-light hover:text-white flex items-center gap-2"><Download className="w-3 h-3"/> Template</button>
                </div>
                <textarea placeholder="Rank, Team, Player, Kills..." className="w-full flex-1 p-4 bg-black/50 border border-tactical-gray rounded-sm font-mono text-xs text-white resize-none min-h-[200px] focus:outline-none" value={currentCsvText} onChange={(e) => updateCache('csvText', e.target.value)} />
                <button onClick={handleParseCSV} disabled={isProcessing || !currentCsvText} className="w-full py-3 bg-white text-black rounded-sm font-bold uppercase text-sm hover:bg-gray-200 flex justify-center items-center gap-2">{isProcessing && <Loader2 className="w-4 h-4 animate-spin"/>} Import to Grid</button>
             </div>
          )}

          {/* MASTER CSV UI */}
          {activeInputType === 'master_csv' && (
             <div className="flex flex-col gap-4 h-full animate-in fade-in">
                <div className="flex justify-between items-center bg-black/30 p-3 rounded-sm border border-tactical-gray/50">
                   <div className="flex flex-col">
                       <span className="text-xs font-bold text-white uppercase">Bulk Import Engine</span>
                       <span className="text-[10px] text-tactical-light">Multi-Day & Multi-Match Support</span>
                   </div>
                   <button onClick={() => downloadTemplate('master')} className="text-[10px] font-bold uppercase text-yellow-500 hover:text-white flex items-center gap-2 border border-yellow-500/20 px-2 py-1 rounded-sm"><Download className="w-3 h-3"/> Master Template</button>
                </div>
                <div className="bg-yellow-500/10 border border-yellow-500/20 p-2 text-[10px] text-yellow-500 font-mono">
                    FORMAT: Day, Match, Team Rank, Team Name, Player Rank, Player Name, Kills, Assists, Damage, Time, Manual Pts
                </div>
                <textarea 
                    placeholder="Paste Master CSV Data..." 
                    className="w-full flex-1 p-4 bg-black/50 border border-tactical-gray rounded-sm font-mono text-xs text-white resize-none min-h-[200px] focus:outline-none focus:border-yellow-500" 
                    value={masterCsvText} 
                    onChange={(e) => setMasterCsvText(e.target.value)} 
                />
                <button onClick={handleParseMasterCSV} disabled={isProcessing || !masterCsvText} className="w-full py-3 bg-white text-black rounded-sm font-bold uppercase text-sm hover:bg-yellow-500 hover:text-black transition-colors flex justify-center items-center gap-2">
                    {isProcessing && <Loader2 className="w-4 h-4 animate-spin"/>} Process Bulk Data
                </button>
             </div>
          )}

          {/* OCR UI */}
          {activeInputType === 'ocr' && mode === 'auto' && (
            <div className="flex flex-col h-full animate-in fade-in">
              <div className="relative border-2 border-dashed border-tactical-gray bg-black/20 rounded-sm p-10 flex flex-col items-center justify-center cursor-pointer hover:border-white transition-all mb-4" onClick={() => fileInputRef.current?.click()}>
                <div onClick={(e) => { e.stopPropagation(); setIsSlotMapOpen(true); }} className="absolute top-2 right-2 px-2 py-1 bg-black border border-tactical-gray text-[10px] text-white rounded-sm">Slot Map</div>
                <Upload className="w-8 h-8 text-tactical-light mb-4" />
                <p className="text-white font-bold">UPLOAD IMAGES</p>
                <p className="text-[10px] text-tactical-light mt-1">Target: D{activeDay} / M{activeMatch}</p>
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*,application/pdf" multiple onChange={(e) => handleFilesSelected(e.target.files)} />
              </div>
              {visibleQueue.length > 0 && (
                <div className="grid grid-cols-4 gap-2">
                    {visibleQueue.map(img => (
                        <div key={img.id} className="aspect-video bg-black border border-tactical-gray relative group">
                            {img.file.type === 'application/pdf' ? <div className="w-full h-full flex items-center justify-center text-tactical-light"><FileText/></div> : <img src={img.preview} className={`w-full h-full object-cover ${img.status === 'done' ? 'opacity-50' : ''}`} />}
                            {img.status === 'processing' && <div className="absolute inset-0 bg-black/50 flex items-center justify-center"><Loader2 className="w-4 h-4 animate-spin text-blue-400"/></div>}
                            {img.status === 'done' && <div className="absolute top-1 left-1 text-green-500"><CheckCircle2 className="w-4 h-4"/></div>}
                            {img.status !== 'processing' && <button onClick={() => setImageQueue(prev => prev.filter(i => i.id !== img.id))} className="absolute top-1 right-1 text-white opacity-0 group-hover:opacity-100 hover:text-red-500"><X className="w-4 h-4"/></button>}
                        </div>
                    ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className={`bg-tactical-dark border border-tactical-gray rounded-sm p-3 sm:p-4 flex flex-col sm:flex-row items-center justify-between gap-4 ${totalMatches > 0 ? 'opacity-100' : 'opacity-50'}`}>
        <div className="flex items-center gap-4 w-full sm:w-auto">
           <Layers className="w-5 h-5 text-white" />
           <div>
             <h4 className="text-xs sm:text-sm font-bold text-white uppercase">{isQueueActive ? 'Processing...' : 'Review & Compile'}</h4>
             <div className="text-[10px] sm:text-xs text-tactical-light font-mono">{totalMatches} Matches Ready</div>
           </div>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
             {initialData && initialData.length > 0 && <button onClick={() => onDataLoaded([])} className="flex-1 sm:flex-none px-4 py-2 bg-tactical-dark text-white border border-tactical-gray rounded-sm text-[10px] sm:text-xs font-bold uppercase">Cancel</button>}
            <button onClick={finalizeReport} disabled={isQueueActive || totalMatches === 0} className="flex-1 sm:flex-none px-6 py-2 bg-white text-black border border-white rounded-sm text-[10px] sm:text-xs font-bold uppercase hover:bg-tactical-green hover:text-white transition-colors flex gap-2 items-center justify-center">
                {initialData ? 'Update' : 'Generate Dashboard'} <PlayCircle className="w-3 h-3" />
            </button>
        </div>
      </div>
    </div>
  );
};

export default DataInput;