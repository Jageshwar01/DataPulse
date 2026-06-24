import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';

let wss: WebSocketServer;

export function initWebSocketServer(server: Server) {
  wss = new WebSocketServer({ server });

  wss.on('connection', (ws) => {
    console.log('Client connected to WebSocket');
    
    ws.on('close', () => {
      console.log('Client disconnected from WebSocket');
    });
  });

  console.log('WebSocket server initialized');
}

export function broadcastMonitorUpdate(monitorId: number, checkResult: any, incident: any | null = null) {
  if (!wss) return;

  const payload = JSON.stringify({
    type: 'MONITOR_UPDATE',
    data: {
      monitorId,
      checkResult,
      incident
    }
  });

  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  });
}
