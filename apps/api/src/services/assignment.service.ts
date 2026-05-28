import { Queue } from 'bullmq';
import type { IAssignment, CreateAssignmentDto } from '@vedaai/shared';
import { Assignment, type IAssignmentDocument } from '../models/assignment.model';
import { GeneratedPaper } from '../models/paper.model';
import redis from '../config/redis';
import logger from '../config/logger';
import { getBullMQConnection } from '../config/redis.config';
import { NotFoundError, ForbiddenError, ConflictError } from '../utils/errors';

const questionGenerationQueue = new Queue('question-generation', {
  connection: getBullMQConnection(),
});
function toIAssignment(doc: IAssignmentDocument): IAssignment {
    const obj = doc.toObject({ versionKey: false });
    return {
        _id: obj._id.toString(),
        userId: obj.userId.toString(),
        title: obj.title,
        subject: obj.subject,
        class: obj.class,
        schoolName: obj.schoolName,
        dueDate: obj.dueDate,
        timeAllowed: obj.timeAllowed,
        instructions: obj.instructions ?? '',
        additionalInfo: obj.additionalInfo ?? '',
        questionTypes: obj.questionTypes,
        uploadedFileUrl: obj.uploadedFileUrl ?? null,
        uploadedFileText: obj.uploadedFileText ?? null,
        status: obj.status,
        jobId: obj.jobId ?? null,
        createdAt: obj.createdAt,
        updatedAt: obj.updatedAt,
    };
}
function assertOwnership(assignment: IAssignmentDocument, userId: string): void {
    if (assignment.userId.toString() !== userId) {
        throw new ForbiddenError('You do not have permission to access this assignment.');
    }
}
export async function create(userId: string, dto: CreateAssignmentDto): Promise<IAssignment> {
    const doc = await Assignment.create({
        userId,
        title: dto.title,
        subject: dto.subject,
        class: dto.class,
        schoolName: dto.schoolName,
        dueDate: new Date(dto.dueDate),
        timeAllowed: dto.timeAllowed,
        instructions: dto.instructions ?? '',
        additionalInfo: dto.additionalInfo ?? '',
        questionTypes: dto.questionTypes,
        uploadedFileUrl: dto.uploadedFileUrl ?? null,
        uploadedFileText: dto.uploadedFileText ?? null,
        status: 'pending',
        jobId: null,
    });
    const assignmentId = doc._id.toString();
    const job = await questionGenerationQueue.add('generate-questions', { assignmentId }, { jobId: assignmentId });
    logger.info('BullMQ job enqueued', {
        queue: 'question-generation',
        jobId: job.id,
        assignmentId,
        userId,
    });
    doc.jobId = job.id ?? null;
    await doc.save();
    return toIAssignment(doc);
}
export async function list(userId: string): Promise<IAssignment[]> {
    const docs = await Assignment.find({ userId }).sort({ createdAt: -1 });
    return docs.map(toIAssignment);
}
export async function getById(userId: string, assignmentId: string): Promise<IAssignment> {
    const doc = await Assignment.findById(assignmentId);
    if (!doc) {
        throw new NotFoundError('Assignment not found.');
    }
    assertOwnership(doc, userId);
    return toIAssignment(doc);
}
export async function deleteById(userId: string, assignmentId: string): Promise<void> {
    const doc = await Assignment.findById(assignmentId);
    if (!doc) {
        throw new NotFoundError('Assignment not found.');
    }
    assertOwnership(doc, userId);
    await Assignment.deleteOne({ _id: assignmentId });
    await GeneratedPaper.deleteOne({ assignmentId });
    const cacheKey = `paper:${assignmentId}`;
    await redis.del(cacheKey);
    logger.info('Assignment deleted', {
        assignmentId,
        userId,
        cacheKey,
    });
}
export async function regenerate(userId: string, assignmentId: string): Promise<IAssignment> {
    const doc = await Assignment.findById(assignmentId);
    if (!doc) {
        throw new NotFoundError('Assignment not found.');
    }
    assertOwnership(doc, userId);
    if (doc.status === 'pending' || doc.status === 'processing') {
        throw new ConflictError('Generation is already in progress for this assignment.');
    }
    doc.status = 'pending';
    doc.jobId = null;
    await doc.save();
    const job = await questionGenerationQueue.add('generate-questions', { assignmentId, isRegeneration: true });
    logger.info('BullMQ regeneration job enqueued', {
        queue: 'question-generation',
        jobId: job.id,
        assignmentId,
        userId,
    });
    doc.jobId = job.id ?? null;
    await doc.save();
    return toIAssignment(doc);
}
