# Changelog

All notable changes to ContractFlow are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [1.0.0] - 2024-01-01

### Added
- Initial release of ContractFlow
- AI contract drafting with GPT-4o
- AI contract review with risk scoring (0-100)
- AI executive summary generation
- E-signature workflow with multi-party support
- Approval chain management with configurable steps
- Contract version history with change summaries
- Template library (public + private org templates)
- Full audit trail for compliance
- Analytics dashboard (volume, risk distribution, time-to-sign)
- Team collaboration with comments
- Stripe billing integration (Starter/Pro/Enterprise)
- Supabase Auth with org-level Row Level Security
- Rate limiting via Upstash Redis
- Error monitoring via Sentry
- CI/CD via GitHub Actions

### Security
- Row Level Security on all database tables
- Zod input validation on all API endpoints
- Security headers (X-Frame-Options, CSP, etc.)
- Rate limiting on AI endpoints (5/min)

## [Unreleased]

### Planned
- DocuSign API integration for legally-binding signatures
- Salesforce CRM integration
- Slack notifications
- Contract renewal automation
- AI clause library
- Multi-language contract support
- Mobile app (React Native)
- Bulk contract operations
- Custom AI fine-tuning for Enterprise