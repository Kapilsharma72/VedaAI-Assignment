'use client';

import React from 'react';
import { useForm, useFieldArray, useWatch, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { startOfDay } from 'date-fns';
import { useWizardStore } from '@/store/wizard.store';
import FileUploadZone from './FileUploadZone';
import QuestionTypeRow, {
  QUESTION_TYPE_OPTIONS,
  type QuestionTypeRowValue,
} from './QuestionTypeRow';

// ---------------------------------------------------------------------------
// Zod schema
// ---------------------------------------------------------------------------

const step1Schema = z.object({
  dueDate: z
    .string()
    .min(1, 'Due date is required')
    .refine((d) => new Date(d) >= startOfDay(new Date()), {
      message: 'Due date cannot be in the past',
    }),
  questionTypes: z
    .array(
      z.object({
        type: z.string(),
        count: z.number().int().min(1, 'Count must be at least 1'),
        marks: z.number().int().min(1, 'Marks must be at least 1'),
      }),
    )
    .min(1, 'Add at least one question type'),
  additionalInfo: z.string().max(2000).optional(),
  // Relative paths like /uploads/file.jpg are valid — don't use .url() which requires absolute URLs
  uploadedFileUrl: z.string().nullable().optional(),
  uploadedFileText: z.string().nullable().optional(),
});

type Step1FormValues = z.infer<typeof step1Schema>;

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface Step1DetailsProps {
  onNext: () => void;
}

// ---------------------------------------------------------------------------
// Inline SVG icons
// ---------------------------------------------------------------------------

function MicrophoneIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 1 1 6 0v8.25a3 3 0 0 1-3 3Z"
      />
    </svg>
  );
}

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// TotalsDisplay — reads watched values and renders computed totals
// ---------------------------------------------------------------------------

function TotalsDisplay({ questionTypes }: { questionTypes: QuestionTypeRowValue[] }) {
  const totalQuestions = questionTypes.reduce((sum, row) => sum + (row.count || 0), 0);
  const totalMarks = questionTypes.reduce(
    (sum, row) => sum + (row.count || 0) * (row.marks || 0),
    0,
  );

  return (
    <div className="flex gap-6 rounded-xl border border-indigo-100 bg-indigo-50 px-5 py-3">
      <div className="flex flex-col">
        <span className="text-xs font-medium text-indigo-500 uppercase tracking-wide">
          Total Questions
        </span>
        <span className="text-2xl font-bold text-[#6366f1]">{totalQuestions}</span>
      </div>
      <div className="w-px bg-indigo-200" aria-hidden="true" />
      <div className="flex flex-col">
        <span className="text-xs font-medium text-indigo-500 uppercase tracking-wide">
          Total Marks
        </span>
        <span className="text-2xl font-bold text-[#6366f1]">{totalMarks}</span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step1Details component
// ---------------------------------------------------------------------------

/**
 * Step1Details — Step 1 of the assignment creation wizard.
 *
 * Manages:
 * - File upload (via FileUploadZone which writes directly to the wizard store)
 * - Due date input with past-date validation
 * - Question types table (useFieldArray) with computed totals
 * - Additional info textarea (2000-char limit + microphone decoration)
 * - "Next" button that validates and saves to the wizard store
 *
 * Requirements: 5.1, 5.6, 5.9, 5.10, 5.11, 5.12
 */
export default function Step1Details({ onNext }: Step1DetailsProps) {
  const wizardStore = useWizardStore();
  const existingStep1 = wizardStore.step1;

  // -------------------------------------------------------------------------
  // React Hook Form setup
  // -------------------------------------------------------------------------

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<Step1FormValues>({
    resolver: zodResolver(step1Schema),
    defaultValues: {
      dueDate: existingStep1?.dueDate ?? '',
      questionTypes: existingStep1?.questionTypes?.length
        ? existingStep1.questionTypes
        : [{ type: QUESTION_TYPE_OPTIONS[0], count: 1, marks: 1 }],
      additionalInfo: existingStep1?.additionalInfo ?? '',
      uploadedFileUrl: existingStep1?.uploadedFileUrl ?? null,
      uploadedFileText: existingStep1?.uploadedFileText ?? null,
    },
  });

  // -------------------------------------------------------------------------
  // Field array for question types
  // -------------------------------------------------------------------------

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'questionTypes',
  });

  // -------------------------------------------------------------------------
  // Watched values for computed totals (Requirement 5.6)
  // React's synchronous rendering ensures updates within 300ms
  // -------------------------------------------------------------------------

  const watchedQuestionTypes = useWatch({ control, name: 'questionTypes' });
  const watchedAdditionalInfo = useWatch({ control, name: 'additionalInfo' }) ?? '';

  // -------------------------------------------------------------------------
  // Handlers
  // -------------------------------------------------------------------------

  const handleAddQuestionType = () => {
    append({ type: QUESTION_TYPE_OPTIONS[0], count: 1, marks: 1 });
  };

  // -------------------------------------------------------------------------
  // Submit handler
  // -------------------------------------------------------------------------

  const onSubmit = (data: Step1FormValues) => {
    // Merge in uploadedFileUrl / uploadedFileText from the wizard store
    // since FileUploadZone writes those directly to the store.
    const currentStep1 = useWizardStore.getState().step1;

    wizardStore.setStep1({
      dueDate: data.dueDate,
      questionTypes: data.questionTypes,
      additionalInfo: data.additionalInfo,
      uploadedFileUrl: currentStep1?.uploadedFileUrl ?? null,
      uploadedFileText: currentStep1?.uploadedFileText ?? null,
    });

    onNext();
  };

  // -------------------------------------------------------------------------
  // Shared input class
  // -------------------------------------------------------------------------

  const baseInputClass =
    'min-h-[44px] w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 transition-colors focus:border-[#6366f1] focus:outline-none focus:ring-2 focus:ring-[#6366f1] focus:ring-offset-1';

  const errorInputClass = 'border-red-400 focus:border-red-400 focus:ring-red-400';

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className="flex flex-col gap-8"
      aria-label="Step 1: Assignment details"
    >
      {/* ------------------------------------------------------------------ */}
      {/* Section: File Upload                                                 */}
      {/* ------------------------------------------------------------------ */}
      <section aria-labelledby="upload-heading">
        <h2
          id="upload-heading"
          className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500"
        >
          Reference Document <span className="font-normal text-gray-400">(optional)</span>
        </h2>
        <FileUploadZone />
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Section: Due Date                                                    */}
      {/* ------------------------------------------------------------------ */}
      <section aria-labelledby="due-date-heading">
        <h2
          id="due-date-heading"
          className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500"
        >
          Due Date <span className="text-red-500">*</span>
        </h2>
        <div className="flex flex-col gap-1">
          <label htmlFor="dueDate" className="sr-only">
            Due date
          </label>
          <input
            id="dueDate"
            type="date"
            aria-describedby={errors.dueDate ? 'dueDate-error' : undefined}
            aria-invalid={!!errors.dueDate}
            {...register('dueDate')}
            className={[
              baseInputClass,
              'max-w-xs cursor-pointer',
              errors.dueDate ? errorInputClass : '',
            ]
              .filter(Boolean)
              .join(' ')}
          />
          {errors.dueDate && (
            <p
              id="dueDate-error"
              role="alert"
              className="mt-1 text-sm text-red-600"
            >
              {errors.dueDate.message}
            </p>
          )}
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Section: Question Types                                              */}
      {/* ------------------------------------------------------------------ */}
      <section aria-labelledby="question-types-heading">
        <div className="mb-3 flex items-center justify-between gap-4">
          <h2
            id="question-types-heading"
            className="text-sm font-semibold uppercase tracking-wide text-gray-500"
          >
            Question Types <span className="text-red-500">*</span>
          </h2>
          {/* Totals display — updates synchronously with React rendering (Req 5.6) */}
          <TotalsDisplay questionTypes={watchedQuestionTypes ?? []} />
        </div>

        {/* Question type rows */}
        <div
          className="flex flex-col gap-3"
          role="list"
          aria-label="Question type rows"
        >
          {fields.map((field, index) => (
            <div key={field.id} role="listitem">
              <Controller
                control={control}
                name={`questionTypes.${index}`}
                render={({ field: controllerField }) => (
                  <QuestionTypeRow
                    index={index}
                    value={controllerField.value}
                    onChange={(_idx, fieldName, value) => {
                      controllerField.onChange({
                        ...controllerField.value,
                        [fieldName]: value,
                      });
                    }}
                    onRemove={() => remove(index)}
                  />
                )}
              />
              {/* Per-row errors */}
              {errors.questionTypes?.[index]?.count && (
                <p role="alert" className="mt-1 text-sm text-red-600">
                  {errors.questionTypes[index]?.count?.message}
                </p>
              )}
              {errors.questionTypes?.[index]?.marks && (
                <p role="alert" className="mt-1 text-sm text-red-600">
                  {errors.questionTypes[index]?.marks?.message}
                </p>
              )}
            </div>
          ))}
        </div>

        {/* Array-level error (e.g., "Add at least one question type") */}
        {errors.questionTypes && !Array.isArray(errors.questionTypes) && (
          <p role="alert" className="mt-2 text-sm text-red-600">
            {(errors.questionTypes as { message?: string }).message}
          </p>
        )}

        {/* Add Question Type button (Requirement 5.7) */}
        <button
          type="button"
          onClick={handleAddQuestionType}
          aria-label="Add a new question type row"
          className="mt-4 flex min-h-[44px] min-w-[44px] items-center gap-2 rounded-lg border border-dashed border-[#6366f1] px-4 py-2 text-sm font-medium text-[#6366f1] transition-colors hover:bg-indigo-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6366f1] focus-visible:ring-offset-1"
        >
          <PlusIcon className="h-4 w-4" />
          Add Question Type
        </button>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Section: Additional Information                                      */}
      {/* ------------------------------------------------------------------ */}
      <section aria-labelledby="additional-info-heading">
        <h2
          id="additional-info-heading"
          className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500"
        >
          Additional Information{' '}
          <span className="font-normal text-gray-400">(optional)</span>
        </h2>

        <div className="relative flex flex-col gap-1">
          {/* Microphone icon decoration (Requirement 5.12 — clicking does NOT trigger audio) */}
          <div className="relative">
            <textarea
              id="additionalInfo"
              rows={5}
              maxLength={2000}
              aria-describedby="additionalInfo-counter"
              placeholder="Add any extra context, instructions, or notes for the AI…"
              {...register('additionalInfo')}
              className={[
                'w-full resize-none rounded-lg border border-gray-300 bg-white px-3 py-3 pr-10 text-sm text-gray-900 transition-colors focus:border-[#6366f1] focus:outline-none focus:ring-2 focus:ring-[#6366f1] focus:ring-offset-1',
                errors.additionalInfo ? errorInputClass : '',
              ]
                .filter(Boolean)
                .join(' ')}
            />
            {/* Microphone icon — decorative only, no audio capture */}
            <button
              type="button"
              aria-label="Microphone (decorative — audio capture not available)"
              aria-disabled="true"
              tabIndex={-1}
              className="pointer-events-none absolute right-3 top-3 flex h-6 w-6 items-center justify-center text-gray-400"
            >
              <MicrophoneIcon className="h-5 w-5" />
            </button>
          </div>

          {/* Character counter (Requirement 5.11) */}
          <p
            id="additionalInfo-counter"
            className="self-end text-xs text-gray-400"
            aria-live="polite"
            aria-atomic="true"
          >
            {watchedAdditionalInfo.length} / 2000
          </p>

          {errors.additionalInfo && (
            <p role="alert" className="text-sm text-red-600">
              {errors.additionalInfo.message}
            </p>
          )}
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Next button                                                          */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex justify-end">
        <button
          type="submit"
          className="flex min-h-[44px] min-w-[44px] items-center gap-2 rounded-xl bg-[#6366f1] px-8 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6366f1] focus-visible:ring-offset-2 active:bg-indigo-700"
        >
          Next
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
          </svg>
        </button>
      </div>
    </form>
  );
}
