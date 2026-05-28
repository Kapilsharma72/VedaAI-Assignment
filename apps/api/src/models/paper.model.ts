import { Schema, model, Document, Types } from 'mongoose';
import type { IGeneratedPaper, ISection, IQuestion, IAnswerKeyEntry } from '@vedaai/shared';
export interface IQuestionDocument extends IQuestion {
}
export interface ISectionDocument extends ISection {
    questions: IQuestionDocument[];
}
export interface IAnswerKeyEntryDocument extends IAnswerKeyEntry {
}
export interface IGeneratedPaperDocument extends Omit<IGeneratedPaper, '_id' | 'assignmentId'>, Document {
    assignmentId: Types.ObjectId;
    sections: ISectionDocument[];
    answerKey: IAnswerKeyEntryDocument[];
}
const QuestionSchema = new Schema<IQuestionDocument>({
    number: { type: Number, required: true },
    text: { type: String, required: true },
    difficulty: { type: String, enum: ['Easy', 'Moderate', 'Hard'], required: true },
    marks: { type: Number, required: true },
    options: {
        type: [
            new Schema({ label: { type: String, required: true }, text: { type: String, required: true } }, { _id: false })
        ],
        default: undefined,
    },
}, { _id: false });
const SectionSchema = new Schema<ISectionDocument>({
    title: { type: String, required: true },
    questionTypeName: { type: String, required: true },
    instruction: { type: String, required: true },
    marksPerQuestion: { type: Number, required: true },
    questions: { type: [QuestionSchema], required: true },
}, { _id: false });
const AnswerKeyEntrySchema = new Schema<IAnswerKeyEntryDocument>({
    questionNumber: { type: Number, required: true },
    sectionTitle: { type: String, required: true },
    answer: { type: String, required: true },
}, { _id: false });
const GeneratedPaperSchema = new Schema<IGeneratedPaperDocument>({
    assignmentId: { type: Schema.Types.ObjectId, ref: 'Assignment', required: true, unique: true },
    schoolName: { type: String, required: true },
    subject: { type: String, required: true },
    class: { type: String, required: true },
    timeAllowed: { type: Number, required: true },
    totalMarks: { type: Number, required: true },
    totalQuestions: { type: Number, required: true },
    instructions: { type: String, default: '' },
    sections: { type: [SectionSchema], required: true },
    answerKey: { type: [AnswerKeyEntrySchema], required: true },
    generatedAt: { type: Date, default: Date.now },
});
GeneratedPaperSchema.index({ assignmentId: 1 }, { unique: true });
export const GeneratedPaper = model<IGeneratedPaperDocument>('GeneratedPaper', GeneratedPaperSchema);
