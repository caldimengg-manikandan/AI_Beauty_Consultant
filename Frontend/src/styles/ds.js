// src/styles/ds.js
// GlowAI — Enterprise Design System v2.0
// Inspired by: Stripe, Notion, Shopify, Atlassian, HubSpot
// Import: import { DS } from "../../styles/ds";
// Use as className={DS.card} or template: `${DS.card} p-5`

export const DS = {
  // ── Page shell ──────────────────────────────────────────────
  page:  "min-h-screen bg-[#F8FAFC] p-5 lg:p-10 font-sans selection:bg-violet-100",
  inner: "max-w-6xl mx-auto space-y-8",

  // ── Hero header card ─────────────────────────────────────────
  heroCard: "bg-white rounded-3xl border border-slate-100 shadow-sm p-6 lg:p-8",

  // ── Cards ─────────────────────────────────────────────────────
  card:      "bg-white rounded-2xl border border-slate-100 shadow-sm",
  cardHover: "bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:shadow-slate-900/5 hover:border-[#5B4FF7]/15 hover:-translate-y-0.5 transition-all duration-200",
  cardInset: "bg-slate-50 rounded-xl border border-slate-100",

  // ── Typography ───────────────────────────────────────────────
  pageTitle:    "text-3xl lg:text-4xl font-black text-slate-900 tracking-tight",
  sectionTitle: "text-[11px] font-bold text-slate-500 uppercase tracking-[0.08em]",
  cardTitle:    "text-sm font-bold text-slate-900",
  body:         "text-[13px] text-slate-600 leading-relaxed",
  caption:      "text-xs text-slate-400",
  micro:        "text-[9px] font-bold text-slate-400 uppercase tracking-widest",

  // ── Module pill badges (header row) ─────────────────────────
  pillPrimary: "px-3 py-1 bg-[#5B4FF7] text-white text-[9px] font-bold rounded-lg uppercase tracking-widest",
  pillTeal:    "px-2.5 py-1 bg-teal-50 text-teal-600 text-[9px] font-bold rounded-lg uppercase tracking-wide border border-teal-100",
  pillSlate:   "px-2.5 py-1 bg-slate-100 text-slate-500 text-[9px] font-bold rounded-lg uppercase tracking-wide",

  // ── Status badges ─────────────────────────────────────────────
  badgeSuccess: "text-[9px] font-bold px-2.5 py-0.5 rounded-full border bg-emerald-50 text-emerald-600 border-emerald-100 uppercase tracking-wide",
  badgeWarning: "text-[9px] font-bold px-2.5 py-0.5 rounded-full border bg-amber-50  text-amber-600  border-amber-100  uppercase tracking-wide",
  badgeDanger:  "text-[9px] font-bold px-2.5 py-0.5 rounded-full border bg-rose-50   text-rose-600   border-rose-100   uppercase tracking-wide",
  badgeInfo:    "text-[9px] font-bold px-2.5 py-0.5 rounded-full border bg-violet-50 text-violet-600 border-violet-100 uppercase tracking-wide",
  badgeNeutral: "text-[9px] font-bold px-2.5 py-0.5 rounded-full border bg-slate-50  text-slate-500  border-slate-200  uppercase tracking-wide",

  // ── Buttons ───────────────────────────────────────────────────
  // Height is fixed at 36px (py-2 + 13px font) for standard, 40px (py-2.5) for prominent
  btnPrimary:   "px-5 py-2.5 bg-[#5B4FF7] hover:bg-[#4a41d4] text-white font-semibold rounded-xl text-sm transition-all duration-150 shadow-sm hover:shadow-md hover:shadow-[#5B4FF7]/20 active:scale-[0.98] flex items-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#5B4FF7]/40",
  btnSecondary: "px-5 py-2.5 bg-slate-100 text-slate-700 font-semibold rounded-xl text-sm hover:bg-slate-200 transition-colors flex items-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400/30",
  btnDanger:    "px-5 py-2.5 bg-rose-50 text-rose-600 font-semibold rounded-xl text-sm hover:bg-rose-100 transition-colors border border-rose-100 flex items-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-400/30",
  btnGhost:     "px-4 py-2 text-slate-500 font-semibold rounded-xl text-sm hover:bg-slate-50 hover:text-slate-700 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-300",

  // ── Loading ───────────────────────────────────────────────────
  spinner:   "w-10 h-10 border-[3px] border-violet-100 border-t-[#5B4FF7] rounded-full animate-spin",
  spinnerSm: "w-5 h-5 border-2 border-violet-100 border-t-[#5B4FF7] rounded-full animate-spin",

  // ── Dot pulse (live indicator) ───────────────────────────────
  dotLive: "w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse inline-block",

  // ── Dividers ──────────────────────────────────────────────────
  vDivider: "w-px h-4 bg-slate-200 self-center",

  // ── Form controls ─────────────────────────────────────────────
  input:  "w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-[13px] text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-[#5B4FF7]/25 focus:border-[#5B4FF7]/50 outline-none transition-all duration-150 shadow-xs",
  select: "px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-[13px] text-slate-900 focus:ring-2 focus:ring-[#5B4FF7]/25 outline-none cursor-pointer transition-all duration-150",

  // ── Accent colors (reference) ─────────────────────────────────
  accentPrimary:   "#5B4FF7",
  accentSecondary: "#7C6CF9",
  accentSuccess:   "#10B981",
  accentWarning:   "#F59E0B",
  accentDanger:    "#EF4444",
};
