# 01Blog Gap Analysis (against provided subject)

## What is already implemented

- JWT auth flow (register/login) with hashed passwords (BCrypt) and role field on users.
- Security filter protects all routes by default and restricts `/api/admin/**` to admins.
- Profile pages via `GET /api/users/{username}`, follow/unfollow, editable bio/profile picture.
- Posts with CRUD, optional media upload, likes, comments, timestamps.
- Notification system for follow/like/comment/new post + unread count/read toggle.
- Reporting endpoint for user/post reports and admin report listing/resolve.
- Admin endpoints for listing users/posts/reports and deleting users/posts/comments, plus ban/unban.
- Angular app includes auth, feed, profile, post detail, reporting modal, notifications in navbar, and admin pages.

## Missing or incorrect items

### 1) Project documentation requirement is not met
- The subject explicitly requires a **detailed README** with run instructions for backend/frontend and technologies used.
- Repository has only `frontend/README.md` (default Angular CLI template), and no root/backend project README.

### 2) Security/config hardening issues
- Database credentials and JWT secret are committed in plaintext in `application.yaml`.
- CORS/URL configuration is hardcoded to localhost values in frontend services.
- Admin guard in frontend checks token payload via string-contains (`JSON.stringify(payload).includes('ROLE_ADMIN')`) instead of strict role claim parsing.

### 3) Admin moderation scope is partial
- Admin can delete posts/comments/users and toggle user ban, but there is no explicit endpoint to "hide" posts (only hard delete).
- Report handling resolves reports but does not directly enforce a workflow action (e.g., action metadata on report such as banned user/deleted post by moderator).

### 4) Media handling constraints are only partially addressed
- Media is stored on local filesystem (`./uploads`) which is allowed, but there is no visible validation for allowed MIME types/extensions (image/video whitelist) or sanitization policy.
- Uploaded sample media files are checked into the repo, which is generally undesirable for production repository hygiene.

### 5) Missing/weak validation and API contracts
- Several endpoints accept raw `String` request bodies for post/comment text (instead of DTOs with validation annotations).
- Error handling relies on generic `RuntimeException` in many controllers; no global exception handler/standard error format.
- Register endpoint always calls file storage save; behavior when `file` is absent depends on service implementation and may be fragile if not null-safe.

### 6) Frontend requirements with "real-time or refresh" are only refresh-based
- The app appears to rely on standard HTTP refresh flows for comments/notifications; no WebSocket/real-time layer (optional bonus, not mandatory).
- Infinite scroll appears to be partially implemented in API (cursor-style `lastId`) but must be verified in UI behavior.

### 7) Testing depth appears insufficient
- Backend test tree appears to contain only a context-load style starter test.
- No visible frontend unit/integration tests tied to core features (auth, admin moderation, reporting).

## Priority fixes (recommended order)
1. Add a proper root `README.md` covering architecture, prerequisites, env vars, run commands, and feature matrix.
2. Move secrets/config to environment variables and provide `.env.example` / `application-example.yaml`.
3. Replace string body endpoints with request DTOs + Bean Validation + consistent error responses.
4. Harden frontend role checks and centralize auth claim parsing.
5. Add media validation (size/type/extension) and remove tracked uploads from VCS.
6. Add core backend and frontend tests for auth, RBAC, report flow, and post interactions.
