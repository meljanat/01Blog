# 01Blog

01Blog is a fullstack social blogging platform for students to document learning progress, share discoveries, follow other learners, and report inappropriate content for moderation.

## Features

- JWT authentication with BCrypt password hashing.
- User and admin roles with protected backend routes and frontend route guards.
- Personal public block pages with profile details, posts, followers, and following counts.
- Follow and unfollow users, with notifications for follows and new posts.
- Feed of posts from the current user and subscribed profiles, with infinite scroll.
- Create, edit, and delete posts with image or video uploads.
- Like posts and add, edit, or delete comments.
- Notification dropdown with read/unread toggles.
- User and post reporting with required reason and confirmation.
- Admin dashboard for users, posts, reports, bans, deletes, and report resolution.

## Tech Stack

- Backend: Java 21, Spring Boot, Spring Security, Spring Data JPA, JWT, PostgreSQL.
- Frontend: Angular, TypeScript, Bootstrap.
- Database: local PostgreSQL.
- Media storage: local filesystem upload directory.

## Prerequisites

- Java 21
- Node.js and npm
- PostgreSQL

## Local Database

Create a local PostgreSQL database before starting the backend. The default development configuration expects:

```text
database: blogdb
username: MOUAD
password: mmm
host: localhost
port: 5432
```

One possible setup is:

```bash
sudo -u postgres psql
CREATE USER "MOUAD" WITH PASSWORD 'mmm';
CREATE DATABASE blogdb OWNER "MOUAD";
\q
```

You can also keep your own local credentials and override them with environment variables.

## Run The Backend

```bash
./run-backend.sh
```

The API runs at `http://localhost:8080`.

Useful environment variables:

```bash
DATABASE_URL=jdbc:postgresql://localhost:5432/blogdb
DATABASE_USERNAME=MOUAD
DATABASE_PASSWORD=mmm
JWT_SECRET=<generate-a-strong-secret>
JWT_EXPIRATION_MS=86400000
UPLOAD_PATH=./uploads
```

The first registered account becomes an admin. Later accounts are regular users.

## Run The Frontend

```bash
cd frontend
npm ci
npm start
```

The Angular app runs at `http://localhost:4200`.

## Verify

Backend:

```bash
cd backend
./mvnw test
```

Frontend:

```bash
cd frontend
npm run build
npm audit --omit=dev
```

## Project Structure

```text
backend/   Spring Boot REST API, security, persistence, uploads
frontend/  Angular application, routes, services, components
```

Uploaded media is stored in `backend/uploads` during local development and is ignored by Git.
