
import React, { useState } from 'react';
import { TeamData, MatchData, BrandingConfig } from '../types';
import { generateMasterExcel, generateRawCSV, generateClipboardBridge, generateJSON, generateAuditCSV, generateStandingsCSV, generateAdvancedAnalyticsCSV, generateAdvancedAnalyticsClipboard } from '../services/exportEngine';
import { Database, FileSpreadsheet, FileText, Clipboard, X, CheckCircle2, Download, Table, Settings2, ShieldCheck, FileJson, ScrollText, ListOrdered, ChevronDown } from 'lucide-react';

const METRIC_OPTIONS = [
    { id: 'impactScore', label: 'Impact Score', cat: 'Lethality' },
    { id: 'kpm', label: 'Kills Per Match', cat: 'Lethality' },
    { id: 'killEfficiencyRating', label: 'Kill Efficiency', cat: 'Lethality' },
    { id: 'killShare', label: 'Kill Share %', cat: 'Lethality' },
    { id: 'clutchRating', label: 'Clutch Rating', cat: 'Survival' },
    { id: 'survivalPercentile', label: 'Survival %', cat: 'Survival' },
    { id: 'survivalLead', label: 'Survival Lead', cat: 'Survival' },
    { id: 'avgPlacement', label: 'Avg Placement', cat: 'Survival' },
    { id: 'damageShare', label: 'Damage Share %', cat: 'Efficiency' },
    { id: 'dpm', label: 'Damage Per Minute', cat: 'Efficiency' },
    { id: 'efficiencyScore', label: 'Efficiency Score', cat: 'Efficiency' },
    { id: 'contributionRate', label: 'Contribution Rate', cat: 'Efficiency' },
    { id: 'soloCarryProxy', label: 'Solo Carry Proxy', cat: 'Dynamics' },
    { id: 'aggressionIndex', label: 'Aggression Index', cat: 'Dynamics' },
    { id: 'boomOrBustIndex', label: 'Boom/Bust Index', cat: 'Dynamics' },
    { id: 'combatScore', label: 'Combat Score', cat: 'Dynamics' },
];

interface DataNexusProps {
    isOpen: boolean;
    onClose: () => void;
    data: TeamData[];
    matches: MatchData[];
    branding: BrandingConfig;
}

const DataNexus: React.FC<DataNexusProps> = ({ isOpen, onClose, data, matches, branding }) => {
    const [config, setConfig] = useState({
        includeZScores: true,
        includeOutliers: true,
        includeHistory: true,
        includeAdvanced: true,
        metricSlots: ['impactScore', 'clutchRating', 'damageShare', 'soloCarryProxy'],
        filename: `${branding.orgName.replace(/\s+/g, '_')}_Export_${new Date().toISOString().split('T')[0]}`
    });

    const [status, setStatus] = useState<'idle' | 'success' | 'copy_success'>('idle');

    if (!isOpen) return null;

    const handleExcel = () => {
        generateMasterExcel(data, matches, branding, config);
        setStatus('success');
        setTimeout(() => setStatus('idle'), 2000);
    };

    const handleCSV = () => {
        const csvContent = generateRawCSV(matches, config);
        const encodedUri = encodeURI("data:text/csv;charset=utf-8," + csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `${config.filename}_Raw.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setStatus('success');
        setTimeout(() => setStatus('idle'), 2000);
    };

    const handleAuditLog = () => {
        const csvContent = generateAuditCSV(matches);
        const encodedUri = encodeURI("data:text/csv;charset=utf-8," + csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `${config.filename}_AUDIT_GRID.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setStatus('success');
        setTimeout(() => setStatus('idle'), 2000);
    };

    const handleStandingsCSV = () => {
        const csvContent = generateStandingsCSV(data);
        const encodedUri = encodeURI("data:text/csv;charset=utf-8," + csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `${config.filename}_Standings.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setStatus('success');
        setTimeout(() => setStatus('idle'), 2000);
    };

    const handleJSON = () => {
        const jsonContent = generateJSON(data, matches, branding, config);
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(jsonContent);
        const link = document.createElement("a");
        link.setAttribute("href", dataStr);
        link.setAttribute("download", `${config.filename}_Full.json`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setStatus('success');
        setTimeout(() => setStatus('idle'), 2000);
    };

    const handleClipboard = () => {
        const text = generateClipboardBridge(matches);
        navigator.clipboard.writeText(text);
        setStatus('copy_success');
        setTimeout(() => setStatus('idle'), 2000);
    };

    const handleAdvancedCSV = () => {
        const csvContent = generateAdvancedAnalyticsCSV(data, config.metricSlots);
        const encodedUri = encodeURI("data:text/csv;charset=utf-8," + csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `${config.filename}_Advanced_Analytics.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setStatus('success');
        setTimeout(() => setStatus('idle'), 2000);
    };

    const handleAdvancedClipboard = () => {
        const text = generateAdvancedAnalyticsClipboard(data, config.metricSlots);
        navigator.clipboard.writeText(text);
        setStatus('copy_success');
        setTimeout(() => setStatus('idle'), 2000);
    };

    return (
        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-tactical-black border border-tactical-gray w-full max-w-5xl rounded-sm shadow-2xl relative flex flex-col md:flex-row overflow-hidden h-[600px]">
                
                {/* LEFT: VISUAL & CONFIG */}
                <div className="w-full md:w-1/3 bg-tactical-dark border-r border-tactical-gray p-6 flex flex-col">
                     <div className="mb-8">
                        <div className="flex items-center gap-2 mb-2 text-tactical-red">
                            <Database className="w-6 h-6" />
                            <span className="font-bold text-sm tracking-widest uppercase">Data Nexus</span>
                        </div>
                        <h2 className="text-3xl font-black text-white font-serif uppercase leading-none">Export<br/>Control</h2>
                     </div>

                     <div className="space-y-6 flex-1">
                        <div className="space-y-2">
                            <label className="text-[10px] font-mono uppercase text-tactical-light font-bold">Filename Identifier</label>
                            <input 
                                value={config.filename}
                                onChange={(e) => setConfig({...config, filename: e.target.value})}
                                className="w-full bg-black border border-tactical-gray p-2 text-xs text-white font-mono focus:border-white outline-none rounded-sm"
                            />
                        </div>

                         <div className="space-y-3">
                              <label className="text-[10px] font-mono uppercase text-tactical-light font-bold flex items-center gap-2"><Settings2 className="w-3 h-3"/> Matrix Slots (Custom Metrics)</label>
                              <div className="grid grid-cols-2 gap-2">
                                  {config.metricSlots.map((slot, idx) => (
                                      <div key={idx} className="relative group">
                                          <select 
                                              value={slot}
                                              onChange={(e) => {
                                                  const newSlots = [...config.metricSlots];
                                                  newSlots[idx] = e.target.value;
                                                  setConfig({...config, metricSlots: newSlots});
                                              }}
                                              className="w-full bg-black border border-tactical-gray p-2 pr-8 text-[10px] text-white font-mono appearance-none focus:border-cyan-500 outline-none rounded-sm cursor-pointer"
                                          >
                                              {METRIC_OPTIONS.map(opt => (
                                                  <option key={opt.id} value={opt.id}>{opt.label}</option>
                                              ))}
                                          </select>
                                          <ChevronDown className="w-3 h-3 text-tactical-light absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none group-hover:text-cyan-500 transition-colors" />
                                          <div className="absolute -top-1.5 left-2 px-1 bg-tactical-dark text-[8px] text-tactical-light uppercase font-bold">Slot {idx + 1}</div>
                                      </div>
                                  ))}
                              </div>
                         </div>

                         <div className="space-y-3">
                              <label className="text-[10px] font-mono uppercase text-tactical-light font-bold flex items-center gap-2"><ShieldCheck className="w-3 h-3"/> Global Toggles</label>
                              <div className="flex items-center justify-between p-2 bg-black/40 rounded-sm border border-white/5">
                                  <span className="text-xs text-white">Calculated Z-Scores</span>
                                  <input type="checkbox" checked={config.includeZScores} onChange={e => setConfig({...config, includeZScores: e.target.checked})} className="accent-tactical-red"/>
                              </div>
                              <div className="flex items-center justify-between p-2 bg-black/40 rounded-sm border border-white/5">
                                  <span className="text-xs text-white">Identify Outliers</span>
                                  <input type="checkbox" checked={config.includeOutliers} onChange={e => setConfig({...config, includeOutliers: e.target.checked})} className="accent-tactical-red"/>
                              </div>
                         </div>
                     </div>

                     <div className="mt-auto pt-6 border-t border-tactical-gray/30 text-[10px] text-tactical-light font-mono flex items-center gap-2">
                        <ShieldCheck className="w-3 h-3 text-green-500" />
                        <span>Ready for Extraction</span>
                     </div>
                </div>

                {/* RIGHT: ACTIONS */}
                <div className="flex-1 p-8 bg-[#0E0E0E] relative overflow-y-auto">
                    <button onClick={onClose} className="absolute top-6 right-6 text-tactical-light hover:text-white"><X className="w-6 h-6" /></button>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                        {/* CARD 1: EXCEL */}
                        <button onClick={handleExcel} className="col-span-1 md:col-span-2 group flex items-center gap-6 p-6 border border-tactical-gray hover:border-green-500 hover:bg-green-500/5 transition-all rounded-sm text-left">
                            <div className="p-4 bg-tactical-dark border border-tactical-gray rounded-sm group-hover:border-green-500 group-hover:text-green-500 transition-colors">
                                <Table className="w-8 h-8 text-white group-hover:text-green-500" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-white uppercase group-hover:text-green-500 transition-colors">Master Workbook</h3>
                                <p className="text-xs text-tactical-light font-mono mt-1">Multi-sheet .XLSX (Standings, Match-by-Match, Telemetry, Analytics)</p>
                            </div>
                            <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                                <Download className="w-5 h-5 text-green-500" />
                            </div>
                        </button>

                         {/* CARD 2: CSV */}
                         <button onClick={handleCSV} className="group flex items-center gap-4 p-5 border border-tactical-gray hover:border-blue-500 hover:bg-blue-500/5 transition-all rounded-sm text-left">
                            <div className="p-3 bg-tactical-dark border border-tactical-gray rounded-sm group-hover:border-blue-500 group-hover:text-blue-500 transition-colors">
                                <FileText className="w-6 h-6 text-white group-hover:text-blue-500" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-white uppercase group-hover:text-blue-500 transition-colors">Atomic CSV</h3>
                                <p className="text-[10px] text-tactical-light font-mono mt-1">Raw Telemetry Data</p>
                            </div>
                        </button>

                         {/* CARD 6: STANDINGS CSV */}
                         <button onClick={handleStandingsCSV} className="group flex items-center gap-4 p-5 border border-tactical-gray hover:border-orange-500 hover:bg-orange-500/5 transition-all rounded-sm text-left">
                            <div className="p-3 bg-tactical-dark border border-tactical-gray rounded-sm group-hover:border-orange-500 group-hover:text-orange-500 transition-colors">
                                <ListOrdered className="w-6 h-6 text-white group-hover:text-orange-500" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-white uppercase group-hover:text-orange-500 transition-colors">Standings CSV</h3>
                                <p className="text-[10px] text-tactical-light font-mono mt-1">Leaderboard Only</p>
                            </div>
                        </button>

                         {/* CARD 3: AUDIT LOG */}
                         <button onClick={handleAuditLog} className="group flex items-center gap-4 p-5 border border-tactical-gray hover:border-red-500 hover:bg-red-500/5 transition-all rounded-sm text-left">
                            <div className="p-3 bg-tactical-dark border border-tactical-gray rounded-sm group-hover:border-red-500 group-hover:text-red-500 transition-colors">
                                <ScrollText className="w-6 h-6 text-white group-hover:text-red-500" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-white uppercase group-hover:text-red-500 transition-colors">Audit Log</h3>
                                <p className="text-[10px] text-tactical-light font-mono mt-1">Grid View Replica (Verification)</p>
                            </div>
                        </button>

                         {/* CARD 4: JSON */}
                         <button onClick={handleJSON} className="group flex items-center gap-4 p-5 border border-tactical-gray hover:border-purple-500 hover:bg-purple-500/5 transition-all rounded-sm text-left">
                            <div className="p-3 bg-tactical-dark border border-tactical-gray rounded-sm group-hover:border-purple-500 group-hover:text-purple-500 transition-colors">
                                <FileJson className="w-6 h-6 text-white group-hover:text-purple-500" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-white uppercase group-hover:text-purple-500 transition-colors">JSON Data</h3>
                                <p className="text-[10px] text-tactical-light font-mono mt-1">Structured Object Notation</p>
                            </div>
                        </button>

                         {/* CARD 5: BRIDGE */}
                         <button onClick={handleClipboard} className="group flex items-center gap-4 p-5 border border-tactical-gray hover:border-yellow-500 hover:bg-yellow-500/5 transition-all rounded-sm text-left">
                            <div className="p-3 bg-tactical-dark border border-tactical-gray rounded-sm group-hover:border-yellow-500 group-hover:text-yellow-500 transition-colors">
                                <Clipboard className="w-6 h-6 text-white group-hover:text-yellow-500" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-white uppercase group-hover:text-yellow-500 transition-colors">Spreadsheet Bridge</h3>
                                <p className="text-[10px] text-tactical-light font-mono mt-1">Smart-Copy for Google Sheets</p>
                            </div>
                        </button>

                         {/* CARD 7: ADVANCED CSV */}
                         <button onClick={handleAdvancedCSV} className="group flex items-center gap-4 p-5 border border-tactical-gray hover:border-cyan-500 hover:bg-cyan-500/5 transition-all rounded-sm text-left">
                            <div className="p-3 bg-tactical-dark border border-tactical-gray rounded-sm group-hover:border-cyan-500 group-hover:text-cyan-500 transition-colors">
                                <Database className="w-6 h-6 text-white group-hover:text-cyan-500" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-white uppercase group-hover:text-cyan-500 transition-colors">Advanced CSV</h3>
                                <p className="text-[10px] text-tactical-light font-mono mt-1">70-Metric Suite (Players)</p>
                            </div>
                        </button>

                         {/* CARD 8: ADVANCED CLIPBOARD */}
                         <button onClick={handleAdvancedClipboard} className="col-span-1 md:col-span-2 group flex items-center gap-6 p-6 border border-tactical-gray hover:border-pink-500 hover:bg-pink-500/5 transition-all rounded-sm text-left">
                            <div className="p-4 bg-tactical-dark border border-tactical-gray rounded-sm group-hover:border-pink-500 group-hover:text-pink-500 transition-colors">
                                <Clipboard className="w-8 h-8 text-white group-hover:text-pink-500" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-white uppercase group-hover:text-pink-500 transition-colors">Advanced Matrix Bridge</h3>
                                <p className="text-xs text-tactical-light font-mono mt-1">Copy the 4-Metric Matrix directly to clipboard for Sheets/Excel</p>
                            </div>
                            <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                                <Clipboard className="w-5 h-5 text-pink-500" />
                            </div>
                        </button>
                    </div>
                </div>

                {/* NOTIFICATION OVERLAY */}
                {(status === 'success' || status === 'copy_success') && (
                    <div className="absolute inset-0 bg-black/80 flex items-center justify-center animate-in fade-in duration-200 z-50">
                        <div className="bg-tactical-dark border border-green-500 p-8 rounded-sm flex flex-col items-center gap-4 text-center">
                            <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center text-green-500">
                                <CheckCircle2 className="w-8 h-8" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-black text-white uppercase">Operation Complete</h3>
                                <p className="text-sm font-mono text-tactical-light mt-2">
                                    {status === 'copy_success' ? 'Data copied to clipboard.' : 'File downloaded successfully.'}
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DataNexus;
