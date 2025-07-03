#!/usr/bin/env -S deno run --allow-net --allow-read

const DEFAULT_SERVER_URL = "http://localhost:4519";

async function readStdio(): Promise<string> {
  const decoder = new TextDecoder();
  const buffer = new Uint8Array(4096);
  let input = "";
  
  while (true) {
    const n = await Deno.stdin.read(buffer);
    if (n === null) break;
    input += decoder.decode(buffer.slice(0, n));
  }
  
  return input.trim();
}

async function postToServer(data: string, serverUrl: string): Promise<boolean> {
  try {
    const response = await fetch(serverUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: data,
        timestamp: new Date().toISOString(),
      }),
    });
    
    if (!response.ok) {
      console.error(`HTTP error: ${response.status} ${response.statusText}`);
      return false;
    }
    
    return true;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`Failed to post to server: ${errorMessage}`);
    return false;
  }
}

async function main() {
  const serverUrl = Deno.args[0] || DEFAULT_SERVER_URL;
  
  try {
    const input = await readStdio();
    
    if (input.length === 0) {
      console.log("No input received from stdio");
      Deno.exit(0);
    }
    
    const success = await postToServer(input, serverUrl);
    
    if (success) {
      console.log("Message posted successfully");
    } else {
      console.log("Failed to post message, but continuing...");
    }
    
    // Always exit with 0 to not block hook processing
    Deno.exit(0);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`Unexpected error: ${errorMessage}`);
    // Always exit with 0 to not block hook processing
    Deno.exit(0);
  }
}

if (import.meta.main) {
  main();
}