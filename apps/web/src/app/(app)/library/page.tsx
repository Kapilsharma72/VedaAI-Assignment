'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import AppLayout from '@/components/layout/AppLayout';
import api, { ApiError } from '@/lib/api';
import type { IAssignment } from '@vedaai/shared';
import { format } from 'date-fns';

export default function LibraryPage() {
  const [papers, setPapers] = useState<IAssignment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    api
      .get<IAssignment[]>('/api/assignments')
      .then((data) => {
        if (!cancelled) {
          const completed = (data as unknown as IAssignment[]).filter(
            (a) => a.status === 'completed',
          );
          setPapers(completed);
        }
      })
      .catch((err) => {
        if (!cancelled && err instanceof ApiError && err.statusCode === 401) {
          setPapers([]);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <AppLayout title="Library">
      <div className="px-6 py-8 max-w-4xl mx-auto">
        <p className="text-gray-600 mb-6">
          Your completed question papers are saved here. Open any paper to review sections, difficulty
          tags, marks, and download the PDF again.
        </p>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-20 animate-pulse rounded-xl bg-gray-100" />
            ))}
          </div>
        ) : papers.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center">
            <p className="text-gray-900 font-medium">No saved papers yet</p>
            <p className="text-sm text-gray-500 mt-2">
              Completed assignments appear here automatically after AI generation finishes.
            </p>
            <Link
              href="/assignments/create"
              className="mt-4 inline-block text-sm font-medium text-indigo-600 hover:underline"
            >
              Create your first assignment →
            </Link>
          </div>
        ) : (
          <ul className="space-y-3">
            {papers.map((paper) => (
              <li key={paper._id}>
                <Link
                  href={`/assignments/${paper._id}`}
                  className="flex items-center justify-between rounded-xl border border-gray-200 bg-white px-5 py-4 shadow-sm hover:border-indigo-300 hover:shadow transition"
                >
                  <div>
                    <p className="font-medium text-gray-900">{paper.title}</p>
                    <p className="text-sm text-gray-500">
                      {paper.subject} · Class {paper.class} ·{' '}
                      {paper.createdAt
                        ? format(new Date(paper.createdAt), 'dd MMM yyyy')
                        : '—'}
                    </p>
                  </div>
                  <span className="text-sm font-medium text-indigo-600">View paper →</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </AppLayout>
  );
}
