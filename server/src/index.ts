import * as dotenv from "dotenv";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import Redis from 'ioredis';
import { createServer } from "http";
import { Server, Socket } from "socket.io";
import { format, transports, createLogger } from 'winston'
import { RedisSessionStorage, Session } from "./sessionStore";
import { nanoid } from "nanoid";
import { Room, RoomManager } from "./roomManager";
import { log } from "console";
import { GameService } from "./gameService";

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

const gameService = new GameService(redis);

const loggerFormat = format.combine(
  format.printf((info) => {
    return `[${info.level.toUpperCase()}]: ${info.message}`
  }),
  format.prettyPrint(),
  format.colorize({
    all: true,
  })
)

const logger = createLogger({
  level: 'info',
  format: loggerFormat,
  transports: [
    new transports.Console()
  ]
})

redis.on("room:created", async (data) => {

  const session1 = await sessionStore.findSession(data.player1);
  const session2 = await sessionStore.findSession(data.player2);

  if (session1 == null || session2 == null) {
    throw Error('Session not found');
  }

  const sockets = (await io.fetchSockets()).filter(sock => sock.id == session1?.userId || sock.id == session2?.userId);

  for (const sock of sockets) {
    sock.join(data.roomId)
  }
  const room: Room = {
    roomId: data.roomId,
    player1: {
      userId: session1.sessionId,
      username: session1.username,
      marker: '0',
    },
    player2: {
      userId: session2.sessionId,
      username: session2.username,
      marker: '1',
    },
    firstToStart: session1.sessionId
  }
  await gameService.startNewGame(room.roomId, session1.sessionId, session2.sessionId)
  io.to(room.roomId).emit('room:created', room);
})

redis.on('game:winner', (winner: string) => {
  if (winner) {
  }

})

io.use(async (socket, next) => {
  const username = socket.handshake.auth.username;
  const sessionId = socket.handshake.auth.sessionId;
  const session = await sessionStore.findSession(sessionId);

  console.log("sessionId ", sessionId,);

  if (session) {
    console.log("session found");

    socket.data.sessionId = session.sessionId;
    socket.data.username = session.username;
    return next();
  }
  if (!username) {
    return next(new Error("invalid username"));
  }
  socket.data.sessionId = nanoid(8);
  socket.data.username = username;
  next();
});

const saveSession = async (socket: Socket, connected: boolean = true) => {
  const { sessionId, username } = socket.data;
  const session: Session = { sessionId: sessionId, username: username, userId: socket.id, connected: connected }
  await sessionStore.saveSession(session)
  console.log(
    "session created", session
  );

}

const handleFindRoom = (sessionId: string) => {
  roomManager.addPlayer(sessionId);
}

const handleCreateRoom = (socket: Socket) => (sessionId: string): string => {
  const roomCode = roomManager.createRoom(sessionId);
  logger.info(roomCode)
  socket.emit('room:room-created', roomCode);
  return roomCode;
}

// const handleJoinRoom = (data): void {
//   roomManager.joinRoom(data.sessionId, data.roomCode);
// }

const onConnection = (socket: Socket) => {
  logger.debug("user connection", socket.data.sessionId);
  saveSession(socket);
  socket.emit("session", { sessionId: socket.data.sessionId, userId: socket.id });
  socket.on("room:find-room", handleFindRoom);
  socket.on("room:create-room", handleCreateRoom(socket));
  socket.on("room:join-room", async (data) => {
    logger.info(data);
    roomManager.joinRoom(socket.data.sessionId, data);
  })
  socket.on("game:move", async (data) => {
    const move = socket.data.sessionId == data.sessionId ? 'x' : 'o';
    await gameService.playerMove(data.room, data.value, data.sessionId);
    const board = await gameService.getGameState(data.room);
    console.log(data);
    io.to(data.room).emit('game:state-change', board);

  })
  socket.on('disconnect', async () => {
    const sessionId = socket.data.sessionId;
    console.log(socket.data.sessionId, "session");

    roomManager.removePlayer(sessionId)
    const room = await roomManager.findRoom(sessionId)
    console.log("user was from this ", room);
    if (room) {
      io.to(room.roomId).emit('room:user-left')
    }
    await roomManager.deleteRoom(sessionId);

  })
}

io.on("connection", onConnection);

httpServer.listen(3000, () => {
  console.log("Server listening on Port 3000");
});
