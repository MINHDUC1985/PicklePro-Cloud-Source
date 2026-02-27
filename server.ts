
import express from "express";
import { createServer as createViteServer } from "vite";
import { WebSocketServer, WebSocket } from "ws";
import { createServer } from "http";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function startServer(forcePort?: number): Promise<number> {
  const app = express();
  const server = createServer(app);
  const wss = new WebSocketServer({ server });
  const isProd = process.env.NODE_ENV === "production" || process.env.APP_ROOT || __dirname.includes('dist-electron') || __dirname.includes('app.asar');
  const envPort = process.env.PORT ? parseInt(process.env.PORT, 10) : undefined;
  const PORT = forcePort !== undefined ? forcePort : (envPort || (isProd ? 0 : 3000));
  const HOST = process.env.PORT || process.env.RENDER ? "0.0.0.0" : "127.0.0.1";

  app.use(express.json());

  // In-memory storage for tournament data
  let tournaments: any[] = [];
  let players: any[] = [];
  let users: any[] = [
    { id: '1', username: 'admin', password: '123', role: 'admin' },
    { id: '2', username: 'viewer', password: '123', role: 'viewer' }
  ];

  // API routes
  app.get("/api/tournament", (req, res) => {
    res.json(tournaments);
  });

  app.post("/api/tournament", (req, res) => {
    const updatedTournaments = req.body;
    if (Array.isArray(updatedTournaments)) {
      tournaments = updatedTournaments;
      // Broadcast to all connected clients
      const message = JSON.stringify({ type: 'UPDATE_TOURNAMENTS', data: tournaments });
      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(message);
        }
      });
      res.json({ status: "ok" });
    } else {
      res.status(400).json({ error: "Invalid data format" });
    }
  });

  // Player routes
  app.get("/api/players", (req, res) => {
    res.json(players);
  });

  app.post("/api/players", (req, res) => {
    players = req.body;
    const message = JSON.stringify({ type: 'UPDATE_PLAYERS', data: players });
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
    res.json({ status: "ok" });
  });

  // User routes
  app.get("/api/users", (req, res) => {
    res.json(users);
  });

  app.post("/api/users", (req, res) => {
    users = req.body;
    // Broadcast to all connected clients
    const message = JSON.stringify({ type: 'UPDATE_USERS', data: users });
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
    res.json({ status: "ok" });
  });

  app.post("/api/login", (req, res) => {
    const { username, password } = req.body;
    const user = users.find(u => u.username === username && u.password === password);
    if (user) {
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } else {
      res.status(401).json({ error: "Invalid credentials" });
    }
  });

  // WebSocket handling
  wss.on('connection', (ws) => {
    console.log('Client connected');
    // Send current data on connection
    ws.send(JSON.stringify({ type: 'INIT', data: { tournaments, users, players } }));

    ws.on('close', () => console.log('Client disconnected'));
  });

  if (isProd) {
    const isCompiled = __dirname.includes('dist-electron') || __dirname.includes('app.asar');
    const staticPath = isCompiled ? path.join(__dirname, '../dist') : path.join(__dirname, 'dist');
    app.use(express.static(staticPath));
    app.use((req, res, next) => {
      if (!req.path.startsWith('/api')) {
        res.sendFile(path.join(staticPath, 'index.html'));
      } else {
        next();
      }
    });
  } else {
    // Vite middleware for development
    try {
      const vite = await import('vite').then((m) => m.createServer({
        server: { middlewareMode: true },
        appType: "spa",
      }));
      app.use(vite.middlewares);
    } catch (e) {
      console.error("Failed to load vite dev server:", e);
    }
  }

  return new Promise((resolve, reject) => {
    const serverInstance = server.listen(PORT, HOST, () => {
      const actualPort = (serverInstance.address() as import('net').AddressInfo).port;
      console.log(`Server running on http://${HOST}:${actualPort}`);
      resolve(actualPort);
    });
    serverInstance.on('error', reject);
  });
}

// Call startServer if it's the main module (tsx)
if (process.argv[1] && process.argv[1].endsWith('server.ts')) {
  startServer(3000);
}
