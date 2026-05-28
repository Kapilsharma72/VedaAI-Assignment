export interface IUser {
    _id: string;
    name: string;
    email: string;
    password: string | null;
    schoolName: string;
    location: string;
    googleId: string | null;
    avatar: string | null;
    createdAt: Date;
    updatedAt: Date;
}
export interface IQuestionType {
    type: string;
    count: number;
    marks: number;
}
export interface IAssignment {
    _id: string;
    userId: string;
    title: string;
    subject: string;
    class: string;
    schoolName: string;
    dueDate: Date;
    timeAllowed: number;
    instructions: string;
    additionalInfo: string;
    questionTypes: IQuestionType[];
    uploadedFileUrl: string | null;
    uploadedFileText: string | null;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    jobId: string | null;
    createdAt: Date;
    updatedAt: Date;
}
export interface IQuestion {
    number: number;
    text: string;
    difficulty: 'Easy' | 'Moderate' | 'Hard';
    marks: number;
    options?: { label: string; text: string }[];
}
export interface ISection {
    title: string;
    questionTypeName: string;
    instruction: string;
    marksPerQuestion: number;
    questions: IQuestion[];
}
export interface IAnswerKeyEntry {
    questionNumber: number;
    sectionTitle: string;
    answer: string;
}
export interface IGeneratedPaper {
    _id: string;
    assignmentId: string;
    schoolName: string;
    subject: string;
    class: string;
    timeAllowed: number;
    totalMarks: number;
    totalQuestions: number;
    instructions: string;
    sections: ISection[];
    answerKey: IAnswerKeyEntry[];
    generatedAt: Date;
}
export interface RegisterDto {
    name: string;
    email: string;
    password: string;
    schoolName: string;
    location: string;
}
export interface LoginDto {
    email: string;
    password: string;
}
export interface CreateAssignmentDto {
    title: string;
    subject: string;
    class: string;
    schoolName: string;
    dueDate: string;
    timeAllowed: number;
    instructions?: string;
    additionalInfo?: string;
    questionTypes: IQuestionType[];
    uploadedFileUrl?: string | null;
    uploadedFileText?: string | null;
}
export interface WsProgressPayload {
    status: 'processing';
    message: string;
    progress: number;
}
export interface WsCompletePayload {
    status: 'completed';
    assignmentId: string;
    paperId: string;
}
export interface WsFailedPayload {
    status: 'failed';
    message: string;
}
//# sourceMappingURL=index.d.ts.map