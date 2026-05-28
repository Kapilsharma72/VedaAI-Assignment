// Feature: vedaai-assessment-creator, Property 7: PDF Filename Sanitization

/**
 * Property-Based Tests: PDF Filename Sanitization
 *
 * Property 7: PDF Filename Sanitization
 * Validates: Requirements 12.7
 *
 * For any subject and class strings (including spaces, special characters,
 * unicode, and all-non-alphanumeric strings), `buildFilename` must return a
 * filename that:
 *   1. Contains only alphanumeric characters and underscores (no other chars)
 *   2. Ends with `_QuestionPaper.pdf`
 *   3. Contains `_Class` as the separator between the sanitized subject and
 *      the sanitized class portions
 *   4. Matches the pattern: `{sanitized_subject}_Class{sanitized_class}_QuestionPaper.pdf`
 */

import * as fc from 'fast-check';
import { buildFilename } from '../lib/pdf.utils';

// ---------------------------------------------------------------------------
// Arbitraries
// ---------------------------------------------------------------------------

/**
 * Generates arbitrary strings that may include:
 * - ASCII letters and digits
 * - Spaces (single and multiple)
 * - Special characters: !, @, #, $, %, ^, &, *, (, ), -, +, =, etc.
 * - Unicode characters (emoji, accented letters, CJK, etc.)
 * - All-non-alphanumeric strings (e.g. "!@#$%")
 * - Empty strings
 */
const arbitraryString = fc.oneof(
  // Pure ASCII printable strings (includes specials and spaces)
  fc.string({ minLength: 0, maxLength: 50 }),
  // Strings with unicode characters
  fc.fullUnicodeString({ minLength: 0, maxLength: 50 }),
  // All-non-alphanumeric strings
  fc.stringOf(fc.constantFrom('!', '@', '#', '$', '%', '^', '&', '*', '(', ')', '-', '+', '=', '[', ']', '{', '}', '|', '\\', '/', '?', '<', '>', ',', '.', '~', '`', '"', "'", ';', ':', ' '), { minLength: 1, maxLength: 30 }),
  // Strings with spaces and unicode mixed
  fc.array(
    fc.oneof(
      fc.char(),
      fc.constantFrom(' ', '\t', '\n', '!', '@', '#', '€', '£', '¥', '©', '®', '™', '→', '←', '↑', '↓'),
    ),
    { minLength: 1, maxLength: 40 },
  ).map((chars) => chars.join('')),
);

// ---------------------------------------------------------------------------
// Helper: check that a string contains only alphanumeric chars and underscores
// ---------------------------------------------------------------------------

function isAlphanumericOrUnderscore(s: string): boolean {
  return /^[a-zA-Z0-9_]*$/.test(s);
}

// ---------------------------------------------------------------------------
// Property 7: PDF Filename Sanitization
// ---------------------------------------------------------------------------

describe('Property 7: PDF Filename Sanitization', () => {
  /**
   * **Validates: Requirements 12.7**
   *
   * For any subject and class strings, the filename returned by buildFilename
   * must contain only alphanumeric characters and underscores (excluding the
   * `.pdf` extension dot).
   */
  it('output filename contains only alphanumeric chars and underscores (excluding .pdf dot)', () => {
    fc.assert(
      fc.property(arbitraryString, arbitraryString, (subject, cls) => {
        const filename = buildFilename(subject, cls);
        // Strip the .pdf extension before checking characters
        const withoutExtension = filename.replace(/\.pdf$/, '');
        expect(isAlphanumericOrUnderscore(withoutExtension)).toBe(true);
      }),
      { numRuns: 100 },
    );
  });

  /**
   * **Validates: Requirements 12.7**
   *
   * The filename must always end with `_QuestionPaper.pdf`.
   */
  it('output filename always ends with _QuestionPaper.pdf', () => {
    fc.assert(
      fc.property(arbitraryString, arbitraryString, (subject, cls) => {
        const filename = buildFilename(subject, cls);
        expect(filename.endsWith('_QuestionPaper.pdf')).toBe(true);
      }),
      { numRuns: 100 },
    );
  });

  /**
   * **Validates: Requirements 12.7**
   *
   * The filename must contain `_Class` as the separator between the sanitized
   * subject and the sanitized class portions.
   */
  it('output filename contains _Class as separator between subject and class', () => {
    fc.assert(
      fc.property(arbitraryString, arbitraryString, (subject, cls) => {
        const filename = buildFilename(subject, cls);
        expect(filename).toContain('_Class');
      }),
      { numRuns: 100 },
    );
  });

  /**
   * **Validates: Requirements 12.7**
   *
   * The full filename must match the pattern:
   *   {sanitized_subject}_Class{sanitized_class}_QuestionPaper.pdf
   *
   * Where sanitized means: only alphanumeric chars and underscores.
   */
  it('output filename matches {sanitized}_Class{sanitized}_QuestionPaper.pdf pattern', () => {
    fc.assert(
      fc.property(arbitraryString, arbitraryString, (subject, cls) => {
        const filename = buildFilename(subject, cls);
        // Pattern: zero or more [a-zA-Z0-9_] chars, then _Class, then zero or
        // more [a-zA-Z0-9_] chars, then _QuestionPaper.pdf
        const pattern = /^[a-zA-Z0-9_]*_Class[a-zA-Z0-9_]*_QuestionPaper\.pdf$/;
        expect(pattern.test(filename)).toBe(true);
      }),
      { numRuns: 100 },
    );
  });

  /**
   * **Validates: Requirements 12.7**
   *
   * Spaces in subject and class are replaced with underscores in the output.
   */
  it('spaces in subject and class are replaced with underscores', () => {
    fc.assert(
      fc.property(
        fc.stringOf(fc.oneof(fc.char(), fc.constant(' ')), { minLength: 1, maxLength: 40 }),
        fc.stringOf(fc.oneof(fc.char(), fc.constant(' ')), { minLength: 1, maxLength: 40 }),
        (subject, cls) => {
          const filename = buildFilename(subject, cls);
          // The filename (excluding .pdf) must not contain raw spaces
          expect(filename).not.toContain(' ');
        },
      ),
      { numRuns: 100 },
    );
  });

  /**
   * **Validates: Requirements 12.7**
   *
   * Special characters and unicode are stripped from the output.
   */
  it('special characters and unicode are stripped from the output', () => {
    fc.assert(
      fc.property(arbitraryString, arbitraryString, (subject, cls) => {
        const filename = buildFilename(subject, cls);
        // No character outside [a-zA-Z0-9_] and '.' (for .pdf) should appear
        const validFilenamePattern = /^[a-zA-Z0-9_.]+$/;
        expect(validFilenamePattern.test(filename)).toBe(true);
      }),
      { numRuns: 100 },
    );
  });
});
