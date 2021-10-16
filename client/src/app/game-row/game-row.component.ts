import { Component, EventEmitter, OnInit, Output } from '@angular/core';

@Component({
  selector: 'app-game-row',
  templateUrl: './game-row.component.html',
  styleUrls: ['./game-row.component.css']
})
export class GameRowComponent implements OnInit {

  @Output()
  rowClick: EventEmitter<void> = new EventEmitter();

  constructor() { }

  ngOnInit(): void {
  }

  enter() {
    this.rowClick.emit();
    console.log("enter");
  }

}
