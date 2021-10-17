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

  SESSION_TTL = 60 * 60;

  constructor(private redisClient: Redis) { }

  async findSession(sessionId: string): Promise<Session | null | undefined> {
    return this.redisClient
      .hmget(`session:${sessionId}`, "username", "userId", "connected")
      .then(result => {
        if (result[0] != undefined) {
          return { sessionId: sessionId, username: result[0] || '', userId: result[1] || '', connected: result[2] || false } as Session
        }
      });
  }

  saveSession(session: Session): Promise<any> {
    return this.redisClient
      .multi()
      .hmset(`session:${session.sessionId}`, "username", session.username, "userId", session.userId, "connected", session.connected.toString())
      .expire(`session:${session.sessionId}`, this.SESSION_TTL)
      .exec()
  }
}
