# Account recovery and reviews API

## Password recovery

Password recovery is an unauthenticated, three-step, one-use flow:

1. `POST /api/auth/password-reset/request`
2. `POST /api/auth/password-reset/verify`
3. `POST /api/auth/password-reset/complete`

The request endpoint returns the same public response shape whether an eligible
account exists or not. OTP values and reset tokens are stored only as hashes.
Codes expire, are locked after five failed attempts, and a newly requested code
invalidates earlier recovery challenges. Reset tokens expire after ten minutes.
A successful password reset revokes every refresh token for the account and
creates a high-priority security notification.

`devOtp` is returned only when `OTP_EXPOSE_DEV_CODES=true`. Keep that setting
disabled outside isolated local development and automated tests.

## Reviews

Authenticated, active, verified students use:

- `GET /api/reviews/my` to load received, given, and pending reviews with
  summary statistics.
- `POST /api/reviews/orders/{orderId}` to review the seller for a completed
  purchase.

The backend derives the reviewer from the JWT. Only the order's buyer may
submit feedback, the order must be completed, and the database permits one
review per order. A successful submission creates a notification for the
seller.
