import { Component, OnInit } from '@angular/core';
import { GameService } from '../game.service';

@Component({
  selector: 'app-game-board',
  templateUrl: './game-board.component.html',
  styleUrls: ['./game-board.component.css']
})
export class GameBoardComponent implements OnInit {
  gameState: number[][] = [[], [], [], [], [], [], []];

  constructor(private gameService: GameService) { }

  ngOnInit(): void {
    this.gameService.gameMove.subscribe(move => {
      console.log(move)
      console.log(this.gameState)
      if (move.from == 'opponent') {

        this.gameState[move.value].push(1);
      } else {
        this.gameState[move.value].push(0);
      }
    })
  }

  onRowClick(row: number) {
    this.gameService.buttonPressed(row);
  }

}
