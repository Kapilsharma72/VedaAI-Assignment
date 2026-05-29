'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import type {
  IAssignment,
  IGeneratedPaper,
  WsProgressPayload,
  WsCompletePayload,
  WsFailedPayload,
} from '@vedaai/shared';
import api from '@/lib/api';
import { useAssignmentsStore } from '@/store/assignments.store';

export interface UseAssignmentSocketReturn {
  progress: number;
  message: string;
  paper: IGeneratedPaper | null;
  error: string | null;
  isConnected: boolean;
  retryConnection: () => void;
}

const POLL_INTERVAL_MS = 3000;

async function loadPaperIfReady(
  assignmentId: string,
  updateAssignment: (id: string, patch: Partial<IAssignment>) => void,
): Promise<{ paper: IGeneratedPaper | null; status: IAssignment['status'] } | null> {
  const assignment = (await api.get(`/api/assignments/${assignmentId}`)) as Pick<
    IAssignment,
    'status'
  >;

  if (assignment.status === 'completed') {
    const fetchedPaper = (await api.get(
      `/api/assignments/${assignmentId}/paper`,
    )) as IGeneratedPaper;
    updateAssignment(assignmentId, { status: 'completed' });
    return { paper: fetchedPaper, status: 'completed' };
  }

  if (assignment.status === 'failed') {
    updateAssignment(assignmentId, { status: 'failed' });
    return { paper: null, status: 'failed' };
  }

  if (assignment.status === 'processing') {
    return { paper: null, status: 'processing' };
  }

  return { paper: null, status: assignment.status };
}

export function useAssignmentSocket(assignmentId: string): UseAssignmentSocketReturn {
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState('');
  const [paper, setPaper] = useState<IGeneratedPaper | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [done, setDone] = useState(false);

  const updateAssignment = useAssignmentsStore((state) => state.updateAssignment);
  const socketRef = useRef<Socket | null>(null);

  const handleComplete = useCallback(
    (fetchedPaper: IGeneratedPaper) => {
      setPaper(fetchedPaper);
      setProgress(100);
      setMessage('Question paper ready!');
      setError(null);
      setDone(true);
      updateAssignment(assignmentId, { status: 'completed' });
    },
    [assignmentId, updateAssignment],
  );

  const pollStatus = useCallback(async () => {
    if (done) return;

    try {
      const result = await loadPaperIfReady(assignmentId, updateAssignment);
      if (!result) return;

      if (result.status === 'completed' && result.paper) {
        handleComplete(result.paper);
      } else if (result.status === 'failed') {
        setError('Question paper generation failed. Please retry.');
        setProgress(0);
        setDone(true);
      } else if (result.status === 'processing' && progress === 0) {
        setProgress(10);
        setMessage('AI is generating your question paper…');
      }
    } catch {
      // polling is best-effort
    }
  }, [assignmentId, done, handleComplete, progress, updateAssignment]);

  const connect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    setError(null);
    setIsConnected(false);

    const serverUrl = process.env.NEXT_PUBLIC_API_URL ?? '';
    const socket = io(serverUrl, {
      withCredentials: true,
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
      setError(null);
      socket.emit('join:assignment', { assignmentId });
      void pollStatus();
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socket.on('connect_error', () => {
      setIsConnected(false);
      void pollStatus();
    });

    socket.on('job:progress', (payload: WsProgressPayload) => {
      setProgress(payload.progress);
      setMessage(payload.message);
      setError(null);
    });

    socket.on('job:complete', async (payload: WsCompletePayload) => {
      try {
        const fetchedPaper = (await api.get(
          `/api/assignments/${payload.assignmentId}/paper`,
        )) as IGeneratedPaper;
        handleComplete(fetchedPaper);
      } catch {
        setError('Generation completed but the paper could not be loaded. Please refresh.');
      }
    });

    socket.on('job:failed', (payload: WsFailedPayload) => {
      setError(payload.message ?? 'Question paper generation failed. Please try again.');
      setProgress(0);
      setDone(true);
      updateAssignment(assignmentId, { status: 'failed' });
    });
  }, [assignmentId, handleComplete, pollStatus, updateAssignment]);

  useEffect(() => {
    connect();
    void pollStatus();

    const interval = setInterval(() => {
      void pollStatus();
    }, POLL_INTERVAL_MS);

    return () => {
      clearInterval(interval);
      socketRef.current?.disconnect();
      socketRef.current = null;
    };
  }, [connect, pollStatus]);

  const retryConnection = useCallback(() => {
    setDone(false);
    setError(null);
    connect();
    void pollStatus();
  }, [connect, pollStatus]);

  return { progress, message, paper, error, isConnected, retryConnection };
}

export default useAssignmentSocket;
