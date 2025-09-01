# Production Deployment Guide

This guide will help you deploy the Eyey Backend to production.

## Prerequisites

- Node.js 18+ installed
- PM2 installed globally: `npm install -g pm2`
- MongoDB database (local or cloud)
- Environment variables configured

## Quick Start

### 1. Environment Setup

Copy the example environment file and configure it:

```bash
cp production.env.example .env
```

Edit `.env` with your production values:

- Database connection string
- JWT secrets
- Cloudinary credentials
- Email settings
- CORS origins

### 2. Install Dependencies

```bash
npm ci --only=production
```

### 3. Deploy with PM2

```bash
# Make deploy script executable
chmod +x deploy.sh

# Run deployment
./deploy.sh
```

Or manually:

```bash
# Start with PM2
pm2 start ecosystem.config.js --env production

# Save PM2 configuration
pm2 save

# Setup startup script
pm2 startup
```

## Docker Deployment

### Build and Run with Docker

```bash
# Build the image
docker build -t eyey-backend .

# Run the container
docker run -d \
  --name eyey-backend \
  -p 8000:8000 \
  --env-file .env \
  -v $(pwd)/logs:/app/logs \
  -v $(pwd)/uploads:/app/uploads \
  eyey-backend
```

### Using Docker Compose

```bash
# Start services
docker-compose up -d

# View logs
docker-compose logs -f backend

# Stop services
docker-compose down
```

## Available Scripts

- `npm start` - Start the application
- `npm run dev` - Start in development mode
- `npm run build` - Build the application
- `npm run prod` - Start in production mode
- `npm run pm2:start` - Start with PM2
- `npm run pm2:stop` - Stop PM2 process
- `npm run pm2:restart` - Restart PM2 process
- `npm run pm2:delete` - Delete PM2 process

## PM2 Management

```bash
# Check status
pm2 status

# View logs
pm2 logs eyey-backend

# Monitor
pm2 monit

# Restart
pm2 restart eyey-backend

# Stop
pm2 stop eyey-backend

# Delete
pm2 delete eyey-backend
```

## Health Checks

The application includes health checks:

- Docker: Automatic health checks every 30s
- PM2: Built-in monitoring and restart on failure
- Manual: `curl http://localhost:8000/`

## Logging

Logs are stored in the `logs/` directory:

- `combined.log` - All logs
- `out.log` - Standard output
- `error.log` - Error logs

## Security Considerations

1. **Environment Variables**: Never commit `.env` files
2. **Database**: Use strong passwords and enable authentication
3. **JWT Secrets**: Use strong, unique secrets
4. **CORS**: Configure allowed origins properly
5. **File Uploads**: Validate file types and sizes
6. **Rate Limiting**: Consider implementing rate limiting
7. **HTTPS**: Use HTTPS in production

## Monitoring

### PM2 Monitoring

```bash
pm2 monit
```

### Docker Monitoring

```bash
docker stats eyey-backend
```

### Application Metrics

- Response times
- Error rates
- Memory usage
- CPU usage

## Troubleshooting

### Common Issues

1. **Port already in use**

   ```bash
   lsof -i :8000
   kill -9 <PID>
   ```

2. **Permission denied**

   ```bash
   chmod 755 logs uploads
   ```

3. **Database connection failed**

   - Check MongoDB connection string
   - Verify network connectivity
   - Check firewall settings

4. **PM2 process not starting**
   ```bash
   pm2 logs eyey-backend
   pm2 delete eyey-backend
   pm2 start ecosystem.config.js --env production
   ```

### Log Analysis

```bash
# View recent errors
tail -f logs/error.log

# Search for specific errors
grep "ERROR" logs/combined.log

# Monitor real-time logs
tail -f logs/combined.log
```

## Backup Strategy

1. **Database**: Regular MongoDB backups
2. **Uploads**: Backup uploads directory
3. **Configuration**: Version control for config files
4. **Logs**: Rotate logs regularly

## Scaling

### Horizontal Scaling

- Use load balancer
- Multiple PM2 instances
- Database clustering

### Vertical Scaling

- Increase server resources
- Optimize database queries
- Use caching (Redis)

## Support

For issues and questions:

1. Check logs first
2. Review this documentation
3. Check GitHub issues
4. Contact development team
