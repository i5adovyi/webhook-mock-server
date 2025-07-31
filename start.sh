#!/bin/bash

echo "🚀 Starting Webhook Mock Server..."

# Kill any existing processes
echo "🔄 Cleaning up existing processes..."
pkill -f "node server.js" 2>/dev/null
pkill -f "ngrok" 2>/dev/null
pkill -f "localtunnel" 2>/dev/null

# Wait a moment for cleanup
sleep 2

# Start the server in background
echo "📡 Starting server on port 3000..."
node server.js &
SERVER_PID=$!

# Wait for server to start
sleep 3

# Check if server is running
if kill -0 $SERVER_PID 2>/dev/null; then
    echo "✅ Server started successfully (PID: $SERVER_PID)"
    echo "🌐 Dashboard: http://localhost:3000/dashboard"
    
    # Start ngrok tunnel
    echo "🌍 Starting ngrok tunnel..."
    npx ngrok http 3000 &
    TUNNEL_PID=$!
    
    # Wait for tunnel to start
    sleep 5
    
    # Get tunnel URL
    TUNNEL_URL=$(curl -s http://127.0.0.1:4040/api/tunnels 2>/dev/null | python3 -c "import json,sys; data=json.load(sys.stdin); print(data['tunnels'][0]['public_url'] if data['tunnels'] else 'Tunnel starting...')" 2>/dev/null)
    
    if [ "$TUNNEL_URL" != "Tunnel starting..." ] && [ -n "$TUNNEL_URL" ]; then
        echo "🔗 Webhook URL: $TUNNEL_URL/webhook"
    else
        echo "⏳ Tunnel starting... Check http://127.0.0.1:4040 for URL"
    fi
    
    echo ""
    echo "📋 Quick Commands:"
    echo "   Stop server: ./stop.sh or npm run stop"
    echo "   Restart: ./restart.sh or npm run restart"
    echo "   View logs: tail -f server.log"
    echo ""
    echo "💡 Press Ctrl+C to stop or run ./stop.sh from another terminal"
    
    # Wait for user interrupt
    trap 'echo "🛑 Stopping services..."; kill $SERVER_PID $TUNNEL_PID 2>/dev/null; exit 0' INT
    wait
else
    echo "❌ Failed to start server"
    exit 1
fi