#!/bin/bash

echo "🔧 Webhook Mock Server - Project Initialization"
echo "=============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_header() {
    echo -e "${BLUE}$1${NC}"
}

# Check if we're in the right directory
if [[ ! -f "package.json" ]] || [[ ! -f "server.js" ]]; then
    print_error "This doesn't appear to be a webhook-mock-server directory"
    print_info "Make sure you're in the project root directory"
    exit 1
fi

print_status "Found webhook-mock-server project files"

# Configuration options
echo ""
print_header "📋 Project Configuration"
echo ""

# Server configuration
echo "🔧 Server Configuration:"
read -p "Port number (default: 3000): " PORT
PORT=${PORT:-3000}

# Create .env file if user wants custom configuration
if [[ "$PORT" != "3000" ]]; then
    echo "PORT=$PORT" > .env
    print_status "Created .env file with PORT=$PORT"
fi

# Ngrok setup
echo ""
print_header "🌍 Public Tunnel Setup (ngrok)"
echo ""

if command -v ngrok &> /dev/null; then
    print_status "ngrok is installed"
    
    # Check if ngrok is configured
    if ngrok config check &> /dev/null; then
        print_status "ngrok is already configured"
    else
        print_warning "ngrok needs configuration for public webhooks"
        echo ""
        echo "To set up ngrok:"
        echo "1. Sign up at: https://dashboard.ngrok.com/signup"
        echo "2. Get your authtoken: https://dashboard.ngrok.com/get-started/your-authtoken"
        echo ""
        read -p "Do you have an ngrok authtoken? (y/N): " HAS_TOKEN
        
        if [[ "$HAS_TOKEN" =~ ^[Yy]$ ]]; then
            read -p "Enter your ngrok authtoken: " NGROK_TOKEN
            if [[ -n "$NGROK_TOKEN" ]]; then
                if ngrok config add-authtoken "$NGROK_TOKEN"; then
                    print_status "ngrok configured successfully"
                else
                    print_error "Failed to configure ngrok"
                fi
            fi
        else
            print_info "You can configure ngrok later with: ngrok config add-authtoken YOUR_TOKEN"
        fi
    fi
else
    print_warning "ngrok not installed"
    echo ""
    read -p "Install ngrok now? (y/N): " INSTALL_NGROK
    
    if [[ "$INSTALL_NGROK" =~ ^[Yy]$ ]]; then
        print_info "Installing ngrok..."
        
        # Detect OS and install ngrok
        if [[ "$OSTYPE" == "darwin"* ]]; then
            # macOS
            if command -v brew &> /dev/null; then
                brew install ngrok/ngrok/ngrok
            else
                print_warning "Homebrew not found. Please install ngrok manually from https://ngrok.com/download"
            fi
        elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
            # Linux
            print_info "Installing ngrok for Linux..."
            curl -s https://ngrok-agent.s3.amazonaws.com/ngrok.asc | sudo tee /etc/apt/trusted.gpg.d/ngrok.asc >/dev/null
            echo "deb https://ngrok-agent.s3.amazonaws.com buster main" | sudo tee /etc/apt/sources.list.d/ngrok.list
            sudo apt update && sudo apt install ngrok
        else
            print_warning "Automatic installation not supported. Please install from https://ngrok.com/download"
        fi
        
        # Configure after installation
        if command -v ngrok &> /dev/null; then
            print_status "ngrok installed successfully"
            echo ""
            read -p "Enter your ngrok authtoken (get it from https://dashboard.ngrok.com/): " NGROK_TOKEN
            if [[ -n "$NGROK_TOKEN" ]]; then
                ngrok config add-authtoken "$NGROK_TOKEN"
                print_status "ngrok configured"
            fi
        fi
    fi
fi

# Git setup
echo ""
print_header "📦 Git Repository Setup"
echo ""

if [[ -d ".git" ]]; then
    print_status "Git repository already initialized"
    
    # Check if remote exists
    if git remote -v | grep -q origin; then
        REMOTE_URL=$(git remote get-url origin)
        print_status "Remote origin: $REMOTE_URL"
    else
        print_info "No remote origin set"
        read -p "Add GitHub remote? (y/N): " ADD_REMOTE
        if [[ "$ADD_REMOTE" =~ ^[Yy]$ ]]; then
            read -p "Enter GitHub repository URL: " REPO_URL
            if [[ -n "$REPO_URL" ]]; then
                git remote add origin "$REPO_URL"
                print_status "Remote origin added"
            fi
        fi
    fi
else
    read -p "Initialize git repository? (Y/n): " INIT_GIT
    if [[ ! "$INIT_GIT" =~ ^[Nn]$ ]]; then
        git init
        print_status "Git repository initialized"
        
        # Create initial commit if files aren't tracked
        if [[ -z "$(git status --porcelain)" ]]; then
            print_info "All files are already tracked"
        else
            git add .
            git commit -m "Initial commit: Webhook Mock Server setup"
            print_status "Initial commit created"
        fi
    fi
fi

# Development environment setup
echo ""
print_header "🛠️  Development Environment"
echo ""

# Check for code editor
EDITORS=("code" "subl" "atom" "vim" "nano")
FOUND_EDITOR=""

for editor in "${EDITORS[@]}"; do
    if command -v "$editor" &> /dev/null; then
        FOUND_EDITOR="$editor"
        break
    fi
done

if [[ -n "$FOUND_EDITOR" ]]; then
    print_status "Found editor: $FOUND_EDITOR"
    read -p "Open project in $FOUND_EDITOR? (y/N): " OPEN_EDITOR
    if [[ "$OPEN_EDITOR" =~ ^[Yy]$ ]]; then
        "$FOUND_EDITOR" .
        print_status "Project opened in $FOUND_EDITOR"
    fi
else
    print_info "No common editor found (code, subl, atom, vim, nano)"
fi

# Final setup
echo ""
print_header "🏁 Final Setup"
echo ""

# Install dependencies if not already done
if [[ ! -d "node_modules" ]]; then
    print_info "Installing dependencies..."
    npm install
    print_status "Dependencies installed"
else
    print_status "Dependencies already installed"
fi

# Make scripts executable
chmod +x *.sh 2>/dev/null
print_status "Scripts are executable"

# Test configuration
echo ""
print_info "Testing configuration..."

# Test server start
if node server.js &> /dev/null &
    SERVER_PID=$!
    sleep 2
    
    if kill -0 $SERVER_PID 2>/dev/null; then
        if curl -s "http://localhost:$PORT" &> /dev/null; then
            print_status "Server configuration test passed"
        else
            print_warning "Server started but not responding on port $PORT"
        fi
        kill $SERVER_PID
        wait $SERVER_PID 2>/dev/null
    else
        print_error "Server failed to start"
    fi
then
    print_status "Configuration test completed"
fi

# Summary
echo ""
echo "🎉 Project Initialization Complete!"
echo "=================================="
echo ""
echo "📁 Project Structure:"
echo "  ├── server.js           # Main server file"
echo "  ├── dashboard.html      # Web dashboard"
echo "  ├── package.json        # Dependencies"
echo "  ├── README.md          # Documentation"
echo "  ├── .env               # Environment config (if created)"
echo "  └── Scripts:"
echo "      ├── start.sh        # Start server + tunnel"
echo "      ├── stop.sh         # Stop all processes"
echo "      ├── restart.sh      # Restart everything"
echo "      ├── get-url.sh      # Get current webhook URL"
echo "      ├── install.sh      # Installation script"
echo "      └── init.sh         # This initialization script"
echo ""
echo "🚀 Quick Start:"
echo "  ./start.sh              # Start everything"
echo "  ./get-url.sh            # Get webhook URL"
echo "  open http://localhost:$PORT/dashboard"
echo ""
echo "📖 Documentation:"
echo "  cat README.md           # Full documentation"
echo "  ./start.sh --help       # Script help"
echo ""

# Offer to start the server
read -p "🚀 Start the webhook server now? (Y/n): " START_SERVER
if [[ ! "$START_SERVER" =~ ^[Nn]$ ]]; then
    echo ""
    print_info "Starting webhook mock server..."
    if [[ -f "./start.sh" ]]; then
        ./start.sh
    else
        npm start
    fi
fi

echo ""
print_status "Initialization script completed successfully!"
echo "Happy webhook testing! 🎯"