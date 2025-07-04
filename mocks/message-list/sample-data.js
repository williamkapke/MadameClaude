// Sample data from /ignore/sample.txt
const sampleData = [
  {
    message:
      '{"session_id":"9dbb5854-5392-4c32-b73b-e33db3ea72c0","transcript_path":"/Users/kap/.claude/projects/-Users-kap-Documents-Code-williamkapke-claudia/9dbb5854-5392-4c32-b73b-e33db3ea72c0.jsonl","hook_event_name":"PreToolUse","tool_name":"mcp__kapture__list_tabs","tool_input":{}}',
    timestamp: "2025-07-03T04:43:01.263Z",
  },
  {
    message:
      '{"session_id":"9dbb5854-5392-4c32-b73b-e33db3ea72c0","transcript_path":"/Users/kap/.claude/projects/-Users-kap-Documents-Code-williamkapke-claudia/9dbb5854-5392-4c32-b73b-e33db3ea72c0.jsonl","hook_event_name":"Notification","message":"Claude needs your permission to use kapture:list_tabs (MCP)"}',
    timestamp: "2025-07-03T04:43:07.336Z",
  },
  {
    message:
      '{"session_id":"9dbb5854-5392-4c32-b73b-e33db3ea72c0","transcript_path":"/Users/kap/.claude/projects/-Users-kap-Documents-Code-williamkapke-claudia/9dbb5854-5392-4c32-b73b-e33db3ea72c0.jsonl","hook_event_name":"PostToolUse","tool_name":"mcp__kapture__list_tabs","tool_input":{},"tool_response":[{"type":"text","text":"{\\"tabs\\":[{\\"tabId\\":\\"1028110117\\",\\"url\\":\\"http://localhost:5173/component/BarcodeReader/3\\",\\"title\\":\\"CUSS2 Control Panel\\",\\"browser\\":\\"brave\\"}]}"}]}',
    timestamp: "2025-07-03T04:43:21.725Z",
  },
  {
    message:
      '{"session_id":"9dbb5854-5392-4c32-b73b-e33db3ea72c0","transcript_path":"/Users/kap/.claude/projects/-Users-kap-Documents-Code-williamkapke-claudia/9dbb5854-5392-4c32-b73b-e33db3ea72c0.jsonl","hook_event_name":"Stop","stop_hook_active":false}',
    timestamp: "2025-07-03T04:43:26.205Z",
  },
  {
    message:
      '{"session_id":"9dbb5854-5392-4c32-b73b-e33db3ea72c0","transcript_path":"/Users/kap/.claude/projects/-Users-kap-Documents-Code-williamkapke-claudia/9dbb5854-5392-4c32-b73b-e33db3ea72c0.jsonl","hook_event_name":"PreToolUse","tool_name":"Task","tool_input":{"description":"Analyze codebase structure","prompt":"Analyze this codebase to understand its structure..."}}',
    timestamp: "2025-07-03T04:43:58.363Z",
  },
  {
    message:
      '{"session_id":"9dbb5854-5392-4c32-b73b-e33db3ea72c0","transcript_path":"/Users/kap/.claude/projects/-Users-kap-Documents-Code-williamkapke-claudia/9dbb5854-5392-4c32-b73b-e33db3ea72c0.jsonl","hook_event_name":"PreToolUse","tool_name":"LS","tool_input":{"path":"/Users/kap/Documents/Code/williamkapke/claudia"}}',
    timestamp: "2025-07-03T04:44:10.932Z",
  },
  {
    message:
      '{"session_id":"9dbb5854-5392-4c32-b73b-e33db3ea72c0","transcript_path":"/Users/kap/.claude/projects/-Users-kap-Documents-Code-williamkapke-claudia/9dbb5854-5392-4c32-b73b-e33db3ea72c0.jsonl","hook_event_name":"PostToolUse","tool_name":"LS","tool_input":{"path":"/Users/kap/Documents/Code/williamkapke/claudia"},"tool_response":"- /Users/kap/Documents/Code/williamkapke/claudia/\\n  - HOOKS_INTEGRATION.md\\n  - claude-hooks-all-events.json\\n  - claude-hooks-example.json\\n  - server/\\n  - specs/\\n  - stdio2http/"}',
    timestamp: "2025-07-03T04:44:11.001Z",
  },
  {
    message:
      '{"session_id":"9dbb5854-5392-4c32-b73b-e33db3ea72c0","transcript_path":"/Users/kap/.claude/projects/-Users-kap-Documents-Code-williamkapke-claudia/9dbb5854-5392-4c32-b73b-e33db3ea72c0.jsonl","hook_event_name":"PreToolUse","tool_name":"Read","tool_input":{"file_path":"/Users/kap/Documents/Code/williamkapke/claudia/HOOKS_INTEGRATION.md"}}',
    timestamp: "2025-07-03T04:44:15.055Z",
  },
  {
    message:
      '{"session_id":"9dbb5854-5392-4c32-b73b-e33db3ea72c0","transcript_path":"/Users/kap/.claude/projects/-Users-kap-Documents-Code-williamkapke-claudia/9dbb5854-5392-4c32-b73b-e33db3ea72c0.jsonl","hook_event_name":"PostToolUse","tool_name":"Read","tool_input":{"file_path":"/Users/kap/Documents/Code/williamkapke/claudia/HOOKS_INTEGRATION.md"},"tool_response":{"type":"text","file":{"filePath":"/Users/kap/Documents/Code/williamkapke/claudia/HOOKS_INTEGRATION.md","content":"# Claude Code Hooks Integration Guide..."}}}',
    timestamp: "2025-07-03T04:44:15.096Z",
  },
  {
    message:
      '{"session_id":"9dbb5854-5392-4c32-b73b-e33db3ea72c0","transcript_path":"/Users/kap/.claude/projects/-Users-kap-Documents-Code-williamkapke-claudia/9dbb5854-5392-4c32-b73b-e33db3ea72c0.jsonl","hook_event_name":"PreToolUse","tool_name":"Write","tool_input":{"file_path":"/Users/kap/Documents/Code/williamkapke/claudia/CLAUDE.md","content":"# CLAUDE.md..."}}',
    timestamp: "2025-07-03T04:45:54.219Z",
  },
  {
    message:
      '{"session_id":"9dbb5854-5392-4c32-b73b-e33db3ea72c0","transcript_path":"/Users/kap/.claude/projects/-Users-kap-Documents-Code-williamkapke-claudia/9dbb5854-5392-4c32-b73b-e33db3ea72c0.jsonl","hook_event_name":"Notification","message":"Claude needs your permission to use Write"}',
    timestamp: "2025-07-03T04:46:00.304Z",
  },
  {
    message:
      '{"session_id":"9dbb5854-5392-4c32-b73b-e33db3ea72c0","transcript_path":"/Users/kap/.claude/projects/-Users-kap-Documents-Code-williamkapke-claudia/9dbb5854-5392-4c32-b73b-e33db3ea72c0.jsonl","hook_event_name":"PostToolUse","tool_name":"Write","tool_input":{"file_path":"/Users/kap/Documents/Code/williamkapke/claudia/CLAUDE.md","content":"# CLAUDE.md..."},"tool_response":{"type":"create","filePath":"/Users/kap/Documents/Code/williamkapke/claudia/CLAUDE.md"}}',
    timestamp: "2025-07-03T04:46:14.828Z",
  },
  {
    message:
      '{"session_id":"9dbb5854-5392-4c32-b73b-e33db3ea72c0","transcript_path":"/Users/kap/.claude/projects/-Users-kap-Documents-Code-williamkapke-claudia/9dbb5854-5392-4c32-b73b-e33db3ea72c0.jsonl","hook_event_name":"Stop","stop_hook_active":false}',
    timestamp: "2025-07-03T04:46:22.272Z",
  },
  {
    message:
      '{"session_id":"9dbb5854-5392-4c32-b73b-e33db3ea72c0","transcript_path":"/Users/kap/.claude/projects/-Users-kap-Documents-Code-williamkapke-claudia/9dbb5854-5392-4c32-b73b-e33db3ea72c0.jsonl","hook_event_name":"SubagentStop","stop_hook_active":false}',
    timestamp: "2025-07-03T04:45:36.861Z",
  },
  {
    message:
      '{"session_id":"9dbb5854-5392-4c32-b73b-e33db3ea72c0","transcript_path":"/Users/kap/.claude/projects/-Users-kap-Documents-Code-williamkapke-claudia/9dbb5854-5392-4c32-b73b-e33db3ea72c0.jsonl","hook_event_name":"PreToolUse","tool_name":"Bash","tool_input":{"command":"find /Users/kap/Documents/Code/williamkapke/claudia -name \\"package.json\\"","description":"Search for package.json files"}}',
    timestamp: "2025-07-03T04:45:09.114Z",
  },
  {
    message:
      '{"session_id":"9dbb5854-5392-4c32-b73b-e33db3ea72c0","transcript_path":"/Users/kap/.claude/projects/-Users-kap-Documents-Code-williamkapke-claudia/9dbb5854-5392-4c32-b73b-e33db3ea72c0.jsonl","hook_event_name":"PostToolUse","tool_name":"Bash","tool_input":{"command":"find /Users/kap/Documents/Code/williamkapke/claudia -name \\"package.json\\"","description":"Search for package.json files"},"tool_response":{"stdout":"/Users/kap/Documents/Code/williamkapke/claudia/.idea/.gitignore","stderr":"","interrupted":false,"isImage":false}}',
    timestamp: "2025-07-03T04:45:10.624Z",
  },
];

// Load sample data after a short delay to simulate real-time messages
setTimeout(() => {
  updateConnectionStatus(true);

  // Sort messages by timestamp
  const sortedData = sampleData.sort((a, b) =>
    new Date(a.timestamp) - new Date(b.timestamp)
  );

  // Add messages with delays to simulate streaming
  sortedData.forEach((data, index) => {
    setTimeout(() => {
      addMessage(data);
    }, index * 200); // 200ms delay between messages
  });
}, 1000);
