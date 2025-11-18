# Single-Tenant Internal App - Auth0 Demo

This is a **single-tenant internal application** that demonstrates Auth0's organization-scoped authentication pattern. This app is designed to be deployed separately from the main multi-tenant console and serves users from a specific organization only.

## 🎯 Purpose

This app demonstrates:
- **Organization-scoped authentication**: Users can only authenticate if they belong to a specific Auth0 organization
- **Separate Auth0 application**: Uses its own client ID/secret, independent of the main console
- **SSO integration**: Users who are already authenticated in the main console will seamlessly SSO into this app
- **Production architecture pattern**: Shows how to deploy organization-specific internal tools

## 🔐 Architecture

### Single-Tenant vs Multi-Tenant

**Multi-Tenant Console** (main POC):
- One Auth0 application serves all organizations
- Users can select which organization context to use
- URL: `https://auth0-poc.vercel.app`

**Single-Tenant Internal App** (this app):
- Separate Auth0 application per organization
- Organization ID enforced at login via `organization` parameter
- Users from other orgs cannot access
- URL: `https://acme-internal-app.vercel.app` (example)

## 🚀 Setup Instructions

### 1. Create Auth0 Application

1. Go to [Auth0 Dashboard](https://manage.auth0.com)
2. Navigate to **Applications** → **Create Application**
3. Name: "ACME Corp Internal App" (or your org name)
4. Type: **Regular Web Application**
5. Click **Create**

### 2. Configure Application Settings

In the application settings:

1. **Application URIs**:
   - Allowed Callback URLs: `http://localhost:3001/api/auth/callback`
   - Allowed Logout URLs: `http://localhost:3001`
   - (Add production URLs when deploying to Vercel)

2. **Advanced Settings** → **Grant Types**:
   - ✅ Authorization Code
   - ✅ Refresh Token

3. **Organizations** tab:
   - Click **Enable Organizations**
   - Select **Require organization** (important!)
   - Choose the specific organization this app should serve
   - Save changes

### 3. Environment Variables

Copy `.env.example` to `.env` and update:

```bash
AUTH0_DOMAIN=dev-57ctxx7z8j5mdir1.us.auth0.com
AUTH0_CLIENT_ID=your_new_app_client_id_here
AUTH0_CLIENT_SECRET=your_new_app_client_secret_here
AUTH0_ORGANIZATION_ID=org_abc123xyz
AUTH0_CALLBACK_URL=http://localhost:3001/api/auth/callback
AUTH0_SESSION_SECRET=$(openssl rand -base64 32)
PUBLIC_APP_URL=http://localhost:3001
```

**How to get Organization ID**:
1. Go to Auth0 Dashboard → **Organizations**
2. Click on your organization
3. Copy the **Organization ID** from the settings

### 4. Install Dependencies

```bash
pnpm install
```

### 5. Run Development Server

```bash
pnpm dev -- --port 3001
```

Visit `http://localhost:3001` - you'll be automatically redirected to Auth0 for login.

## 🧪 Testing SSO

1. **Start the main console** (in the other project):
   ```bash
   cd /Users/eddie.legg/Code/auth0-poc/app
   pnpm dev
   ```

2. **Start this internal app**:
   ```bash
   cd /Users/eddie.legg/Code/auth0-internal-app
   pnpm dev -- --port 3001
   ```

3. **Test SSO flow**:
   - Open `http://localhost:5173` (main console)
   - Log in and select your organization
   - From the dashboard, click on "Internal App 1" or "Internal App 2"
   - You'll be redirected to this internal app
   - Should see SSO notification (no login prompt!)

## 📦 Deploying to Vercel

### 1. Create New Vercel Project

```bash
# From this directory
vercel
```

Follow the prompts to create a new project.

### 2. Add Environment Variables

In Vercel Dashboard:
1. Go to your project → **Settings** → **Environment Variables**
2. Add all variables from `.env` (except use production callback URL)
3. Update `AUTH0_CALLBACK_URL` to: `https://your-app.vercel.app/api/auth/callback`
4. Update `PUBLIC_APP_URL` to: `https://your-app.vercel.app`

### 3. Update Auth0 Callback URLs

In Auth0 Dashboard, add production URLs:
- Allowed Callback URLs: `https://your-app.vercel.app/api/auth/callback`
- Allowed Logout URLs: `https://your-app.vercel.app`

### 4. Deploy

```bash
vercel --prod
```

## 🔍 How It Works

### Organization-Scoped Login

When a user clicks "Login", the app redirects to Auth0 with the `organization` parameter:

```typescript
const authorizationUrl = `https://${domain}/authorize?${new URLSearchParams({
  client_id: clientId,
  response_type: 'code',
  redirect_uri: callbackUrl,
  scope: 'openid profile email',
  organization: organizationId  // 👈 Forces this specific org
})}`;
```

Auth0 will:
1. Check if the user is already authenticated (SSO)
2. Verify the user belongs to the specified organization
3. If not a member, show error "You are not a member of this organization"
4. If member, return authorization code

### Token Verification

The callback handler verifies the organization:

```typescript
const userInfo = await fetch(`https://${domain}/userinfo`, {
  headers: { Authorization: `Bearer ${accessToken}` }
});

const user = await userInfo.json();

if (user.org_id !== organizationId) {
  // Reject - user doesn't belong to this organization
  throw redirect(303, '/?error=unauthorized_organization');
}
```

This double-checks that the token contains the correct organization claim.

## 📁 Project Structure

```
src/
├── lib/
│   ├── config/
│   │   └── auth0.ts           # Auth0 configuration
│   └── server/
│       ├── auth-utils.ts      # PKCE helpers
│       └── session.ts         # Session management
└── routes/
    ├── +page.server.ts        # Load user data, enforce auth
    ├── +page.svelte           # Main UI
    └── api/
        └── auth/
            ├── login/
            │   └── +server.ts # Initiate Auth0 login
            ├── callback/
            │   └── +server.ts # Handle Auth0 callback
            └── logout/
                └── +server.ts # Handle logout
```

## 🔑 Key Differences from Main Console

| Feature | Main Console | Internal App |
|---------|-------------|--------------|
| **Auth0 App** | Single app for all orgs | Separate app per org |
| **Organization Selection** | User chooses org | Hardcoded to one org |
| **Access Control** | Any org member can access | Only specific org members |
| **Token Claims** | `org_id` may change | `org_id` always the same |
| **Deployment** | Single URL for all | Separate URL per org |

## 🎨 Customization

To customize for your organization:

1. Update branding in `+page.svelte`:
   - Change navbar title
   - Update color scheme in CSS
   - Add company logo

2. Add organization-specific features:
   - Connect to internal APIs
   - Display org-specific data
   - Add role-based access control

## 🆘 Troubleshooting

### "You are not a member of this organization"

- Verify the user is actually a member of the organization in Auth0 Dashboard
- Check that `AUTH0_ORGANIZATION_ID` matches exactly

### "unauthorized_organization" error

- The token's `org_id` doesn't match the configured organization
- This can happen if someone manually constructs a token
- Security working as expected!

### SSO not working

- Make sure both apps use the same Auth0 tenant
- Verify cookies are enabled
- Check that the user is logged into the main console first

## 📚 Additional Resources

- [Auth0 Organizations Documentation](https://auth0.com/docs/manage-users/organizations)
- [Auth0 Organization SSO](https://auth0.com/docs/authenticate/single-sign-on/organization-sso)
- [SvelteKit Docs](https://kit.svelte.dev/)
- [Vercel Deployment](https://vercel.com/docs)

## 🤝 Support

For questions about Auth0 integration:
- Check the main POC's `IMPLEMENTATION_PLAN.md`
- Review Auth0 documentation
- Contact your Auth0 representative
