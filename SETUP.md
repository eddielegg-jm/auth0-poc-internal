# Quick Setup Guide - Single-Tenant Internal App

Follow these steps to get the internal app running:

## Step 1: Create Auth0 Application

1. Go to https://manage.auth0.com
2. **Applications** → **Create Application**
3. Name: "Internal App Demo" (or your org name)
4. Type: **Regular Web Application**
5. Click **Create**

## Step 2: Configure Auth0 Application

### Basic Settings Tab
1. Copy **Client ID** and **Client Secret** (you'll need these)
2. Scroll to **Application URIs**:
   - **Allowed Callback URLs**: Add `http://localhost:3001/api/auth/callback`
   - **Allowed Logout URLs**: Add `http://localhost:3001`
3. Click **Save Changes**

### Organizations Tab
1. Click **Enable Organizations**
2. Select **Require organization** (IMPORTANT!)
3. Choose the organization this app should serve
4. Click **Save**

### Get Organization ID
1. Go to **Organizations** in left sidebar
2. Click on your organization
3. Copy the **Organization ID** (starts with `org_`)

## Step 3: Configure Environment

1. Open `.env` file in this directory
2. Update these values:
   ```bash
   AUTH0_CLIENT_ID=<paste-client-id-here>
   AUTH0_CLIENT_SECRET=<paste-client-secret-here>
   AUTH0_ORGANIZATION_ID=<paste-org-id-here>
   ```

3. Generate a session secret:
   ```bash
   openssl rand -base64 32
   ```
   Copy the output and paste into:
   ```bash
   AUTH0_SESSION_SECRET=<paste-generated-secret-here>
   ```

4. Keep other values as-is for local development

## Step 4: Run the App

```bash
pnpm dev -- --port 3001
```

Open http://localhost:3001 - you should be redirected to Auth0 for login!

## Testing SSO

To test Single Sign-On between the main console and this internal app:

1. **Terminal 1** - Start main console:
   ```bash
   cd /Users/eddie.legg/Code/auth0-poc/app
   pnpm dev
   ```

2. **Terminal 2** - Start this internal app:
   ```bash
   cd /Users/eddie.legg/Code/auth0-internal-app
   pnpm dev -- --port 3001
   ```

3. **Browser**:
   - Open http://localhost:5173 (main console)
   - Log in with your Auth0 account
   - Select your organization
   - From the dashboard, click "Internal App 1" or "Internal App 2"
   - You should be redirected to http://localhost:3001
   - Should see SSO success notification (no login prompt!)

## What You Should See

After successful login:
- ✅ Your user profile (name, email, avatar)
- ✅ Organization badge showing which org you're in
- ✅ Organization ID and name displayed
- ✅ Explanation of how it works

## Troubleshooting

### "You are not a member of this organization"
- Make sure you're a member of the organization in Auth0
- Verify `AUTH0_ORGANIZATION_ID` matches the org you're in

### "Missing environment variable" error
- Check all required variables are set in `.env`
- Make sure there are no typos

### Can't access http://localhost:3001
- Check if port 3001 is already in use
- Try a different port: `pnpm dev -- --port 3002`

### SSO not working
- Make sure both apps use the same Auth0 tenant
- Verify you're logged into the main console first
- Check browser cookies are enabled

## Next Steps

Once it's working locally, check `README.md` for:
- Deployment to Vercel
- Customization options
- Production configuration
