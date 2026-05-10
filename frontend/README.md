# Frontend Breakdown

This frontend is an Angular app for the blog API. It handles login, registration, feed, profiles, posts, comments, reports, notifications, and admin screens.

The frontend improves the user experience, but it is not the security boundary. It shows or hides controls based on the token, while the backend makes the final permission decision.

## 1. Run The Frontend

From the project root:

```bash
./run-frontend.sh
```

That script runs:

```bash
cd frontend
npm start
```

The app starts on:

```text
http://localhost:4200
```

You can also run it manually:

```bash
cd frontend
npm start
```

Build the app:

```bash
cd frontend
npm run build
```

Run unit tests:

```bash
cd frontend
npm test
```

## 2. App Startup

Angular starts in `src/main.ts`.

Step by step:

1. Bootstrap the root `App` component.
2. Load providers from `app.config.ts`.
3. Start Angular routing.
4. Install the HTTP auth interceptor.

`app.config.ts` wires the router and HTTP client:

```ts
export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor]))
  ]
};
```

That means every `HttpClient` request goes through `authInterceptor`.

## 3. Routes

Routes live in `src/app/app.routes.ts`.

```ts
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
            { path: '', redirectTo: 'analytics', pathMatch: 'full' },
            { path: 'analytics', component: AdminDashboardComponent },
            { path: 'users', component: AdminUsersComponent },
            { path: 'posts', component: AdminPostsComponent },
            { path: 'reports', component: AdminReportsComponent }
        ]
    },
    { path: '**', component: NotFoundComponent }
];
```

Route rules:

- `/login` and `/register` are public screens.
- `/feed`, `/user/:username`, and `/post/:id` require any token.
- `/admin/**` requires the frontend admin guard.
- Unknown routes show the not-found page.

## 4. API Base URLs

Services call the backend directly at `http://localhost:8080`.

Example from `AuthService`:

```ts
private apiUrl = 'http://localhost:8080/api/auth';
```

Example from `PostService`:

```ts
private apiUrl = 'http://localhost:8080/api/posts';
```

Because the services use absolute backend URLs, the frontend does not need a proxy file for local development. The backend CORS config allows `http://localhost:4200`.

## 5. Authentication Flow

### Login Component

The login screen collects username and password, then calls `AuthService.login`.

Step by step:

1. User submits the form.
2. Component calls the auth service.
3. Backend returns a JWT as text.
4. Frontend stores the token in `localStorage`.
5. Router navigates to `/feed`.

`AuthService.login`:

```ts
login(credentials: any): Observable<any> {
  return this.http.post(`${this.apiUrl}/login`, credentials, { responseType: 'text' });
}
```

Invalid credentials are expected to return `400 Bad Request`. The component displays a friendly message, but the browser Network/Console panel can still show the failed HTTP request because DevTools reports all 4xx responses.

### Register Component

Registration sends `FormData` because it can include a profile image.

Step by step:

1. User enters username, email, password, optional bio, and optional image.
2. Component builds `FormData`.
3. `AuthService.register` posts it to the backend.
4. Backend creates the account.
5. Router goes to login.

`AuthService.register`:

```ts
register(formData: FormData): Observable<any> {
  return this.http.post(`${this.apiUrl}/register`, formData, { responseType: 'text' });
}
```

## 6. Auth Interceptor

`src/app/core/interceptors/auth-interceptor.ts` adds the JWT to API requests.

Step by step:

1. Read `token` from `localStorage`.
2. If it exists, clone the request.
3. Add `Authorization: Bearer <token>`.
4. Send the request.
5. If the backend says the token is invalid or the account is banned, remove the token and navigate to login.

Example:

```ts
if (token) {
  authReq = req.clone({
    setHeaders: { Authorization: `Bearer ${token}` }
  });
}
```

Error handling:

```ts
if (error.status === 401 && error.error?.errorCode === 'INVALID_JWT') {
  localStorage.removeItem('token');
  router.navigate(['/login']);
}
```

## 7. Guards

### Auth Guard

`authGuard` protects normal logged-in pages.

Step by step:

1. Check `localStorage` for a token.
2. If a token exists, allow navigation.
3. If not, navigate to `/login`.

This guard is only a frontend convenience. The backend still validates the token on every protected API request.

### Admin Guard

`adminGuard` protects the admin UI.

Step by step:

1. Read the token from `localStorage`.
2. Decode the payload.
3. Look for `ROLE_ADMIN`.
4. Allow the route only if the role is present.
5. Otherwise navigate back to `/feed`.

Example:

```ts
const payload = JSON.parse(atob(token.split('.')[1]));
const isRoleAdmin = JSON.stringify(payload).includes('ROLE_ADMIN');
```

This only controls the Angular route. If someone edits the token payload in the browser, the backend rejects the modified token because the JWT signature no longer matches.

## 8. Core Services

Services isolate HTTP calls so components do not repeat URLs or request details.

### AuthService

File: `src/app/core/services/auth.service.ts`

Responsible for:

- Login.
- Registration.

### PostService

File: `src/app/core/services/post.service.ts`

Responsible for:

- Feed pagination.
- Single post loading.
- Profile posts.
- Creating, editing, and deleting posts.
- Likes.
- Comments.

Example feed call:

```ts
getFeed(lastId: number | null, size: number = 10): Observable<any[]> {
  let url = `${this.apiUrl}?size=${size}`;
  if (lastId) {
    url += `&lastId=${lastId}`;
  }
  return this.http.get<any[]>(url);
}
```

Example create post call:

```ts
createPost(formData: FormData): Observable<Post> {
  return this.http.post<any>(this.apiUrl, formData).pipe(
    map(item => new Post(item))
  );
}
```

### UserService

File: `src/app/core/services/user.service.ts`

Responsible for:

- Loading profiles.
- Updating the current user's profile.
- Following and unfollowing.
- Followers and following lists.
- Suggested users.

### AdminService

File: `src/app/core/services/admin.service.ts`

Responsible for:

- Admin analytics.
- User moderation.
- Post moderation.
- Report management.
- Comment deletion.

### ReportService

File: `src/app/core/services/report.service.ts`

Responsible for:

- Sending user and post reports.

### NotificationService

File: `src/app/core/services/notification.service.ts`

Responsible for:

- Loading notifications.
- Counting unread notifications.
- Marking notifications as read.
- Toggling read state.

### ConfirmationService

File: `src/app/core/services/confirmation.service.ts`

Responsible for:

- Opening the shared confirmation modal.
- Passing the action to run when the user confirms.

## 9. Models And Pipes

### Post Model

`src/app/core/models/post.model.ts` wraps raw API post data into a frontend-friendly object.

Services use it like this:

```ts
return this.http.get<any>(`${this.apiUrl}/${postId}`).pipe(
  map(item => new Post(item))
);
```

This keeps post shape normalization in one place.

### TimeDisplayPipe

`src/app/core/pipes/time-display.pipe.ts` formats timestamps for display in the UI.

Components can use it in templates instead of repeating date formatting logic.

## 10. Shared Components

### NavbarComponent

File: `src/app/core/components/navbar/navbar.component.ts`

Responsible for:

- Showing logged-in navigation.
- Reading the current user from the token.
- Showing admin links when the token contains `ROLE_ADMIN`.
- Loading notifications.
- Logging out by removing the token.

Step by step:

1. Listen for route changes.
2. Check whether a token exists.
3. Decode current username and role for display.
4. Load notification count.
5. Let the user open, read, and toggle notifications.

### PostCardComponent

File: `src/app/core/components/post-card/post-card.component.ts`

Responsible for:

- Showing post content.
- Likes.
- Comments.
- Editing and deleting own posts.
- Admin hide and delete actions.
- Reporting posts.

Step by step for liking:

1. User clicks like.
2. Component updates the local UI optimistically.
3. `PostService.likePost` calls the backend.
4. Backend returns the real updated post.
5. Component replaces local state with the backend response.
6. On failure, component rolls the UI back.

### ReportModalComponent

File: `src/app/core/components/report-modal/report-modal.component.ts`

Responsible for:

- Collecting a report reason.
- Confirming before sending.
- Calling `ReportService`.
- Showing success or error text.

### ConfirmModalComponent

File: `src/app/core/components/confirm-modal/confirm-modal.component.ts`

Responsible for:

- Showing a reusable confirmation dialog.
- Running the confirmed action.
- Closing after confirm or cancel.

## 11. Feed Feature

File: `src/app/features/feed/feed.component.ts`

The feed is the main authenticated page.

Step by step:

1. Load initial posts from `PostService.getFeed`.
2. Load suggested users from `UserService`.
3. Watch scrolling.
4. Load more posts using the last post id.
5. Let the user create posts with text and optional media.
6. Let the user follow suggested users.

Create post flow:

1. User writes text and optionally selects a file.
2. Component creates `FormData`.
3. Component calls `PostService.createPost`.
4. Backend returns the created post.
5. Component inserts it into the feed.

## 12. Profile Feature

File: `src/app/features/profile/profile.component.ts`

Profile pages are loaded from `/user/:username`.

Step by step:

1. Read `username` from the route.
2. Load profile data with `UserService`.
3. Load posts for that profile.
4. Show follow or unfollow controls.
5. Allow the current user to edit their own profile.
6. Show admin moderation controls when the current user is admin.

Profile update flow:

1. User edits bio and optionally selects a new profile picture.
2. Component builds `FormData`.
3. `UserService` sends `PUT /api/users/profile`.
4. Backend applies the change to the authenticated user.
5. Component refreshes profile state.

## 13. Post Detail Feature

File: `src/app/features/post-detail/post-detail.component.ts`

The detail page is loaded from `/post/:id`.

Step by step:

1. Read `id` from the route.
2. Call `PostService.getPostById`.
3. Render the post through `PostCardComponent`.
4. If the post is deleted, navigate back to the feed.

## 14. Admin Features

Admin routes use `AdminLayoutComponent` as the shell.

### Admin Dashboard

File: `src/app/features/admin/admin-dashboard/admin-dashboard.component.ts`

Shows analytics from the backend.

### Admin Users

File: `src/app/features/admin/admin-users/admin-users.component.ts`

Responsible for:

- Listing users.
- Banning users.
- Unbanning users.
- Deleting users.

Ban flow:

1. Admin selects a user.
2. Admin chooses duration and reason.
3. Component calls `AdminService`.
4. Backend verifies the admin role.
5. Backend applies the ban through moderation logic.
6. Component refreshes the list.

### Admin Posts

File: `src/app/features/admin/admin-posts/admin-posts.component.ts`

Responsible for:

- Listing posts.
- Hiding or unhiding posts.
- Deleting posts.

### Admin Reports

File: `src/app/features/admin/admin-reports/admin-reports.component.ts`

Responsible for:

- Listing reports.
- Opening reported targets.
- Resolving reports.

## 15. Example Flow: View The Feed

1. User opens `/feed`.
2. `authGuard` checks that a token exists.
3. `FeedComponent` calls `PostService.getFeed`.
4. `authInterceptor` adds the `Authorization` header.
5. Backend validates the token and returns posts.
6. Feed renders posts through `PostCardComponent`.
7. Scrolling loads the next page with `lastId`.

## 16. Example Flow: Report A Post

1. User clicks report on a post card.
2. `ReportModalComponent` opens.
3. User enters a reason.
4. Confirmation modal asks for final confirmation.
5. `ReportService` sends target type, target id, and reason.
6. Backend uses the authenticated user as the reporter.
7. UI shows success or error feedback.

## 17. Example Flow: Admin Opens Reports

1. Admin clicks the admin reports route.
2. `adminGuard` checks the token payload for `ROLE_ADMIN`.
3. `AdminReportsComponent` calls `AdminService`.
4. `authInterceptor` attaches the JWT.
5. Backend validates the token signature.
6. Backend reloads the admin role from the database.
7. Backend returns reports only if the user is truly admin.

## 18. Adding A Frontend Feature

Use this order:

1. Add or update a service method for the backend endpoint.
2. Add a component method that calls the service.
3. Keep display state in the component.
4. Add route protection if the page needs login or admin access.
5. Keep security-sensitive checks on the backend.
6. Show user-friendly error messages for expected failures.
7. Build with `npm run build`.

Example: to add bookmarks, create a `BookmarkService` or add methods to `PostService`, then add UI in `PostCardComponent`, then add backend endpoints that use the authenticated user from the JWT.

## 19. Console And HTTP Errors

Angular app code should avoid unnecessary `console.log` or `console.error` statements.

Expected failed HTTP responses can still appear in browser DevTools. For example, invalid login credentials return `400 Bad Request`. The app can handle that response and show a message, but Chrome may still display the failed network request in the Console or Network tab.

That browser-level red line does not mean Angular crashed. It means the backend intentionally returned an error status.
