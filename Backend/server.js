import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import { setupWSConnection } from 'y-websocket/bin/utils';
import { WebSocketServer } from 'ws';

const app = express();

app.use(cors()); // Allow all origins for now

app.use(express.json());

const httpServer = createServer(app);

// In-memory store for document HTML (Simple Persistence)
const documents = new Map();

// GET /doc/:id → load content
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/doc/:id', (req, res) => {
  const { id } = req.params;
  const doc = documents.get(id) || { content: "", title: "Untitled Document" };
  res.json(doc);
});

// POST /doc/:id → save content
app.post('/doc/:id', (req, res) => {
  const { id } = req.params;
  const { content, title } = req.body;
  documents.set(id, { content, title });
  console.log(`Saved document ${id}: ${title}`);
  res.json({ success: true });
});

// Setup Y-Websocket Server on the same HTTP server
const wss = new WebSocketServer({ noServer: true });

wss.on('connection', (conn, req) => {
  setupWSConnection(conn, req, {
    gc: true,
  });
});

httpServer.on('upgrade', (request, socket, head) => {
  wss.handleUpgrade(request, socket, head, (ws) => {
    wss.emit('connection', ws, request);
  });
});

const PORT = process.env.PORT || 3002;
httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`Backend server running on port ${PORT}`);
});
