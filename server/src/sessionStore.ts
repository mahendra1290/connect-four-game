import { Redis } from "ioredis";

export interface Session {
  sessionId: string,
  userId: string,
  username: string,
  connected: boolean,
}

interface SessionStore {

  findSession(sessionId: string): Promise<Session | null | undefined>;

  saveSession(session: Session): void;

}

export class RedisSessionStorage implements SessionStore {

  SESSION_TTL = 3600;

  constructor(private redisClient: Redis) { }

  async findSession(sessionId: string): Promise<Session | null | undefined> {
    return this.redisClient
      .hmget(`session:${sessionId}`, "username", "userId")
      .then(result => {
        if (result[0] != undefined) {
          return { sessionId: sessionId, username: result[0] || '', userId: result[1] || '', connected: false } as Session
        }
      });
  }


  saveSession(session: Session): void {
    this.redisClient
      .multi()
      .hmset(`session:${session.sessionId}`, "username", session.username, "userId", session.userId)
      .expire(`session:${session.sessionId}`, this.SESSION_TTL)
      .exec()
      .then(result => console.log(result))
  }
}
