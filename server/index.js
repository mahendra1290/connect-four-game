const express = require("express");
const http = require("http");
const Room = require("./data/room-service");

const app = express();
const server = http.createServer(app);

const io = require("socket.io")(server, {
  cors: {
    origin: "*",
  },
});

const rooms = [];

let waitingQueue = [];

let roomId = 0;

app.get("/", (req, res) => {
  res.send("<h1>Helllo Wrord</h1>");
});

io.use((socket, next) => {
  const username = socket.handshake.auth.username;
  if (!username) {
    return next(new Error("invalid username"));
  }
  socket.username = username;
  next();
});

io.on("connection", (socket) => {
  console.log("user connected with", socket.id);

  socket.on("button pressed", (data) => {
    console.log("room-message", data);
    io.to(data["room"]).emit("option selected", { value: data["value"], socketId: socket.id });
  });

  socket.on("game:move", (data) => {
    console.log(data);
    io.to(data["room"]).emit("game:turn", { nextTurn: data["opponent"] });
    io.to(data["room"]).emit("game:move", { from: socket.id, value: data.value });
  });

  socket.on("disconnect", async () => {
    const room = rooms.find((room) => room.isPlayerPresent(socket.id));
    const sockets = await io.in(room.roomId).fetchSockets();
    console.log(sockets.length);
    for (sock of sockets) {
      sock.leave(room.roomId);
      console.log(sock.id);
      sock.emit("room leave");
    }

    console.log("user disconneted");
  });

  waitingQueue.push(socket);
  if (waitingQueue.length == 2) {
    const room = new Room();
    const socket1 = waitingQueue.shift();
    const socket2 = waitingQueue.shift();
    room.addPlayer({ username: socket1.username, socketId: socket1.id });
    room.addPlayer({ username: socket2.username, socketId: socket2.id });
    socket1.join(room.roomId);
    socket2.join(room.roomId);
    io.to(room.roomId).emit("room connected", room);
    waitingQueue = [];
    rooms.push(room);
    console.log(room);
    roomId++;
  }
});

server.listen(3000, () => {
  console.log("Server listening on Port 3000");
});
