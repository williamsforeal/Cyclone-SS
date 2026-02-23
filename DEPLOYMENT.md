# Cyclone-SS Deployment Guide

## SaaS Deployment Planning

This document outlines the deployment strategy for converting Cyclone-SS from local development to a production SaaS application.

---

## 🎯 Deployment Options

### Option 1: AWS ECS/Fargate (Recommended)
**Best for:** Scalable, production-ready SaaS

**Pros:**
- Fully managed container orchestration
- Auto-scaling based on traffic
- No server management
- Pay only for what you use
- Built-in load balancing
- Easy CI/CD integration

**Estimated Monthly Cost:**
- Small: $15-30/month (Fargate Spot)
- Medium: $50-100/month (reserved capacity)
- Large: $200+/month (high availability)

**Setup Steps:**
1. Create ECS Cluster
2. Create Task Definition (use existing `docker-compose.yml`)
3. Create IAM Role: **Elastic Container Service Task**
4. Configure Application Load Balancer
5. Set up RDS for PostgreSQL (recommended over SQLite)
6. Configure secrets in AWS Secrets Manager

---

### Option 2: AWS EC2
**Best for:** Cost-conscious, single-tenant deployment

**Pros:**
- Full control over the server
- Lower cost for single instance
- Familiar server environment
- Can run multiple services

**Cons:**
- Manual server maintenance required
- Scaling requires manual intervention
- Need to manage security updates

**Estimated Monthly Cost:**
- t3.small: $15-20/month
- t3.medium: $30-40/month
- t3.large: $60-80/month

**Setup Steps:**
1. Launch EC2 instance (Ubuntu 22.04 LTS recommended)
2. Create IAM Role: **EC2**
3. Install Docker and Docker Compose
4. Clone repository and configure `.env`
5. Set up Nginx reverse proxy with SSL
6. Configure CloudWatch for monitoring

---

### Option 3: AWS App Runner
**Best for:** Simplest deployment, rapid launch

**Pros:**
- Easiest to set up (point to Docker image)
- Automatic HTTPS with custom domain
- Auto-scaling included
- Minimal configuration

**Cons:**
- Less control over infrastructure
- Higher cost per request
- Limited customization

**Estimated Monthly Cost:**
- $25-60/month (based on usage)

---

## 🔐 IAM Role Setup (When Ready to Deploy)

### For ECS/Fargate:
1. Go to AWS IAM Console → Roles → Create Role
2. Select: **AWS service** → **Elastic Container Service Task**
3. Attach policies:
   - `AmazonECSTaskExecutionRolePolicy` (required)
   - `AmazonS3FullAccess` (if using S3)
   - `CloudWatchLogsFullAccess` (for logging)
   - Custom policy for any other AWS services your workflows use
4. Name: `cyclone-ss-ecs-task-role`

### For EC2:
1. Go to AWS IAM Console → Roles → Create Role
2. Select: **AWS service** → **EC2**
3. Attach policies based on what your n8n workflows need:
   - `AmazonS3FullAccess`
   - `AmazonSQSFullAccess`
   - `CloudWatchLogsFullAccess`
4. Name: `cyclone-ss-ec2-role`

---

## 🌐 Domain & SSL Setup

### Domain Configuration (Your New Domain)
1. **Point DNS to AWS:**
   - ECS/App Runner: Use ALB DNS or App Runner URL
   - EC2: Point to Elastic IP
   
2. **Use Route 53 (Recommended):**
   ```
   Type: A Record
   Name: app.yourdomain.com (or @)
   Value: Your AWS resource IP/DNS
   TTL: 300
   ```

3. **SSL Certificate:**
   - Use AWS Certificate Manager (ACM) - FREE
   - Request certificate for `yourdomain.com` and `*.yourdomain.com`
   - Auto-renews, no manual intervention

---

## 🔄 Migration Checklist

### Before Deployment:

- [ ] Choose deployment platform (ECS/EC2/App Runner)
- [ ] Register domain (✓ completed)
- [ ] Request SSL certificate in AWS Certificate Manager
- [ ] Create IAM role with appropriate permissions
- [ ] Set up AWS RDS PostgreSQL (recommended for production)
- [ ] Move secrets to AWS Secrets Manager or Parameter Store
- [ ] Create S3 bucket for workflow backups
- [ ] Set up CloudWatch alarms for monitoring

### Environment Configuration:

- [ ] Create production `.env` file with production values
- [ ] Change `N8N_BASIC_AUTH_PASSWORD` to strong password
- [ ] Update `WEBHOOK_URL` to your domain (e.g., `https://app.yourdomain.com/`)
- [ ] Set `N8N_PROTOCOL=https`
- [ ] Configure database connection for RDS
- [ ] Set up email notifications for workflow failures

### Security Hardening:

- [ ] Enable AWS WAF for DDoS protection
- [ ] Configure Security Groups (allow only 80/443)
- [ ] Enable VPC Flow Logs
- [ ] Set up AWS Backup for automated backups
- [ ] Enable MFA on AWS account
- [ ] Rotate all API keys and credentials
- [ ] Configure CORS if needed

### Testing:

- [ ] Test all workflows in staging environment
- [ ] Verify webhooks work with HTTPS
- [ ] Test authentication and authorization
- [ ] Validate API integrations
- [ ] Load test with expected traffic
- [ ] Test backup and restore procedures

---

## 💰 Cost Estimation

### Monthly Running Costs (ECS/Fargate - Recommended):

| Component | Estimated Cost |
|-----------|----------------|
| ECS Fargate (0.25 vCPU, 0.5GB) | $12-15 |
| Application Load Balancer | $16-20 |
| RDS PostgreSQL (db.t4g.micro) | $12-15 |
| S3 Storage (10GB) | $0.23 |
| CloudWatch Logs | $2-5 |
| Data Transfer | $5-10 |
| Route 53 Hosted Zone | $0.50 |
| **Total** | **$48-66/month** |

### Additional Costs to Consider:
- Domain registration: $10-15/year
- Backups: $2-5/month
- Monitoring tools: $0-20/month
- High availability (multi-AZ): +50-100%

---

## 📊 Monitoring & Logging

### CloudWatch Metrics to Monitor:
- CPU utilization
- Memory utilization
- Request count
- Error rate
- Response time

### Alarms to Set Up:
- High CPU/Memory (>80%)
- Service unavailable
- Failed workflow executions
- Database connection errors

### Log Aggregation:
- Send n8n logs to CloudWatch Logs
- Set up log retention (30-90 days)
- Create CloudWatch Insights queries for debugging

---

## 🚀 Deployment Process (ECS Example)

### 1. Prepare Docker Image
```bash
# Build and tag
docker build -t cyclone-ss:latest .

# Tag for ECR
docker tag cyclone-ss:latest YOUR_AWS_ACCOUNT.dkr.ecr.us-east-1.amazonaws.com/cyclone-ss:latest

# Push to ECR
docker push YOUR_AWS_ACCOUNT.dkr.ecr.us-east-1.amazonaws.com/cyclone-ss:latest
```

### 2. Create ECS Resources
```bash
# Create cluster
aws ecs create-cluster --cluster-name cyclone-ss-cluster

# Create task definition (use converted docker-compose.yml)
aws ecs register-task-definition --cli-input-json file://task-definition.json

# Create service
aws ecs create-service \
  --cluster cyclone-ss-cluster \
  --service-name cyclone-ss \
  --task-definition cyclone-ss:1 \
  --desired-count 1 \
  --launch-type FARGATE
```

### 3. Set Up Load Balancer
- Create Application Load Balancer
- Configure target group (port 5678)
- Add HTTPS listener with ACM certificate
- Configure health checks

---

## 🔄 CI/CD Pipeline (Future)

Consider setting up automated deployments with:
- **GitHub Actions** - Free for public repos
- **AWS CodePipeline** - Integrated with AWS
- **GitLab CI/CD** - Alternative option

Example workflow:
1. Push to `main` branch
2. Run tests
3. Build Docker image
4. Push to ECR
5. Update ECS service
6. Run smoke tests
7. Notify on Slack/Discord

---

## 📚 Next Steps

1. **Immediate (Local Development):**
   - Continue building workflows locally
   - Test all integrations
   - Document your workflows

2. **Short-term (1-2 weeks):**
   - Choose deployment platform
   - Set up AWS account and billing alerts
   - Request SSL certificate
   - Plan database migration

3. **Medium-term (1 month):**
   - Deploy to staging environment
   - Test with production-like data
   - Set up monitoring and alerts
   - Create runbooks for common issues

4. **Long-term (Ongoing):**
   - Set up automated backups
   - Implement CI/CD pipeline
   - Scale based on usage
   - Optimize costs

---

## 🆘 Support Resources

- [AWS ECS Documentation](https://docs.aws.amazon.com/ecs/)
- [n8n Self-Hosting Guide](https://docs.n8n.io/hosting/)
- [AWS Well-Architected Framework](https://aws.amazon.com/architecture/well-architected/)

---

**Last Updated:** 2026-02-09  
**Author:** Cyclone-SS Team
