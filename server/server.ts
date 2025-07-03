#!/usr/bin/env -S deno run --allow-net --allow-read

const PORT = 4519;

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

      // Log to console with color formatting for hook_event_name and tool_name values
      try {
        const messageObj = JSON.parse(data.message);
        const hookEventName = messageObj.hook_event_name;

        // Define colors for each hook type (matching the image)
        const hookColors: Record<string, string> = {
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
          `"hook_event_name":"${color}${hookEventName}${reset}"`,
        );

        // If there's a tool_name, colorize it too
        if (messageObj.tool_name) {
          const toolColor = "\x1b[36m"; // Cyan for tool names
          coloredMessage = coloredMessage.replace(
            `"tool_name":"${messageObj.tool_name}"`,
            `"tool_name":"${toolColor}${messageObj.tool_name}${reset}"`,
          );
        }

        // Add color to timestamp (using dim/gray color)
        const timestampColor = "\x1b[90m"; // Gray/dim
        console.log(
          `${timestampColor}${data.timestamp}${reset} ${coloredMessage}`,
        );
      } catch (_parseError) {
        // If message is not valid JSON, log as is
        const timestampColor = "\x1b[90m"; // Gray/dim
        const reset = "\x1b[0m";
        console.log(
          `${timestampColor}${data.timestamp}${reset} ${data.message}`,
        );
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

  // Serve UI files for GET requests
  if (request.method === "GET") {
    try {
      // Default to index.html for root path
      const filePath = url.pathname === "/" ? "/index.html" : url.pathname;
      const uiPath = new URL(`../ui${filePath}`, import.meta.url).pathname;
      
      // Determine content type based on file extension
      const ext = filePath.split('.').pop()?.toLowerCase();
      const contentTypes: Record<string, string> = {
        "html": "text/html",
        "js": "application/javascript",
        "css": "text/css",
        "mp3": "audio/mpeg",
        "wav": "audio/wav",
        "png": "image/png",
        "jpg": "image/jpeg",
        "jpeg": "image/jpeg",
        "svg": "image/svg+xml",
      };
      const contentType = contentTypes[ext || "html"] || "application/octet-stream";
      
      // Set cache headers based on file type
      const headers: Record<string, string> = {
        "Content-Type": contentType,
      };
      
      // Add cache headers for static assets
      if (ext === "mp3" || ext === "wav" || ext === "png" || ext === "jpg" || ext === "jpeg" || ext === "svg") {
        // Cache media files for 1 day
        headers["Cache-Control"] = "public, max-age=86400";
      } else if (ext === "css" || ext === "js") {
        // Cache CSS/JS for 1 hour (in case of updates)
        headers["Cache-Control"] = "public, max-age=3600";
      } else if (ext === "html" || !ext) {
        // Don't cache HTML to ensure updates are seen
        headers["Cache-Control"] = "no-cache, no-store, must-revalidate";
      }
      
      // Read and serve the file
      if (ext === "mp3" || ext === "wav" || ext === "png" || ext === "jpg" || ext === "jpeg") {
        // Binary files
        const data = await Deno.readFile(uiPath);
        return new Response(data, {
          status: 200,
          headers,
        });
      } else {
        // Text files
        const content = await Deno.readTextFile(uiPath);
        return new Response(content, {
          status: 200,
          headers,
        });
      }
    } catch (error) {
      // Only log errors for files that aren't known browser/tool requests
      const knownMissingFiles = [
        '.well-known/appspecific/com.chrome.devtools.json',
        'favicon.ico',
        'robots.txt'
      ];
      
      if (!knownMissingFiles.some(file => url.pathname.includes(file))) {
        console.error("Failed to serve file:", error);
      }
      
      return new Response("File not found", { status: 404 });
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
