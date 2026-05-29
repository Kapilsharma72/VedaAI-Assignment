import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import env from '../config/env';

let io: SocketIOServer;

function resolveAssignmentId(payload: unknown): string | null {
  if (typeof payload === 'string' && payload.trim()) {
    return payload.trim();
  }
  if (
    payload &&
    typeof payload === 'object' &&
    'assignmentId' in payload &&
    typeof (payload as { assignmentId: unknown }).assignmentId === 'string'
  ) {
    return (payload as { assignmentId: string }).assignmentId.trim();
  }
  return null;
}

export function initSockets(httpServer: http.Server): SocketIOServer {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: env.FRONTEND_URL,
      credentials: true,
    },
  });

  io.on('connection', (socket) => {
    socket.on('join:assignment', (payload: unknown) => {
      const assignmentId = resolveAssignmentId(payload);
      if (assignmentId) {
        socket.join(`assignment:${assignmentId}`);
      }
    });
  });

  return io;
}

export function getIO(): SocketIOServer {
  if (!io) {
    throw new Error('Socket.io has not been initialised. Call initSockets() first.');
  }
  return io;
}

export { io };
