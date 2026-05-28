import { IAssignment } from '@vedaai/shared';
export function sanitizeForPrompt(input: string): string {
    return input
        .replace(/[`\\]/g, '')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
}
export function buildPrompt(assignment: IAssignment): string {
    const subject = sanitizeForPrompt(assignment.subject);
    const cls = sanitizeForPrompt(assignment.class);
    const schoolName = sanitizeForPrompt(assignment.schoolName);
    const instructions = assignment.instructions
        ? sanitizeForPrompt(assignment.instructions)
        : '';
    const additionalInfo = assignment.additionalInfo
        ? sanitizeForPrompt(assignment.additionalInfo)
        : '';
    const questionTypeLines = assignment.questionTypes
        .map((qt) => `  - ${sanitizeForPrompt(qt.type)}: ${qt.count} question${qt.count !== 1 ? 's' : ''}, ${qt.marks} mark${qt.marks !== 1 ? 's' : ''} each`)
        .join('\n');
    let referenceMaterial = '';
    if (assignment.uploadedFileText) {
        const sanitizedText = sanitizeForPrompt(assignment.uploadedFileText);
        referenceMaterial = `
REFERENCE MATERIAL (extracted from uploaded document):
---
${sanitizedText}
---`;
    }
    else if (assignment.uploadedFileUrl) {
        const sanitizedUrl = sanitizeForPrompt(assignment.uploadedFileUrl);
        referenceMaterial = `
REFERENCE MATERIAL (uploaded file URL):
${sanitizedUrl}`;
    }
    const instructionsSection = instructions.length > 0
        ? `
TEACHER INSTRUCTIONS:
${instructions}`
        : '';
    const additionalInfoSection = additionalInfo.length > 0
        ? `
ADDITIONAL INFORMATION:
${additionalInfo}`
        : '';
    const prompt = `You are an expert CBSE (Central Board of Secondary Education) question paper creator for Indian schools. Generate a complete, curriculum-aligned question paper based on the following assignment configuration.

ASSIGNMENT DETAILS:
- School Name: ${schoolName}
- Subject: ${subject}
- Class/Grade: ${cls}
- Time Allowed: ${assignment.timeAllowed} minutes${instructionsSection}${additionalInfoSection}

QUESTION TYPES REQUIRED:
${questionTypeLines}
${referenceMaterial}

CURRICULUM CONTEXT:
This question paper must strictly follow CBSE curriculum guidelines and learning objectives for Class ${cls} ${subject}. Questions should be age-appropriate, pedagogically sound, and aligned with NCERT textbook content and CBSE examination patterns.

DIFFICULTY DISTRIBUTION (MANDATORY):
Distribute the difficulty of questions across ALL sections combined as follows:
- Easy: approximately 40% of total questions
- Moderate: approximately 40% of total questions
- Hard: approximately 20% of total questions

Every question MUST have a "difficulty" field set to exactly one of: "Easy", "Moderate", or "Hard".

OUTPUT FORMAT:
Respond with ONLY a valid JSON object — no markdown, no code fences, no explanation text before or after the JSON. The JSON must have exactly two top-level keys:

1. "sections": An array of section objects. Each section object must have:
   - "title": Section heading (e.g., "Section A — Multiple Choice Questions")
   - "questionTypeName": The question type name (e.g., "MCQ")
   - "instruction": A brief instruction for students for this section
   - "marksPerQuestion": Marks awarded per question in this section (number)
   - "questions": An array of question objects, each with:
     - "number": Sequential question number within the section (starting from 1)
     - "text": The full question text (for MCQ, just the question stem — do NOT include options in the text)
     - "difficulty": One of "Easy", "Moderate", or "Hard"
     - "marks": Marks for this question (must equal marksPerQuestion)
     - "options": (REQUIRED for MCQ/Multiple Choice questions only) An array of exactly 4 option objects, each with:
       - "label": The option label — exactly "A", "B", "C", or "D"
       - "text": The option text
       For non-MCQ question types (short answer, long answer, etc.), omit the "options" field entirely.

2. "answerKey": An array of answer key entry objects, each with:
   - "questionNumber": The question number
   - "sectionTitle": The title of the section this question belongs to
   - "answer": The correct answer or model answer

Generate all questions now. Ensure the total number of questions and marks exactly match the requirements specified above.`;
    return sanitizeForPrompt(prompt);
}
