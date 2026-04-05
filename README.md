# ContractFlow

> **AI-powered contract lifecycle management for enterprise teams**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-green)](https://supabase.com/)

ContractFlow transforms how legal and operations teams draft, review, sign, and manage contracts. Powered by GPT-4o, it cuts contract cycle times by 80% and reduces legal risk through automated risk scoring.

## Features

- **AI Contract Drafting** — Generate complete contracts from templates with GPT-4o
- **Automated Risk Scoring** — 0-100 risk score with clause-level findings
- **E-Signature Workflows** — Multi-party signing with audit trail
- **Approval Chains** — Configurable multi-step approval workflows
- **Version History** — Full contract version control with diff summaries
- **Template Library** — Public + private org template management
- **Analytics Dashboard** — Contract volume, risk trends, time-to-sign metrics
- **Team Collaboration** — Comments, mentions, and real-time notifications
- **Audit Trail** — Full compliance audit log for all contract actions

## Pricing

| Plan | Price | Contracts | Members |
|------|-------|-----------|---------|
| Starter | $79/mo | 10 | 3 |
| Pro | $199/mo | 100 | 15 |
| Enterprise | $499/mo | Unlimited | Unlimited |

## Tech Stack

- **Frontend**: Next.js 14 App Router, TypeScript, Tailwind CSS
- **Database**: Supabase (PostgreSQL + Row Level Security)
- **Auth**: Supabase Auth
- **AI**: OpenAI GPT-4o
- **Payments**: Stripe
- **Rate Limiting**: Upstash Redis
- **Monitoring**: Sentry
- **Deployment**: Vercel

## Quick Start

```bash
# Clone the repository
git clone https://github.com/21leahcimhtiek-oss/contractflow.git
cd contractflow

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Fill in your API keys

# Run database migrations
npx supabase db push

# Start development server
npm run dev
```

## Environment Variables

See [`.env.example`](.env.example) for required environment variables.

## Database Setup

Run the migration in `supabase/migrations/001_initial_schema.sql` to set up all tables with Row Level Security.

## Deployment

See [`deploy/vercel-deploy.md`](deploy/vercel-deploy.md) for Vercel deployment instructions.

## Architecture

See [`docs/architecture.md`](docs/architecture.md) for system design documentation.

## API Reference

See [`docs/api.md`](docs/api.md) for API endpoint documentation.

## Contributing

See [`CONTRIBUTING.md`](CONTRIBUTING.md) for contribution guidelines.

## License

MIT — see [`LICENSE`](LICENSE) for details.