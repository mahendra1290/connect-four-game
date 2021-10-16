import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { io } from "socket.io-client";
import { GameService, Room } from '../game.service';

const URL = "http://localhost:3000";

@Component({
  selector: 'app-start-game',
  templateUrl: './start-game.component.html',
  styleUrls: ['./start-game.component.css']
})
export class StartGameComponent implements OnInit {
  connecting = false;

  username: string = ''

  constructor(private gameService: GameService, private router: Router) { }

  ngOnInit(): void {
    this.username = this.gameService.user;
    this.gameService.room.subscribe((room) => {
      if (room != null) {
        this.connecting = false;
        console.log(room)
        this.router.navigateByUrl('game')
      }
    });
  }

  startPlayerMatch(): void {
    this.connecting = true;
    this.gameService.joinRoom();
  }

}
