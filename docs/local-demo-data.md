# Local demo marketplace data

The backend includes an opt-in, local-profile-only demo data runner. It is
disabled by default and never runs in test or production profiles unless the
local profile and explicit enable property are both present.

## Seed data

The runner creates these verified student accounts at the configured college:

- `demo.priya@recmainpuri.in`
- `demo.rahul@recmainpuri.in`
- `demo.neha@recmainpuri.in`
- `demo.aman@recmainpuri.in`

It also creates twelve listings:

- ten active listings across common marketplace categories;
- one sold listing for sold-state testing;
- one inactive listing for access-control testing.

The operation is idempotent. Existing demo accounts are preserved, passwords
are not reset, and listings are not duplicated.

## Run locally

Provide a strong password through the environment and enable the seed for one
startup:

```bash
cd backend
CAMPUSHUB_DEMO_DATA_ENABLED=true \
CAMPUSHUB_DEMO_DATA_PASSWORD="$YOUR_DEMO_PASSWORD" \
mvn spring-boot:run -Dspring-boot.run.profiles=local
```

The password is BCrypt-hashed before storage and is never defined in source
code. Disable the flag after the initial seed; the records remain in the local
H2 database.

To target another seeded college, also provide:

```bash
CAMPUSHUB_DEMO_DATA_COLLEGE_CODE="COLLEGE_CODE"
```
