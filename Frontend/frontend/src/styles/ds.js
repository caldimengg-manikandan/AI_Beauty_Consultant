// src/styles/ds.js
// AI Beauty Consultant — Unified Design System
// Import this in any module: import { DS } from "../../styles/ds";
// Use as className={DS.card} or template: `${DS.card} p-5`

export const DS = {
  // Page shell
  page:    "min-h-screen bg-[#fafaf9] p-5 lg:p-10 font-sans selection:bg-violet-100",
  inner:   "max-w-6xl mx-auto space-y-8",

  // Hero header card
  heroCard: "bg-white rounded-3xl border border-slate-100 shadow-sm p-6 lg:p-8",

  // Cards
  card:        "bg-white rounded-2xl border border-slate-100 shadow-sm",
  cardHover:   "bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-lg hover:shadow-slate-900/5 hover:-translate-y-0.5 transition-all duration-200",
  cardInset:   "bg-slate-50 rounded-xl border border-slate-100",

  // Typography
  pageTitle:    "text-3xl lg:text-4xl font-black text-slate-900 tracking-tight",
  sectionTitle: "text-[11px] font-black text-slate-800 uppercase tracking-widest",
  cardTitle:    "text-sm font-bold text-slate-900",
  body:         "text-sm text-slate-600 leading-relaxed",
  caption:      "text-xs text-slate-400",
  micro:        "text-[9px] font-black text-slate-400 uppercase tracking-widest",

  // Module pill badges (header row)
  pillPrimary:  "px-3 py-1 bg-violet-600 text-white text-[9px] font-black rounded-lg uppercase tracking-widest",
  pillTeal:     "px-2.5 py-1 bg-teal-50 text-teal-600 text-[9px] font-black rounded-lg uppercase tracking-wide border border-teal-100",
  pillSlate:    "px-2.5 py-1 bg-slate-100 text-slate-500 text-[9px] font-black rounded-lg uppercase tracking-wide",

  // Status badges
  badgeSuccess: "text-[9px] font-black px-2.5 py-0.5 rounded-full border bg-emerald-50 text-emerald-600 border-emerald-100 uppercase tracking-wide",
  badgeWarning: "text-[9px] font-black px-2.5 py-0.5 rounded-full border bg-amber-50  text-amber-600  border-amber-100  uppercase tracking-wide",
  badgeDanger:  "text-[9px] font-black px-2.5 py-0.5 rounded-full border bg-rose-50   text-rose-600   border-rose-100   uppercase tracking-wide",
  badgeInfo:    "text-[9px] font-black px-2.5 py-0.5 rounded-full border bg-violet-50 text-violet-600 border-violet-100 uppercase tracking-wide",
  badgeNeutral: "text-[9px] font-black px-2.5 py-0.5 rounded-full border bg-slate-50  text-slate-500  border-slate-200  uppercase tracking-wide",

  // Buttons
  btnPrimary:   "px-6 py-3 bg-gradient-to-r from-violet-600 to-teal-500 text-white font-black rounded-xl text-[10px] uppercase tracking-widest hover:opacity-90 transition-all shadow-lg shadow-violet-100 active:scale-95 flex items-center gap-2",
  btnSecondary: "px-5 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-xl text-xs hover:bg-slate-200 transition-colors flex items-center gap-2",
  btnDanger:    "px-5 py-2.5 bg-rose-50 text-rose-600 font-bold rounded-xl text-xs hover:bg-rose-100 transition-colors border border-rose-100 flex items-center gap-2",
  btnGhost:     "px-4 py-2 text-slate-500 font-bold rounded-xl text-xs hover:bg-slate-50 transition-colors",

  // Loading
  spinner:   "w-10 h-10 border-[3px] border-violet-100 border-t-violet-600 rounded-full animate-spin",
  spinnerSm: "w-5 h-5 border-2 border-violet-100 border-t-violet-600 rounded-full animate-spin",

  // Dot pulse (live indicator)
  dotLive: "w-1.5 h-1.5 bg-teal-500 rounded-full animate-pulse inline-block",

  // Dividers
  vDivider: "w-px h-4 bg-slate-200 self-center",

  // Form controls
  input:  "w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-violet-400 focus:border-transparent outline-none transition-all",
  select: "px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:ring-2 focus:ring-violet-400 outline-none cursor-pointer",

  // Accent colors (reference)
  accentPrimary: "violet-600",
  accentSecondary: "teal-500",
};
