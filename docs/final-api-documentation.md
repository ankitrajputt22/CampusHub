# Campus Hub Final REST API Documentation

Phase 25 documents the REST contract for the current Campus Hub backend. The API base path is `/api`; for local development the recommended base URL is `http://localhost:8080/api`.

All JSON endpoints use:

```http
Content-Type: application/json
Authorization: Bearer <access_token>
```

File upload endpoints use `multipart/form-data`. The standard wrapper is:

```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": {}
}
```

Error responses use the same wrapper with `success: false`, a message, optional field errors, and a timestamp. Common status codes are `200`, `400`, `401`, `403`, `404`, `409`, `422`, `429`, and `500`.

## Access levels

| Access | Rule |
| --- | --- |
| Public | No JWT required. Public forms and availability checks should be rate-limited. |
| Authenticated | Any valid JWT. Used by notifications and attachment access where service-level ownership checks apply. |
| Student | JWT with `STUDENT` role. |
| Admin | JWT with `ADMIN` or `SUPER_ADMIN` role. |
| Super Admin | JWT with `SUPER_ADMIN` role only. |

## Backend-controlled fields

Frontend must never send or control final values for `userId`, `sellerId`, `buyerId`, own-college `collegeId`, `role`, `accountStatus`, `listingStatus`, `orderStatus`, `paymentStatus`, `trustScore`, moderation actor, or audit actor. The backend derives these from JWT, database relationships, and server-side payment/moderation logic.

## Pagination, filtering, and sorting

List APIs commonly support `page`, `size`, and `sortBy`. Defaults vary by module, but the standard contract is zero-based pages and a practical maximum size of `100`. Filters are module-specific and documented below. Invalid filters should return `400`; unauthorized cross-user or cross-college access should return `403` or `404` depending on the privacy-safe behavior.

## Public APIs

### Health

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/api/health` | Returns backend health `{ "status": "UP" }`. |
| GET | `/actuator/health` | Spring actuator health. |
| GET | `/actuator/info` | Spring actuator info. |
| GET | `/swagger-ui/**` | Generated Swagger UI. |
| GET | `/v3/api-docs/**` | Generated OpenAPI metadata. |

### Colleges for signup

#### GET `/api/colleges/search`

Access: Public.

Query parameters:

| Name | Required | Notes |
| --- | --- | --- |
| `keyword` | No | Searches active colleges by name/code/location. |

Response data: list of college summaries with `id`, `name`, `code`, location, and status-safe signup fields.

Security rules: only active/signup-safe college options should be shown. Email domain matching is not required for signup.

### Auth and signup

#### POST `/api/auth/check-email`

Access: Public.

Request body:

```json
{ "value": "ankit@example.com" }
```

Response data:

```json
{ "available": true }
```

Validation: valid non-blank email value. Possible errors: `400`, `409`, `429`.

#### POST `/api/auth/check-phone`

Access: Public.

Request body:

```json
{ "value": "+919876543210" }
```

Response data:

```json
{ "available": true }
```

Validation: non-blank phone value; service validates uniqueness.

#### GET `/api/auth/check-username`

Access: Public.

Query parameters:

| Name | Required | Notes |
| --- | --- | --- |
| `username` | Yes | Lowercase username candidate. |

Response data:

```json
{
  "available": true,
  "message": "Username is available"
}
```

Validation: 3-30 chars, lowercase letters/numbers/underscore/dot, unique. Rate-limited by IP.

#### POST `/api/auth/signup/start`

Access: Public.

Purpose: creates a pending signup user and issues email/phone OTPs. This is the implemented signup entry point; there is no single `POST /api/auth/signup` endpoint in the current backend.

Request body:

```json
{
  "fullName": "Ankit Rajput",
  "username": "ankit_rajput",
  "collegeId": 1,
  "email": "ankit@example.com",
  "password": "Campus@123",
  "confirmPassword": "Campus@123",
  "department": "Computer Science",
  "customDepartment": null,
  "yearOfStudy": "2nd Year",
  "customYearOfStudy": null,
  "rollNumber": "CS2026001",
  "course": "B.Tech",
  "customCourse": null,
  "phoneNumber": "+919876543210",
  "hostelOrCampusArea": "Hostel A",
  "profilePhotoFileName": null
}
```

Response data:

```json
{
  "userId": 7,
  "accountStatus": "PENDING_VERIFICATION",
  "otpExpiresInSeconds": 600,
  "resendAfterSeconds": 60,
  "devOtpCodes": null
}
```

Validation: required name/username/college/email/password/department/year/course/phone; password complexity; matching confirmation; active college; unique email, phone, username. Email can be any valid unique email and does not need to match a college domain.

Security rules: role is always created by backend as student; account status is backend-controlled; passwords are hashed.

#### POST `/api/auth/signup/email/send-otp`

Access: Public.

Request body:

```json
{ "userId": 7 }
```

Response data: `userId`, `channel`, `expiresInSeconds`, `resendAfterSeconds`, optional `devOtp`.

Security rules: OTP is stored as a hash; production responses must not expose OTP values.

#### POST `/api/auth/signup/email/verify-otp`

Access: Public.

Request body:

```json
{ "userId": 7, "otp": "123456" }
```

Response data:

```json
{ "userId": 7, "emailVerified": true, "phoneVerified": false }
```

Validation: 6-digit OTP, not expired, attempts remaining.

#### POST `/api/auth/signup/phone/send-otp`

Access: Public. Same contract as email OTP resend, but for phone.

#### POST `/api/auth/signup/phone/verify-otp`

Access: Public. Same contract as email OTP verification, but for phone.

#### POST `/api/auth/signup/complete`

Access: Public.

Request body:

```json
{ "userId": 7 }
```

Response data:

```json
{ "userId": 7, "accountStatus": "ACTIVE", "trustScore": 30 }
```

Validation: email and phone must be verified. Trust score is initialized by backend.

#### Legacy signup OTP endpoints

| Method | Endpoint | Body | Purpose |
| --- | --- | --- | --- |
| POST | `/api/auth/send-email-otp` | `{ "userId": 7 }` | Legacy email OTP resend. |
| POST | `/api/auth/send-phone-otp` | `{ "userId": 7 }` | Legacy phone OTP resend. |
| POST | `/api/auth/verify-signup-otp` | `{ "userId": 7, "emailOtp": "123456", "phoneOtp": "123456" }` | Legacy combined OTP verification and activation. |

#### POST `/api/auth/login`

Access: Public.

Request body:

```json
{
  "email": "ankit@example.com",
  "password": "Campus@123",
  "rememberMe": true
}
```

Response data:

```json
{
  "accessToken": "jwt_access_token",
  "refreshToken": "refresh_token",
  "user": {
    "id": 7,
    "fullName": "Ankit Rajput",
    "email": "ankit@example.com",
    "collegeId": 1,
    "collegeName": "Lokmata Devi Ahilya Bai Holkar Rajkiya Engineering College, Mainpuri",
    "role": "STUDENT",
    "accountStatus": "ACTIVE",
    "trustScore": 30
  }
}
```

Validation: valid email/password, active verified account, lockout policy. Possible errors: `400`, `401`, `403`, `423`-style lock message via `400/403`, `429`.

Security rules: password hash is never returned; login attempts are logged; refresh token is stored hashed server-side. Prefer HttpOnly cookies in production even though the current JSON response includes a refresh token for local development.

#### POST `/api/auth/refresh`

Access: Public with valid refresh token.

Request body:

```json
{ "refreshToken": "refresh_token" }
```

Response data:

```json
{ "accessToken": "new_jwt_access_token" }
```

Security rules: raw refresh token is compared via stored token hash; revoked/expired tokens fail with `401`.

#### POST `/api/auth/logout`

Access: Public with refresh token.

Request body:

```json
{ "refreshToken": "refresh_token" }
```

Purpose: revokes one refresh token.

#### POST `/api/auth/logout-all-devices`

Access: Authenticated.

Purpose: revokes all refresh tokens for the authenticated user. The user id comes from JWT.

#### Password reset

| Method | Endpoint | Access | Body | Response data |
| --- | --- | --- | --- | --- |
| POST | `/api/auth/password-reset/request` | Public | `{ "email": "ankit@example.com" }` | `requestId`, expiry, resend delay, optional local `devOtp` |
| POST | `/api/auth/password-reset/verify` | Public | `{ "requestId": "...", "otp": "123456" }` | `requestId`, `resetToken`, expiry |
| POST | `/api/auth/password-reset/complete` | Public | `{ "requestId": "...", "resetToken": "...", "newPassword": "Campus@123", "confirmPassword": "Campus@123" }` | `null` |

Security rules: responses should avoid unsafe account enumeration; OTP and reset token expiry are enforced.

## Student APIs

### Dashboard

#### GET `/api/student/dashboard`

Access: Student.

Response data: dashboard summary including profile completion, marketplace stats, orders, wishlist, notifications, and recent activity.

Security rules: user id and college context are derived from JWT.

### Profile

| Method | Endpoint | Access | Purpose |
| --- | --- | --- | --- |
| GET | `/api/user/profile` | Student | Load authenticated student profile. |
| PUT | `/api/user/profile` | Student | Update editable profile fields. |
| POST | `/api/user/profile/photo` | Student | Upload profile photo as `multipart/form-data` field `photo`. |
| GET | `/api/user/profile/photo/content/{fileName}` | Public | Serve profile photo content. |
| PUT | `/api/user/privacy-settings` | Student | Update profile visibility settings. |
| POST | `/api/user/change-password` | Student | Change current password. |
| POST | `/api/user/deactivate-request` | Student | Submit account deactivation request. |
| GET | `/api/user/public-profile/{userId}` | Public by route, privacy-filtered by service | Load public seller profile. |
| GET | `/api/user/profile-summary` | Student | Load compact current-user profile summary. |

Profile update body:

```json
{
  "fullName": "Ankit Rajput",
  "bio": "CSE student selling verified campus items.",
  "hostelArea": "Hostel A",
  "department": "Computer Science",
  "course": "B.Tech",
  "yearOfStudy": "2nd Year",
  "rollNumber": "CS2026001",
  "linkedinUrl": "https://linkedin.com/in/example",
  "githubUrl": "https://github.com/example"
}
```

Privacy settings body:

```json
{
  "showBio": true,
  "showLinkedin": false,
  "showGithub": false,
  "showHostelArea": false,
  "showDepartment": true,
  "showYearOfStudy": true
}
```

Change password body:

```json
{
  "currentPassword": "Campus@123",
  "newPassword": "Campus@456",
  "confirmPassword": "Campus@456"
}
```

Security rules: email, role, account status, trust score, and college are not editable from profile APIs. Public profile responses must honor privacy settings.

### Marketplace listings

#### GET `/api/listings/my-college`

Access: Student.

Purpose: browse listings in the authenticated student’s own college.

Query parameters: `search`, `category`, `minPrice`, `maxPrice`, `condition`, `pickupLocation`, `negotiable`, `postedDate`, `minSellerTrust`, `sortBy`, `page`, `size`.

Security rules: own-college `collegeId` is derived from JWT, not query/body.

#### GET `/api/listings/explore`

Access: Student.

Purpose: browse another college’s marketplace.

Required query parameter: `collegeId`.

Optional query parameters: same filters as `/my-college`.

Security rules: backend validates the requested college, listing visibility, and cross-college buying rules.

#### GET `/api/listings/{listingId}` and GET `/api/listings/my-college/{listingId}`

Access: Student.

Purpose: load product details for an own-college listing.

Path parameters: `listingId`.

Security rules: service validates college visibility and computes `canBuy`, `canReport`, `ownListing`, and `wishlisted`.

#### GET `/api/listings/explore/{listingId}`

Access: Student.

Purpose: load product details for an explored college listing.

#### GET `/api/listings/my`

Access: Student.

Purpose: seller workspace / My Marketplace.

Query parameters: `search`, `status`, `category`, `minPrice`, `maxPrice`, `condition`, `pickupLocation`, `postedDate`, `sortBy`, `page`, `size`.

Security rules: seller id is derived from JWT.

#### GET `/api/listings/my/stats`

Access: Student.

Purpose: seller listing statistics.

#### GET `/api/listings/my/{listingId}`

Access: Student.

Purpose: load seller-owned listing details for editing.

#### POST `/api/listings`

Access: Student.

Content type: `multipart/form-data`.

Parts:

| Part | Required | Notes |
| --- | --- | --- |
| `listing` | Yes | JSON `CreateListingRequest`. |
| `images` | Yes | One or more image files. |

Listing JSON:

```json
{
  "title": "Engineering Mathematics Book",
  "category": "Books",
  "description": "Good condition book for first year students.",
  "price": 350,
  "condition": "GOOD",
  "pickupLocation": "Library gate",
  "negotiable": true,
  "availableQuantity": 1,
  "additionalNotes": "Can meet after 4 PM."
}
```

Validation: title max 180, description max 2000, price positive, condition valid, pickup location max 160, quantity 1-50, additional notes max 500, image limits enforced by service.

Security rules: seller id and college id are derived from JWT. Listing status is assigned by backend.

#### PUT `/api/listings/{listingId}`

Access: Student.

Purpose: update seller-owned listing. Same multipart contract as create; `images` is optional.

Security rules: only the listing owner can update; blocked/deleted/sold listings are lifecycle-limited.

#### Listing lifecycle actions

| Method | Endpoint | Access | Purpose |
| --- | --- | --- | --- |
| PATCH | `/api/listings/{listingId}/mark-sold` | Student | Owner marks listing sold. |
| PATCH | `/api/listings/{listingId}/mark-inactive` | Student | Owner pauses listing. |
| PATCH | `/api/listings/{listingId}/reactivate` | Student | Owner reactivates eligible listing. |
| DELETE | `/api/listings/{listingId}` | Student | Owner soft-deletes listing. |

Security rules: frontend does not send listing status; endpoint action determines allowed transition.

#### GET `/api/listings/images/{fileName}`

Access: Public.

Purpose: serve listing image content.

### Wishlist

| Method | Endpoint | Access | Purpose |
| --- | --- | --- | --- |
| GET | `/api/wishlist` | Student | Load wishlist with filters. |
| GET | `/api/wishlist/count` | Student | Load wishlist count. |
| POST | `/api/wishlist/{listingId}` | Student | Add listing to wishlist. |
| DELETE | `/api/wishlist/{listingId}` | Student | Remove listing from wishlist. |

Wishlist filters: `search`, `category`, `minPrice`, `maxPrice`, `condition`, `status`, `minSellerTrust`, `savedDate`, `sortBy`, `page`, `size`.

Security rules: user id is derived from JWT. Unique duplicate wishlist entries return conflict-safe behavior.

### Orders

| Method | Endpoint | Access | Purpose |
| --- | --- | --- | --- |
| POST | `/api/orders/listings/{listingId}` | Student | Create a Campus Hub order without immediate Razorpay checkout. |
| POST | `/api/orders/create-from-listing/{listingId}` | Student | Create Campus Hub order and Razorpay checkout. |
| GET | `/api/orders/buyer` | Student | Buyer orders. |
| GET | `/api/orders/seller` | Student | Seller orders. |
| GET | `/api/orders/{orderId}` | Student | Order details for buyer/seller participant. |
| PATCH | `/api/orders/{orderId}/cancel` | Student | Buyer/seller allowed cancel transition. |
| PATCH | `/api/orders/{orderId}/ready-for-pickup` | Student | Seller marks paid order ready. |
| PATCH | `/api/orders/{orderId}/confirm-pickup` | Student | Buyer confirms pickup/completion. |

Order list filters: `search`, `status`, `paymentStatus`, `category`, `minPrice`, `maxPrice`, `dateRange`, `sortBy`, `page`, `size`.

Security rules: buyer and seller are derived from JWT and listing. Amount is copied from listing server-side. Frontend does not set order or payment status.

### Razorpay payments

| Method | Endpoint | Access | Purpose |
| --- | --- | --- | --- |
| POST | `/api/payments/razorpay/verify` | Student | Verify successful Razorpay payment server-side. |
| POST | `/api/payments/razorpay/retry/{orderId}` | Student | Create a retry checkout for eligible failed/pending order. |
| POST | `/api/payments/razorpay/failure` | Student | Record Razorpay failure callback/client result. |
| GET | `/api/payments/my` | Student | Payment history. |
| GET | `/api/payments/{paymentId}` | Student | Payment details for participant. |

Verify request:

```json
{
  "campusHubOrderId": 101,
  "razorpayOrderId": "order_abc",
  "razorpayPaymentId": "pay_abc",
  "razorpaySignature": "signature"
}
```

Failure request:

```json
{
  "campusHubOrderId": 101,
  "razorpayOrderId": "order_abc",
  "errorCode": "PAYMENT_FAILED",
  "errorDescription": "Payment failed or was cancelled."
}
```

Security rules: backend verifies Razorpay signature using environment secret. Razorpay key secret, raw card data, and unverified payment statuses are never accepted from frontend.

### Explore other colleges

| Method | Endpoint | Access | Purpose |
| --- | --- | --- | --- |
| GET | `/api/colleges/explore` | Student | List colleges available for cross-college exploration. |
| GET | `/api/colleges/explore/search` | Student | Search explorable colleges by keyword. |
| GET | `/api/colleges/explore/{collegeId}` | Student | College details and marketplace summary. |

Security rules: own college and viewer context are derived from JWT. Blocked/inactive colleges are hidden.

### Reviews and ratings

| Method | Endpoint | Access | Purpose |
| --- | --- | --- | --- |
| GET | `/api/reviews/my` | Student | Load review workspace: pending reviews and received reviews. |
| POST | `/api/reviews/orders/{orderId}` | Student | Submit review for an eligible completed order. |

Review request:

```json
{
  "rating": 5,
  "message": "Smooth deal and quick pickup."
}
```

Validation: rating 1-5, message required, max 1000 chars. Security rules: reviewee/reviewer are derived from order participants; one review per eligible order.

### Notifications

Access: authenticated JWT.

| Method | Endpoint | Query/body | Purpose |
| --- | --- | --- | --- |
| GET | `/api/notifications` | `type`, `isRead`, `priority`, `page`, `size`, `sortBy` | Paginated notifications. |
| GET | `/api/notifications/preview` | `size` | Compact notification dropdown. |
| GET | `/api/notifications/unread-count` | none | Unread count. |
| PATCH | `/api/notifications/{notificationId}/read` | path `notificationId` | Mark one notification read. |
| PATCH | `/api/notifications/mark-all-read` | none | Mark all current-user notifications read. |

Security rules: recipient is derived from JWT. Frontend cannot create arbitrary notifications.

### Reports

| Method | Endpoint | Access | Purpose |
| --- | --- | --- | --- |
| POST | `/api/reports/listing/{listingId}` | Student | Report listing. |
| POST | `/api/reports/user/{reportedUserId}` | Student | Report user. |
| POST | `/api/reports/review/{reviewId}` | Student | Report review. |
| GET | `/api/reports/my` | Student | Current-user reports with filters. |
| GET | `/api/reports/my/{reportId}` | Student | Current-user report details. |

Report request:

```json
{
  "reason": "SUSPICIOUS_SELLER",
  "description": "The seller asked to move payment outside Campus Hub."
}
```

Filters: `type`, `status`, `page`, `size`, `sortBy`.

Security rules: reporter id is derived from JWT; duplicate report conflict is handled by backend; reports do not directly mutate content until moderation action.

### Contact support

#### Public support

| Method | Endpoint | Access | Content type | Purpose |
| --- | --- | --- | --- | --- |
| POST | `/api/public/support/contact` | Public | JSON | Public contact support request. |
| POST | `/api/public/support/contact` | Public | multipart | Public contact support request with files. |

Public request:

```json
{
  "fullName": "Ankit Rajput",
  "email": "ankit@example.com",
  "category": "ACCOUNT_ACCESS",
  "subject": "Cannot access my account",
  "description": "I am unable to receive the login recovery OTP."
}
```

Multipart parts: `request` JSON and optional `files`.

Security rules: rate-limited by IP; guest tickets are not assigned protected user ownership.

#### Student support

| Method | Endpoint | Access | Purpose |
| --- | --- | --- | --- |
| GET | `/api/support/tickets` | Student | List own tickets. |
| POST | `/api/support/tickets` | Student | Create ticket, JSON or multipart. |
| GET | `/api/support/tickets/{ticketId}` | Student | Own ticket details. |
| POST | `/api/support/tickets/{ticketId}/replies` | Student | Reply to own ticket, JSON or multipart. |
| PATCH | `/api/support/tickets/{ticketId}/close` | Student | Close own ticket. |
| GET | `/api/support/attachments/{attachmentId}` | Authenticated | Download authorized support attachment. |

Ticket request:

```json
{
  "category": "PAYMENTS",
  "subject": "Payment deducted but order pending",
  "description": "My Razorpay payment was deducted but Campus Hub still shows pending.",
  "relatedEntityType": "ORDER",
  "relatedEntityId": 101
}
```

Reply request:

```json
{ "message": "Here is the screenshot of the payment." }
```

Filters: student list supports `status`, `search`, `page`, `size`.

Security rules: only owner can view/reply/close student ticket; attachments require owner/admin permission.

### Chat system

| Method | Endpoint | Access | Purpose |
| --- | --- | --- | --- |
| GET | `/api/chats/conversations` | Student | List conversations. |
| POST | `/api/chats/conversations/listing/{listingId}` | Student | Create/get conversation for listing. |
| POST | `/api/chats/conversations/order/{orderId}` | Student | Create/get conversation for order. |
| GET | `/api/chats/conversations/{conversationId}` | Student | Conversation details. |
| GET | `/api/chats/conversations/{conversationId}/messages` | Student | Paginated messages. |
| POST | `/api/chats/conversations/{conversationId}/messages` | Student | Send message. |
| PATCH | `/api/chats/conversations/{conversationId}/read` | Student | Mark conversation read. |
| PATCH | `/api/chats/conversations/{conversationId}/archive` | Student | Archive for current user. |
| PATCH | `/api/chats/conversations/{conversationId}/unarchive` | Student | Unarchive for current user. |
| GET | `/api/chats/unread-count` | Student | Chat unread count. |
| POST | `/api/chats/messages/{messageId}/report` | Student | Report message. |

Conversation filters: `search`, `archived`, `page`, `size`.

Message request:

```json
{ "message": "Hi, is this still available?" }
```

Message report request:

```json
{
  "reason": "ABUSIVE_CONTENT",
  "description": "The message contains abusive language."
}
```

Security rules: only conversation participants can view/send/read/archive; buyer/seller participants are derived from listing/order.

### Campus Trust Score

| Method | Endpoint | Access | Purpose |
| --- | --- | --- | --- |
| GET | `/api/user/trust-score` | Student | Current user score. |
| GET | `/api/user/trust-score/history` | Student | Current user score history. |
| GET | `/api/users/{userId}/trust-score/public` | Student | Public-safe score for another user. |

Security rules: trust score values are backend-calculated. Frontend cannot submit score or component values.

## Admin APIs

Admin APIs require `ADMIN` or `SUPER_ADMIN`. Admins are scoped by service policy and all sensitive actions should create audit/moderation records.

### Admin panel read APIs

| Method | Endpoint | Query params | Purpose |
| --- | --- | --- | --- |
| GET | `/api/admin/dashboard` | none | Admin dashboard stats and queues. |
| GET | `/api/admin/users` | `search`, `status`, `role`, `collegeId`, `emailVerified`, `phoneVerified`, `page`, `size`, `sortBy` | User management list. |
| GET | `/api/admin/users/{userId}` | path | User details. |
| GET | `/api/admin/listings` | `search`, `status`, `category`, `collegeId`, `minPrice`, `maxPrice`, `page`, `size`, `sortBy` | Listing management list. |
| GET | `/api/admin/listings/{listingId}` | path | Listing details. |
| GET | `/api/admin/reviews` | `rating`, `status`, `reported`, `collegeId`, `page`, `size`, `sortBy` | Review moderation list. |
| GET | `/api/admin/reviews/{reviewId}` | path | Review details. |
| GET | `/api/admin/orders` | `search`, `status`, `paymentStatus`, `collegeId`, `minAmount`, `maxAmount`, `page`, `size`, `sortBy` | Order management list. |
| GET | `/api/admin/orders/{orderId}` | path | Order details. |
| GET | `/api/admin/payments` | `search`, `status`, `refundStatus`, `collegeId`, `minAmount`, `maxAmount`, `page`, `size`, `sortBy` | Payment management list. |
| GET | `/api/admin/payments/{paymentId}` | path | Payment details. |
| GET | `/api/admin/audit-logs` | `search`, `actionType`, `targetType`, `page`, `size`, `sortBy` | Admin audit log list. |

Security rules: admin read endpoints never expose passwords, raw refresh tokens, raw OTPs, or Razorpay secrets.

### Admin reports queue

| Method | Endpoint | Body/query | Purpose |
| --- | --- | --- | --- |
| GET | `/api/admin/reports` | `type`, `status`, `priority`, `page`, `size`, `sortBy` | Moderation queue. |
| GET | `/api/admin/reports/{reportId}` | path | Report details. |
| PATCH | `/api/admin/reports/{reportId}/under-review` | `{ "note": "..." }` | Move report under review. |
| PATCH | `/api/admin/reports/{reportId}/reject` | `{ "note": "..." }` | Reject report. |
| PATCH | `/api/admin/reports/{reportId}/close` | `{ "note": "..." }` | Close report. |

### Admin moderation actions

Action request:

```json
{
  "reportId": 55,
  "note": "Confirmed policy violation."
}
```

| Method | Endpoint | Purpose |
| --- | --- | --- |
| PATCH | `/api/admin/listings/{listingId}/under-review` | Put listing under review. |
| PATCH | `/api/admin/listings/{listingId}/block` | Block listing. |
| PATCH | `/api/admin/listings/{listingId}/restore` | Restore listing. |
| DELETE | `/api/admin/listings/{listingId}` | Soft-delete listing. |
| PATCH | `/api/admin/reviews/{reviewId}/under-review` | Put review under review. |
| PATCH | `/api/admin/reviews/{reviewId}/hide` | Hide review. |
| PATCH | `/api/admin/reviews/{reviewId}/restore` | Restore review. |
| PATCH | `/api/admin/users/{targetUserId}/warn` | Warn user. |
| PATCH | `/api/admin/users/{targetUserId}/suspend` | Suspend user. |
| PATCH | `/api/admin/users/{targetUserId}/block` | Block user. |
| PATCH | `/api/admin/users/{targetUserId}/reactivate` | Reactivate user. |

Security rules: target status transitions are backend-controlled; admin id is derived from JWT; moderation action history is append-only.

### Admin support

| Method | Endpoint | Access | Purpose |
| --- | --- | --- | --- |
| GET | `/api/admin/support/tickets` | Admin | List tickets with `status`, `priority`, `category`, `search`, `collegeId`, `page`, `size`. |
| GET | `/api/admin/support/tickets/{ticketId}` | Admin | Ticket details. |
| POST | `/api/admin/support/tickets/{ticketId}/replies` | Admin | Public reply, JSON or multipart. |
| PATCH | `/api/admin/support/tickets/{ticketId}/status` | Admin | Change support status. |
| POST | `/api/admin/support/tickets/{ticketId}/internal-notes` | Admin | Add internal note. |

Status update body:

```json
{
  "status": "RESOLVED",
  "note": "Issue fixed after payment reconciliation."
}
```

Internal note body:

```json
{ "message": "Need to verify Razorpay dashboard before replying." }
```

### Admin trust score

| Method | Endpoint | Access | Purpose |
| --- | --- | --- | --- |
| GET | `/api/admin/users/{userId}/trust-score` | Admin | Full score for a user. |
| GET | `/api/admin/users/{userId}/trust-score/history` | Admin | Full trust score history. |
| POST | `/api/admin/users/{userId}/trust-score/recalculate` | Admin | Deterministically recalculate and save score. |

Security rules: recalculation is server-side; admin id is recorded as the trigger.

## Super Admin APIs

Super Admin APIs require `SUPER_ADMIN` only.

### Dashboard and admins

| Method | Endpoint | Body/query | Purpose |
| --- | --- | --- | --- |
| GET | `/api/super-admin/dashboard` | none | Platform-wide dashboard. |
| GET | `/api/super-admin/admins` | `search`, `status`, `role`, `page`, `size` | Admin accounts list. |
| POST | `/api/super-admin/admins` | `CreateAdminRequest` | Create admin account. |
| GET | `/api/super-admin/admins/{adminId}` | path | Admin details. |
| PATCH | `/api/super-admin/admins/{adminId}/suspend` | path | Suspend admin. |
| PATCH | `/api/super-admin/admins/{adminId}/reactivate` | path | Reactivate admin. |
| PATCH | `/api/super-admin/admins/{adminId}/remove-admin-role` | path | Remove admin privileges. |

Create admin request:

```json
{
  "fullName": "Campus Admin",
  "email": "admin@example.com",
  "username": "campus_admin"
}
```

Security rules: super admin assigns roles; frontend cannot set arbitrary role/account status.

### Colleges

| Method | Endpoint | Body/query | Purpose |
| --- | --- | --- | --- |
| GET | `/api/super-admin/colleges` | `search`, `status`, `page`, `size` | College list. |
| POST | `/api/super-admin/colleges` | `CollegeRequest` | Create college. |
| GET | `/api/super-admin/colleges/{collegeId}` | path | College details. |
| PUT | `/api/super-admin/colleges/{collegeId}` | `CollegeRequest` | Update college. |
| PATCH | `/api/super-admin/colleges/{collegeId}/activate` | path | Activate college. |
| PATCH | `/api/super-admin/colleges/{collegeId}/deactivate` | path | Deactivate college. |
| PATCH | `/api/super-admin/colleges/{collegeId}/block` | path | Block college. |

College request:

```json
{
  "collegeName": "Lokmata Devi Ahilya Bai Holkar Rajkiya Engineering College, Mainpuri",
  "collegeCode": "RECMAINPURI",
  "emailDomain": "recmainpuri.in",
  "city": "Mainpuri",
  "state": "Uttar Pradesh",
  "country": "India",
  "description": "Government engineering college campus."
}
```

### Categories

| Method | Endpoint | Body/query | Purpose |
| --- | --- | --- | --- |
| GET | `/api/super-admin/categories` | `search`, `status`, `page`, `size` | Category list. |
| POST | `/api/super-admin/categories` | `CategoryRequest` | Create category. |
| PUT | `/api/super-admin/categories/{categoryId}` | `CategoryRequest` | Update category. |
| PATCH | `/api/super-admin/categories/{categoryId}/enable` | path | Enable category. |
| PATCH | `/api/super-admin/categories/{categoryId}/disable` | path | Disable category. |
| PATCH | `/api/super-admin/categories/reorder` | `ReorderCategoriesRequest` | Reorder categories. |

Category request:

```json
{
  "name": "Books",
  "slug": "books",
  "description": "Textbooks and study material.",
  "iconUrl": null,
  "sortOrder": 10
}
```

Reorder request:

```json
{
  "categories": [
    { "categoryId": 1, "sortOrder": 10 },
    { "categoryId": 2, "sortOrder": 20 }
  ]
}
```

### Audit, settings, and health

| Method | Endpoint | Body/query | Purpose |
| --- | --- | --- | --- |
| GET | `/api/super-admin/audit-logs` | `search`, `actorRole`, `actionType`, `targetType`, `page`, `size` | Platform audit log list. |
| GET | `/api/super-admin/platform-settings` | none | Feature flags and platform limits. |
| PUT | `/api/super-admin/platform-settings` | `{ "settings": { "signupEnabled": "true" } }` | Update platform settings. |
| GET | `/api/super-admin/system-health` | none | Backend/database/storage/payment health summary. |

Security rules: platform settings are safe values only; secrets stay in environment variables and are never returned.

## Static legal and safety routes

These are frontend routes, not backend REST APIs:

| Route | Purpose |
| --- | --- |
| `/terms-and-conditions` | Terms and Conditions page. |
| `/privacy-policy` | Privacy Policy page. |
| `/refund-policy` | Refund Policy page. |
| `/safety-guidelines` | Safety Guidelines page. |
| `/contact-support` | Public contact support UI backed by `/api/public/support/contact`. |

If legal acceptance needs to be recorded later, use the Phase 24 `user_legal_acceptances` table through a future authenticated endpoint.

## Database-related API behavior

- Auth APIs write `users`, `otp_verifications`, `refresh_tokens`, and `login_attempts`.
- Profile APIs write `users`, `profile_privacy_settings`, profile photo storage metadata, and account deactivation records.
- Marketplace APIs write `listings` and `listing_images`; ownership and college scope come from JWT.
- Wishlist APIs write one `wishlist_items` row per user/listing.
- Orders APIs write `marketplace_orders` and `order_status_history`.
- Payment APIs write `payments` and `payment_attempts` only after server-side Razorpay verification/failure handling.
- Reviews APIs write `seller_reviews`; rating summaries are derived.
- Notifications are written by backend business events and read/update only by recipients.
- Reports and moderation keep reports separate from action history.
- Support tickets keep public guest records separate from authenticated user ownership.
- Chat conversations and participants are derived from listing/order relationships.
- Trust score is calculated by backend service and logged in history.
- Admin and super-admin changes should append audit records.

## Common validation and error rules

| Scenario | Expected response |
| --- | --- |
| Invalid JSON or invalid field | `400 BAD REQUEST` with field errors. |
| Missing/invalid JWT | `401 UNAUTHORIZED`. |
| Wrong role | `403 FORBIDDEN`. |
| Resource does not exist or is not visible | `404 NOT FOUND`. |
| Duplicate username/email/phone/wishlist/report/review | `409 CONFLICT`. |
| Business rule violation such as invalid order transition | `422 UNPROCESSABLE ENTITY` or `400 BAD REQUEST` with clear message. |
| Rate limit exceeded | `429 TOO MANY REQUESTS`. |
| Unexpected server issue | `500 INTERNAL SERVER ERROR`. |

## Implementation notes

- The current backend exposes generated OpenAPI at `/v3/api-docs` and Swagger UI at `/swagger-ui/**`.
- Some Phase 24 canonical database names are compatibility views over earlier physical tables. API documentation uses feature names, while backend persistence continues to protect existing data.
- The docs intentionally describe implemented routes. Where earlier planning text used different names, such as `GET /api/auth/check-email` or `/api/auth/refresh-token`, the current backend routes are documented as `POST /api/auth/check-email` and `POST /api/auth/refresh`.
