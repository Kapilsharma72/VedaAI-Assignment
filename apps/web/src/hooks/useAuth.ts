'use client';

import { useEffect } from 'react';
import type { IUser } from '@vedaai/shared';
import api from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';

/**
 * Restores the authenticated session on page load by calling GET /api/auth/me.
 * On success, populates the auth store with the returned user.
 * On error (e.g. 401 Unauthorized), silently sets user to null — the visitor
 * is simply not authenticated and no error needs to be surfaced.
 *
 * Intended to be called once in the root layout so every page benefits from
 * the restored session without an additional network round-trip.
 *
 * Requirements: 4.8
 */
export function useAuth(): void {
  const setUser = useAuthStore((state) => state.setUser);

  useEffect(() => {
    let cancelled = false;

    api
      .get<IUser>('/api/auth/me')
      .then((user) => {
        if (!cancelled) {
          setUser(user as unknown as IUser);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setUser(null);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [setUser]);
}

export default useAuth;
