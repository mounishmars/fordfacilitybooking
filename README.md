# Ford Facility Booking

Mobile booking app (iOS/Android) and facility-admin web portal for Ford campus facilities. MVP covers **Turf** and **Badminton** with an approval workflow.

## Stack

| Layer | Tech |
|-------|------|
| Mobile | React Native + Expo |
| Admin | Next.js |
| API | NestJS + TypeORM |
| DB | SQLite via sql.js locally (default) or PostgreSQL via Docker |
| Auth | Mock SSO now → Ford Microsoft Entra ID later |

## Monorepo layout

```
apps/api        NestJS API
apps/admin      Facility admin web
apps/mobile     Expo employee app
packages/shared Shared enums/types
docker-compose.yml
```

## Prerequisites

- Node.js 20+
- npm 10+
- (Optional) Docker for PostgreSQL
- Expo Go app on a phone, or iOS Simulator / Android Emulator

## Quick start

```bash
# Install all workspaces
npm install

# Build shared types
npm run build -w @ford/shared

# Seed Turf + Badminton + 7 days of hourly slots
npm run api:seed

# Terminal 1 — API (http://localhost:3001)
npm run api

# Terminal 2 — Admin (http://localhost:3000)
npm run admin

# Terminal 3 — Mobile
npm run mobile
```

### Mock SSO accounts

| App | Role | Example |
|-----|------|---------|
| Mobile | `EMPLOYEE` | `employee@ford.com` |
| Admin | `FACILITY_ADMIN` | `admin@ford.com` |

Flow: employee requests a slot → status `PENDING` → admin approves/rejects → `CONFIRMED` / `REJECTED`.

## PostgreSQL (optional)

```bash
docker compose up -d
```

Set in `apps/api/.env`:

```
DB_TYPE=postgres
DATABASE_URL=postgres://ford:ford@localhost:5432/facility_booking
```

Then re-run `npm run api:seed`.

## Branching & CI/CD

Do **not** push directly to `main`. Use a feature branch + PR.

**CI (default):** GitHub Actions (`.github/workflows/ci.yml`) — free for this repo, no GCP billing.  
**Optional later:** Google Cloud Build (`cloudbuild.yaml`) if you get a Ford/GCP sandbox.

Cycode / FOSSA / Sonar run as CI steps (not GCloud products).

Setup: [docs/CI_CD_SETUP.md](docs/CI_CD_SETUP.md) · GCloud (optional): [docs/GCLOUD_CI_SETUP.md](docs/GCLOUD_CI_SETUP.md)

```bash
git checkout -b feature/my-change
git push -u origin HEAD
gh pr create --base main
# Local GCP smoke test:
# gcloud builds submit --config=cloudbuild.build-only.yaml
```

## Swagger & Hoppscotch

With the API running (`npm run api`):

| Resource | URL |
|----------|-----|
| Swagger UI | http://localhost:3001/docs |
| OpenAPI JSON | http://localhost:3001/docs-json |

### Try in Swagger UI
1. Open `/docs`
2. Call `POST /auth/mock-login` with body `{ "email": "employee@ford.com", "name": "Employee", "role": "EMPLOYEE" }`
3. Copy `accessToken`
4. Click **Authorize** → paste token (Bearer)
5. Call protected endpoints

### Import into Hoppscotch
1. Open [Hoppscotch](https://hoppscotch.io) (or desktop app)
2. **Collections** → **Import** → **OpenAPI**
3. Paste URL: `http://localhost:3001/docs-json` (or download the JSON and upload)
4. Set environment variable / base URL to `http://localhost:3001`
5. After mock-login, add header: `Authorization: Bearer <accessToken>`

## API overview

- `POST /auth/mock-login` — mock SSO JWT
- `GET /auth/me`
- `GET /facilities`
- `GET /facilities/:id/availability?from=&to=`
- `POST /bookings` — create pending request
- `GET /bookings/me`
- `POST /bookings/:id/cancel`
- `GET /admin/bookings?status=PENDING`
- `POST /admin/bookings/:id/approve`
- `POST /admin/bookings/:id/reject`
- `GET|POST|PATCH /admin/facilities`
- `POST /admin/slots/block`

## Swapping mock SSO for Ford Entra ID

Auth is abstracted behind `AuthProvider` (`apps/api/src/auth/auth-provider.interface.ts`). Today `MockAuthProvider` issues profiles from the mock-login form.

When Ford app registration is available:

1. Register apps in Entra ID (mobile + admin SPA/public client + API).
2. Implement `EntraAuthProvider` that validates Microsoft ID tokens / access tokens.
3. Bind `{ provide: AUTH_PROVIDER, useClass: EntraAuthProvider }` in `AuthModule`.
4. Map Entra groups/app roles → `EMPLOYEE` / `FACILITY_ADMIN`.
5. Mobile: Expo AuthSession or MSAL; Admin: MSAL.js / NextAuth Azure AD.
6. Remove or feature-flag `POST /auth/mock-login`.

## Defaults

- Pending bookings hold capacity (prevents double-booking).
- Confirmed bookings can be cancelled only before slot start.
- Facility type is a string so new types beyond Turf/Badminton can be added without a schema rewrite.
