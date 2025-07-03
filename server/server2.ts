#!/usr/bin/env -S deno run --allow-net --allow-read

const PORT = 4519;

const hookColors: Record<string, string> = {
  "SubagentStop": "\x1b[35m", // Purple
  "PreToolUse": "\x1b[34m", // Blue
  "Notification": "\x1b[33m", // Orange/Yellow
  "PostToolUse": "\x1b[32m", // Green
  "Stop": "\x1b[31m", // Red
};

interface Message {
  message: string;
  timestamp: string;
}

// Store connected WebSocket clients
const wsClients: Set<WebSocket> = new Set();

// Handle WebSocket connections
function handleWebSocket(socket: WebSocket) {
  console.log("New WebSocket client connected");
  wsClients.add(socket);

  socket.addEventListener("close", () => {
    console.log("WebSocket client disconnected");
    wsClients.delete(socket);
  });

  socket.addEventListener("error", (error) => {
    console.error("WebSocket error:", error);
    wsClients.delete(socket);
  });
}

// Broadcast message to all connected WebSocket clients
function broadcastMessage(message: Message) {
  const payload = JSON.stringify(message);

  for (const client of wsClients) {
    if (client.readyState === WebSocket.OPEN) {
      try {
        client.send(payload);
      } catch (error) {
        console.error("Failed to send message to client:", error);
        wsClients.delete(client);
      }
    }
  }
}

// Handle all HTTP requests
async function handleRequest(request: Request): Promise<Response> {
  const url = new URL(request.url);

  // Handle WebSocket upgrade requests
  if (request.headers.get("upgrade") === "websocket") {
    const { socket, response } = Deno.upgradeWebSocket(request);
    handleWebSocket(socket);
    return response;
  }

  // Handle HTTP POST requests
  if (request.method === "POST" && url.pathname === "/") {
    try {
      const body = await request.text();
      const data: Message = JSON.parse(body);

      // Log to console for initial development
      try {
        const messagePayload = JSON.parse(data.message);
        if (messagePayload.hook_event_name) {
          const hookEventName = messagePayload.hook_event_name;
          const color = hookColors[hookEventName] || "";
          const resetColor = "\x1b[0m";
          messagePayload.hook_event_name =
            `${color}${hookEventName}${resetColor}`;
        }
        console.log(`${data.timestamp} ${JSON.stringify(messagePayload)}`);
      } catch (e) {
        console.log(`${data.timestamp} ${data.message}`);
      }

      // Broadcast to WebSocket clients
      broadcastMessage(data);

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Error processing POST request:", error);
      return new Response(JSON.stringify({ error: "Invalid JSON" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  // Handle preflight OPTIONS requests for CORS
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }

  // Serve UI index.html for GET requests to root
  if (request.method === "GET" && url.pathname === "/") {
    try {
      const uiPath = new URL("../ui/index.html", import.meta.url).pathname;
      const html = await Deno.readTextFile(uiPath);
      return new Response(html, {
        status: 200,
        headers: { "Content-Type": "text/html" },
      });
    } catch (error) {
      console.error("Failed to serve UI:", error);
      return new Response("UI not found", { status: 404 });
    }
  }

  return new Response("Not Found", { status: 404 });
}

// Start unified server
function startServer() {
  console.log(`Server starting on port ${PORT}`);

  const server = Deno.serve({
    port: PORT,
    handler: handleRequest,
  });

  return server;
}

// Main function
async function main() {
  try {
    // Start unified server
    const server = startServer();

    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`- Web UI: http://localhost:${PORT}/`);
    console.log(`- HTTP POST endpoint: http://localhost:${PORT}/`);
    console.log(`- WebSocket endpoint: ws://localhost:${PORT}/`);
    console.log("Press Ctrl+C to stop");

    // Wait for server
    await server;
  } catch (error) {
    console.error("Server error:", error);
    Deno.exit(1);
  }
}

if (import.meta.main) {
  main();
}
