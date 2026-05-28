'use client';

import React, { useCallback, useRef, useState } from 'react';
import api from '@/lib/api';
import { useWizardStore } from '@/store/wizard.store';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'application/pdf'] as const;
const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

const ERROR_INVALID_TYPE =
  'File type not supported. Please upload JPEG, PNG, or PDF.';
const ERROR_OVERSIZED = 'File exceeds 10 MB limit.';

// ---------------------------------------------------------------------------
// Inline SVG icons — avoids adding an external icon library dependency
// ---------------------------------------------------------------------------

function DocumentIcon({ className }: { className?: string }) {
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
        d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"
      />
    </svg>
  );
}

function UploadCloudIcon({ className }: { className?: string }) {
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
        d="M12 16.5V9.75m0 0 3 3m-3-3-3 3M6.75 19.5a4.5 4.5 0 0 1-1.41-8.775 5.25 5.25 0 0 1 10.233-2.33 3 3 0 0 1 3.758 3.848A3.752 3.752 0 0 1 18 19.5H6.75Z"
      />
    </svg>
  );
}

function XCircleIcon({ className }: { className?: string }) {
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
        d="m9.75 9.75 4.5 4.5m0-4.5-4.5 4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
      />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Upload response shape from POST /api/upload
// ---------------------------------------------------------------------------

interface UploadResponse {
  uploadedFileUrl: string | null;
  uploadedFileText: string | null;
}

// ---------------------------------------------------------------------------
// FileUploadZone component
// ---------------------------------------------------------------------------

/**
 * FileUploadZone — drag-and-drop or click-to-browse file upload zone.
 *
 * - Accepts JPEG, PNG, and PDF files up to 10 MB
 * - Shows an image thumbnail for JPEG/PNG files
 * - Shows filename + document icon for PDF files
 * - Displays inline errors for invalid type or oversized files
 * - On a valid file, POSTs to /api/upload and stores the response in the wizard store
 */
export default function FileUploadZone() {
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState<{
    type: 'image' | 'pdf';
    name: string;
    dataUrl?: string;
  } | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  const step1 = useWizardStore((s) => s.step1);
  const setStep1 = useWizardStore((s) => s.setStep1);

  // -------------------------------------------------------------------------
  // Validation
  // -------------------------------------------------------------------------

  const validateFile = (file: File): string | null => {
    if (!(ACCEPTED_TYPES as readonly string[]).includes(file.type)) {
      return ERROR_INVALID_TYPE;
    }
    if (file.size > MAX_SIZE_BYTES) {
      return ERROR_OVERSIZED;
    }
    return null;
  };

  // -------------------------------------------------------------------------
  // Upload
  // -------------------------------------------------------------------------

  const uploadFile = useCallback(
    async (file: File) => {
      setError(null);

      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        return;
      }

      // Build local preview before uploading
      if (file.type === 'application/pdf') {
        setPreview({ type: 'pdf', name: file.name });
      } else {
        const reader = new FileReader();
        reader.onload = (e) => {
          setPreview({
            type: 'image',
            name: file.name,
            dataUrl: e.target?.result as string,
          });
        };
        reader.readAsDataURL(file);
      }

      setIsUploading(true);
      try {
        const formData = new FormData();
        formData.append('file', file);

        const response = await api.post<UploadResponse>('/api/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        }) as unknown as UploadResponse;

        // Merge with existing step1 data (step1 may be null initially)
        const existing = step1 ?? {
          dueDate: '',
          questionTypes: [],
        };

        setStep1({
          ...existing,
          uploadedFileUrl: response.uploadedFileUrl ?? null,
          uploadedFileText: response.uploadedFileText ?? null,
        });
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : 'Upload failed. Please try again.';
        setError(message);
        setPreview(null);
      } finally {
        setIsUploading(false);
      }
    },
    [step1, setStep1],
  );

  // -------------------------------------------------------------------------
  // Drag-and-drop handlers
  // -------------------------------------------------------------------------

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      void uploadFile(file);
    }
  };

  // -------------------------------------------------------------------------
  // Click-to-browse handler
  // -------------------------------------------------------------------------

  const handleZoneClick = () => {
    if (!isUploading) {
      inputRef.current?.click();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      void uploadFile(file);
    }
    // Reset input so the same file can be re-selected after removal
    e.target.value = '';
  };

  // -------------------------------------------------------------------------
  // Remove file
  // -------------------------------------------------------------------------

  const handleRemove = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    setPreview(null);
    setError(null);

    const existing = step1 ?? { dueDate: '', questionTypes: [] };
    setStep1({ ...existing, uploadedFileUrl: null, uploadedFileText: null });
  };

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <div className="w-full">
      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        accept=".jpg,.jpeg,.png,.pdf"
        className="sr-only"
        aria-label="Upload file"
        onChange={handleInputChange}
        tabIndex={-1}
      />

      {/* Drop zone */}
      <div
        role="button"
        tabIndex={0}
        aria-label="File upload zone. Click or drag and drop a JPEG, PNG, or PDF file here."
        onClick={handleZoneClick}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleZoneClick();
          }
        }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={[
          'relative flex min-h-[160px] w-full cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-8 text-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6366f1] focus-visible:ring-offset-2',
          isDragOver
            ? 'border-[#6366f1] bg-indigo-50'
            : error
              ? 'border-red-400 bg-red-50'
              : 'border-gray-300 bg-gray-50 hover:border-[#6366f1] hover:bg-indigo-50',
          isUploading ? 'pointer-events-none opacity-70' : '',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        {/* Preview state */}
        {preview ? (
          <div
            className="flex w-full flex-col items-center gap-3"
            onClick={(e) => e.stopPropagation()}
          >
            {preview.type === 'image' && preview.dataUrl ? (
              /* Image thumbnail */
              <img
                src={preview.dataUrl}
                alt={`Preview of ${preview.name}`}
                className="max-h-40 max-w-full rounded-lg object-contain shadow-sm"
              />
            ) : (
              /* PDF icon + filename */
              <div className="flex flex-col items-center gap-2">
                <DocumentIcon className="h-12 w-12 text-[#6366f1]" />
                <span className="max-w-xs truncate text-sm font-medium text-gray-700">
                  {preview.name}
                </span>
              </div>
            )}

            {/* Remove button */}
            <button
              type="button"
              onClick={handleRemove}
              aria-label="Remove uploaded file"
              className="mt-1 flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
            >
              <XCircleIcon className="h-4 w-4" />
              Remove
            </button>
          </div>
        ) : isUploading ? (
          /* Uploading state */
          <div className="flex flex-col items-center gap-3">
            <div
              className="h-8 w-8 animate-spin rounded-full border-2 border-[#6366f1] border-t-transparent"
              role="status"
              aria-label="Uploading file"
            />
            <p className="text-sm text-gray-500">Uploading…</p>
          </div>
        ) : (
          /* Idle / drag-over state */
          <div className="flex flex-col items-center gap-3 pointer-events-none">
            <UploadCloudIcon
              className={[
                'h-10 w-10 transition-colors',
                isDragOver ? 'text-[#6366f1]' : 'text-gray-400',
              ].join(' ')}
            />
            <div>
              <p className="text-sm font-medium text-gray-700">
                <span className="text-[#6366f1]">Click to browse</span> or drag and drop
              </p>
              <p className="mt-1 text-xs text-gray-400">JPEG, PNG, or PDF — max 10 MB</p>
            </div>
          </div>
        )}
      </div>

      {/* Inline error message */}
      {error && (
        <p
          role="alert"
          className="mt-2 flex items-center gap-1.5 text-sm text-red-600"
        >
          <XCircleIcon className="h-4 w-4 flex-shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
}
