# Velozity Task

Real-time internal project dashboard for an agency team to manage clients, projects, tasks, notifications, and live activity with strict role-based access control.

## Overview

This project is a full-stack assignment implementation that includes:

- JWT authentication with access token + refresh token rotation
- Refresh token storage in an HttpOnly cookie
- API-enforced RBAC for Admin, Project Manager, and Developer roles
- Real-time activity feed and notifications over WebSockets
- PostgreSQL-backed audit logs and missed-event catch-up
- Scheduled overdue task detection
- Docker-based local setup with seeded demo data

## Tech Stack

### Frontend

- React
- TypeScript
- Vite
- React Router
- TanStack Query
- Socket.io Client

### Backend

- Node.js
- Express
- TypeScript
- Prisma ORM
- Socket.io
- `node-cron`

### Database

- PostgreSQL

## Key Architecture Decisions

### Express

Express was chosen for a simple and explicit middleware pipeline. That made it straightforward to enforce authentication, role checks, validation, and structured error handling across all protected routes.

### Socket.io

Socket.io was chosen over native WebSocket because this assignment depends heavily on scoped realtime delivery. Room-based broadcasting makes it easy to target:

- `admin:global` for admins
- `project:{projectId}` for project viewers
- `user:{userId}` for direct notifications

### Token Storage

- Access token is stored in frontend memory
- Refresh token is stored in an HttpOnly cookie
- Refresh sessions are persisted in the database and rotated on refresh

This avoids storing long-lived credentials in `localStorage` and satisfies the assignment requirement for secure refresh token handling.

### Overdue Scheduler

`node-cron` is used to flag overdue tasks every 5 minutes. For this assignment, it is simpler and more review-friendly than introducing Redis and a queue worker.

## Role Model

### Admin

- Full access to clients, projects, tasks, dashboards, and global activity
- Can create clients and projects
- Sees all activity and the live online-user count

### Project Manager

- Can create and manage only their own projects
- Can create tasks and assign developers
- Can view activity only for projects they own
- Receives notifications when a task is moved to `IN_REVIEW`

### Developer

- Can view only tasks assigned to them
- Can update the status of only their own assigned tasks
- Can see only activity tied to their assigned tasks

## Core Features

- Authentication with login, refresh, logout, and current-user endpoints
- Strict API-level authorization and ownership checks
- Project and task management
- Persistent activity log stored in PostgreSQL
- Real-time activity updates without refresh
- Real-time unread notification count
- Missed activity catch-up from database on reconnect
- Dashboard views tailored to each role
- Shareable task filters via query parameters
- Overdue task flagging through a background job
- Seed script with preloaded users, projects, tasks, overdue items, notifications, and activity

## Project Structure

```text
.
├── apps
│   ├── backend
│   │   ├── prisma
│   │   └── src
│   └── frontend
│       └── src
├── docker-compose.yml
├── package.json
└── README.md
```

## Database Design

### Main Entities

- `User`
- `Client`
- `Project`
- `Task`
- `ActivityLog`
- `Notification`
- `RefreshSession`
- `FeedCursor`

### Relationship Summary

- A `Project` belongs to one `Client` and one project manager
- A `Task` belongs to one `Project`
- A `Task` can be assigned to one developer
- `ActivityLog` stores persisted audit events for project/task changes
- `Notification` stores in-app notification records per user
- `RefreshSession` tracks refresh token lifecycle
- `FeedCursor` tracks the last seen point for missed activity retrieval

### Indexing Decisions

Indexes were added to support the most frequent access patterns:

- `User(role)` for role-based filtering
- `Project(createdByPmId, clientId)` for PM-scoped project lookup
- `Task(projectId, assignedDeveloperId, status, priority, dueDate, isOverdue)` for dashboard and filter queries
- `ActivityLog(projectId, createdAt)` and `ActivityLog(actorId, createdAt)` for feed reads
- `Notification(userId, readAt, createdAt)` for unread counts and dropdown lists
- `RefreshSession(userId, expiresAt)` for token/session validation

## API Summary

### Auth

- `POST /auth/login`
- `POST /auth/refresh`
- `POST /auth/logout`
- `GET /auth/me`

### Clients

- `GET /clients`
- `POST /clients`

### Users

- `GET /users?role=DEVELOPER`

### Projects

- `GET /projects`
- `POST /projects`
- `GET /projects/:projectId`
- `PATCH /projects/:projectId`

### Tasks

- `GET /projects/:projectId/tasks`
- `POST /projects/:projectId/tasks`
- `GET /tasks/:taskId`
- `PATCH /tasks/:taskId`
- `PATCH /tasks/:taskId/status`

Supported task filters:

- `status`
- `priority`
- `dueFrom`
- `dueTo`

### Activity

- `GET /activity?scope=GLOBAL|PROJECT|DEVELOPER`

Optional query params:

- `projectId`
- `missed=true`

### Notifications

- `GET /notifications`
- `PATCH /notifications/:id/read`
- `PATCH /notifications/read-all`

### Dashboards

- `GET /dashboard/admin`
- `GET /dashboard/pm`
- `GET /dashboard/developer`

## Realtime Behavior

### Emitted Events

- `activity:new`
- `notification:new`
- `notification:count`
- `presence:count`

### Client Events

- `project:join`
- `project:leave`

### Delivery Rules

- Admin receives global activity
- PM receives activity for projects they own
- Developer receives activity only for tasks assigned to them
- Notifications are delivered to the relevant user room
- Admin presence count is updated live using active socket tracking

## Local Setup

### Prerequisites

- Docker Desktop
- Node.js 22+ and npm 10+ if you want to run commands outside Docker

### Recommended: Docker

1. Start all services:

```bash
docker compose up --build
```

2. Open the application:

- Frontend: `http://localhost:5173`
- Backend health endpoint: `http://localhost:4000/health`

### What Docker Does on Startup

The backend container automatically runs:

- Prisma client generation
- Prisma schema sync
- Seed script
- Backend dev server

This keeps the reviewer setup simple and predictable.

## Seeded Demo Accounts

All seeded accounts use:

- Password: `password123`

Accounts:

- Admin: `admin@velozity.dev`
- Project Manager: `pm1@velozity.dev`
- Project Manager: `pm2@velozity.dev`
- Developer: `dev1@velozity.dev`
- Developer: `dev2@velozity.dev`
- Developer: `dev3@velozity.dev`
- Developer: `dev4@velozity.dev`

Seed data includes:

- 1 admin
- 2 project managers
- 4 developers
- 3 projects
- 5+ tasks per project
- overdue tasks
- pre-existing activity logs
- notifications

## Environment Variables

Example values are available in [.env.example](./.env.example).

Important variables:

- `DATABASE_URL`
- `PORT`
- `CLIENT_ORIGIN`
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`
- `ACCESS_TOKEN_TTL_MINUTES`
- `REFRESH_TOKEN_TTL_DAYS`
- `COOKIE_DOMAIN`
- `NODE_ENV`

## Useful Commands

### Workspace

```bash
npm install
npm run build
```

### Backend

```bash
npm run dev --workspace backend
npm run lint --workspace backend
npm run build --workspace backend
npm run prisma:generate --workspace backend
npm run prisma:push --workspace backend
npm run seed --workspace backend
```

### Frontend

```bash
npm run dev --workspace frontend
npm run lint --workspace frontend
npm run build --workspace frontend
```

## Validation and Error Handling

- All API inputs are validated server-side with `zod`
- All endpoints return structured JSON errors
- Raw stack traces are not exposed to the client

Error format:

```json
{
  "error": {
    "code": "SOME_ERROR_CODE",
    "message": "Human readable message",
    "details": {}
  }
}
```

## Known Limitations

- Presence tracking is in-memory and suitable for a single backend instance only
- Docker startup reseeds for convenience; a production system would separate seed/migration lifecycle
- The UI is intentionally practical and assignment-focused rather than heavily branded
- Prisma schema sync uses `db push` for local simplicity rather than a full migration history

## Hardest Problem Solved

The hardest part was keeping the realtime layer aligned with API authorization rules. Instead of treating WebSockets as a separate permission system, the application persists changes first, applies RBAC and ownership rules in backend services, and only then emits socket events to the correct rooms. That prevents frontend-only hiding and keeps the live feed consistent with what each role is allowed to access.

Missed-event catch-up was handled through the `FeedCursor` table. When a user reconnects or reopens a feed, the backend queries PostgreSQL for up to 20 events newer than that user’s saved cursor. This satisfies the assignment requirement that missed activity must come from the database, not from in-memory socket state.

## Verification Status

Verified locally with:

- backend typecheck
- frontend typecheck
- backend production build
- frontend production build
- Prisma client generation
- Prisma schema sync
- seed execution
- Docker Compose startup
- backend health endpoint
- frontend HTTP reachability

## License

This project was built as an assignment submission.
