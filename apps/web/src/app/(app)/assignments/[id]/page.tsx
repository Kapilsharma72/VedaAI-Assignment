'use client';
import React, { useEffect, useState, useCallback } from 'react';
import { toast } from 'sonner';
import type { IAssignment, IGeneratedPaper } from '@vedaai/shared';
import api from '@/lib/api';
import { useAssignmentSocket } from '@/hooks/useAssignmentSocket';
import AIMessageBubble from '@/components/output/AIMessageBubble';
import QuestionPaperCard from '@/components/output/QuestionPaperCard';
interface AssignmentPageProps {
    params: {
        id: string;
    };
}
function LoadingSkeleton() {
    return (<div className="animate-pulse space-y-4" aria-label="Loading assignment" aria-busy="true">
      <div className="h-20 rounded-xl bg-gray-200"/>
      <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm space-y-4">
        <div className="mx-auto h-6 w-48 rounded bg-gray-200"/>
        <div className="mx-auto h-4 w-36 rounded bg-gray-200"/>
        <div className="flex justify-between">
          <div className="h-4 w-32 rounded bg-gray-200"/>
          <div className="h-4 w-24 rounded bg-gray-200"/>
        </div>
        <hr className="border-gray-200"/>
        <div className="space-y-2">
          <div className="h-4 w-full rounded bg-gray-200"/>
          <div className="h-4 w-full rounded bg-gray-200"/>
          <div className="h-4 w-full rounded bg-gray-200"/>
        </div>
        <hr className="border-gray-200"/>
        <div className="mx-auto h-4 w-40 rounded bg-gray-200"/>
        {[1, 2, 3, 4, 5].map((i) => (<div key={i} className="flex gap-3">
            <div className="h-4 w-6 flex-shrink-0 rounded bg-gray-200"/>
            <div className="flex-1 space-y-1">
              <div className="h-4 w-full rounded bg-gray-200"/>
              <div className="h-4 w-3/4 rounded bg-gray-200"/>
            </div>
          </div>))}
      </div>
    </div>);
}
interface ProgressViewProps {
    progress: number;
    message: string;
    isConnected: boolean;
    onRetryConnection: () => void;
    connectionError: string | null;
}
function ProgressView({ progress, message, isConnected, onRetryConnection, connectionError, }: ProgressViewProps) {
    return (<div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#6366f1]/10">
          <svg className="h-7 w-7 animate-spin text-[#6366f1]" fill="none" viewBox="0 0 24 24" aria-hidden="true">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
          </svg>
        </div>

        <div>
          <p className="text-base font-semibold text-gray-900">Generating your question paper…</p>
          {message && (<p className="mt-1 text-sm text-gray-500">{message}</p>)}
        </div>

        <div className="w-full max-w-sm">
          <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100} aria-label="Generation progress">
            <div className="h-full rounded-full bg-[#6366f1] transition-all duration-500" style={{ width: `${progress}%` }}/>
          </div>
          <p className="mt-1 text-right text-xs text-gray-400">{progress}%</p>
        </div>

        {connectionError && (<div className="w-full rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <p>{connectionError}</p>
            <button type="button" onClick={onRetryConnection} className="mt-2 rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2">
              Retry Connection
            </button>
          </div>)}

        {!isConnected && !connectionError && (<p className="text-xs text-gray-400">Connecting to server…</p>)}
      </div>
    </div>);
}
interface ErrorCardProps {
    message: string;
    onRetry: () => void;
    isRetrying: boolean;
}
function ErrorCard({ message, onRetry, isRetrying }: ErrorCardProps) {
    return (<div className="rounded-xl border border-red-200 bg-red-50 p-8 shadow-sm" role="alert" aria-live="assertive">
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-100">
          <svg className="h-7 w-7 text-red-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z"/>
          </svg>
        </div>

        <div>
          <p className="text-base font-semibold text-red-900">Generation Failed</p>
          <p className="mt-1 text-sm text-red-700">{message}</p>
        </div>

        <button type="button" onClick={onRetry} disabled={isRetrying} className="flex items-center gap-2 rounded-lg bg-red-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 disabled:opacity-50">
          {isRetrying ? (<>
              <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
              Retrying…
            </>) : ('Retry')}
        </button>
      </div>
    </div>);
}
interface LiveGenerationViewProps {
    assignmentId: string;
    subject: string;
    socketKey: number;
    onRegenerateStart: () => void;
}
function LiveGenerationView({ assignmentId, subject, socketKey: _socketKey, onRegenerateStart, onComplete, }: LiveGenerationViewProps & { onComplete?: (paper: IGeneratedPaper) => void }) {
    const { progress, message, paper, error, isConnected, retryConnection } = useAssignmentSocket(assignmentId);
    const [isRetrying, setIsRetrying] = useState(false);

    useEffect(() => {
        if (paper) {
            onComplete?.(paper);
        }
    }, [paper, onComplete]);
    const handleRetry = useCallback(async () => {
        setIsRetrying(true);
        try {
            await api.post(`/api/assignments/${assignmentId}/regenerate`);
            toast.success('Regeneration started! Your new question paper is being generated.');
            onRegenerateStart();
        }
        catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Failed to start regeneration. Please try again.';
            toast.error(msg);
        }
        finally {
            setIsRetrying(false);
        }
    }, [assignmentId, onRegenerateStart]);
    if (paper) {
        return (<div className="space-y-4">
        <AIMessageBubble assignmentId={assignmentId} subject={subject} paper={paper} onDownloadPDF={() => { }} onRegenerateStart={onRegenerateStart}/>
        <QuestionPaperCard paper={paper}/>
      </div>);
    }
    if (error && progress === 0) {
        return (<ErrorCard message={error} onRetry={handleRetry} isRetrying={isRetrying}/>);
    }
    if (error) {
        return (<ProgressView progress={progress} message={message} isConnected={isConnected} onRetryConnection={retryConnection} connectionError={error}/>);
    }
    return (<ProgressView progress={progress} message={message} isConnected={isConnected} onRetryConnection={retryConnection} connectionError={null}/>);
}
export default function AssignmentPage({ params }: AssignmentPageProps) {
    const { id } = params;
    const [assignment, setAssignment] = useState<IAssignment | null>(null);
    const [paper, setPaper] = useState<IGeneratedPaper | null>(null);
    const [isFetching, setIsFetching] = useState(true);
    const [fetchError, setFetchError] = useState<string | null>(null);
    const [isRetrying, setIsRetrying] = useState(false);
    const [socketKey, setSocketKey] = useState(0);
    useEffect(() => {
        let cancelled = false;
        async function fetchAssignment() {
            setIsFetching(true);
            setFetchError(null);
            try {
                const fetchedAssignment = await api.get<IAssignment>(`/api/assignments/${id}`);
                if (cancelled)
                    return;
                setAssignment(fetchedAssignment as unknown as IAssignment);
                if ((fetchedAssignment as unknown as IAssignment).status === 'completed') {
                    try {
                        const fetchedPaper = await api.get<IGeneratedPaper>(`/api/assignments/${id}/paper`);
                        if (!cancelled) {
                            setPaper(fetchedPaper as unknown as IGeneratedPaper);
                        }
                    }
                    catch {
                        if (!cancelled) {
                            setFetchError('The question paper could not be loaded. Please refresh the page.');
                        }
                    }
                }
            }
            catch (err: unknown) {
                if (!cancelled) {
                    const msg = err instanceof Error ? err.message : 'Failed to load assignment. Please try again.';
                    setFetchError(msg);
                }
            }
            finally {
                if (!cancelled) {
                    setIsFetching(false);
                }
            }
        }
        fetchAssignment();
        return () => {
            cancelled = true;
        };
    }, [id]);
    const handleRegenerateStart = useCallback(() => {
        setPaper(null);
        setAssignment((prev) => prev ? { ...prev, status: 'pending' } : prev);
        setSocketKey((k) => k + 1);
    }, []);
    const handleGenerationComplete = useCallback((completedPaper: IGeneratedPaper) => {
        setPaper(completedPaper);
        setAssignment((prev) => (prev ? { ...prev, status: 'completed' } : prev));
    }, []);
    const handleRetryFailed = useCallback(async () => {
        setIsRetrying(true);
        try {
            await api.post(`/api/assignments/${id}/regenerate`);
            toast.success('Regeneration started! Your new question paper is being generated.');
            handleRegenerateStart();
        }
        catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Failed to start regeneration. Please try again.';
            toast.error(msg);
        }
        finally {
            setIsRetrying(false);
        }
    }, [id, handleRegenerateStart]);
    if (isFetching) {
        return (<div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <LoadingSkeleton />
      </div>);
    }
    if (fetchError && !assignment) {
        return (<div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="rounded-xl border border-red-200 bg-red-50 p-8 text-center shadow-sm" role="alert">
          <p className="text-base font-semibold text-red-900">Failed to load assignment</p>
          <p className="mt-1 text-sm text-red-700">{fetchError}</p>
        </div>
      </div>);
    }
    if (!assignment)
        return null;
    const subject = assignment.subject;
    return (<div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">{assignment.title}</h1>
        <p className="mt-1 text-sm text-gray-500">
          {assignment.subject} &mdash; Class {assignment.class}
        </p>
      </div>

      {assignment.status === 'completed' && paper && (<div className="space-y-4">
          <AIMessageBubble assignmentId={id} subject={subject} paper={paper} onDownloadPDF={() => { }} onRegenerateStart={handleRegenerateStart}/>
          <QuestionPaperCard paper={paper}/>
        </div>)}

      {assignment.status === 'completed' && !paper && fetchError && (<div className="rounded-xl border border-red-200 bg-red-50 p-8 text-center shadow-sm" role="alert">
          <p className="text-base font-semibold text-red-900">Paper unavailable</p>
          <p className="mt-1 text-sm text-red-700">{fetchError}</p>
        </div>)}

      {(assignment.status === 'pending' || assignment.status === 'processing') && (<LiveGenerationView key={socketKey} assignmentId={id} subject={subject} socketKey={socketKey} onRegenerateStart={handleRegenerateStart} onComplete={handleGenerationComplete}/>)}

      {assignment.status === 'failed' && (<ErrorCard message="Question paper generation failed. Please retry to generate a new paper." onRetry={handleRetryFailed} isRetrying={isRetrying}/>)}
    </div>);
}
