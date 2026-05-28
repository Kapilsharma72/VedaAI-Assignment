'use client';

import Link from 'next/link';
import AppLayout from '@/components/layout/AppLayout';
import { useAuthStore } from '@/store/auth.store';

const STEPS = [
  {
    title: 'Create assignment',
    description: 'Upload reference material, set due date, question types, marks, and instructions.',
  },
  {
    title: 'AI generates paper',
    description: 'Gemini builds structured sections (A, B, C…) with difficulty tags and marks.',
  },
  {
    title: 'Track progress',
    description: 'WebSocket updates show live generation status on the output page.',
  },
  {
    title: 'Review & export',
    description: 'View the exam-style layout and download a formatted PDF when ready.',
  },
];

export default function HomePage() {
  const user = useAuthStore((s) => s.user);

  return (
    <AppLayout title="Home">
      <div className="px-6 py-8 max-w-5xl mx-auto space-y-10">
        <section className="rounded-2xl bg-gradient-to-br from-indigo-600 to-indigo-800 text-white p-8 shadow-lg">
          <p className="text-indigo-200 text-sm font-medium mb-2">VedaAI Assessment Creator</p>
          <h1 className="text-3xl font-bold mb-3">
            {user ? `Hello, ${user.name.split(' ')[0]}` : 'Welcome to VedaAI'}
          </h1>
          <p className="text-indigo-100 max-w-2xl mb-6">
            Build CBSE-aligned question papers in minutes. Configure your assignment, let AI generate
            structured sections and questions, then export a print-ready PDF for your class.
          </p>
          <Link
            href="/assignments/create"
            className="inline-flex items-center gap-2 rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-indigo-700 hover:bg-indigo-50 transition"
          >
            Create new assignment
          </Link>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">How it works</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {STEPS.map((step, i) => (
              <div
                key={step.title}
                className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
              >
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-700">
                  {i + 1}
                </span>
                <h3 className="mt-3 font-semibold text-gray-900">{step.title}</h3>
                <p className="mt-1 text-sm text-gray-600">{step.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Built for teachers</h2>
          <ul className="grid gap-2 sm:grid-cols-2 text-sm text-gray-600">
            <li>• Optional PDF / image upload for context</li>
            <li>• Multiple question types with marks validation</li>
            <li>• Easy / Moderate / Hard difficulty badges</li>
            <li>• MongoDB + Redis + BullMQ backend pipeline</li>
            <li>• Real-time job progress over WebSocket</li>
            <li>• One-click PDF download</li>
          </ul>
        </section>
      </div>
    </AppLayout>
  );
}
