import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { GameService, Room } from '../game.service';

@Component({
  selector: 'app-game-screen',
  templateUrl: './game-screen.component.html',
  styleUrls: ['./game-screen.component.css']
})
export class GameScreenComponent implements OnInit {
  username = sessionStorage.getItem('USERNAME') || '';
  constructor(private gameService: GameService, private router: Router) { }

  room?: Room | null = null;
  option: number = 0;
  opponent?: { username: string, socketId: string };

  errorMessage = ''

  $canMove = this.gameService.turn;

  ngOnInit(): void {
    this.gameService.room.subscribe(room => {

      this.room = room;
      this.opponent = { username: 'null', socketId: 'socke3' }
      // this.opponent = this.room?.players.find(player => player.username != this.username)
    })
    this.gameService.roomLeave.subscribe(reason => {
      if (reason == 'user-left') {
        this.showMessage();
        setTimeout(() => {
          this.navigateToStart();
        }, 2000);
      } else {
        this.navigateToStart();
      }
    })
    this.gameService.optionSelected.subscribe(val => {
      if (val.socketId == this.opponent?.socketId) {
        this.option = val.value;
      }
    })
  }

  showMessage() {
    this.errorMessage = 'Other user has left the game.';
  }

  navigateToStart() {
    this.router.navigateByUrl('start');
  }

  buttonPressed(value: number) {
    this.gameService.buttonPressed(value);
  }

  endGame() {
    this.gameService.endGame();
  }

}
