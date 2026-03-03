import { Routes } from '@angular/router';
import { FeedComponent } from './features/feed/feed.component';
import { LoginComponent } from './features/auth/login/login.component';
import { RegisterComponent } from './features/auth/register/register.component';
import { ProfileComponent } from './features/profile/profile.component';
import { PostDetailComponent } from './features/post-detail/post-detail.component';
import { AdminLayoutComponent } from './features/admin/admin-layout/admin-layout.component';
import { AdminUsersComponent } from './features/admin/admin-users/admin-users.component';
import { AdminPostsComponent } from './features/admin/admin-posts/admin-posts.component';
import { AdminReportsComponent } from './features/admin/admin-reports/admin-reports.component';
import { authGuard } from './core/guards/auth-guard';
import { adminGuard } from './core/guards/admin-guard';

export const routes: Routes = [
    { path: '', redirectTo: '/feed', pathMatch: 'full' },
    { path: 'feed', component: FeedComponent, canActivate: [authGuard] },
    { path: 'login', component: LoginComponent },
    { path: 'register', component: RegisterComponent },
    { path: 'user/:username', component: ProfileComponent, canActivate: [authGuard] },
    { path: 'post/:id', component: PostDetailComponent, canActivate: [authGuard] },
    {
        path: 'admin',
        canActivate: [adminGuard],
        component: AdminLayoutComponent,
        children: [
            { path: '', redirectTo: 'reports', pathMatch: 'full' },
            { path: 'users', component: AdminUsersComponent },
            { path: 'posts', component: AdminPostsComponent },
            { path: 'reports', component: AdminReportsComponent }
        ]
    },
    { path: '**', redirectTo: '/feed' }
];