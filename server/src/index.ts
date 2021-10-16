import * as dotenv from "dotenv";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import Redis from 'ioredis';
import { createServer } from "http";
import { Server } from "socket.io";
import { RedisSessionStorage, Session } from "./sessionStore";
import { nanoid } from "nanoid";
import { RoomManager } from "./roomManager";


dotenv.config();

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    'origin': '*'
  }
});

const redis = new Redis();

const sessionStore = new RedisSessionStorage(redis);

const roomManager = new RoomManager(redis);

redis.on("room:created", async (data) => {
  const room = data.roomId;
  const session1 = await sessionStore.findSession(data.player1);
  const session2 = await sessionStore.findSession(data.player2);

  const sockets = (await io.fetchSockets()).filter(sock => sock.id == session1?.userId || sock.id == session2?.userId);
  for (const sock of sockets) {
    sock.join(room)
  }
  console.log("room joined", room);

  io.to(room).emit('room:created', data);
})

io.use(async (socket, next) => {
  const username = socket.handshake.auth.username;
  const sessionId = socket.handshake.auth.sessionId;
  const session = await sessionStore.findSession(sessionId);

  if (session) {
    socket.sessionId = session.sessionId;
    socket.username = session.username;
    socket.userId = session.userId;
    return next();
  }
  if (!username) {
    return next(new Error("invalid username"));
  }
  socket.sessionId = nanoid(16);
  socket.username = username;
  next();
});

io.on("connection", (socket) => {
  console.log("user connected with", socket.id);

  socket.on('disconnect', () => {
    console.log("disconendte");

  })

  sessionStore.saveSession({ sessionId: socket.sessionId, username: socket.username, userId: socket.id, connected: true })
  socket.emit("session", { sessionId: socket.sessionId, userId: socket.id });

  socket.on('disconnecting', async () => {
    console.log("discoonet");

    const session = await sessionStore.findSession(socket.sessionId);
    console.log(session);
    roomManager.findRoom(session?.sessionId || '');
    if (session) {
      session.connected = false;
      sessionStore.saveSession(session);
      roomManager.removePlayer(session.sessionId);

      const room = await roomManager.findRoom(session.sessionId);
      console.log("rroms ", room, session.userId);

      if (room) {
        console.log("room", room.roomId);

        io.to(room.roomId).emit('room:userleft', "user left")
      }

    }
  })

  roomManager.addPlayer(socket.sessionId);
  //   socket.on("button pressed", (data) => {
  //     console.log("room-message", data);
  //     io.to(data["room"]).emit("option selected", { value: data["value"], socketId: socket.id });
  //   });

  //   socket.on("game:move", async (data) => {
  //     console.log(data);
  //     console.log("val", val);
  //     io.to(data["room"]).emit("game:turn", { nextTurn: data["opponent"] });
  //     io.to(data["room"]).emit("game:move", { from: socket.id, value: data.value });
  //   });

  //   socket.on("disconnect", async () => {
  //     const room = rooms.find((room) => room.isPlayerPresent(socket.id));
  //     const sockets = await io.in(room.roomId).fetchSockets();
  //     console.log(sockets.length);
  //     for (sock of sockets) {
  //       sock.leave(room.roomId);
  //       console.log(sock.id);
  //       sock.emit("room leave");
  //     }

  //     console.log("user disconneted");
  //   });

  //   waitingQueue.push(socket);
  //   if (waitingQueue.length == 2) {
  //     const room = new Room();
  //     const socket1 = waitingQueue.shift();
  //     const socket2 = waitingQueue.shift();
  //     room.addPlayer({ username: socket1.username, socketId: socket1.id });
  //     room.addPlayer({ username: socket2.username, socketId: socket2.id });
  //     socket1.join(room.roomId);
  //     socket2.join(room.roomId);
  //     io.to(room.roomId).emit("room connected", room);
  //     waitingQueue = [];
  //     rooms.push(room);
  //     console.log(room);
  //     roomId++;
  //   }
});

httpServer.listen(3000, () => {
  console.log("Server listening on Port 3000");
});
