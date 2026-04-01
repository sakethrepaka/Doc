import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

const httpServer = createServer(app);

// In-memory store for document HTML (Option A: Simple Persistence)
const documents = new Map();

// GET /doc/:id → load content
app.get('/doc/:id', (req, res) => {
  const { id } = req.params;
  const content = documents.get(id) || "";
  res.json({ content });
});

// POST /doc/:id → save content
app.post('/doc/:id', (req, res) => {
  const { id } = req.params;
  const { content } = req.body;
  documents.set(id, content);
  console.log(`Saved document ${id}`);
  res.json({ success: true });
});

const PORT = 3002;
httpServer.listen(PORT, () => {
  console.log(`Persistence API running on http://localhost:${PORT}`);
});
