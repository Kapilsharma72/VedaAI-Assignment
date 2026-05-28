import { Suspense } from 'react';
import AuthCallbackClient from './AuthCallbackClient';
export default function AuthCallbackPage() {
    return (<Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[#f8fafc]">
          <p className="text-gray-600">Completing sign-in…</p>
        </div>}>
      <AuthCallbackClient />
    </Suspense>);
}
