import { create } from 'zustand';
import type { IAssignment } from '@vedaai/shared';

interface AssignmentsStore {
  assignments: IAssignment[];
  setAssignments: (list: IAssignment[]) => void;
  addAssignment: (assignment: IAssignment) => void;
  removeAssignment: (id: string) => void;
  updateAssignment: (id: string, patch: Partial<IAssignment>) => void;
}

export const useAssignmentsStore = create<AssignmentsStore>((set) => ({
  assignments: [],

  setAssignments: (list) => set({ assignments: list }),

  addAssignment: (assignment) =>
    set((state) => ({ assignments: [assignment, ...state.assignments] })),

  removeAssignment: (id) =>
    set((state) => ({
      assignments: state.assignments.filter((a) => a._id !== id),
    })),

  updateAssignment: (id, patch) =>
    set((state) => ({
      assignments: state.assignments.map((a) =>
        a._id === id ? { ...a, ...patch } : a
      ),
    })),
}));
