# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with
code in this repository.

## Project Overview

Madame Claude is a monitoring system for Claude Code hooks that captures and streams
tool usage events to a web interface. It consists of three Node.js-based components
that work together to provide real-time visibility into Claude Code's tool
usage.

## Architecture

The system follows an event-driven architecture with this flow:

```
Claude Code → Hooks → bridge → HTTP POST → Server → WebSocket → UI
```

### Components

1. **bridge**: Reads JSON events from stdin and POSTs them to the server
   - Located in server/bridge.js
   - Stateless converter that always exits with code 0
   - Passes data through without modification
   - Posts to http://localhost:4519/

2. **server**: Receives POSTs and streams via WebSocket
   - Located in server/server.js
   - Runs on port 4519 (HTTP and WebSocket)
   - Adds timestamps to received messages
   - Broadcasts all received messages to connected clients
   - Maintains WebSocket connections for real-time updates

3. **ui**: Web interface for displaying events (served by server)

## Development Commands

```bash
cd server
npm install         # Install dependencies
npm start           # Run the server
npm run dev         # Run with file watching
npm test            # Run tests
npm run lint        # Lint code

# Run components directly
node server.js      # Start the server
node bridge.js      # Run the bridge (for testing)

# Or use npx after npm install
npx madame-claude         # Start the server
npx madame-claude-bridge  # Run the bridge
```

## Integration with Claude Code

This project integrates via Claude Code's hooks system. Users configure hooks in
`~/.claude/settings.json`:

```json
{
  "hooks": {
    "PostToolUse": {
      "command": "/absolute/path/to/MadameClaude/server/bridge.js"
    }
  }
}
```

Hook types: PreToolUse, PostToolUse, Notification, Stop, SubagentStop

## Key Implementation Notes

- **Error Handling**: Never let errors block Claude Code. Bridge always
  exits with code 0.
- **Message Format**: Bridge passes JSON through unmodified, server adds timestamps
- **Port**: Server uses port 4519 for both HTTP and WebSocket
- **Testing**: Use `npm test` in the server directory
- **Linting**: Always run `npm run lint` before committing

## Current Status

- ✅ bridge: Complete (server/bridge.js)
- ✅ server: Complete (server/server.js)
- ✅ ui: Basic implementation served by server
- ⚠️ README.md with diagrams: Missing
