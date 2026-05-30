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
    case 'slate': return '#1C2333';
    case 'paper': return '#F1F5F9';
    case 'violet': return '#1E1B2E';
    case 'emerald': return '#064E3B';
    case 'amber': return '#451a03';
    case 'rose': return '#881337';
    case 'cyan': return '#0e7490';
    case 'intelligence': return '#0A0A0A';
    case 'protocol': default: return '#0E0E0E';
  }
};

export const getThemeStyles = (theme: ExportTheme, branding: BrandingConfig): ThemeStyles => {
  switch (theme) {
    case 'slate':
      return {
        bg: 'bg-[#1C2333]',
        text: 'text-[#E2E8F0]',
        accent: '#94A3B8',
        subText: 'text-slate-400',
        border: 'border-slate-600',
        fontHeader: 'font-sans',
        fontBody: 'font-mono',
        cardBg: 'bg-slate-900/50 border border-slate-700 shadow-xl',
        highlight: 'bg-slate-700/50 text-slate-100',
        gradient: 'bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-slate-800 to-[#1C2333]'
      };
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
    case 'violet':
      return {
        bg: 'bg-[#1E1B2E]',
        text: 'text-[#F5F3FF]',
        accent: '#A78BFA',
        subText: 'text-violet-300/70',
        border: 'border-violet-800/50',
        fontHeader: 'font-sans',
        fontBody: 'font-sans',
        cardBg: 'bg-black/20 border border-violet-500/20 shadow-2xl',
        highlight: 'bg-violet-900/40 text-violet-100',
        gradient: 'bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-[#2E1065] via-[#1E1B2E] to-black'
      };
    case 'emerald':
      return {
        bg: 'bg-emerald-950',
        text: 'text-emerald-50',
        accent: '#34d399',
        subText: 'text-emerald-300/70',
        border: 'border-emerald-800/50',
        fontHeader: 'font-sans',
        fontBody: 'font-mono',
        cardBg: 'bg-emerald-900/40 border border-emerald-700/50 shadow-xl',
        highlight: 'bg-emerald-800/50 text-emerald-100',
        gradient: 'bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-emerald-900 via-emerald-950 to-black'
      };
    case 'amber':
      return {
        bg: 'bg-amber-950',
        text: 'text-amber-50',
        accent: '#fbbf24',
        subText: 'text-amber-300/70',
        border: 'border-amber-800/50',
        fontHeader: 'font-serif',
        fontBody: 'font-sans',
        cardBg: 'bg-amber-900/40 border border-amber-700/50 shadow-xl',
        highlight: 'bg-amber-800/50 text-amber-100',
        gradient: 'bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-amber-900 via-amber-950 to-black'
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
    case 'cyan':
      return {
        bg: 'bg-cyan-950',
        text: 'text-cyan-50',
        accent: '#22d3ee',
        subText: 'text-cyan-300/70',
        border: 'border-cyan-800/50',
        fontHeader: 'font-mono',
        fontBody: 'font-mono',
        cardBg: 'bg-cyan-900/40 border border-cyan-700/50 shadow-xl',
        highlight: 'bg-cyan-800/50 text-cyan-100',
        gradient: 'bg-[radial-gradient(circle_at_bottom_left,_var(--tw-gradient-stops))] from-cyan-900 via-cyan-950 to-black'
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
