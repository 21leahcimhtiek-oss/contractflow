# ContractFlow Architecture

## Overview

ContractFlow is a Next.js 14 App Router application deployed on Vercel, using Supabase as the backend-as-a-service layer.

```
┌─────────────────────────────────────────────────────────┐
│                    Vercel Edge Network                    │
│  ┌─────────────────────────────────────────────────────┐ │
│  │              Next.js 14 App Router                   │ │
│  │                                                      │ │
│  │   ┌──────────────┐    ┌────────────────────────┐    │ │
│  │   │  App Shell   │    │     API Routes          │    │ │
│  │   │  (RSC/SSR)   │    │  /api/contracts         │    │ │
│  │   │              │    │  /api/ai/*              │    │ │
│  │   │  Dashboard   │    │  /api/billing/*         │    │ │
│  │   │  Contracts   │    │  /api/auth/*            │    │ │
│  │   │  Signatures  │    │  /api/templates         │    │ │
│  │   │  Analytics   │    └──────────┬─────────────┘    │ │
│  │   └──────────────┘               │                   │ │
│  └──────────────────────────────────┼───────────────────┘ │
└─────────────────────────────────────┼─────────────────────┘
                                      │
              ┌───────────────────────┼───────────────────┐
              │                       │                   │
        ┌─────▼──────┐    ┌──────────▼────────┐  ┌──────▼──────┐
        │  Supabase  │    │      OpenAI        │  │   Stripe    │
        │  Postgres  │    │   GPT-4o + mini   │  │  Billing    │
        │  Auth      │    │   AI Review       │  │  Webhooks   │
        │  Storage   │    │   AI Draft        │  └─────────────┘
        │  RLS       │    │   Summarize       │
        └────────────┘    └───────────────────┘
              │
        ┌─────▼──────┐
        │  Upstash   │
        │  Redis     │
        │  Rate Limit│
        └────────────┘
```

## Data Flow

### Contract Creation
1. User submits form → `POST /api/contracts`
2. API checks rate limit (Upstash) + plan limits (PLAN_LIMITS)
3. Inserts into `contracts` table with RLS enforcement
4. Audit trail entry created
5. Returns new contract

### AI Review
1. User triggers review → `POST /api/contracts/:id/review`
2. Rate limiter checks `aiRateLimit` (5/min)
3. Contract content fetched from DB
4. GPT-4o call with structured output schema (3-retry backoff)
5. Results stored in `contracts.risk_score` + `contracts.ai_summary`
6. JSON findings stored in contract metadata

### Signature Flow
1. Contract moved to `pending_signature`
2. Signers notified (via email invite)
3. Each signer hits `POST /api/contracts/:id/sign`
4. Upsert on `(contract_id, signer_email)` — idempotent
5. After each signature, check if ALL signed
6. If all signed → contract status → `active`

### Approval Workflow
1. Contract submitted for review → status `review`
2. `approval_workflows` record created with step array
3. Each approver calls `POST /api/contracts/:id/approve`
4. `current_step` advances on approval
5. On final step approval → contract → `pending_signature`
6. On any rejection → contract → `draft`

## Database Schema

### Core Tables
| Table | Description |
|-------|-------------|
| `orgs` | Organizations with plan and Stripe subscription |
| `org_members` | User ↔ Org membership with roles |
| `contracts` | Core contract entity |
| `contract_versions` | Immutable version snapshots |
| `signatures` | E-signature records per signer |
| `approval_workflows` | Workflow with step JSONB array |
| `comments` | Threaded comments on contracts |
| `contract_templates` | Reusable contract templates |
| `audit_trail` | Immutable audit log |

### Row Level Security
All tables enforce RLS. The `get_user_org_ids(user_id)` helper function
is used in policies to efficiently resolve org membership without N+1 queries.

## Rate Limiting

| Limiter | Limit | Window | Used For |
|---------|-------|--------|----------|
| `standardRateLimit` | 60 requests | 1 minute | All API routes |
| `aiRateLimit` | 5 requests | 1 minute | AI endpoints only |
| `authRateLimit` | 10 requests | 15 minutes | Login/signup |

## Authentication

- Supabase Auth with email/password
- Session managed via `@supabase/ssr` (cookie-based)
- `src/middleware.ts` refreshes session on every request
- Route protection: `/dashboard/*` requires authenticated session

## Deployment

- **Platform**: Vercel (iad1 region)
- **CI/CD**: GitHub Actions (`.github/workflows/ci.yml`)
  - lint → typecheck → unit tests → build → E2E (main branch only)
- **Monitoring**: Sentry (client + server + edge configs)
- **Cron**: Daily contract expiry check at 08:00 UTC

## Environment Variables

See `.env.example` for the full list. Required at runtime:
- `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY`
- `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET`
- `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN`
- `SENTRY_DSN`