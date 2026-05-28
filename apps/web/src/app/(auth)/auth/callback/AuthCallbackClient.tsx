'use client';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import api from '@/lib/api';
import { setFrontendSession } from '@/lib/session';
import { useAuthStore } from '@/store/auth.store';
import type { IUser } from '@vedaai/shared';
export default function AuthCallbackClient() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const setUser = useAuthStore((s) => s.setUser);
    const [error, setError] = useState<string | null>(null);
    useEffect(() => {
        const token = searchParams.get('token');
        if (!token) {
            setError('Sign-in failed. No token received.');
            return;
        }
        let cancelled = false;
        (async () => {
            try {
                await setFrontendSession(token);
                const user = (await api.get('/api/auth/me')) as IUser;
                if (!cancelled) {
                    setUser(user);
                    router.replace('/assignments');
                }
            }
            catch {
                if (!cancelled) {
                    setError('Could not complete sign-in. Please try again.');
                }
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [searchParams, router, setUser]);
    if (error) {
        return (<div className="min-h-screen flex items-center justify-center bg-[#f8fafc] px-4">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <a href="/login" className="text-[#6366f1] font-medium hover:underline">
            Back to login
          </a>
        </div>
      </div>);
    }
    return (<div className="min-h-screen flex items-center justify-center bg-[#f8fafc]">
      <p className="text-gray-600">Completing sign-in…</p>
    </div>);
}
