// Feature: vedaai-assessment-creator, Property 6: Wizard Step 1 State Preservation

/**
 * Property-Based Tests: Wizard Step 1 State Preservation
 *
 * Property 6: Wizard Step 1 State Preservation
 * Validates: Requirements 6.8
 *
 * For any randomly generated Step 1 data, after setting it in the wizard store
 * and simulating forward navigation to Step 2 followed by navigating back
 * (without calling reset), every Step 1 field in the store must be identical
 * to its pre-navigation value.
 *
 * This test validates the Zustand wizard store directly — no React rendering needed.
 */

import * as fc from 'fast-check';
import { useWizardStore, Step1Data, Step2Data } from '../store/wizard.store';

// ---------------------------------------------------------------------------
// Arbitraries
// ---------------------------------------------------------------------------

/**
 * Generates a single question type entry.
 */
const questionTypeArb = fc.record({
  type: fc.constantFrom(
    'MCQ',
    'Short Questions',
    'Long Questions',
    'Diagram/Graph-Based Questions',
    'Numerical Problems',
    'True/False',
    'Fill in the Blanks',
  ),
  count: fc.integer({ min: 1, max: 20 }),
  marks: fc.integer({ min: 1, max: 10 }),
});

/**
 * Generates a valid ISO date string in the future (YYYY-MM-DD).
 * Uses a fixed future year range to keep dates valid.
 */
const futureDateArb = fc
  .integer({ min: 1, max: 365 })
  .map((daysAhead) => {
    const d = new Date();
    d.setDate(d.getDate() + daysAhead);
    return d.toISOString().split('T')[0];
  });

/**
 * Generates a random Step1Data object with all optional fields included or omitted.
 */
const step1DataArb: fc.Arbitrary<Step1Data> = fc.record(
  {
    dueDate: futureDateArb,
    questionTypes: fc.array(questionTypeArb, { minLength: 1, maxLength: 10 }),
    additionalInfo: fc.string({ minLength: 0, maxLength: 200 }),
    uploadedFileUrl: fc.oneof(
      fc.constant(null),
      fc.webUrl(),
    ),
    uploadedFileText: fc.oneof(
      fc.constant(null),
      fc.string({ minLength: 0, maxLength: 500 }),
    ),
  },
  { requiredKeys: ['dueDate', 'questionTypes'] },
);

/**
 * Generates a valid Step2Data object to simulate forward navigation.
 */
const step2DataArb: fc.Arbitrary<Step2Data> = fc.record({
  title: fc.string({ minLength: 1, maxLength: 100 }),
  subject: fc.string({ minLength: 1, maxLength: 50 }),
  class: fc.string({ minLength: 1, maxLength: 20 }),
  schoolName: fc.string({ minLength: 1, maxLength: 100 }),
  timeAllowed: fc.integer({ min: 10, max: 180 }),
  instructions: fc.string({ minLength: 0, maxLength: 500 }),
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Returns the raw Zustand store state (works outside React components).
 */
function getStore() {
  return useWizardStore.getState();
}

// ---------------------------------------------------------------------------
// Property 6: Wizard Step 1 State Preservation
// ---------------------------------------------------------------------------

describe('Property 6: Wizard Step 1 State Preservation', () => {
  beforeEach(() => {
    // Reset store to a clean state before each test run
    useWizardStore.getState().reset();
  });

  /**
   * **Validates: Requirements 6.8**
   *
   * For any Step1Data:
   * 1. Set it in the wizard store via setStep1
   * 2. Simulate forward navigation by calling setStep2 with valid Step2Data
   * 3. Simulate "Previous" by calling setStep2 with new Step2Data (or clearing step2)
   *    — crucially, step1 must NOT be touched
   * 4. Assert store.step1 deep-equals the original Step1Data
   */
  it('Step 1 data is preserved after navigating forward to Step 2 and back', () => {
    fc.assert(
      fc.property(step1DataArb, step2DataArb, (step1Data, step2Data) => {
        const store = getStore();

        // Set Step 1 data
        store.setStep1(step1Data);

        // Simulate forward navigation: user fills Step 2 and the store is updated
        store.setStep2(step2Data);

        // Simulate "Previous": Step 2 component navigates back without resetting Step 1
        // The store's step1 should remain untouched
        // (In the real UI, clicking "Previous" just changes the active step index;
        //  it does NOT call reset() or setStep1(null))

        const stateAfterBack = useWizardStore.getState();

        // Step 1 must still be present and identical
        expect(stateAfterBack.step1).not.toBeNull();
        expect(stateAfterBack.step1).toEqual(step1Data);
      }),
      { numRuns: 100 },
    );
  });

  it('Step 1 questionTypes array is preserved exactly after round-trip navigation', () => {
    fc.assert(
      fc.property(step1DataArb, step2DataArb, (step1Data, step2Data) => {
        const store = getStore();

        store.setStep1(step1Data);
        store.setStep2(step2Data);

        const stateAfterBack = useWizardStore.getState();

        expect(stateAfterBack.step1?.questionTypes).toEqual(step1Data.questionTypes);
        expect(stateAfterBack.step1?.questionTypes).toHaveLength(
          step1Data.questionTypes.length,
        );
      }),
      { numRuns: 100 },
    );
  });

  it('Step 1 dueDate is preserved exactly after round-trip navigation', () => {
    fc.assert(
      fc.property(step1DataArb, step2DataArb, (step1Data, step2Data) => {
        const store = getStore();

        store.setStep1(step1Data);
        store.setStep2(step2Data);

        const stateAfterBack = useWizardStore.getState();

        expect(stateAfterBack.step1?.dueDate).toBe(step1Data.dueDate);
      }),
      { numRuns: 100 },
    );
  });

  it('Step 1 optional fields (additionalInfo, uploadedFileUrl, uploadedFileText) are preserved', () => {
    fc.assert(
      fc.property(step1DataArb, step2DataArb, (step1Data, step2Data) => {
        const store = getStore();

        store.setStep1(step1Data);
        store.setStep2(step2Data);

        const stateAfterBack = useWizardStore.getState();

        expect(stateAfterBack.step1?.additionalInfo).toBe(step1Data.additionalInfo);
        expect(stateAfterBack.step1?.uploadedFileUrl).toBe(step1Data.uploadedFileUrl);
        expect(stateAfterBack.step1?.uploadedFileText).toBe(step1Data.uploadedFileText);
      }),
      { numRuns: 100 },
    );
  });

  it('Step 2 data does not overwrite Step 1 data in the store', () => {
    fc.assert(
      fc.property(step1DataArb, step2DataArb, (step1Data, step2Data) => {
        const store = getStore();

        store.setStep1(step1Data);

        // Capture step1 reference before setting step2
        const step1Before = useWizardStore.getState().step1;

        store.setStep2(step2Data);

        const step1After = useWizardStore.getState().step1;

        // step1 must be unchanged
        expect(step1After).toEqual(step1Before);
      }),
      { numRuns: 100 },
    );
  });

  it('reset clears both step1 and step2', () => {
    fc.assert(
      fc.property(step1DataArb, step2DataArb, (step1Data, step2Data) => {
        const store = getStore();

        store.setStep1(step1Data);
        store.setStep2(step2Data);
        store.reset();

        const stateAfterReset = useWizardStore.getState();

        expect(stateAfterReset.step1).toBeNull();
        expect(stateAfterReset.step2).toBeNull();
      }),
      { numRuns: 100 },
    );
  });
});
