// State management
let messages = [];
let activeFilter = 'all';
let autoScroll = true;
let sessionStartTime = null;
let uniqueTools = new Set();
let toolResponseTimes = [];

// DOM elements
const timeline = document.getElementById('timeline');
const autoScrollIcon = document.getElementById('auto-scroll-icon');

// Toggle auto-scroll
function toggleAutoScroll() {
    autoScroll = !autoScroll;
    const btn = autoScrollIcon.parentElement;
    if (autoScroll) {
        btn.classList.add('active');
    } else {
        btn.classList.remove('active');
    }
}

// Set filter
function setFilter(filter) {
    activeFilter = filter;
    
    // Update chip states
    document.querySelectorAll('.chip').forEach(chip => {
        if (chip.dataset.filter === filter) {
            chip.classList.add('active');
        } else {
            chip.classList.remove('active');
        }
    });
    
    applyFilter();
}

// Apply filter
function applyFilter() {
    const events = document.querySelectorAll('.timeline-event');
    
    events.forEach(event => {
        const eventType = event.dataset.eventType;
        
        if (activeFilter === 'all' || eventType === activeFilter) {
            event.classList.remove('hidden');
        } else {
            event.classList.add('hidden');
        }
    });
}

// Format time
function formatTime(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
}

// Format duration
function formatDuration(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
        return `${hours}:${(minutes % 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;
    }
    return `${minutes}:${(seconds % 60).toString().padStart(2, '0')}`;
}

// Update statistics
function updateStats() {
    // Total events
    document.getElementById('total-events').textContent = messages.length;
    
    // Unique tools
    document.getElementById('active-tools').textContent = uniqueTools.size;
    
    // Session duration
    if (sessionStartTime) {
        const duration = Date.now() - sessionStartTime;
        document.getElementById('session-duration').textContent = formatDuration(duration);
    }
    
    // Average response time
    if (toolResponseTimes.length > 0) {
        const avg = toolResponseTimes.reduce((a, b) => a + b, 0) / toolResponseTimes.length;
        document.getElementById('avg-response').textContent = Math.round(avg) + 'ms';
    }
}

// Create timeline event
function createTimelineEvent(messageData, previousMessage) {
    const parsedMessage = JSON.parse(messageData.message);
    const eventType = parsedMessage.hook_event_name;
    
    // Track tool usage
    if (parsedMessage.tool_name) {
        uniqueTools.add(parsedMessage.tool_name);
    }
    
    // Calculate response time for PostToolUse events
    if (eventType === 'PostToolUse' && previousMessage) {
        const prevParsed = JSON.parse(previousMessage.message);
        if (prevParsed.hook_event_name === 'PreToolUse' && 
            prevParsed.tool_name === parsedMessage.tool_name) {
            const responseTime = new Date(messageData.timestamp) - new Date(previousMessage.timestamp);
            toolResponseTimes.push(responseTime);
        }
    }
    
    const eventDiv = document.createElement('div');
    eventDiv.className = `timeline-event ${eventType}`;
    eventDiv.dataset.eventType = eventType;
    
    let bodyContent = '';
    
    // Build body content based on event type
    if (parsedMessage.tool_name) {
        bodyContent += `
            <div class="timeline-detail">
                <span class="detail-label">Tool:</span>
                <span class="detail-value">${parsedMessage.tool_name}</span>
            </div>
        `;
    }
    
    if (parsedMessage.message) {
        bodyContent += `
            <div class="timeline-detail">
                <span class="detail-label">Message:</span>
                <span class="detail-value">${parsedMessage.message}</span>
            </div>
        `;
    }
    
    if (parsedMessage.tool_input && Object.keys(parsedMessage.tool_input).length > 0) {
        const inputStr = JSON.stringify(parsedMessage.tool_input, null, 2);
        if (inputStr.length > 200) {
            bodyContent += `
                <div class="timeline-detail">
                    <span class="detail-label">Input:</span>
                    <div class="code-block">${inputStr.slice(0, 200)}...</div>
                </div>
            `;
        } else {
            bodyContent += `
                <div class="timeline-detail">
                    <span class="detail-label">Input:</span>
                    <div class="code-block">${inputStr}</div>
                </div>
            `;
        }
    }
    
    if (parsedMessage.hasOwnProperty('stop_hook_active')) {
        bodyContent += `
            <div class="timeline-detail">
                <span class="detail-label">Status:</span>
                <span class="detail-value">${parsedMessage.stop_hook_active ? 'Active' : 'Inactive'}</span>
            </div>
        `;
    }
    
    eventDiv.innerHTML = `
        <div class="timeline-dot"></div>
        <div class="timeline-card">
            <div class="timeline-header">
                <div class="timeline-title">
                    <span class="event-badge ${eventType}">${eventType}</span>
                    ${parsedMessage.tool_name ? `<span class="tool-name">${parsedMessage.tool_name.replace('mcp__', '')}</span>` : ''}
                </div>
                <span class="timeline-time">${formatTime(messageData.timestamp)}</span>
            </div>
            ${bodyContent ? `<div class="timeline-body">${bodyContent}</div>` : ''}
        </div>
    `;
    
    return eventDiv;
}

// Add message
function addMessage(messageData) {
    const previousMessage = messages[messages.length - 1];
    messages.push(messageData);
    
    // Set session start time
    if (!sessionStartTime) {
        sessionStartTime = new Date(messageData.timestamp).getTime();
    }
    
    const eventElement = createTimelineEvent(messageData, previousMessage);
    
    // Remove empty state if exists
    const emptyState = timeline.querySelector('.empty-state');
    if (emptyState) {
        emptyState.remove();
    }
    
    // Insert after timeline line
    timeline.appendChild(eventElement);
    
    // Update stats
    updateStats();
    
    // Apply current filter
    const parsedMessage = JSON.parse(messageData.message);
    if (activeFilter !== 'all' && parsedMessage.hook_event_name !== activeFilter) {
        eventElement.classList.add('hidden');
    }
    
    // Auto-scroll
    if (autoScroll) {
        timeline.parentElement.scrollTop = timeline.parentElement.scrollHeight;
    }
}

// Clear timeline
function clearTimeline() {
    messages = [];
    uniqueTools.clear();
    toolResponseTimes = [];
    sessionStartTime = null;
    
    timeline.innerHTML = `
        <div class="timeline-line"></div>
        <div class="empty-state">
            <svg class="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <circle cx="12" cy="12" r="10" stroke-width="2"/>
                <path d="M12 6v6l4 4" stroke-width="2" stroke-linecap="round"/>
            </svg>
            <h3>No events yet</h3>
            <p>Timeline events will appear here</p>
        </div>
    `;
    
    updateStats();
}

// Update connection status (not used in this design, but needed for sample-data.js)
function updateConnectionStatus(connected) {
    // This design doesn't have a connection status indicator
    // Function exists for compatibility with sample-data.js
}

// Update stats every second
setInterval(updateStats, 1000);

// Initialize
clearTimeline();
toggleAutoScroll(); // Start with auto-scroll on