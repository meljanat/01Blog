# Backend Breakdown

This backend is a Spring Boot REST API for the blog app. It handles users, login, JWT authentication, posts, comments, follows, reports, notifications, moderation, file uploads, and admin tools.

The backend is the source of truth. The frontend can show or hide buttons, but every real permission check must happen here.

## 1. Run The Backend

From the project root:

```bash
./run-backend.sh
```

That script does three things:

```bash
source "$SCRIPT_DIR/setup-env.sh"
cd "$SCRIPT_DIR/backend"
./mvnw spring-boot:run
```

Step by step:

1. It loads local environment variables from `setup-env.sh`.
2. It moves into the `backend` folder.
3. It starts Spring Boot with Maven.

Run tests from the backend folder:

```bash
cd backend
./mvnw test
```

## 2. Configuration

Runtime settings live in `src/main/resources/application.yaml`.

```yaml
server:
  port: 8080

spring:
  datasource:
    url: ${DATABASE_URL:jdbc:postgresql://localhost:5432/blogdb}
    username: ${DATABASE_USERNAME:MOUAD}
    password: ${DATABASE_PASSWORD:mmm}

blog:
  app:
    jwtSecret: ${JWT_SECRET}
    jwtExpirationMs: ${JWT_EXPIRATION_MS:86400000}
  upload:
    path: ${UPLOAD_PATH:./uploads}
```

Important pieces:

- `server.port` makes the API available at `http://localhost:8080`.
- `DATABASE_URL`, `DATABASE_USERNAME`, and `DATABASE_PASSWORD` connect Spring to PostgreSQL.
- `JWT_SECRET` signs tokens. If this changes, old tokens stop working.
- `JWT_EXPIRATION_MS` controls token lifetime.
- `UPLOAD_PATH` is where profile pictures, post images, and videos are stored.

## 3. Project Structure

```text
src/main/java/com/blog/api
  BlogBackendApplication.java
  config/
  controller/
  model/
  repository/
  security/
  service/
```

What each folder does:

- `config`: Spring Security, CORS, and uploaded-file serving.
- `controller`: HTTP endpoints.
- `model`: JPA database entities and enums.
- `repository`: database queries.
- `security`: JWT parsing, token validation, and Spring user loading.
- `service`: shared business logic, uploads, sanitizing, notifications, moderation.

## 4. Request Flow

Every protected API request follows this path:

1. Browser sends a request to `http://localhost:8080`.
2. CORS checks whether the frontend origin is allowed.
3. Spring Security decides whether the route is public, authenticated, or admin-only.
4. `AuthTokenFilter` reads the `Authorization: Bearer ...` header.
5. `JwtUtils` validates the token signature and expiration.
6. `UserDetailsServiceImpl` loads the user from the database.
7. The controller uses `Principal` or `Authentication` to know the current user.
8. Repositories and services perform the action.
9. The controller returns JSON, text, or an error response.

Example from `WebSecurityConfig.java`:

```java
authorizeHttpRequests(auth -> auth
        .requestMatchers("/api/admin/**").hasRole("ADMIN")
        .requestMatchers("/api/auth/**").permitAll()
        .requestMatchers("/uploads/**").permitAll()
        .requestMatchers("/error").permitAll()
        .anyRequest().authenticated());
```

That means:

- `/api/auth/**` is public.
- `/uploads/**` is public so images and videos can load in the browser.
- `/api/admin/**` requires a real backend admin role.
- Everything else requires a valid JWT.

## 5. CORS

`CorsConfig.java` allows the Angular dev server to call the backend.

```java
configuration.setAllowedOrigins(List.of(
        "http://localhost:4200",
        "http://127.0.0.1:4200"));
configuration.setAllowedHeaders(List.of(
        "Origin", "Content-Type", "Accept", "Authorization"));
```

This is why the frontend can send requests from port `4200` to the API on port `8080`.

## 6. Authentication

### Register

Registration is handled by `AuthController.registerUser`.

Step by step:

1. Read `username`, `email`, `password`, optional `bio`, and optional image file.
2. Trim the username and email.
3. Reject blank required fields.
4. Reject duplicate usernames and emails.
5. Sanitize the bio.
6. Save the profile image, if one was uploaded.
7. Hash the password with BCrypt.
8. Make the first registered user an admin.
9. Save the user.

Example:

```java
username = username.trim();
email = email.trim().toLowerCase();

if (userRepository.existsByUsername(username)) {
    return ResponseEntity.badRequest().body("Error: Username is already taken!");
}

user.setPassword(encoder.encode(password));
```

The first account gets admin permissions:

```java
if (userRepository.count() == 0) {
    user.setRole(Role.ROLE_ADMIN);
} else {
    user.setRole(Role.ROLE_USER);
}
```

### Login

Login is handled by `AuthController.authenticateUser`.

Step by step:

1. Read `username` and `password` from the JSON request body.
2. Refresh the user's ban status.
3. Reject actively banned users.
4. Ask Spring Security to authenticate the username and password.
5. Generate a JWT.
6. Return the JWT as plain text.

Example:

```java
Authentication authentication = authenticationManager.authenticate(
        new UsernamePasswordAuthenticationToken(username, loginRequest.get("password")));

String jwt = jwtUtils.generateJwtToken(authentication);
return ResponseEntity.ok(jwt);
```

Invalid credentials return `400 Bad Request`. Active bans return `403 Forbidden`.

## 7. JWT Tokens

`JwtUtils.java` creates and validates tokens.

When a user logs in, the backend signs a token with:

- `sub`: the username.
- `roles`: the Spring authorities.
- `iat`: issued time.
- `exp`: expiration time.
- HS256 signature using `JWT_SECRET`.

Example:

```java
return Jwts.builder()
        .setSubject(username)
        .claim("roles", roles)
        .setIssuedAt(new Date())
        .setExpiration(new Date((new Date()).getTime() + jwtExpirationMs))
        .signWith(key(), SignatureAlgorithm.HS256)
        .compact();
```

Validation checks the signature and token format:

```java
Jwts.parserBuilder().setSigningKey(key()).build().parse(authToken);
```

If someone edits the JWT payload in the browser, the signature no longer matches. The backend rejects the token with `401 INVALID_JWT`.

## 8. Authentication Filter

`AuthTokenFilter.java` runs once per request.

Step by step:

1. Skip uploaded files under `/uploads/`.
2. Read the `Authorization` header.
3. Extract the token after `Bearer `.
4. Validate the JWT.
5. Load the user from the database.
6. Block banned users.
7. Put the authenticated user into Spring's security context.

Example:

```java
String jwt = parseJwt(request);

if (jwt != null && jwtUtils.validateJwtToken(jwt)) {
    String username = jwtUtils.getUserNameFromJwtToken(jwt);
    UserDetails userDetails = userDetailsService.loadUserByUsername(username);

    UsernamePasswordAuthenticationToken authentication =
            new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());

    SecurityContextHolder.getContext().setAuthentication(authentication);
}
```

The important security detail: the backend reloads authorities from the database through `UserDetailsServiceImpl`. The frontend-decoded token is not trusted for backend permissions.

## 9. User Loading

`UserDetailsServiceImpl.java` adapts the app's `User` entity to Spring Security.

Step by step:

1. Find the user by username.
2. Refresh expired bans.
3. Create a Spring Security user.
4. Attach the database role as an authority.
5. Mark the account disabled if the ban is active.

This is what admin checks eventually use:

```java
AuthorityUtils.createAuthorityList(user.getRole().name())
```

The role names are stored as `ROLE_USER` and `ROLE_ADMIN`.

## 10. Models

The main JPA models are:

- `User`: account, email, password hash, bio, profile picture, role, follows, ban data.
- `Post`: author, content, media URL, media type, likes, hidden status, comments.
- `Comment`: post, author, text, created and updated timestamps.
- `Report`: reporter, target type, target id, reason, resolved status.
- `Notification`: recipient, actor, notification type, target, read status.

Enums:

- `Role`: `ROLE_USER`, `ROLE_ADMIN`.
- `ReportType`: target type such as user or post.
- `NotificationType`: activity type such as like, comment, follow.

These models are the database shape. Controllers usually expose selected fields through maps instead of returning every relationship directly.

## 11. Repositories

Repositories are Spring Data JPA interfaces. They provide database access without writing SQL for every operation.

Examples:

- `UserRepository`: find users by username or email, check duplicates.
- `PostRepository`: load feed posts, profile posts, hidden posts, post counts.
- `CommentRepository`: load comments and count comment activity.
- `ReportRepository`: find unresolved reports and delete report records.
- `NotificationRepository`: load, count, and remove notifications.

Controllers and services call repositories when they need data.

## 12. Input Sanitizing

`InputSanitizer.java` cleans user text before saving it.

Step by step:

1. Remove unsafe control characters.
2. Remove dangerous HTML blocks like `script`, `iframe`, `svg`, and `math`.
3. Strip remaining HTML tags.
4. Trim whitespace.
5. Enforce a maximum length.
6. For required fields, reject blank values.

Example:

```java
String normalized = SCRIPT_STYLE_BLOCKS.matcher(value).replaceAll("");
normalized = HTML_TAGS.matcher(normalized).replaceAll("");
normalized = normalized.replace("<", "").replace(">", "");
```

Used by registration, profile updates, posts, comments, reports, and admin moderation text.

## 13. File Uploads

`FileStorageService.java` handles profile pictures and post media.

Step by step:

1. Ignore empty files.
2. Check content type.
3. Create the upload directory if needed.
4. Generate a UUID filename.
5. Save the file.
6. Return a public `/uploads/...` URL.

Profile pictures only allow image content types. Post media allows images and videos.

Uploaded files are served by `WebMvcConfig.java`:

```java
registry.addResourceHandler("/uploads/**")
        .addResourceLocations(uploadLocation);
```

That maps API URLs like `/uploads/photo.png` to files on disk.

## 14. Post Controller

`PostController.java` owns feed, post, like, comment, edit, and delete actions.

### Feed

`GET /api/posts`

Step by step:

1. Get the current user from `Principal`.
2. Build a list of authors: current user plus followed users.
3. Clamp the page size between 1 and 50.
4. Return visible posts using cursor pagination.

Example:

```java
User currentUser = userRepository.findByUsername(principal.getName())
        .orElseThrow(() -> new RuntimeException("User not found"));

List<User> feedAuthors = new ArrayList<>(currentUser.getFollowing());
feedAuthors.add(currentUser);
```

### Create Post

`POST /api/posts`

Step by step:

1. Get the authenticated username.
2. Sanitize the text.
3. Save optional media.
4. Create the post for the authenticated user.
5. Return the post DTO.

The client cannot choose another author. The author comes from `Authentication.getName()`.

### Update And Delete

Update and delete check ownership:

```java
if (!post.getUser().getUsername().equals(authentication.getName())) {
    return ResponseEntity.status(HttpStatus.FORBIDDEN).body("You can only edit your own posts.");
}
```

Admins can moderate posts through admin endpoints, not by pretending to be the author.

### Likes

`POST /api/posts/{id}/like`

Step by step:

1. Load the post.
2. Load the current user from the JWT identity.
3. Toggle the like.
4. Create or delete the notification.
5. Return the updated post.

### Comments

The comments endpoints support:

- `GET /api/posts/{postId}/comments`
- `POST /api/posts/{postId}/comments`
- `PUT /api/posts/{postId}/comments/{commentId}`
- `DELETE /api/posts/{postId}/comments/{commentId}`

Comment edits are limited to the comment author. Deleting is allowed for the comment author or the post owner.

## 15. User Controller

`UserController.java` owns profile and follow actions.

Main endpoints:

- `GET /api/users/{username}`: profile data.
- `PUT /api/users/profile`: update your own profile.
- `POST /api/users/{username}/follow`: follow a user.
- `POST /api/users/{username}/unfollow`: unfollow a user.
- `GET /api/users/{username}/followers`: follower list.
- `GET /api/users/{username}/following`: following list.
- `GET /api/users/suggested`: suggested users.

Step by step for follow:

1. Actor comes from `Principal`.
2. Target comes from the URL.
3. Reject self-follow.
4. Reject following banned users.
5. Save the relationship.
6. Create a follow notification.

This prevents identity swapping because the actor is not read from the request body.

## 16. Report Controller

`ReportController.java` lets users report posts or users.

Step by step:

1. Load the reporter from `Principal`.
2. Read target type, target id, and reason.
3. Sanitize the reason.
4. Reject reporting your own content.
5. Reject reports for invalid, hidden, or already banned targets.
6. Save the report.

The user sends only the target and reason. The reporter identity comes from the authenticated request.

## 17. Notification Controller

`NotificationController.java` handles notification reads.

Common actions:

- Load current user's notifications.
- Count unread notifications.
- Mark one notification as read.
- Toggle read state.

The controller checks ownership before modifying a notification, so one user cannot mark another user's notification.

## 18. Admin Controller

`AdminController.java` is protected twice:

1. Route-level security in `WebSecurityConfig`:

```java
.requestMatchers("/api/admin/**").hasRole("ADMIN")
```

2. Method-level security on the controller:

```java
@PreAuthorize("hasRole('ADMIN')")
```

Admin endpoints include:

- Analytics.
- List users.
- List posts.
- List reports.
- Resolve reports.
- Hide or unhide posts.
- Delete posts.
- Delete comments.
- Ban or unban users.
- Delete users.

Important safety rules:

- Admins cannot ban themselves.
- Admins cannot delete themselves.
- Admin accounts cannot be banned or deleted by another admin endpoint.

## 19. Moderation Service

`ModerationService.java` centralizes destructive and moderation actions.

It handles:

- Deleting posts and their reports, notifications, comments, likes, and media.
- Hiding posts and cleaning up related notifications.
- Deleting comments and related notifications.
- Deleting users and their posts, comments, reports, notifications, follows, likes, and profile image.
- Banning users for one day, three days, one week, or permanently.
- Refreshing expired bans.

This keeps controller code smaller and prevents cleanup logic from being duplicated.

## 20. Notification Service

`NotificationService.java` creates and removes activity notifications.

Important behavior:

- It does not create notifications when the actor and recipient are the same user.
- It de-duplicates notifications for the same actor, recipient, type, and target.
- It deletes matching notifications when likes, comments, follows, or moderation actions are undone.

Example behavior:

1. You like another user's post.
2. The backend creates a `LIKE` notification for the post owner.
3. You unlike the post.
4. The backend removes that matching notification.

## 21. Error Handling

`GlobalExceptionHandler.java` converts common exceptions into consistent API responses.

`ApiError.java` is the response shape:

```java
public record ApiError(String errorCode, String message, Instant timestamp) {
    public static ApiError of(String errorCode, String message) {
        return new ApiError(errorCode, message, Instant.now());
    }
}
```

Examples:

- Bad request exceptions: `400` with `BAD_REQUEST`.
- Missing resources: `404` with `NOT_FOUND`.
- Forbidden controller actions: `403` with `FORBIDDEN`.
- Uploads larger than 10MB: `400` with `UPLOAD_TOO_LARGE`.
- Unexpected server failure: `500` with `SERVER_ERROR`.

`AuthTokenFilter` also returns auth-specific JSON for invalid tokens and banned accounts:

- Invalid or expired JWT: `401` with `INVALID_JWT`.
- Banned account: `403` with `ACCOUNT_BANNED`.

## 22. Main API Areas

```text
/api/auth
  POST /register
  POST /login

/api/posts
  GET /
  POST /
  GET /{id}
  PUT /{id}
  DELETE /{id}
  POST /{id}/like
  GET /{id}/comments
  POST /{id}/comments
  PUT /{id}/comments/{commentId}
  DELETE /{id}/comments/{commentId}

/api/users
  GET /{username}
  PUT /profile
  POST /{username}/follow
  POST /{username}/unfollow
  GET /{username}/followers
  GET /{username}/following
  GET /suggested

/api/reports
  POST /

/api/notifications
  GET /
  GET /unread-count
  PUT /{id}/read
  PUT /{id}/toggle

/api/admin
  GET /analytics
  GET /users
  GET /posts
  GET /reports
  PUT /reports/{id}/resolve
  PUT /users/{id}/ban
  PUT /users/{id}/unban
  DELETE /users/{id}
  DELETE /posts/{id}
  PUT /posts/{id}/visibility
  DELETE /comments/{id}
```

## 23. Example Flow: Login Then Create A Post

1. Frontend calls `POST /api/auth/login`.
2. Backend authenticates with `AuthenticationManager`.
3. Backend returns a signed JWT.
4. Frontend stores the token.
5. Frontend sends `Authorization: Bearer <token>` on `POST /api/posts`.
6. `AuthTokenFilter` validates the token.
7. `PostController` reads the username from `Authentication`.
8. Backend creates the post for that real authenticated user.

The client never sends `userId` or `role` for this action.

## 24. Example Flow: Admin Hides A Post

1. Frontend calls an admin endpoint under `/api/admin`.
2. Spring Security requires `ROLE_ADMIN`.
3. The token signature is validated.
4. The user role is loaded from the database.
5. `AdminController` calls `ModerationService`.
6. The post hidden flag is updated.
7. Related notifications can be removed if needed.

Changing the frontend's local token payload is not enough to pass this flow, because the backend validates the token signature and checks the database-backed role.

## 25. Adding A Backend Feature

Use this order:

1. Add or update a model if the database shape changes.
2. Add repository methods for the query you need.
3. Put shared business rules in a service.
4. Add a controller endpoint.
5. Make sure identity comes from `Principal` or `Authentication`, not from trusted client fields.
6. Sanitize user text with `InputSanitizer`.
7. Return a small DTO or map instead of exposing unnecessary entity relationships.
8. Add or update tests when the behavior changes.

Example rule: if you add "save post", the request should contain the post id only. The current user should still come from the JWT-authenticated principal.
