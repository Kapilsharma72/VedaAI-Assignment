import { Schema, model, Document, Types } from 'mongoose';
import type { IAssignment } from '@vedaai/shared';

export interface IAssignmentDocument extends Omit<IAssignment, '_id' | 'userId'>, Document {
  userId: Types.ObjectId;
}

const QuestionTypeSchema = new Schema(
  {
    type: {
      type: String,
      required: true,
    },
    count: {
      type: Number,
      required: true,
      min: 1,
    },
    marks: {
      type: Number,
      required: true,
      min: 1,
    },
  },
  { _id: false },
);

const AssignmentSchema = new Schema<IAssignmentDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: true,
      maxlength: 200,
    },
    subject: {
      type: String,
      required: true,
      maxlength: 100,
    },
    class: {
      type: String,
      required: true,
      maxlength: 50,
    },
    schoolName: {
      type: String,
      required: true,
      maxlength: 200,
    },
    dueDate: {
      type: Date,
      required: true,
    },
    timeAllowed: {
      type: Number,
      required: true,
      min: 1,
      max: 300,
    },
    instructions: {
      type: String,
      default: '',
      maxlength: 1000,
    },
    additionalInfo: {
      type: String,
      default: '',
      maxlength: 2000,
    },
    questionTypes: {
      type: [QuestionTypeSchema],
      required: true,
    },
    uploadedFileUrl: {
      type: String,
      default: null,
    },
    uploadedFileText: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed'],
      default: 'pending',
    },
    jobId: {
      type: String,
      default: null,
    },
  },
  { timestamps: true },
);

AssignmentSchema.index({ userId: 1, createdAt: -1 });
AssignmentSchema.index({ jobId: 1 }, { sparse: true });

export const Assignment = model<IAssignmentDocument>('Assignment', AssignmentSchema);
