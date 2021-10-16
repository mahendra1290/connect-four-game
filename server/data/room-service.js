const { nanoid } = require("nanoid");

class Room {
  constructor() {
    this.roomId = nanoid(10);
    this.players = [];
    this.boardState = [[], [], [], [], [], [], []];
    this.turn = null;
  }

  addPlayer(player) {
    if (this.players.length == 0) {
      this.turn = player.socketId;
    }
    this.players.push(player);
  }

  isPlayerPresent(socketId) {
    return this.players.find((player) => player.socketId == socketId);
  }
}

module.exports = Room;
