import { i18nMetaToJSDoc } from '@angular/compiler/src/render3/view/i18n/meta';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { io } from "socket.io-client";


export interface Room {
  roomId: string,
  players: { username: string, socketId: string }[]
  turn: string,
}

@Injectable({
  providedIn: 'root'
})
export class GameService {
  username = sessionStorage.getItem('USERNAME') || 'NULL';
  session = sessionStorage.getItem('session');
  user = 'temp'
  URL = `http://${window.location.hostname}:3000`;

  socket = io(this.URL, { autoConnect: false });
  connecting = false;

  constructor(private router: Router) {
    console.log(window.location);
    this.socket.auth = { username: this.username, sessionId: this.session };
    this.setEvents();
  }

  optionSelected: Subject<{ value: number, socketId: string }> = new Subject()

  room: BehaviorSubject<Room | null> = new BehaviorSubject<Room | null>(null);

  turn: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

  gameMove: Subject<{ from: string, value: number }> = new Subject();

  private setEvents() {
    this.socket.on('connection', () => console.log('connected'));
    this.socket.on('room connected', (data: Room) => {
      this.room.next(data);
      if (data.turn == this.socket.id) {
        this.turn.next(true)
      }
    });
    this.socket.on('option selected', (val) => this.optionSelected.next({ value: val.value, socketId: val.socketId }))
    this.socket.on('room leave', () => {
      this.socket.disconnect();
      this.room.next(null);
    })
    this.socket.on('game:turn', (data) => {
      console.log(data)
      const nextTurn = data.nextTurn[0].socketId;
      if (nextTurn == this.socket.id) {
        this.turn.next(true);
      }
    });
    this.socket.on("game:move", (data) => {
      if (data['from'] != this.socket.id) {
        this.gameMove.next({ from: 'opponent', value: data['value'] })
      } else {
        this.gameMove.next({ from: 'self', value: data['value'] })
      }
    });
    this.socket.on("session", (data: { sessionId: string, userId: string }) => {
      console.log(data);
      sessionStorage.setItem('session', data.sessionId);
    })
  }

  joinRoom(): void {
    this.socket.connect();
  }

  buttonPressed(value: number): void {
    this.socket.emit("game:move", { room: this.room.value?.roomId, opponent: this.room.value?.players.filter(val => val.socketId != this.socket.id), value: value })
    this.turn.next(false);
  }

  isConnected(): boolean {
    return this.socket.connected;
  }

  endGame() {
    this.socket.disconnect();
    this.room.next(null);
  }



}
