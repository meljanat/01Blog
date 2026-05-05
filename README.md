# 01Blog

A fullstack social blogging platform where students share learning progress, follow each other, and interact through posts, likes, comments, reports, and notifications.

---

## Tech Stack

### Backend
- Java 21
- Spring Boot
- Spring Security + JWT authentication
- Spring Data JPA (Hibernate)
- PostgreSQL
- Maven

### Frontend
- Angular (standalone components)
- TypeScript
- RxJS
- SCSS

### Infrastructure / Tools
- Docker Compose (PostgreSQL)
- Local filesystem media storage (`backend/uploads`)

---

## Repository Structure

```text
01Blog/
├── backend/                 # Spring Boot API
│   ├── src/main/java/
│   ├── src/main/resources/
│   └── pom.xml
├── frontend/                # Angular app
│   ├── src/
│   ├── angular.json
│   └── package.json
├── docker-compose.yml       # PostgreSQL service
├── run-database.sh
├── run-backend.sh
└── run-frontend.sh
```

---

## Core Features

- Authentication: register/login with password hashing and JWT.
- Roles and access control: user/admin-protected routes.
- User profiles ("blocks") with follow/unfollow support.
- Feed from followed users.
- Posts with text + optional media upload (image/video).
- Like and comment interactions.
- Notifications (follow, like, comment, new post).
- Reporting users/posts.
- Admin dashboard endpoints for moderation (users, posts, reports).

---

## Prerequisites

Install locally:

- Java 21
- Maven 3.9+
- Node.js 20+ and npm
- Docker + Docker Compose
- PostgreSQL client tools (optional)

---

## Environment Configuration

Current backend config is in:
- `backend/src/main/resources/application.yaml`

At minimum, verify/update:
- `spring.datasource.url`
- `spring.datasource.username`
- `spring.datasource.password`
- `blog.app.jwtSecret`
- `blog.app.jwtExpirationMs`
- `blog.upload.path`

> Recommended: move secrets to environment variables for non-local usage.

---

## Run the Project

### 1) Start PostgreSQL

From repository root:

```bash
./run-database.sh
```

Alternative:

```bash
docker compose up -d
```

### 2) Run Backend (Spring Boot)

From repository root:

```bash
./run-backend.sh
```

Alternative manual run:

```bash
cd backend
./mvnw spring-boot:run
```

Backend default URL: `http://localhost:8080`

### 3) Run Frontend (Angular)

From repository root:

```bash
./run-frontend.sh
```

Alternative manual run:

```bash
cd frontend
npm install
npm start
```

Frontend default URL: `http://localhost:4200`

---

## API Overview (high level)

### Auth
- `POST /api/auth/register`
- `POST /api/auth/login`

### Users
- `GET /api/users/{username}`
- `PUT /api/users/profile`
- `POST /api/users/{username}/follow`
- `POST /api/users/{username}/unfollow`

### Posts
- `GET /api/posts`
- `POST /api/posts`
- `PUT /api/posts/{postId}`
- `DELETE /api/posts/{postId}`
- `POST /api/posts/{postId}/like`
- `POST /api/posts/{postId}/comments`

### Notifications
- `GET /api/notifications`
- `PUT /api/notifications/{id}/toggle`
- `GET /api/notifications/unread-count`

### Reports
- `POST /api/reports`

### Admin (ADMIN role)
- `GET /api/admin/users`
- `GET /api/admin/posts`
- `GET /api/admin/reports`
- `PUT /api/admin/reports/{id}/resolve`
- `PUT /api/admin/users/{id}/ban`
- `DELETE /api/admin/users/{id}`
- `DELETE /api/admin/posts/{id}`

---

## Development Commands

### Backend

```bash
cd backend
./mvnw test
./mvnw spring-boot:run
```

### Frontend

```bash
cd frontend
npm install
npm run build
npm test
npm start
```

---

## Notes / Known Gaps

- A cleanup pass is still recommended for:
  - moving secrets out of committed config,
  - strengthening validation and error handling contracts,
  - tightening media validation,
  - expanding automated test coverage.

---

## License

No license file is currently provided in this repository.
