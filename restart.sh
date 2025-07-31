#!/bin/bash

echo "🔄 Restarting Webhook Mock Server..."

# Stop all processes first
./stop.sh

# Wait for cleanup
echo "⏳ Waiting for cleanup..."
sleep 3

# Start everything again
echo "🚀 Starting fresh..."
./start.sh