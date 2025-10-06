const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const db = require('./db');
const ai = require('./ai');

// CORS configuration
const corsOptions = {
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

const app = express();
app.use(cors(corsOptions));
app.use(bodyParser.json({ limit: '1mb' }));

// static frontend
app.use('/', express.static(path.join(__dirname, '..', 'public')));

// simple auth: username -> userId
app.post('/api/auth/login', async (req, res) => {
  const { username } = req.body;
  if (!username) return res.status(400).json({ error: 'username required' });
  try {
    const user = db.getOrCreateUser(username);
    res.json({ userId: user.id, username: user.username });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'internal' });
  }
});

app.get('/api/board', async (req, res) => {
  const userId = req.query.userId;
  if (!userId) return res.status(400).json({ error: 'userId required' });
  try {
    const board = db.getBoard(userId) || { columns: [
      { id: 'col-1', title: 'To Do', cards: [] },
      { id: 'col-2', title: 'In Progress', cards: [] },
      { id: 'col-3', title: 'Done', cards: [] }
    ] };
    res.json(board);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'internal' });
  }
});

app.post('/api/board', async (req, res) => {
  const { userId, board } = req.body;
  if (!userId || !board) return res.status(400).json({ error: 'userId and board required' });
  try {
    db.saveBoard(userId, board);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'internal' });
  }
});

app.post('/api/suggest', async (req, res) => {
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: 'text required' });
  try {
    const suggestions = await ai.suggestIdeas(text);
    if (!Array.isArray(suggestions) || suggestions.length === 0) {
      throw new Error('Invalid suggestions format');
    }
    res.json({ suggestions });
  } catch (err) {
    console.error('Suggestion error:', err);
    // Return a 200 with fallback suggestions instead of error
    res.json({ 
      suggestions: [
        'Consider different approaches',
        'Analyze potential improvements',
        'Research similar solutions'
      ]
    });
  }
});

app.post('/api/cluster', async (req, res) => {
  const { cards } = req.body;
  if (!cards || !Array.isArray(cards)) return res.status(400).json({ error: 'cards array required' });
  try {
    const clusters = await ai.cluster(cards);
    res.json({ clusters });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'internal' });
  }
});

app.post('/api/summarize', async (req, res) => {
  const { board } = req.body;
  if (!board) return res.status(400).json({ error: 'board required' });
  try {
    const summary = await ai.summarize(board);
    res.json({ summary });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'internal' });
  }
});

// mood analysis
app.post('/api/mood', async (req, res) => {
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: 'text required' });
  try {
    const mood = await ai.mood(text);
    res.json({ mood });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'internal' });
  }
});

// search within board using embeddings
app.post('/api/search', async (req, res) => {
  const { query, cards } = req.body;
  if (!query || !cards) return res.status(400).json({ error: 'query and cards required' });
  try {
    const results = await ai.search(query, cards);
    res.json({ results });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'internal' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
