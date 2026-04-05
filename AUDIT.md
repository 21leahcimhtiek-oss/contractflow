# ContractFlow — Security & Compliance Audit

## Security Architecture

### Authentication & Authorization
- **Auth Provider**: Supabase Auth (JWT-based)
- **Session Management**: HTTP-only cookies via @supabase/ssr
- **Row Level Security**: All tables enforce org-level isolation
- **Role-Based Access Control**: owner/admin/member/viewer roles

### Data Isolation
All database tables implement Row Level Security (RLS) policies that ensure:
1. Users can only access data belonging to their organization
2. Organization membership is verified on every query
3. Service role key never exposed to client

### API Security
- **Rate Limiting**: Upstash Redis — 60 req/min standard, 5 req/min AI endpoints
- **Input Validation**: Zod schemas on all POST/PATCH endpoints
- **CSRF Protection**: Next.js built-in + SameSite cookies
- **Security Headers**: X-Frame-Options, X-Content-Type-Options, Referrer-Policy

### AI Data Handling
- Contract content sent to OpenAI API (not used for training per ToS)
- No PII in system prompts
- AI responses validated before storage
- Retry logic with exponential backoff (3 attempts max)

## Compliance

### Audit Trail
Every contract action is logged to `audit_trail` table:
- User ID and organization ID
- Action type and timestamp
- IP address (signature events)
- Immutable records (no UPDATE/DELETE on audit_trail)

### Data Retention
- Contracts: Retained indefinitely (configurable per plan)
- Audit logs: 7 years (compliance standard)
- Deleted contracts: Soft-delete with 30-day recovery window

### Encryption
- **At Rest**: Supabase AES-256 encryption
- **In Transit**: TLS 1.3 enforced
- **Backups**: Encrypted daily backups, 30-day retention

## Known Limitations

1. E-signature implementation is soft signature (no PKI/certificate-based signature)
   - For legally binding signatures in regulated industries, integrate DocuSign API
2. AI risk scoring is advisory, not legal advice
3. Template library does not include jurisdiction-specific legal review

## Penetration Testing Checklist

- [ ] SQL injection via contract content fields
- [ ] IDOR on contract/[id] endpoints
- [ ] Rate limit bypass attempts
- [ ] JWT manipulation
- [ ] XSS via markdown rendering
- [ ] Stripe webhook replay attacks
- [ ] File upload restrictions (if implemented)

## Incident Response

1. Sentry alerts on error spikes → PagerDuty
2. Supabase RLS violation logs → Security team notification
3. Stripe webhook failures → Retry queue + admin alert
4. Data breach protocol: 72-hour notification per GDPR

## SOC 2 Readiness

| Control | Status | Notes |
|---------|--------|-------|
| Access Control | ✅ Implemented | RLS + RBAC |
| Audit Logging | ✅ Implemented | audit_trail table |
| Encryption | ✅ Implemented | Supabase managed |
| Incident Response | ✅ Documented | Sentry + runbook |
| Vendor Management | 🟡 Partial | OpenAI DPA needed |
| Penetration Testing | 🔴 Pending | Schedule annually |