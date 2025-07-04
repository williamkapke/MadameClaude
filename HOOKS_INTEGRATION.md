# Claude Code Hooks Integration Guide

This guide explains how to integrate the bridge app with Claude Code hooks
to stream events to the monitoring server.

## Prerequisites

1. Ensure the server is running:
   ```bash
   cd server
   npm start
   ```

2. Ensure Node.js is installed and accessible in your PATH

## Integration Steps

### 1. Configure Claude Code Settings

Add hooks configuration to your Claude Code settings file
(`~/.claude/settings.json`):

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "/absolute/path/to/MadameClaude/server/bridge.js"
          }
        ]
      }
    ]
  }
}
```

### 2. Hook Event Types

You can configure different hooks for different events:

- **PreToolUse**: Fires before a tool is executed
- **PostToolUse**: Fires after a tool completes
- **Notification**: Fires when Claude sends notifications
- **Stop**: Fires when the main agent finishes
- **SubagentStop**: Fires when a subagent finishes

### 3. Filtering by Tool Type

Use matcher patterns to filter which tools trigger hooks:

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "/path/to/MadameClaude/server/bridge.js"
          }
        ]
      }
    ]
  }
}
```

Common matcher patterns:

- `"Bash"` - Only Bash commands
- `"Write"` - Only Write operations
- `"Edit|MultiEdit"` - Edit operations (regex)
- `""` - All tools (empty string matches everything)

### 4. Hook Input Format

When Claude Code executes a hook, it pipes JSON data to stdin:

```json
{
  "event": "PreToolUse",
  "tool": "Bash",
  "parameters": {
    "command": "ls -la",
    "description": "List files"
  },
  "timestamp": "2025-01-03T10:00:00Z"
}
```

### 5. Testing the Integration

1. Start the server:
   ```bash
   cd server && npm start
   ```

2. In another terminal, test the bridge directly:
   ```bash
   echo '{"test": "message"}' | node server/bridge.js
   ```

3. Configure Claude Code with the hook and run any command

### 6. Monitoring Output

The server will log all received messages to the console. Future UI development
will display these in a web interface.

## Important Notes

1. **Absolute Paths**: Always use absolute paths in hooks configuration
2. **Permissions**: Ensure the hook script has execute permissions
3. **Error Handling**: stdio2http always exits with code 0 to prevent blocking
   Claude Code
4. **Performance**: Hooks run synchronously, so keep processing minimal

## Example Use Cases

### Development Monitoring

Track all file changes during a coding session:

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Write|Edit|MultiEdit",
        "hooks": [
          {
            "type": "command",
            "command": "/path/to/MadameClaude/server/bridge.js"
          }
        ]
      }
    ]
  }
}
```

### Command Auditing

Log all executed commands:

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "/path/to/MadameClaude/server/bridge.js"
          }
        ]
      }
    ]
  }
}
```

### Agent Activity Tracking

Monitor when agents complete tasks:

```json
{
  "hooks": {
    "SubagentStop": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "/path/to/MadameClaude/server/bridge.js"
          }
        ]
      }
    ]
  }
}
```

## Troubleshooting

1. **Hook not firing**: Check matcher pattern and ensure settings.json is valid
   JSON
2. **Server not receiving**: Verify server is running on port 4519
3. **Permission errors**: Ensure Deno has network permissions
4. **Path issues**: Use absolute paths, expand $HOME manually
