import { io } from 'socket.io-client';
import { browser } from '$app/environment';
import { room, connected, error } from '$lib/stores/game.js';
import { player } from '$lib/stores/player.js';
import { goto } from '$app/navigation';

let socket = null;

export function getSocket() {
  if (!browser) return null;

  if (!socket) {
    // Connect to the same host, /yahtzee namespace
    const url = import.meta.env.DEV
      ? 'http://localhost:3000/yahtzee'
      : '/yahtzee';

    socket = io(url, {
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000
    });

    // Connection events
    socket.on('connect', () => {
      console.log('Connected to Yahtzee server');
      connected.set(true);

      // Try to reconnect to existing game
      const storedPlayer = localStorage.getItem('yahtzee_player');
      if (storedPlayer) {
        const { id } = JSON.parse(storedPlayer);
        if (id) {
          socket.emit('reconnect-player', { playerId: id });
        }
      }
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from Yahtzee server');
      connected.set(false);
    });

    socket.on('connect_error', (err) => {
      console.error('Connection error:', err);
      error.set('Failed to connect to server');
    });

    // Game events
    socket.on('room-list', (rooms) => {
      // Handled by lobby component directly
    });

    socket.on('room-created', ({ roomId, playerId }) => {
      player.setId(playerId);
      goto(`/yahtzee/room/${roomId}`);
    });

    socket.on('room-joined', ({ roomId, playerId, isSpectator }) => {
      player.setId(playerId);
      goto(`/yahtzee/room/${roomId}`);
    });

    socket.on('room-state', (state) => {
      room.set(state);
    });

    socket.on('reconnected', ({ roomId, playerId }) => {
      console.log('Reconnected to room:', roomId);
      goto(`/yahtzee/room/${roomId}`);
    });

    socket.on('player-kicked', ({ playerId }) => {
      let currentPlayerId;
      player.subscribe(p => currentPlayerId = p.id)();

      if (playerId === currentPlayerId) {
        player.setId(null);
        room.set(null);
        error.set('You have been kicked from the room');
        goto('/yahtzee/lobby');
      }
    });

    socket.on('error', ({ message }) => {
      error.set(message);
    });
  }

  return socket;
}

export function connectSocket() {
  const s = getSocket();
  if (s && !s.connected) {
    s.connect();
  }
  return s;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}