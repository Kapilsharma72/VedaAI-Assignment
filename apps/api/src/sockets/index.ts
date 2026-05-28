import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import env from '../config/env';
let io: SocketIOServer;
export function initSockets(httpServer: http.Server): SocketIOServer {
    io = new SocketIOServer(httpServer, {
        cors: {
            origin: env.FRONTEND_URL,
            credentials: true,
        },
    });
    io.on('connection', (socket) => {
        socket.on('join:assignment', ({ assignmentId }: {
            assignmentId: string;
        }) => {
            socket.join(`assignment:${assignmentId}`);
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
