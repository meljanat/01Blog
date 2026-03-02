import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core'; // <-- Import added here
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { authInterceptor } from './core/interceptors/auth-interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),

    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor]))
  ]
};