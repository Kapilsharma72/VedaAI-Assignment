'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import AppLayout from '@/components/layout/AppLayout';
import AssignmentCard from '@/components/assignments/AssignmentCard';
import api from '@/lib/api';
import { useAssignmentsStore } from '@/store/assignments.store';
import type { IAssignment } from '@vedaai/shared';
type StatusFilter = 'all' | IAssignment['status'];
const STATUS_OPTIONS: {
    value: StatusFilter;
    label: string;
}[] = [
    { value: 'all', label: 'All Statuses' },
    { value: 'pending', label: 'Pending' },
    { value: 'processing', label: 'Processing' },
    { value: 'completed', label: 'Completed' },
    { value: 'failed', label: 'Failed' },
];
function SkeletonCard() {
    return (<div className="animate-pulse rounded-[0.75rem] border border-gray-200 bg-white p-5 shadow-sm" aria-hidden="true">
      <div className="flex items-start justify-between gap-3">
        <div className="h-4 w-3/4 rounded bg-gray-200"/>
        <div className="h-8 w-8 flex-shrink-0 rounded-md bg-gray-200"/>
      </div>
      <div className="mt-3 flex gap-2">
        <div className="h-3 w-24 rounded bg-gray-200"/>
        <div className="h-3 w-16 rounded bg-gray-200"/>
      </div>
      <div className="mt-3 h-5 w-20 rounded-full bg-gray-200"/>
      <div className="mt-3 h-3 w-28 rounded bg-gray-200"/>
    </div>);
}
function EmptyState() {
    return (<div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-indigo-50">
        <svg className="h-12 w-12 text-[#6366f1]" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"/>
        </svg>
      </div>

      <h2 className="text-xl font-semibold text-gray-900">No assignments yet</h2>
      <p className="mt-2 max-w-sm text-sm text-gray-500">
        Get started by creating your first AI-powered assignment. It only takes a few minutes.
      </p>

      <Link href="/assignments/create" className="mt-6 inline-flex items-center gap-2 rounded-lg bg-[#6366f1] px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-indigo-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6366f1] focus-visible:ring-offset-2">
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15"/>
        </svg>
        Create Your First Assignment
      </Link>
    </div>);
}
function SearchIcon({ className }: {
    className?: string;
}) {
    return (<svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"/>
    </svg>);
}
export default function AssignmentsPage() {
    const { assignments, setAssignments } = useAssignmentsStore();
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
    useEffect(() => {
        let cancelled = false;
        async function fetchAssignments() {
            try {
                const data = await api.get<IAssignment[]>('/api/assignments');
                if (!cancelled) {
                    setAssignments(data as unknown as IAssignment[]);
                }
            }
            catch (err: unknown) {
                if (!cancelled) {
                    const msg = err instanceof Error ? err.message : 'Failed to load assignments.';
                    const { toast } = await import('sonner');
                    toast.error(msg);
                    setLoading(false);
                }
            }
            finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        }
        fetchAssignments();
        return () => {
            cancelled = true;
        };
    }, [setAssignments]);
    const filteredAssignments = assignments.filter((a) => {
        const matchesSearch = a.title
            .toLowerCase()
            .includes(searchQuery.toLowerCase().trim());
        const matchesStatus = statusFilter === 'all' || a.status === statusFilter;
        return matchesSearch && matchesStatus;
    });
    const headerActions = (<Link href="/assignments/create" className="inline-flex items-center gap-2 rounded-lg bg-[#6366f1] px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-indigo-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6366f1] focus-visible:ring-offset-2">
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15"/>
      </svg>
      New Assignment
    </Link>);
    return (<AppLayout title="Assignments" actions={headerActions}>
      <div className="px-6 py-6">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"/>
            <input type="search" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search by title…" aria-label="Search assignments by title" className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-9 pr-4 text-sm text-gray-900 placeholder-gray-400 shadow-sm transition-colors focus:border-[#6366f1] focus:outline-none focus:ring-2 focus:ring-[#6366f1]/20"/>
          </div>

          <div className="sm:w-48">
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as StatusFilter)} aria-label="Filter by status" className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-3 pr-8 text-sm text-gray-900 shadow-sm transition-colors focus:border-[#6366f1] focus:outline-none focus:ring-2 focus:ring-[#6366f1]/20 appearance-none cursor-pointer">
              {STATUS_OPTIONS.map((opt) => (<option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>))}
            </select>
          </div>
        </div>

        {loading ? (<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (<SkeletonCard key={i}/>))}
          </div>) : filteredAssignments.length === 0 ? (assignments.length === 0 ? (<EmptyState />) : (<div className="flex flex-col items-center justify-center py-16 text-center">
              <p className="text-sm text-gray-500">
                No assignments match your current filters.
              </p>
              <button type="button" onClick={() => {
                setSearchQuery('');
                setStatusFilter('all');
            }} className="mt-3 text-sm font-medium text-[#6366f1] hover:underline focus-visible:outline-none">
                Clear filters
              </button>
            </div>)) : (<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {filteredAssignments.map((assignment) => (<AssignmentCard key={assignment._id} assignment={assignment}/>))}
          </div>)}
      </div>
    </AppLayout>);
}
