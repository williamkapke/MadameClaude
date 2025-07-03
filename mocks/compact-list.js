// State management
let messages = [];
let activeFilters = new Set(['PreToolUse', 'PostToolUse', 'Notification', 'Stop', 'SubagentStop']);
let toolFilter = '';
let sessionFilter = '';
const eventCounts = {
    all: 0,
    PreToolUse: 0,
    PostToolUse: 0,
    Notification: 0,
    Stop: 0,
    SubagentStop: 0
};

// Track events per minute
let eventTimestamps = [];

// DOM elements
const eventsList = document.getElementById('events-list');

// Toggle individual filter
function toggleFilter(checkbox) {
    const filter = checkbox.dataset.filter;
    
    if (checkbox.checked) {
        activeFilters.add(filter);
    } else {
        activeFilters.delete(filter);
    }
    
    applyFilters();
}

// Toggle type dropdown
function toggleTypeDropdown() {
    const dropdown = document.getElementById('type-dropdown-menu');
    const isVisible = dropdown.style.display !== 'none';
    dropdown.style.display = isVisible ? 'none' : 'block';
    
    // Close dropdown when clicking outside
    if (!isVisible) {
        document.addEventListener('click', function closeDropdown(e) {
            if (!e.target.closest('.type-dropdown')) {
                dropdown.style.display = 'none';
                document.removeEventListener('click', closeDropdown);
            }
        });
    }
}

// Toggle all filters
function toggleAllFilters(checkbox) {
    const filterCheckboxes = document.querySelectorAll('.dropdown-item .toggle-switch[data-filter]');
    
    filterCheckboxes.forEach(cb => {
        cb.checked = checkbox.checked;
        const filter = cb.dataset.filter;
        if (checkbox.checked) {
            activeFilters.add(filter);
        } else {
            activeFilters.delete(filter);
        }
    });
    
    applyFilters();
}

// Filter by tool name
function filterByTool(value) {
    toolFilter = value.toLowerCase();
    applyFilters();
}

// Filter by session
function filterBySession(value) {
    sessionFilter = value.toLowerCase();
    applyFilters();
}

// Apply filters to events
function applyFilters() {
    const eventContainers = document.querySelectorAll('.event-row-container');
    
    eventContainers.forEach(container => {
        const eventType = container.dataset.eventType;
        const eventRow = container.querySelector('.event-row');
        const toolText = eventRow.querySelector('.col-tool').textContent.toLowerCase();
        const sessionText = eventRow.querySelector('.col-session').textContent.toLowerCase();
        
        // Check all filters
        const matchesEventFilter = activeFilters.has(eventType);
        const matchesToolFilter = !toolFilter || toolText.includes(toolFilter);
        const matchesSessionFilter = !sessionFilter || sessionText.includes(sessionFilter);
        
        if (matchesEventFilter && matchesToolFilter && matchesSessionFilter) {
            container.classList.remove('hidden');
        } else {
            container.classList.add('hidden');
        }
    });
}

// Update event counts (kept for internal tracking only)
function updateCounts() {
    // Reset counts
    Object.keys(eventCounts).forEach(key => {
        eventCounts[key] = 0;
    });
    
    // Count messages
    messages.forEach(msg => {
        const parsedMessage = JSON.parse(msg.message);
        const eventType = parsedMessage.hook_event_name;
        
        if (eventCounts.hasOwnProperty(eventType)) {
            eventCounts[eventType]++;
        }
        eventCounts.all++;
    });
}

// Calculate events per minute
function updateEventsPerMinute() {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;
    
    // Filter timestamps within the last minute
    eventTimestamps = eventTimestamps.filter(ts => ts > oneMinuteAgo);
    
    // This function is kept for compatibility but doesn't update UI anymore
}

// Format timestamp
function formatTime(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
}

// Extract tool/action info
function getToolInfo(parsedMessage) {
    if (parsedMessage.tool_name) {
        return parsedMessage.tool_name.replace('mcp__', '');
    }
    if (parsedMessage.message) {
        return 'notification';
    }
    if (parsedMessage.hook_event_name === 'Stop' || parsedMessage.hook_event_name === 'SubagentStop') {
        return parsedMessage.stop_hook_active ? 'active' : 'inactive';
    }
    return '-';
}

// Extract details
function getDetails(parsedMessage) {
    if (parsedMessage.message) {
        return parsedMessage.message;
    }
    if (parsedMessage.tool_input) {
        const input = parsedMessage.tool_input;
        if (input.description) return input.description;
        if (input.command) return input.command.slice(0, 50) + '...';
        if (input.file_path) return input.file_path;
        if (input.path) return input.path;
    }
    return '-';
}

// Create expanded content based on tool type
function createExpandedContent(parsedMessage) {
    const toolName = parsedMessage.tool_name;
    const eventType = parsedMessage.hook_event_name;
    let content = '<div class="expanded-content">';
    
    // Just show the raw JSON data
    content += `<pre class="json-data">${JSON.stringify(parsedMessage, null, 2)}</pre>`;
    
    content += '</div>';
    return content;
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Create event row
function createEventRow(messageData) {
    const parsedMessage = JSON.parse(messageData.message);
    const eventType = parsedMessage.hook_event_name;
    
    const rowContainer = document.createElement('div');
    rowContainer.className = 'event-row-container';
    rowContainer.dataset.eventType = eventType;
    
    const row = document.createElement('div');
    row.className = 'event-row';
    row.dataset.eventType = eventType;
    
    const sessionId = parsedMessage.session_id || '';
    const shortSessionId = sessionId.substring(0, 7);
    
    row.innerHTML = `
        <div class="col-session">${shortSessionId}</div>
        <div class="col-time">${formatTime(messageData.timestamp)}</div>
        <div class="col-type">
            <span class="event-type ${eventType}">${eventType}</span>
        </div>
        <div class="col-tool">${getToolInfo(parsedMessage)}</div>
        <div class="col-details">${getDetails(parsedMessage)}</div>
    `;
    
    // Add click handler to expand/collapse
    row.addEventListener('click', (e) => {
        // Don't expand if clicking on a link or button
        if (e.target.tagName === 'A' || e.target.tagName === 'BUTTON') return;
        
        const isExpanded = rowContainer.classList.contains('expanded');
        
        // Collapse all other rows
        document.querySelectorAll('.event-row-container.expanded').forEach(container => {
            if (container !== rowContainer) {
                container.classList.remove('expanded');
            }
        });
        
        // Toggle current row
        if (!isExpanded) {
            // Create expanded content if not already created
            if (!rowContainer.querySelector('.expanded-content')) {
                const expandedContent = createExpandedContent(parsedMessage);
                rowContainer.insertAdjacentHTML('beforeend', expandedContent);
            }
            rowContainer.classList.add('expanded');
        } else {
            rowContainer.classList.remove('expanded');
        }
    });
    
    rowContainer.appendChild(row);
    return rowContainer;
}

// Add message
function addMessage(messageData) {
    messages.push(messageData);
    
    // Track timestamp for events/min calculation
    eventTimestamps.push(Date.now());
    
    const eventRow = createEventRow(messageData);
    eventsList.appendChild(eventRow);
    
    // Update counts
    updateCounts();
    updateEventsPerMinute();
    
    // Apply current filter
    const parsedMessage = JSON.parse(messageData.message);
    if (!activeFilters.has(parsedMessage.hook_event_name)) {
        eventRow.classList.add('hidden');
    }
    
    // Scroll to bottom
    eventsList.scrollTop = eventsList.scrollHeight;
}

// Clear all messages
function clearMessages() {
    messages = [];
    eventTimestamps = [];
    eventsList.innerHTML = `
        <div class="empty-state">
            <h3>No events recorded</h3>
            <p>Events will appear here as they occur</p>
        </div>
    `;
    updateCounts();
    updateEventsPerMinute();
}

// Update events/min every second
setInterval(updateEventsPerMinute, 1000);

// Update connection status (not used in this design, but needed for sample-data.js)
function updateConnectionStatus(connected) {
    // This design doesn't have a connection status indicator
    // Function exists for compatibility with sample-data.js
}

// Initialize
clearMessages();