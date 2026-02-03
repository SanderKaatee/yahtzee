import { writable, derived } from 'svelte/store';

// Current room state from server
export const room = writable(null);

// Socket connection state
export const connected = writable(false);

// Derived stores for convenience
export const gameState = derived(room, $room => $room?.gameState || null);
export const players = derived(room, $room => $room?.players || []);
export const spectators = derived(room, $room => $room?.spectators || []);
export const isPlaying = derived(room, $room => $room?.status === 'playing');
export const isWaiting = derived(room, $room => $room?.status === 'waiting');
export const isFinished = derived(room, $room => $room?.status === 'finished');

// Error messages
export const error = writable(null);

// Auto-clear errors after 5 seconds
error.subscribe(value => {
  if (value) {
    setTimeout(() => error.set(null), 5000);
  }
});
