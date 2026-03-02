import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from './core/components/navbar/navbar.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent],
  template: `
    <app-navbar></app-navbar>
    <main style="min-height: calc(100vh - 70px); background-color: #121212;">
      <router-outlet></router-outlet>
    </main>
  `
})
export class App {
  title = '01Blog';
}