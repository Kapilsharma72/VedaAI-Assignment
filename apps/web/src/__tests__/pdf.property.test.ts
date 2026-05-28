import * as fc from 'fast-check';
import { buildFilename } from '../lib/pdf.utils';
const arbitraryString = fc.oneof(fc.string({ minLength: 0, maxLength: 50 }), fc.fullUnicodeString({ minLength: 0, maxLength: 50 }), fc.stringOf(fc.constantFrom('!', '@', '#', '$', '%', '^', '&', '*', '(', ')', '-', '+', '=', '[', ']', '{', '}', '|', '\\', '/', '?', '<', '>', ',', '.', '~', '`', '"', "'", ';', ':', ' '), { minLength: 1, maxLength: 30 }), fc.array(fc.oneof(fc.char(), fc.constantFrom(' ', '\t', '\n', '!', '@', '#', '€', '£', '¥', '©', '®', '™', '→', '←', '↑', '↓')), { minLength: 1, maxLength: 40 }).map((chars) => chars.join('')));
function isAlphanumericOrUnderscore(s: string): boolean {
    return /^[a-zA-Z0-9_]*$/.test(s);
}
describe('Property 7: PDF Filename Sanitization', () => {
    it('output filename contains only alphanumeric chars and underscores (excluding .pdf dot)', () => {
        fc.assert(fc.property(arbitraryString, arbitraryString, (subject, cls) => {
            const filename = buildFilename(subject, cls);
            const withoutExtension = filename.replace(/\.pdf$/, '');
            expect(isAlphanumericOrUnderscore(withoutExtension)).toBe(true);
        }), { numRuns: 100 });
    });
    it('output filename always ends with _QuestionPaper.pdf', () => {
        fc.assert(fc.property(arbitraryString, arbitraryString, (subject, cls) => {
            const filename = buildFilename(subject, cls);
            expect(filename.endsWith('_QuestionPaper.pdf')).toBe(true);
        }), { numRuns: 100 });
    });
    it('output filename contains _Class as separator between subject and class', () => {
        fc.assert(fc.property(arbitraryString, arbitraryString, (subject, cls) => {
            const filename = buildFilename(subject, cls);
            expect(filename).toContain('_Class');
        }), { numRuns: 100 });
    });
    it('output filename matches {sanitized}_Class{sanitized}_QuestionPaper.pdf pattern', () => {
        fc.assert(fc.property(arbitraryString, arbitraryString, (subject, cls) => {
            const filename = buildFilename(subject, cls);
            const pattern = /^[a-zA-Z0-9_]*_Class[a-zA-Z0-9_]*_QuestionPaper\.pdf$/;
            expect(pattern.test(filename)).toBe(true);
        }), { numRuns: 100 });
    });
    it('spaces in subject and class are replaced with underscores', () => {
        fc.assert(fc.property(fc.stringOf(fc.oneof(fc.char(), fc.constant(' ')), { minLength: 1, maxLength: 40 }), fc.stringOf(fc.oneof(fc.char(), fc.constant(' ')), { minLength: 1, maxLength: 40 }), (subject, cls) => {
            const filename = buildFilename(subject, cls);
            expect(filename).not.toContain(' ');
        }), { numRuns: 100 });
    });
    it('special characters and unicode are stripped from the output', () => {
        fc.assert(fc.property(arbitraryString, arbitraryString, (subject, cls) => {
            const filename = buildFilename(subject, cls);
            const validFilenamePattern = /^[a-zA-Z0-9_.]+$/;
            expect(validFilenamePattern.test(filename)).toBe(true);
        }), { numRuns: 100 });
    });
});
