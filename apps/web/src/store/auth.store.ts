import { create } from 'zustand';
import type { IUser } from '@vedaai/shared';

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
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch {
    
    }
    set({ user: null });
  },
}));
