# Campus Hub Testing Plan

Phase 26 defines how Campus Hub should be tested from backend, frontend, API, database, security, payments, chat, support, admin, super-admin, and deployment-readiness perspectives.

The most important testing rule is this: frontend route guards are useful, but they are not security. Every protected backend API must enforce authentication, role checks, ownership checks, validation, and sensitive-field protection.

## Test commands

Run these before marking a feature complete:

```bash
cd backend
mvn test
```

```bash
cd frontend
npm run lint
npm run format:check
npm run typecheck
npm run test
npm run build
```

For local database testing:

```bash
docker compose up -d
curl http://localhost:8080/api/health
```

For API collection testing later:

```bash
newman run CampusHub.postman_collection.json -e CampusHub.local.postman_environment.json
```

Never run destructive tests against production, never use real Razorpay credentials in automated tests, and never print real OTPs, JWT secrets, Razorpay secrets, refresh tokens, or passwords in logs.

## Testing levels

| Level | Main tools | Goal |
| --- | --- | --- |
| Backend unit tests | JUnit 5, Mockito, AssertJ | Validate service rules and edge cases without full application boot. |
| Backend integration tests | Spring Boot Test, MockMvc, Spring Security Test, H2/MySQL | Validate controllers, security, persistence, migrations, and ownership. |
| API tests | Postman, Newman, Swagger/OpenAPI | Validate request/response contracts and role behavior. |
| Frontend unit tests | Vitest | Validate pure functions, session helpers, formatters, and guards. |
| Frontend component tests | React Testing Library, Jest DOM | Validate forms, cards, modals, loading, empty, and error states. |
| E2E tests | Playwright or Cypress | Validate full user journeys across frontend and backend. |
| Security tests | Manual checklist, MockMvc, OWASP ZAP optional | Prove backend authorization and sensitive-field protection. |
| Database tests | Flyway, JPA validation, MySQL test database | Prove constraints, indexes, FK behavior, and migrations. |
| Payment tests | Razorpay test mode/mock gateway | Prove server-side verification and no secret leakage. |
| Regression tests | Existing automated tests + checklist | Ensure old flows stay working after each phase. |
| Smoke tests | curl, browser, Swagger, manual login | Verify a deployment is basically alive and connected. |

## Test environments

| Environment | Purpose | Database |
| --- | --- | --- |
| Local Development | Fast developer testing and UI checks. | Local MySQL or H2 test profile. |
| Test | Automated integration/API tests. | `campushub_test`; safe to reset. |
| Staging | Deployment-like validation. | Separate staging DB, no production data. |
| Production | Real users only. | No destructive or exploratory tests. |

Recommended test database name: `campushub_test`.

## Test data strategy

Create reusable seeded data for:

- Students across the same and different colleges.
- Admin and Super Admin accounts.
- Colleges, categories, listings, wishlist entries.
- Orders in pending, paid, ready, completed, cancelled, and failed-payment states.
- Payments and payment attempts.
- Reviews, reports, moderation actions, notifications.
- Support tickets, replies, attachments, status history.
- Chat conversations, messages, message reports.
- Trust score records and trust score history.

Recommended base users:

| User | Username | Email | College | Role |
| --- | --- | --- | --- | --- |
| Ankit Rajput | `ankit_rajput` | `ankit@gmail.com` | IIT Delhi | STUDENT |
| Rahul Sharma | `rahul_sharma` | `rahul@gmail.com` | IIT Delhi | STUDENT |
| Priya Singh | `priya_singh` | `priya@yahoo.com` | IIT Bombay | STUDENT |
| Campus Admin | `campus_admin` | `admin@campushub.com` | Optional | ADMIN |
| Super Admin | `super_admin` | `superadmin@campushub.com` | Optional | SUPER_ADMIN |

Recommended colleges: IIT Delhi, IIT Bombay, IIT Kanpur, IIT Madras.

Recommended categories: Books, Notes, Electronics, Bicycles, Hostel Essentials, Furniture, Lab Equipment, Stationery, Clothing, Others.

## Existing automated coverage

Current backend test coverage includes:

- Auth signup and account recovery.
- Student dashboard.
- Student profile.
- Marketplace.
- Notifications.
- Reviews.
- Reports and moderation.
- Admin panel.
- Support.
- Chat and chat rate limiting.
- Health endpoint.
- Local demo data seeding.

Current frontend test coverage includes major pages/components for:

- App routing/session.
- Dashboard, profile-linked session behavior.
- Marketplace, product details, sell item, my marketplace, explore colleges.
- Wishlist, orders, payments, reviews, reports.
- Notifications, support, chat.
- Legal pages and safety guidelines.
- Admin dashboard.

## Critical backend security checklist

These tests must pass for every protected module:

- No protected API works without a token.
- Student token cannot access `/api/admin/**`.
- Admin token cannot access `/api/super-admin/**`.
- Suspended or blocked users cannot perform protected actions.
- Student cannot read/update another student’s private profile data.
- Student cannot edit another student’s listing.
- Student cannot view another student’s order, support ticket, or chat.
- Frontend cannot set `role`, `accountStatus`, `trustScore`, `sellerId`, `buyerId`, protected `collegeId`, `orderStatus`, `paymentStatus`, or final `listingStatus`.
- Password hash, raw OTP, raw refresh-token hash, Razorpay secret, and card data never appear in API responses.
- File upload endpoints validate type, size, ownership, and storage path safety.
- Report/support/chat text is safely validated and rendered.
- Rate limiting exists or is planned for OTP, login, username checks, public support, and chat messages.

## Module test plan

### 1. Signup

Current rules:

- Any valid unique email is allowed.
- Email does not need to match selected college domain.
- Username is required, unique, lowercase, and indexed.
- Username supports lowercase letters, numbers, underscore, and single dots.
- Selected college is required for student signup.
- OTP should be generated only after the user clicks Verify Email or Verify Phone, not while typing.

Required test cases:

| ID | Scenario | Expected result |
| --- | --- | --- |
| TC-SIGNUP-001 | Signup with Gmail. | Accepted if unique and valid. |
| TC-SIGNUP-002 | Signup with Yahoo. | Accepted if unique and valid. |
| TC-SIGNUP-003 | Signup with Outlook. | Accepted if unique and valid. |
| TC-SIGNUP-004 | Signup with college email. | Accepted, but not required. |
| TC-SIGNUP-005 | Invalid email format. | Validation error. |
| TC-SIGNUP-006 | Duplicate email. | Conflict/duplicate error. |
| TC-SIGNUP-007 | Available username. | Available response. |
| TC-SIGNUP-008 | Taken username. | Not available response. |
| TC-SIGNUP-009 | Username with spaces. | Rejected. |
| TC-SIGNUP-010 | Uppercase username. | Normalized to lowercase or rejected consistently. Preferred: normalize before save. |
| TC-SIGNUP-011 | Username starts/ends with dot. | Rejected. |
| TC-SIGNUP-012 | Consecutive dots. | Rejected. |
| TC-SIGNUP-013 | Special character such as `@`. | Rejected. |
| TC-SIGNUP-014 | Username shorter than 3 or longer than 30. | Rejected. |
| TC-SIGNUP-015 | Missing selected college. | Rejected. |
| TC-SIGNUP-016 | Enter email without clicking Verify Email. | No OTP API call. |
| TC-SIGNUP-017 | Click Verify Email. | OTP generated/sent and email OTP UI enabled. |
| TC-SIGNUP-018 | Enter phone without clicking Verify Phone. | No OTP API call. |
| TC-SIGNUP-019 | Click Verify Phone. | OTP generated/sent and phone OTP UI enabled. |
| TC-SIGNUP-020 | Valid form with required verification. | Account becomes active with username, email, phone, college, and verification flags. |

Backend checks:

- `POST /api/auth/signup/start` does not accept duplicate email/phone/username.
- `POST /api/auth/signup/email/verify-otp` rejects expired, wrong, reused, or over-attempted OTP.
- `POST /api/auth/signup/complete` requires both email and phone verification.
- Password is hashed; OTP is hashed.

### 2. Login and session management

Required tests:

- Valid email/password returns access token and user context.
- Unknown email and wrong password show generic failure.
- Password hash is never returned.
- Pending, suspended, blocked, or deactivation-requested users cannot access protected flows according to account policy.
- Remember Me changes refresh token expiry duration.
- Refresh with valid token returns new access token.
- Refresh with expired/revoked/unknown token fails.
- Logout revokes current refresh token.
- Logout all devices revokes all refresh tokens for current user.
- Failed login attempts are tracked.
- Account lockout triggers after configured failures.

### 3. Role-based authorization

| User/token | Allowed | Must be blocked |
| --- | --- | --- |
| Unauthenticated | Public APIs only. | Student, Admin, Super Admin APIs. |
| STUDENT | `/api/student/**`, `/api/user/**`, `/api/listings/**`, `/api/wishlist/**`, `/api/orders/**`, `/api/payments/**`, `/api/reviews/**`, `/api/reports/**`, `/api/support/**`, `/api/chats/**`. | `/api/admin/**`, `/api/super-admin/**`. |
| ADMIN | `/api/admin/**`. | `/api/super-admin/**`. |
| SUPER_ADMIN | `/api/super-admin/**` and admin APIs where allowed. | Student-owned actions unless separately authenticated as a student. |

Expected backend results:

- Missing token: `401`.
- Valid token with wrong role: `403`.
- Valid token but no ownership: `403` or privacy-safe `404`.

### 4. Student dashboard

Tests:

- Loads for active verified student.
- Uses user id and college id from JWT/database.
- Latest listings show only current college.
- Blocked, deleted, sold, inactive, and under-review listings are not shown as active opportunities.
- Stats, unread notifications, profile completion, trust score, and recent activity are accurate.
- Handles expired session, backend error, empty latest listings, and empty notifications.

### 5. Profile and privacy

Tests:

- Student can view own profile.
- Student can update editable fields only.
- Student cannot update email, phone, role, account status, college, or trust score through profile APIs.
- Profile photo accepts valid images and rejects invalid type/oversized files.
- Public profile respects privacy settings.
- Hostel/campus area is private by default.
- Change password validates current password, new password strength, and confirmation.
- Deactivation request creates lifecycle request and does not hard-delete user.

### 6. Settings

Tests:

- Settings load only for logged-in user.
- Backend uses JWT user id; frontend does not send `userId`.
- Notification preferences update correctly.
- Security/payment-critical alerts cannot be fully disabled if policy requires them.
- Privacy settings update and immediately affect public profile.
- Logout all devices invalidates old refresh tokens.

### 7. Marketplace and product details

Tests:

- My College Marketplace shows active listings only from the user’s college.
- Search, category, price, condition, pickup location, negotiable, seller trust, posted date, sorting, and pagination work.
- Explore Other Colleges shows selected target college without changing the user’s own college.
- Product details show seller info, trust score, wishlist state, report action, and buy eligibility.
- Own listing cannot be bought or wishlisted.
- Sold, under-review, blocked, deleted, and inactive listings are not buyable.
- Other-college listing cannot be accessed through own-college endpoints.

Security checks:

- Frontend cannot bypass college scope by changing query/body values.
- Backend validates listing visibility and user permissions on every details/action endpoint.

### 8. Sell Item and My Marketplace

Sell item tests:

- Active verified student can create listing.
- Backend sets seller id and college id.
- Title, description, price, category, condition, pickup location, negotiable flag, quantity, and notes validation work.
- At least one image is required if product policy requires it.
- Maximum image count, size, and type limits are enforced.
- Suspended/blocked users cannot create listings.

My Marketplace tests:

- Seller sees only own listings.
- Owner can edit, mark sold, mark inactive, reactivate, and soft-delete eligible listings.
- Non-owner cannot edit or change lifecycle state.
- Deleted listing is hidden from public marketplace.
- Sold listing remains visible in My Marketplace but is not buyable.
- Filters by status/search/category work.

### 9. Wishlist

Tests:

- Student can wishlist another user’s active listing.
- Student cannot wishlist own listing.
- Duplicate wishlist entry is blocked by service and database unique constraint.
- Remove wishlist works and count updates.
- Sold/deleted/blocked listing appears as unavailable or hidden according to UI policy.
- Search and filters work.

Database check: `UNIQUE(user_id, listing_id)`.

### 10. Orders

Tests:

- Buyer can create order from active listing.
- Buyer cannot create order for own, sold, blocked, deleted, inactive, or under-review listing.
- Amount, buyer, seller, and listing are set by backend.
- Order starts in pending-payment flow.
- Buyer sees own purchase orders.
- Seller sees own sales orders.
- Unrelated user cannot view order.
- Buyer can cancel eligible unpaid order.
- Seller can mark paid order ready for pickup.
- Buyer can confirm pickup.
- Completed order is created only after valid lifecycle transitions.

Security checks:

- Frontend cannot set `orderStatus`, `paymentStatus`, amount, buyer, or seller.

### 11. Razorpay payments

Tests:

- Checkout/order is created through backend.
- Razorpay order id is stored.
- Frontend receives Razorpay `keyId`, never key secret.
- Valid Razorpay signature marks payment verified.
- Invalid signature fails and does not mark paid.
- Payment success on frontend alone is not trusted.
- Order becomes paid only after backend verification.
- Listing becomes sold only after verified payment when applicable.
- Payment failure records failure reason safely.
- Retry works only for eligible orders.
- Payment history shows participant-only records.
- Duplicate verification/failure events are idempotent or safely rejected.

Security checks:

- No full card data stored.
- No Razorpay secret returned.
- Admin cannot manually force payment success.

### 12. Reviews and ratings

Tests:

- Buyer can review only completed order.
- Pending, cancelled, refunded, or unrelated order cannot be reviewed.
- One review per order.
- Rating must be 1-5.
- Message required and max length enforced.
- Review appears on seller profile.
- Rating summary updates.
- Hidden review does not count publicly.
- User cannot review own sale.

### 13. Notifications

Tests:

- Notifications are created for order, payment, review, report, support, chat, and trust score events.
- Unread count is accurate.
- Mark one read works.
- Mark all read works.
- User sees only own notifications.
- Action URL routes correctly.
- Frontend cannot create trusted notifications.

### 14. Reports and moderation

Student tests:

- Report listing/user/review works.
- Duplicate report is blocked.
- Self-report is blocked where not allowed.
- New report starts as `PENDING`.
- Student sees only own reports.

Admin tests:

- Admin can view report queue and report details.
- Admin can mark under review, reject, close, and take moderation action.
- Admin can block/restore listing, hide/restore review, warn/suspend/block/reactivate user.
- Moderation action log is created.
- Notification is created after relevant action.
- Pending/rejected report alone does not reduce trust score.
- Confirmed admin action can apply trust penalty.

Privacy/security:

- Reported user cannot see reporter private details.
- Admin identity is derived from JWT.

### 15. Admin panel

Tests:

- Admin dashboard loads and stats are correct.
- Users, listings, reviews, orders, payments, reports, and audit logs lists work with filters and pagination.
- Admin can perform allowed moderation actions.
- Student and unauthenticated users cannot access admin panel or APIs.
- Suspended admin cannot access admin panel.
- Admin cannot access Super Admin APIs.
- Admin cannot manually mark payment success.
- Admin actions create audit logs.

### 16. Contact support

Student support tests:

- Logged-in user can create ticket.
- Ticket uses JWT user id.
- User sees only own tickets.
- User can reply to and close own ticket.
- User cannot view another user’s ticket.
- Attachments validate type and size.

Public support tests:

- Public contact form works without JWT.
- Guest name/email stored safely.
- Email validation works.
- Public endpoint is rate-limited.
- Internal ticket data is not exposed publicly.

Admin support tests:

- Admin can list, view, reply, update status, and add internal notes.
- Internal notes are not visible to students.
- Status history is created.

### 17. Static legal and safety pages

Routes:

- `/privacy-policy`
- `/terms-and-conditions`
- `/refund-policy`
- `/safety-guidelines`
- `/contact-support`

Tests:

- Publicly accessible.
- No login required.
- Refresh works.
- Responsive layout works.
- Header/footer/legal links work.
- Login/signup legal links work.
- Safety links appear where expected: Sell Item, Product Details, Support, footer, and payment/helper areas.
- No private user data is shown.

### 18. Chat system

Tests:

- Buyer can contact seller from Product Details.
- Seller can reply.
- Conversation is unique for buyer + seller + listing.
- Buyer cannot message self or own listing.
- Blocked/deleted/inactive/under-review listing cannot start chat.
- Only participants can view conversation and messages.
- Only participants can send, mark read, archive, or unarchive.
- Unread count updates.
- Message notification is created.
- Message report works and duplicate report is blocked.
- Message length validation works; empty message is rejected.
- Cross-college chat is disabled if version policy requires it.

Security:

- Frontend does not send buyer/seller/user ids.
- Admin cannot read all chats by default.
- Reported message context is limited for moderation.

### 19. Campus Trust Score

Tests:

- Initial score after full verification is 30.
- Email verification gives +10.
- Phone verification gives +10.
- Selected college gives +10.
- Any valid email can receive email verification points.
- College email domain is not required.
- Profile completion increases score.
- Completed orders increase score; payment success alone does not.
- Visible reviews affect rating score; hidden reviews do not.
- Pending/rejected reports do not reduce score.
- Confirmed moderation action applies penalty.
- Blocked account score is zeroed or frozen according to policy.
- Score never goes below 0 or above 100.
- Trust level boundaries are correct:
  - 0-40: New / Low Trust
  - 41-70: Average Trust
  - 71-90: Trusted Student
  - 91-100: Campus Verified Seller
- Trust score history records changes.
- Frontend cannot update score/components.

### 20. Super Admin panel

Tests:

- Super Admin dashboard loads.
- Super Admin can create, suspend, reactivate, and remove admin role.
- Super Admin can add, edit, activate, deactivate, and block colleges.
- Super Admin can manage categories and reorder them.
- Super Admin can view audit logs.
- Super Admin can update platform settings.
- Admin and student cannot access Super Admin panel/APIs.
- Last active Super Admin cannot be disabled.
- Sensitive actions require UI confirmation.
- Every action creates audit log.
- No secrets/passwords/Razorpay secret are exposed.

## Database testing

Constraint tests:

- `users.email` unique.
- `users.username` unique.
- `users.phone_number` unique.
- `wishlist_items(user_id, listing_id)` unique.
- `seller_reviews.order_id` unique.
- `chat_conversations(buyer_id, seller_id, listing_id)` unique.
- `chat_message_reports(message_id, reporter_id)` unique.
- `trust_scores.user_id` unique.

Foreign key tests:

- Listing requires valid seller and college.
- Order requires valid buyer, seller, and listing.
- Payment requires valid order.
- Review requires valid order.
- Notification requires valid recipient.
- Conversation requires valid participants/listing/order where applicable.
- Support replies require valid ticket.

Soft-delete/status tests:

- Deleted listing is not public.
- Blocked user cannot login.
- Inactive college is not shown for signup.
- Inactive category is not usable for new listings.

Migration tests:

- Flyway applies all migrations to an empty database.
- Existing users get safe unique usernames during migration.
- NOT NULL and UNIQUE constraints apply safely.
- Phase 24 canonical views/tables exist.

## API testing with Postman

Create folders:

- Auth
- Signup OTP
- Dashboard
- Profile
- Settings
- Listings
- Wishlist
- Orders
- Payments
- Explore Colleges
- Reviews
- Notifications
- Reports
- Support
- Chat
- Trust Score
- Admin
- Super Admin

Environment variables:

- `baseUrl`
- `accessToken`
- `refreshToken`
- `studentToken`
- `adminToken`
- `superAdminToken`
- `userId`
- `listingId`
- `orderId`
- `paymentId`
- `reviewId`
- `reportId`
- `supportTicketId`
- `conversationId`

Each Postman request should assert:

- HTTP status code.
- `success` field.
- Required response fields.
- Validation errors for bad input.
- Missing token behavior.
- Wrong-role behavior.
- Ownership restrictions.

## Frontend testing

Component/page tests should cover:

- Signup form, username validation, OTP buttons.
- Login form and password recovery.
- Dashboard stats/cards.
- Profile and settings forms.
- Listing card, product details, sell item form.
- Wishlist, orders, payment status display.
- Review form and report modal.
- Notification bell/card/page.
- Support ticket form and details.
- Chat message input and conversation list.
- Trust score card/history.
- Admin and Super Admin tables/forms.
- Legal and safety pages.

Frontend behavior checks:

- Buttons disabled until valid.
- Loading, error, success, and empty states show correctly.
- Form validation messages are clear.
- Protected frontend routes redirect unauthenticated users.
- Role-based frontend routes hide inaccessible pages.
- Responsive layouts work on mobile, tablet, and desktop.

## End-to-end test flows

Critical E2E flows:

1. Signup with Gmail + username + manual OTP.
2. Login with email/password.
3. Complete profile and privacy settings.
4. Create listing with image.
5. Browse own-college marketplace.
6. Wishlist another student’s listing.
7. Product Details → create order.
8. Mock Razorpay success and verify payment server-side.
9. Seller marks ready for pickup.
10. Buyer confirms pickup.
11. Buyer writes review.
12. Trust score updates.
13. Notification appears.
14. Student reports listing.
15. Admin reviews report and takes action.
16. Student creates support ticket.
17. Buyer and seller chat.
18. Admin panel access works for admin only.
19. Super Admin panel access works for super admin only.
20. Legal and safety public pages are accessible.

## Performance testing

Basic targets for local/staging:

- Common page APIs return under 500ms with normal seeded data.
- List APIs are paginated.
- Marketplace filters use indexes.
- Notifications unread count is fast.
- Chat messages are paginated.
- Admin tables are paginated.
- Dashboard stats do not perform excessive queries.
- No endpoint returns huge unpaginated data.

Suggested checks:

- Seed 500+ listings across colleges and test marketplace response time.
- Seed 1,000+ notifications for one user and test unread count/list pagination.
- Seed 1,000+ chat messages and test message pagination.
- Test admin list filters with realistic data.

## Regression checklist

Run regression after every phase or large fix:

- Signup amendments still work.
- Login/session still work.
- Role access not broken.
- Public pages not accidentally protected.
- Student private data not leaked.
- Marketplace browse/details/sell/edit still work.
- Orders and payments still work.
- Reports/moderation still work.
- Admin actions still audit.
- Support and chat still work.
- Trust score still calculated correctly.
- Phase 24 migrations still apply cleanly.
- Phase 25 API documentation still matches routes.

## Deployment smoke testing

After deploying to staging:

```bash
curl http://localhost:8080/api/health
```

Also verify:

- Frontend loads.
- Backend health is UP.
- Database connection works.
- Swagger loads at `/swagger-ui.html`.
- OpenAPI loads at `/v3/api-docs`.
- Signup page loads.
- Login works.
- Protected route redirects when unauthenticated.
- Student dashboard loads after login.
- Marketplace loads.
- Legal pages load.
- Safety page loads.
- Admin login works.
- Super Admin login works.
- File upload works.
- Payment test mode works.
- OTP service works if configured.
- Required environment variables are present.

## Bug report template

```text
Title:
Module:
Environment:
Steps to Reproduce:
1.
2.
3.
Expected Result:
Actual Result:
Screenshots / Logs:
Severity: LOW / MEDIUM / HIGH / CRITICAL
Priority: LOW / MEDIUM / HIGH / URGENT
Assigned To:
Status: OPEN / IN_PROGRESS / FIXED / VERIFIED / CLOSED
```

## Test case template

```text
Test Case ID:
Module:
Scenario:
Preconditions:
Steps:
1.
2.
3.
Expected Result:
Actual Result:
Status: PASS / FAIL
Notes:
```

## Pass/fail exit criteria

Phase 26 testing is considered complete when:

- Signup amendment tests pass.
- Authentication and refresh-token tests pass.
- Student flows pass.
- Marketplace, product details, sell item, wishlist, orders, payments, and reviews pass.
- Reports/moderation pass.
- Support flow passes.
- Chat basic flow passes.
- Trust score calculations pass.
- Admin and Super Admin access rules pass.
- Static legal/safety pages pass.
- Database constraints and migrations pass.
- Critical security tests pass.
- No `CRITICAL` or `HIGH` bugs remain open.

## What not to include in tests

Do not add:

- Production credentials.
- Real Razorpay secret.
- Real JWT secret.
- Real user private data.
- Hardcoded production OTPs.
- Raw refresh tokens in logs.
- New feature requirements beyond existing phases.
- New schema beyond Phase 24.
- New API definitions beyond Phase 25.
