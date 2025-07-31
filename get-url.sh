#!/bin/bash

echo "🔍 Getting webhook URL..."

# Check if ngrok is running
TUNNEL_URL=$(curl -s http://127.0.0.1:4040/api/tunnels 2>/dev/null | python3 -c "import json,sys; data=json.load(sys.stdin); print(data['tunnels'][0]['public_url'] if data['tunnels'] else '')" 2>/dev/null)

if [ -n "$TUNNEL_URL" ] && [ "$TUNNEL_URL" != "null" ]; then
    echo "🔗 Webhook URL: $TUNNEL_URL/webhook"
    echo "🌐 Dashboard: http://localhost:3000/dashboard"
    echo ""
    echo "📋 Copy this URL for your application:"
    echo "$TUNNEL_URL/webhook"
else
    echo "❌ No ngrok tunnel found. Run ./start.sh first."
    exit 1
fi