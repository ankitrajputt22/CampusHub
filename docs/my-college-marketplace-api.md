# My College Marketplace API

The My College Marketplace is scoped entirely by the authenticated student's
database account. Clients never send or control a `userId` or `collegeId`.

## Browse active listings

`GET /api/listings/my-college`

Supported query parameters:

- `search`: title, description, category, seller name, or pickup location
- `category`
- `minPrice` and `maxPrice`
- `condition`: `NEW`, `LIKE_NEW`, `GOOD`, `FAIR`, or `USED`
- `pickupLocation`
- `negotiable`
- `postedDate`: `today`, `week`, or `month`
- `minSellerTrust`: a value from 0 to 100
- `sortBy`: `newest`, `priceAsc`, `priceDesc`, or `trusted`
- `page`: zero-based page number
- `size`: 1 to 24, with 12 used by default

Only `ACTIVE` listings from the authenticated student's active college are
returned. Listings from another college, inactive sellers, and non-active
listing statuses are excluded before pagination.

The response includes:

- verified college identity
- listing cards with seller trust data
- whether each listing belongs to or is wishlisted by the current student
- pagination state and `hasMore`
- available pickup locations for the college

## View a listing

`GET /api/listings/{listingId}`

The listing must be active and belong to the authenticated student's college.
Unavailable and cross-college listings return `404` without exposing their
details.

## Wishlist

- `POST /api/wishlist/{listingId}`
- `DELETE /api/wishlist/{listingId}`

Adding a listing is idempotent and protected by the database unique constraint
on `(user_id, listing_id)`. A student cannot wishlist their own listing or a
listing outside their college.

## Security

All endpoints require an authenticated `STUDENT` JWT and an active account.
The backend resolves the student and college from the JWT user ID and the
database. Frontend-supplied identity, role, or college parameters are ignored.
