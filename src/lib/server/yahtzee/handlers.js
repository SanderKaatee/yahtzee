import { nanoid } from 'nanoid';
import db, {
  getRooms, getRoom, createRoom, updateRoom, deleteRoom,
  getPlayers, getPlayer, getPlayerBySocket, createPlayer,
  updatePlayer, removePlayer, disconnectPlayer
} from '../db.js';
import {
  createInitialGameState, createEmptyScorecard, rollDice,
  calculateScore, isGameOver, determineWinner, canScoreYahtzeeBonus
} from './logic.js';

// Generate short room codes like "ABC123"
function generateRoomCode() {
  return nanoid(6).toUpperCase();
}

// Broadcast room list to everyone in lobby
function broadcastRoomList(io) {
  const rooms = getRooms();
  io.emit('room-list', rooms);
}

// Get full room state for clients
function getRoomState(roomId) {
  const room = getRoom(roomId);
  if (!room) return null;

  const players = getPlayers(roomId).map(p => ({
    ...p,
    scorecard: JSON.parse(p.scorecard || '{}')
  }));

  const gameState = room.game_state ? JSON.parse(room.game_state) : null;

  return {
    ...room,
    players: players.filter(p => !p.is_spectator),
    spectators: players.filter(p => p.is_spectator),
    gameState
  };
}

// Broadcast room state to everyone in the room
function broadcastRoomState(io, roomId) {
  const state = getRoomState(roomId);
  if (state) {
    io.to(roomId).emit('room-state', state);
  }
}

export function registerYahtzeeHandlers(io, socket) {
  console.log(`[Yahtzee] Client connected: ${socket.id}`);

  // Get room list
  socket.on('get-rooms', () => {
    const rooms = getRooms();
    socket.emit('room-list', rooms);
  });

  // Create a new room
  socket.on('create-room', ({ playerName, roomName, turnTimer }) => {
    const roomId = generateRoomCode();
    const playerId = nanoid();

    try {
      createRoom(roomId, roomName || `${playerName}'s Game`, playerId, turnTimer || null);
      createPlayer(playerId, roomId, socket.id, playerName, false);

      // Make host
      updateRoom(roomId, { host_id: playerId });

      socket.join(roomId);
      socket.emit('room-created', { roomId, playerId });
      broadcastRoomState(io, roomId);
      broadcastRoomList(io);

      console.log(`[Yahtzee] Room created: ${roomId} by ${playerName}`);
    } catch (err) {
      console.error('[Yahtzee] Create room error:', err);
      socket.emit('error', { message: 'Failed to create room' });
    }
  });

  // Join an existing room
  socket.on('join-room', ({ roomId, playerName, asSpectator }) => {
    const room = getRoom(roomId);

    if (!room) {
      socket.emit('error', { message: 'Room not found' });
      return;
    }

    const players = getPlayers(roomId).filter(p => !p.is_spectator);

    // Can only join as player if game hasn't started
    if (!asSpectator && room.status !== 'waiting') {
      asSpectator = true; // Force spectator mode
    }

    // Check max players
    if (!asSpectator && players.length >= room.max_players) {
      socket.emit('error', { message: 'Room is full' });
      return;
    }

    try {
      const playerId = nanoid();
      createPlayer(playerId, roomId, socket.id, playerName, asSpectator);

      // Initialize scorecard if joining as player
      if (!asSpectator) {
        updatePlayer(playerId, { scorecard: JSON.stringify(createEmptyScorecard()) });
      }

      socket.join(roomId);
      socket.emit('room-joined', { roomId, playerId, isSpectator: asSpectator });
      broadcastRoomState(io, roomId);
      broadcastRoomList(io);

      console.log(`[Yahtzee] ${playerName} joined room ${roomId}${asSpectator ? ' as spectator' : ''}`);
    } catch (err) {
      console.error('[Yahtzee] Join room error:', err);
      socket.emit('error', { message: 'Failed to join room' });
    }
  });

  // Leave room
  socket.on('leave-room', ({ roomId, playerId }) => {
    const room = getRoom(roomId);
    const player = getPlayer(playerId);

    if (!room || !player) return;

    socket.leave(roomId);
    removePlayer(playerId);

    const remainingPlayers = getPlayers(roomId);

    // If no players left, delete room
    if (remainingPlayers.length === 0) {
      deleteRoom(roomId);
    }
    // If host left, assign new host
    else if (room.host_id === playerId) {
      const newHost = remainingPlayers.find(p => !p.is_spectator) || remainingPlayers[0];
      updateRoom(roomId, { host_id: newHost.id });
    }

    broadcastRoomState(io, roomId);
    broadcastRoomList(io);

    console.log(`[Yahtzee] Player ${player.name} left room ${roomId}`);
  });

  // Start game (host only)
  socket.on('start-game', ({ roomId, playerId }) => {
    const room = getRoom(roomId);

    if (!room || room.host_id !== playerId) {
      socket.emit('error', { message: 'Only the host can start the game' });
      return;
    }

    const players = getPlayers(roomId).filter(p => !p.is_spectator);

    if (players.length < 1) {
      socket.emit('error', { message: 'Need at least 1 player to start' });
      return;
    }

    // Initialize game state
    const gameState = createInitialGameState();
    gameState.turnStartTime = Date.now();

    // Initialize all scorecards
    players.forEach(p => {
      updatePlayer(p.id, { scorecard: JSON.stringify(createEmptyScorecard()) });
    });

    updateRoom(roomId, {
      status: 'playing',
      game_state: JSON.stringify(gameState)
    });

    broadcastRoomState(io, roomId);
    broadcastRoomList(io);

    console.log(`[Yahtzee] Game started in room ${roomId}`);
  });

  // Roll dice
  socket.on('roll-dice', ({ roomId, playerId }) => {
    const room = getRoom(roomId);
    if (!room || room.status !== 'playing') return;

    const gameState = JSON.parse(room.game_state);
    const players = getPlayers(roomId).filter(p => !p.is_spectator);
    const currentPlayer = players[gameState.currentPlayerIndex];

    if (!currentPlayer || currentPlayer.id !== playerId) {
      socket.emit('error', { message: "It's not your turn" });
      return;
    }

    if (gameState.rollsLeft <= 0) {
      socket.emit('error', { message: 'No rolls left' });
      return;
    }

    // Roll the dice
    gameState.dice = rollDice(gameState.dice, gameState.heldDice);
    gameState.rollsLeft--;
    gameState.isRolling = true;

    updateRoom(roomId, { game_state: JSON.stringify(gameState) });

    // Send rolling state immediately
    broadcastRoomState(io, roomId);

    // After animation, mark as not rolling
    setTimeout(() => {
      gameState.isRolling = false;
      updateRoom(roomId, { game_state: JSON.stringify(gameState) });
      broadcastRoomState(io, roomId);
    }, 500);
  });

  // Toggle held dice
  socket.on('toggle-hold', ({ roomId, playerId, dieIndex }) => {
    const room = getRoom(roomId);
    if (!room || room.status !== 'playing') return;

    const gameState = JSON.parse(room.game_state);
    const players = getPlayers(roomId).filter(p => !p.is_spectator);
    const currentPlayer = players[gameState.currentPlayerIndex];

    if (!currentPlayer || currentPlayer.id !== playerId) return;

    // Can only hold after first roll
    if (gameState.rollsLeft === 3) return;

    // Can't hold if no rolls left (must score)
    if (gameState.rollsLeft === 0) return;

    gameState.heldDice[dieIndex] = !gameState.heldDice[dieIndex];

    updateRoom(roomId, { game_state: JSON.stringify(gameState) });
    broadcastRoomState(io, roomId);
  });

  // Score a category
  socket.on('score-category', ({ roomId, playerId, category }) => {
    const room = getRoom(roomId);
    if (!room || room.status !== 'playing') return;

    const gameState = JSON.parse(room.game_state);
    const players = getPlayers(roomId).filter(p => !p.is_spectator);
    const currentPlayer = players[gameState.currentPlayerIndex];

    if (!currentPlayer || currentPlayer.id !== playerId) {
      socket.emit('error', { message: "It's not your turn" });
      return;
    }

    // Must roll at least once
    if (gameState.rollsLeft === 3) {
      socket.emit('error', { message: 'You must roll at least once' });
      return;
    }

    const scorecard = JSON.parse(currentPlayer.scorecard);

    // Check if category already scored
    if (scorecard[category] !== null) {
      socket.emit('error', { message: 'Category already scored' });
      return;
    }

    // Check for Yahtzee bonus
    if (canScoreYahtzeeBonus(gameState.dice, scorecard)) {
      scorecard.yahtzeeBonus = (scorecard.yahtzeeBonus || 0) + 100;
    }

    // Score the category
    scorecard[category] = calculateScore(gameState.dice, category);

    updatePlayer(playerId, { scorecard: JSON.stringify(scorecard) });

    // Check if game is over
    const updatedPlayers = getPlayers(roomId).filter(p => !p.is_spectator);
    if (isGameOver(updatedPlayers)) {
      const { winner, score } = determineWinner(updatedPlayers);
      gameState.winner = { id: winner.id, name: winner.name, score };

      updateRoom(roomId, {
        status: 'finished',
        game_state: JSON.stringify(gameState)
      });

      broadcastRoomState(io, roomId);
      broadcastRoomList(io);

      console.log(`[Yahtzee] Game finished in room ${roomId}. Winner: ${winner.name} with ${score} points`);
      return;
    }

    // Next player's turn
    gameState.currentPlayerIndex = (gameState.currentPlayerIndex + 1) % players.length;
    if (gameState.currentPlayerIndex === 0) {
      gameState.turnNumber++;
    }

    // Reset for next turn
    gameState.dice = [1, 1, 1, 1, 1];
    gameState.heldDice = [false, false, false, false, false];
    gameState.rollsLeft = 3;
    gameState.turnStartTime = Date.now();

    updateRoom(roomId, { game_state: JSON.stringify(gameState) });
    broadcastRoomState(io, roomId);
  });

  // Kick player (host only)
  socket.on('kick-player', ({ roomId, playerId, targetPlayerId }) => {
    const room = getRoom(roomId);
    if (!room || room.host_id !== playerId) return;
    if (playerId === targetPlayerId) return; // Can't kick yourself

    const target = getPlayer(targetPlayerId);
    if (!target) return;

    removePlayer(targetPlayerId);

    // Notify the kicked player
    io.to(roomId).emit('player-kicked', { playerId: targetPlayerId });

    broadcastRoomState(io, roomId);
    broadcastRoomList(io);
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    const player = getPlayerBySocket(socket.id);

    if (player) {
      disconnectPlayer(socket.id);

      if (player.room_id) {
        broadcastRoomState(io, player.room_id);
        broadcastRoomList(io);
      }
    }

    console.log(`[Yahtzee] Client disconnected: ${socket.id}`);
  });

  // Reconnect
  socket.on('reconnect-player', ({ playerId }) => {
    const player = getPlayer(playerId);

    if (player && player.room_id) {
      updatePlayer(playerId, { socket_id: socket.id, is_connected: 1 });
      socket.join(player.room_id);
      socket.emit('reconnected', { roomId: player.room_id, playerId });
      broadcastRoomState(io, player.room_id);

      console.log(`[Yahtzee] Player ${player.name} reconnected`);
    }
  });
}
