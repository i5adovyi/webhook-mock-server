#!/bin/bash

echo "🚀 Webhook Mock Server - Easy Installation Script"
echo "================================================="

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

# Check if running on macOS or Linux
if [[ "$OSTYPE" == "darwin"* ]]; then
    OS="macOS"
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    OS="Linux"
else
    print_warning "Unsupported OS: $OSTYPE. Continuing anyway..."
    OS="Unknown"
fi

print_info "Detected OS: $OS"

# Check for Node.js
echo ""
echo "🔍 Checking prerequisites..."

if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed!"
    echo ""
    echo "Please install Node.js first:"
    if [[ "$OS" == "macOS" ]]; then
        echo "  • Using Homebrew: brew install node"
        echo "  • Or download from: https://nodejs.org/"
    elif [[ "$OS" == "Linux" ]]; then
        echo "  • Ubuntu/Debian: sudo apt-get install nodejs npm"
        echo "  • CentOS/RHEL: sudo yum install nodejs npm"
        echo "  • Or download from: https://nodejs.org/"
    else
        echo "  • Download from: https://nodejs.org/"
    fi
    exit 1
fi

NODE_VERSION=$(node --version)
print_status "Node.js is installed: $NODE_VERSION"

# Check for npm
if ! command -v npm &> /dev/null; then
    print_error "npm is not installed!"
    echo "Please install npm (usually comes with Node.js)"
    exit 1
fi

NPM_VERSION=$(npm --version)
print_status "npm is installed: $NPM_VERSION"

# Check for git (optional)
if command -v git &> /dev/null; then
    GIT_VERSION=$(git --version)
    print_status "Git is available: $GIT_VERSION"
    HAS_GIT=true
else
    print_warning "Git is not installed (optional for cloning repository)"
    HAS_GIT=false
fi

# Installation options
echo ""
echo "📦 Installation Options:"
echo "1. Install from GitHub repository (recommended)"
echo "2. Install in current directory"
echo ""

read -p "Choose installation method (1-2): " INSTALL_METHOD

case $INSTALL_METHOD in
    1)
        if [[ "$HAS_GIT" == false ]]; then
            print_error "Git is required for GitHub installation"
            exit 1
        fi
        
        echo ""
        read -p "📂 Enter installation directory (default: ./webhook-mock-server): " INSTALL_DIR
        INSTALL_DIR=${INSTALL_DIR:-./webhook-mock-server}
        
        if [[ -d "$INSTALL_DIR" ]]; then
            print_warning "Directory $INSTALL_DIR already exists"
            read -p "Continue anyway? (y/N): " CONTINUE
            if [[ ! "$CONTINUE" =~ ^[Yy]$ ]]; then
                echo "Installation cancelled"
                exit 0
            fi
        fi
        
        print_info "Cloning repository..."
        if git clone https://github.com/i5adovyi/webhook-mock-server.git "$INSTALL_DIR"; then
            print_status "Repository cloned successfully"
            cd "$INSTALL_DIR"
        else
            print_error "Failed to clone repository"
            exit 1
        fi
        ;;
        
    2)
        print_info "Installing in current directory: $(pwd)"
        
        # Check if package.json exists
        if [[ -f "package.json" ]]; then
            print_status "Found existing package.json"
        else
            print_error "No package.json found in current directory"
            print_info "Make sure you're in the webhook-mock-server directory"
            exit 1
        fi
        ;;
        
    *)
        print_error "Invalid option selected"
        exit 1
        ;;
esac

# Install dependencies
echo ""
print_info "Installing dependencies..."
if npm install; then
    print_status "Dependencies installed successfully"
else
    print_error "Failed to install dependencies"
    exit 1
fi

# Make scripts executable
echo ""
print_info "Setting up executable permissions..."
chmod +x *.sh 2>/dev/null
print_status "Scripts are now executable"

# Check for ngrok
echo ""
print_info "Checking for ngrok (for public webhooks)..."
if command -v ngrok &> /dev/null; then
    NGROK_VERSION=$(ngrok version | head -n1)
    print_status "ngrok is installed: $NGROK_VERSION"
    
    # Check if ngrok is configured
    if ngrok config check &> /dev/null; then
        print_status "ngrok is configured with authtoken"
    else
        print_warning "ngrok authtoken not configured"
        echo ""
        echo "To use ngrok for public webhooks:"
        echo "1. Sign up at: https://dashboard.ngrok.com/signup"
        echo "2. Get your authtoken: https://dashboard.ngrok.com/get-started/your-authtoken"
        echo "3. Run: ngrok config add-authtoken YOUR_TOKEN"
    fi
else
    print_warning "ngrok not found (optional for public webhooks)"
    echo ""
    echo "You can install ngrok later:"
    if [[ "$OS" == "macOS" ]]; then
        echo "  • Using Homebrew: brew install ngrok/ngrok/ngrok"
    fi
    echo "  • Or download from: https://ngrok.com/download"
fi

# Test server
echo ""
print_info "Testing server..."
if node server.js &> /dev/null &
    SERVER_PID=$!
    sleep 3
    
    if kill -0 $SERVER_PID 2>/dev/null; then
        if curl -s http://localhost:3000 &> /dev/null; then
            print_status "Server test successful"
            kill $SERVER_PID
            wait $SERVER_PID 2>/dev/null
        else
            print_error "Server not responding"
            kill $SERVER_PID 2>/dev/null
            exit 1
        fi
    else
        print_error "Server failed to start"
        exit 1
    fi
then
    print_status "Installation completed successfully!"
else
    print_error "Server test failed"
    exit 1
fi

# Final instructions
echo ""
echo "🎉 Installation Complete!"
echo "======================="
echo ""
echo "📋 Quick Start Commands:"
echo "  Start server:      ./start.sh    or  npm start"
echo "  Stop server:       ./stop.sh     or  npm run stop"
echo "  Restart server:    ./restart.sh  or  npm run restart"
echo "  Get webhook URL:   ./get-url.sh"
echo ""
echo "🌐 URLs:"
echo "  Dashboard:    http://localhost:3000/dashboard"
echo "  Webhook:      http://localhost:3000/webhook"
echo "  API Info:     http://localhost:3000/"
echo ""
echo "📖 Documentation:"
echo "  Full guide:   cat README.md"
echo "  GitHub repo:  https://github.com/i5adovyi/webhook-mock-server"
echo ""

# Offer to start the server
read -p "🚀 Start the server now? (Y/n): " START_NOW
if [[ ! "$START_NOW" =~ ^[Nn]$ ]]; then
    echo ""
    print_info "Starting webhook mock server..."
    ./start.sh
fi