# Campus Hub

Campus Hub is a secure multi-college student marketplace. The current student application includes backend-connected authentication and account recovery, dashboard and profile management, college and cross-college discovery, listings, wishlist, orders, payments, notifications, and completed-order reviews.

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

Supported entry points:

```text
/login                       Working backend-connected login
/signup                      Working backend-connected signup and OTP flow
/student/dashboard           Backend-connected student dashboard
/student/profile             Backend-connected student profile and privacy controls
/student/marketplace         Backend-connected college marketplace
/student/explore-colleges    Cross-college marketplace discovery
/student/my-marketplace      Seller listing management
/student/sell                Create a listing
/student/orders              Buyer and seller order workspace
/student/payments            Razorpay payment history and retry flow
/student/wishlist            Saved listings
/student/reviews             Order-linked seller feedback
/student/notifications       Notification inbox
/about                       Public and policy navigation
```

All supported student pages are available from the student navigation. Unsupported mock-only admin, chat, and settings routes are intentionally not exposed; account privacy and security controls live in the real profile workspace.

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
export JWT_SECRET="$(openssl rand -base64 48)"
mvn spring-boot:run -Dspring-boot.run.profiles=local
```

The local profile uses a file-backed H2 database, exposes OTP codes for local testing, and uses a mock Razorpay gateway unless `RAZORPAY_MOCK_ENABLED=false` is set. These local defaults are not active in the normal application profile.

Useful backend commands:

```bash
mvn test
mvn verify
```

Configure secrets and database settings through environment variables. Do not hard-code credentials in source files.

To test Razorpay Checkout, create test-mode API keys in Razorpay and export
them before starting the backend:

```bash
export RAZORPAY_KEY_ID=rzp_test_your_key_id
export RAZORPAY_KEY_SECRET=your_test_key_secret
mvn spring-boot:run -Dspring-boot.run.profiles=local
```

Only the Key ID is returned to the browser. The Key Secret remains in the
backend and is used to verify the Checkout signature.

## Docker Setup

Create a local environment file, replace its sample credentials and JWT secret, then start MySQL:

```bash
cp .env.example .env
docker compose up -d
```

Stop services:

```bash
docker compose down
```

Docker Compose reads `.env` automatically. Never commit it.

## Environment Variables

See `.env.example` for placeholders. Required backend variables include database credentials and a strong JWT secret. Razorpay Key ID/Secret are required only when the mock gateway is disabled. Production deployments must keep `OTP_EXPOSE_DEV_CODES=false` and `RAZORPAY_MOCK_ENABLED=false`.
