import { Component, OnInit } from '@angular/core';
import { GameService } from '../game.service';

@Component({
  selector: 'app-game-board',
  templateUrl: './game-board.component.html',
  styleUrls: ['./game-board.component.css']
})
export class GameBoardComponent implements OnInit {
  gameState: string[][] = [[], [], [], [], [], [], []];

  marker = '';

  constructor(private gameService: GameService) { }

  ngOnInit(): void {
    this.gameService.room.subscribe(room => {
      if (room) {
        const session = localStorage.getItem('session') || '';
        if (room.player1.userId == session) {
          this.marker = room.player1.marker;
        } else {
          this.marker = room.player2.marker;
        }
      }
    })
    this.gameService.gameMove.subscribe(move => {
      console.log(move);

      this.gameState = move;
      // console.log(move)
      // console.log(this.gameState)
      // if (move.from == 'opponent') {

      //   this.gameState[move.value].push(1);
      // } else {
      //   this.gameState[move.value].push(0);
      // }
    })
  }

  onRowClick(row: number) {
    this.gameService.buttonPressed(row);
  }

}
