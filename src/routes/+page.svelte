<script lang="ts">
	import type { PageData } from './$types';

	export let data: PageData;

	async function handleLogout() {
		try {
			const response = await fetch('/api/auth/logout', {
method: 'POST'
});

			const result = await response.json();

			if (result.logoutUrl) {
				window.location.href = result.logoutUrl;
			} else {
				window.location.href = '/';
			}
		} catch (err) {
			console.error('Logout error:', err);
			window.location.href = '/';
		}
	}
</script>

<svelte:head>
	<title>Single-Tenant Internal App</title>
</svelte:head>

{#if data.error}
	<div class="error-page">
		<h1>⚠️ Authentication Error</h1>
		<p>Error: {data.error}</p>
		<a href="/api/auth/login">Try Again</a>
	</div>
{:else if data.user}
	<div class="app">
		<nav class="navbar">
			<div class="nav-content">
				<h2>🏢 Single-Tenant Internal App</h2>
				<button on:click={handleLogout} class="logout-btn">Sign Out</button>
			</div>
		</nav>

		<div class="container">
			<div class="header">
				<h1>Welcome to the Internal Application!</h1>
				<div class="org-badge">
					<span>🔒</span>
					<div>
						<strong>Organization Scoped</strong>
						<p>This app is restricted to organization: {data.user.org_name || data.user.org_id}</p>
					</div>
				</div>
			</div>

			<div class="content">
				<div class="card user-card">
					{#if data.user.picture}
						<img src={data.user.picture} alt={data.user.name} class="avatar" />
					{:else}
						<div class="avatar-placeholder">
							{data.user.name?.charAt(0) || 'U'}
						</div>
					{/if}
					<div class="user-info">
						<h2>{data.user.name}</h2>
						<p class="email">{data.user.email}</p>
						<p class="user-id">ID: {data.user.sub}</p>
					</div>
				</div>

				<div class="card">
					<h3>🎯 Single-Tenant App Features</h3>
					<ul class="feature-list">
						<li>✅ Restricted to specific Auth0 Organization</li>
						<li>✅ Separate Auth0 application configuration</li>
						<li>✅ Organization ID enforced at login</li>
						<li>✅ Token always contains org_id</li>
						<li>✅ Users from other orgs cannot access</li>
					</ul>
				</div>

				<div class="card">
					<h3>🔐 Organization Context</h3>
					<div class="org-details">
						<div class="detail">
							<span class="label">Organization ID:</span>
							<code>{data.user.org_id}</code>
						</div>
						{#if data.user.org_name}
							<div class="detail">
								<span class="label">Organization Name:</span>
								<code>{data.user.org_name}</code>
							</div>
						{/if}
					</div>
				</div>

				<div class="card info">
					<h3>📝 How This Works</h3>
					<ol>
						<li>This app has a separate Auth0 application configuration</li>
						<li>In Auth0, this app is set to "Require organization" with a specific org selected</li>
						<li>During login, the <code>organization</code> parameter is included in the authorize URL</li>
						<li>Auth0 only allows users from the specified organization to authenticate</li>
						<li>The callback verifies the org_id in the token matches the expected organization</li>
					</ol>
				</div>

				<div class="card warning">
					<h3>⚠️ Setup Required</h3>
					<p>To use this app, you need to:</p>
					<ol>
						<li>Create a new Application in Auth0 Dashboard</li>
						<li>Enable Organizations and select "Require organization"</li>
						<li>Choose the specific organization this app should serve</li>
						<li>Update <code>.env</code> with the new app's credentials</li>
<li>Add callback URL to the Auth0 app: <code>http://localhost:3001/api/auth/callback</code></li>
</ol>
</div>
</div>
</div>
</div>
{/if}

<style>
:global(body) {
margin: 0;
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell,
sans-serif;
background: #f5f7fa;
}

.error-page {
min-height: 100vh;
display: flex;
flex-direction: column;
align-items: center;
justify-content: center;
gap: 20px;
}

.error-page h1 {
color: #d32f2f;
}

.error-page a {
padding: 10px 20px;
background: #2196f3;
color: white;
text-decoration: none;
border-radius: 6px;
}

.app {
min-height: 100vh;
}

.navbar {
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
color: white;
box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
padding: 16px 0;
}

.nav-content {
max-width: 1200px;
margin: 0 auto;
padding: 0 24px;
display: flex;
justify-content: space-between;
align-items: center;
}

.nav-content h2 {
margin: 0;
font-size: 20px;
}

.logout-btn {
padding: 8px 16px;
background: rgba(255, 255, 255, 0.2);
color: white;
border: none;
border-radius: 6px;
font-size: 14px;
font-weight: 500;
cursor: pointer;
transition: background 0.2s;
}

.logout-btn:hover {
background: rgba(255, 255, 255, 0.3);
}

.container {
max-width: 1200px;
margin: 0 auto;
padding: 0 24px 48px;
}

.header {
margin-bottom: 32px;
}

.header h1 {
margin: 24px 0 16px 0;
font-size: 36px;
color: #1a1a1a;
}

.org-badge {
display: inline-flex;
align-items: center;
gap: 12px;
padding: 16px 20px;
background: linear-gradient(135deg, #fce4ec 0%, #f8bbd0 100%);
border-radius: 8px;
border: 2px solid #c2185b;
}

.org-badge span {
font-size: 24px;
}

.org-badge strong {
display: block;
color: #880e4f;
margin-bottom: 4px;
}

.org-badge p {
margin: 0;
color: #880e4f;
font-size: 14px;
}

.content {
display: grid;
gap: 24px;
}

.card {
background: white;
border-radius: 12px;
padding: 24px;
box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.user-card {
display: flex;
align-items: center;
gap: 24px;
}

.avatar,
.avatar-placeholder {
width: 80px;
height: 80px;
border-radius: 50%;
}

.avatar-placeholder {
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
color: white;
display: flex;
align-items: center;
justify-content: center;
font-size: 32px;
font-weight: 600;
}

.user-info h2 {
margin: 0 0 8px 0;
font-size: 28px;
color: #1a1a1a;
}

.email {
color: #666;
font-size: 16px;
margin: 0 0 8px 0;
}

.user-id {
color: #999;
font-size: 13px;
font-family: monospace;
margin: 0;
}

.card h3 {
margin: 0 0 16px 0;
font-size: 20px;
color: #1a1a1a;
}

.feature-list {
list-style: none;
padding: 0;
margin: 0;
}

.feature-list li {
padding: 8px 0;
color: #666;
}

.org-details {
display: flex;
flex-direction: column;
gap: 12px;
}

.detail {
display: flex;
gap: 12px;
align-items: center;
}

.label {
font-weight: 600;
color: #666;
min-width: 150px;
}

code {
background: #f5f5f5;
padding: 4px 8px;
border-radius: 4px;
font-family: 'Courier New', monospace;
font-size: 14px;
color: #d32f2f;
}

.info ol,
.warning ol {
margin: 16px 0;
padding-left: 24px;
color: #666;
}

.info li,
.warning li {
margin: 8px 0;
line-height: 1.6;
}

.warning {
background: linear-gradient(135deg, #fff8e1 0%, #ffecb3 100%);
border-left: 4px solid #f57c00;
}

.warning h3 {
color: #e65100;
}
</style>
