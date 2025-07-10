      let ws = null;
      let events = [];
      let filters = {
        session: "",
        location: "",
        tool: "",
        types: {
          PreToolUse: true,
          PostToolUse: true,
          Notification: true,
          Stop: true,
          SubagentStop: true,
        },
      };
      let expandedRowId = null;
      let isUserScrolling = false;
      
      // HTML escape function to prevent XSS
      function escapeHtml(unsafe) {
        return String(unsafe)
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/"/g, "&quot;")
          .replace(/'/g, "&#039;");
      }

      // Color palettes for unique IDs
      const colorPalette = [
        '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6',
        '#ec4899', '#14b8a6', '#f97316', '#6366f1', '#84cc16',
        '#06b6d4', '#a855f7', '#eab308', '#0ea5e9', '#d946ef',
        '#22c55e', '#f43f5e', '#3b82f6', '#a78bfa', '#fbbf24'
      ];

      const sessionColors = new Map();
      const locationColors = new Map();
      let colorIndex = 0;

      function getColorForId(id, map) {
        if (!map.has(id)) {
          map.set(id, colorPalette[colorIndex % colorPalette.length]);
          colorIndex++;
        }
        return map.get(id);
      }

      function extractLocationName(transcriptPath) {
        if (!transcriptPath) return '-';
        // Extract the project location name from the transcript path
        // Example: "/Users/kap/.claude/projects/-Users-kap-Documents-Code-williamkapke-claudia/..."
        const match = transcriptPath.match(/\/projects\/([^\/]+)\//);
        if (match && match[1]) {
          // Convert the escaped path to readable location name
          // "-Users-kap-Documents-Code-williamkapke-claudia" -> "claudia"
          const parts = match[1].split('-').filter(p => p);
          return parts[parts.length - 1] || '-';
        }
        return '-';
      }

      function extractProjectPath(transcriptPath) {
        if (!transcriptPath) return null;
        // Extract the escaped project path from transcript path
        const match = transcriptPath.match(/\/projects\/([^\/]+)\//);
        if (match && match[1]) {
          // Convert escaped path back to actual path
          // "-Users-kap-Documents-Fusion-360" -> "/Users/kap/Documents/Fusion 360"
          // Create a regex that matches the pattern where - can be any character
          const escapedPath = match[1];
          const regexPattern = escapedPath.replace(/-/g, '.');
          return new RegExp('^(' + regexPattern + ')');
        }
        return null;
      }

      function makeRelativePath(filePath, transcriptPath) {
        if (!filePath || !transcriptPath) return filePath;
        
        const projectPathRegex = extractProjectPath(transcriptPath);
        if (!projectPathRegex) return filePath;
        
        // Try to find a match in the file path
        const match = filePath.match(projectPathRegex);
        if (match) {
          // Return the path relative to the project directory
          const relativePath = filePath.substring(match[0].length);
          return relativePath.startsWith('/') ? relativePath.substring(1) : relativePath;
        }
        
        return filePath;
      }

      function makeRelativePathsInString(str, transcriptPath) {
        if (!str || !transcriptPath) return str;
        
        const projectPathRegex = extractProjectPath(transcriptPath);
        if (!projectPathRegex) return str;
        
        // Create a global version of the regex to find all occurrences
        const globalRegex = new RegExp(projectPathRegex.source + '[^\\s]*', 'g');
        
        return str.replace(globalRegex, (match) => {
          // Extract just the project path portion
          const projectMatch = match.match(projectPathRegex);
          if (projectMatch) {
            const relativePath = match.substring(projectMatch[0].length);
            return '.' + (relativePath.startsWith('/') ? relativePath : '/' + relativePath);
          }
          return match;
        });
      }

      // Sound settings
      let soundSettings = {
        notification: {
          volume: 0.5,
          muted: false
        },
        stop: {
          volume: 0.5,
          muted: false
        }
      };

      // Load settings from localStorage
      function loadSettings() {
        const saved = localStorage.getItem('claudia-sound-settings');
        if (saved) {
          soundSettings = JSON.parse(saved);
          // Update UI
          document.getElementById('notification-volume').value = soundSettings.notification.volume * 100;
          document.getElementById('notification-volume-value').textContent = Math.round(soundSettings.notification.volume * 100) + '%';
          document.getElementById('notification-mute').checked = soundSettings.notification.muted;

          document.getElementById('stop-volume').value = soundSettings.stop.volume * 100;
          document.getElementById('stop-volume-value').textContent = Math.round(soundSettings.stop.volume * 100) + '%';
          document.getElementById('stop-mute').checked = soundSettings.stop.muted;
        }
      }

      // Save settings to localStorage
      function saveSettings() {
        localStorage.setItem('claudia-sound-settings', JSON.stringify(soundSettings));
      }

      function connectWebSocket() {
        try {
          ws = new WebSocket("ws://localhost:4519");

          ws.onopen = () => {
            console.log("Connected to server");
          };

          ws.onmessage = (event) => {
            try {
              const data = JSON.parse(event.data);
              addEvent(data);
            } catch (error) {
              console.error("Failed to parse message:", error);
            }
          };

          ws.onclose = () => {
            console.log("Disconnected from server");
            // Reconnect after 2 seconds
            setTimeout(connectWebSocket, 2000);
          };

          ws.onerror = (error) => {
            console.error("WebSocket error:", error);
          };
        } catch (error) {
          console.error("Failed to connect:", error);
          setTimeout(connectWebSocket, 2000);
        }
      }

      // Sound effect functions
      function playNotificationSound() {
        if (soundSettings.notification.muted) return;

        const audio = new Audio('notification.mp3');
        audio.volume = soundSettings.notification.volume;
        audio.play().catch((err) => {
          console.warn('Could not play notification sound:', err);
        });
      }

      function playStopSound() {
        if (soundSettings.stop.muted) return;

        const audio = new Audio('stop.mp3');
        audio.volume = soundSettings.stop.volume;
        audio.play().catch((err) => {
          console.warn('Could not play stop sound:', err);
        });
      }

      // Settings modal functions
      let volumeDebounceTimer = null;

      function openSettings() {
        document.getElementById('settings-modal').classList.add('active');
      }

      function closeSettings() {
        document.getElementById('settings-modal').classList.remove('active');
      }

      function updateVolume(type, value) {
        soundSettings[type].volume = value / 100;
        document.getElementById(`${type}-volume-value`).textContent = value + '%';
        saveSettings();

        // Clear existing timer
        if (volumeDebounceTimer) {
          clearTimeout(volumeDebounceTimer);
        }

        // Set new timer to play sound after user stops adjusting
        volumeDebounceTimer = setTimeout(() => {
          // Play a preview sound
          if (type === 'notification') {
            playNotificationSound();
          } else {
            playStopSound();
          }
        }, 300); // Wait 300ms after last change
      }

      function toggleMute(type, muted) {
        soundSettings[type].muted = muted;
        saveSettings();
      }

      function addEvent(data) {
        const event = {
          id: Date.now() + Math.random(),
          timestamp: data.timestamp || new Date().toISOString(),
          data: data.message || data,
        };

        events.push(event);
        renderEvent(event);
      }

      function renderEvent(event) {
        const eventsList = document.getElementById("events-list");

        // Hide empty state if it exists
        const emptyState = document.getElementById("empty-state");
        if (emptyState) {
          emptyState.style.display = "none";
        }

        const eventData = typeof event.data === "string"
          ? JSON.parse(event.data)
          : event.data;

        // Extract event details
        const eventType = eventData.hook_event_name || "Unknown";
        const tool = eventData.tool_name || "-";
        const session = eventData.session_id || "-";
        const location = extractLocationName(eventData.transcript_path);
        const time = new Date(event.timestamp).toLocaleTimeString(
          "en-US",
          { hour12: false },
        );

        // Play sounds for specific event types
        if (eventType === "Notification") {
          playNotificationSound();
        } else if (eventType === "Stop") {
          playStopSound();
        }

        // Get details based on event type
        let details = "";
        if (eventData.tool_input) {
          // Check tool-specific fields first
          if (tool === "Bash" && eventData.tool_input.command) {
            details = makeRelativePathsInString(eventData.tool_input.command, eventData.transcript_path);
          } else if (tool === "Grep" && eventData.tool_input.pattern) {
            // Special handling for Grep tool
            details = eventData.tool_input.pattern;
            if (eventData.tool_input.path) {
              details += " in " + makeRelativePath(eventData.tool_input.path, eventData.transcript_path);
            }
            if (eventData.tool_input.glob) {
              details += " (glob: " + eventData.tool_input.glob + ")";
            }
          } else if (tool === "Glob" && eventData.tool_input.pattern) {
            details = eventData.tool_input.pattern;
            if (eventData.tool_input.path) {
              details += " in " + makeRelativePath(eventData.tool_input.path, eventData.transcript_path);
            }
          } else if (tool === "LS" && eventData.tool_input.path) {
            details = makeRelativePath(eventData.tool_input.path, eventData.transcript_path);
          } else if (tool === "TodoWrite" && eventData.tool_input.todos) {
            const todoCount = eventData.tool_input.todos.length;
            details = `${todoCount} todo${todoCount === 1 ? '' : 's'}`;
          } else if (eventData.tool_input.command) {
            details = makeRelativePathsInString(eventData.tool_input.command, eventData.transcript_path);
          } else if (eventData.tool_input.description) {
            details = eventData.tool_input.description;
          } else if (eventData.tool_input.url) {
            details = eventData.tool_input.url;
          } else if (eventData.tool_input.file_path) {
            details = makeRelativePath(eventData.tool_input.file_path, eventData.transcript_path);
          }
        } else if (eventData.message) {
          details = eventData.message;
        } else if (eventData.result) {
          details = typeof eventData.result === "string"
            ? eventData.result
            : "Result available";
        }

        // Create event row container
        const container = document.createElement("div");
        container.className = "event-row-container";
        container.dataset.eventId = event.id;
        container.dataset.session = session.toLowerCase();
        container.dataset.location = location.toLowerCase();
        container.dataset.tool = tool.toLowerCase();
        container.dataset.type = eventType;

        // Get colors for session and location
        const sessionColor = getColorForId(session, sessionColors);
        const locationColor = getColorForId(location, locationColors);

        // Create event row
        const row = document.createElement("div");
        row.className = "event-row";
        row.innerHTML = `
                <div class="col-session">
                    <span class="session-badge" style="background-color: ${sessionColor}20; color: ${sessionColor}; border: 1px solid ${sessionColor}40;">
                        ${escapeHtml(session.substring(0, 7))}
                    </span>
                </div>
                <div class="col-location">
                    <span class="location-badge" style="background-color: ${locationColor}20; color: ${locationColor}; border: 1px solid ${locationColor}40;">
                        ${escapeHtml(location)}
                    </span>
                </div>
                <div class="col-time">${escapeHtml(time)}</div>
                <div class="col-type">
                    <span class="event-type ${escapeHtml(eventType)}">${escapeHtml(eventType)}</span>
                </div>
                <div class="col-tool">${escapeHtml(tool.replace(/^mcp__/, ""))}</div>
                <div class="col-details">${escapeHtml(details)}</div>
            `;

        // Create expanded content
        const expanded = document.createElement("div");
        expanded.className = "expanded-content";
        expanded.innerHTML = `
                <div class="data-section">
                    <pre class="json-data">${escapeHtml(JSON.stringify(eventData, null, 2))}</pre>
                </div>
            `;

        // Add to container
        container.appendChild(row);
        container.appendChild(expanded);

        // Add click handler
        row.onclick = () => toggleRow(event.id);

        // Check if user is at bottom before adding new element
        const shouldAutoScroll = isAtBottom();

        // Add to DOM
        eventsList.appendChild(container);

        // Apply filters
        applyFilters();

        // Auto-scroll to bottom if user was already at bottom
        if (shouldAutoScroll) {
          scrollToBottom();
        }
      }

      function toggleRow(eventId) {
        const containers = document.querySelectorAll(
          ".event-row-container",
        );
        containers.forEach((container) => {
          if (container.dataset.eventId === String(eventId)) {
            if (container.classList.contains("expanded")) {
              container.classList.remove("expanded");
              expandedRowId = null;
            } else {
              // Collapse any other expanded row
              containers.forEach((c) => c.classList.remove("expanded"));
              container.classList.add("expanded");
              expandedRowId = eventId;
            }
          } else {
            container.classList.remove("expanded");
          }
        });
      }

      function filterBySession(value) {
        filters.session = value.toLowerCase();
        applyFilters();
      }

      function filterByLocation(value) {
        filters.location = value.toLowerCase();
        applyFilters();
      }

      function filterByTool(value) {
        filters.tool = value.toLowerCase();
        applyFilters();
      }

      function toggleFilter(checkbox) {
        const filterType = checkbox.dataset.filter;
        filters.types[filterType] = checkbox.checked;
        applyFilters();
      }

      function toggleAllFilters(checkbox) {
        const allChecked = checkbox.checked;
        Object.keys(filters.types).forEach((type) => {
          filters.types[type] = allChecked;
        });

        // Update all individual checkboxes
        document.querySelectorAll("[data-filter]").forEach((cb) => {
          cb.checked = allChecked;
        });

        applyFilters();
      }

      function applyFilters() {
        const containers = document.querySelectorAll(
          ".event-row-container",
        );
        containers.forEach((container) => {
          const matchSession = !filters.session ||
            container.dataset.session.includes(filters.session);
          const matchLocation = !filters.location ||
            container.dataset.location.includes(filters.location);
          const matchTool = !filters.tool ||
            container.dataset.tool.includes(filters.tool);
          const matchType = filters.types[container.dataset.type];

          const show = matchSession && matchLocation && matchTool && matchType;
          container.classList.toggle("hidden", !show);
        });
      }

      function toggleTypeDropdown() {
        const menu = document.getElementById("type-dropdown-menu");
        const isVisible = menu.style.display === "block";
        menu.style.display = isVisible ? "none" : "block";
      }

      function clearMessages() {
        if (confirm("Clear all events?")) {
          events = [];
          document.getElementById("events-list").innerHTML = "";
        }
      }

      // Close dropdown when clicking outside
      document.addEventListener("click", (e) => {
        const dropdown = document.querySelector(".type-dropdown");
        if (!dropdown.contains(e.target)) {
          document.getElementById("type-dropdown-menu").style.display =
            "none";
        }
      });

      // Function to load and display hooks configuration
      async function loadHooksConfiguration() {
        try {
          const response = await fetch('http://localhost:4519/hooks');
          const hooksData = await response.json();

          const hooksContent = document.getElementById('hooks-content');
          let html = '';
          let hasAnyMadameClaudeHooks = false;

          // First pass: check if any Madame Claude hooks exist
          for (const [filename, hooks] of Object.entries(hooksData)) {
            const hasMadameClaude = hooks && Object.keys(hooks).some(eventType =>
              hooks[eventType] && hooks[eventType].some(matcher =>
                matcher.hooks && matcher.hooks.some(hook =>
                  hook.command && (hook.command.toLowerCase().includes('madame-claude') || hook.command.toLowerCase().includes('madameclaude'))
                )
              )
            );
            if (hasMadameClaude) {
              hasAnyMadameClaudeHooks = true;
              break;
            }
          }

          // Process each settings file
          for (const [filename, hooks] of Object.entries(hooksData)) {
            const isLocal = filename === 'settings.local.json';
            
            // Skip settings.local.json for now
            if (isLocal) continue;
            
            const hasMadameClaude = hooks && Object.keys(hooks).some(eventType =>
              hooks[eventType] && hooks[eventType].some(matcher =>
                matcher.hooks && matcher.hooks.some(hook =>
                  hook.command && (hook.command.toLowerCase().includes('madame-claude') || hook.command.toLowerCase().includes('madameclaude'))
                )
              )
            );


            html += `<div class="hooks-file">`;
            html += `<div class="hooks-file-title">${escapeHtml(filename)}</div>`;

            if (hooks && Object.keys(hooks).length > 0) {
              // Create table
              html += `<div class="hooks-table">`;

              // Process each event type (including any custom ones)
              for (const eventType in hooks) {
                if (!hooks[eventType] || hooks[eventType].length === 0) continue;

                // Process each matcher
                for (const matcher of hooks[eventType]) {
                  // Process each hook
                  if (matcher.hooks && matcher.hooks.length > 0) {
                    for (const hook of matcher.hooks) {
                      if (hook.command) {
                        html += `<div class="hooks-row">`;
                        html += `<div class="hooks-cell"><span class="hooks-type ${escapeHtml(eventType)}">${escapeHtml(eventType)}</span></div>`;
                        html += `<div class="hooks-cell">${escapeHtml(matcher.matcher)}</div>`;
                        html += `<div class="hooks-cell">${escapeHtml(hook.command)}</div>`;
                        html += `</div>`;
                      }
                    }
                  }
                }
              }
              html += `</div>`;
            }

            // Add setup button if Madame Claude hooks are not present
            if (!hasMadameClaude) {
              html += `<div class="hooks-file-actions">`;
              html += `<button class="hooks-btn hooks-btn-setup" onclick="setupHooks(${isLocal})">Add Madame Claude Hooks</button>`;

              // Add "Click here to get started" arrow for settings.json when no hooks exist anywhere
              if (!isLocal && !hasAnyMadameClaudeHooks) {
                html += `<div class="getting-started-arrow">`;
                html += `<div class="getting-started-text">CLICK HERE<br/>TO GET STARTED</div>`;
                html += `</div>`;
              }

              html += `</div>`;
            }

            html += `</div>`;
          }

          hooksContent.innerHTML = html;

          // Show/hide remove button based on whether any Madame Claude hooks exist
          const removeSection = document.getElementById('hooks-remove-section');
          if (hasAnyMadameClaudeHooks) {
            removeSection.style.display = 'block';
          } else {
            removeSection.style.display = 'none';
          }
        } catch (error) {
          console.error('Failed to load hooks configuration:', error);
          document.getElementById('hooks-content').innerHTML =
            '<p style="color: #ef4444;">Failed to load hooks configuration</p>';
        }
      }

      // Connect on load
      connectWebSocket();

      // Load settings on page load
      loadSettings();

      // Load hooks configuration on page load
      loadHooksConfiguration();

      // Setup hooks function
      async function setupHooks(useLocal) {
        try {
          const response = await fetch('http://localhost:4519/hooks', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ setup: { local: useLocal } })
          });

          const result = await response.json();

          if (result.success) {
            // Reload hooks display
            loadHooksConfiguration();

            // Show success message (you could add a toast notification here)
            console.log(result.message);
          } else {
            console.error('Failed to setup hooks:', result.error);
          }
        } catch (error) {
          console.error('Error setting up hooks:', error);
        }
      }

      // Remove all hooks function
      async function removeHooks() {
        if (!confirm('Remove all Madame Claude hooks from both settings files?')) {
          return;
        }

        try {
          const response = await fetch('http://localhost:4519/hooks', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ setup: {} })
          });

          const result = await response.json();

          if (result.success) {
            // Reload hooks display
            loadHooksConfiguration();

            // Show success message
            console.log(result.message);
          } else {
            console.error('Failed to remove hooks:', result.error);
          }
        } catch (error) {
          console.error('Error removing hooks:', error);
        }
      }

      // Close modal when clicking outside
      document.getElementById('settings-modal').addEventListener('click', (e) => {
        if (e.target.id === 'settings-modal') {
          closeSettings();
        }
      });

      // Auto-scroll functions
      function isAtBottom() {
        const eventsList = document.getElementById('events-list');
        const threshold = 50; // Pixels from bottom to consider "at bottom"
        return eventsList.scrollHeight - eventsList.scrollTop - eventsList.clientHeight < threshold;
      }

      function scrollToBottom() {
        const eventsList = document.getElementById('events-list');
        eventsList.scrollTop = eventsList.scrollHeight;
      }

      // Track user scrolling
      let scrollTimer = null;
      document.getElementById('events-list').addEventListener('scroll', () => {
        // Clear existing timer
        if (scrollTimer) {
          clearTimeout(scrollTimer);
        }

        // Set flag to indicate user is scrolling
        isUserScrolling = true;

        // Reset flag after scrolling stops
        scrollTimer = setTimeout(() => {
        }, 150);
      });
