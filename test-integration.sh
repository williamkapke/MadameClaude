#!/bin/bash

# Integration test for Madame Claude

echo "=== Madame Claude Integration Test ==="
echo

# Test 1: Check if all components exist
echo "1. Checking components..."
if [ -f "server/bridge.js" ] && [ -f "server/server.js" ] && [ -f "docs/index.html" ]; then
    echo "✓ All components found"
else
    echo "✗ Missing components"
    exit 1
fi

# Test 2: Check if sound files exist
echo
echo "2. Checking sound files..."
if [ -f "docs/notification.mp3" ] && [ -f "docs/stop.mp3" ]; then
    echo "✓ Sound files found"
else
    echo "✗ Missing sound files"
    exit 1
fi

# Test 3: Test bridge with sample data
echo
echo "3. Testing bridge..."
TEST_JSON='{"hook_event_name":"PreToolUse","tool_name":"Test","session_id":"test-123"}'
echo "$TEST_JSON" | node server/bridge.js http://localhost:9999 2>&1 | grep -q "Failed to post to server"
if [ $? -eq 0 ]; then
    echo "✓ bridge handles connection errors gracefully"
else
    echo "✗ bridge error handling failed"
fi

# Test 4: Check Node.js syntax
echo
echo "4. Checking Node.js syntax..."
node -c server/bridge.js >/dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✓ bridge syntax check passes"
else
    echo "✗ bridge syntax check failed"
fi

node -c server/server.js >/dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✓ server syntax check passes"
else
    echo "✗ server syntax check failed"
fi

# Test 5: Check if npm is installed
echo
echo "5. Checking npm installation..."
if command -v npm >/dev/null 2>&1; then
    echo "✓ npm is installed"
else
    echo "✗ npm is not installed"
    exit 1
fi

# Test 6: Check package.json
echo
echo "6. Checking package.json..."
if [ -f "server/package.json" ]; then
    echo "✓ package.json found"
else
    echo "✗ package.json missing"
    exit 1
fi

echo
echo "=== Integration Test Complete ==="
echo
echo "To manually test the full system:"
echo "1. Start the server: cd server && npm start"
echo "2. Open http://localhost:4519 in your browser"
echo "3. Configure Claude Code hooks as described in README.md"
echo "4. Use Claude Code and watch events appear in real-time!"