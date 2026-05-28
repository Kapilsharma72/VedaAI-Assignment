'use client';

import Link from 'next/link';
import AppLayout from '@/components/layout/AppLayout';

const TOOLS = [
  {
    title: 'Structured AI generation',
    description:
      'Input is converted into a structured prompt. The model returns JSON with sections, questions, difficulty levels, and marks — never raw LLM text on screen.',
    tag: 'Core',
  },
  {
    title: 'Background job queue',
    description:
      'Generation runs on BullMQ workers with Redis. The API responds immediately while the worker processes the job and stores results in MongoDB.',
    tag: 'Backend',
  },
  {
    title: 'Live progress (WebSocket)',
    description:
      'Socket.io pushes job:progress, job:complete, and job:failed events so teachers see real-time status while papers are being built.',
    tag: 'Real-time',
  },
  {
    title: 'Exam-style output',
    description:
      'Generated papers show school name, subject, class, student info lines, section headers, difficulty badges, and a collapsible answer key.',
    tag: 'Output',
  },
  {
    title: 'PDF export',
    description:
      'Download a properly formatted A4 PDF with section dividers, difficulty tags, and a separate answer-key page — not a browser print of raw HTML.',
    tag: 'Bonus',
  },
  {
    title: 'Regenerate paper',
    description:
      'Not happy with the result? Trigger a new generation job from the output page without re-entering the wizard.',
    tag: 'Bonus',
  },
];

export default function AIToolkitPage() {
  return (
    <AppLayout title="AI Toolkit">
      <div className="px-6 py-8 max-w-5xl mx-auto">
        <p className="text-gray-600 mb-8 max-w-2xl">
          VedaAI combines a Next.js frontend with an Express + MongoDB + Redis + BullMQ backend.
          These are the AI and infrastructure capabilities powering your assessments.
        </p>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {TOOLS.map((tool) => (
            <article
              key={tool.title}
              className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm flex flex-col"
            >
              <span className="self-start rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-700">
                {tool.tag}
              </span>
              <h2 className="mt-3 font-semibold text-gray-900">{tool.title}</h2>
              <p className="mt-2 text-sm text-gray-600 flex-1">{tool.description}</p>
            </article>
          ))}
        </div>

        <div className="mt-10 rounded-xl bg-gray-50 border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900">Try it now</h2>
          <p className="text-sm text-gray-600 mt-1">
            Start the two-step wizard to configure question types, marks, and instructions, then watch
            the AI build your paper.
          </p>
          <Link
            href="/assignments/create"
            className="mt-4 inline-flex rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition"
          >
            Open assignment wizard
          </Link>
        </div>
      </div>
    </AppLayout>
  );
}
