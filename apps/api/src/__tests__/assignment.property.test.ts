// Feature: vedaai-assessment-creator, Property 2: Assignment Ownership Enforcement

/**
 * Property-Based Test: P2 — Assignment Ownership Enforcement
 *
 * Validates: Requirements 8.5, 8.7, 13.3
 *
 * Property: For any pair of distinct user IDs (userId ≠ assignmentUserId),
 * calling getById, deleteById, or regenerate with userId on an assignment
 * owned by assignmentUserId MUST always throw ForbiddenError.
 */

import * as fc from 'fast-check';
import { ForbiddenError } from '../utils/errors';

// ---------------------------------------------------------------------------
// Module mocks — must be declared before any imports that trigger them
// ---------------------------------------------------------------------------

// Mock mongoose to prevent real DB connections
jest.mock('mongoose', () => {
  const actual = jest.requireActual('mongoose');
  return {
    ...actual,
    connect: jest.fn().mockResolvedValue(undefined),
    connection: { on: jest.fn(), once: jest.fn() },
  };
});

// Mock the Assignment model
jest.mock('../models/assignment.model', () => ({
  Assignment: {
    findById: jest.fn(),
    create: jest.fn(),
    deleteOne: jest.fn(),
    find: jest.fn(),
  },
}));

// Mock the GeneratedPaper model
jest.mock('../models/paper.model', () => ({
  GeneratedPaper: {
    deleteOne: jest.fn(),
    findOne: jest.fn(),
  },
}));

// Mock Redis to prevent real connections
jest.mock('../config/redis', () => ({
  default: {
    del: jest.fn().mockResolvedValue(1),
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue('OK'),
  },
}));

// Mock BullMQ Queue to prevent real Redis connections
jest.mock('bullmq', () => ({
  Queue: jest.fn().mockImplementation(() => ({
    add: jest.fn().mockResolvedValue({ id: 'mock-job-id' }),
  })),
}));

// Mock env to prevent startup crash from missing env vars
jest.mock('../config/env', () => ({
  default: {
    MONGO_URI: 'mongodb://localhost:27017/test',
    REDIS_URL: 'redis://localhost:6379',
    JWT_SECRET: 'test-secret',
    GOOGLE_CLIENT_ID: 'test-client-id',
    GOOGLE_CLIENT_SECRET: 'test-client-secret',
    FRONTEND_URL: 'http://localhost:3000',
    GEMINI_API_KEY: 'test-key',
    PORT: 5000,
  },
}));

// Mock logger to suppress output during tests
jest.mock('../config/logger', () => ({
  default: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

// ---------------------------------------------------------------------------
// Imports (after mocks are set up)
// ---------------------------------------------------------------------------

import { Assignment } from '../models/assignment.model';
import * as assignmentService from '../services/assignment.service';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Build a minimal mock Mongoose document whose userId is `ownerId`.
 * The `toString()` on userId simulates how Mongoose ObjectId behaves.
 */
function buildMockAssignmentDoc(ownerId: string) {
  return {
    _id: { toString: () => 'mock-assignment-id' },
    userId: { toString: () => ownerId },
    title: 'Test Assignment',
    subject: 'Mathematics',
    class: '10',
    schoolName: 'Test School',
    dueDate: new Date(),
    timeAllowed: 60,
    instructions: '',
    additionalInfo: '',
    questionTypes: [{ type: 'MCQ', count: 5, marks: 2 }],
    uploadedFileUrl: null,
    uploadedFileText: null,
    status: 'completed' as const,
    jobId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    toObject: jest.fn().mockReturnValue({
      _id: { toString: () => 'mock-assignment-id' },
      userId: { toString: () => ownerId },
      title: 'Test Assignment',
      subject: 'Mathematics',
      class: '10',
      schoolName: 'Test School',
      dueDate: new Date(),
      timeAllowed: 60,
      instructions: '',
      additionalInfo: '',
      questionTypes: [{ type: 'MCQ', count: 5, marks: 2 }],
      uploadedFileUrl: null,
      uploadedFileText: null,
      status: 'completed',
      jobId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    }),
    save: jest.fn().mockResolvedValue(undefined),
  };
}

// ---------------------------------------------------------------------------
// Arbitraries
// ---------------------------------------------------------------------------

/**
 * Generates a pair of distinct 24-character hex strings simulating MongoDB
 * ObjectId-like user IDs. The filter ensures they are never equal.
 */
const distinctUserIdPair = fc
  .tuple(
    fc.hexaString({ minLength: 24, maxLength: 24 }),
    fc.hexaString({ minLength: 24, maxLength: 24 }),
  )
  .filter(([a, b]) => a !== b);

// ---------------------------------------------------------------------------
// Property Test
// ---------------------------------------------------------------------------

describe('P2: Assignment Ownership Enforcement', () => {
  const mockFindById = Assignment.findById as jest.Mock;
  const assignmentId = 'mock-assignment-id';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it(
    'getById throws ForbiddenError when userId differs from assignment owner',
    async () => {
      await fc.assert(
        fc.asyncProperty(distinctUserIdPair, async ([userId, assignmentUserId]) => {
          // Arrange: assignment is owned by assignmentUserId
          mockFindById.mockResolvedValue(buildMockAssignmentDoc(assignmentUserId));

          // Act & Assert
          await expect(
            assignmentService.getById(userId, assignmentId),
          ).rejects.toThrow(ForbiddenError);
        }),
        { numRuns: 100 },
      );
    },
  );

  it(
    'deleteById throws ForbiddenError when userId differs from assignment owner',
    async () => {
      await fc.assert(
        fc.asyncProperty(distinctUserIdPair, async ([userId, assignmentUserId]) => {
          // Arrange: assignment is owned by assignmentUserId
          mockFindById.mockResolvedValue(buildMockAssignmentDoc(assignmentUserId));

          // Act & Assert
          await expect(
            assignmentService.deleteById(userId, assignmentId),
          ).rejects.toThrow(ForbiddenError);
        }),
        { numRuns: 100 },
      );
    },
  );

  it(
    'regenerate throws ForbiddenError when userId differs from assignment owner',
    async () => {
      await fc.assert(
        fc.asyncProperty(distinctUserIdPair, async ([userId, assignmentUserId]) => {
          // Arrange: assignment is owned by assignmentUserId, status is 'completed'
          // so the ownership check is reached before the status check
          mockFindById.mockResolvedValue(buildMockAssignmentDoc(assignmentUserId));

          // Act & Assert
          await expect(
            assignmentService.regenerate(userId, assignmentId),
          ).rejects.toThrow(ForbiddenError);
        }),
        { numRuns: 100 },
      );
    },
  );
});
