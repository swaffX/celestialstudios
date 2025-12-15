#!/bin/bash

# Celestial Studios - Simple Deploy Script
# VPS'de git pull + pm2 restart yapar

REPO_PATH="/root/celestialstudios"
PM2_APP_NAME="celestialstudios"

echo "=========================================="
echo "🚀 Celestial Studios - Deploy Script"
echo "=========================================="
echo "📅 $(date)"
echo ""

# Go to repo directory
cd $REPO_PATH

# Pull latest changes
echo "📦 Pulling latest changes from GitHub..."
git pull origin main

# Install dependencies if package.json changed
echo "📚 Checking dependencies..."
npm install --production

# Restart PM2
echo "🔄 Restarting bot..."
pm2 restart $PM2_APP_NAME

echo ""
echo "✅ Deployment complete!"
echo "=========================================="
echo ""

# Show status
pm2 status $PM2_APP_NAME
