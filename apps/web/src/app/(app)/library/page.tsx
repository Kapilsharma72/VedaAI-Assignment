'use client';

import AppLayout from '@/components/layout/AppLayout';

export default function LibraryPage() {
  return (
    <AppLayout title="Library">
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="text-5xl mb-4">📚</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Library</h1>
        <p className="text-gray-500 max-w-md">
          Your saved question papers and resources will appear here. This feature is coming soon.
        </p>
      </div>
    </AppLayout>
  );
}
