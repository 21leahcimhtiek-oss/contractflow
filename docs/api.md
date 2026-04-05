# ContractFlow API Reference

Base URL: `https://your-domain.com/api`

All endpoints require authentication via Supabase session cookie unless noted.

---

## Contracts

### List Contracts
`GET /api/contracts`

Query parameters:
| Param | Type | Description |
|-------|------|-------------|
| `org_id` | string | Filter by org |
| `status` | string | Filter by status |
| `type` | string | Filter by type |
| `search` | string | Search title/counterparty |
| `page` | number | Page number (default: 1) |
| `limit` | number | Page size (default: 20, max: 100) |

**Response 200:**
```json
{
  "contracts": [...],
  "total": 42,
  "page": 1,
  "limit": 20
}
```

---

### Create Contract
`POST /api/contracts`

**Body:**
```json
{
  "title": "Software License Agreement",
  "type": "msa",
  "org_id": "uuid",
  "counterparty_name": "Acme Corp",
  "counterparty_email": "legal@acme.com",
  "value_usd": 50000,
  "start_date": "2025-01-01",
  "end_date": "2026-01-01",
  "content": "# Agreement\n..."
}
```

**Response 201:** Created contract object

**Errors:**
- `401` Not authenticated
- `403` Insufficient plan (contract limit reached)
- `400` Validation error

---

### Get Contract
`GET /api/contracts/:id`

**Response 200:**
```json
{
  "id": "uuid",
  "title": "...",
  "status": "active",
  "signatures": [...],
  "approval_workflows": [...],
  "comments": [...],
  "versions": [...]
}
```

---

### Update Contract
`PATCH /api/contracts/:id`

**Body:** Partial contract fields

**Errors:**
- `403` Requires `admin` or `manager` role

---

### Delete Contract
`DELETE /api/contracts/:id`

**Errors:**
- `403` Requires `admin` role
- `409` Cannot delete active contracts

---

## AI Endpoints

### AI Contract Review
`POST /api/contracts/:id/review`

Triggers GPT-4o analysis. Returns risk score + findings.

**Rate limit:** 5 requests/minute

**Response 200:**
```json
{
  "risk_score": 72,
  "ai_summary": "This contract...",
  "findings": [
    {
      "severity": "high",
      "clause": "Section 4",
      "issue": "Unlimited liability clause",
      "suggestion": "Cap liability at contract value"
    }
  ]
}
```

---

### AI Contract Draft
`POST /api/ai/draft`

**Requires:** Pro or Enterprise plan

**Body:**
```json
{
  "type": "nda",
  "party_a": "Acme Corp",
  "party_b": "Beta Inc",
  "variables": {
    "governing_law": "California",
    "term_years": "2"
  }
}
```

**Response 200:**
```json
{
  "content": "# Non-Disclosure Agreement\n..."
}
```

---

### AI Summarize Contract
`POST /api/ai/summarize`

**Body:**
```json
{
  "content": "# Contract text..."
}
```

**Response 200:**
```json
{
  "summary": "Executive summary..."
}
```

---

## Signatures

### Sign / Decline Contract
`POST /api/contracts/:id/sign`

**Body:**
```json
{
  "signer_email": "john@example.com",
  "signer_name": "John Doe",
  "action": "sign",
  "role": "signatory"
}
```

`action`: `"sign"` | `"decline"`

**Response 200:** Updated signature + contract status

---

## Approval Workflows

### Approve / Reject
`POST /api/contracts/:id/approve`

**Body:**
```json
{
  "workflow_id": "uuid",
  "action": "approve",
  "comment": "Looks good"
}
```

`action`: `"approve"` | `"reject"`

---

## Templates

### List Templates
`GET /api/templates?org_id=...`

Returns public templates + org-specific templates.

### Create Template
`POST /api/templates`

**Body:**
```json
{
  "name": "Standard NDA",
  "type": "nda",
  "content": "# NDA Template...",
  "variables": { "party_name": "string", "term": "string" },
  "org_id": "uuid",
  "is_public": false
}
```

---

## Billing

### Create Checkout Session
`POST /api/billing/create-checkout`

**Body:** `{ "plan_id": "pro" }`

**Response:** `{ "url": "https://checkout.stripe.com/..." }`

---

### Customer Portal
`POST /api/billing/portal`

**Response:** `{ "url": "https://billing.stripe.com/..." }`

---

## Auth

### Invite Team Member
`POST /api/auth/invite`

**Body:**
```json
{
  "email": "newmember@example.com",
  "org_id": "uuid",
  "role": "member"
}
```

**Requires:** `admin` role in org