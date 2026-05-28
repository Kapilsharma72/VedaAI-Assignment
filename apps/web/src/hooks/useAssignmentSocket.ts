'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import type { IGeneratedPaper, WsProgressPayload, WsCompletePayload, WsFailedPayload } from '@vedaai/shared';
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
export function useAssignmentSocket(assignmentId: string): UseAssignmentSocketReturn {
    const [progress, setProgress] = useState<number>(0);
    const [message, setMessage] = useState<string>('');
    const [paper, setPaper] = useState<IGeneratedPaper | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isConnected, setIsConnected] = useState<boolean>(false);
    const updateAssignment = useAssignmentsStore((state) => state.updateAssignment);
    const socketRef = useRef<Socket | null>(null);
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
            reconnection: false,
        });
        socketRef.current = socket;
        socket.on('connect', () => {
            setIsConnected(true);
            setError(null);
            socket.emit('join:assignment', assignmentId);
            api.get<{
                status: string;
                _id: string;
            }>(`/api/assignments/${assignmentId}`)
                .then(async (assignment) => {
                const a = assignment as unknown as {
                    status: string;
                    _id: string;
                };
                if (a.status === 'completed') {
                    try {
                        const fetchedPaper = await api.get<IGeneratedPaper>(`/api/assignments/${assignmentId}/paper`);
                        setPaper(fetchedPaper as unknown as IGeneratedPaper);
                        updateAssignment(assignmentId, { status: 'completed' });
                        setProgress(100);
                    }
                    catch {
                        setError('Paper could not be loaded. Please refresh.');
                    }
                }
                else if (a.status === 'failed') {
                    setError('Question paper generation failed. Please retry.');
                    setProgress(0);
                    updateAssignment(assignmentId, { status: 'failed' });
                }
            })
                .catch(() => {
            });
        });
        socket.on('disconnect', () => {
            setIsConnected(false);
        });
        socket.on('connect_error', () => {
            setIsConnected(false);
            setError('Unable to connect to the server. Check your connection and click "Retry Connection".');
        });
        socket.on('job:progress', (payload: WsProgressPayload) => {
            setProgress(payload.progress);
            setMessage(payload.message);
            setError(null);
        });
        socket.on('job:complete', async (payload: WsCompletePayload) => {
            try {
                const fetchedPaper = await api.get<IGeneratedPaper>(`/api/assignments/${payload.assignmentId}/paper`);
                setPaper(fetchedPaper as unknown as IGeneratedPaper);
                updateAssignment(payload.assignmentId, { status: 'completed' });
                setProgress(100);
            }
            catch {
                setError('Generation completed but the paper could not be loaded. Please refresh.');
            }
        });
        socket.on('job:failed', (payload: WsFailedPayload) => {
            setError(payload.message ?? 'Question paper generation failed. Please try again.');
            setProgress(0);
            updateAssignment(assignmentId, { status: 'failed' });
        });
    }, [assignmentId, updateAssignment]);
    useEffect(() => {
        connect();
        return () => {
            socketRef.current?.disconnect();
            socketRef.current = null;
        };
    }, [connect]);
    const retryConnection = useCallback(() => {
        connect();
    }, [connect]);
    return { progress, message, paper, error, isConnected, retryConnection };
}
export default useAssignmentSocket;
