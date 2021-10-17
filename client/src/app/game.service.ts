import { i18nMetaToJSDoc } from '@angular/compiler/src/render3/view/i18n/meta';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { io } from "socket.io-client";


export interface Room {
  roomId: string,
  player1: {
    userId: string,
    username: string,
    marker: string,
  },
  player2: {
    userId: string,
    username: string,
    marker: string,
  }
  firstToStart: string,
}

@Injectable({
  providedIn: 'root'
})
export class GameService {
  username = localStorage.getItem('USERNAME') || 'NULL';
  session = localStorage.getItem('session');
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

  gameMove: Subject<string[][]> = new Subject();

  roomLeave: Subject<string> = new Subject();

  roomCreated: Subject<string> = new Subject();

  gameOptionSelected: BehaviorSubject<string[]> = new BehaviorSubject<string[]>([]);

  private setEvents() {
    this.socket.on('connection', () => console.log('connected'));
    this.socket.on('room:created', (data: Room) => {
      console.log(data);

      this.room.next(data);
      // if (data.turn == this.socket.id) {
      //   this.turn.next(true)
      // }
    });
    this.socket.on('option selected', (val) => this.optionSelected.next({ value: val.value, socketId: val.socketId }))
    this.socket.on('room:user-left', () => {
      console.log("roo m left");

      this.socket.disconnect();
      this.room.next(null);
      this.roomLeave.next('user-left');
    })
    this.socket.on('room:room-created', (roomCode) => this.roomCreated.next(roomCode))
    this.socket.on('game:turn', (data) => {
      console.log(data)
      const nextTurn = data.nextTurn[0].socketId;
      if (nextTurn == this.socket.id) {
        this.turn.next(true);
      }
    });
    this.socket.on("game:state-change", (data) => {
      this.gameMove.next(data);

      // if (data['from'] != this.socket.id) {
      //   this.gameMove.next({ from: 'opponent', value: data['value'] })
      // } else {
      //   this.gameMove.next({ from: 'self', value: data['value'] })
      // }
    });
    this.socket.on("session", (data: { sessionId: string, userId: string }) => {
      console.log(data);
      localStorage.setItem('session', data.sessionId);
      this.gameOptionSelected.subscribe(([event, payload]) => {
        this.socket.emit(event, data.sessionId);
      })
    })
  }

  createRoom(): void {
    this.socket.connect();
    this.gameOptionSelected.next(['room:create-room', this.session || '']);
  }

  joinRandomRoom(): void {
    const username = localStorage.getItem('USERNAME') || 'NULL';
    const session = localStorage.getItem('session');
    this.socket.auth = { username: username, sessionId: session };
    this.socket.connect();
    this.gameOptionSelected.next(['room:find-room', this.session || '']);

  }

  joinRoom(roomCode: string) {
    this.socket.connect();
    this.gameOptionSelected.next(['room:join-room', roomCode]);
  }

  buttonPressed(value: number): void {
    this.socket.emit("game:move", { room: this.room.value?.roomId, sessionId: this.session, value: value })
    this.turn.next(false);
  }

  isConnected(): boolean {
    return this.socket.connected;
  }

  endGame() {
    this.socket.disconnect();
    this.room.next(null);
    this.roomLeave.next('self-left');
  }





}
