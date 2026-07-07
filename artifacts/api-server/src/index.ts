import { createServer } from "node:http";
import { Server as SocketIOServer } from "socket.io";
import app from "./app";
import { logger } from "./lib/logger";

const rawPort = process.env["PORT"];
if (!rawPort) throw new Error("PORT environment variable is required but was not provided.");
const port = Number(rawPort);
if (Number.isNaN(port) || port <= 0) throw new Error(`Invalid PORT value: "${rawPort}"`);

const httpServer = createServer(app);

const io = new SocketIOServer(httpServer, {
  cors: { origin: "*", methods: ["GET", "POST"] },
  path: "/api/socket.io",
});

// Track online players
const onlinePlayers: Map<string, { playerId: string; username: string; district: string; x: number; z: number }> = new Map();

io.on("connection", (socket) => {
  logger.info({ socketId: socket.id }, "Player connected");

  socket.on("player:join", (data: { playerId: string; username: string; district: string }) => {
    onlinePlayers.set(socket.id, { ...data, x: 0, z: 0 });
    socket.broadcast.emit("player:joined", { socketId: socket.id, ...data });
    // Send current online players to the new player
    socket.emit("players:online", Array.from(onlinePlayers.entries()).map(([sid, p]) => ({ socketId: sid, ...p })));
    logger.info({ playerId: data.playerId }, "Player joined world");
  });

  socket.on("player:move", (data: { x: number; z: number; district: string }) => {
    const player = onlinePlayers.get(socket.id);
    if (player) {
      player.x = data.x;
      player.z = data.z;
      player.district = data.district;
      socket.broadcast.emit("player:moved", { socketId: socket.id, ...data });
    }
  });

  socket.on("player:action", (data: { type: string; payload: unknown }) => {
    socket.broadcast.emit("player:action", { socketId: socket.id, ...data });
  });

  socket.on("chat:message", (data: { message: string; username: string }) => {
    io.emit("chat:message", { socketId: socket.id, timestamp: Date.now(), ...data });
  });

  socket.on("disconnect", () => {
    const player = onlinePlayers.get(socket.id);
    if (player) {
      socket.broadcast.emit("player:left", { socketId: socket.id, playerId: player.playerId });
      onlinePlayers.delete(socket.id);
    }
    logger.info({ socketId: socket.id }, "Player disconnected");
  });
});

httpServer.listen(port, (err?: Error) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }
  logger.info({ port }, "Constantine Mafia server listening");
});
