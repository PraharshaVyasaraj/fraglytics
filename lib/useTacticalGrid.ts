import { useState, useCallback } from 'react';

export interface GridRow {
  rank: string;
  team: string;
  playerRank: string;
  player: string;
  kills: string;
  assists: string;
  damage: string;
  time: string;
  adjustment: string;
}

export type GridField = keyof GridRow;

interface UseTacticalGridProps {
  initialRows: GridRow[];
  onUpdate: (rows: GridRow[]) => void;
  readOnly?: boolean;
}

export function useTacticalGrid({ initialRows, onUpdate, readOnly = false }: UseTacticalGridProps) {
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());
  const [undoStack, setUndoStack] = useState<GridRow[][]>([]);
  const [redoStack, setRedoStack] = useState<GridRow[][]>([]);

  const pushToHistory = useCallback((currentRows: GridRow[]) => {
    setUndoStack(prev => [...prev.slice(-19), JSON.parse(JSON.stringify(currentRows))]);
    setRedoStack([]);
  }, []);

  const undo = useCallback((currentRows: GridRow[]) => {
    if (undoStack.length === 0) return currentRows;
    const previous = undoStack[undoStack.length - 1];
    setRedoStack(prev => [...prev, JSON.parse(JSON.stringify(currentRows))]);
    setUndoStack(prev => prev.slice(0, -1));
    return previous;
  }, [undoStack]);

  const redo = useCallback((currentRows: GridRow[]) => {
    if (redoStack.length === 0) return currentRows;
    const next = redoStack[redoStack.length - 1];
    setUndoStack(prev => [...prev, JSON.parse(JSON.stringify(currentRows))]);
    setRedoStack(prev => prev.slice(0, -1));
    return next;
  }, [redoStack]);

  const applyBulkEdit = useCallback((rows: GridRow[], field: GridField, value: string) => {
    if (readOnly || selectedIndices.size === 0) return rows;
    
    const newRows = [...rows];
    const opRegex = /^([\+\-\*\/])\s*([\d\.]+)$/; 
    const match = value.trim().match(opRegex);
    
    selectedIndices.forEach(idx => {
      let newVal = value;
      const currentValStr = newRows[idx][field];
      
      if (['kills', 'assists', 'damage', 'adjustment', 'rank', 'playerRank'].includes(field) && match) {
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
      newRows[idx] = { ...newRows[idx], [field]: newVal };
    });
    
    return newRows;
  }, [selectedIndices, readOnly]);

  const toggleSelection = useCallback((index: number) => {
    setSelectedIndices(prev => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }, []);

  const selectAll = useCallback((count: number) => {
    setSelectedIndices(new Set(Array.from({ length: count }, (_, i) => i)));
  }, []);

  const toggleAll = useCallback((count: number) => {
    setSelectedIndices(prev => {
      if (prev.size === count) return new Set();
      return new Set(Array.from({ length: count }, (_, i) => i));
    });
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedIndices(new Set());
  }, []);

  const handleGridChange = useCallback((rows: GridRow[], index: number, field: GridField, value: string) => {
    if (readOnly) return rows;
    
    let newRows = [...rows];
    newRows[index] = { ...newRows[index], [field]: value };

    const currentRank = newRows[index].rank;
    if (currentRank && currentRank.trim() !== '') {
        if (field === 'team') {
            newRows = newRows.map(row => 
                row.rank === currentRank ? { ...row, team: value } : row
            );
        } else if (field === 'rank') {
            const sibling = newRows.find(r => r.rank === value && r.team && r.team.trim() !== '');
            if (sibling) {
                newRows[index] = { ...newRows[index], team: sibling.team };
            }
        }
    }
    return newRows;
  }, [readOnly]);

  const handleGridPaste = useCallback((rows: GridRow[], e: React.ClipboardEvent, startRowIndex: number, startColKey: GridField) => {
    if (readOnly) return rows;
    e.preventDefault();
    const clipboardData = e.clipboardData.getData('text');
    if (!clipboardData) return rows;

    const pasteRows = clipboardData.split(/\r\n|\n|\r/).filter(row => row.trim() !== '');
    const keys: GridField[] = ['rank', 'team', 'playerRank', 'player', 'kills', 'assists', 'damage', 'time', 'adjustment'];
    const startColIndex = keys.indexOf(startColKey);
    const newRows = [...rows];
    
    while (newRows.length < startRowIndex + pasteRows.length) {
        newRows.push({ rank: '', team: '', playerRank: '', player: '', kills: '', assists: '', damage: '', time: '', adjustment: '' });
    }

    pasteRows.forEach((row, rIdx) => {
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

    const rankTeamMap = new Map<string, string>();
    newRows.forEach(row => {
        if(row.rank && row.rank.trim() && row.team && row.team.trim()) {
            if (!rankTeamMap.has(row.rank.trim())) {
                rankTeamMap.set(row.rank.trim(), row.team.trim());
            }
        }
    });

    return newRows.map(row => {
        if (row.rank && row.rank.trim() && rankTeamMap.has(row.rank.trim())) {
            const standardName = rankTeamMap.get(row.rank.trim())!;
            if (row.team !== standardName) {
                return { ...row, team: standardName };
            }
        }
        return row;
    });
  }, [readOnly]);

  return {
    selectedIndices,
    setSelectedIndices,
    toggleSelection,
    selectAll,
    toggleAll,
    clearSelection,
    undo,
    redo,
    pushToHistory,
    applyBulkEdit,
    handleGridChange,
    handleGridPaste,
    canUndo: undoStack.length > 0,
    canRedo: redoStack.length > 0
  };
}
