# Student Profile API

The student profile module is authenticated with the existing access-token
cookie or `Authorization: Bearer <token>` header. The backend always resolves
the student ID from the authenticated token; it does not accept a caller
supplied identity.

## Endpoints

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/api/user/profile` | Full private profile, completion, trust, privacy, reviews, and marketplace statistics |
| `PUT` | `/api/user/profile` | Update editable personal and academic fields |
| `POST` | `/api/user/profile/photo` | Upload a JPG, PNG, or WEBP profile photo of at most 2 MB |
| `PUT` | `/api/user/privacy-settings` | Update public-profile visibility controls |
| `POST` | `/api/user/change-password` | Verify and replace the current password, then revoke refresh sessions |
| `POST` | `/api/auth/logout-all-devices` | Revoke every refresh session for the authenticated student |
| `POST` | `/api/user/deactivate-request` | Mark the account for administrator-reviewed deactivation without deleting data |
| `GET` | `/api/user/public-profile/{userId}` | Privacy-filtered seller profile for verified students |
| `GET` | `/api/user/profile-summary` | Compact profile data for navigation and dashboard use |

## Security and validation

- College, email, phone, role, account status, verification state, and trust
  score are server-controlled.
- A bio is limited to 250 characters.
- LinkedIn and GitHub URLs must use HTTPS and the corresponding official host.
- Photo content is validated by media type and stored outside the relational
  database through the `ProfilePhotoStorage` adapter.
- Seller reviews have a unique completed-order relationship, a 1–5 rating
  constraint, and cannot review the same account.
- Profile completion has 11 fields and the trust score is recalculated on the
  backend.

The local profile stores uploaded images under
`backend/data/profile-photos`. A production object-storage implementation can
replace the filesystem adapter without changing the controller or profile
service.
