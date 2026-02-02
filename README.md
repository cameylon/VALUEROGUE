# LDS Nexus MVP

Production-ready MVP for **Lutheran Disability Services (LDS) Nexus** using Next.js App Router, Prisma, and Postgres.

## Stack
- **Frontend + Backend**: Next.js App Router (TypeScript)
- **Database**: Postgres via Prisma
- **Auth**: Email/password + JWT (HTTP-only cookie)
- **AI**: Pluggable provider with mock (offline safe)
- **Background jobs**: BullMQ (Redis)
- **Storage**: Local filesystem provider (`/storage`)

## Why Next.js API routes
Next.js API routes were chosen to keep the MVP lean and deployment-simple (single app, shared types, faster iteration). This still allows a clean separation of modules and keeps the door open for extraction into a dedicated FastAPI service later.

## Setup

### 1) Install dependencies
```bash
npm install
```

### 2) Configure environment
Create `.env`:
```bash
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/lds_nexus"
JWT_SECRET="replace-this-secret"
AI_PROVIDER="mock"
OPENAI_API_KEY=""
REDIS_HOST="127.0.0.1"
REDIS_PORT="6379"
APP_ORIGIN="http://localhost:3000"
INLINE_JOBS="true"
```

### 3) Migrate + seed
```bash
npm run prisma:migrate
npm run db:seed
```

### 4) Run dev server
```bash
npm run dev
```

### Optional: run background worker
If you set `INLINE_JOBS=false`, start the worker in a separate terminal:
```bash
npm run worker:evidence
```

## Seeded accounts
Password for all seeded users: `Password123!`
- `staff@ldsnexus.test` (STAFF)
- `quality@ldsnexus.test` (QUALITY_SAFETY)
- `leader@ldsnexus.test` (TEAM_LEADER)
- `admin@ldsnexus.test` (ADMIN)

## Core workflows
- **Care Notes Copilot**: `/care-notes`
- **Compliance Sentinel**: `/incidents`
- **Roster Optimiser**: `/roster`
- **Admin Console**: `/admin`

## Folder structure (summary)
```
app/
  (dashboard)/
  api/
components/
  ui/
lib/
prisma/
scripts/
tests/
```

## RBAC enforcement
RBAC is applied in API routes using `assertRole`. Frontend pages are designed for role-aware navigation and require authentication for meaningful use.

## AI provider switching
- **Mock (default)**: `AI_PROVIDER=mock`
- **OpenAI-compatible (placeholder)**: set `AI_PROVIDER=openai` and `OPENAI_API_KEY` (still uses mock provider in MVP).

## Database schema
See `prisma/schema.prisma` for full model details.

## Testing
```bash
npm run test
```

## Migrations
```bash
npm run prisma:migrate
```

## HTTP examples (Postman-ready)

### Login
```
POST /api/auth/login
{
  "email": "staff@ldsnexus.test",
  "password": "Password123!"
}
```

### AI care note suggestion
```
POST /api/care-notes/ai-suggest
{
  "text": "Morning support delivered with community access.",
  "clientLabel": "[CLIENT]",
  "staffLabel": "[STAFF]"
}
```

### Create incident (draft)
```
POST /api/incidents
{
  "clientId": "seed-client",
  "homeId": "seed-home",
  "category": "Medication",
  "severity": "High",
  "description": "Client reported missing dose and felt dizzy.",
  "immediateActions": "Called supervisor, monitored vitals."
}
```

### Submit incident
```
POST /api/incidents/{incidentId}/submit
```

### Generate evidence pack
```
POST /api/incidents/{incidentId}/evidence-pack
```

### Roster suggestions
```
POST /api/roster/suggest
```

### Confirm roster assignment
```
POST /api/roster/confirm
{
  "shiftId": "seed-shift",
  "userId": "<user-id>"
}
```

## Notes
- All AI runs are logged with redacted metadata and checksums only (no sensitive prompts).
- Audit events are immutable and stored for every major action.
- Default timezone display uses `en-AU` locale; timestamps stored in UTC.
- CSRF protection uses origin checks; configure `APP_ORIGIN` in production.
