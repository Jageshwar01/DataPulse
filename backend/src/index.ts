import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import dotenv from 'dotenv';
import { apiRouter } from './api';
import { initWebSocketServer } from './ws/server';
import { startPollingEngine } from './engine/poller';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use('/api', apiRouter);

const server = createServer(app);

initWebSocketServer(server);

server.listen(port, () => {
  console.log(`Server listening on port ${port}`);
  startPollingEngine().then(() => {
    console.log('Polling engine started');
  }).catch((err) => {
    console.error('Failed to start polling engine', err);
  });
});
