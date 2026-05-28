'use client';
import React from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { toast } from 'sonner';
import type { IAssignment } from '@vedaai/shared';
import api from '@/lib/api';
import { useAssignmentsStore } from '@/store/assignments.store';
interface AssignmentCardProps {
    assignment: IAssignment;
}
type StatusConfig = {
    label: string;
    className: string;
};
const STATUS_CONFIG: Record<IAssignment['status'], StatusConfig> = {
    pending: {
        label: 'Pending',
        className: 'bg-gray-100 text-gray-600',
    },
    processing: {
        label: 'Processing',
        className: 'bg-blue-100 text-blue-700',
    },
    completed: {
        label: 'Completed',
        className: 'bg-green-100 text-green-700',
    },
    failed: {
        label: 'Failed',
        className: 'bg-red-100 text-red-700',
    },
};
function TrashIcon({ className }: {
    className?: string;
}) {
    return (<svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"/>
    </svg>);
}
function CalendarIcon({ className }: {
    className?: string;
}) {
    return (<svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5"/>
    </svg>);
}
export default function AssignmentCard({ assignment }: AssignmentCardProps) {
    const removeAssignment = useAssignmentsStore((s) => s.removeAssignment);
    const addAssignment = useAssignmentsStore((s) => s.addAssignment);
    const statusConfig = STATUS_CONFIG[assignment.status];
    const handleDelete = async (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        e.stopPropagation();
        removeAssignment(assignment._id);
        try {
            await api.delete(`/api/assignments/${assignment._id}`);
        }
        catch {
            addAssignment(assignment);
            toast.error('Failed to delete assignment. Please try again.');
        }
    };
    const formattedDueDate = (() => {
        try {
            return format(new Date(assignment.dueDate), 'MMM d, yyyy');
        }
        catch {
            return 'Invalid date';
        }
    })();
    return (<Link href={`/assignments/${assignment._id}`} className="group block rounded-[0.75rem] border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6366f1] focus-visible:ring-offset-2" aria-label={`View assignment: ${assignment.title}`}>

      <div className="flex items-start justify-between gap-3">
        <h3 className="flex-1 text-base font-semibold text-gray-900 line-clamp-2 leading-snug">
          {assignment.title}
        </h3>

        <button type="button" onClick={handleDelete} aria-label={`Delete assignment: ${assignment.title}`} className="flex-shrink-0 flex h-8 w-8 items-center justify-center rounded-md text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400">
          <TrashIcon className="h-4 w-4"/>
        </button>
      </div>


      <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-gray-500">
        <span className="font-medium text-gray-700">{assignment.subject}</span>
        <span aria-hidden="true">·</span>
        <span>Class {assignment.class}</span>
      </div>


      <div className="mt-3">
        <span className={[
            'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
            statusConfig.className,
        ].join(' ')} aria-label={`Status: ${statusConfig.label}`}>
          {statusConfig.label}
        </span>
      </div>


      <div className="mt-3 flex items-center gap-1.5 text-xs text-gray-400">
        <CalendarIcon className="h-3.5 w-3.5 flex-shrink-0"/>
        <span>Due {formattedDueDate}</span>
      </div>
    </Link>);
}
