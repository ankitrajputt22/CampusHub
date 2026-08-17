# Campus Hub Deployment Plan

Phase 27 defines how to deploy Campus Hub safely from local development to staging and production.

The most important rule is simple: never hardcode production secrets in frontend code, backend code, GitHub workflow files, Dockerfiles, Compose files, or committed environment files. Secrets must come from environment variables, GitHub Secrets, or the hosting provider’s secret manager.

## Architecture overview

Campus Hub is deployed as four main runtime parts:

| Layer | Technology | Responsibility |
| --- | --- | --- |
| Frontend | React, TypeScript, Vite, Nginx static server | Browser UI, route guards, public pages, student/admin/super-admin pages. |
| Backend | Spring Boot, Spring Security, Flyway, JPA | REST APIs, JWT auth, role checks, ownership checks, payments, moderation, trust score. |
| Database | MySQL 8+ | Persistent relational data. |
| Reverse proxy | Nginx | Public entrypoint, `/api` proxying, frontend routing, SSL termination, security headers. |

Supporting services:

- Razorpay for payments.
- SMTP/email provider for email OTP and notifications.
- SMS provider for phone OTP.
- Local filesystem now, Cloudinary/AWS S3 later for production-grade uploads.
- GitHub Actions for CI and gated deployment workflow skeletons.

## Environments

| Environment | Purpose | Example URLs | Credentials |
| --- | --- | --- | --- |
| Local | Developer testing. | Frontend `http://localhost:5173`, backend `http://localhost:8080`, MySQL `localhost:3306`. | Local/test only. |
| Staging | Production-like testing before release. | `https://staging.campushub.com`. | Test DB, Razorpay test keys, test email/SMS/storage. |
| Production | Real users and real transactions. | `https://campushub.com`. | Production DB, live Razorpay, production email/SMS/storage. |

Staging must never use production database or production payment credentials. Production must use HTTPS, restricted CORS, backups, monitoring, and limited logs.

## Repository deployment files

The deployment scaffold includes:

| File | Purpose |
| --- | --- |
| `backend/Dockerfile` | Builds and runs the Spring Boot backend with Java 21. |
| `frontend/Dockerfile` | Builds Vite frontend and serves `dist` through Nginx. |
| `frontend/nginx.conf` | Static frontend server config with React route fallback. |
| `nginx/default.conf` | Reverse proxy for frontend plus `/api` backend traffic. |
| `docker-compose.yml` | Existing local MySQL compose file. |
| `docker-compose.prod.yml` | Production-style compose stack for Nginx, frontend, backend, and private MySQL. |
| `.env.example` | Safe placeholder environment reference. |
| `frontend/.env.example` | Frontend-only public env reference. |
| `.github/workflows/ci.yml` | Runs backend/frontend checks and Docker builds. |
| `.github/workflows/deploy-staging.yml` | Gated staging deployment skeleton. |
| `.github/workflows/deploy-production.yml` | Gated manual production deployment skeleton. |

## Local development

### Option A: normal local development

Start MySQL:

```bash
docker compose up -d
```

Run backend:

```bash
cd backend
mvn spring-boot:run
```

Run frontend:

```bash
cd frontend
npm install
npm run dev
```

Default ports:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:8080`
- Backend API: `http://localhost:8080/api`
- MySQL: `localhost:3306`

### Option B: Docker build check

```bash
docker build -t campushub-backend ./backend
docker build \
  --build-arg VITE_API_BASE_URL=http://localhost:8080/api \
  --build-arg VITE_APP_NAME="Campus Hub" \
  --build-arg VITE_PUBLIC_BASE_URL=http://localhost:5173 \
  --build-arg VITE_RAZORPAY_KEY_ID=rzp_test_placeholder \
  -t campushub-frontend ./frontend
```

## Environment variables

Real `.env`, `.env.local`, `.env.staging`, and `.env.production` files must not be committed. The repository commits only placeholder examples.

### Backend variables currently used by the app

| Variable | Purpose |
| --- | --- |
| `SERVER_PORT` | Backend port, default `8080`. |
| `SPRING_PROFILES_ACTIVE` | `local`, `staging`, or `prod`. |
| `SPRING_DATASOURCE_URL` | MySQL JDBC URL. |
| `SPRING_DATASOURCE_USERNAME` | DB username. |
| `SPRING_DATASOURCE_PASSWORD` | DB password. |
| `JWT_SECRET` | JWT signing secret. Use a strong unique value per environment. |
| `JWT_ACCESS_TOKEN_MINUTES` | Access token lifetime. |
| `JWT_REFRESH_TOKEN_DAYS` | Default refresh token lifetime. |
| `JWT_REMEMBER_ME_REFRESH_TOKEN_DAYS` | Remember Me refresh lifetime. |
| `CORS_ALLOWED_ORIGINS` | Comma-separated trusted frontend origins. |
| `OTP_EXPIRY_MINUTES` | OTP expiry window. |
| `OTP_EXPOSE_DEV_CODES` | Must be `false` outside local/test. |
| `PROFILE_PHOTO_STORAGE_DIRECTORY` | Local profile photo storage path. |
| `LISTING_IMAGE_STORAGE_DIRECTORY` | Local listing image storage path. |
| `SUPPORT_ATTACHMENT_STORAGE_DIRECTORY` | Local support attachment storage path. |
| `CHAT_MAX_MESSAGES_PER_MINUTE` | Chat rate limit. |
| `RAZORPAY_KEY_ID` | Public Razorpay key id, also used by backend checkout response. |
| `RAZORPAY_KEY_SECRET` | Private Razorpay key secret. Backend only. |
| `RAZORPAY_API_BASE_URL` | Razorpay API URL. |
| `RAZORPAY_MOCK_ENABLED` | `true` for local/test mock gateway, `false` for real integration. |

### Provider variables for staging/production wiring

These are placeholders for deployment providers and future service adapters:

- `MAIL_HOST`
- `MAIL_PORT`
- `MAIL_USERNAME`
- `MAIL_PASSWORD`
- `MAIL_FROM`
- `SMS_PROVIDER`
- `SMS_API_KEY`
- `SMS_SENDER_ID`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_REGION`
- `AWS_S3_BUCKET`
- `APP_FRONTEND_URL`
- `APP_BACKEND_URL`

### Frontend variables

Only `VITE_` variables are exposed to the frontend build. Do not place secrets there.

| Variable | Safe? | Purpose |
| --- | --- | --- |
| `VITE_API_BASE_URL` | Public | API base URL, e.g. `https://campushub.com/api`. |
| `VITE_APP_NAME` | Public | Display app name. |
| `VITE_PUBLIC_BASE_URL` | Public | Public frontend URL. |
| `VITE_RAZORPAY_KEY_ID` | Public | Razorpay key id only. |
| `VITE_SUPPORT_EMAIL` | Public | Optional support email shown in UI. |

Never expose `RAZORPAY_KEY_SECRET`, `JWT_SECRET`, DB credentials, SMTP password, SMS API key, Cloudinary API secret, or AWS secret key to frontend.

## Spring Boot profiles

Use:

- `local`
- `staging`
- `prod`

Rules:

- `application.yml` should keep common settings and environment placeholders.
- Profile-specific files may hold safe defaults only.
- Do not put real production secrets into `application-prod.yml`.
- Production should fail fast if required secrets are missing.

## Database deployment

Use MySQL 8+ with InnoDB and `utf8mb4`.

Recommended names:

| Environment | Database |
| --- | --- |
| Local | `campus_hub` or `campushub_local` |
| Staging | `campushub_staging` |
| Production | `campushub_prod` |

Database rules:

- Do not expose MySQL publicly.
- Use a dedicated DB user with minimum required permissions.
- Use separate DBs/users/passwords per environment.
- Enable automated backups in staging/prod.
- Use managed MySQL in production if available.

## Flyway migrations

Migration folder:

```text
backend/src/main/resources/db/migration
```

Local/staging can run migrations automatically on backend startup.

Production migration process:

1. Confirm the exact Git commit/image tag being deployed.
2. Backup production database.
3. Run migrations in a controlled deployment window.
4. Start/restart backend.
5. Check `/api/health` and `/actuator/health`.
6. Run smoke tests.
7. If migration fails, stop rollout and restore backup or forward-fix based on severity.

Avoid destructive migrations. Do not drop columns/tables in production without backup, review, and rollback plan.

## Username migration safety

Because signup requires `username`, existing users must be migrated safely:

1. Add username nullable.
2. Generate temporary unique usernames such as `user_1001`.
3. Verify no duplicates.
4. Add unique index.
5. Make username not null.

Email remains unique and can be any valid email. Do not enforce college email domain matching.

## Docker deployment

### Backend image

`backend/Dockerfile`:

- Uses Maven + Java 21 to build.
- Runs with Java 21 runtime image.
- Exposes port `8080`.
- Reads all secrets from environment variables.

### Frontend image

`frontend/Dockerfile`:

- Uses Node 22 to build Vite app.
- Serves built files using Nginx.
- Exposes port `80`.
- Embeds only public `VITE_` variables at build time.

Build commands:

```bash
docker build -t campushub-backend ./backend
docker build \
  --build-arg VITE_API_BASE_URL=https://campushub.com/api \
  --build-arg VITE_APP_NAME="Campus Hub" \
  --build-arg VITE_PUBLIC_BASE_URL=https://campushub.com \
  --build-arg VITE_RAZORPAY_KEY_ID=rzp_live_xxxxx \
  -t campushub-frontend ./frontend
```

## Production-style Docker Compose

Use:

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

The production compose file:

- Runs MySQL privately with no public port.
- Runs backend behind Nginx.
- Runs frontend as static Nginx service.
- Exposes only ports `80` and `443` through the reverse proxy.
- Stores file uploads in a named volume for self-hosted deployments.

For managed MySQL, update `SPRING_DATASOURCE_URL` to the provider’s private connection string and adapt the compose file to remove/disable the bundled MySQL service.

## Nginx reverse proxy

Production Nginx should:

- Serve the frontend.
- Proxy `/api/*` to backend.
- Redirect HTTP to HTTPS after SSL is configured.
- Support React route refresh through frontend fallback to `index.html`.
- Set security headers.
- Enforce file upload size limits.

Current scaffold:

- `frontend/nginx.conf` handles frontend static files and SPA fallback.
- `nginx/default.conf` proxies `/api` to backend and all other paths to frontend.

For real HTTPS, configure Let’s Encrypt/Certbot or a cloud provider certificate and add a `443` server block.

## HTTPS and cookies

Production must use HTTPS.

Recommended cookie policy for refresh token if/when moved to HttpOnly cookie:

- `HttpOnly=true`
- `Secure=true`
- `SameSite=Lax` or `Strict`
- Domain restricted to Campus Hub domain.

Redirect HTTP to HTTPS. Enable HSTS only after HTTPS is stable.

## CORS

Local:

```text
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

Staging:

```text
CORS_ALLOWED_ORIGINS=https://staging.campushub.com
```

Production:

```text
CORS_ALLOWED_ORIGINS=https://campushub.com,https://www.campushub.com
```

Never use `*` in production.

## File storage

Current local storage:

- Profile photos: `PROFILE_PHOTO_STORAGE_DIRECTORY`
- Listing images: `LISTING_IMAGE_STORAGE_DIRECTORY`
- Support attachments: `SUPPORT_ATTACHMENT_STORAGE_DIRECTORY`

Production recommendation:

- Cloudinary or AWS S3.
- Separate buckets/folders for staging and production.
- Store only URLs/storage keys and metadata in MySQL.
- Validate file type and size.
- Reject executable files.
- Keep provider secrets only on backend/server.

## Razorpay deployment

Local/staging:

- Use Razorpay test key id.
- Use Razorpay test key secret.
- Use mock mode only for local automated tests if needed.

Production:

- Use Razorpay live key id in frontend.
- Use Razorpay live key id and key secret in backend.
- Configure live webhook secret.
- Ensure endpoint is HTTPS-accessible.

Security rules:

- Frontend receives only key id.
- Backend verifies signatures.
- Payment success is trusted only after backend verification or verified webhook.
- Admin must not manually mark payment as `SUCCESS`.
- Full card details are never stored.

Note: the Phase 27 brief references `POST /api/payments/razorpay/webhook`. Before production payment launch, confirm or add a webhook endpoint and raw-body signature verification if not already implemented.

## Email and SMS OTP deployment

Email provider options:

- SMTP
- SendGrid
- Amazon SES
- Mailgun

SMS provider options:

- Any provider that supports OTP delivery and delivery status.

OTP deployment checklist:

- OTP generated only when Verify Email / Verify Phone is clicked.
- OTP is not generated while typing.
- OTP expiry is configured.
- Resend cooldown is configured.
- Attempt limit is configured.
- OTP hash storage is verified.
- OTP values are never logged in staging/prod.
- Provider secrets are not exposed to frontend.

## JWT and authentication deployment

Rules:

- Use a strong random `JWT_SECRET`.
- Use different secrets per environment.
- Rotate immediately if leaked.
- Keep access tokens short-lived.
- Store refresh tokens hashed in DB.
- Prefer HttpOnly refresh cookie in production.
- Do not log JWTs or refresh tokens.

The current app uses `JWT_SECRET`. If the backend later splits access and refresh signing secrets, add separate `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET`.

## Security headers

Recommended headers:

- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy`
- `Strict-Transport-Security` after HTTPS is stable.
- Content Security Policy later, tested carefully with Razorpay checkout.

## CI/CD

### CI

`.github/workflows/ci.yml` runs:

- Frontend install.
- Frontend format check.
- Frontend lint.
- Frontend typecheck.
- Frontend tests.
- Frontend build.
- Backend tests.
- Backend package.
- Docker image build check.

CI should fail if any required check fails.

### Staging deployment

`.github/workflows/deploy-staging.yml` is intentionally gated:

- Runs on manual dispatch.
- Also listens to development branch pushes, but deploy job only runs automatically if repository variable `ENABLE_STAGING_DEPLOY=true`.
- Builds backend/frontend images.
- Contains a handoff step to replace with registry/SSH deployment after secrets and server are configured.

Required future secrets/variables:

- `STAGING_HOST`
- `STAGING_USER`
- `STAGING_SSH_KEY`
- `STAGING_ENV_FILE`
- Registry credentials
- `STAGING_API_BASE_URL`
- `STAGING_PUBLIC_BASE_URL`
- `STAGING_RAZORPAY_KEY_ID`
- `STAGING_SUPPORT_EMAIL`

### Production deployment

`.github/workflows/deploy-production.yml`:

- Manual only.
- Gated by repository variable `ENABLE_PRODUCTION_DEPLOY=true`.
- Runs full backend/frontend checks.
- Builds production images.
- Leaves deployment handoff until backup, registry, server, and smoke-test automation are configured.

Production deployment should require manual approval and should not run automatically on every push.

## GitHub Secrets

Store sensitive values in GitHub Secrets or provider secret storage:

- `STAGING_DB_PASSWORD`
- `PROD_DB_PASSWORD`
- `JWT_SECRET`
- `RAZORPAY_KEY_SECRET`
- `RAZORPAY_WEBHOOK_SECRET`
- `MAIL_PASSWORD`
- `SMS_API_KEY`
- `CLOUDINARY_API_SECRET`
- `AWS_SECRET_ACCESS_KEY`
- `SSH_PRIVATE_KEY`

Never commit these values.

## Server requirements

Production server should have:

- Docker and Docker Compose.
- Nginx if not containerized.
- Firewall configured.
- SSL certificate.
- Backup storage.
- Monitoring/log access.
- Enough disk space for images, logs, uploads, and DB backups.

Ports:

- Public: `80`, `443`.
- Internal only: backend `8080`, MySQL `3306`.

Do not expose MySQL publicly.

## Backup strategy

Backup production database before:

- Major deployment.
- Database migration.
- Schema change.
- High-risk release.

Example:

```bash
mysqldump -u USER -p DB_NAME > backup_YYYYMMDD_HHMM.sql
```

Retention:

- Daily backups for 7 days.
- Weekly backups for 4 weeks.
- Monthly backups later.

Periodically restore backup into staging to prove backups are usable.

## Rollback strategy

Rollback must cover:

- Frontend image/build.
- Backend image.
- Database changes.
- Environment variables.

Rules:

- Keep previous image tags.
- Prefer forward-fix migrations.
- Restore database backup only when necessary and after impact review.
- Avoid destructive migrations.

Recommended tags:

- `latest`
- `staging`
- `production`
- Git commit SHA
- Release version

Rollback example:

```bash
docker compose -f docker-compose.prod.yml up -d
```

Use the previous image tags/env file before running the command.

## Logging

Backend logs should include:

- Request ID.
- Endpoint.
- Timestamp.
- Environment.
- Authenticated user id when safe.
- Important business event.
- Error message and stack trace for server errors.

Do not log:

- Passwords.
- OTP values.
- JWT tokens.
- Refresh tokens.
- Razorpay key secret.
- Card details.
- UPI PIN.
- SMTP/SMS/storage secrets.

Frontend should avoid logging sensitive data and should use production-safe error boundaries.

## Monitoring

Monitor:

- Backend health.
- Database connection.
- Error rate.
- API response time.
- Payment verification/webhook failures.
- OTP delivery failures.
- Email/SMS failures.
- Disk, memory, CPU.
- Database storage.
- Failed login spikes.
- Support ticket spikes.

Tools:

- Spring Boot Actuator.
- Docker logs.
- Cloud provider monitoring.
- Sentry later.
- Prometheus/Grafana later.

Expose only safe actuator endpoints publicly, such as `/actuator/health` and `/actuator/info`.

## Domain and DNS

Recommended simple production setup:

- `campushub.com` serves frontend.
- `campushub.com/api` proxies backend.

DNS:

- `A` record points to server IP.
- Optional `www` CNAME points to root domain.
- Optional `staging.campushub.com` for staging.

If backend is on a separate domain:

- Frontend: `https://campushub.com`
- Backend: `https://api.campushub.com`
- Set `CORS_ALLOWED_ORIGINS=https://campushub.com`

## Public routes

These frontend routes must work on refresh without login:

- `/privacy-policy`
- `/terms-and-conditions`
- `/refund-policy`
- `/safety-guidelines`
- `/contact-support`

Nginx must fallback frontend routes to `index.html`.

## Admin and Super Admin deployment

Frontend route guards:

- `/admin/*`: `ADMIN` or `SUPER_ADMIN`.
- `/super-admin/*`: `SUPER_ADMIN` only.

Backend rules:

- `/api/admin/**`: `ADMIN` or `SUPER_ADMIN`.
- `/api/super-admin/**`: `SUPER_ADMIN` only.

Frontend guards are not enough. Backend role checks must remain enabled in production.

## Post-deployment smoke tests

After every staging or production deployment, verify:

- Frontend loads.
- Backend health returns UP.
- Swagger/OpenAPI loads if enabled.
- Database migration completed.
- Signup page loads.
- Username availability works.
- Email availability works.
- OTP sends only after Verify Email/Phone click.
- Login works.
- Student dashboard loads.
- Marketplace loads.
- Product details loads.
- Sell Item page loads.
- Wishlist works.
- Order creation works in test mode.
- Razorpay test payment verification works in staging.
- Notifications load.
- Support ticket creation works.
- Chat page loads.
- Admin dashboard loads.
- Super Admin dashboard loads.
- Privacy Policy loads.
- Terms and Conditions loads.
- Refund Policy loads.
- Safety Guidelines loads.

Health command:

```bash
curl https://campushub.com/api/health
```

Local equivalent:

```bash
curl http://localhost:8080/api/health
```

Expected:

```json
{
  "success": true,
  "message": "Campus Hub backend is healthy",
  "data": {
    "status": "UP"
  }
}
```

## Production pre-launch checklist

Before production launch:

- All CI checks pass.
- No critical/high bugs are open.
- Production database backup is configured.
- Production environment variables are configured.
- `JWT_SECRET` is strong and production-only.
- Razorpay live keys are configured.
- Razorpay webhook is configured after webhook endpoint is production-ready.
- Email OTP provider is configured.
- SMS OTP provider is configured.
- CORS is restricted to production domains.
- HTTPS is enabled.
- Frontend production build is tested.
- Backend production profile is tested.
- Admin account exists.
- Super Admin account is secured.
- Legal pages are reviewed.
- Safety Guidelines are reviewed.
- Support route works.
- Payment flow is tested with appropriate mode.
- Monitoring is enabled.
- Rollback plan is ready.

## Deployment readiness status

Current repository state after Phase 27:

- Deployment plan exists.
- Dockerfiles exist for backend and frontend.
- Nginx configs exist for frontend SPA and reverse proxy.
- Production-style Compose file exists.
- CI workflow exists.
- Staging/production deployment workflows are scaffolded and gated.
- `.env.example` files contain placeholders only.

Before real production deployment, configure:

- Real hosting target.
- DNS and SSL.
- Real staging/prod secrets.
- Image registry.
- SSH/deploy automation.
- Production storage provider.
- Razorpay webhook endpoint if payment webhooks are required.
- Backup storage and restore test.
