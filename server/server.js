#!/usr/bin/env node

const http = require('http');
const { readFile } = require('node:fs/promises');
const path = require('path');
const { WebSocketServer } = require('ws');

const PORT = process.env.PORT || 4519;
const validPaths = ['/index.html', '/notification.mp3', '/stop.mp3', '/logo.svg'];

// Store connected WebSocket clients
const wsClients = new Set();

// Create HTTP server
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);

  // Handle HTTP POST requests
  if (req.method === 'POST' && url.pathname === '/') {
    let body = '';

    req.on('data', chunk => {
      body += chunk.toString();
    });

    req.on('end', () => {
      try {
        // Add timestamp to the received data
        const timestamp = new Date().toISOString();
        const messageObj = JSON.parse(body);

        // Create the data structure with timestamp
        const data = {
          message: body,
          timestamp: timestamp
        };

        // Log to console with color formatting for hook_event_name and tool_name values
        try {
          const hookEventName = messageObj.hook_event_name;

          // Define colors for each hook type (matching the image)
          const hookColors = {
            "SubagentStop": "\x1b[35m", // Purple
            "PreToolUse": "\x1b[34m", // Blue
            "Notification": "\x1b[33m", // Orange/Yellow
            "PostToolUse": "\x1b[32m", // Green
            "Stop": "\x1b[31m", // Red
          };

          const color = hookColors[hookEventName] || "\x1b[0m";
          const reset = "\x1b[0m";

          // Replace the hook_event_name value with colored version in the JSON string
          let coloredMessage = data.message.replace(
            `"hook_event_name":"${hookEventName}"`,
            `"hook_event_name":"${color}${hookEventName}${reset}"`
          );

          // If there's a tool_name, colorize it too
          if (messageObj.tool_name) {
            const toolColor = "\x1b[36m"; // Cyan for tool names
            coloredMessage = coloredMessage.replace(
              `"tool_name":"${messageObj.tool_name}"`,
              `"tool_name":"${toolColor}${messageObj.tool_name}${reset}"`
            );
          }

          // Add color to timestamp (using dim/gray color)
          const timestampColor = "\x1b[90m"; // Gray/dim
          console.log(
            `${timestampColor}${data.timestamp}${reset} ${coloredMessage}`
          );
        } catch (_parseError) {
          // If message is not valid JSON, log as is
          const timestampColor = "\x1b[90m"; // Gray/dim
          const reset = "\x1b[0m";
          console.log(
            `${timestampColor}${data.timestamp}${reset} ${data.message}`
          );
        }

        // Broadcast to WebSocket clients
        broadcastMessage(data);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true }));
      } catch (error) {
        console.error('Error processing POST request:', error);
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON' }));
      }
    });
    return;
  }

  // Handle preflight OPTIONS requests for CORS
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    });
    res.end();
    return;
  }

  // Check for server status probe
  if (req.method === 'GET' && url.pathname === '/' && url.searchParams.has('probe')) {
    res.writeHead(302, { 
      'Location': '/',
      'Access-Control-Allow-Origin': '*'
    });
    res.end();
    return;
  }

  // Serve UI files for GET requests
  const filePath = (url.pathname === '/' ? '/index.html' : url.pathname).toLowerCase();
  if (req.method === 'GET' && validPaths.includes(filePath)) {
    try {
      // Determine content type based on file extension
      const ext = path.extname(filePath).toLowerCase().slice(1);
      const contentTypes = {
        'html': 'text/html',
        'mp3': 'audio/mpeg',
        'svg': 'image/svg+xml',
      };
      // Read and serve the file
      const encoding = ext === 'mp3' ? null : 'utf8';
      const data = await readFile(path.join(__dirname, filePath), encoding ? { encoding } : {});
      res.writeHead(200, { 
        'Content-Type': contentTypes[ext],
        'Access-Control-Allow-Origin': '*'
      });
      res.end(data);
      return;
    }
    catch (error) {
      console.error('Error serving file:', error);
    }
  }
  console.error('Invalid request:', req.method, url.pathname);
  res.writeHead(404).end('Not Found');
});

// Create WebSocket server
const wss = new WebSocketServer({ server });

// Handle WebSocket connections
wss.on('connection', (ws) => {
  console.log('New WebSocket client connected');
  wsClients.add(ws);

  ws.on('close', () => {
    console.log('WebSocket client disconnected');
    wsClients.delete(ws);
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
    wsClients.delete(ws);
  });
});

// Broadcast message to all connected WebSocket clients
function broadcastMessage(message) {
  const payload = JSON.stringify(message);

  for (const client of wsClients) {
    if (client.readyState === client.OPEN) {
      try {
        client.send(payload);
      } catch (error) {
        console.error('Failed to send message to client:', error);
        wsClients.delete(client);
      }
    }
  }
}


// Start server
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`- Web UI: http://localhost:${PORT}/`);
  console.log(`- HTTP POST endpoint: http://localhost:${PORT}/`);
  console.log(`- WebSocket endpoint: ws://localhost:${PORT}/`);
  console.log('Press Ctrl+C to stop');
});
