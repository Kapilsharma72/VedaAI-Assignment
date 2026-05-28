// Feature: vedaai-assessment-creator, Property 5: Redis Cache Consistency

/**
 * Property 5: Redis Cache Consistency
 *
 * Validates that the JSON serialization/deserialization round-trip used by the
 * generation worker (JSON.stringify → redis.set, redis.get → JSON.parse) is
 * lossless for all fields of an IGeneratedPaper object.
 *
 * This is a UNIT-LEVEL test. No running Redis instance is required.
 * The ioredis client is mocked in-memory to simulate redis.set / redis.get.
 *
 * Validates: Requirements 9.8
 */

import * as fc from 'fast-check';
import type { IGeneratedPaper, ISection, IQuestion, IAnswerKeyEntry } from '@vedaai/shared';

// ---------------------------------------------------------------------------
// In-memory Redis mock
// ---------------------------------------------------------------------------

/** Simulates the subset of ioredis used by the generation worker. */
class InMemoryRedis {
  private store = new Map<string, string>();

  async set(key: string, value: string, _ex?: string, _ttl?: number): Promise<'OK'> {
    this.store.set(key, value);
    return 'OK';
  }

  async get(key: string): Promise<string | null> {
    return this.store.get(key) ?? null;
  }

  clear(): void {
    this.store.clear();
  }
}

const mockRedis = new InMemoryRedis();

// ---------------------------------------------------------------------------
// Arbitraries
// ---------------------------------------------------------------------------

const questionArb: fc.Arbitrary<IQuestion> = fc.record({
  number: fc.integer({ min: 1, max: 100 }),
  text: fc.string({ minLength: 1, maxLength: 200 }),
  difficulty: fc.constantFrom('Easy' as const, 'Moderate' as const, 'Hard' as const),
  marks: fc.integer({ min: 1, max: 20 }),
});

const sectionArb: fc.Arbitrary<ISection> = fc.record({
  title: fc.string({ minLength: 1, maxLength: 100 }),
  questionTypeName: fc.string({ minLength: 1, maxLength: 100 }),
  instruction: fc.string({ minLength: 0, maxLength: 300 }),
  marksPerQuestion: fc.integer({ min: 1, max: 20 }),
  questions: fc.array(questionArb, { minLength: 1, maxLength: 10 }),
});

const answerKeyEntryArb: fc.Arbitrary<IAnswerKeyEntry> = fc.record({
  questionNumber: fc.integer({ min: 1, max: 100 }),
  sectionTitle: fc.string({ minLength: 1, maxLength: 100 }),
  answer: fc.string({ minLength: 1, maxLength: 500 }),
});

/**
 * Generates a plain IGeneratedPaper-shaped object.
 *
 * Note: `generatedAt` is a Date. After JSON.stringify → JSON.parse it becomes
 * an ISO string. The test accounts for this by comparing the ISO string
 * representation, mirroring what the paper route actually does when it reads
 * from Redis.
 */
const generatedPaperArb: fc.Arbitrary<IGeneratedPaper> = fc
  .record({
    _id: fc.hexaString({ minLength: 24, maxLength: 24 }),
    assignmentId: fc.hexaString({ minLength: 24, maxLength: 24 }),
    schoolName: fc.string({ minLength: 1, maxLength: 100 }),
    subject: fc.string({ minLength: 1, maxLength: 100 }),
    class: fc.string({ minLength: 1, maxLength: 20 }),
    timeAllowed: fc.integer({ min: 30, max: 180 }),
    totalMarks: fc.integer({ min: 10, max: 200 }),
    totalQuestions: fc.integer({ min: 1, max: 100 }),
    instructions: fc.string({ minLength: 0, maxLength: 500 }),
    sections: fc.array(sectionArb, { minLength: 1, maxLength: 5 }),
    answerKey: fc.array(answerKeyEntryArb, { minLength: 1, maxLength: 50 }),
    generatedAt: fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }),
  });

// ---------------------------------------------------------------------------
// Helpers — mirror the worker's cache read/write logic
// ---------------------------------------------------------------------------

/**
 * Simulates what generation.worker.ts does at Step 10:
 *   const serializedPaper = JSON.stringify(paperDoc.toObject({ versionKey: false }));
 *   await redis.set(cacheKey, serializedPaper, 'EX', 3600);
 */
async function cacheWrite(redis: InMemoryRedis, assignmentId: string, paper: IGeneratedPaper): Promise<void> {
  const cacheKey = `paper:${assignmentId}`;
  const serialized = JSON.stringify(paper);
  await redis.set(cacheKey, serialized, 'EX', 3600);
}

/**
 * Simulates what paper.routes.ts does when reading from Redis:
 *   const cached = await redis.get(cacheKey);
 *   if (cached) return JSON.parse(cached);
 */
async function cacheRead(redis: InMemoryRedis, assignmentId: string): Promise<unknown | null> {
  const cacheKey = `paper:${assignmentId}`;
  const cached = await redis.get(cacheKey);
  if (cached === null) return null;
  return JSON.parse(cached) as unknown;
}

// ---------------------------------------------------------------------------
// Property 5: Redis Cache Consistency
// Validates: Requirements 9.8
// ---------------------------------------------------------------------------

describe('Property 5: Redis Cache Consistency', () => {
  beforeEach(() => {
    mockRedis.clear();
  });

  it(
    'JSON serialization/deserialization round-trip is lossless for all scalar fields of IGeneratedPaper',
    async () => {
      await fc.assert(
        fc.asyncProperty(generatedPaperArb, async (paper: IGeneratedPaper) => {
          const assignmentId = paper.assignmentId;

          // Write to mock Redis (mirrors worker Step 10)
          await cacheWrite(mockRedis, assignmentId, paper);

          // Read back from mock Redis (mirrors paper route cache hit)
          const deserialized = await cacheRead(mockRedis, assignmentId);

          if (deserialized === null) return false;

          const d = deserialized as Record<string, unknown>;

          // Scalar fields must be identical after round-trip
          if (d['_id'] !== paper._id) return false;
          if (d['assignmentId'] !== paper.assignmentId) return false;
          if (d['schoolName'] !== paper.schoolName) return false;
          if (d['subject'] !== paper.subject) return false;
          if (d['class'] !== paper.class) return false;
          if (d['timeAllowed'] !== paper.timeAllowed) return false;
          if (d['totalMarks'] !== paper.totalMarks) return false;
          if (d['totalQuestions'] !== paper.totalQuestions) return false;
          if (d['instructions'] !== paper.instructions) return false;

          // Date serializes to ISO string — compare ISO representations
          if (d['generatedAt'] !== paper.generatedAt.toISOString()) return false;

          return true;
        }),
        { numRuns: 100 },
      );
    },
  );

  it(
    'sections array is fully preserved through the cache round-trip',
    async () => {
      await fc.assert(
        fc.asyncProperty(generatedPaperArb, async (paper: IGeneratedPaper) => {
          const assignmentId = paper.assignmentId;

          await cacheWrite(mockRedis, assignmentId, paper);
          const deserialized = await cacheRead(mockRedis, assignmentId);

          if (deserialized === null) return false;

          const d = deserialized as Record<string, unknown>;
          const deserializedSections = d['sections'] as ISection[];

          if (deserializedSections.length !== paper.sections.length) return false;

          for (let i = 0; i < paper.sections.length; i++) {
            const orig = paper.sections[i];
            const deser = deserializedSections[i];

            if (deser.title !== orig.title) return false;
            if (deser.questionTypeName !== orig.questionTypeName) return false;
            if (deser.instruction !== orig.instruction) return false;
            if (deser.marksPerQuestion !== orig.marksPerQuestion) return false;
            if (deser.questions.length !== orig.questions.length) return false;

            for (let j = 0; j < orig.questions.length; j++) {
              const oq = orig.questions[j];
              const dq = deser.questions[j];

              if (dq.number !== oq.number) return false;
              if (dq.text !== oq.text) return false;
              if (dq.difficulty !== oq.difficulty) return false;
              if (dq.marks !== oq.marks) return false;
            }
          }

          return true;
        }),
        { numRuns: 100 },
      );
    },
  );

  it(
    'answerKey array is fully preserved through the cache round-trip',
    async () => {
      await fc.assert(
        fc.asyncProperty(generatedPaperArb, async (paper: IGeneratedPaper) => {
          const assignmentId = paper.assignmentId;

          await cacheWrite(mockRedis, assignmentId, paper);
          const deserialized = await cacheRead(mockRedis, assignmentId);

          if (deserialized === null) return false;

          const d = deserialized as Record<string, unknown>;
          const deserializedAnswerKey = d['answerKey'] as IAnswerKeyEntry[];

          if (deserializedAnswerKey.length !== paper.answerKey.length) return false;

          for (let i = 0; i < paper.answerKey.length; i++) {
            const orig = paper.answerKey[i];
            const deser = deserializedAnswerKey[i];

            if (deser.questionNumber !== orig.questionNumber) return false;
            if (deser.sectionTitle !== orig.sectionTitle) return false;
            if (deser.answer !== orig.answer) return false;
          }

          return true;
        }),
        { numRuns: 100 },
      );
    },
  );

  it(
    'cache returns null for a key that was never written',
    async () => {
      const result = await cacheRead(mockRedis, 'nonexistent-assignment-id');
      expect(result).toBeNull();
    },
  );

  it(
    'writing a new paper for the same assignmentId overwrites the previous cache entry',
    async () => {
      await fc.assert(
        fc.asyncProperty(
          generatedPaperArb,
          generatedPaperArb,
          async (paper1: IGeneratedPaper, paper2: IGeneratedPaper) => {
            // Use the same assignmentId for both writes
            const sharedAssignmentId = paper1.assignmentId;
            const paper2WithSameId: IGeneratedPaper = { ...paper2, assignmentId: sharedAssignmentId };

            await cacheWrite(mockRedis, sharedAssignmentId, paper1);
            await cacheWrite(mockRedis, sharedAssignmentId, paper2WithSameId);

            const deserialized = await cacheRead(mockRedis, sharedAssignmentId);
            if (deserialized === null) return false;

            const d = deserialized as Record<string, unknown>;

            // The cache should reflect the second write
            return (
              d['schoolName'] === paper2WithSameId.schoolName &&
              d['subject'] === paper2WithSameId.subject &&
              d['class'] === paper2WithSameId.class
            );
          },
        ),
        { numRuns: 100 },
      );
    },
  );
});
