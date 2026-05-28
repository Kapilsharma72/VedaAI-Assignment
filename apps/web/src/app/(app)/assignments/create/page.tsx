'use client';

import React, { useState, useEffect } from 'react';
import { useWizardStore } from '@/store/wizard.store';
import Step1Details from '@/components/wizard/Step1Details';
import Step2Settings from '@/components/wizard/Step2Settings';

const STEPS = [
  { number: 1, label: 'Details' },
  { number: 2, label: 'Settings' },
] as const;

function ProgressBar({ currentStep }: { currentStep: 1 | 2 }) {
  return (
    <nav aria-label="Wizard progress" className="mb-8">
      <ol className="flex items-center gap-0">
        {STEPS.map((step, index) => {
          const isCompleted = step.number < currentStep;
          const isActive = step.number === currentStep;
          const isLast = index === STEPS.length - 1;

          return (
            <React.Fragment key={step.number}>
              <li className="flex flex-col items-center gap-1.5">
                <div
                  className={[
                    'flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold transition-colors',
                    isCompleted
                      ? 'bg-[#6366f1] text-white'
                      : isActive
                        ? 'border-2 border-[#6366f1] bg-white text-[#6366f1]'
                        : 'border-2 border-gray-300 bg-white text-gray-400',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  aria-current={isActive ? 'step' : undefined}
                >
                  {isCompleted ? (
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2.5}
                      stroke="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="m4.5 12.75 6 6 9-13.5"
                      />
                    </svg>
                  ) : (
                    step.number
                  )}
                </div>
                <span
                  className={[
                    'text-xs font-medium',
                    isActive ? 'text-[#6366f1]' : isCompleted ? 'text-[#6366f1]' : 'text-gray-400',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                >
                  {step.label}
                </span>
              </li>

              {!isLast && (
                <div
                  aria-hidden="true"
                  className={[
                    'mx-3 mb-5 h-0.5 flex-1 transition-colors',
                    isCompleted ? 'bg-[#6366f1]' : 'bg-gray-200',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                />
              )}
            </React.Fragment>
          );
        })}
      </ol>

      <p className="mt-2 text-center text-sm text-gray-500">
        Step {currentStep} of {STEPS.length}
      </p>
    </nav>
  );
}

export default function CreateAssignmentPage() {
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);
  const reset = useWizardStore((s) => s.reset);

  useEffect(() => {
    return () => {
      reset();
    };
  }, [reset]);

  const handleNext = () => setCurrentStep(2);
  const handlePrevious = () => setCurrentStep(1);

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Create Assignment</h1>
        <p className="mt-1 text-sm text-gray-500">
          Configure your assignment details and let AI generate a question paper for you.
        </p>
      </header>

      <ProgressBar currentStep={currentStep} />

      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        {currentStep === 1 ? (
          <Step1Details onNext={handleNext} />
        ) : (
          <Step2Settings onPrevious={handlePrevious} />
        )}
      </div>
    </div>
  );
}
