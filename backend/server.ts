import WebSocket from 'ws';
import * as http from 'http';
import * as path from 'path';
import * as fs from 'fs';
import { handleCommand } from './handlers/commandHandler';
import { handleFile } from './handlers/fileHandler';
import { handleBuild } from './handlers/buildHandler';

const PORT = parseInt(process.env.GENIX_BACKEND_PORT || '18080', 10);

const server = http.createServer();
const wss = new WebSocket.Server({ server });

interface WebSocketMessage {
  type: 'command' | 'file' | 'build';
  action: string;
  path?: string;
  content?: string;
  file?: string;
}

wss.on('connection', (ws: WebSocket) => {
  console.log('Client connected');

  ws.on('message', async (message: string) => {
    try {
      const data: WebSocketMessage = JSON.parse(message);
      let response: any;

      switch (data.type) {
        case 'command':
          response = await handleCommand(data as any);
          break;
        case 'file':
          response = await handleFile(data as any);
          break;
        case 'build':
          response = await handleBuild(data as any);
          break;
        default:
          response = { type: 'error', message: 'Unknown message type' };
      }

      ws.send(JSON.stringify(response));
    } catch (error) {
      ws.send(
        JSON.stringify({
          type: 'error',
          message: error instanceof Error ? error.message : 'Unknown error',
        })
      );
    }
  });

  ws.on('close', () => {
    console.log('Client disconnected');
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
});

server.listen(PORT, () => {
  console.log(`WebSocket server listening on port ${PORT}`);
});

const possibleGenixBotPaths = [
  path.resolve(__dirname, 'genixbot.js'),
  path.resolve(__dirname, '../../backend/genixbot.js'),
];

const genixBotEntry = possibleGenixBotPaths.find((candidatePath) =>
  fs.existsSync(candidatePath)
);

if (genixBotEntry) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    require(genixBotEntry);
  } catch (error) {
    console.warn('Failed to start GenixBot module:', error);
  }
} else {
  console.warn('GenixBot module not found; /genix/ai endpoint is unavailable.');
}

