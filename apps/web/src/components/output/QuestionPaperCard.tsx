'use client';

import React, { useState } from 'react';
import type { IGeneratedPaper, IQuestion } from '@vedaai/shared';

interface QuestionPaperCardProps {
  paper: IGeneratedPaper;
}

type Difficulty = IQuestion['difficulty'];

const DIFFICULTY_CONFIG: Record<Difficulty, { label: string; className: string }> = {
  Easy: {
    label: 'Easy',
    className: 'bg-green-100 text-green-800',
  },
  Moderate: {
    label: 'Moderate',
    className: 'bg-amber-100 text-amber-800',
  },
  Hard: {
    label: 'Hard',
    className: 'bg-red-100 text-red-800',
  },
};

function DifficultyBadge({ difficulty }: { difficulty: Difficulty }) {
  const config = DIFFICULTY_CONFIG[difficulty];
  return (
    <span
      className={[
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
        config.className,
      ].join(' ')}
      aria-label={`Difficulty: ${config.label}`}
    >
      {config.label}
    </span>
  );
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      className={[
        'h-4 w-4 transition-transform duration-200',
        open ? 'rotate-180' : 'rotate-0',
      ].join(' ')}
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={2}
      stroke="currentColor"
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="m19 9-7 7-7-7" />
    </svg>
  );
}

export default function QuestionPaperCard({ paper }: QuestionPaperCardProps) {
  const [answerKeyOpen, setAnswerKeyOpen] = useState(false);

  return (
    <article
      className="w-full rounded-[0.75rem] border border-gray-200 bg-white shadow-sm print:shadow-none print:border-none"
      aria-label="Generated question paper"
    >
      <div className="px-8 py-8 sm:px-12 sm:py-10">

        <h1 className="text-center text-xl font-bold text-gray-900 leading-tight">
          {paper.schoolName}
        </h1>

        <p className="mt-1 text-center text-base text-gray-700">
          {paper.subject} &mdash;{' '}
          {paper.class.toLowerCase().startsWith('class') ? paper.class : `Class ${paper.class}`}
        </p>

        <div className="mt-3 flex items-center justify-between text-sm text-gray-600">
          <span>
            <span className="font-medium">Time Allowed:</span>{' '}
            {paper.timeAllowed} {paper.timeAllowed === 1 ? 'minute' : 'minutes'}
          </span>
          <span>
            <span className="font-medium">Total Marks:</span> {paper.totalMarks}
          </span>
        </div>

        <hr className="mt-4 border-gray-300" />

        <div className="mt-4 space-y-2 text-sm text-gray-700">
          <div className="flex items-baseline gap-2">
            <span className="font-medium whitespace-nowrap">Name:</span>
            <span className="flex-1 border-b border-gray-400" aria-hidden="true" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-medium whitespace-nowrap">Roll Number:</span>
            <span className="flex-1 border-b border-gray-400" aria-hidden="true" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-medium whitespace-nowrap">Class/Section:</span>
            <span className="flex-1 border-b border-gray-400" aria-hidden="true" />
          </div>
        </div>

        <hr className="mt-4 border-gray-300" />

        {paper.instructions && (
          <div className="mt-4 rounded-md bg-gray-50 px-4 py-3 text-xs text-gray-600 leading-relaxed">
            <p className="font-semibold text-gray-700 mb-1">General Instructions:</p>
            <p className="whitespace-pre-line">{paper.instructions}</p>
          </div>
        )}

        {paper.sections.map((section) => (
          <section key={section.title} className="mt-6" aria-label={`Section: ${section.title}`}>
            <h2 className="text-center text-sm font-bold uppercase tracking-widest text-gray-800">
              {section.title}
            </h2>

            <p className="mt-0.5 text-center text-xs text-gray-500">
              {section.questionTypeName}
              {section.instruction ? ` — ${section.instruction}` : ''}
              {' '}({section.marksPerQuestion}{' '}
              {section.marksPerQuestion === 1 ? 'mark' : 'marks'} each)
            </p>

            <ol className="mt-3 space-y-3" aria-label={`Questions in ${section.title}`}>
              {section.questions.map((question) => (
                <li
                  key={question.number}
                  className="flex items-start gap-3 text-sm text-gray-800"
                >
                  <span className="flex-shrink-0 font-semibold text-gray-700 w-6 text-right">
                    {question.number}.
                  </span>

                  <div className="flex-1 min-w-0">
                    <p className="leading-relaxed">{question.text}</p>

                    {question.options && question.options.length > 0 && (
                      <ul className="mt-2 space-y-1 pl-1" aria-label="Answer options">
                        {question.options.map((opt) => (
                          <li key={opt.label} className="flex items-start gap-2 text-sm text-gray-700">
                            <span className="flex-shrink-0 font-semibold w-5">{opt.label}.</span>
                            <span>{opt.text}</span>
                          </li>
                        ))}
                      </ul>
                    )}

                    <div className="mt-1.5 flex items-center gap-2 flex-wrap">
                      <DifficultyBadge difficulty={question.difficulty} />
                      <span className="text-xs text-gray-500">
                        [{question.marks} {question.marks === 1 ? 'mark' : 'marks'}]
                      </span>
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          </section>
        ))}

        <div className="mt-8 border-t border-gray-300 pt-4">
          <button
            type="button"
            onClick={() => setAnswerKeyOpen((prev) => !prev)}
            aria-expanded={answerKeyOpen}
            aria-controls="answer-key-content"
            className="flex w-full items-center justify-between rounded-md px-1 py-1 text-sm font-semibold text-gray-700 hover:text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6366f1] focus-visible:ring-offset-2 transition-colors"
          >
            <span className="uppercase tracking-widest text-xs">Answer Key</span>
            <ChevronIcon open={answerKeyOpen} />
          </button>

          {answerKeyOpen && (
            <div
              id="answer-key-content"
              role="region"
              aria-label="Answer Key"
              className="mt-3 rounded-md bg-gray-50 px-4 py-4"
            >
              {paper.answerKey.length === 0 ? (
                <p className="text-xs text-gray-500 italic">No answer key available.</p>
              ) : (
                <ol className="space-y-1.5">
                  {paper.answerKey.map((entry) => (
                    <li
                      key={`${entry.sectionTitle}-${entry.questionNumber}`}
                      className="flex items-start gap-2 text-xs text-gray-700"
                    >
                      <span className="flex-shrink-0 font-semibold w-6 text-right">
                        {entry.questionNumber}.
                      </span>
                      <span className="flex-1 leading-relaxed">{entry.answer}</span>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
