'use client';
import React from 'react';
export const QUESTION_TYPE_OPTIONS = [
    'Multiple Choice Questions',
    'Short Questions',
    'Long Questions',
    'Diagram/Graph-Based Questions',
    'Numerical Problems',
    'True/False',
    'Fill in the Blanks',
] as const;
export type QuestionTypeOption = (typeof QUESTION_TYPE_OPTIONS)[number];
export interface QuestionTypeRowValue {
    type: string;
    count: number;
    marks: number;
}
export interface QuestionTypeRowProps {
    index: number;
    value: QuestionTypeRowValue;
    onChange: (index: number, field: 'type' | 'count' | 'marks', value: string | number) => void;
    onRemove: (index: number) => void;
}
function TrashIcon({ className }: {
    className?: string;
}) {
    return (<svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"/>
    </svg>);
}
export default function QuestionTypeRow({ index, value, onChange, onRemove, }: QuestionTypeRowProps) {
    const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        onChange(index, 'type', e.target.value);
    };
    const handleCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const parsed = parseInt(e.target.value, 10);
        onChange(index, 'count', isNaN(parsed) ? 1 : parsed);
    };
    const handleMarksChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const parsed = parseInt(e.target.value, 10);
        onChange(index, 'marks', isNaN(parsed) ? 1 : parsed);
    };
    const handleRemove = () => {
        onRemove(index);
    };
    const baseInputClass = 'min-h-[44px] min-w-[44px] rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 transition-colors focus:border-[#6366f1] focus:outline-none focus:ring-2 focus:ring-[#6366f1] focus:ring-offset-1';
    return (<div className="flex flex-wrap items-center gap-3 rounded-xl border border-gray-200 bg-white p-3 shadow-sm" role="group" aria-label={`Question type row ${index + 1}`}>



      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <label htmlFor={`qt-type-${index}`} className="text-xs font-medium text-gray-500">
          Question Type
        </label>
        <select id={`qt-type-${index}`} value={value.type} onChange={handleTypeChange} aria-label={`Question type for row ${index + 1}`} className={`${baseInputClass} w-full cursor-pointer appearance-none pr-8`} style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke-width='1.5' stroke='%236b7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='m19.5 8.25-7.5 7.5-7.5-7.5'/%3E%3C/svg%3E")`,
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'right 0.5rem center',
            backgroundSize: '1.25rem',
        }}>
          {QUESTION_TYPE_OPTIONS.map((option) => (<option key={option} value={option}>
              {option}
            </option>))}
        </select>
      </div>




      <div className="flex w-24 flex-col gap-1">
        <label htmlFor={`qt-count-${index}`} className="text-xs font-medium text-gray-500">
          Count
        </label>
        <input id={`qt-count-${index}`} type="number" min={1} value={value.count} onChange={handleCountChange} aria-label={`Question count for row ${index + 1}`} className={`${baseInputClass} w-full text-center`}/>
      </div>




      <div className="flex w-24 flex-col gap-1">
        <label htmlFor={`qt-marks-${index}`} className="text-xs font-medium text-gray-500">
          Marks
        </label>
        <input id={`qt-marks-${index}`} type="number" min={1} value={value.marks} onChange={handleMarksChange} aria-label={`Marks per question for row ${index + 1}`} className={`${baseInputClass} w-full text-center`}/>
      </div>




      <div className="flex flex-col justify-end gap-1">

        <span className="text-xs text-transparent select-none" aria-hidden="true">
          &nbsp;
        </span>
        <button type="button" onClick={handleRemove} aria-label={`Remove question type row ${index + 1}`} className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg border border-red-200 bg-red-50 text-red-500 transition-colors hover:border-red-400 hover:bg-red-100 hover:text-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-1">
          <TrashIcon className="h-5 w-5"/>
        </button>
      </div>
    </div>);
}
