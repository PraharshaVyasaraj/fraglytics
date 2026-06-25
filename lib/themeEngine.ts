import { ExportTheme, BrandingConfig } from '../types';

export interface ThemeStyles {
  bg: string;
  text: string;
  accent: string;
  subText: string;
  border: string;
  fontHeader: string;
  fontBody: string;
  cardBg: string;
  highlight: string;
  gradient: string;
}

export const getThemeHexBg = (theme: ExportTheme): string => {
  switch (theme) {
    case 'paper': return '#F1F5F9';
    case 'rose': return '#881337';
    case 'intelligence': return '#0A0A0A';
    case 'protocol': default: return '#0E0E0E';
  }
};

export const getThemeStyles = (theme: ExportTheme, branding: BrandingConfig): ThemeStyles => {
  switch (theme) {
    case 'paper':
      return {
        bg: 'bg-slate-100',
        text: 'text-slate-900',
        accent: '#2563eb',
        subText: 'text-slate-500',
        border: 'border-slate-300',
        fontHeader: 'font-sans',
        fontBody: 'font-sans',
        cardBg: 'bg-white border border-slate-200 shadow-xl text-slate-900',
        highlight: 'bg-blue-100 text-blue-900',
        gradient: 'bg-slate-50'
      };
    case 'rose':
      return {
        bg: 'bg-rose-950',
        text: 'text-rose-50',
        accent: '#fb7185',
        subText: 'text-rose-300/70',
        border: 'border-rose-800/50',
        fontHeader: 'font-sans',
        fontBody: 'font-sans',
        cardBg: 'bg-rose-900/40 border border-rose-700/50 shadow-xl',
        highlight: 'bg-rose-800/50 text-rose-100',
        gradient: 'bg-[conic-gradient(at_top,_var(--tw-gradient-stops))] from-rose-900 via-rose-950 to-black'
      };
    case 'intelligence':
      return {
        bg: 'bg-[#0A0A0A]',
        text: 'text-white',
        accent: '#C5A073',
        subText: 'text-[#7A7A7A]',
        border: 'border-[#1A1A1A]/20',
        fontHeader: 'font-serif',
        fontBody: 'font-sans',
        cardBg: 'bg-[#F5F2ED]',
        highlight: 'bg-[#1A1A1A]/5',
        gradient: 'bg-[#0A0A0A]'
      };
    case 'protocol':
    default:
      return {
        bg: 'bg-[#0E0E0E]',
        text: 'text-white',
        accent: branding.accentColor,
        subText: 'text-tactical-light',
        border: 'border-tactical-gray',
        fontHeader: 'font-sans',
        fontBody: 'font-mono',
        cardBg: 'bg-white/5 border border-white/10',
        highlight: 'bg-white/10 text-white',
        gradient: 'bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-tactical-gray to-black'
      };
  }
};
