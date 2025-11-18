# Architecture Comparison: Multi-Tenant vs Single-Tenant

This document explains the architectural differences between the main console (multi-tenant) and the internal app (single-tenant).

## Overview

You now have **two separate applications** that demonstrate different Auth0 patterns:

1. **Multi-Tenant Console** (`/Users/eddie.legg/Code/auth0-poc/app`)
   - Serves all organizations from a single deployment
   - Users select which organization context to use
   - One Auth0 application configuration
   
2. **Single-Tenant Internal App** (`/Users/eddie.legg/Code/auth0-internal-app`)
   - Serves one specific organization
   - Organization context is hardcoded
   - Separate Auth0 application per deployment

## Visual Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Auth0 Tenant                             │
│                  (dev-57ctxx7z8j5mdir1.us.auth0.com)            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Organizations:                                                  │
│  ├── ACME Corp (org_abc123)                                    │
│  ├── TechStart Inc (org_xyz789)                                │
│  └── GlobalSoft (org_def456)                                   │
│                                                                  │
│  Applications:                                                   │
│  ├── Multi-Tenant Console                                       │
│  │   ├── No org restriction                                     │
│  │   ├── User can belong to any org                            │
│  │   └── Runtime org selection                                  │
│  │                                                              │
│  ├── ACME Internal App                                          │
│  │   ├── Restricted to org_abc123                              │
│  │   ├── Only ACME Corp members can access                     │
│  │   └── org_abc123 enforced at login                          │
│  │                                                              │
│  ├── TechStart Internal App                                     │
│  │   ├── Restricted to org_xyz789                              │
│  │   └── ...                                                    │
│  │                                                              │
│  └── GlobalSoft Internal App                                    │
│      ├── Restricted to org_def456                              │
│      └── ...                                                    │
└─────────────────────────────────────────────────────────────────┘

           ↓                                    ↓
           
┌──────────────────────┐            ┌──────────────────────┐
│  Multi-Tenant Console│            │ ACME Internal App    │
│                      │            │                      │
│  One Deployment      │            │ Separate Deployment  │
│  One URL            │            │ Per Organization     │
│  auth0-poc.vercel.app│            │ acme-app.vercel.app │
│                      │            │                      │
│  Users:              │            │ Users:               │
│  ├─ alice@acme.com   │            │ ├─ alice@acme.com   │
│  ├─ bob@techstart.io │            │ └─ charlie@acme.com │
│  └─ carol@global.net │            │                      │
│                      │    SSO     │ (Only ACME members)  │
│  Alice logs in ──────┼───────────→│ Alice SSOs in        │
└──────────────────────┘            └──────────────────────┘
```

## Authentication Flow Comparison

### Multi-Tenant Console

```
User visits console
       ↓
Redirects to Auth0
       ↓
Auth0 login (no org specified)
       ↓
User authenticates
       ↓
Returns to console with token
       ↓
Console reads user's organizations from token
       ↓
If 1 org: Auto-select
If 2+ orgs: Show org picker
       ↓
User works in selected org context
```

**Key Code**:
```typescript
// No organization parameter
const authUrl = `https://${domain}/authorize?${new URLSearchParams({
  client_id: clientId,
  response_type: 'code',
  redirect_uri: callbackUrl,
  scope: 'openid profile email'
  // NO organization parameter
})}`;
```

### Single-Tenant Internal App

```
User visits internal app
       ↓
Redirects to Auth0 WITH org_id
       ↓
Auth0 verifies user is in org_abc123
       ↓
If not member: Error "Not a member"
If member: Authenticate
       ↓
Returns to app with org-scoped token
       ↓
App verifies org_id in token
       ↓
User works in app (always same org)
```

**Key Code**:
```typescript
// Organization parameter enforces restriction
const authUrl = `https://${domain}/authorize?${new URLSearchParams({
  client_id: clientId,
  response_type: 'code',
  redirect_uri: callbackUrl,
  scope: 'openid profile email',
  organization: organizationId  // 👈 ENFORCES ORG
})}`;
```

## SSO Between Applications

When a user is authenticated in the multi-tenant console and clicks a link to an internal app:

```
1. User authenticated in console
   Session: { user: {...}, org_id: 'org_abc123' }
   Auth0 cookie: present
   
2. User clicks link to ACME Internal App
   URL: http://localhost:3001
   
3. Internal app checks session
   No local session found
   Redirects to Auth0 with org_abc123 parameter
   
4. Auth0 sees existing session
   User already authenticated
   User is member of org_abc123
   No login prompt - just verifies org membership
   
5. Auth0 returns authorization code
   
6. Internal app exchanges code for token
   Token contains org_id: 'org_abc123'
   
7. Internal app creates local session
   User now logged into internal app
   
✅ SSO SUCCESS - No password prompt!
```

## Use Cases

### When to Use Multi-Tenant Console

- **Admin/management interface** that works across organizations
- **Tools that need org context switching** (support dashboards, analytics)
- **SaaS products** where users might belong to multiple orgs
- **Developer/testing tools** that need to work with any org

### When to Use Single-Tenant Internal Apps

- **Organization-specific tools** (internal HR system, project management)
- **Customer-specific deployments** (white-labeled apps per customer)
- **Compliance requirements** (data must stay in org boundary)
- **Dedicated apps per customer** (enterprise tier customers)

## Token Differences

### Multi-Tenant Console Token
```json
{
  "sub": "auth0|123456",
  "email": "alice@acme.com",
  "name": "Alice Smith",
  // org_id present after org selection
  "org_id": "org_abc123",
  "org_name": "ACME Corp"
}
```
- `org_id` added after user selects organization
- Can change if user switches org context
- Optional - might not be present initially

### Single-Tenant Internal App Token
```json
{
  "sub": "auth0|123456",
  "email": "alice@acme.com",
  "name": "Alice Smith",
  // org_id ALWAYS present from Auth0
  "org_id": "org_abc123",
  "org_name": "ACME Corp"
}
```
- `org_id` always present (enforced by Auth0)
- Never changes - always same org
- Guaranteed to match configured organization

## Configuration Differences

| Aspect | Multi-Tenant Console | Single-Tenant Internal App |
|--------|---------------------|---------------------------|
| **Auth0 App Config** | No org restriction | "Require organization" enabled |
| **Environment Vars** | No `ORGANIZATION_ID` | `AUTH0_ORGANIZATION_ID` required |
| **Authorization URL** | No `organization` param | `organization` param required |
| **Token Validation** | Checks user has orgs | Verifies specific org_id |
| **Deployment** | Single instance | One per organization |
| **URL Strategy** | One URL for all | Separate URL per org |
| **Session Storage** | Org context in session | Org always the same |

## Security Considerations

### Multi-Tenant Console
- ✅ User can access any org they're a member of
- ✅ Org context stored in session
- ⚠️ Must validate org membership on every request
- ⚠️ Risk of org context confusion if not careful
- ✅ Single attack surface

### Single-Tenant Internal App
- ✅ Auth0 enforces org membership at login
- ✅ Token always contains verified org_id
- ✅ No org switching possible
- ✅ Stronger isolation between orgs
- ⚠️ Multiple deployment/attack surfaces

## Deployment Strategy

### Multi-Tenant Console
```bash
# One deployment serves all orgs
cd /Users/eddie.legg/Code/auth0-poc/app
vercel --prod

# Result: auth0-poc.vercel.app
```

### Single-Tenant Internal Apps
```bash
# Separate deployment per org
cd /Users/eddie.legg/Code/auth0-internal-app

# Update .env for ACME Corp
AUTH0_ORGANIZATION_ID=org_abc123
vercel --prod --name acme-internal-app

# Update .env for TechStart
AUTH0_ORGANIZATION_ID=org_xyz789
vercel --prod --name techstart-internal-app

# Result: 
#   acme-internal-app.vercel.app
#   techstart-internal-app.vercel.app
```

## Cost Implications

### Multi-Tenant Console
- ✅ One deployment to maintain
- ✅ One set of environment variables
- ✅ One domain/SSL certificate
- ✅ Simpler infrastructure

### Single-Tenant Internal Apps
- ⚠️ N deployments (one per org)
- ⚠️ N sets of environment variables
- ⚠️ N domains/SSL certificates
- ⚠️ More complex infrastructure
- ✅ But: Better isolation and security

## Recommended Architecture

For a production SaaS:

```
┌─────────────────────────────────────────────────────────────┐
│                    Public Applications                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Multi-Tenant Console (yourapp.com)                        │
│  ├── User management                                        │
│  ├── Organization switching                                │
│  ├── Cross-org analytics                                   │
│  └── Admin functions                                       │
│                                                              │
└─────────────────────────────────────────────────────────────┘
                           ↓ SSO
┌─────────────────────────────────────────────────────────────┐
│              Organization-Specific Internal Apps            │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ACME Internal Tools (acme.yourapp.com)                    │
│  ├── ACME-specific workflows                               │
│  ├── ACME data/integrations                                │
│  └── ACME custom features                                  │
│                                                              │
│  TechStart Internal Tools (techstart.yourapp.com)          │
│  ├── TechStart-specific workflows                          │
│  └── ...                                                    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Testing Both Patterns

1. **Start both apps**:
   ```bash
   # Terminal 1: Multi-tenant console
   cd /Users/eddie.legg/Code/auth0-poc/app
   pnpm dev
   
   # Terminal 2: Single-tenant internal app
   cd /Users/eddie.legg/Code/auth0-internal-app
   pnpm dev -- --port 3001
   ```

2. **Test multi-tenant flow**:
   - Visit http://localhost:5173
   - Log in
   - Select organization
   - Explore dashboard

3. **Test SSO to single-tenant**:
   - From dashboard, click "Internal App 1"
   - Should redirect to http://localhost:3001
   - Should see SSO success (no login prompt)

4. **Test org restriction**:
   - Log in as user from different org
   - Try to access internal app
   - Should see "Not a member of this organization"

## Summary

Both patterns are valid and serve different purposes:

- **Multi-Tenant Console**: Best for cross-organization tools and SaaS products
- **Single-Tenant Internal Apps**: Best for organization-specific tools with strong isolation

The combination of both patterns, with SSO between them, provides the best of both worlds:
- ✅ Flexibility of multi-tenant access
- ✅ Security of single-tenant isolation
- ✅ Seamless user experience via SSO
