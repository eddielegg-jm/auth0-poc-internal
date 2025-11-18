# Quick Start - Get Running in 5 Minutes

## What This Is

A **single-tenant internal app** that demonstrates Auth0's organization-scoped authentication. Unlike the multi-tenant console, this app is restricted to ONE specific organization.

## Prerequisites

- Auth0 account (use the same tenant as the main POC)
- Node.js and pnpm installed
- A user who is a member of an Auth0 organization

## 5-Minute Setup

### 1. Create Auth0 App (2 minutes)

1. Go to https://manage.auth0.com
2. **Applications** → **Create Application** → Name it "Internal App Demo" → **Regular Web Application**
3. In **Settings**:
   - Copy **Client ID** and **Client Secret**
   - Add to **Allowed Callback URLs**: `http://localhost:3001/api/auth/callback`
   - Add to **Allowed Logout URLs**: `http://localhost:3001`
   - Save
4. In **Organizations** tab:
   - Enable Organizations
   - Select **Require organization**
   - Choose your organization
   - Save

### 2. Get Organization ID (30 seconds)

1. **Organizations** in sidebar
2. Click your organization
3. Copy the **Organization ID** (starts with `org_`)

### 3. Configure Environment (1 minute)

Edit `.env` file:
```bash
AUTH0_CLIENT_ID=<paste-client-id>
AUTH0_CLIENT_SECRET=<paste-client-secret>
AUTH0_ORGANIZATION_ID=<paste-org-id>
AUTH0_SESSION_SECRET=$(openssl rand -base64 32)
```

### 4. Run It (30 seconds)

```bash
pnpm install
pnpm dev -- --port 3001
```

Open http://localhost:3001 → Should redirect to Auth0 → Log in → See your profile!

## Test SSO (Optional)

Want to see seamless SSO between the main console and this internal app?

**Terminal 1**:
```bash
cd /Users/eddie.legg/Code/auth0-poc/app
pnpm dev
```

**Terminal 2**:
```bash
cd /Users/eddie.legg/Code/auth0-internal-app
pnpm dev -- --port 3001
```

**Browser**:
1. Visit http://localhost:5173 (main console)
2. Log in and select your org
3. Click "Internal App 1" from dashboard
4. Watch as you're automatically logged into http://localhost:3001 (no password prompt!)

## What You'll See

- ✅ Your user profile
- ✅ Organization badge showing which org
- ✅ Explanation cards about how it works
- ✅ Setup instructions for production

## Troubleshooting

**"Environment variable missing"**
→ Make sure all variables in `.env` are filled in

**"You are not a member of this organization"**
→ Verify you're a member of the organization in Auth0 Dashboard

**"Port 3001 already in use"**
→ Use different port: `pnpm dev -- --port 3002`

## Next Steps

- Read `README.md` for full documentation
- Check `SETUP.md` for detailed setup guide
- Review `ARCHITECTURE.md` to understand multi-tenant vs single-tenant patterns
- Deploy to Vercel (instructions in README)

## Key Files

- `src/routes/api/auth/login/+server.ts` - Adds `organization` parameter to Auth0 URL
- `src/routes/api/auth/callback/+server.ts` - Verifies org_id in token
- `src/routes/+page.server.ts` - Enforces authentication
- `src/routes/+page.svelte` - Main UI

## The Magic Line

The key difference from the multi-tenant console is this one line:

```typescript
// In src/routes/api/auth/login/+server.ts
const params = new URLSearchParams({
  // ... other params
  organization: auth0Config.organizationId  // 👈 This enforces org restriction
});
```

This tells Auth0 to only allow users from the specified organization to authenticate!
