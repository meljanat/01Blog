import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [RouterLink],
  template: `
    <section class="not-found">
      <h1>Page not found</h1>
      <p>The page you requested does not exist or is no longer available.</p>
      <a routerLink="/feed">Back to feed</a>
    </section>
  `,
  styles: [`
    .not-found {
      max-width: 560px;
      margin: 5rem auto;
      padding: 2rem;
      text-align: center;
      color: var(--text);
    }

    h1 {
      font-size: 2rem;
      margin-bottom: 0.75rem;
    }

    p {
      color: var(--muted);
      margin-bottom: 1.5rem;
    }

    a {
      color: var(--text);
      background: var(--scarlet);
      border-radius: 8px;
      display: inline-block;
      padding: 0.75rem 1.25rem;
      text-decoration: none;
      font-weight: 700;
    }
  `]
})
export class NotFoundComponent {}
