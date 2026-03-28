import React, { useState } from 'react';
import { TeamData, BrandingConfig } from '../types';
import { ExportMode, AspectRatio, ExportTheme, ExportLayout } from './ExportRenderer';
import JSZip from 'jszip';
import { toPng } from 'html-to-image';
import { Download, Loader2, Users, User } from 'lucide-react';

interface BatchExportManagerProps {
    data: TeamData[];
    mode: ExportMode;
    theme: ExportTheme;
    layout: ExportLayout;
    aspectRatio: AspectRatio;
    branding: BrandingConfig;
}

export const BatchExportManager: React.FC<BatchExportManagerProps> = ({ data, mode, theme, layout, aspectRatio, branding }) => {
    const [selectedItems, setSelectedItems] = useState<string[]>([]);
    const [isExporting, setIsExporting] = useState(false);

    const toggleItem = (id: string) => {
        setSelectedItems(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    };

    const handleBatchDownload = async () => {
        setIsExporting(true);
        const zip = new JSZip();
        
        // This is a simplified approach. In a real app, we'd need to 
        // programmatically render each item in a hidden container.
        // For now, we'll just alert that this is a placeholder.
        alert(`Batch export for ${selectedItems.length} items initiated. (Implementation requires hidden render container)`);
        
        setIsExporting(false);
    };

    return (
        <div className="p-4 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase">Batch Export</h3>
            <div className="max-h-64 overflow-y-auto bg-black p-2 rounded-sm border border-tactical-gray">
                {data.map(team => (
                    <div key={team.name} className="flex items-center gap-2 p-1 text-xs text-white">
                        <input type="checkbox" checked={selectedItems.includes(team.name)} onChange={() => toggleItem(team.name)} />
                        {team.name}
                    </div>
                ))}
            </div>
            <button 
                onClick={handleBatchDownload}
                disabled={selectedItems.length === 0 || isExporting}
                className="w-full py-2 bg-tactical-red text-white font-bold text-xs uppercase flex items-center justify-center gap-2 disabled:opacity-50"
            >
                {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                Export Selected ({selectedItems.length})
            </button>
        </div>
    );
};
