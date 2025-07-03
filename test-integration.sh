#!/bin/bash

# Integration test for Claudia

echo "=== Claudia Integration Test ==="
echo

# Test 1: Check if all components exist
echo "1. Checking components..."
if [ -f "stdio2http/main.ts" ] && [ -f "server/server.ts" ] && [ -f "ui/index.html" ]; then
    echo "✓ All components found"
else
    echo "✗ Missing components"
    exit 1
fi

# Test 2: Check if sound files exist
echo
echo "2. Checking sound files..."
if [ -f "ui/notification.mp3" ] && [ -f "ui/stop.mp3" ]; then
    echo "✓ Sound files found"
else
    echo "✗ Missing sound files"
    exit 1
fi

# Test 3: Test stdio2http with sample data
echo
echo "3. Testing stdio2http..."
TEST_JSON='{"hook_event_name":"PreToolUse","tool_name":"Test","session_id":"test-123"}'
echo "$TEST_JSON" | deno run --allow-net --allow-read stdio2http/main.ts http://localhost:9999 2>&1 | grep -q "Failed to post to server"
if [ $? -eq 0 ]; then
    echo "✓ stdio2http handles connection errors gracefully"
else
    echo "✗ stdio2http error handling failed"
fi

# Test 4: Type check all components
echo
echo "4. Type checking components..."
cd stdio2http && deno task check >/dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✓ stdio2http type checks pass"
else
    echo "✗ stdio2http type check failed"
fi

cd ../server && deno task check >/dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✓ server type checks pass"
else
    echo "✗ server type check failed"
fi

cd ..

# Test 5: Lint all components
echo
echo "5. Linting components..."
cd stdio2http && deno task lint >/dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✓ stdio2http lint passes"
else
    echo "✗ stdio2http lint failed"
fi

cd ../server && deno task lint >/dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✓ server lint passes"
else
    echo "✗ server lint failed"
fi

cd ..

# Test 6: Run unit tests
echo
echo "6. Running unit tests..."
cd stdio2http && deno task test >/dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✓ stdio2http tests pass"
else
    echo "✗ stdio2http tests failed"
fi

cd ../server && deno task test >/dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✓ server tests pass"
else
    echo "✗ server tests failed"
fi

cd ..

echo
echo "=== Integration Test Complete ==="
echo
echo "To manually test the full system:"
echo "1. Start the server: cd server && deno task start"
echo "2. Open http://localhost:4519 in your browser"
echo "3. Configure Claude Code hooks as described in README.md"
echo "4. Use Claude Code and watch events appear in real-time!"