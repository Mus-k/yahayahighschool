'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { useRouter } from '@/i18n/routing';
import { authService } from '@/services/auth.service';
import { ROUTES } from '@/lib/routes';

// ─────────────────────────────────────────────────────────────────────────────
// YAHAYASCOOL — Session Timeout Module
// Auto-logs out the user after IDLE_TIMEOUT_MS of inactivity.
// Shows a 60-second warning dialog before logging out.
// ─────────────────────────────────────────────────────────────────────────────

const IDLE_TIMEOUT_MS = 10 * 60 * 1000;  // 10 minutes
const WARNING_BEFORE_MS = 60 * 1000;      // Show warning 60s before logout

const ACTIVITY_EVENTS: (keyof DocumentEventMap)[] = [
  'mousemove',
  'mousedown',
  'keydown',
  'touchstart',
  'scroll',
  'click',
];

interface SessionTimeoutProps {
  /** Only enforce timeout when authenticated */
  isAuthenticated: boolean;
}

export function SessionTimeout({ isAuthenticated }: SessionTimeoutProps) {
  const router = useRouter();
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const warnTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [showWarning, setShowWarning] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimers = () => {
    if (idleTimer.current) clearTimeout(idleTimer.current);
    if (warnTimer.current) clearTimeout(warnTimer.current);
    if (countdownRef.current) clearInterval(countdownRef.current);
  };

  const doLogout = useCallback(async () => {
    clearTimers();
    setShowWarning(false);
    await authService.logout().catch(() => {});
    router.push(ROUTES.AUTH.LOGIN);
  }, [router]);

  const resetTimers = useCallback(() => {
    if (!isAuthenticated) return;
    clearTimers();
    setShowWarning(false);
    setCountdown(60);

    warnTimer.current = setTimeout(() => {
      setShowWarning(true);
      setCountdown(60);
      countdownRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            if (countdownRef.current) clearInterval(countdownRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }, IDLE_TIMEOUT_MS - WARNING_BEFORE_MS);

    idleTimer.current = setTimeout(() => {
      doLogout();
    }, IDLE_TIMEOUT_MS);
  }, [isAuthenticated, doLogout]);

  useEffect(() => {
    if (!isAuthenticated) {
      clearTimers();
      return;
    }

    resetTimers();

    ACTIVITY_EVENTS.forEach((evt) =>
      document.addEventListener(evt, resetTimers, { passive: true })
    );

    return () => {
      clearTimers();
      ACTIVITY_EVENTS.forEach((evt) =>
        document.removeEventListener(evt, resetTimers)
      );
    };
  }, [isAuthenticated, resetTimers]);

  if (!showWarning) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      {/* Dialog */}
      <div className="relative z-10 w-full max-w-md mx-4 rounded-2xl border border-amber-500/30 bg-slate-900/95 shadow-2xl shadow-amber-500/10 overflow-hidden">
        {/* Animated top bar */}
        <div
          className="h-1 bg-gradient-to-r from-amber-500 to-red-500 transition-all duration-1000"
          style={{ width: `${(countdown / 60) * 100}%` }}
        />

        <div className="p-6 space-y-5">
          {/* Icon + title */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-2xl shrink-0">
              ⏱
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Session Expiring</h2>
              <p className="text-sm text-slate-400">You have been inactive for a while</p>
            </div>
          </div>

          {/* Countdown */}
          <div className="rounded-xl bg-slate-800/60 border border-slate-700/50 p-4 text-center">
            <p className="text-slate-300 text-sm mb-1">Automatically logging out in</p>
            <p className={`text-5xl font-black tabular-nums ${countdown <= 10 ? 'text-red-400' : 'text-amber-400'}`}>
              {countdown}s
            </p>
          </div>

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              onClick={resetTimers}
              className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm transition-colors shadow-lg shadow-emerald-600/20"
            >
              Stay Signed In
            </button>
            <button
              onClick={doLogout}
              className="flex-1 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold text-sm transition-colors"
            >
              Log Out Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
