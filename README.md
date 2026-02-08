# GradeLens - Developer Commands Guide

This document contains all essential commands for running GradeLens locally and deploying to production.

---

## 🟢 Local Development (Docker Compose)

### Test 1: Development Configuration

#### Start Services
```powershell
cd c:\Users\ADMIN\Desktop\Program\GradeLens\infra
docker compose -f docker-compose.dev.yml down
docker compose -f docker-compose.dev.yml up -d --build
```

#### Start Frontend Dev Server (Separate Terminal)
```powershell
cd c:\Users\ADMIN\Desktop\Program\GradeLens\presentation\frontend
npm run dev
```

#### Monitor Logs
```powershell
# All services
docker compose -f docker-compose.dev.yml logs -f

# Specific service
docker compose -f docker-compose.dev.yml logs -f api
docker compose -f docker-compose.dev.yml logs -f cv-worker
docker compose -f docker-compose.dev.yml logs -f cv-api

# You can also view the logs in Docker Engine itself
```

#### Check Status
```powershell
docker compose -f docker-compose.dev.yml ps
```

#### Access Points (Dev)
- Frontend Dev Server: http://localhost:5173
- API: http://localhost:3000/api
- CV API: http://localhost:8000
- API Health Check: http://localhost:3000/api/health
- CV API Health: http://localhost:8000/health
- MongoDB: localhost:27017
- Redis: localhost:6379

#### Verify Dev Setup
- [ ] All 5 containers running (api, cv-worker, cv-api, mongo, redis)
- [ ] API health check: http://localhost:3000/api/health
- [ ] CV API health: http://localhost:8000/health
- [ ] Hot reload works (edit src file and see restart)
- [ ] Logs show "npm run dev" for API
- [ ] Frontend accessible at http://localhost:5173

#### MongoDB Commands (Local Dev)
```powershell
# Access MongoDB shell
docker exec -it gradelens-mongo mongosh gradelens

# Seed admin user
docker exec -it gradelens-api npx tsx src/scripts/seed-admin.ts

# Export scans collection
docker exec gradelens-mongo mongosh gradelens --quiet --eval "printjson(db.scans.find().toArray())" > scan_full_pretty.json

# View collections
docker exec gradelens-mongo mongosh gradelens --quiet --eval "db.getCollectionNames()"

# Count documents in a collection
docker exec gradelens-mongo mongosh gradelens --quiet --eval "db.scans.countDocuments()"
```

#### Rebuild Specific Service
```powershell
# If you make changes and need to rebuild
docker compose -f docker-compose.dev.yml build api --no-cache
docker compose -f docker-compose.dev.yml up -d api

# Or rebuild all
docker compose -f docker-compose.dev.yml up -d --build
```

#### Stop Dev Services
```powershell
docker compose -f docker-compose.dev.yml down

# Stop and remove volumes (clean slate)
docker compose -f docker-compose.dev.yml down -v
```

---

## 🔴 Production Deployment (DigitalOcean)

### Initial Setup

#### 1. Clone Repository
```bash
cd /opt
sudo git clone https://github.com/Zedbyte/GradeLens.git gradelens
cd gradelens
ls -la
```

#### 2. Create Environment File
```bash
cd /opt/gradelens/infra
```

```bash
# Generate secure secrets
JWT_ACCESS_SECRET=$(openssl rand -base64 32)
JWT_REFRESH_SECRET=$(openssl rand -base64 32)

cat > .env << EOF
# JWT Secrets (Auto-generated)
JWT_ACCESS_SECRET=${JWT_ACCESS_SECRET}
JWT_REFRESH_SECRET=${JWT_REFRESH_SECRET}

# Database
MONGO_URL=mongodb://mongo:27017/gradelens

# Redis
REDIS_URL=redis://redis:6379/0

# Application
NODE_ENV=production
PORT=3000
SCAN_STORAGE_DIR=/data/scans
ALLOWED_ORIGINS=http://143.198.207.23

# CV Service
DEBUG=false
IMAGE_ROOT=/data/scans
EOF
```

#### 3. Build All Services
```bash
cd /opt/gradelens/infra
docker compose build
```

#### 4. Start All Services
```bash
docker compose up -d
```

#### 5. Check Status
```bash
docker compose ps
```

All services should show "Up" status:
- gradelens-nginx
- gradelens-frontend
- gradelens-api
- gradelens-cv-worker
- gradelens-cv-api
- gradelens-mongo
- gradelens-redis

#### 6. Seed Admin User
```bash
docker compose exec api node dist/scripts/seed-admin.js
```

#### 7. Verify Deployment
- [ ] Access application: http://143.198.207.23
- [ ] Check health: http://143.198.207.23/health
- [ ] Log in with admin credentials
- [ ] All containers running without restarts

---

### Updating the Application

#### Pull Latest Changes
```bash
cd /opt/gradelens
git pull
```

#### Rebuild and Restart Specific Service
```bash
cd /opt/gradelens/infra

# Rebuild API only
docker compose build api
docker compose up -d api

# Rebuild Frontend only (for UI changes)
docker compose build frontend
docker compose up -d frontend

# Restart Nginx (after any backend change)
docker compose restart nginx
```

#### Rebuild All Services
```bash
cd /opt/gradelens/infra
docker compose build
docker compose up -d
```

#### Force Rebuild (No Cache)
```bash
docker compose build --no-cache api
docker compose build --no-cache frontend
docker compose up -d
```

---

### Monitoring & Logs

#### View All Logs
```bash
cd /opt/gradelens/infra
docker compose logs -f
```

#### View Specific Service Logs
```bash
# API logs
docker compose logs -f api

# Frontend logs
docker compose logs -f frontend

# Nginx logs
docker compose logs -f nginx

# CV Worker logs
docker compose logs -f cv-worker

# CV API logs
docker compose logs -f cv-api

# MongoDB logs
docker compose logs -f mongo

# Redis logs
docker compose logs -f redis
```

#### View Last N Lines
```bash
docker compose logs --tail=100 api
```

#### Check Container Status
```bash
docker compose ps

# Detailed inspection
docker inspect gradelens-api
```

---

### MongoDB Operations (Production)

#### Access MongoDB Shell
```bash
docker compose exec mongo mongosh gradelens
```

#### Seed Admin User
```bash
docker compose exec api node dist/scripts/seed-admin.js
```

#### Common MongoDB Queries
```bash
# List all collections
docker compose exec mongo mongosh gradelens --quiet --eval "db.getCollectionNames()"

# Count documents
docker compose exec mongo mongosh gradelens --quiet --eval "db.scans.countDocuments()"
docker compose exec mongo mongosh gradelens --quiet --eval "db.users.countDocuments()"

# Find all users
docker compose exec mongo mongosh gradelens --quiet --eval "db.users.find().pretty()"

# Export data
docker compose exec mongo mongosh gradelens --quiet --eval "printjson(db.scans.find().toArray())" > scans_export.json
```

#### Backup Database
```bash
# Create backup
docker compose exec mongo mongodump --db=gradelens --out=/tmp/backup

# Copy backup to host
docker cp gradelens-mongo:/tmp/backup ./mongodb_backup_$(date +%Y%m%d)
```

---

### Nginx Operations

#### Restart Nginx
```bash
docker compose restart nginx
```

#### Reload Nginx Config
```bash
docker compose exec nginx nginx -s reload
```

#### Test Nginx Config
```bash
docker compose exec nginx nginx -t
```

#### View Nginx Access Logs
```bash
docker compose logs nginx | grep "POST\|GET\|DELETE\|PUT"
```

---

### Service Management

#### Restart Specific Service
```bash
docker compose restart api
docker compose restart frontend
docker compose restart nginx
```

#### Restart All Services
```bash
docker compose restart
```

#### Stop All Services
```bash
docker compose stop
```

#### Start All Services
```bash
docker compose start
```

#### Remove All Services (Keep Data)
```bash
docker compose down
```

#### Remove All Services and Volumes (Clean Slate)
```bash
docker compose down -v
```

---

### Frontend Changes Deployment

When you update frontend code (LoginForm, components, etc.):

```bash
# 1. Pull latest code
cd /opt/gradelens
git pull

# 2. Rebuild frontend container
cd infra
docker compose build frontend

# 3. Restart frontend
docker compose up -d frontend

# 4. Restart nginx to clear cache
docker compose restart nginx

# 5. Clear browser cache (on client side)
# Hard refresh: Ctrl + Shift + R
```

---

### Troubleshooting

#### Check Container Health
```bash
docker compose ps
docker inspect gradelens-api | grep -A 10 "State"
```

#### Enter Container Shell
```bash
docker compose exec api sh
docker compose exec frontend sh
```

#### Check Network Connectivity
```bash
# From nginx to api
docker compose exec nginx wget -O- http://api:3000/api/health

# From api to mongo
docker compose exec api sh
nc -zv mongo 27017
```

#### Remove and Rebuild Everything
```bash
docker compose down -v
docker compose build --no-cache
docker compose up -d
```

#### Check Disk Space
```bash
df -h
docker system df
docker system prune -a
```

---

## 🔒 SSL/HTTPS Setup with Let's Encrypt

### Prerequisites
- Domain name pointing to droplet IP (143.198.207.23)
- Ports 80 and 443 open in firewall

### Step 1: Install Certbot
```bash
sudo apt update
sudo apt install certbot -y
```

### Step 2: Stop Nginx Temporarily
```bash
cd /opt/gradelens/infra
docker compose stop nginx
```

### Step 3: Obtain SSL Certificate
```bash
# Replace yourdomain.com with your actual domain
sudo certbot certonly --standalone -d yourdomain.com -d www.yourdomain.com

# Certificates will be saved at:
# /etc/letsencrypt/live/yourdomain.com/fullchain.pem
# /etc/letsencrypt/live/yourdomain.com/privkey.pem
```

### Step 4: Update Docker Compose
Edit `/opt/gradelens/infra/docker-compose.yml`:

```yaml
nginx:
  image: nginx:alpine
  container_name: gradelens-nginx
  ports:
    - "80:80"
    - "443:443"  # Add HTTPS port
  volumes:
    - ./nginx/nginx.conf:/etc/nginx/conf.d/default.conf:ro
    - /etc/letsencrypt:/etc/letsencrypt:ro  # Mount certificates
```

### Step 5: Update Nginx Configuration
Update `/opt/gradelens/infra/nginx/nginx.conf` to include SSL configuration for HTTPS on port 443.

### Step 6: Restart Services
```bash
docker compose up -d
```

### Step 7: Test Auto-Renewal
```bash
sudo certbot renew --dry-run
```

### Step 8: Set Up Auto-Renewal Cron Job
```bash
sudo crontab -e

# Add line:
0 3 * * * certbot renew --quiet && docker compose -f /opt/gradelens/infra/docker-compose.yml restart nginx
```

---

## 📝 Quick Reference

### Local Development
```powershell
# Start
cd infra
docker compose -f docker-compose.dev.yml up -d --build

# Frontend
cd presentation/frontend
npm run dev

# Stop
docker compose -f docker-compose.dev.yml down
```

### Production Deployment
```bash
# Deploy
cd /opt/gradelens
git pull
cd infra
docker compose build
docker compose up -d

# Update frontend only
docker compose build frontend
docker compose up -d frontend
docker compose restart nginx

# View logs
docker compose logs -f api
```

### MongoDB
```bash
# Local
docker exec -it gradelens-mongo mongosh gradelens
docker exec -it gradelens-api npx tsx src/scripts/seed-admin.ts

# Production
docker compose exec mongo mongosh gradelens
docker compose exec api node dist/scripts/seed-admin.js
```

---

## 🔗 Important URLs

### Local Development
- Frontend: http://localhost:5173
- API: http://localhost:3000/api
- API Health: http://localhost:3000/api/health
- CV API: http://localhost:8000

### Production
- Application: http://143.198.207.23 (or https://yourdomain.com with SSL)
- API Health: http://143.198.207.23/health
- API Endpoint: http://143.198.207.23/api
- CV API: http://143.198.207.23/cv

---

**Last Updated:** February 8, 2026