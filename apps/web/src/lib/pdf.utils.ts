/**
 * pdf.utils.ts — PDF filename sanitization and download utilities.
 *
 * Requirements: 12.7, 12.8, 12.9
 *
 * NOTE: `downloadPDF` uses `@react-pdf/renderer`'s `pdf()` function which is
 * browser-only. Only call it from client components.
 */

import type { IGeneratedPaper } from '@vedaai/shared';

// ---------------------------------------------------------------------------
// buildFilename
// ---------------------------------------------------------------------------

/**
 * Sanitizes `subject` and `cls` by:
 *  1. Removing all non-alphanumeric characters (except spaces)
 *  2. Replacing spaces with underscores
 *
 * Returns: `{sanitized_subject}_Class{sanitized_class}_QuestionPaper.pdf`
 *
 * Example:
 *   buildFilename("Science (Physics)", "10 A")
 *   → "Science_Physics_Class10_A_QuestionPaper.pdf"
 *
 * Requirements: 12.7
 */
export function buildFilename(subject: string, cls: string): string {
  const sanitize = (input: string): string =>
    input
      .replace(/[^a-zA-Z0-9 ]/g, '') // remove non-alphanumeric (keep spaces)
      .replace(/ +/g, '_');           // replace spaces (including runs) with underscores

  const sanitizedSubject = sanitize(subject);
  const sanitizedClass = sanitize(cls);

  return `${sanitizedSubject}_Class${sanitizedClass}_QuestionPaper.pdf`;
}

// ---------------------------------------------------------------------------
// downloadPDF
// ---------------------------------------------------------------------------

/**
 * Generates a PDF blob from `paper` using `@react-pdf/renderer`'s `pdf()`
 * function, then triggers a browser download via a temporary `<a>` element
 * without navigating away from the current page.
 *
 * Throws on failure so the caller can display a toast notification.
 *
 * Requirements: 12.8
 */
export async function downloadPDF(paper: IGeneratedPaper): Promise<void> {
  // Dynamically import PDFDocument (avoids SSR issues with @react-pdf/renderer)
  const { default: PDFDocument } = await import('@/components/PDFDocument');

  // Dynamically import pdf() from @react-pdf/renderer (browser-only)
  const { pdf } = await import('@react-pdf/renderer');

  // Import React for JSX
  const React = await import('react');

  // Generate the PDF blob — cast through unknown to satisfy @react-pdf/renderer's
  // strict DocumentProps requirement while passing our custom PDFDocument component.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const blob = await pdf(
    React.createElement(PDFDocument, { paper }) as any
  ).toBlob();

  // Build the filename
  const filename = buildFilename(paper.subject, paper.class);

  // Create an object URL and trigger the download
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.style.display = 'none';
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);

  // Revoke the object URL to free memory
  URL.revokeObjectURL(url);
}
