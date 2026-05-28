import { Worker, type Job } from 'bullmq';
import type { IGeneratedPaper } from '@vedaai/shared';
import { Assignment } from '../models/assignment.model';
import { GeneratedPaper } from '../models/paper.model';
import redis from '../config/redis';
import env from '../config/env';
import logger from '../config/logger';
import { getIO } from '../sockets/index';
import { buildPrompt } from './prompt.builder';
import * as gemini from './gemini.client';

interface GenerationJobData {
  assignmentId: string;
  isRegeneration?: boolean;
}

interface GeminiParsedResponse {
  sections: IGeneratedPaper['sections'];
  answerKey: IGeneratedPaper['answerKey'];
}

function emitProgress(assignmentId: string, progress: number, message: string): void {
  try {
    const io = getIO();
    io.to(`assignment:${assignmentId}`).emit('job:progress', {
      status: 'processing',
      message,
      progress,
    });
  } catch (err) {
    logger.warn('Could not emit job:progress — Socket.io not available', {
      assignmentId,
      progress,
      message,
    });
  }
}

function emitComplete(assignmentId: string, paperId: string): void {
  try {
    const io = getIO();
    io.to(`assignment:${assignmentId}`).emit('job:complete', {
      status: 'completed',
      assignmentId,
      paperId,
    });
  } catch (err) {
    logger.warn('Could not emit job:complete — Socket.io not available', {
      assignmentId,
      paperId,
    });
  }
}

function emitFailed(assignmentId: string, message: string): void {
  try {
    const io = getIO();
    io.to(`assignment:${assignmentId}`).emit('job:failed', {
      status: 'failed',
      message,
    });
  } catch (err) {
    logger.warn('Could not emit job:failed — Socket.io not available', {
      assignmentId,
      message,
    });
  }
}

function parseGeminiResponse(rawText: string): GeminiParsedResponse | null {
  try {
    const cleaned = rawText
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```\s*$/, '')
      .trim();

    const parsed = JSON.parse(cleaned) as Record<string, unknown>;

    if (
      !Array.isArray(parsed.sections) ||
      parsed.sections.length === 0 ||
      !Array.isArray(parsed.answerKey) ||
      parsed.answerKey.length === 0
    ) {
      return null;
    }

    return {
      sections: parsed.sections as IGeneratedPaper['sections'],
      answerKey: parsed.answerKey as IGeneratedPaper['answerKey'],
    };
  } catch {
    return null;
  }
}

function computeTotals(sections: IGeneratedPaper['sections']): {
  totalQuestions: number;
  totalMarks: number;
} {
  let totalQuestions = 0;
  let totalMarks = 0;

  for (const section of sections) {
    totalQuestions += section.questions.length;
    totalMarks += section.marksPerQuestion * section.questions.length;
  }

  return { totalQuestions, totalMarks };
}

async function processGenerationJob(job: Job<GenerationJobData>): Promise<void> {
  const { assignmentId, isRegeneration = false } = job.data;

  logger.info('Generation job started', {
    jobId: job.id,
    assignmentId,
    isRegeneration,
  });

  emitProgress(assignmentId, 20, 'Analyzing your inputs...');

  const assignment = await Assignment.findById(assignmentId);

  if (!assignment) {
    logger.error('Assignment not found — marking job as failed', {
      jobId: job.id,
      assignmentId,
    });
    emitFailed(assignmentId, 'Assignment not found. The job cannot be processed.');
    throw new Error(`Assignment not found: ${assignmentId}`);
  }

  assignment.status = 'processing';
  await assignment.save();

  logger.info('Assignment fetched and status set to processing', {
    jobId: job.id,
    assignmentId,
  });

  const assignmentPlain = assignment.toObject({ versionKey: false });
  const assignmentForPrompt = {
    _id: assignmentPlain._id.toString(),
    userId: assignmentPlain.userId.toString(),
    title: assignmentPlain.title,
    subject: assignmentPlain.subject,
    class: assignmentPlain.class,
    schoolName: assignmentPlain.schoolName,
    dueDate: assignmentPlain.dueDate,
    timeAllowed: assignmentPlain.timeAllowed,
    instructions: assignmentPlain.instructions ?? '',
    additionalInfo: assignmentPlain.additionalInfo ?? '',
    questionTypes: assignmentPlain.questionTypes,
    uploadedFileUrl: assignmentPlain.uploadedFileUrl ?? null,
    uploadedFileText: assignmentPlain.uploadedFileText ?? null,
    status: assignmentPlain.status,
    jobId: assignmentPlain.jobId ?? null,
    createdAt: assignmentPlain.createdAt,
    updatedAt: assignmentPlain.updatedAt,
  };

  const prompt = buildPrompt(assignmentForPrompt);

  logger.info('Prompt built', {
    jobId: job.id,
    assignmentId,
    promptLength: prompt.length,
  });

  let rawResponse: string;
  try {
    rawResponse = await gemini.generate(prompt);
    logger.info('Gemini response received', {
      jobId: job.id,
      assignmentId,
      responseLength: rawResponse.length,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown Gemini error';
    logger.error('Gemini generate call failed', {
      jobId: job.id,
      assignmentId,
      error: message,
    });
    assignment.status = 'failed';
    await assignment.save();
    emitFailed(assignmentId, `AI generation failed: ${message}`);
    throw err;
  }

  emitProgress(assignmentId, 70, 'Structuring your question paper...');

  let parsed = parseGeminiResponse(rawResponse);

  if (!parsed) {
    logger.warn('First Gemini response failed to parse — retrying with strict prompt', {
      jobId: job.id,
      assignmentId,
    });

    let strictRawResponse: string;
    try {
      strictRawResponse = await gemini.generateStrict(prompt);
      logger.info('Gemini strict response received', {
        jobId: job.id,
        assignmentId,
        responseLength: strictRawResponse.length,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown Gemini error on retry';
      logger.error('Gemini generateStrict call failed', {
        jobId: job.id,
        assignmentId,
        error: message,
      });
      assignment.status = 'failed';
      await assignment.save();
      emitFailed(assignmentId, `AI generation failed on retry: ${message}`);
      throw err;
    }

    parsed = parseGeminiResponse(strictRawResponse);

    if (!parsed) {
      logger.error('Strict Gemini response also failed to parse — marking assignment as failed', {
        jobId: job.id,
        assignmentId,
      });

      assignment.status = 'failed';
      await assignment.save();

      emitFailed(
        assignmentId,
        'Failed to generate a valid question paper after multiple attempts. Please try regenerating.',
      );

      throw new Error('Gemini response could not be parsed after retry with strict prompt.');
    }
  }

  logger.info('Gemini response parsed successfully', {
    jobId: job.id,
    assignmentId,
    sectionCount: parsed.sections.length,
    answerKeyCount: parsed.answerKey.length,
  });

  if (isRegeneration) {
    const cacheKey = `paper:${assignmentId}`;
    await redis.del(cacheKey);
    logger.info('Existing Redis cache entry deleted for regeneration', {
      jobId: job.id,
      assignmentId,
      cacheKey,
    });
  }

  const { totalQuestions, totalMarks } = computeTotals(parsed.sections);

  const paperDoc = await GeneratedPaper.findOneAndUpdate(
    { assignmentId },
    {
      assignmentId,
      schoolName: assignment.schoolName,
      subject: assignment.subject,
      class: assignment.class,
      timeAllowed: assignment.timeAllowed,
      totalMarks,
      totalQuestions,
      instructions: assignment.instructions ?? '',
      sections: parsed.sections,
      answerKey: parsed.answerKey,
      generatedAt: new Date(),
    },
    { upsert: true, new: true },
  );

  const paperId = paperDoc._id.toString();

  logger.info('GeneratedPaper saved to MongoDB', {
    jobId: job.id,
    assignmentId,
    paperId,
    totalQuestions,
    totalMarks,
  });

  const cacheKey = `paper:${assignmentId}`;
  const serializedPaper = JSON.stringify(paperDoc.toObject({ versionKey: false }));
  await redis.set(cacheKey, serializedPaper, 'EX', 3600);

  logger.info('GeneratedPaper cached in Redis', {
    jobId: job.id,
    assignmentId,
    cacheKey,
    ttl: 3600,
  });

  assignment.status = 'completed';
  await assignment.save();

  logger.info('Assignment status updated to completed', {
    jobId: job.id,
    assignmentId,
  });

  emitComplete(assignmentId, paperId);

  logger.info('Generation job completed successfully', {
    jobId: job.id,
    assignmentId,
    paperId,
  });
}

export const generationWorker = new Worker<GenerationJobData>(
  'question-generation',
  processGenerationJob,
  {
    connection: { url: env.REDIS_URL },
    concurrency: 1,
  },
);

generationWorker.on('active', (job) => {
  logger.info('Generation worker: job active', {
    jobId: job.id,
    assignmentId: job.data.assignmentId,
  });
});

generationWorker.on('completed', (job) => {
  logger.info('Generation worker: job completed', {
    jobId: job.id,
    assignmentId: job.data.assignmentId,
  });
});

generationWorker.on('failed', (job, err) => {
  logger.error('Generation worker: job failed', {
    jobId: job?.id,
    assignmentId: job?.data?.assignmentId,
    error: err.message,
  });
});

generationWorker.on('error', (err) => {
  logger.error('Generation worker: worker error', {
    error: err.message,
  });
});

generationWorker.on('stalled', (jobId) => {
  logger.warn('Generation worker: job stalled', { jobId });
});

export default generationWorker;
