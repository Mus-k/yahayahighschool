'use client';

import { useAuthContext } from '@/providers/auth.provider';

// ─────────────────────────────────────────────────────────────────────────────
// YAHAYASCOOL — useAuth Hook
// Convenience wrapper around AuthContext.
// ─────────────────────────────────────────────────────────────────────────────

export function useAuth() {
  return useAuthContext();
}
