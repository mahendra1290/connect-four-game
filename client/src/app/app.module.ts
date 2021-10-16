import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HomeComponent } from './home/home.component';
import { StartGameComponent } from './start-game/start-game.component';
import { GameScreenComponent } from './game-screen/game-screen.component';
import { GameBoardComponent } from './game-board/game-board.component';
import { GameCellComponent } from './game-cell/game-cell.component';
import { GameRowComponent } from './game-row/game-row.component';
import { LoadingSpinnerComponent } from './loading-spinner/loading-spinner.component';

@NgModule({
  declarations: [AppComponent, HomeComponent, StartGameComponent, GameScreenComponent, GameBoardComponent, GameCellComponent, GameRowComponent, LoadingSpinnerComponent],
  imports: [BrowserModule, AppRoutingModule, FormsModule, ReactiveFormsModule],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule { }
