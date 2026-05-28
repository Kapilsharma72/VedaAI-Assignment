import { create } from 'zustand';
import type { IUser } from '@vedaai/shared';
import { clearAuthToken, getAuthToken } from '@/lib/auth-token';
import { clearFrontendSession } from '@/lib/session';
import api from '@/lib/api';

interface AuthStore {
  user: IUser | null;
  setUser: (user: IUser | null) => void;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  setUser: (user) => set({ user }),

  logout: async () => {
    try {
      await api.post('/api/auth/logout');
    } catch {
    }
    try {
      await clearFrontendSession();
    } catch {
    }
    clearAuthToken();
    set({ user: null });
  },
}));

export function hasStoredSession(): boolean {
  return Boolean(getAuthToken());
}
