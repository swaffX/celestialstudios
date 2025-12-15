#!/bin/bash

# Celestial Studios - Auto Deploy Script
# VPS'de çalıştırılacak deploy scripti

REPO_PATH="/root/celestialstudios"
PM2_APP_NAME="celestialstudios"

echo "🚀 Starting deployment..."
echo "📅 $(date)"

# Go to repo directory
cd $REPO_PATH

# Pull latest changes
echo "📦 Pulling latest changes..."
git pull origin main

# Install dependencies
echo "📚 Installing dependencies..."
npm install --production

# Restart PM2
echo "🔄 Restarting bot..."
pm2 restart $PM2_APP_NAME

echo "✅ Deployment complete!"
echo ""
