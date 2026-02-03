import { createServer } from 'http';
import { Server } from 'socket.io';
import { handler } from './build/handler.js';
import { registerYahtzeeHandlers } from './src/lib/server/yahtzee/handlers.js';
import express from 'express';

const app = express();
const server = createServer(app);

const io = new Server(server, {
  path: '/yahtzee/socket.io/',
  cors: {
    origin: process.env.NODE_ENV === 'production'
      ? ['https://sanderkaatee.nl']
      : ['http://localhost:5173', 'http://localhost:3000'],
    methods: ['GET', 'POST']
  },
  pingTimeout: 60000,
  pingInterval: 25000
});

// Yahtzee namespace
const yahtzee = io.of('/yahtzee');
yahtzee.on('connection', (socket) => {
  registerYahtzeeHandlers(yahtzee, socket);
});

// SvelteKit handles everything else
app.use(handler);

const port = process.env.PORT || 3000;
server.listen(port, () => {
  console.log(`Server running on port ${port}`);
  console.log(`Socket.io ready on /yahtzee namespace`);
});