# Webhook Mock Server

A real-time webhook testing server with a beautiful dark-themed dashboard featuring VS Code-style JSON syntax highlighting.

## Features

- 🎯 **Real-time webhook capture** - Receive and store webhook events instantly
- 📊 **Live dashboard** - View events in real-time with Server-Sent Events
- 🌙 **Dark/Light theme** - Toggle between themes with automatic preference saving
- 🎨 **VS Code JSON highlighting** - Beautiful syntax highlighting for JSON data
- 📄 **Pagination** - Browse through events with 25 per page
- 🔍 **Event details** - Click any event to view full JSON details
- 🔎 **Search/Filter** - Real-time search across all event data
- 💾 **Persistent storage** - Events stored in local NeDB database
- 🗄️ **Database management** - Export, backup, and statistics tools
- 🌐 **Public tunneling** - Expose local server via ngrok or localtunnel
- ⚡ **Resizable interface** - Adjust event display window height

## Easy Installation

### 🚀 One-Command Installation

```bash
# Clone and install automatically
curl -sSL https://raw.githubusercontent.com/i5adovyi/webhook-mock-server/main/install.sh | bash
```

### 📦 Manual Installation

```bash
# Clone repository
git clone https://github.com/i5adovyi/webhook-mock-server.git
cd webhook-mock-server

# Run installation script
./install.sh

# Or install manually
npm install
chmod +x *.sh
```

### 🔧 Project Initialization

After installation, run the initialization script to configure your environment:

```bash
./init.sh
```

This will help you set up:
- Custom port configuration
- ngrok authentication
- Git repository
- Development environment

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Start the Server
```bash
npm start
```

### 3. Create Public Tunnel (for external webhooks)
```bash
# Option 1: Using ngrok (recommended)
npx ngrok http 3000

# Option 2: Using localtunnel
npx localtunnel --port 3000
```

### 4. View Dashboard
Open http://localhost:3000/dashboard in your browser

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/webhook` | Receive webhook events |
| `GET` | `/events` | Get all stored events |
| `GET` | `/events/:id` | Get specific event by ID |
| `DELETE` | `/events` | Clear all events |
| `GET` | `/stream` | Server-Sent Events stream |
| `GET` | `/dashboard` | Web dashboard |
| `GET` | `/` | API info |

## Usage Examples

### Send Test Webhook
```bash
curl -X POST http://localhost:3000/webhook \
  -H "Content-Type: application/json" \
  -d '{"event": "test", "data": {"user": "john", "action": "login"}}'
```

### Get All Events
```bash
curl http://localhost:3000/events
```

### Clear All Events
```bash
curl -X DELETE http://localhost:3000/events
```

## Dashboard Features

### Real-time Event Monitoring
- Events appear instantly as they're received
- Connection status indicator
- Live event counter

### Event Navigation
- **Left Panel**: Paginated event list (25 per page)
- **Right Panel**: Detailed JSON view with syntax highlighting
- **Click events** to view full details
- **Previous/Next** pagination controls

### Theme Toggle
- Click the theme button in the header
- Automatically saves preference to localStorage
- VS Code-inspired dark theme
- Clean light theme alternative

### JSON Syntax Highlighting
- **Keys**: Light blue
- **Strings**: Orange
- **Numbers**: Light green
- **Booleans/null**: Blue
- **Punctuation**: Default text color

## Database Storage

Your webhook events are automatically stored in a local NeDB database file (`webhooks.db`). This provides:

### ✨ Persistence Benefits
- **Events survive server restarts** - No data loss
- **Fast local storage** - No external database needed
- **2-5K events** supported with excellent performance
- **JSON-native** - Perfect for webhook data
- **Backup-friendly** - Single file you can copy

### 📊 Database Management
```bash
npm run db:stats   # View database statistics
npm run db:export  # Export all events to JSON file
npm run db:backup  # Create timestamped backup
npm run db:clear   # Clear all events (with confirmation)
```

### 📁 Database Files
- `webhooks.db` - Main database file
- `backups/` - Automatic backups (keeps 5 most recent)
- `webhook-export-*.json` - Exported data files

### 🔍 New API Endpoints
- `GET /api/stats` - Database statistics
- `GET /events?page=1&limit=25` - Paginated events

## Scripts

### Package.json Scripts
```bash
npm start          # Start server
npm run dev        # Start server (alias)
npm run tunnel     # Start ngrok tunnel
npm run stop       # Stop server processes
npm run restart    # Restart server and tunnel
npm run db:export  # Export events to JSON
npm run db:backup  # Backup database file
npm run db:stats   # Show database statistics
npm run db:clear   # Clear all events
```

### Shell Scripts
```bash
./start.sh         # Start server and tunnel
./stop.sh          # Stop all processes
./restart.sh       # Restart everything
```

## Configuration

### Environment Variables
- `PORT` - Server port (default: 3000)

### Ngrok Setup
1. Sign up at https://dashboard.ngrok.com/signup
2. Get your authtoken from https://dashboard.ngrok.com/get-started/your-authtoken
3. Add authtoken: `npx ngrok config add-authtoken YOUR_TOKEN`

## Server Management

### Start Server
```bash
# Method 1: npm script
npm start

# Method 2: Direct node
node server.js

# Method 3: Background process
node server.js &
```

### Stop Server
```bash
# Method 1: npm script
npm run stop

# Method 2: Kill by process name
pkill -f "node server.js"

# Method 3: Kill by port
lsof -ti:3000 | xargs kill
```

### View Logs
```bash
# Server logs in console
# Or check process output
ps aux | grep "node server.js"
```

## Troubleshooting

### Server Won't Start
- Check if port 3000 is already in use: `lsof -i :3000`
- Kill existing processes: `pkill -f "node server.js"`
- Try a different port: `PORT=3001 npm start`

### Tunnel Issues
- **Ngrok**: Ensure authtoken is configured
- **Localtunnel**: Try different subdomain or restart
- **Alternative**: Use your local IP address instead of localhost

### Dashboard Not Loading
- Verify server is running: `curl http://localhost:3000`
- Check browser console for errors
- Try refreshing or clearing browser cache

### Events Not Appearing
- Check connection status in dashboard
- Verify webhook URL points to `/webhook` endpoint
- Test with curl command to confirm server receives data

## File Structure

```
webhook/
├── server.js           # Main server file
├── dashboard.html      # Web dashboard
├── package.json        # Dependencies and scripts
├── README.md          # This documentation
├── start.sh           # Start script
├── stop.sh            # Stop script
└── restart.sh         # Restart script
```

## API Response Examples

### Successful Webhook
```json
{
  "message": "Webhook received successfully",
  "eventId": 1
}
```

### Event Object
```json
{
  "id": 1,
  "timestamp": "2023-12-07T10:30:00.000Z",
  "method": "POST",
  "url": "/webhook",
  "headers": {
    "content-type": "application/json",
    "user-agent": "curl/7.68.0"
  },
  "body": {
    "event": "test",
    "data": {
      "user": "john",
      "action": "login"
    }
  },
  "query": {}
}
```

## Development

### Adding New Features
1. Modify `server.js` for backend changes
2. Update `dashboard.html` for frontend changes
3. Update documentation in `README.md`
4. Test with various webhook payloads

### Customizing Dashboard
- Modify CSS variables in `dashboard.html` for theme colors
- Add new endpoints in `server.js`
- Extend JSON highlighting for custom data types

## License

MIT License - Feel free to use and modify as needed.