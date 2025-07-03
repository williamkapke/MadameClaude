# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with
code in this repository.

## Project Overview

Claudia is a monitoring system for Claude Code hooks that captures and streams
tool usage events to a web interface. It consists of three Deno-based components
that work together to provide real-time visibility into Claude Code's tool
usage.

## Architecture

The system follows an event-driven architecture with this flow:

```
Claude Code → Hooks → stdio2http → HTTP POST → Server → WebSocket → UI (planned)
```

### Components

1. **stdio2http**: Reads JSON events from stdin and POSTs them to the server
   - Stateless converter that always exits with code 0
   - Wraps messages with timestamps
   - Posts to http://localhost:4519/messages

2. **server**: Receives POSTs and streams via WebSocket
   - Runs on port 4519 (HTTP and WebSocket)
   - Broadcasts all received messages to connected clients
   - Maintains WebSocket connections for real-time updates

3. **ui**: Web interface for displaying events (not yet implemented)

## Development Commands

### stdio2http

```bash
cd stdio2http
deno task start      # Run the app
deno task test       # Run tests
deno task check      # Type check
deno task lint       # Lint code
```

### server

```bash
cd server
deno task start      # Run the server
deno task dev        # Run with file watching
deno task test       # Run tests
deno task check      # Type check
deno task lint       # Lint code
```

## Integration with Claude Code

This project integrates via Claude Code's hooks system. Users configure hooks in
`~/.claude/settings.json`:

```json
{
  "hooks": {
    "PostToolUse": {
      "command": "/absolute/path/to/claudia/stdio2http/mod.ts"
    }
  }
}
```

Hook types: PreToolUse, PostToolUse, Notification, Stop, SubagentStop

## Key Implementation Notes

- **Error Handling**: Never let errors block Claude Code. stdio2http always
  exits with code 0.
- **Message Format**: All messages include timestamps and are wrapped in JSON
- **Port**: Server uses port 4519 for both HTTP and WebSocket
- **Testing**: Use `deno task test` in each component directory
- **Type Checking**: Always run `deno task check` before committing

## Current Status

- ✅ stdio2http: Complete
- ✅ server: Complete
- ❌ ui: Not implemented yet
- ⚠️ README.md with diagrams: Missing
