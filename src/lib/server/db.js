import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Use /app/data in Docker, ./data locally
const dataDir = process.env.NODE_ENV === 'production' 
  ? '/app/data' 
  : join(__dirname, '../../../../data');

if (!existsSync(dataDir)) {
  mkdirSync(dataDir, { recursive: true });
}

const dbPath = join(dataDir, 'yahtzee.db');
const db = new Database(dbPath);

// Enable WAL mode for better concurrent access
db.pragma('journal_mode = WAL');

// Initialize schema
db.exec(`
  CREATE TABLE IF NOT EXISTS rooms (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    host_id TEXT NOT NULL,
    status TEXT DEFAULT 'waiting' CHECK(status IN ('waiting', 'playing', 'finished')),
    max_players INTEGER DEFAULT 8,
    turn_timer INTEGER,
    current_player_index INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    game_state TEXT
  );

  CREATE TABLE IF NOT EXISTS players (
    id TEXT PRIMARY KEY,
    room_id TEXT,
    socket_id TEXT,
    name TEXT NOT NULL,
    is_spectator INTEGER DEFAULT 0,
    is_connected INTEGER DEFAULT 1,
    turn_order INTEGER,
    scorecard TEXT DEFAULT '{}',
    joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_players_room ON players(room_id);
  CREATE INDEX IF NOT EXISTS idx_players_socket ON players(socket_id);
  CREATE INDEX IF NOT EXISTS idx_rooms_status ON rooms(status);
`);

export default db;

// Helper functions
export function getRooms() {
  return db.prepare(`
    SELECT r.*, 
           COUNT(CASE WHEN p.is_spectator = 0 THEN 1 END) as player_count,
           COUNT(CASE WHEN p.is_spectator = 1 THEN 1 END) as spectator_count
    FROM rooms r
    LEFT JOIN players p ON r.id = p.room_id AND p.is_connected = 1
    WHERE r.status != 'finished' OR r.updated_at > datetime('now', '-1 hour')
    GROUP BY r.id
    ORDER BY r.created_at DESC
  `).all();
}

export function getRoom(roomId) {
  return db.prepare('SELECT * FROM rooms WHERE id = ?').get(roomId);
}

export function createRoom(id, name, hostId, turnTimer = null) {
  return db.prepare(`
    INSERT INTO rooms (id, name, host_id, turn_timer)
    VALUES (?, ?, ?, ?)
  `).run(id, name, hostId, turnTimer);
}

export function updateRoom(roomId, updates) {
  const fields = Object.keys(updates).map(k => `${k} = ?`).join(', ');
  const values = [...Object.values(updates), roomId];
  return db.prepare(`
    UPDATE rooms SET ${fields}, updated_at = CURRENT_TIMESTAMP WHERE id = ?
  `).run(...values);
}

export function deleteRoom(roomId) {
  return db.prepare('DELETE FROM rooms WHERE id = ?').run(roomId);
}

export function getPlayers(roomId) {
  return db.prepare(`
    SELECT * FROM players 
    WHERE room_id = ? 
    ORDER BY turn_order ASC, joined_at ASC
  `).all(roomId);
}

export function getPlayer(playerId) {
  return db.prepare('SELECT * FROM players WHERE id = ?').get(playerId);
}

export function getPlayerBySocket(socketId) {
  return db.prepare('SELECT * FROM players WHERE socket_id = ?').get(socketId);
}

export function createPlayer(id, roomId, socketId, name, isSpectator = false) {
  const turnOrder = isSpectator ? null : db.prepare(
    'SELECT COALESCE(MAX(turn_order), -1) + 1 FROM players WHERE room_id = ? AND is_spectator = 0'
  ).pluck().get(roomId);
  
  return db.prepare(`
    INSERT INTO players (id, room_id, socket_id, name, is_spectator, turn_order)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(id, roomId, socketId, name, isSpectator ? 1 : 0, turnOrder);
}

export function updatePlayer(playerId, updates) {
  const fields = Object.keys(updates).map(k => `${k} = ?`).join(', ');
  const values = [...Object.values(updates), playerId];
  return db.prepare(`UPDATE players SET ${fields} WHERE id = ?`).run(...values);
}

export function removePlayer(playerId) {
  return db.prepare('DELETE FROM players WHERE id = ?').run(playerId);
}

export function disconnectPlayer(socketId) {
  return db.prepare('UPDATE players SET is_connected = 0 WHERE socket_id = ?').run(socketId);
}

export function reconnectPlayer(playerId, socketId) {
  return db.prepare('UPDATE players SET is_connected = 1, socket_id = ? WHERE id = ?').run(socketId, playerId);
}
