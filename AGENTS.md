# Campus Hub Agent Guide

## Repository Layout

- `frontend/`: React, TypeScript, Vite, Tailwind CSS, React Router, Axios, React Hook Form, and Zod.
- `backend/`: Java 21, Spring Boot, Spring Security, Spring Data JPA, MySQL, Flyway, JWT support, Actuator, and OpenAPI.
- `docs/`: project notes and supporting documentation.

## Conventions

- Inspect existing code before implementing features.
- Preserve valid existing files and avoid unrelated rewrites.
- Use feature-based frontend folders under `frontend/src/features`.
- Use the backend base package `com.campushub`.
- Keep shared backend primitives under `common`, cross-cutting configuration under `config`, and security concerns under `security`.
- Do not implement product modules until requested.

## Commands

Frontend:

```bash
cd frontend
npm run lint
npm run format:check
npm run typecheck
npm run test
npm run build
```

Backend:

```bash
cd backend
mvn test
mvn verify
```

Infrastructure:

```bash
docker compose up -d
docker compose down
```

## Security Rules

- Never hard-code secrets, passwords, JWT keys, database credentials, API keys, or payment keys.
- Read credentials from environment variables.
- Do not commit `.env`, `.env.local`, build outputs, dependency folders, or IDE metadata.
- Backend code must not trust frontend-provided `userId`, `collegeId`, `role`, or payment status.
- Keep CORS scoped to configured local development origins.

## Change Discipline

- Modify only files relevant to the requested task.
- Do not revert or overwrite unrelated user changes.
- Add tests or checks proportional to the change.
