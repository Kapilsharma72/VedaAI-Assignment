import { create } from 'zustand';
export interface Step1Data {
    dueDate: string;
    questionTypes: Array<{
        type: string;
        count: number;
        marks: number;
    }>;
    additionalInfo?: string;
    uploadedFileUrl?: string | null;
    uploadedFileText?: string | null;
}
export interface Step2Data {
    title: string;
    subject: string;
    class: string;
    schoolName: string;
    timeAllowed: number;
    instructions?: string;
}
interface WizardStore {
    step1: Step1Data | null;
    step2: Step2Data | null;
    setStep1: (data: Step1Data) => void;
    setStep2: (data: Step2Data) => void;
    reset: () => void;
}
export const useWizardStore = create<WizardStore>((set) => ({
    step1: null,
    step2: null,
    setStep1: (data) => set({ step1: data }),
    setStep2: (data) => set({ step2: data }),
    reset: () => set({ step1: null, step2: null }),
}));
