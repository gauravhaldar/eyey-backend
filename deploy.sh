#!/bin/bash

# Production Deployment Script for Eyey Backend

echo "🚀 Starting production deployment..."

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ Error: .env file not found!"
    echo "Please create a .env file with your production configuration."
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm ci --only=production

# Create necessary directories
echo "📁 Creating directories..."
mkdir -p logs uploads

# Set proper permissions
echo "🔐 Setting permissions..."
chmod 755 logs uploads

# Build the application (if needed)
echo "🔨 Building application..."
npm run build

# Start with PM2
echo "🚀 Starting application with PM2..."
pm2 start ecosystem.config.js --env production

# Save PM2 configuration
pm2 save

# Setup PM2 startup script
pm2 startup

echo "✅ Deployment completed successfully!"
echo "📊 Check application status: pm2 status"
echo "📋 View logs: pm2 logs eyey-backend"
echo "🔄 Restart: pm2 restart eyey-backend"
echo "⏹️  Stop: pm2 stop eyey-backend"
