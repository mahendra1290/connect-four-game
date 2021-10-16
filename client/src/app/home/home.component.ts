import { Component, OnInit } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
})
export class HomeComponent implements OnInit {
  username = new FormControl('', Validators.required);


  constructor(private router: Router) { }

  ngOnInit(): void { }

  selectUsername(): void {
    sessionStorage.setItem('USERNAME', this.username.value);
    this.router.navigateByUrl('start');
  }
}
