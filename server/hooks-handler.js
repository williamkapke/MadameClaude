const { readFile, writeFile } = require('node:fs/promises');
const path = require('path');
const os = require('os');

async function getHooksInfo() {
  const homeDir = os.homedir();
  const claudeDir = path.join(homeDir, '.claude');
  
  const result = {
    'settings.json': null,
    'settings.local.json': null
  };

  // Try to read settings.json
  try {
    const settingsPath = path.join(claudeDir, 'settings.json');
    const content = await readFile(settingsPath, 'utf8');
    const settings = JSON.parse(content);
    if (settings.hooks) {
      result['settings.json'] = settings.hooks;
    }
  } catch (error) {
    // File doesn't exist or can't be parsed - leave as null
  }

  // Try to read settings.local.json
  try {
    const localSettingsPath = path.join(claudeDir, 'settings.local.json');
    const content = await readFile(localSettingsPath, 'utf8');
    const settings = JSON.parse(content);
    if (settings.hooks) {
      result['settings.local.json'] = settings.hooks;
    }
  } catch (error) {
    // File doesn't exist or can't be parsed - leave as null
  }

  return result;
}

async function handleHooksRequest(req, res) {
  if (req.method === 'GET') {
    // Handle GET request
    try {
      const hooksInfo = await getHooksInfo();
      res.writeHead(200, { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      });
      res.end(JSON.stringify(hooksInfo, null, 2));
    } catch (error) {
      console.error('Error getting hooks info:', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Internal server error' }));
    }
  } else if (req.method === 'POST') {
    // Handle POST request for setup
    handleHooksSetupRequest(req, res);
  } else {
    res.writeHead(405, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Method not allowed' }));
  }
}

// Check if a hook is calling madame-claude
function isMadameClaudeHook(hook) {
  if (!hook || !hook.command) return false;
  const command = hook.command.toLowerCase();
  return command.includes('madame-claude') || command.includes('madameclaude');
}

// Remove madame-claude hooks from a hooks configuration
function removeMadameClaudeHooks(hooks) {
  if (!hooks) return {};
  
  const cleanedHooks = {};
  const eventTypes = ['PreToolUse', 'PostToolUse', 'Notification', 'Stop', 'SubagentStop'];
  
  for (const eventType of eventTypes) {
    if (!hooks[eventType]) continue;
    
    const cleanedMatchers = [];
    
    for (const matcher of hooks[eventType]) {
      if (!matcher.hooks) continue;
      
      // Filter out madame-claude hooks
      const filteredHooks = matcher.hooks.filter(hook => !isMadameClaudeHook(hook));
      
      // Only keep the matcher if there are hooks left
      if (filteredHooks.length > 0) {
        cleanedMatchers.push({
          ...matcher,
          hooks: filteredHooks
        });
      }
    }
    
    // Only include the event type if there are matchers left
    if (cleanedMatchers.length > 0) {
      cleanedHooks[eventType] = cleanedMatchers;
    }
  }
  
  return cleanedHooks;
}

// Add madame-claude hooks to a hooks configuration
function addMadameClaudeHooks(hooks) {
  const eventTypes = ['PreToolUse', 'PostToolUse', 'Notification', 'Stop', 'SubagentStop'];
  const madameClaudeHook = {
    type: 'command',
    command: 'npx madame-claude-bridge'
  };
  
  const updatedHooks = hooks ? { ...hooks } : {};
  
  for (const eventType of eventTypes) {
    if (!updatedHooks[eventType]) {
      // Create new event type with matcher
      updatedHooks[eventType] = [{
        matcher: '.*',
        hooks: [madameClaudeHook]
      }];
    } else {
      // Check if there's already a ".*" matcher
      let catchAllMatcher = updatedHooks[eventType].find(m => m.matcher === '.*');
      
      if (catchAllMatcher) {
        // Ensure hooks array exists and add our hook
        if (!catchAllMatcher.hooks) catchAllMatcher.hooks = [];
        catchAllMatcher.hooks.push(madameClaudeHook);
      } else {
        // Add new catch-all matcher
        updatedHooks[eventType].push({
          matcher: '.*',
          hooks: [madameClaudeHook]
        });
      }
    }
  }
  
  return updatedHooks;
}

// Read a settings file and return the full settings object
async function readSettingsFile(filePath) {
  try {
    const content = await readFile(filePath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    // File doesn't exist or can't be parsed
    return null;
  }
}

// Write a settings file
async function writeSettingsFile(filePath, settings) {
  const content = JSON.stringify(settings, null, 2);
  await writeFile(filePath, content, 'utf8');
}

// Handle POST /hooks request
async function handleHooksSetupRequest(req, res) {
  let body = '';
  
  req.on('data', chunk => {
    body += chunk.toString();
  });
  
  req.on('end', async () => {
    try {
      const data = JSON.parse(body);
      
      if (!data.setup) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid request. Expected { setup: { local?: boolean } }' }));
        return;
      }
      
      // Check if local property exists
      const hasLocalProperty = 'local' in data.setup;
      
      if (hasLocalProperty && typeof data.setup.local !== 'boolean') {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid request. local must be a boolean if provided' }));
        return;
      }
      
      const useLocal = data.setup.local;
      const homeDir = os.homedir();
      const claudeDir = path.join(homeDir, '.claude');
      const settingsPath = path.join(claudeDir, 'settings.json');
      const localSettingsPath = path.join(claudeDir, 'settings.local.json');
      
      // Read both files
      let settings = await readSettingsFile(settingsPath) || {};
      let localSettings = await readSettingsFile(localSettingsPath) || {};
      
      if (!hasLocalProperty) {
        // Remove all madame-claude hooks from both files
        if (settings.hooks) {
          settings.hooks = removeMadameClaudeHooks(settings.hooks);
          await writeSettingsFile(settingsPath, settings);
        }
        
        if (localSettings.hooks) {
          localSettings.hooks = removeMadameClaudeHooks(localSettings.hooks);
          await writeSettingsFile(localSettingsPath, localSettings);
        }
        
        res.writeHead(200, { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        });
        res.end(JSON.stringify({ 
          success: true, 
          message: 'All madame-claude hooks removed from both settings files' 
        }));
      } else if (useLocal) {
        // Setting up in local file
        // 1. Remove madame-claude hooks from settings.json
        if (settings.hooks) {
          settings.hooks = removeMadameClaudeHooks(settings.hooks);
          await writeSettingsFile(settingsPath, settings);
        }
        
        // 2. Add madame-claude hooks to settings.local.json
        if (!localSettings.hooks) localSettings.hooks = {};
        localSettings.hooks = removeMadameClaudeHooks(localSettings.hooks);
        localSettings.hooks = addMadameClaudeHooks(localSettings.hooks);
        await writeSettingsFile(localSettingsPath, localSettings);
        
        res.writeHead(200, { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        });
        res.end(JSON.stringify({ 
          success: true, 
          message: 'Hooks configured in settings.local.json' 
        }));
      } else {
        // Setting up in main file
        // 1. Remove madame-claude hooks from settings.local.json
        if (localSettings.hooks) {
          localSettings.hooks = removeMadameClaudeHooks(localSettings.hooks);
          await writeSettingsFile(localSettingsPath, localSettings);
        }
        
        // 2. Add madame-claude hooks to settings.json
        if (!settings.hooks) settings.hooks = {};
        settings.hooks = removeMadameClaudeHooks(settings.hooks);
        settings.hooks = addMadameClaudeHooks(settings.hooks);
        await writeSettingsFile(settingsPath, settings);
        
        res.writeHead(200, { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        });
        res.end(JSON.stringify({ 
          success: true, 
          message: 'Hooks configured in settings.json' 
        }));
      }
      
    } catch (error) {
      console.error('Error setting up hooks:', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Internal server error' }));
    }
  });
}

module.exports = { getHooksInfo, handleHooksRequest };