import * as fc from 'fast-check';
import { ISection, IQuestion } from '@vedaai/shared';
const questionArb = fc.record({
    number: fc.integer({ min: 1 }),
    text: fc.string({ minLength: 1 }),
    difficulty: fc.constantFrom('Easy' as const, 'Moderate' as const, 'Hard' as const),
    marks: fc.integer({ min: 1, max: 10 }),
});
const sectionArb = fc.record({
    title: fc.string(),
    questionTypeName: fc.string(),
    instruction: fc.string(),
    marksPerQuestion: fc.integer({ min: 1, max: 10 }),
    questions: fc.array(questionArb, { minLength: 1, maxLength: 10 }),
});
const sectionsArb = fc.array(sectionArb, { minLength: 1, maxLength: 5 });
describe('Property 3: Question Count and Marks Invariants', () => {
    it('sum of section.questions.length equals totalQuestions', () => {
        fc.assert(fc.property(sectionsArb, (sections: ISection[]) => {
            const totalQuestions = sections.reduce((sum, section) => sum + section.questions.length, 0);
            const computedTotal = sections.reduce((sum, section) => sum + section.questions.length, 0);
            return computedTotal === totalQuestions;
        }), { numRuns: 100 });
    });
    it('sum of (marksPerQuestion × questions.length) equals totalMarks', () => {
        fc.assert(fc.property(sectionsArb, (sections: ISection[]) => {
            const totalMarks = sections.reduce((sum, section) => sum + section.marksPerQuestion * section.questions.length, 0);
            const computedMarks = sections.reduce((sum, section) => sum + section.marksPerQuestion * section.questions.length, 0);
            return computedMarks === totalMarks;
        }), { numRuns: 100 });
    });
    it('both invariants hold simultaneously for any generated section array', () => {
        fc.assert(fc.property(sectionsArb, (sections: ISection[]) => {
            const expectedTotalQuestions = sections.reduce((sum, section) => sum + section.questions.length, 0);
            const expectedTotalMarks = sections.reduce((sum, section) => sum + section.marksPerQuestion * section.questions.length, 0);
            const paper = {
                totalQuestions: expectedTotalQuestions,
                totalMarks: expectedTotalMarks,
                sections,
            };
            const actualTotalQuestions = paper.sections.reduce((sum, section) => sum + section.questions.length, 0);
            const actualTotalMarks = paper.sections.reduce((sum, section) => sum + section.marksPerQuestion * section.questions.length, 0);
            return (actualTotalQuestions === paper.totalQuestions &&
                actualTotalMarks === paper.totalMarks);
        }), { numRuns: 100 });
    });
});
const validDifficultyQuestionsArb = fc
    .integer({ min: 10, max: 50 })
    .chain((total) => {
    const easyMin = Math.ceil(total * 0.3);
    const easyMax = Math.floor(total * 0.5);
    return fc.integer({ min: easyMin, max: easyMax }).chain((easyCount) => {
        const remaining = total - easyCount;
        const hardMin = Math.ceil(total * 0.1);
        const hardMax = Math.floor(total * 0.3);
        const modMin = Math.ceil(total * 0.3);
        const modMax = Math.floor(total * 0.5);
        const hardFromModMin = remaining - modMax;
        const hardFromModMax = remaining - modMin;
        const hardActualMin = Math.max(hardMin, hardFromModMin);
        const hardActualMax = Math.min(hardMax, hardFromModMax);
        if (hardActualMin > hardActualMax) {
            const safeEasy = Math.round(total * 0.4);
            const safeHard = Math.round(total * 0.2);
            const safeModerate = total - safeEasy - safeHard;
            const questions: IQuestion[] = [
                ...Array.from({ length: safeEasy }, (_, i) => ({
                    number: i + 1, text: 'Easy question', difficulty: 'Easy' as const, marks: 1,
                })),
                ...Array.from({ length: safeModerate }, (_, i) => ({
                    number: safeEasy + i + 1, text: 'Moderate question', difficulty: 'Moderate' as const, marks: 2,
                })),
                ...Array.from({ length: safeHard }, (_, i) => ({
                    number: safeEasy + safeModerate + i + 1, text: 'Hard question', difficulty: 'Hard' as const, marks: 3,
                })),
            ];
            return fc.constant(questions);
        }
        return fc
            .integer({ min: hardActualMin, max: hardActualMax })
            .chain((hardCount) => {
            const moderateCount = remaining - hardCount;
            const easyQuestions: IQuestion[] = Array.from({ length: easyCount }, (_, i) => ({
                number: i + 1,
                text: 'Easy question',
                difficulty: 'Easy' as const,
                marks: 1,
            }));
            const moderateQuestions: IQuestion[] = Array.from({ length: moderateCount }, (_, i) => ({
                number: easyCount + i + 1,
                text: 'Moderate question',
                difficulty: 'Moderate' as const,
                marks: 2,
            }));
            const hardQuestions: IQuestion[] = Array.from({ length: hardCount }, (_, i) => ({
                number: easyCount + moderateCount + i + 1,
                text: 'Hard question',
                difficulty: 'Hard' as const,
                marks: 3,
            }));
            return fc.constant([...easyQuestions, ...moderateQuestions, ...hardQuestions]);
        });
    });
});
describe('Property 4: Difficulty Distribution Invariant', () => {
    it('for papers with ≥ 10 questions, Easy is 30–50%, Moderate is 30–50%, Hard is 10–30%', () => {
        fc.assert(fc.property(validDifficultyQuestionsArb, (questions: IQuestion[]) => {
            const total = questions.length;
            if (total < 10)
                return true;
            const easyCount = questions.filter((q) => q.difficulty === 'Easy').length;
            const moderateCount = questions.filter((q) => q.difficulty === 'Moderate').length;
            const hardCount = questions.filter((q) => q.difficulty === 'Hard').length;
            const easyPct = easyCount / total;
            const moderatePct = moderateCount / total;
            const hardPct = hardCount / total;
            const easyOk = easyPct >= 0.3 && easyPct <= 0.5;
            const moderateOk = moderatePct >= 0.3 && moderatePct <= 0.5;
            const hardOk = hardPct >= 0.1 && hardPct <= 0.3;
            return easyOk && moderateOk && hardOk;
        }), { numRuns: 100 });
    });
    it('difficulty counts sum to total question count', () => {
        fc.assert(fc.property(validDifficultyQuestionsArb, (questions: IQuestion[]) => {
            const easyCount = questions.filter((q) => q.difficulty === 'Easy').length;
            const moderateCount = questions.filter((q) => q.difficulty === 'Moderate').length;
            const hardCount = questions.filter((q) => q.difficulty === 'Hard').length;
            return easyCount + moderateCount + hardCount === questions.length;
        }), { numRuns: 100 });
    });
});
