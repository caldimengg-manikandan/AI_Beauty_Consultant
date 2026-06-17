import React from 'react';

/**
 * Enterprise Loading Component — GlowAI Design System v2
 * Usage: <Loader variant="spinner" message="Analyzing your image..." />
 * Variants: spinner | dots | progress | pulse | ai-analysis
 */

const BRAND = '#5B4FF7';
const BRAND_LIGHT = 'rgba(91,79,247,0.15)';

const Loader = ({ variant = 'spinner', message = 'Loading...', size = 'md' }) => {
  const sizeMap = { sm: 'w-6 h-6', md: 'w-10 h-10', lg: 'w-16 h-16' };

  /* ── Spinner (Default) ── */
  if (variant === 'spinner') {
    return (
      <div className="flex flex-col items-center justify-center p-8" role="status" aria-label={message}>
        <svg
          className={`animate-spin ${sizeMap[size]}`}
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle className="opacity-20" cx="12" cy="12" r="10" stroke={BRAND} strokeWidth="4" />
          <path
            className="opacity-80"
            fill={BRAND}
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
        {message && (
          <p className="mt-4 text-[13px] text-slate-500 font-medium">{message}</p>
        )}
      </div>
    );
  }

  /* ── Dots ── */
  if (variant === 'dots') {
    return (
      <div className="flex flex-col items-center justify-center p-8" role="status" aria-label={message}>
        <div className="flex items-center space-x-2">
          {[0, 150, 300].map((delay, i) => (
            <div
              key={i}
              className="w-2.5 h-2.5 rounded-full animate-pulse"
              style={{
                backgroundColor: i === 1 ? '#10B981' : BRAND,
                animationDelay: `${delay}ms`,
                animationDuration: '1.2s',
              }}
            />
          ))}
        </div>
        {message && (
          <p className="mt-4 text-[13px] text-slate-500 font-medium">{message}</p>
        )}
      </div>
    );
  }

  /* ── Progress Bar ── */
  if (variant === 'progress') {
    return (
      <div className="flex flex-col items-center justify-center p-8 w-full max-w-md" role="status" aria-label={message}>
        <div className="w-full bg-slate-100 rounded-full h-1.5 mb-4 overflow-hidden">
          <div
            className="h-1.5 rounded-full animate-progress"
            style={{ background: `linear-gradient(90deg, ${BRAND}, #10B981)` }}
          />
        </div>
        {message && (
          <p className="text-[13px] text-slate-500 font-medium text-center">{message}</p>
        )}
      </div>
    );
  }

  /* ── Pulse / Skeleton ── */
  if (variant === 'pulse') {
    return (
      <div className="flex flex-col items-center justify-center p-8 w-full" role="status" aria-label={message}>
        <div className="w-full max-w-md space-y-3">
          <div className="h-4 bg-slate-100 rounded-lg animate-pulse" />
          <div className="h-4 bg-slate-100 rounded-lg animate-pulse w-5/6" />
          <div className="h-4 bg-slate-100 rounded-lg animate-pulse w-4/6" />
        </div>
        {message && (
          <p className="mt-6 text-[13px] text-slate-500 font-medium">{message}</p>
        )}
      </div>
    );
  }

  /* ── AI Analysis (face scan) ── */
  if (variant === 'ai-analysis') {
    return (
      <div className="flex flex-col items-center justify-center p-8" role="status" aria-label={message || 'Analyzing your face'}>
        <div className="relative">
          {/* Outer ring */}
          <div
            className="w-24 h-24 border-4 rounded-full animate-spin"
            style={{ borderColor: BRAND_LIGHT, borderTopColor: BRAND }}
          />
          {/* Inner icon */}
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-14 h-14 rounded-full flex items-center justify-center"
            style={{ background: BRAND }}
          >
            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
              />
            </svg>
          </div>
        </div>

        <div className="mt-6 text-center">
          <p className="text-[15px] font-bold text-slate-800 mb-1">{message || 'Analyzing Your Face...'}</p>
          <p className="text-[13px] text-slate-400">This may take a few seconds</p>
        </div>

        {/* Steps */}
        <div className="mt-5 flex items-center gap-2 text-[11px] text-slate-400">
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" aria-hidden="true" />
            Detecting face
          </span>
          <span aria-hidden="true">›</span>
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: BRAND }} aria-hidden="true" />
            Analyzing features
          </span>
          <span aria-hidden="true">›</span>
          <span className="flex items-center gap-1 opacity-50">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-300" aria-hidden="true" />
            Generating insights
          </span>
        </div>
      </div>
    );
  }

  return null;
};

export default Loader;
