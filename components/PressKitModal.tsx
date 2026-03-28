
import React, { useState } from 'react';
import { TeamData, BrandingConfig, Insight } from '../types';
import PressKitRenderer from './PressKitRenderer';
import { X, FileText, Download, Loader2, ChevronLeft, ChevronRight, LogOut, BookOpen, Crown, Users, BrainCircuit } from 'lucide-react';
import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';

interface PressKitModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: TeamData[];
  branding: BrandingConfig;
  insights: Insight[];
}

type PageType = 'cover' | 1 | 2 | 3;

const PressKitModal: React.FC<PressKitModalProps> = ({ isOpen, onClose, data, branding, insights }) => {
  const [activePage, setActivePage] = useState<PageType>('cover');
  const [isGenerating, setIsGenerating] = useState(false);

  if (!isOpen) return null;

  const handleGeneratePDF = async () => {
    setIsGenerating(true);
    try {
        // Create PDF with A4 dimensions
        const doc = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        });

        const pages: PageType[] = ['cover', 1, 2, 3];
        
        for (let i = 0; i < pages.length; i++) {
            const pageNum = pages[i];
            const elementId = `press-kit-page-${pageNum}`;
            const node = document.getElementById(elementId);
            
            if (node) {
                // High quality capture (Scale 2x for retina-like PDF print)
                const dataUrl = await toPng(node, { pixelRatio: 2, quality: 0.95 });
                const imgProps = doc.getImageProperties(dataUrl);
                const pdfWidth = doc.internal.pageSize.getWidth();
                const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
                
                if (i > 0) doc.addPage();
                doc.addImage(dataUrl, 'PNG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
            }
        }

        doc.save(`${branding.orgName.replace(/\s+/g, '_')}_Media_Brief_${Date.now()}.pdf`);

    } catch (err) {
        console.error("PDF Generation failed:", err);
        alert("Failed to generate PDF. Please try again.");
    } finally {
        setIsGenerating(false);
    }
  };

  // Helper to cycle pages for preview
  const cyclePage = (direction: 'next' | 'prev') => {
      const order: PageType[] = ['cover', 1, 2, 3];
      const currentIndex = order.indexOf(activePage);
      let nextIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;
      
      if (nextIndex >= order.length) nextIndex = order.length - 1;
      if (nextIndex < 0) nextIndex = 0;
      
      setActivePage(order[nextIndex]);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex flex-col animate-in fade-in duration-300">
       {/* Toolbar */}
      <div className="h-16 border-b border-tactical-gray bg-tactical-black px-6 flex items-center justify-between">
         <div className="flex items-center gap-3">
            <FileText className="w-6 h-6 text-white" />
            <span className="font-serif font-bold text-white tracking-widest uppercase">Media Brief Generator</span>
         </div>
         <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full text-white transition-colors">
            <X className="w-5 h-5" />
         </button>
      </div>

      <div className="flex-1 flex overflow-hidden">
         {/* Sidebar / Controls */}
         <div className="w-80 bg-tactical-dark border-r border-tactical-gray p-6 flex flex-col gap-6">
             <div>
                <h3 className="text-xs font-mono uppercase text-tactical-light font-bold mb-4">Page Navigator</h3>
                <div className="flex flex-col gap-2">
                    <button onClick={() => setActivePage('cover')} className={`p-3 rounded-sm border text-left flex items-center justify-between ${activePage === 'cover' ? 'bg-white text-black border-white' : 'bg-black text-white border-tactical-gray hover:border-white'}`}>
                        <div className="flex items-center gap-3">
                            <BookOpen className="w-4 h-4" />
                            <span className="text-xs font-bold uppercase">Cover Page</span>
                        </div>
                        {activePage === 'cover' && <div className="w-2 h-2 bg-tactical-red rounded-full"></div>}
                    </button>
                    <button onClick={() => setActivePage(1)} className={`p-3 rounded-sm border text-left flex items-center justify-between ${activePage === 1 ? 'bg-white text-black border-white' : 'bg-black text-white border-tactical-gray hover:border-white'}`}>
                        <div className="flex items-center gap-3">
                            <Crown className="w-4 h-4" />
                            <span className="text-xs font-bold uppercase">1. Standings</span>
                        </div>
                        {activePage === 1 && <div className="w-2 h-2 bg-tactical-red rounded-full"></div>}
                    </button>
                    <button onClick={() => setActivePage(2)} className={`p-3 rounded-sm border text-left flex items-center justify-between ${activePage === 2 ? 'bg-white text-black border-white' : 'bg-black text-white border-tactical-gray hover:border-white'}`}>
                        <div className="flex items-center gap-3">
                            <Users className="w-4 h-4" />
                            <span className="text-xs font-bold uppercase">2. Operators</span>
                        </div>
                        {activePage === 2 && <div className="w-2 h-2 bg-tactical-red rounded-full"></div>}
                    </button>
                    <button onClick={() => setActivePage(3)} className={`p-3 rounded-sm border text-left flex items-center justify-between ${activePage === 3 ? 'bg-white text-black border-white' : 'bg-black text-white border-tactical-gray hover:border-white'}`}>
                        <div className="flex items-center gap-3">
                            <BrainCircuit className="w-4 h-4" />
                            <span className="text-xs font-bold uppercase">3. Intel</span>
                        </div>
                        {activePage === 3 && <div className="w-2 h-2 bg-tactical-red rounded-full"></div>}
                    </button>
                </div>
             </div>

             <div className="mt-auto space-y-3">
                 <button 
                    onClick={handleGeneratePDF}
                    disabled={isGenerating}
                    className="w-full py-4 bg-tactical-red text-white font-black uppercase tracking-widest text-sm hover:bg-red-600 transition-all flex items-center justify-center gap-2 rounded-sm shadow-lg shadow-red-900/20"
                 >
                    {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                    {isGenerating ? 'Compiling PDF...' : 'Download Brief'}
                 </button>
                 <button 
                    onClick={onClose}
                    className="w-full py-3 bg-black border border-tactical-gray text-tactical-light font-bold uppercase tracking-widest text-xs hover:text-white hover:border-white transition-all flex items-center justify-center gap-2 rounded-sm"
                 >
                    <LogOut className="w-4 h-4" /> Exit Generator
                 </button>
             </div>
         </div>

         {/* Preview Area */}
         <div className="flex-1 bg-gray-900 relative flex items-center justify-center overflow-auto p-8">
             {/* The Visible Preview - Scaled Down */}
             <div className="shadow-2xl scale-[0.45] origin-center transition-transform duration-300 border-8 border-gray-800">
                <PressKitRenderer 
                    data={data} 
                    branding={branding} 
                    insights={insights} 
                    page={activePage} 
                />
             </div>
             
             {/* Navigation Arrows overlay */}
             <div className="absolute bottom-8 flex gap-4 bg-black/50 p-2 rounded-full backdrop-blur-md">
                 <button onClick={() => cyclePage('prev')} className="p-3 bg-white/10 text-white rounded-full hover:bg-white/20 transition-colors"><ChevronLeft className="w-6 h-6" /></button>
                 <span className="flex items-center text-white font-mono px-4 font-bold uppercase w-32 justify-center">
                    {activePage === 'cover' ? 'Cover' : `Page ${activePage}`}
                 </span>
                 <button onClick={() => cyclePage('next')} className="p-3 bg-white/10 text-white rounded-full hover:bg-white/20 transition-colors"><ChevronRight className="w-6 h-6" /></button>
             </div>
         </div>
      </div>

      {/* HIDDEN RENDER AREA FOR PDF CAPTURE */}
      <div className="fixed top-0 left-0 pointer-events-none opacity-0 z-[-1]" style={{ width: '1240px' }}>
          <div id="press-kit-page-cover"><PressKitRenderer data={data} branding={branding} insights={insights} page={'cover'} /></div>
          <div id="press-kit-page-1"><PressKitRenderer data={data} branding={branding} insights={insights} page={1} /></div>
          <div id="press-kit-page-2"><PressKitRenderer data={data} branding={branding} insights={insights} page={2} /></div>
          <div id="press-kit-page-3"><PressKitRenderer data={data} branding={branding} insights={insights} page={3} /></div>
      </div>
    </div>
  );
};

export default PressKitModal;
