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

  creatingRoom = false;
  joiningRoom = false;

  username: string = ''

  roomCode: string = ''

  constructor(private gameService: GameService, private router: Router) { }

  ngOnInit(): void {
    this.username = this.gameService.username;
    this.gameService.room.subscribe((room) => {
      if (room != null) {
        this.connecting = false;
        this.creatingRoom = false;
        this.joiningRoom = false;
        console.log(room)
        this.router.navigateByUrl('game')
      }
    });
    this.gameService.roomCreated.subscribe((roomCode) => {
      this.roomCode = roomCode;
      this.creatingRoom = false;
    })
  }

  startPlayerMatch(): void {
    this.connecting = true;
    this.gameService.joinRandomRoom();
  }

  requestCreateRoom(): void {
    this.creatingRoom = true;
    this.gameService.createRoom();
  }

  joinRoom(roomCode: string): void {
    this.joiningRoom = true;
    this.gameService.joinRoom(roomCode);
  }

}
