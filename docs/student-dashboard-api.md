# Student Dashboard Backend API

## Dashboard

`GET /api/student/dashboard`

Send the access token in the `Authorization` header:

```http
Authorization: Bearer <access-token>
```

The endpoint does not accept a user or college identifier. It extracts the user ID
from the signed JWT and loads the current college ID from the user's database
record.

Access is limited to users who are:

- authenticated with a valid access token;
- assigned the `STUDENT` role;
- in `ACTIVE` status;
- verified by both college email and phone number.

The response includes:

- student, college, role, status, and verification details;
- Campus Trust Score, trust level, and improvement suggestions;
- profile completion percentage and stable missing-field keys;
- active listing, wishlist, order, sold-item, and unread-notification counts;
- up to eight newest active listings from the authenticated student's college;
- up to five latest notifications;
- up to five latest activity records.

Empty counts and arrays are valid response values.

## Session endpoints

### Refresh access token

`POST /api/auth/refresh`

```json
{
  "refreshToken": "<refresh-token>"
}
```

The account is checked again for active status and completed verification before a
new access token is issued.

### Logout

`POST /api/auth/logout`

```json
{
  "refreshToken": "<refresh-token>"
}
```

The refresh token is revoked. The frontend should then clear local session data and
redirect to the login page.

## College isolation

Dashboard listing queries always use:

```text
listing.college_id = authenticatedUser.college_id
listing.status = ACTIVE
```

Any `userId` or `collegeId` query parameter sent by a client is ignored and cannot
change the dashboard scope.

## Persistence

Flyway migration `V5__student_dashboard_schema.sql` adds the profile fields and
minimal dashboard data tables for listings, wishlist items, marketplace orders,
notifications, and user activity. It also adds indexes for the dashboard count and
latest-record queries.
