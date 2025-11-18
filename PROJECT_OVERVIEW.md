# Single-Tenant Internal App - Project Overview

## 🎯 What Was Built

A complete, production-ready SvelteKit application that demonstrates Auth0's **organization-scoped authentication** pattern. This app complements the main multi-tenant console by showing how to build organization-specific internal tools.

## 📦 What's Included

### Core Features
- ✅ **Organization-scoped login** - Users can only authenticate if they're members of the configured organization
- ✅ **OIDC with PKCE** - Secure authentication flow following OAuth 2.0 best practices
- ✅ **SSO support** - Seamless single sign-on from the main console
- ✅ **Session management** - JWT-based sessions with HTTP-only cookies
- ✅ **Token verification** - Double-checks org_id claim in tokens
- ✅ **Error handling** - Graceful handling of auth errors and unauthorized access

### UI Components
- ✅ **User profile display** - Shows name, email, avatar
- ✅ **Organization badge** - Clearly indicates which org the app serves
- ✅ **Feature explanations** - Educational cards explaining how it works
- ✅ **Setup instructions** - In-app guidance for Auth0 configuration
- ✅ **Responsive design** - Works on desktop and mobile
- ✅ **Beautiful gradients** - Modern, professional styling

### Developer Experience
- ✅ **TypeScript** - Full type safety
- ✅ **Comprehensive documentation** - README, SETUP, ARCHITECTURE, QUICK_START guides
- ✅ **Environment templates** - `.env.example` with clear instructions
- ✅ **Vercel-ready** - Pre-configured for deployment
- ✅ **Type checking** - `pnpm run check` passes with no errors
- ✅ **Clear code structure** - Easy to understand and customize

## 📂 Project Structure

```
auth0-internal-app/
├── README.md                    # Main documentation
├── QUICK_START.md              # 5-minute getting started guide
├── SETUP.md                    # Detailed setup instructions
├── ARCHITECTURE.md             # Multi-tenant vs single-tenant comparison
├── PROJECT_OVERVIEW.md         # This file
├── .env.example                # Environment variable template
├── .env                        # Your local configuration
├── package.json                # Dependencies
├── svelte.config.js            # SvelteKit + Vercel adapter
├── vercel.json                 # Vercel deployment config
├── tsconfig.json               # TypeScript configuration
│
└── src/
    ├── lib/
    │   ├── config/
    │   │   └── auth0.ts        # Auth0 configuration
    │   └── server/
    │       ├── auth-utils.ts   # PKCE helpers (code verifier, challenge)
    │       └── session.ts      # Session creation, encryption, validation
    │
    └── routes/
        ├── +page.server.ts     # Auth guard, loads user data
        ├── +page.svelte        # Main UI with profile and org info
        └── api/
            └── auth/
                ├── login/
                │   └── +server.ts    # Initiates Auth0 flow with org param
                ├── callback/
                │   └── +server.ts    # Handles callback, verifies org_id
                └── logout/
                    └── +server.ts    # Clears session, logs out from Auth0
```

## 🔑 Key Implementation Details

### Organization Enforcement

The critical difference from the multi-tenant console is the `organization` parameter:

```typescript
// src/routes/api/auth/login/+server.ts
const params = new URLSearchParams({
  client_id: auth0Config.clientId,
  response_type: 'code',
  redirect_uri: auth0Config.callbackUrl,
  scope: 'openid profile email',
  state,
  code_challenge: codeChallenge,
  code_challenge_method: 'S256',
  organization: auth0Config.organizationId  // 👈 THE MAGIC
});
```

This tells Auth0 to:
1. Only allow users who are members of this organization
2. Include `org_id` claim in the token
3. Show error if user isn't a member

### Token Verification

Double-checks the organization claim:

```typescript
// src/routes/api/auth/callback/+server.ts
if (userInfo.org_id !== auth0Config.organizationId) {
  console.error('[Internal App] User does not belong to this organization');
  throw redirect(303, '/?error=unauthorized_organization');
}
```

This ensures the token actually contains the expected organization, preventing token substitution attacks.

### Session Management

Uses JWT-based sessions stored in HTTP-only cookies:

```typescript
// src/lib/server/session.ts
export function encryptSession(data: SessionData): string {
  return jwt.sign(data, auth0Config.sessionSecret);
}

export function setSession(event: RequestEvent, data: SessionData) {
  const token = encryptSession(data);
  event.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7 // 7 days
  });
}
```

## 🚀 Deployment

### Local Development

```bash
pnpm dev -- --port 3001
# Runs on http://localhost:3001
```

### Production (Vercel)

```bash
vercel --prod
# Deploys to yourapp.vercel.app
```

Environment variables needed in Vercel:
- `AUTH0_DOMAIN`
- `AUTH0_CLIENT_ID`
- `AUTH0_CLIENT_SECRET`
- `AUTH0_ORGANIZATION_ID`
- `AUTH0_CALLBACK_URL` (production URL)
- `AUTH0_SESSION_SECRET`
- `PUBLIC_APP_URL` (production URL)

## 🧪 Testing SSO

To test single sign-on between the main console and this internal app:

1. Start both apps:
   ```bash
   # Terminal 1
   cd /Users/eddie.legg/Code/auth0-poc/app
   pnpm dev

   # Terminal 2
   cd /Users/eddie.legg/Code/auth0-internal-app
   pnpm dev -- --port 3001
   ```

2. In browser:
   - Visit http://localhost:5173 (main console)
   - Log in and select your organization
   - Click "Internal App 1" from dashboard
   - Observe: Redirected to http://localhost:3001
   - Result: No login prompt! Automatic SSO! 🎉

## 📊 Comparison with Main Console

| Feature | Main Console | Internal App |
|---------|-------------|--------------|
| **Purpose** | Multi-org management | Single-org specific tool |
| **URL Strategy** | One URL for all | Separate URL per org |
| **Auth0 App** | No org restriction | Org-scoped |
| **Organization Param** | Not used | Required |
| **Org Selection** | Runtime (user picks) | Compile-time (configured) |
| **Token Claims** | `org_id` optional | `org_id` always present |
| **Deployment** | One instance | One per organization |
| **User Access** | Any org member | Specific org only |

## 🎨 Customization Guide

### Branding

1. **Update colors** in `src/routes/+page.svelte`:
   ```css
   .navbar {
     background: linear-gradient(135deg, #YOUR_COLOR_1 0%, #YOUR_COLOR_2 100%);
   }
   ```

2. **Add logo** in navbar:
   ```svelte
   <h2>
     <img src="/logo.png" alt="Your Company" />
     Your Company Internal App
   </h2>
   ```

3. **Change title** in multiple places:
   - `src/routes/+page.svelte` (navbar, page title)
   - `README.md` (project name)

### Adding Features

1. **Add more routes**:
   ```
   src/routes/
   ├── dashboard/
   │   ├── +page.server.ts
   │   └── +page.svelte
   ├── reports/
   │   └── ...
   ```

2. **Connect to APIs**:
   ```typescript
   // src/routes/+page.server.ts
   const apiResponse = await fetch('https://your-api.com/data', {
     headers: {
       Authorization: `Bearer ${session.accessToken}`
     }
   });
   ```

3. **Add role-based access**:
   ```typescript
   // Check roles in token
   const roles = session.user.roles || [];
   if (!roles.includes('admin')) {
     throw error(403, 'Unauthorized');
   }
   ```

## 🔒 Security Considerations

### What's Protected

- ✅ **Organization boundary** - Auth0 enforces org membership
- ✅ **Token validation** - App verifies org_id in callback
- ✅ **Session encryption** - JWT signed with secret
- ✅ **HTTP-only cookies** - Not accessible to JavaScript
- ✅ **PKCE flow** - Protects against authorization code interception
- ✅ **State parameter** - Prevents CSRF attacks

### Best Practices Implemented

1. **No secrets in client code** - All Auth0 credentials server-side
2. **Secure cookie settings** - httpOnly, secure in production
3. **Token verification** - Always verify org_id claim
4. **Environment variables** - Sensitive config in .env
5. **Error handling** - No sensitive data in error messages

## 📚 Documentation Files

- **README.md** - Full documentation (setup, deployment, architecture)
- **QUICK_START.md** - Get running in 5 minutes
- **SETUP.md** - Step-by-step setup guide
- **ARCHITECTURE.md** - Deep dive into multi-tenant vs single-tenant patterns
- **PROJECT_OVERVIEW.md** - This file (technical overview)

## 🤝 Integration with Main Console

The internal app can be linked from the main console's dashboard:

```svelte
<!-- In main console: src/routes/dashboard/+page.svelte -->
<a href="http://localhost:3001">
  Internal App
</a>
```

When the user clicks this link:
1. Auth0 sees existing session
2. Verifies user is in the org
3. Returns authorization code
4. User logged into internal app (SSO!)

## ✅ Production Checklist

Before deploying to production:

- [ ] Create separate Auth0 application per organization
- [ ] Enable "Require organization" in Auth0
- [ ] Add production callback URLs to Auth0
- [ ] Set environment variables in Vercel
- [ ] Generate secure `AUTH0_SESSION_SECRET`
- [ ] Test SSO flow from main console
- [ ] Verify org_id validation works
- [ ] Test unauthorized access (wrong org)
- [ ] Update branding and copy
- [ ] Add monitoring/logging

## 🎉 Success Criteria

You've successfully set up the internal app when:

1. ✅ You can visit http://localhost:3001 and get redirected to Auth0
2. ✅ After login, you see your profile and organization
3. ✅ Users from other orgs get "Not a member" error
4. ✅ SSO works from main console (no password prompt)
5. ✅ Type checking passes (`pnpm run check`)
6. ✅ All documentation is clear and helpful

## 🚀 Next Steps

1. **Customize branding** - Make it look like your company's app
2. **Add features** - Connect to your internal APIs
3. **Deploy to Vercel** - Get it live for your team
4. **Replicate for other orgs** - Create separate deployments
5. **Monitor usage** - Add analytics/logging
6. **Share with Auth0 team** - Demo the SSO capabilities!

## 📞 Support

If you need help:
1. Check the documentation files (README, SETUP, etc.)
2. Review the main console's `IMPLEMENTATION_PLAN.md`
3. Consult Auth0 documentation at https://auth0.com/docs

---

**Built with ❤️ using SvelteKit, Auth0, and TypeScript**
