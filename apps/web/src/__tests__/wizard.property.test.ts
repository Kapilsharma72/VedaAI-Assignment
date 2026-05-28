import * as fc from 'fast-check';
import { useWizardStore, Step1Data, Step2Data } from '../store/wizard.store';
const questionTypeArb = fc.record({
    type: fc.constantFrom('MCQ', 'Short Questions', 'Long Questions', 'Diagram/Graph-Based Questions', 'Numerical Problems', 'True/False', 'Fill in the Blanks'),
    count: fc.integer({ min: 1, max: 20 }),
    marks: fc.integer({ min: 1, max: 10 }),
});
const futureDateArb = fc
    .integer({ min: 1, max: 365 })
    .map((daysAhead) => {
    const d = new Date();
    d.setDate(d.getDate() + daysAhead);
    return d.toISOString().split('T')[0];
});
const step1DataArb: fc.Arbitrary<Step1Data> = fc.record({
    dueDate: futureDateArb,
    questionTypes: fc.array(questionTypeArb, { minLength: 1, maxLength: 10 }),
    additionalInfo: fc.string({ minLength: 0, maxLength: 200 }),
    uploadedFileUrl: fc.oneof(fc.constant(null), fc.webUrl()),
    uploadedFileText: fc.oneof(fc.constant(null), fc.string({ minLength: 0, maxLength: 500 })),
}, { requiredKeys: ['dueDate', 'questionTypes'] });
const step2DataArb: fc.Arbitrary<Step2Data> = fc.record({
    title: fc.string({ minLength: 1, maxLength: 100 }),
    subject: fc.string({ minLength: 1, maxLength: 50 }),
    class: fc.string({ minLength: 1, maxLength: 20 }),
    schoolName: fc.string({ minLength: 1, maxLength: 100 }),
    timeAllowed: fc.integer({ min: 10, max: 180 }),
    instructions: fc.string({ minLength: 0, maxLength: 500 }),
});
function getStore() {
    return useWizardStore.getState();
}
describe('Property 6: Wizard Step 1 State Preservation', () => {
    beforeEach(() => {
        useWizardStore.getState().reset();
    });
    it('Step 1 data is preserved after navigating forward to Step 2 and back', () => {
        fc.assert(fc.property(step1DataArb, step2DataArb, (step1Data, step2Data) => {
            const store = getStore();
            store.setStep1(step1Data);
            store.setStep2(step2Data);
            const stateAfterBack = useWizardStore.getState();
            expect(stateAfterBack.step1).not.toBeNull();
            expect(stateAfterBack.step1).toEqual(step1Data);
        }), { numRuns: 100 });
    });
    it('Step 1 questionTypes array is preserved exactly after round-trip navigation', () => {
        fc.assert(fc.property(step1DataArb, step2DataArb, (step1Data, step2Data) => {
            const store = getStore();
            store.setStep1(step1Data);
            store.setStep2(step2Data);
            const stateAfterBack = useWizardStore.getState();
            expect(stateAfterBack.step1?.questionTypes).toEqual(step1Data.questionTypes);
            expect(stateAfterBack.step1?.questionTypes).toHaveLength(step1Data.questionTypes.length);
        }), { numRuns: 100 });
    });
    it('Step 1 dueDate is preserved exactly after round-trip navigation', () => {
        fc.assert(fc.property(step1DataArb, step2DataArb, (step1Data, step2Data) => {
            const store = getStore();
            store.setStep1(step1Data);
            store.setStep2(step2Data);
            const stateAfterBack = useWizardStore.getState();
            expect(stateAfterBack.step1?.dueDate).toBe(step1Data.dueDate);
        }), { numRuns: 100 });
    });
    it('Step 1 optional fields (additionalInfo, uploadedFileUrl, uploadedFileText) are preserved', () => {
        fc.assert(fc.property(step1DataArb, step2DataArb, (step1Data, step2Data) => {
            const store = getStore();
            store.setStep1(step1Data);
            store.setStep2(step2Data);
            const stateAfterBack = useWizardStore.getState();
            expect(stateAfterBack.step1?.additionalInfo).toBe(step1Data.additionalInfo);
            expect(stateAfterBack.step1?.uploadedFileUrl).toBe(step1Data.uploadedFileUrl);
            expect(stateAfterBack.step1?.uploadedFileText).toBe(step1Data.uploadedFileText);
        }), { numRuns: 100 });
    });
    it('Step 2 data does not overwrite Step 1 data in the store', () => {
        fc.assert(fc.property(step1DataArb, step2DataArb, (step1Data, step2Data) => {
            const store = getStore();
            store.setStep1(step1Data);
            const step1Before = useWizardStore.getState().step1;
            store.setStep2(step2Data);
            const step1After = useWizardStore.getState().step1;
            expect(step1After).toEqual(step1Before);
        }), { numRuns: 100 });
    });
    it('reset clears both step1 and step2', () => {
        fc.assert(fc.property(step1DataArb, step2DataArb, (step1Data, step2Data) => {
            const store = getStore();
            store.setStep1(step1Data);
            store.setStep2(step2Data);
            store.reset();
            const stateAfterReset = useWizardStore.getState();
            expect(stateAfterReset.step1).toBeNull();
            expect(stateAfterReset.step2).toBeNull();
        }), { numRuns: 100 });
    });
});
