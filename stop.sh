#!/bin/bash

echo "🛑 Stopping Webhook Mock Server..."

# Function to kill processes by name
kill_process() {
    local process_name=$1
    local pids=$(pgrep -f "$process_name" 2>/dev/null)
    
    if [ -n "$pids" ]; then
        echo "🔄 Stopping $process_name processes..."
        echo "$pids" | xargs kill 2>/dev/null
        sleep 1
        
        # Force kill if still running
        local remaining=$(pgrep -f "$process_name" 2>/dev/null)
        if [ -n "$remaining" ]; then
            echo "💀 Force killing $process_name processes..."
            echo "$remaining" | xargs kill -9 2>/dev/null
        fi
        echo "✅ $process_name processes stopped"
    else
        echo "ℹ️  No $process_name processes found"
    fi
}

# Stop server processes
kill_process "node server.js"

# Stop tunnel processes  
kill_process "ngrok"
kill_process "localtunnel"

# Check for any remaining processes on port 3000
PORT_PROCESS=$(lsof -ti:3000 2>/dev/null)
if [ -n "$PORT_PROCESS" ]; then
    echo "🔄 Stopping processes on port 3000..."
    echo "$PORT_PROCESS" | xargs kill 2>/dev/null
    sleep 1
    
    # Force kill if still running
    PORT_PROCESS=$(lsof -ti:3000 2>/dev/null)
    if [ -n "$PORT_PROCESS" ]; then
        echo "💀 Force killing processes on port 3000..."
        echo "$PORT_PROCESS" | xargs kill -9 2>/dev/null
    fi
fi

echo "✅ All processes stopped successfully"
echo "🎯 Server and tunnels are now offline"