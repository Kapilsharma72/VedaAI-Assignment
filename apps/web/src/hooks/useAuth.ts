'use client';
import { useEffect } from 'react';
import type { IUser } from '@vedaai/shared';
import api from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
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
