# Product details

The product-details flow is restricted to authenticated, active students and
their own active college marketplace. User and college identity are always
derived from the JWT.

## Endpoints

### Load one product

`GET /api/listings/my-college/{listingId}`

The legacy-compatible `GET /api/listings/{listingId}` route returns the same
response. The response includes:

- complete listing information and status;
- valid image URLs, with the primary listing image as the current source;
- seller verification, privacy-aware public academic details, trust score,
  rating, review/deal counts, and membership date;
- current-user wishlist and ownership state;
- server-calculated buy/report permissions;
- up to four active listings from the same category and college.

`ACTIVE` and `SOLD` listings can be displayed. Inactive, deleted, blocked, and
under-review listings are returned as unavailable. A listing owned by another
college is also returned as unavailable to avoid exposing cross-college data.

### Wishlist

- `POST /api/wishlist/{listingId}`
- `DELETE /api/wishlist/{listingId}`

Only active same-college listings can be added. Adding the same listing is
idempotent, and a student cannot add their own listing.

### Report

`POST /api/reports/listing/{listingId}`

Example request:

```json
{
  "reason": "WRONG_PRODUCT_DETAILS",
  "description": "The model number does not match the description."
}
```

Supported reasons are `FAKE_LISTING`, `WRONG_PRODUCT_DETAILS`,
`SUSPICIOUS_SELLER`, `PROHIBITED_ITEM`, `ABUSIVE_CONTENT`,
`DUPLICATE_LISTING`, `PRICE_SCAM`, and `OTHER`. Reports are stored as
`PENDING_REVIEW`. Duplicate reports from the same student and reports of the
student's own listing are rejected.

### Begin an order

`POST /api/orders/listings/{listingId}`

The backend locks and rechecks the listing, verifies that the buyer and seller
are active, confirms the college boundary, and prevents buying one's own item.
It then creates an order with `PENDING_PAYMENT`.

Payment provider order creation and payment verification intentionally remain
in the separate payment flow. No payment credentials or payment-state claims
are accepted from the product-details page.
