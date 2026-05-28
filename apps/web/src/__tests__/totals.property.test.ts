import * as fc from 'fast-check';
interface QuestionTypeRow {
    count: number;
    marks: number;
}
function computeTotalQuestions(rows: QuestionTypeRow[]): number {
    return rows.reduce((sum, row) => sum + (row.count || 0), 0);
}
function computeTotalMarks(rows: QuestionTypeRow[]): number {
    return rows.reduce((sum, row) => sum + (row.count || 0) * (row.marks || 0), 0);
}
const questionTypeRowArb = fc.record({
    count: fc.integer({ min: 1, max: 100 }),
    marks: fc.integer({ min: 1, max: 100 }),
});
const questionTypeRowsArb = fc.array(questionTypeRowArb, { minLength: 1, maxLength: 20 });
describe('Property 9: Frontend Total Recalculation Correctness', () => {
    it('Total Questions equals sum(count) for any array of rows', () => {
        fc.assert(fc.property(questionTypeRowsArb, (rows) => {
            const expectedTotal = rows.reduce((sum, row) => sum + row.count, 0);
            const actualTotal = computeTotalQuestions(rows);
            expect(actualTotal).toBe(expectedTotal);
        }), { numRuns: 100 });
    });
    it('Total Marks equals sum(count × marks) for any array of rows', () => {
        fc.assert(fc.property(questionTypeRowsArb, (rows) => {
            const expectedTotal = rows.reduce((sum, row) => sum + row.count * row.marks, 0);
            const actualTotal = computeTotalMarks(rows);
            expect(actualTotal).toBe(expectedTotal);
        }), { numRuns: 100 });
    });
    it('both totals are correct simultaneously for any array of rows', () => {
        fc.assert(fc.property(questionTypeRowsArb, (rows) => {
            const expectedQuestions = rows.reduce((sum, row) => sum + row.count, 0);
            const expectedMarks = rows.reduce((sum, row) => sum + row.count * row.marks, 0);
            const actualQuestions = computeTotalQuestions(rows);
            const actualMarks = computeTotalMarks(rows);
            expect(actualQuestions).toBe(expectedQuestions);
            expect(actualMarks).toBe(expectedMarks);
        }), { numRuns: 100 });
    });
    it('totals are zero for an empty array', () => {
        expect(computeTotalQuestions([])).toBe(0);
        expect(computeTotalMarks([])).toBe(0);
    });
    it('single row: Total Questions equals count, Total Marks equals count × marks', () => {
        fc.assert(fc.property(questionTypeRowArb, (row) => {
            expect(computeTotalQuestions([row])).toBe(row.count);
            expect(computeTotalMarks([row])).toBe(row.count * row.marks);
        }), { numRuns: 100 });
    });
    it('adding a row increases Total Questions by its count and Total Marks by count × marks', () => {
        fc.assert(fc.property(questionTypeRowsArb, questionTypeRowArb, (rows, newRow) => {
            const questionsBefore = computeTotalQuestions(rows);
            const marksBefore = computeTotalMarks(rows);
            const questionsAfter = computeTotalQuestions([...rows, newRow]);
            const marksAfter = computeTotalMarks([...rows, newRow]);
            expect(questionsAfter).toBe(questionsBefore + newRow.count);
            expect(marksAfter).toBe(marksBefore + newRow.count * newRow.marks);
        }), { numRuns: 100 });
    });
});
