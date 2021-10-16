import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './auth.guard';
import { GameScreenComponent } from './game-screen/game-screen.component';
import { HomeComponent } from './home/home.component';
import { StartGameComponent } from './start-game/start-game.component';

const routes: Routes = [
  { path: 'start', component: StartGameComponent, canActivate: [AuthGuard] },
  { path: 'game', component: GameScreenComponent, canActivate: [AuthGuard] },
  { path: '', component: HomeComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
