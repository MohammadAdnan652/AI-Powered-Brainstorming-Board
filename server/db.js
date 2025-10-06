const Database = require('better-sqlite3');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const db = new Database(path.join(__dirname, '..', 'data.sqlite'));

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE
);
CREATE TABLE IF NOT EXISTS boards (
  userId TEXT PRIMARY KEY,
  board TEXT
);
`);

function getOrCreateUser(username) {
  const row = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
  if (row) return row;
  const id = uuidv4();
  db.prepare('INSERT INTO users(id, username) VALUES(?, ?)').run(id, username);
  return { id, username };
}

function saveBoard(userId, board) {
  const s = JSON.stringify(board);
  const existing = db.prepare('SELECT userId FROM boards WHERE userId = ?').get(userId);
  if (existing) {
    db.prepare('UPDATE boards SET board = ? WHERE userId = ?').run(s, userId);
  } else {
    db.prepare('INSERT INTO boards(userId, board) VALUES(?, ?)').run(userId, s);
  }
}

function getBoard(userId) {
  const row = db.prepare('SELECT board FROM boards WHERE userId = ?').get(userId);
  if (!row) return null;
  return JSON.parse(row.board);
}

module.exports = { getOrCreateUser, saveBoard, getBoard };
