const { spawn } = require('child_process');
const path = require('path');

// Helper function to run the script with input
function runScript(input, args = []) {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(__dirname, 'bridge.js');
    const proc = spawn('node', [scriptPath, ...args]);
    
    let stdout = '';
    let stderr = '';
    
    proc.stdout.on('data', (data) => {
      stdout += data.toString();
    });
    
    proc.stderr.on('data', (data) => {
      stderr += data.toString();
    });
    
    proc.on('close', (code) => {
      resolve({ code, stdout, stderr });
    });
    
    proc.on('error', (err) => {
      reject(err);
    });
    
    // Write input and close stdin
    if (input) {
      proc.stdin.write(input);
    }
    proc.stdin.end();
  });
}

describe('bridge', () => {
  test('should handle empty input', async () => {
    const result = await runScript('');
    expect(result.code).toBe(0);
  });

  test('should handle text input', async () => {
    // Mock fetch to avoid actual network calls
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK'
    });

    const testInput = '{"message": "Hello, world!"}';
    const result = await runScript(testInput);
    
    expect(result.code).toBe(0);
  });

  test('should handle network errors gracefully', async () => {
    // Mock fetch to simulate network error
    global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));

    const result = await runScript('{"test": "message"}');
    
    expect(result.code).toBe(0);
  });

  test('should handle HTTP errors gracefully', async () => {
    // Mock fetch to simulate HTTP error
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error'
    });

    const result = await runScript('{"test": "message"}');
    
    expect(result.code).toBe(0);
  });

  test('should use custom server URL from arguments', async () => {
    const customUrl = 'http://custom-server:8080';
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK'
    });

    await runScript('{"test": "message"}', [customUrl]);
    
    expect(global.fetch).toHaveBeenCalledWith(
      customUrl,
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{"test": "message"}'
      })
    );
  });

  test('should pass JSON through without modification', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK'
    });

    const jsonInput = '{"hook_event_name":"PostToolUse","tool_name":"test"}';
    await runScript(jsonInput);
    
    expect(global.fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: jsonInput
      })
    );
  });
});