# Campus Hub

Campus Hub is a secure multi-college student marketplace. The repository currently includes working signup and login foundations plus a frontend-only product prototype for the remaining student, admin, super-admin, and policy pages. Prototype marketplace actions use local mock state until their backend modules are implemented.

## Project Structure

```text
.
├── frontend/          # React + TypeScript + Vite application
├── backend/           # Java 21 + Spring Boot Maven application
├── docs/              # Project documentation
├── AGENTS.md          # Working instructions for coding agents
├── README.md
├── .env.example
├── .gitignore
└── docker-compose.yml
```

## Prerequisites

- Node.js 22+ and npm
- Java 21+
- Maven 3.9+
- Docker Desktop or compatible Docker runtime

## Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Useful frontend commands:

```bash
npm run lint
npm run format:check
npm run typecheck
npm run test
npm run build
```

Prototype entry points:

```text
/login                       Working backend-connected login
/signup                      Working backend-connected signup and OTP flow
/student/dashboard           Student workspace and marketplace navigation
/student/marketplace         Searchable mock college marketplace
/admin/dashboard             College administration workspace
/super-admin/dashboard       Platform administration workspace
/about                       Public and policy navigation
```

All student pages are available from the student sidebar. Admin and super-admin pages are available from their respective sidebars. Marketplace, order, payment, review, chat, support, and moderation actions are clearly test-only and do not call unfinished backend modules.

Create `frontend/.env.local` when needed:

```bash
VITE_API_BASE_URL=http://localhost:8080/api
```

## Backend Setup

```bash
cd backend
mvn spring-boot:run
```

For quick signup testing without a running MySQL server:

```bash
cd backend
mvn spring-boot:run -Dspring-boot.run.profiles=local
```

Useful backend commands:

```bash
mvn test
mvn verify
```

Configure secrets and database settings through environment variables. Do not hard-code credentials in source files.

## Docker Setup

Start local MySQL and Redis:

```bash
docker compose up -d
```

Stop services:

```bash
docker compose down
```

Copy `.env.example` to `.env` for local Docker defaults if your shell or tooling loads it automatically. Replace any placeholder values with local-only values and never commit real secrets.

## Environment Variables

See `.env.example` for safe sample values. Required backend variables include database URL, database credentials, JWT secret, and CORS origin. Required frontend variables include the backend API base URL.
