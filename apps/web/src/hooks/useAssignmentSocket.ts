'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import type { IGeneratedPaper, WsProgressPayload, WsCompletePayload, WsFailedPayload } from '@vedaai/shared';
import api from '@/lib/api';
import { useAssignmentsStore } from '@/store/assignments.store';

/**
 * Return shape for useAssignmentSocket.
 *
 * Requirements: 10.3, 10.4, 10.5, 10.6, 10.7, 10.8
 */
export interface UseAssignmentSocketReturn {
  /** Numeric generation progress value (0–100). */
  progress: number;
  /** Human-readable status message emitted by the server. */
  message: string;
  /** The fetched GeneratedPaper once the job completes, or null beforehand. */
  paper: IGeneratedPaper | null;
  /** Error string when the job fails or the connection is lost; null otherwise. */
  error: string | null;
  /** Whether the Socket.io connection is currently active. */
  isConnected: boolean;
  /** Manually disconnect and reconnect the socket (e.g. after a connection loss). */
  retryConnection: () => void;
}

/**
 * Establishes a Socket.io connection for a specific assignment, joining its
 * room and listening for real-time generation progress events.
 *
 * Lifecycle:
 *  - On mount: connect → emit `join:assignment` with the assignmentId.
 *  - `job:progress`: update progress + message in local state.
 *  - `job:complete`: fetch the paper via GET /api/assignments/:id/paper,
 *    update the assignments store status to 'completed'.
 *  - `job:failed`: set error state with the failure message.
 *  - Connection loss / error: set isConnected=false and surface an error message.
 *  - On unmount: disconnect the socket.
 *
 * @param assignmentId - The MongoDB _id of the assignment to track.
 */
export function useAssignmentSocket(assignmentId: string): UseAssignmentSocketReturn {
  const [progress, setProgress] = useState<number>(0);
  const [message, setMessage] = useState<string>('');
  const [paper, setPaper] = useState<IGeneratedPaper | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);

  const updateAssignment = useAssignmentsStore((state) => state.updateAssignment);

  // Keep a stable ref to the socket so retryConnection can access it without
  // stale-closure issues.
  const socketRef = useRef<Socket | null>(null);

  /**
   * Creates a new Socket.io connection, registers all event handlers, and
   * stores the instance in socketRef. Any previously open socket is
   * disconnected first.
   */
  const connect = useCallback(() => {
    // Tear down any existing connection before creating a new one.
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    // Reset transient error state so the UI reflects the new attempt.
    setError(null);
    setIsConnected(false);

    const serverUrl = process.env.NEXT_PUBLIC_API_URL ?? '';

    const socket = io(serverUrl, {
      withCredentials: true,
      // Reconnection is handled manually via retryConnection to give the user
      // explicit control (Requirement 10.8).
      reconnection: false,
    });

    socketRef.current = socket;

    // -----------------------------------------------------------------------
    // Connection lifecycle events
    // -----------------------------------------------------------------------

    socket.on('connect', () => {
      setIsConnected(true);
      setError(null);
      // Join the room for this assignment so the server can target events.
      socket.emit('join:assignment', assignmentId);

      // ── Poll on connect: the job may have completed before the socket
      // connected (e.g. user navigated away and back, or slow connection).
      // Fetch the assignment status immediately and resolve if already done.
      api.get<{ status: string; _id: string }>(`/api/assignments/${assignmentId}`)
        .then(async (assignment) => {
          const a = assignment as unknown as { status: string; _id: string };
          if (a.status === 'completed') {
            try {
              const fetchedPaper = await api.get<IGeneratedPaper>(
                `/api/assignments/${assignmentId}/paper`
              );
              setPaper(fetchedPaper as unknown as IGeneratedPaper);
              updateAssignment(assignmentId, { status: 'completed' });
              setProgress(100);
            } catch {
              setError('Paper could not be loaded. Please refresh.');
            }
          } else if (a.status === 'failed') {
            setError('Question paper generation failed. Please retry.');
            setProgress(0);
            updateAssignment(assignmentId, { status: 'failed' });
          }
        })
        .catch(() => {
          // Silently ignore — socket events will handle updates
        });
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socket.on('connect_error', () => {
      setIsConnected(false);
      setError(
        'Unable to connect to the server. Check your connection and click "Retry Connection".'
      );
    });

    // -----------------------------------------------------------------------
    // Generation progress events
    // -----------------------------------------------------------------------

    /**
     * job:progress — update the animated progress bar and status label.
     * Requirement 10.4
     */
    socket.on('job:progress', (payload: WsProgressPayload) => {
      setProgress(payload.progress);
      setMessage(payload.message);
      setError(null);
    });

    /**
     * job:complete — fetch the generated paper and mark the assignment as
     * completed in the local store.
     * Requirement 10.5
     */
    socket.on('job:complete', async (payload: WsCompletePayload) => {
      try {
        const fetchedPaper = await api.get<IGeneratedPaper>(
          `/api/assignments/${payload.assignmentId}/paper`
        );
        setPaper(fetchedPaper as unknown as IGeneratedPaper);
        updateAssignment(payload.assignmentId, { status: 'completed' });
        setProgress(100);
      } catch {
        setError('Generation completed but the paper could not be loaded. Please refresh.');
      }
    });

    /**
     * job:failed — surface the failure message so the UI can show an error
     * card with a "Retry" button.
     * Requirement 10.6
     */
    socket.on('job:failed', (payload: WsFailedPayload) => {
      setError(payload.message ?? 'Question paper generation failed. Please try again.');
      setProgress(0); // Reset progress so the error condition triggers correctly
      updateAssignment(assignmentId, { status: 'failed' });
    });
  }, [assignmentId, updateAssignment]);

  // Connect on mount; disconnect on unmount.
  useEffect(() => {
    connect();

    return () => {
      socketRef.current?.disconnect();
      socketRef.current = null;
    };
    // connect is stable (useCallback with fixed deps), so this effect runs
    // exactly once per assignmentId change.
  }, [connect]);

  /**
   * Manually reconnect the socket — intended for the "Retry Connection" button
   * rendered when isConnected is false.
   * Requirement 10.8
   */
  const retryConnection = useCallback(() => {
    connect();
  }, [connect]);

  return { progress, message, paper, error, isConnected, retryConnection };
}

export default useAssignmentSocket;
