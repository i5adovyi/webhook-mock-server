const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

let events = [];
let clients = [];

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static('.'));

app.post('/webhook', (req, res) => {
  const event = {
    id: events.length + 1,
    timestamp: new Date().toISOString(),
    headers: req.headers,
    body: req.body,
    method: req.method,
    url: req.url,
    query: req.query
  };
  
  events.push(event);
  console.log(`Received webhook event #${event.id} at ${event.timestamp}`);
  
  clients.forEach(client => {
    client.write(`data: ${JSON.stringify(event)}\n\n`);
  });
  
  res.status(200).json({ 
    message: 'Webhook received successfully', 
    eventId: event.id 
  });
});

app.get('/events', (req, res) => {
  res.json({
    total: events.length,
    events: events
  });
});

app.get('/events/:id', (req, res) => {
  const eventId = parseInt(req.params.id);
  const event = events.find(e => e.id === eventId);
  
  if (!event) {
    return res.status(404).json({ error: 'Event not found' });
  }
  
  res.json(event);
});

app.delete('/events', (req, res) => {
  events = [];
  res.json({ message: 'All events cleared' });
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

app.get('/', (req, res) => {
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
      totalEvents: events.length
    }
  });
});

app.listen(port, () => {
  console.log(`Webhook mock server running on port ${port}`);
  console.log(`Send webhook events to: http://localhost:${port}/webhook`);
  console.log(`View real-time dashboard at: http://localhost:${port}/dashboard`);
});