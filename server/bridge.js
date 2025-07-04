#!/usr/bin/env node

const DEFAULT_SERVER_URL = "http://localhost:4519";

async function main() {
  const serverUrl = process.argv[2] || DEFAULT_SERVER_URL;
  
  // Collect all stdin data
  let input = '';
  process.stdin.setEncoding('utf8');
  
  process.stdin.on('data', chunk => {
    input += chunk;
  });
  
  process.stdin.on('end', async () => {
    if (!input.trim()) {
      process.exit(0);
    }
    
    try {
      await fetch(serverUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: input.trim(),
      });
    } catch (error) {
      // Silently fail - don't block hook processing
    }
    
    // Always exit with 0 to not block hook processing
    process.exit(0);
  });
}

if (require.main === module) {
  main();
}