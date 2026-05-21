# Deployment Guide - Phase 1

## Production Checklist

Before deploying to production, ensure:

- [ ] Environment variables set (use secrets management)
- [ ] Database backups configured
- [ ] Monitoring and logging enabled
- [ ] CORS properly configured
- [ ] Rate limiting implemented
- [ ] SSL/HTTPS enabled
- [ ] Security headers set (Helmet.js ✅)

## Deployment Options

### Option 1: AWS (Recommended for this project)

**Services:**
- API: AWS EC2 or ECS
- Database: AWS RDS PostgreSQL
- Cache: AWS ElastiCache (Redis)
- Storage: AWS S3 (already integrated)
- CDN: CloudFront

**Steps:**

1. Create RDS PostgreSQL instance
2. Create ElastiCache Redis cluster
3. Deploy API to ECS/Fargate
4. Run migrations on RDS
5. Configure security groups
6. Set up CloudFront CDN

### Option 2: Heroku (Quick deployment)

```bash
# Install Heroku CLI
# Login to Heroku
heroku login

# Create app
heroku create ailearnemate

# Add PostgreSQL
heroku addons:create heroku-postgresql:standard-0

# Add Redis
heroku addons:create heroku-redis:premium-0

# Set environment variables
heroku config:set \
  JWT_SECRET=your_secret \
  OPENAI_API_KEY=sk-... \
  AWS_ACCESS_KEY_ID=... \
  AWS_SECRET_ACCESS_KEY=... \
  AWS_S3_BUCKET=...

# Deploy
git push heroku main

# Run migrations
heroku run npm run migrate
```

### Option 3: Docker + AWS ECS

**Dockerfile:**
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 5000

CMD ["node", "server.js"]
```

**Build & Push:**
```bash
# Build image
docker build -t ailearnemate:latest .

# Tag for ECR
docker tag ailearnemate:latest <YOUR_ECR_URI>/ailearnemate:latest

# Push to ECR
docker push <YOUR_ECR_URI>/ailearnemate:latest

# Deploy to ECS using AWS Console or CLI
```

## Environment Variables for Production

```env
# Server
NODE_ENV=production
PORT=5000

# Database (use AWS RDS)
DB_HOST=ailearnemate-db.xxxxx.rds.amazonaws.com
DB_PORT=5432
DB_NAME=ailearnemate_prod
DB_USER=postgres
DB_PASSWORD=<SECURE_PASSWORD>

# Redis (use AWS ElastiCache)
REDIS_HOST=ailearnemate-redis.xxxxx.ng.0001.use1.cache.amazonaws.com
REDIS_PORT=6379
REDIS_PASSWORD=<REDIS_PASSWORD>

# AWS S3
AWS_ACCESS_KEY_ID=<SECURE_KEY>
AWS_SECRET_ACCESS_KEY=<SECURE_SECRET>
AWS_S3_BUCKET=ailearn-mate-videos-prod
AWS_REGION=ap-south-1

# OpenAI
OPENAI_API_KEY=<SECURE_API_KEY>

# JWT
JWT_SECRET=<VERY_SECURE_SECRET_32_CHARS_MIN>
JWT_EXPIRE=7d

# CORS
CORS_ORIGIN=https://ailearnemate.com

# Logging
LOG_LEVEL=info
```

## Database Backup

```bash
# Automated backup with AWS RDS
# Enable automated backups in RDS console (7-35 days retention)

# Manual backup
pg_dump -h ailearnemate-db.xxxxx.rds.amazonaws.com \
  -U postgres -d ailearnemate_prod > backup.sql

# Restore
psql -h localhost -U postgres -d ailearnemate < backup.sql
```

## Monitoring & Logging

### CloudWatch (AWS)
```javascript
// In config/logger.js
const winston = require('winston');
const WinstonCloudWatch = require('winston-cloudwatch');

logger.add(new WinstonCloudWatch({
  logGroupName: '/aws/ecs/ailearnemate',
  logStreamName: 'api',
  awsRegion: process.env.AWS_REGION,
}));
```

### Metrics to Monitor
- Request latency
- Error rate
- Database connection pool
- Redis memory usage
- S3 upload success rate
- API response time (p50, p95, p99)

### Alerts
- Server down
- Database connection errors
- API error rate > 5%
- Response time > 1s
- Redis disconnected

## SSL/HTTPS

```javascript
// server.js (with SSL)
const https = require('https');
const fs = require('fs');

const options = {
  key: fs.readFileSync('/path/to/key.pem'),
  cert: fs.readFileSync('/path/to/cert.pem'),
};

https.createServer(options, app).listen(443);
```

For production:
- Use AWS Certificate Manager (free)
- Enable auto-renewal
- Redirect HTTP to HTTPS

## Rate Limiting

Add to `server.js`:

```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP'
});

app.use('/api/', limiter);

// Stricter limit for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // 5 login attempts per 15 min
});

app.use('/api/auth/login', authLimiter);
app.use('/api/auth/signup', authLimiter);
```

## CORS Configuration

```javascript
// server.js
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
  optionsSuccessStatus: 200,
}));
```

## Health Check Endpoint

Already implemented at: `GET /health`

Use this for:
- Load balancer health checks
- Kubernetes liveness probes
- Monitoring

## Deployment Checklist

Before deploying:

- [ ] All env vars configured
- [ ] SSL certificate installed
- [ ] Database backups enabled
- [ ] Monitoring configured
- [ ] Logging centralized
- [ ] Rate limiting enabled
- [ ] CORS configured
- [ ] Security headers set (Helmet.js ✅)
- [ ] Database migrations run
- [ ] Test critical flows (signup, login, upload)

## Post-Deployment

1. **Verify health endpoint:**
   ```bash
   curl https://api.ailearnemate.com/health
   ```

2. **Test authentication:**
   ```bash
   curl -X POST https://api.ailearnemate.com/api/auth/signup ...
   ```

3. **Monitor logs:**
   ```bash
   # AWS CloudWatch
   aws logs tail /aws/ecs/ailearnemate --follow
   ```

4. **Check database:**
   ```bash
   psql -h prod-db.xxxxx.rds.amazonaws.com -U postgres -d ailearnemate_prod
   ```

## Scaling for Phase 2+

### Horizontal Scaling
- Deploy multiple API instances
- Use load balancer (AWS ALB)
- RDS read replicas for heavy queries
- Redis cluster for caching

### Database Optimization
- Add indexes on frequently queried columns
- Archive old transcript data
- Optimize lecture view queries

### Caching Strategy
- Cache lecture metadata (1 hour)
- Cache transcripts (7 days)
- Cache user profiles (30 minutes)

## Disaster Recovery

1. **Database failure:**
   - Automatic failover with Multi-AZ RDS
   - Recovery Point Objective (RPO): 1 hour
   - Recovery Time Objective (RTO): 15 minutes

2. **S3 failure:**
   - Cross-region replication enabled
   - Alternative CDN provider standby

3. **API server failure:**
   - Auto-scaling group with min 2 instances
   - Automatic restart and health checks

## Cost Optimization

**Estimated monthly costs (small scale):**
- EC2 instance: $25-50
- RDS PostgreSQL: $30-50
- ElastiCache Redis: $20-30
- S3 storage: $5-10
- S3 transfer: $10-20
- CloudFront CDN: $10-30
- **Total: ~$100-190/month**

**To reduce costs:**
- Use smaller database instance initially
- Enable S3 lifecycle policies for old videos
- Use CloudFront instead of direct S3
- Compress videos before upload (Phase 2)

## Rollback Procedure

```bash
# If something goes wrong
# 1. Switch to previous version in deployment
aws ecs update-service \
  --cluster ailearnemate \
  --service api \
  --force-new-deployment

# 2. Check logs
aws logs tail /aws/ecs/ailearnemate --follow

# 3. Rollback if needed
# Use previous image from ECR
```

## CI/CD Pipeline (GitHub Actions)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to AWS

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Run tests
        run: npm test
      - name: Build Docker image
        run: docker build -t ailearnemate .
      - name: Push to ECR
        run: |
          aws ecr get-login-password | docker login ...
          docker push <ECR_URI>/ailearnemate:latest
      - name: Deploy to ECS
        run: |
          aws ecs update-service \
            --cluster ailearnemate \
            --service api \
            --force-new-deployment
```

## Getting Help

- AWS Support: https://console.aws.amazon.com/support
- Heroku Support: https://help.heroku.com
- Datadog/New Relic docs for monitoring
- Check logs first: `error.log` and CloudWatch

---

**Next Steps:**
1. Choose deployment platform
2. Set up infrastructure
3. Configure monitoring
4. Deploy Phase 1
5. Test thoroughly
6. Plan Phase 2 UI (React frontend)
