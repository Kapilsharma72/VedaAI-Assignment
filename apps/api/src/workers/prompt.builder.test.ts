/**
 * Unit tests for prompt.builder.ts
 *
 * Covers sanitizeForPrompt and buildPrompt behaviour.
 * Requirements: 9.4, 9.11, 14.5
 */

import { IAssignment } from '@vedaai/shared';
import { buildPrompt, sanitizeForPrompt } from './prompt.builder';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeAssignment(overrides: Partial<IAssignment> = {}): IAssignment {
  return {
    _id: 'asgn-001',
    userId: 'user-001',
    title: 'Mid-Term Test',
    subject: 'Mathematics',
    class: '10',
    schoolName: 'Delhi Public School',
    dueDate: new Date('2025-12-01'),
    timeAllowed: 90,
    instructions: 'Attempt all questions.',
    additionalInfo: '',
    questionTypes: [
      { type: 'MCQ', count: 10, marks: 1 },
      { type: 'Short Questions', count: 5, marks: 3 },
    ],
    uploadedFileUrl: null,
    uploadedFileText: null,
    status: 'pending',
    jobId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// sanitizeForPrompt
// ---------------------------------------------------------------------------

describe('sanitizeForPrompt', () => {
  it('strips backticks', () => {
    expect(sanitizeForPrompt('hello `world`')).toBe('hello world');
  });

  it('strips backslashes', () => {
    expect(sanitizeForPrompt('path\\to\\file')).toBe('pathtofile');
  });

  it('strips both backticks and backslashes together', () => {
    expect(sanitizeForPrompt('`foo\\bar`')).toBe('foobar');
  });

  it('collapses 3 consecutive newlines to 2', () => {
    expect(sanitizeForPrompt('a\n\n\nb')).toBe('a\n\nb');
  });

  it('collapses 5 consecutive newlines to 2', () => {
    expect(sanitizeForPrompt('a\n\n\n\n\nb')).toBe('a\n\nb');
  });

  it('leaves 2 consecutive newlines unchanged', () => {
    expect(sanitizeForPrompt('a\n\nb')).toBe('a\n\nb');
  });

  it('leaves a single newline unchanged', () => {
    expect(sanitizeForPrompt('a\nb')).toBe('a\nb');
  });

  it('trims leading and trailing whitespace', () => {
    expect(sanitizeForPrompt('  hello  ')).toBe('hello');
  });

  it('returns empty string for empty input', () => {
    expect(sanitizeForPrompt('')).toBe('');
  });

  it('handles input with only backticks and backslashes', () => {
    expect(sanitizeForPrompt('`\\`\\')).toBe('');
  });

  it('does not alter normal alphanumeric text', () => {
    const input = 'The quick brown fox jumps over the lazy dog.';
    expect(sanitizeForPrompt(input)).toBe(input);
  });
});

// ---------------------------------------------------------------------------
// buildPrompt — field inclusion
// ---------------------------------------------------------------------------

describe('buildPrompt — required field inclusion', () => {
  it('includes the subject in the prompt', () => {
    const prompt = buildPrompt(makeAssignment({ subject: 'Physics' }));
    expect(prompt).toContain('Physics');
  });

  it('includes the class in the prompt', () => {
    const prompt = buildPrompt(makeAssignment({ class: '11' }));
    expect(prompt).toContain('11');
  });

  it('includes the school name in the prompt', () => {
    const prompt = buildPrompt(makeAssignment({ schoolName: 'Sunrise Academy' }));
    expect(prompt).toContain('Sunrise Academy');
  });

  it('includes the time allowed in the prompt', () => {
    const prompt = buildPrompt(makeAssignment({ timeAllowed: 120 }));
    expect(prompt).toContain('120');
  });

  it('includes teacher instructions when provided', () => {
    const prompt = buildPrompt(
      makeAssignment({ instructions: 'All questions are compulsory.' })
    );
    expect(prompt).toContain('All questions are compulsory.');
  });

  it('omits the instructions section when instructions is empty', () => {
    const prompt = buildPrompt(makeAssignment({ instructions: '' }));
    expect(prompt).not.toContain('TEACHER INSTRUCTIONS');
  });

  it('includes each question type name', () => {
    const prompt = buildPrompt(
      makeAssignment({
        questionTypes: [
          { type: 'MCQ', count: 5, marks: 1 },
          { type: 'Long Questions', count: 2, marks: 5 },
        ],
      })
    );
    expect(prompt).toContain('MCQ');
    expect(prompt).toContain('Long Questions');
  });

  it('includes question count for each type', () => {
    const prompt = buildPrompt(
      makeAssignment({
        questionTypes: [{ type: 'MCQ', count: 8, marks: 2 }],
      })
    );
    expect(prompt).toContain('8');
  });

  it('includes marks per question for each type', () => {
    const prompt = buildPrompt(
      makeAssignment({
        questionTypes: [{ type: 'Short Questions', count: 4, marks: 3 }],
      })
    );
    expect(prompt).toContain('3');
  });
});

// ---------------------------------------------------------------------------
// buildPrompt — CBSE curriculum context
// ---------------------------------------------------------------------------

describe('buildPrompt — CBSE curriculum context', () => {
  it('mentions CBSE in the prompt', () => {
    const prompt = buildPrompt(makeAssignment());
    expect(prompt.toUpperCase()).toContain('CBSE');
  });

  it('mentions NCERT or curriculum alignment', () => {
    const prompt = buildPrompt(makeAssignment());
    // Either NCERT or curriculum should appear
    const hasContext =
      prompt.includes('NCERT') || prompt.toLowerCase().includes('curriculum');
    expect(hasContext).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// buildPrompt — difficulty distribution (Requirement 9.11)
// ---------------------------------------------------------------------------

describe('buildPrompt — difficulty distribution instruction', () => {
  it('instructs 40% Easy questions', () => {
    const prompt = buildPrompt(makeAssignment());
    expect(prompt).toContain('40%');
    expect(prompt.toLowerCase()).toContain('easy');
  });

  it('instructs 40% Moderate questions', () => {
    const prompt = buildPrompt(makeAssignment());
    expect(prompt.toLowerCase()).toContain('moderate');
  });

  it('instructs 20% Hard questions', () => {
    const prompt = buildPrompt(makeAssignment());
    expect(prompt).toContain('20%');
    expect(prompt.toLowerCase()).toContain('hard');
  });

  it('includes all three difficulty levels in the same prompt', () => {
    const prompt = buildPrompt(makeAssignment());
    expect(prompt).toContain('40%');
    expect(prompt).toContain('20%');
    expect(prompt.toLowerCase()).toContain('easy');
    expect(prompt.toLowerCase()).toContain('moderate');
    expect(prompt.toLowerCase()).toContain('hard');
  });
});

// ---------------------------------------------------------------------------
// buildPrompt — uploaded reference material
// ---------------------------------------------------------------------------

describe('buildPrompt — uploaded reference material', () => {
  it('includes uploadedFileText when provided', () => {
    const prompt = buildPrompt(
      makeAssignment({ uploadedFileText: 'Chapter 1: Algebra basics.' })
    );
    expect(prompt).toContain('Chapter 1: Algebra basics.');
  });

  it('includes uploadedFileUrl when no text is provided', () => {
    const prompt = buildPrompt(
      makeAssignment({
        uploadedFileText: null,
        uploadedFileUrl: 'https://example.com/doc.pdf',
      })
    );
    expect(prompt).toContain('https://example.com/doc.pdf');
  });

  it('prefers uploadedFileText over uploadedFileUrl when both are present', () => {
    const prompt = buildPrompt(
      makeAssignment({
        uploadedFileText: 'Extracted text content.',
        uploadedFileUrl: 'https://example.com/doc.pdf',
      })
    );
    expect(prompt).toContain('Extracted text content.');
    // URL should not appear when text is available
    expect(prompt).not.toContain('https://example.com/doc.pdf');
  });

  it('omits reference material section when neither text nor URL is provided', () => {
    const prompt = buildPrompt(
      makeAssignment({ uploadedFileText: null, uploadedFileUrl: null })
    );
    expect(prompt).not.toContain('REFERENCE MATERIAL');
  });
});

// ---------------------------------------------------------------------------
// buildPrompt — sanitization of user-supplied fields (Requirement 14.5)
// ---------------------------------------------------------------------------

describe('buildPrompt — sanitization of user-supplied fields', () => {
  it('strips backticks from subject before including in prompt', () => {
    const prompt = buildPrompt(makeAssignment({ subject: 'Math`s' }));
    expect(prompt).not.toContain('`');
    expect(prompt).toContain('Maths');
  });

  it('strips backslashes from schoolName before including in prompt', () => {
    const prompt = buildPrompt(
      makeAssignment({ schoolName: 'School\\Name' })
    );
    expect(prompt).not.toContain('\\');
    expect(prompt).toContain('SchoolName');
  });

  it('collapses excessive newlines in instructions', () => {
    const prompt = buildPrompt(
      makeAssignment({ instructions: 'Line1\n\n\n\nLine2' })
    );
    // Should not contain 3+ consecutive newlines
    expect(prompt).not.toMatch(/\n{3,}/);
  });

  it('strips backticks from uploadedFileText', () => {
    const prompt = buildPrompt(
      makeAssignment({ uploadedFileText: 'Content with `backtick`' })
    );
    expect(prompt).not.toContain('`');
    expect(prompt).toContain('Content with backtick');
  });
});

// ---------------------------------------------------------------------------
// buildPrompt — output format instructions
// ---------------------------------------------------------------------------

describe('buildPrompt — output format instructions', () => {
  it('instructs the model to respond with only valid JSON', () => {
    const prompt = buildPrompt(makeAssignment());
    expect(prompt.toLowerCase()).toContain('json');
  });

  it('specifies the sections key in the expected output', () => {
    const prompt = buildPrompt(makeAssignment());
    expect(prompt).toContain('"sections"');
  });

  it('specifies the answerKey key in the expected output', () => {
    const prompt = buildPrompt(makeAssignment());
    expect(prompt).toContain('"answerKey"');
  });
});
