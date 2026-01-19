# rdtect OS - Coolify Deployment Guide

This guide covers deploying rdtect OS to [Coolify](https://coolify.io), a self-hosted PaaS platform.

## Prerequisites

- A VPS with Coolify installed ([Installation Guide](https://coolify.io/docs/get-started/installation))
- GitHub repository with this codebase
- Domain name pointed to your VPS (optional but recommended)

## Architecture Overview

rdtect OS consists of three main services:

| Service | Port | Description |
|---------|------|-------------|
| **frontend** | 3000 | SvelteKit web application |
| **pocketbase** | 8090 | Database, auth, and admin UI |
| **python-backend** | 8000 | AI/OpenAI integration API |

Optional:
| Service | Port | Description |
|---------|------|-------------|
| **piston** | 2000 | Code execution engine |

---

## Step 1: Connect GitHub Repository

### Option A: Public Repository

1. Go to your Coolify dashboard
2. Click **"Create New Resource"** in your project
3. Select **"Public Repository"**
4. Enter your GitHub repository URL:
   ```
   https://github.com/YOUR_USERNAME/desktop-os
   ```

### Option B: Private Repository

1. Go to **Settings > Git** in Coolify
2. Click **"Add GitHub App"** and follow the OAuth flow
3. Grant access to your repository
4. When creating a resource, select **"GitHub App"** as the source

---

## Step 2: Configure Docker Compose Deployment

1. After connecting your repo, click **"Nixpacks"** dropdown
2. Select **"Docker Compose"** as the build pack
3. Set the **Compose file path** to:
   ```
   docker-compose.prod.yml
   ```

### Important Settings

In the resource configuration:

- **Enable "Connect to Predefined Network"** if you need cross-stack communication
- **Disable "Include Source Commit in Build"** to preserve Docker layer caching

---

## Step 3: Environment Variables

Navigate to **Environment Variables** in your resource settings and configure:

### Required Variables

```env
# Domain Configuration
DOMAIN=your-domain.com
ORIGIN=https://your-domain.com

# OpenAI API Key (for AI features)
OPENAI_API_KEY=sk-your-api-key-here

# PocketBase Admin (CHANGE THESE!)
POCKETBASE_ADMIN_EMAIL=admin@your-domain.com
POCKETBASE_ADMIN_PASSWORD=your-secure-password-here
```

### Optional Variables

```env
# OpenAI Model Selection
OPENAI_MODEL=gpt-4o-mini

# PocketBase Encryption (recommended for production)
PB_ENCRYPTION_KEY=your-32-char-encryption-key

# Port Overrides (usually not needed with Coolify)
FRONTEND_PORT=3000
POCKETBASE_PORT=8090
PYTHON_BACKEND_PORT=8000
```

### Service URLs (Internal - Usually Auto-configured)

```env
# These use Docker service names for inter-container communication
PUBLIC_POCKETBASE_URL=http://pocketbase:8090
PUBLIC_PYTHON_BACKEND_URL=http://python-backend:8000
POCKETBASE_URL=http://pocketbase:8090
```

---

## Step 4: Domain & SSL Configuration

### Assigning Domains

Coolify uses Traefik for routing. Assign domains to each service:

1. **Frontend** (main application):
   - Domain: `your-domain.com` or `app.your-domain.com`
   - Port: 3000

2. **PocketBase** (database admin):
   - Domain: `pb.your-domain.com` or `db.your-domain.com`
   - Port: 8090

3. **Python Backend** (API):
   - Domain: `api.your-domain.com`
   - Port: 8000

### SSL Certificates

Coolify automatically provisions SSL certificates via Let's Encrypt:

1. Ensure your domain's DNS A record points to your VPS IP
2. In domain settings, enable **"HTTPS"**
3. Coolify will automatically obtain and renew certificates

### DNS Configuration Example

```
A     @              -> YOUR_VPS_IP
A     app            -> YOUR_VPS_IP
A     pb             -> YOUR_VPS_IP
A     api            -> YOUR_VPS_IP
```

---

## Step 5: Health Check Endpoints

Each service exposes health check endpoints:

| Service | Endpoint | Expected Response |
|---------|----------|-------------------|
| Frontend | `GET /` | 200 OK |
| PocketBase | `GET /api/health` | 200 OK |
| Python Backend | `GET /health` | 200 OK with JSON |

Coolify monitors these automatically based on the `healthcheck` configuration in `docker-compose.prod.yml`.

### Custom Health Check Configuration

If you need to adjust health checks in Coolify:

1. Go to **Advanced** settings for your resource
2. Adjust **Health Check Interval**, **Timeout**, and **Retries**
3. For services that take longer to start, increase **Start Period**

---

## Step 6: PocketBase Data Backup Strategy

### Automatic Backups with Coolify

1. **Volume Backups**: Coolify can backup Docker volumes
   - Navigate to your resource's **Volumes** section
   - Enable backup for `rdtect-pocketbase-data`

2. **Scheduled Backups**: Configure in Coolify's backup settings
   - Daily recommended for active databases
   - Weekly for less critical data

### Manual Backup Commands

```bash
# SSH into your VPS and run:
docker exec rdtect-pocketbase ./pocketbase backup

# Backups are stored in /pb_data/backups/

# Copy backup to local machine:
docker cp rdtect-pocketbase:/pb_data/backups/ ./backups/
```

### Backup Best Practices

1. **Store backups off-server**: Use S3, B2, or another cloud storage
2. **Test restores regularly**: Ensure backups are actually recoverable
3. **Encrypt sensitive backups**: PocketBase data may contain user information

### Restore from Backup

```bash
# Stop the pocketbase container
docker stop rdtect-pocketbase

# Copy backup file into the container
docker cp ./backup.zip rdtect-pocketbase:/pb_data/

# Restore (inside container)
docker exec rdtect-pocketbase ./pocketbase migrate

# Restart
docker start rdtect-pocketbase
```

---

## Deployment Methods

### Method 1: Auto-Deploy (Recommended)

1. Go to your resource's **Advanced** settings
2. Enable **"Auto Deploy"**
3. Set a **Webhook Secret** (random string)
4. Copy the webhook URL and add it to GitHub:
   - GitHub Repo > Settings > Webhooks > Add webhook
   - Paste the URL and secret
   - Select **"Just the push event"**

### Method 2: GitHub Actions (CI/CD Pipeline)

See `.github/workflows/deploy.yml` for the automated workflow that:
- Builds Docker images
- Pushes to GitHub Container Registry (GHCR)
- Triggers Coolify deployment webhook

**Required GitHub Secrets:**
```
COOLIFY_WEBHOOK_URL    - Your Coolify deployment webhook URL
COOLIFY_TOKEN          - API token from Coolify (Settings > Keys & Tokens)
```

### Method 3: Manual Deploy

In Coolify dashboard:
1. Navigate to your resource
2. Click **"Deploy"** button
3. Monitor the build logs

---

## Enabling API Access for Webhooks

To use GitHub Actions deployment:

1. Go to Coolify **Settings > Advanced**
2. Enable **"API Access"**
3. Go to **Settings > Keys & Tokens**
4. Create a new token with **"deploy"** permission
5. Copy and save the token (shown only once)

---

## Production Checklist

Before going live, ensure:

- [ ] Domain DNS configured correctly
- [ ] SSL certificates provisioned
- [ ] Environment variables set (especially secrets)
- [ ] PocketBase admin password changed from default
- [ ] Backup strategy configured
- [ ] Health checks passing
- [ ] Resource limits configured (CPU/Memory)
- [ ] Firewall rules configured on VPS

---

## Troubleshooting

### Common Issues

**"Port is already allocated"**
- Don't expose ports directly in docker-compose when using Coolify
- Remove `ports:` sections and let Coolify handle routing

**Build cache not preserved**
- Disable "Include Source Commit in Build" in Advanced settings

**Services can't communicate**
- Enable "Connect to Predefined Network"
- Use service names (not localhost) for inter-service URLs

**SSL certificate errors**
- Verify DNS is pointing to correct IP
- Check Traefik logs: `docker logs coolify-traefik`

### Viewing Logs

```bash
# In Coolify dashboard: Resource > Logs

# Or via SSH:
docker logs rdtect-frontend
docker logs rdtect-pocketbase
docker logs rdtect-python-backend
```

### Restarting Services

```bash
# Via Coolify: Resource > Restart

# Or via SSH:
docker compose -f docker-compose.prod.yml restart frontend
```

---

## Resource Recommendations

### Minimum VPS Specs
- 2 vCPU
- 4 GB RAM
- 40 GB SSD

### Recommended for Production
- 4 vCPU
- 8 GB RAM
- 80 GB SSD
- Regular backups enabled

---

## Support & References

- [Coolify Documentation](https://coolify.io/docs)
- [Coolify Docker Compose Guide](https://coolify.io/docs/knowledge-base/docker/compose)
- [GitHub Discussions](https://github.com/coollabsio/coolify/discussions)
- [PocketBase Documentation](https://pocketbase.io/docs)
