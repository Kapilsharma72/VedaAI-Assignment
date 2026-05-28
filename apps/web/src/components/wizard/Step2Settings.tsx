'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/auth.store';
import { useWizardStore } from '@/store/wizard.store';
import api, { ApiError } from '@/lib/api';
import type { IAssignment } from '@vedaai/shared';

// ---------------------------------------------------------------------------
// Zod schema (step2Schema)
// ---------------------------------------------------------------------------

const step2Schema = z.object({
  title: z
    .string()
    .min(1, 'Assignment title is required')
    .max(200, 'Title must be 200 characters or fewer'),
  subject: z
    .string()
    .min(1, 'Subject is required')
    .max(100, 'Subject must be 100 characters or fewer'),
  class: z
    .string()
    .min(1, 'Class / Grade is required')
    .max(50, 'Class must be 50 characters or fewer'),
  schoolName: z
    .string()
    .min(1, 'School name is required')
    .max(200, 'School name must be 200 characters or fewer'),
  timeAllowed: z
    .number({
      required_error: 'Time allowed is required',
      invalid_type_error: 'Time allowed must be a number',
    })
    .int('Time allowed must be a whole number')
    .min(1, 'Time allowed must be at least 1 minute')
    .max(300, 'Time allowed cannot exceed 300 minutes'),
  instructions: z.string().max(1000, 'Instructions must be 1000 characters or fewer').optional(),
});

type Step2FormValues = z.infer<typeof step2Schema>;

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface Step2SettingsProps {
  onPrevious: () => void;
}

// ---------------------------------------------------------------------------
// Step2Settings component
// ---------------------------------------------------------------------------

/**
 * Step2Settings — Step 2 of the assignment creation wizard.
 *
 * Manages:
 * - Assignment Title, Subject, Class/Grade, School Name (pre-filled from auth store),
 *   Time Allowed, and Instructions fields
 * - On "Generate Assignment →": validates, merges with Step 1 data from wizard store,
 *   calls POST /api/assignments, navigates to /assignments/{id} on success,
 *   shows sonner toast on error
 * - "Previous" button navigates back to Step 1 without clearing Step 1 store data
 *
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8
 */
export default function Step2Settings({ onPrevious }: Step2SettingsProps) {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { step1, step2, setStep2 } = useWizardStore();

  // -------------------------------------------------------------------------
  // React Hook Form setup
  // -------------------------------------------------------------------------

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Step2FormValues>({
    resolver: zodResolver(step2Schema),
    defaultValues: {
      // Restore previously entered Step 2 data if navigating back from a later step
      title: step2?.title ?? '',
      subject: step2?.subject ?? '',
      class: step2?.class ?? '',
      // Pre-fill school name from auth store (Requirement 6.2)
      schoolName: step2?.schoolName ?? user?.schoolName ?? '',
      timeAllowed: step2?.timeAllowed ?? ('' as unknown as number),
      instructions: step2?.instructions ?? '',
    },
  });

  // -------------------------------------------------------------------------
  // Submit handler — merge Step 1 + Step 2 and POST to API
  // -------------------------------------------------------------------------

  const onSubmit = async (data: Step2FormValues) => {
    // Persist Step 2 data to the wizard store
    setStep2(data);

    // Merge with Step 1 data (Requirement 6.5)
    const payload = {
      title: data.title,
      subject: data.subject,
      class: data.class,
      schoolName: data.schoolName,
      timeAllowed: data.timeAllowed,
      instructions: data.instructions ?? '',
      // Step 1 fields
      dueDate: step1?.dueDate ?? '',
      questionTypes: step1?.questionTypes ?? [],
      additionalInfo: step1?.additionalInfo ?? '',
      uploadedFileUrl: step1?.uploadedFileUrl ?? null,
      uploadedFileText: step1?.uploadedFileText ?? null,
    };

    try {
      const assignment = await api.post<IAssignment>('/api/assignments', payload) as unknown as IAssignment;
      // Navigate to the assignment output page (Requirement 6.7)
      router.push(`/assignments/${assignment._id}`);
    } catch (err) {
      // Show sonner toast with the reason for failure (Requirement 6.6)
      const message =
        err instanceof ApiError
          ? err.message
          : 'Failed to create assignment. Please try again.';
      toast.error(message);
    }
  };

  // -------------------------------------------------------------------------
  // Shared input class helpers
  // -------------------------------------------------------------------------

  const baseInputClass =
    'min-h-[44px] w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 transition-colors focus:border-[#6366f1] focus:outline-none focus:ring-2 focus:ring-[#6366f1] focus:ring-offset-1 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500';

  const errorInputClass = 'border-red-400 focus:border-red-400 focus:ring-red-400';

  const inputClass = (hasError: boolean) =>
    [baseInputClass, hasError ? errorInputClass : ''].filter(Boolean).join(' ');

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className="flex flex-col gap-6"
      aria-label="Step 2: Assignment settings"
    >
      {/* ------------------------------------------------------------------ */}
      {/* Assignment Title                                                     */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex flex-col gap-1">
        <label htmlFor="title" className="text-sm font-medium text-gray-700">
          Assignment Title <span className="text-red-500">*</span>
        </label>
        <input
          id="title"
          type="text"
          placeholder="e.g. Mid-Term Science Assessment"
          maxLength={200}
          aria-describedby={errors.title ? 'title-error' : undefined}
          aria-invalid={!!errors.title}
          {...register('title')}
          className={inputClass(!!errors.title)}
        />
        {errors.title && (
          <p id="title-error" role="alert" className="text-sm text-red-600">
            {errors.title.message}
          </p>
        )}
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Subject + Class/Grade — side by side on md+                         */}
      {/* ------------------------------------------------------------------ */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Subject */}
        <div className="flex flex-col gap-1">
          <label htmlFor="subject" className="text-sm font-medium text-gray-700">
            Subject <span className="text-red-500">*</span>
          </label>
          <input
            id="subject"
            type="text"
            placeholder="e.g. Physics"
            maxLength={100}
            aria-describedby={errors.subject ? 'subject-error' : undefined}
            aria-invalid={!!errors.subject}
            {...register('subject')}
            className={inputClass(!!errors.subject)}
          />
          {errors.subject && (
            <p id="subject-error" role="alert" className="text-sm text-red-600">
              {errors.subject.message}
            </p>
          )}
        </div>

        {/* Class / Grade */}
        <div className="flex flex-col gap-1">
          <label htmlFor="class" className="text-sm font-medium text-gray-700">
            Class / Grade <span className="text-red-500">*</span>
          </label>
          <input
            id="class"
            type="text"
            placeholder="e.g. Class 10"
            maxLength={50}
            aria-describedby={errors.class ? 'class-error' : undefined}
            aria-invalid={!!errors.class}
            {...register('class')}
            className={inputClass(!!errors.class)}
          />
          {errors.class && (
            <p id="class-error" role="alert" className="text-sm text-red-600">
              {errors.class.message}
            </p>
          )}
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* School Name (pre-filled from auth store — Requirement 6.2)          */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex flex-col gap-1">
        <label htmlFor="schoolName" className="text-sm font-medium text-gray-700">
          School Name <span className="text-red-500">*</span>
        </label>
        <input
          id="schoolName"
          type="text"
          placeholder="e.g. Delhi Public School"
          maxLength={200}
          aria-describedby={errors.schoolName ? 'schoolName-error' : undefined}
          aria-invalid={!!errors.schoolName}
          {...register('schoolName')}
          className={inputClass(!!errors.schoolName)}
        />
        {errors.schoolName && (
          <p id="schoolName-error" role="alert" className="text-sm text-red-600">
            {errors.schoolName.message}
          </p>
        )}
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Time Allowed                                                         */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex flex-col gap-1">
        <label htmlFor="timeAllowed" className="text-sm font-medium text-gray-700">
          Time Allowed{' '}
          <span className="font-normal text-gray-400">(minutes)</span>{' '}
          <span className="text-red-500">*</span>
        </label>
        <input
          id="timeAllowed"
          type="number"
          min={1}
          max={300}
          step={1}
          placeholder="e.g. 90"
          aria-describedby={errors.timeAllowed ? 'timeAllowed-error' : undefined}
          aria-invalid={!!errors.timeAllowed}
          {...register('timeAllowed', { valueAsNumber: true })}
          className={[inputClass(!!errors.timeAllowed), 'max-w-xs'].join(' ')}
        />
        {errors.timeAllowed && (
          <p id="timeAllowed-error" role="alert" className="text-sm text-red-600">
            {errors.timeAllowed.message}
          </p>
        )}
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Instructions (optional)                                              */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex flex-col gap-1">
        <label htmlFor="instructions" className="text-sm font-medium text-gray-700">
          Instructions{' '}
          <span className="font-normal text-gray-400">(optional)</span>
        </label>
        <textarea
          id="instructions"
          rows={4}
          maxLength={1000}
          placeholder="e.g. All questions are compulsory. Use blue or black pen only."
          aria-describedby={errors.instructions ? 'instructions-error' : undefined}
          aria-invalid={!!errors.instructions}
          {...register('instructions')}
          className={[
            'w-full resize-none rounded-lg border border-gray-300 bg-white px-3 py-3 text-sm text-gray-900 transition-colors focus:border-[#6366f1] focus:outline-none focus:ring-2 focus:ring-[#6366f1] focus:ring-offset-1',
            errors.instructions ? errorInputClass : '',
          ]
            .filter(Boolean)
            .join(' ')}
        />
        {errors.instructions && (
          <p id="instructions-error" role="alert" className="text-sm text-red-600">
            {errors.instructions.message}
          </p>
        )}
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Navigation buttons                                                   */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex items-center justify-between gap-4 pt-2">
        {/* Previous — navigates back to Step 1 without clearing Step 1 data (Req 6.8) */}
        <button
          type="button"
          onClick={onPrevious}
          disabled={isSubmitting}
          className="flex min-h-[44px] min-w-[44px] items-center gap-2 rounded-xl border border-gray-300 bg-white px-6 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6366f1] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
          </svg>
          Previous
        </button>

        {/* Generate Assignment → */}
        <button
          type="submit"
          disabled={isSubmitting}
          aria-busy={isSubmitting}
          className="flex min-h-[44px] min-w-[44px] items-center gap-2 rounded-xl bg-[#6366f1] px-8 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6366f1] focus-visible:ring-offset-2 active:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? (
            <>
              <svg
                className="h-4 w-4 animate-spin"
                fill="none"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              Generating…
            </>
          ) : (
            <>
              Generate Assignment
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"
                />
              </svg>
            </>
          )}
        </button>
      </div>
    </form>
  );
}
