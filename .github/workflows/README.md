# GitHub Workflows

This directory contains the CI/CD pipeline configurations for PawHaven project.

## Overview

The workflows automate the deployment process of all services and applications in the monorepo to Vercel.

## Available Workflows

### Deploy Pipeline (`deployment-pipline.yml`)

**Purpose**: Manually triggered workflow to deploy any service to Vercel (preview or production).

**Trigger**: Manual dispatch via GitHub Actions UI

**Deployable Services**:

- **Frontend Applications**:
  - `portal` - Main customer-facing portal
  - `admin` - Admin dashboard
- **Backend Services**:
  - `gateway` - API Gateway
  - `core-service` - Core business logic service
  - `auth-service` - Authentication service
  - `document-service` - Document management service

**Deployment Targets**:

- `preview` - For testing and staging (default)
- `production` - For live production deployments

## How to Use

### For Developers

1. **Navigate to Actions Tab**: Go to the GitHub repository → Actions tab

2. **Select "Deploy Pipeline"**: Click on the workflow name from the left sidebar

3. **Click "Run workflow"**:
   - Select the **service** you want to deploy from the dropdown
   - Choose the **target environment** (preview or production)
   - Click "Run workflow"

4. **Monitor Deployment**: Watch the workflow progress in real-time

5. **Check Results**: Once complete, check the deployment logs and Vercel deployment URL

### Prerequisites

Before running workflows, ensure:

- ✅ You have write access to the repository
- ✅ All required Vercel secrets are configured in repository settings
- ✅ Your code changes are merged to the target branch

## Required Secrets

The following secrets must be configured in **GitHub Repository Settings → Secrets and variables → Actions**:

```
VERCEL_TOKEN              # Vercel authentication token
VERCEL_ORG_ID             # Vercel organization ID
VERCEL_PROJECT_ID_PORTAL  # Vercel project ID for portal
VERCEL_PROJECT_ID_ADMIN   # Vercel project ID for admin
VERCEL_PROJECT_ID_GATEWAY # Vercel project ID for gateway
VERCEL_PROJECT_ID_CORE_SERVICE    # Vercel project ID for core-service
VERCEL_PROJECT_ID_AUTH_SERVICE    # Vercel project ID for auth-service
VERCEL_PROJECT_ID_DOCUMENT_SERVICE # Vercel project ID for document-service
```

### How to Find Your Vercel Credentials

#### 1. Vercel Token (`VERCEL_TOKEN`)

**Option A: Generate a new token**

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click on your profile picture (top right) → **Settings**
3. Navigate to **Tokens** in the left sidebar
4. Click **Create New Token**
5. Give it a name (e.g., "GitHub Actions Deploy")
6. Select appropriate scope (recommended: **Full Access** for deployments)
7. Click **Create Token**
8. **Copy the token immediately** - you won't see it again!

**Option B: Use existing token**

- If you have an existing token, locate it in your password manager or secure storage
- Tokens start with `...` (they look like long random strings)

⚠️ **Security Note**: Never commit tokens to your repository. Always store them as GitHub Secrets.

#### 2. Vercel Organization ID (`VERCEL_ORG_ID`)

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Make sure you're viewing the correct team/organization (top left dropdown)
3. Click on your profile picture → **Settings**
4. Look at the URL in your browser's address bar:
   ```
   https://vercel.com/settings/your-team-name
   ```
5. The Organization ID is NOT visible in the UI - you need to get it from the API:

**Method 1: Using Vercel CLI**

```bash
# Install Vercel CLI if not already installed
npm i -g vercel@latest

# Login to Vercel
vercel login

# Get team info
vercel teams ls

# The team ID will be displayed (looks like: team_xxxxxxxxxxxxxxxx)
```

**Method 2: Using Vercel API**

```bash
# After installing Vercel CLI and logging in
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://api.vercel.com/v2/teams | jq .
```

**Method 3: From Vercel Project Settings**

1. Go to your project in Vercel dashboard
2. Click **Settings** → **General**
3. Look for "Team ID" or "Organization ID" in the project information
4. It will look like: `team_xxxxxxxxxxxxxxxx` or `o_xxxxxxxxxxxxxxxx`

📝 **Note**: The Org ID typically starts with `team_` or `o_` followed by alphanumeric characters.

#### 3. Vercel Project IDs (`VERCEL_PROJECT_ID_*`)

Each service/application needs its own Vercel project:

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select the project you want to deploy (e.g., "PawHaven Portal")
3. Click on the project name
4. Go to **Settings** → **General**
5. Scroll down to **Project Information**
6. Find **Project ID** - it looks like: `prj_xxxxxxxxxxxxxxxxxxxxxxxx`
7. Copy this ID and add it as a GitHub Secret with the appropriate name

Repeat this process for each service:

- Portal → `VERCEL_PROJECT_ID_PORTAL`
- Admin → `VERCEL_PROJECT_ID_ADMIN`
- Gateway → `VERCEL_PROJECT_ID_GATEWAY`
- Core Service → `VERCEL_PROJECT_ID_CORE_SERVICE`
- Auth Service → `VERCEL_PROJECT_ID_AUTH_SERVICE`
- Document Service → `VERCEL_PROJECT_ID_DOCUMENT_SERVICE`

### Adding Secrets to GitHub

Once you have all the credentials:

1. Go to your GitHub repository
2. Click **Settings** tab
3. In the left sidebar, click **Secrets and variables** → **Actions**
4. Click **New repository secret** button
5. For each secret:
   - **Name**: Enter the exact name (e.g., `VERCEL_TOKEN`)
   - **Value**: Paste your credential value
   - Click **Add secret**
6. Repeat for all required secrets

✅ **Verification**: After adding all secrets, you can test them by running a workflow. The workflow will fail at the validation step if any secrets are missing or incorrect.

## Custom Actions

The workflow uses these reusable actions located in `.github/actions/`:

1. **`service-resolver`**: Determines the correct Vercel project ID and build filter based on the selected service

2. **`install-build`**: Handles pnpm installation and builds only the necessary packages using Turbo

3. **`vercel-deploy`**: Manages the actual deployment to Vercel with proper configuration

## Best Practices

### Before Deploying

- 🧪 Test your changes locally first
- 📝 Ensure commit messages follow conventional commits
- 🔍 Review code changes in the PR
- ✅ Run linting and type checking: `pnpm lint` and `pnpm build`

### Deployment Guidelines

- Use **preview** deployments for testing features before production
- Only deploy to **production** after thorough testing in preview
- Monitor workflow logs for any errors during deployment
- Wait for one deployment to complete before starting another

### Troubleshooting

**Workflow fails at checkout**:

- Check if you have proper repository permissions
- Verify the branch exists and is accessible

**Build fails**:

- Review the build logs for specific errors
- Ensure all dependencies are properly installed
- Check if TypeScript compilation passes locally

**Vercel deployment fails**:

- Verify all Vercel secrets are correctly configured
- Check Vercel project settings and environment variables
- Review Vercel deployment logs for detailed error messages

## Workflow Architecture

```
graph TD
    A[Manual Trigger] --> B[Checkout Code]
    B --> C[Resolve Service Config]
    C --> D[Install & Build Packages]
    D --> E[Deploy to Vercel]
    E --> F{Success?}
    F -->|Yes| G[Deployment Complete]
    F -->|No| H[Check Logs]
```

## Additional Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Vercel Deployment Guide](https://vercel.com/docs/deployments)
- [Turbo Repositories](https://turbo.build/repo/docs)
- [Project README](../../README.MD)

## Support

For issues or questions about workflows:

- Check existing issues in the repository
- Contact the DevOps team
- Review the workflow logs for error details
