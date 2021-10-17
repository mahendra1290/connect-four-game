import { Redis } from "ioredis";

export class GameService {

  GAME_TTL = 60 * 10;

  constructor(private redisClient: Redis) { }

  startNewGame(roomId: string, player1: string, player2: string): Promise<any> {
    return this.redisClient
      .multi()
      .hmset(`game:${roomId}:players`, 'player1', player1, 'player2', player2)
      .expire(`game:${roomId}:players`, this.GAME_TTL)
      .exec()
  }

  private async checkWinner(roomId: string): Promise<string | null> {
    const board = await this.getGameState(roomId);
    const directions = [[1, 0], [0, 1], [1, -1], [1, 1]];
    console.log(board);
    for (let i = 0; i < 7; i++) {
      for (let j = 0; j < board[i].length; j++) {
        let x = i, y = j;
        let color = board[i][j];
        for (const dir of directions) {
          let nx = x, ny = y;
          let k = 0;
          console.log('nx', nx, 'ny', ny);

          for (k = 0; k < 3; k++) {
            nx += dir[0];
            ny += dir[1];
            console.log('nx', nx, 'ny', ny);

            if (nx < 0 || nx >= 7 || ny < 0 || ny >= board[nx].length || board[nx][ny] != color) {
              break;
            }
          }
          if (k == 3) {
            console.log("winner found");
            return color;

          }

        }
      }
    }
    return null;
  }

  getTurn(roomId: string): Promise<string | null> {
    return this.redisClient
      .get(`game:${roomId}:turn`)
  }

  async playerMove(roomId: string, col: string, moveBy: string): Promise<any> {
    const status = await this.redisClient.get(`game:${roomId}:status`);
    if (status == 'over') {
      return;
    }
    const turn = await this.redisClient.get(`game:${roomId}:turn`);
    if (turn && turn != moveBy) {
      console.log("invalud operati   on ");
      return;
    }
    let nextTurn = ''
    const players = await this.redisClient.hmget(`game:${roomId}:players`, 'player1', 'player2')
    players.forEach(val => {
      if (val && val != moveBy) [
        nextTurn = val
      ]
    })
    console.log("moveby", moveBy, "nextTrun", nextTurn);

    await this.redisClient
      .multi()
      .rpush(`game:${roomId}:col:${col}`, players[0] == moveBy ? '0' : '1')
      .set(`game:${roomId}:turn`, nextTurn)
      .expire(`game:${roomId}${col}`, this.GAME_TTL)
      .exec();

    const winner = await this.checkWinner(roomId);
    if (winner) {
      console.log("found winner", winner);

      this.redisClient.emit('game:winner', winner == '0' ? players[0] : players[1]);
      this.redisClient.set(`game:${roomId}:status`, 'over');
    }

  }

  async getGameState(roomId: string): Promise<string[][]> {
    const board: string[][] = []
    const players = await this.redisClient.hmget(`game:${roomId}:players`, 'player1', 'player2');
    console.log(players);

    for (let col = 0; col < 7; col++) {
      const row = await this.redisClient.lrange(`game:${roomId}:col:${col}`, 0, -1);
      board.push(row);
    }
    return board;
  }

}