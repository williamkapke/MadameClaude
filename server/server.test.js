const http = require('http');
const WebSocket = require('ws');
const { spawn } = require('child_process');
const path = require('path');

// Helper to wait for server to start
function waitForServer(port, maxRetries = 10) {
  return new Promise((resolve, reject) => {
    let retries = 0;
    
    const checkServer = () => {
      const req = http.get(`http://localhost:${port}`, (res) => {
        resolve();
      });
      
      req.on('error', (err) => {
        retries++;
        if (retries >= maxRetries) {
          reject(new Error('Server failed to start'));
        } else {
          setTimeout(checkServer, 500);
        }
      });
      
      req.end();
    };
    
    checkServer();
  });
}

describe('server', () => {
  let serverProcess;
  const TEST_PORT = 4521;

  beforeAll(async () => {
    // Start server on test port
    const serverPath = path.join(__dirname, 'server.js');
    serverProcess = spawn('node', [serverPath], {
      env: { ...process.env, PORT: TEST_PORT }
    });
    
    // Wait for server to be ready
    await waitForServer(TEST_PORT);
  });

  afterAll(() => {
    if (serverProcess) {
      serverProcess.kill();
    }
  });

  test('Message structure validation', () => {
    const validMessage = {
      message: 'Hello, world!',
      timestamp: '2023-01-01T00:00:00.000Z',
    };

    expect(validMessage.message).toBeDefined();
    expect(validMessage.timestamp).toBeDefined();
    expect(typeof validMessage.message).toBe('string');
    expect(typeof validMessage.timestamp).toBe('string');

    // Validate timestamp format (ISO 8601)
    const date = new Date(validMessage.timestamp);
    expect(date.toISOString()).toBe(validMessage.timestamp);
  });

  test('HTTP POST endpoint accepts valid JSON', async () => {
    const testMessage = {
      message: 'test message',
      timestamp: new Date().toISOString(),
    };

    const response = await fetch(`http://localhost:${TEST_PORT}/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testMessage)
    });

    expect(response.ok).toBe(true);
    const data = await response.json();
    expect(data.success).toBe(true);
  });

  test('HTTP POST endpoint rejects invalid JSON', async () => {
    const response = await fetch(`http://localhost:${TEST_PORT}/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{ invalid json }'
    });

    expect(response.ok).toBe(false);
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe('Invalid JSON');
  });

  test('CORS headers configuration', async () => {
    const response = await fetch(`http://localhost:${TEST_PORT}/`, {
      method: 'OPTIONS'
    });

    expect(response.status).toBe(204);
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
    expect(response.headers.get('Access-Control-Allow-Methods')).toBe('POST, OPTIONS');
    expect(response.headers.get('Access-Control-Allow-Headers')).toBe('Content-Type');
  });

  test('WebSocket connection', (done) => {
    const ws = new WebSocket(`ws://localhost:${TEST_PORT}/`);
    
    ws.on('open', () => {
      expect(ws.readyState).toBe(WebSocket.OPEN);
      ws.close();
    });
    
    ws.on('close', () => {
      done();
    });
    
    ws.on('error', (err) => {
      done(err);
    });
  });

  test('WebSocket message broadcasting', (done) => {
    const ws = new WebSocket(`ws://localhost:${TEST_PORT}/`);
    const testMessage = {
      message: 'broadcast test',
      timestamp: new Date().toISOString(),
    };
    
    ws.on('open', async () => {
      // Send HTTP POST to trigger broadcast
      await fetch(`http://localhost:${TEST_PORT}/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testMessage)
      });
    });
    
    ws.on('message', (data) => {
      const received = JSON.parse(data.toString());
      expect(received.message).toBe(testMessage.message);
      expect(received.timestamp).toBe(testMessage.timestamp);
      ws.close();
      done();
    });
    
    ws.on('error', (err) => {
      done(err);
    });
  });

  test('Response format validation', () => {
    const successResponse = { success: true };
    const errorResponse = { error: 'Invalid JSON' };

    expect(successResponse.success).toBe(true);
    expect(errorResponse.error).toBe('Invalid JSON');

    // Test JSON serialization
    const successJson = JSON.stringify(successResponse);
    const errorJson = JSON.stringify(errorResponse);

    expect(successJson).toBe('{"success":true}');
    expect(errorJson).toBe('{"error":"Invalid JSON"}');
  });
});