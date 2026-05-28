import * as fc from 'fast-check';
import { ForbiddenError } from '../utils/errors';
jest.mock('mongoose', () => {
    const actual = jest.requireActual('mongoose');
    return {
        ...actual,
        connect: jest.fn().mockResolvedValue(undefined),
        connection: { on: jest.fn(), once: jest.fn() },
    };
});
jest.mock('../models/assignment.model', () => ({
    Assignment: {
        findById: jest.fn(),
        create: jest.fn(),
        deleteOne: jest.fn(),
        find: jest.fn(),
    },
}));
jest.mock('../models/paper.model', () => ({
    GeneratedPaper: {
        deleteOne: jest.fn(),
        findOne: jest.fn(),
    },
}));
jest.mock('../config/redis', () => ({
    default: {
        del: jest.fn().mockResolvedValue(1),
        get: jest.fn().mockResolvedValue(null),
        set: jest.fn().mockResolvedValue('OK'),
    },
}));
jest.mock('bullmq', () => ({
    Queue: jest.fn().mockImplementation(() => ({
        add: jest.fn().mockResolvedValue({ id: 'mock-job-id' }),
    })),
}));
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
jest.mock('../config/logger', () => ({
    default: {
        info: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
    },
}));
import { Assignment } from '../models/assignment.model';
import * as assignmentService from '../services/assignment.service';
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
const distinctUserIdPair = fc
    .tuple(fc.hexaString({ minLength: 24, maxLength: 24 }), fc.hexaString({ minLength: 24, maxLength: 24 }))
    .filter(([a, b]) => a !== b);
describe('P2: Assignment Ownership Enforcement', () => {
    const mockFindById = Assignment.findById as jest.Mock;
    const assignmentId = 'mock-assignment-id';
    beforeEach(() => {
        jest.clearAllMocks();
    });
    it('getById throws ForbiddenError when userId differs from assignment owner', async () => {
        await fc.assert(fc.asyncProperty(distinctUserIdPair, async ([userId, assignmentUserId]) => {
            mockFindById.mockResolvedValue(buildMockAssignmentDoc(assignmentUserId));
            await expect(assignmentService.getById(userId, assignmentId)).rejects.toThrow(ForbiddenError);
        }), { numRuns: 100 });
    });
    it('deleteById throws ForbiddenError when userId differs from assignment owner', async () => {
        await fc.assert(fc.asyncProperty(distinctUserIdPair, async ([userId, assignmentUserId]) => {
            mockFindById.mockResolvedValue(buildMockAssignmentDoc(assignmentUserId));
            await expect(assignmentService.deleteById(userId, assignmentId)).rejects.toThrow(ForbiddenError);
        }), { numRuns: 100 });
    });
    it('regenerate throws ForbiddenError when userId differs from assignment owner', async () => {
        await fc.assert(fc.asyncProperty(distinctUserIdPair, async ([userId, assignmentUserId]) => {
            mockFindById.mockResolvedValue(buildMockAssignmentDoc(assignmentUserId));
            await expect(assignmentService.regenerate(userId, assignmentId)).rejects.toThrow(ForbiddenError);
        }), { numRuns: 100 });
    });
});
