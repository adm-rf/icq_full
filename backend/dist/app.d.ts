import { Express } from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
export interface AppComponents {
    app: Express;
    httpServer: http.Server;
    io: SocketIOServer;
}
export declare function initializeApp(): Promise<AppComponents>;
export default initializeApp;
//# sourceMappingURL=app.d.ts.map