# Deploying ContractFlow to Vercel

## Prerequisites

- Vercel account (free tier works for development)
- Supabase project (free tier: 2 projects)
- Stripe account (test mode)
- OpenAI API key
- Upstash Redis database (free tier)

---

## Step 1: Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run `supabase/migrations/001_initial_schema.sql`
3. Enable **Email Auth** under Authentication → Providers
4. Copy your project URL and anon/service role keys

---

## Step 2: Set Up Stripe

1. Create products in Stripe Dashboard matching your plans:
   - Starter: $79/month
   - Pro: $199/month  
   - Enterprise: $499/month
2. Copy the Price IDs for each plan
3. Set up a webhook endpoint pointing to `https://your-domain.com/api/billing/webhook`
4. Listen for: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`

---

## Step 3: Set Up Upstash Redis

1. Create a Redis database at [upstash.com](https://upstash.com)
2. Copy the REST URL and token

---

## Step 4: Deploy to Vercel

### Option A: Deploy via Vercel CLI

```bash
npm install -g vercel
vercel login
vercel --prod
```

### Option B: Deploy via GitHub Integration

1. Push this repo to GitHub
2. Import the repo in [vercel.com/new](https://vercel.com/new)
3. Select **Next.js** framework preset
4. Add all environment variables (see Step 5)
5. Deploy

---

## Step 5: Configure Environment Variables

In Vercel Dashboard → Settings → Environment Variables, add:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...

OPENAI_API_KEY=sk-...

STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_PRICE_STARTER=price_...
STRIPE_PRICE_PRO=price_...
STRIPE_PRICE_ENTERPRISE=price_...

UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=...

NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app

SENTRY_DSN=https://xxx@sentry.io/...
SENTRY_ORG=your-org
SENTRY_PROJECT=contractflow
```

---

## Step 6: Configure Custom Domain (Optional)

1. Vercel Dashboard → Settings → Domains
2. Add your custom domain
3. Update DNS records as instructed
4. Update `NEXT_PUBLIC_APP_URL` to your custom domain

---

## Step 7: Post-Deployment Verification

```bash
# Test health
curl https://your-domain.com/api/health

# Test auth flow
# 1. Go to /signup and create an account
# 2. Confirm email
# 3. Login at /login
# 4. Create first contract

# Verify Stripe webhooks
# In Stripe Dashboard → Webhooks → your endpoint → Recent deliveries
```

---

## Troubleshooting

### "Cannot find module" errors
Run `npm install` locally and commit the lockfile.

### Supabase RLS errors
Ensure you're using `createServiceClient()` for server-side admin operations, not the anon client.

### Stripe webhook signature mismatch
Make sure you're using `STRIPE_WEBHOOK_SECRET` from the Vercel webhook endpoint, not from local `stripe listen`.

### Rate limit errors in production
Check Upstash dashboard for current request counts. Consider upgrading if limits are hit regularly.