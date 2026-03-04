import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from './core/components/navbar/navbar.component';
import { ConfirmModalComponent } from './core/components/confirm-modal/confirm-modal.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent, ConfirmModalComponent],
  template: `
    <app-navbar></app-navbar>
    <main style="min-height: calc(100vh - 70px); background-color: #121212;">
      <router-outlet></router-outlet>
      <app-confirm-modal></app-confirm-modal>
    </main>
  `
})
export class App {
  title = '01Blog';
}