import { Redis } from "ioredis";
import { nanoid } from "nanoid";

export interface Player {
  sessionId: string,
  username: string,
  userId: string,
}

export class RoomManager {

  ROOM_TTL = 60 * 10;

  constructor(private redisClient: Redis) { }

  async addPlayer(sessionId: string) {
    const isPresent = await this.redisClient.sismember("players", sessionId);
    if (!isPresent) {
      this.redisClient.sadd("players", sessionId);
      await this.redisClient.rpush("waitingQueue", sessionId);
      const len = await this.redisClient.llen("waitingQueue");
      if (len >= 2) {
        const player1 = await this.redisClient.lpop("waitingQueue");
        const player2 = await this.redisClient.lpop("waitingQueue");
        const roomId = nanoid(8);
        await this.redisClient
          .multi()
          .hmset(`rooms:${roomId}`, "player1", player1, "player2", player2)
          .expire(`rooms:${roomId}`, this.ROOM_TTL)
          .exec()
        this.redisClient.emit("room:created", { roomId: roomId, player1: player1, player2: player2 });

      }
    }
  }

  async findRoom(sessionId: string) {
    const keys = new Set<string>();
    let cursor = 0;
    do {
      const [nextCursor, rooms] = await this.redisClient.scan(cursor, "MATCH", 'rooms:*', "COUNT", 100);
      for (let room of rooms) {
        const [_, fields] = await this.redisClient.hscan(room, 0)
        console.log(fields);

        if (fields[0] == sessionId || fields[1] == sessionId) {
          return { roomId: room.split(':')[1], player1: fields[1], player2: fields[3] };
        }
      }
      cursor = +nextCursor;
    } while (cursor != 0);

  }


  async removePlayer(sessionId: string) {
    console.log(sessionId);

    this.redisClient.srem("players", sessionId);
    this.redisClient.lrem("waitingQueue", 0, sessionId);
  }

}