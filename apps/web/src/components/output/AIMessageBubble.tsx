'use client';

import React, { useState } from 'react';
import { toast } from 'sonner';
import api from '@/lib/api';
import type { IGeneratedPaper } from '@vedaai/shared';
import { downloadPDF } from '@/lib/pdf.utils';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface AIMessageBubbleProps {
  /** The assignment ID used for the regenerate API call */
  assignmentId: string;
  /** Callback to trigger PDF download (fallback when `paper` is not provided) */
  onDownloadPDF: () => void;
  /**
   * The generated paper object. When provided, clicking "Download as PDF"
   * uses `downloadPDF()` from pdf.utils instead of the `onDownloadPDF` callback.
   */
  paper?: IGeneratedPaper;
  /** Callback called after successful regeneration trigger (to reset progress) */
  onRegenerateStart?: () => void;
  /** Subject name for contextual AI message */
  subject?: string;
  /** Optional additional class names */
  className?: string;
}

// ---------------------------------------------------------------------------
// Inline SVG icons
// ---------------------------------------------------------------------------

function DownloadIcon({ className }: { className?: string }) {
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
        d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3"
      />
    </svg>
  );
}

function RegenerateIcon({ className }: { className?: string }) {
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
        d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99"
      />
    </svg>
  );
}

function SparklesIcon({ className }: { className?: string }) {
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
        d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z"
      />
    </svg>
  );
}

function WarningIcon({ className }: { className?: string }) {
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
        d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
      />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Confirmation Dialog
// ---------------------------------------------------------------------------

interface ConfirmDialogProps {
  onConfirm: () => void;
  onCancel: () => void;
  isLoading: boolean;
}

function ConfirmDialog({ onConfirm, onCancel, isLoading }: ConfirmDialogProps) {
  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="regen-dialog-title"
      aria-describedby="regen-dialog-desc"
    >
      <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-2xl">
        {/* Warning icon + title */}
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-amber-100">
            <WarningIcon className="h-5 w-5 text-amber-600" />
          </div>
          <div>
            <h2
              id="regen-dialog-title"
              className="text-base font-semibold text-gray-900"
            >
              Regenerate question paper?
            </h2>
            <p
              id="regen-dialog-desc"
              className="mt-1 text-sm text-gray-500"
            >
              This will permanently replace the current question paper with a new
              AI-generated one. This action cannot be undone.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-5 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6366f1] focus-visible:ring-offset-2 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className="flex items-center gap-2 rounded-lg bg-[#6366f1] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#4f46e5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6366f1] focus-visible:ring-offset-2 disabled:opacity-50"
          >
            {isLoading ? (
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
                Regenerating…
              </>
            ) : (
              'Confirm'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// AIMessageBubble component
// ---------------------------------------------------------------------------

/**
 * AIMessageBubble — dark-background card displayed above the generated question paper.
 *
 * - Shows a contextual AI message about the generated paper
 * - "⬇ Download as PDF" button: when `paper` is provided, uses `downloadPDF()`
 *   from pdf.utils (blob API, no navigation); otherwise falls back to `onDownloadPDF`
 * - "↺ Regenerate" button shows a confirmation dialog before calling
 *   POST /api/assignments/:id/regenerate; on success shows a sonner toast and
 *   calls `onRegenerateStart` to reset the progress state
 *
 * Requirements: 11.11, 12.7, 12.8, 12.9, 13.6, 13.7, 13.8, 16.8
 */
export default function AIMessageBubble({
  assignmentId,
  onDownloadPDF,
  paper,
  onRegenerateStart,
  subject,
  className = '',
}: AIMessageBubbleProps) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  // Build a contextual message based on whether a subject is provided
  const contextualMessage = subject
    ? `Your ${subject} question paper has been generated successfully. You can download it as a PDF or regenerate for a different set of questions.`
    : 'Your question paper has been generated successfully. You can download it as a PDF or regenerate for a different set of questions.';

  // ---------------------------------------------------------------------------
  // Download handler
  // ---------------------------------------------------------------------------

  const handleDownload = async () => {
    if (!paper) {
      // Fallback to the provided callback when no paper object is available
      onDownloadPDF();
      return;
    }

    setIsDownloading(true);
    try {
      await downloadPDF(paper);
      toast.success('PDF downloaded successfully.');
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to generate PDF. Please try again.';
      toast.error(message, {
        action: {
          label: 'Retry',
          onClick: () => handleDownload(),
        },
      });
    } finally {
      setIsDownloading(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Regenerate handlers
  // ---------------------------------------------------------------------------

  const handleRegenerateClick = () => {
    setShowConfirm(true);
  };

  const handleCancel = () => {
    setShowConfirm(false);
  };

  const handleConfirm = async () => {
    setIsRegenerating(true);
    try {
      await api.post(`/api/assignments/${assignmentId}/regenerate`);
      setShowConfirm(false);
      toast.success('Regeneration started! Your new question paper is being generated.');
      // Reset progress state in the parent
      onRegenerateStart?.();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to start regeneration. Please try again.';
      toast.error(message);
    } finally {
      setIsRegenerating(false);
    }
  };

  return (
    <>
      {/* Dark-background AI message card */}
      <div
        className={[
          'rounded-xl bg-[#1a1f2e] p-5 text-white shadow-lg',
          className,
        ]
          .filter(Boolean)
          .join(' ')}
        role="region"
        aria-label="AI assistant message"
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {/* AI message */}
          <div className="flex items-start gap-3">
            {/* Sparkles icon as AI indicator */}
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-[#6366f1]/20">
              <SparklesIcon className="h-5 w-5 text-[#818cf8]" />
            </div>
            <p className="text-sm leading-relaxed text-gray-300">
              {contextualMessage}
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex flex-shrink-0 items-center gap-3 sm:ml-4">
            {/* Download as PDF */}
            <button
              type="button"
              onClick={handleDownload}
              disabled={isDownloading}
              className="flex items-center gap-2 rounded-lg bg-white/10 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#1a1f2e] disabled:opacity-50"
              aria-label="Download question paper as PDF"
            >
              {isDownloading ? (
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
                  <span>Generating…</span>
                </>
              ) : (
                <>
                  <DownloadIcon className="h-4 w-4" />
                  <span>Download as PDF</span>
                </>
              )}
            </button>

            {/* Regenerate */}
            <button
              type="button"
              onClick={handleRegenerateClick}
              className="flex items-center gap-2 rounded-lg border border-white/20 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#1a1f2e]"
              aria-label="Regenerate question paper"
            >
              <RegenerateIcon className="h-4 w-4" />
              <span>Regenerate</span>
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation dialog — rendered outside the card via portal-like conditional */}
      {showConfirm && (
        <ConfirmDialog
          onConfirm={handleConfirm}
          onCancel={handleCancel}
          isLoading={isRegenerating}
        />
      )}
    </>
  );
}
