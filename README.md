# 🎲 Yahtzee Multiplayer

A real-time multiplayer Yahtzee game built with SvelteKit, Socket.io, and SQLite.

## Features

- **Real-time multiplayer** - Play with friends in real-time
- **No account needed** - Just pick a name and play
- **Room system** - Create rooms, share codes, join games
- **Spectator mode** - Watch games in progress
- **Optional turn timer** - Keep the game moving
- **Mobile-friendly** - Works great on phones
- **Persistent** - Games survive refreshes

## Tech Stack

- **Frontend**: SvelteKit 2 + Svelte 5 + Tailwind CSS
- **Backend**: Node.js + Socket.io
- **Database**: SQLite (better-sqlite3)
- **Deployment**: Docker + Caddy

## Local Development

```bash
# Install dependencies
npm install

# Start dev server (includes hot reload)
npm run dev

# In a separate terminal, you'll need the server running
# For development, you can use:
npm run build && npm start
```

Visit `http://localhost:5173/yahtzee`

## Production Deployment

### 1. Clone to your server

```bash
cd /srv/apps
git clone git@github.com:YOUR_USERNAME/yahtzee.git
cd yahtzee
```

### 2. Build and start with Docker

```bash
docker compose up -d
```

### 3. Configure Caddy

Add the following to your `/etc/caddy/Caddyfile` inside your `sanderkaatee.nl` block:

```caddyfile
# Yahtzee WebSocket connections  
@yahtzee_socketio {
    path /yahtzee/socket.io/*
}
reverse_proxy @yahtzee_socketio localhost:3001 {
    transport http {
        read_timeout 0
        write_timeout 0
    }
    header_up Host {host}
    header_up X-Real-IP {remote_host}
    header_up X-Forwarded-For {remote_host}
    header_up X-Forwarded-Proto {scheme}
    header_up Connection {>Connection}
    header_up Upgrade {>Upgrade}
}

# Yahtzee pages
@yahtzee {
    path /yahtzee*
}
reverse_proxy @yahtzee localhost:3001
```

### 4. Reload Caddy

```bash
sudo caddy validate --config /etc/caddy/Caddyfile
sudo systemctl reload caddy
```

### 5. View logs

```bash
docker compose logs -f yahtzee
```

## Updating

```bash
cd /srv/apps/yahtzee
git pull
docker compose build
docker compose up -d
```

## Project Structure

```
yahtzee/
├── src/
│   ├── lib/
│   │   ├── components/     # Svelte components
│   │   ├── server/         # Server-side code
│   │   │   ├── db.js       # SQLite setup
│   │   │   └── yahtzee/    # Game logic + socket handlers
│   │   ├── stores/         # Svelte stores
│   │   └── utils/          # Shared utilities
│   └── routes/
│       └── yahtzee/        # SvelteKit pages
├── server.js               # Custom server with Socket.io
├── Dockerfile
└── docker-compose.yml
```

## Game Rules

Standard Yahtzee rules apply:
- Roll 5 dice up to 3 times per turn
- Hold dice between rolls
- Score in one category per turn
- 13 rounds total
- Upper section bonus: 35 points if sum ≥ 63
- Yahtzee bonus: +100 for additional Yahtzees

## Extending for Other Games

This project is designed to be extensible. To add another game:

1. Create a new namespace in `server.js`:
   ```javascript
   const newGame = io.of('/new-game');
   newGame.on('connection', (socket) => {
     registerNewGameHandlers(newGame, socket);
   });
   ```

2. Add handlers in `src/lib/server/new-game/`

3. Add routes in `src/routes/new-game/`

The SQLite database and socket infrastructure are already in place!
