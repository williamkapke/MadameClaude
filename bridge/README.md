# madame-claude-bridge

Bridge for streaming Claude Code hook events to Madame Claude monitoring server.

## What it does

This bridge reads JSON hook events from stdin and forwards them to the Madame Claude server running on http://localhost:4519/

**Important:** This bridge will NEVER return error codes and NEVER stop messages for any reason. It always exits with code 0 to ensure Claude Code continues operating normally.

## Setup

Add to your Claude Code hooks configuration (`~/.claude/settings.json`):

```json
{
  "hooks": {
    "PreToolUse": [{
      "matcher": ".*",
      "hooks": [{ "type": "command", "command": "npx madame-claude-bridge" }]
    }],
    "PostToolUse": [{
      "matcher": ".*", 
      "hooks": [{ "type": "command", "command": "npx madame-claude-bridge" }]
    }],
    "Notification": [{
      "matcher": ".*",
      "hooks": [{ "type": "command", "command": "npx madame-claude-bridge" }]
    }],
    "Stop": [{
      "matcher": ".*",
      "hooks": [{ "type": "command", "command": "npx madame-claude-bridge" }]
    }],
    "SubagentStop": [{
      "matcher": ".*",
      "hooks": [{ "type": "command", "command": "npx madame-claude-bridge" }]
    }]
  }
}
```

Make sure the Madame Claude server is running: `npx madame-claude`