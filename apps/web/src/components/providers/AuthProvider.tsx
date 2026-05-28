'use client';

import { useAuth } from '@/hooks/useAuth';

/**
 * Thin client component that calls useAuth() so the session-restore
 * side-effect runs on every page load. Rendered inside the root layout
 * (which is a Server Component and cannot call hooks directly).
 */
export default function AuthProvider({ children }: { children: React.ReactNode }) {
  useAuth();
  return <>{children}</>;
}
