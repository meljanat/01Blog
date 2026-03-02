import { Routes } from '@angular/router';
import { FeedComponent } from './features/feed/feed.component';
import { LoginComponent } from './features/auth/login/login.component';
import { RegisterComponent } from './features/auth/register/register.component';
import { ProfileComponent } from './features/profile/profile.component';
import { PostDetailComponent } from './features/post-detail/post-detail.component';
import { authGuard } from './core/guards/auth-guard';

export const routes: Routes = [
    { path: '', redirectTo: '/feed', pathMatch: 'full' },
    { path: 'feed', component: FeedComponent, canActivate: [authGuard] },
    { path: 'login', component: LoginComponent },
    { path: 'register', component: RegisterComponent },
    { path: 'user/:username', component: ProfileComponent, canActivate: [authGuard] },
    { path: 'post/:id', component: PostDetailComponent, canActivate: [authGuard] },
    { path: '**', redirectTo: '/feed' }
];