const express = require('express');
const WebhookDatabase = require('./database');
const app = express();
const port = process.env.PORT || 3000;

// Initialize database
const db = new WebhookDatabase();
let clients = [];

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static('.'));

app.post('/webhook', async (req, res) => {
  try {
    const eventData = {
      headers: req.headers,
      body: req.body,
      method: req.method,
      url: req.url,
      query: req.query
    };
    
    const event = await db.insertEvent(eventData);
    console.log(`Received webhook event #${event.id} at ${event.timestamp}`);
    
    // Broadcast to real-time clients
    clients.forEach(client => {
      client.write(`data: ${JSON.stringify(event)}\n\n`);
    });
    
    res.status(200).json({ 
      message: 'Webhook received successfully', 
      eventId: event.id 
    });
  } catch (error) {
    console.error('Error storing webhook event:', error);
    res.status(500).json({ 
      message: 'Error storing webhook event',
      error: error.message 
    });
  }
});

app.get('/events', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 1000; // Default to large number for backward compatibility
    const skip = (page - 1) * limit;
    
    const [events, total] = await Promise.all([
      db.getEvents(skip, limit),
      db.getEventCount()
    ]);
    
    res.json({
      total: total,
      events: events,
      page: page,
      limit: limit,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Error retrieving events:', error);
    res.status(500).json({ 
      message: 'Error retrieving events',
      error: error.message 
    });
  }
});

app.get('/events/:id', async (req, res) => {
  try {
    const eventId = parseInt(req.params.id);
    const event = await db.getEventById(eventId);
    
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }
    
    res.json(event);
  } catch (error) {
    console.error('Error retrieving event:', error);
    res.status(500).json({ 
      message: 'Error retrieving event',
      error: error.message 
    });
  }
});

app.delete('/events', async (req, res) => {
  try {
    const numRemoved = await db.clearAllEvents();
    res.json({ 
      message: 'All events cleared',
      eventsRemoved: numRemoved 
    });
  } catch (error) {
    console.error('Error clearing events:', error);
    res.status(500).json({ 
      message: 'Error clearing events',
      error: error.message 
    });
  }
});

app.get('/stream', (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*'
  });

  clients.push(res);

  req.on('close', () => {
    clients = clients.filter(client => client !== res);
  });
});

app.get('/dashboard', (req, res) => {
  res.sendFile(__dirname + '/dashboard.html');
});

app.get('/api/webhook-url', (req, res) => {
  const http = require('http');
  const ngrokApiUrl = 'http://127.0.0.1:4040/api/tunnels';
  
  const ngrokReq = http.get(ngrokApiUrl, (ngrokRes) => {
    let data = '';
    ngrokRes.on('data', chunk => data += chunk);
    ngrokRes.on('end', () => {
      try {
        const tunnels = JSON.parse(data);
        if (tunnels.tunnels && tunnels.tunnels.length > 0) {
          const publicUrl = tunnels.tunnels[0].public_url;
          res.json({ webhookUrl: `${publicUrl}/webhook` });
        } else {
          res.json({ webhookUrl: null });
        }
      } catch (e) {
        res.json({ webhookUrl: null });
      }
    });
  });
  
  ngrokReq.on('error', () => {
    res.json({ webhookUrl: null });
  });
});

app.get('/api/stats', async (req, res) => {
  try {
    const stats = await db.getStats();
    res.json(stats);
  } catch (error) {
    console.error('Error getting database stats:', error);
    res.status(500).json({ 
      message: 'Error retrieving database statistics',
      error: error.message 
    });
  }
});

app.delete('/api/events/old', async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 7;
    const numRemoved = await db.clearOldEvents(days);
    res.json({ 
      message: `Cleared events older than ${days} days`,
      eventsRemoved: numRemoved,
      days: days
    });
  } catch (error) {
    console.error('Error clearing old events:', error);
    res.status(500).json({ 
      message: 'Error clearing old events',
      error: error.message 
    });
  }
});

app.get('/api/events/export', async (req, res) => {
  try {
    const events = await db.exportEvents();
    const stats = await db.getStats();
    
    const exportData = {
      exportDate: new Date().toISOString(),
      stats: stats,
      events: events
    };
    
    const filename = `webhook-export-${new Date().toISOString().split('T')[0]}.json`;
    
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.json(exportData);
  } catch (error) {
    console.error('Error exporting events:', error);
    res.status(500).json({ 
      message: 'Error exporting events',
      error: error.message 
    });
  }
});

app.get('/', async (req, res) => {
  try {
    const totalEvents = await db.getEventCount();
    res.json({
      message: 'Webhook Mock Server',
      endpoints: {
        'POST /webhook': 'Receive webhook events',
        'GET /events': 'View all stored events (supports ?page=1&limit=25)',
        'GET /events/:id': 'View specific event',
        'DELETE /events': 'Clear all events',
        'GET /dashboard': 'Real-time dashboard',
        'GET /api/webhook-url': 'Get current webhook URL',
        'GET /api/stats': 'Database statistics'
      },
      stats: {
        totalEvents: totalEvents,
        database: 'NeDB (local file storage)'
      }
    });
  } catch (error) {
    res.json({
      message: 'Webhook Mock Server',
      endpoints: {
        'POST /webhook': 'Receive webhook events',
        'GET /events': 'View all stored events',
        'GET /events/:id': 'View specific event',
        'DELETE /events': 'Clear all events',
        'GET /dashboard': 'Real-time dashboard',
        'GET /api/webhook-url': 'Get current webhook URL'
      },
      stats: {
        totalEvents: 0,
        database: 'NeDB (local file storage)',
        error: 'Could not retrieve stats'
      }
    });
  }
});

app.listen(port, () => {
  console.log(`Webhook mock server running on port ${port}`);
  console.log(`Send webhook events to: http://localhost:${port}/webhook`);
  console.log(`View real-time dashboard at: http://localhost:${port}/dashboard`);
});