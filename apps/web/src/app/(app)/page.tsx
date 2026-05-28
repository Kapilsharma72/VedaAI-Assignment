'use client';
import AppLayout from '@/components/layout/AppLayout';
export default function HomePage() {
    return (<AppLayout title="Home">
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="text-5xl mb-4">🏠</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Welcome to VedaAI</h1>
        <p className="text-gray-500 max-w-md">
          Your AI-powered assessment creator. Use the sidebar to navigate to your Assignments,
          Library, or AI Toolkit.
        </p>
      </div>
    </AppLayout>);
}
