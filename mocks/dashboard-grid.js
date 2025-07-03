// State management
let messages = [];
let activeFilter = 'all';
let eventChart = null;
let eventCounts = {
    PreToolUse: 0,
    PostToolUse: 0,
    Notification: 0,
    Stop: 0,
    SubagentStop: 0
};
let toolUsage = {};
let eventTimestamps = [];

// Colors for event types
const eventColors = {
    PreToolUse: '#3b82f6',
    PostToolUse: '#10b981',
    Notification: '#f59e0b',
    Stop: '#ef4444',
    SubagentStop: '#8b5cf6'
};

// Initialize Chart.js
function initChart() {
    const ctx = document.getElementById('event-chart').getContext('2d');
    eventChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: Object.keys(eventCounts),
            datasets: [{
                data: Object.values(eventCounts),
                backgroundColor: Object.values(eventColors),
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    });
    
    // Create custom legend
    updateLegend();
}

// Update legend
function updateLegend() {
    const legendContainer = document.getElementById('event-legend');
    legendContainer.innerHTML = '';
    
    Object.entries(eventCounts).forEach(([type, count]) => {
        if (count > 0) {
            const item = document.createElement('div');
            item.className = 'legend-item';
            item.innerHTML = `
                <div class="legend-color" style="background: ${eventColors[type]}"></div>
                <span>${type} (${count})</span>
            `;
            legendContainer.appendChild(item);
        }
    });
}

// Update chart
function updateChart() {
    eventChart.data.datasets[0].data = Object.values(eventCounts);
    eventChart.update();
    updateLegend();
}

// Set filter
function setFilter(filter) {
    activeFilter = filter;
    
    // Update button states
    document.querySelectorAll('.filter-btn').forEach(btn => {
        if (btn.dataset.filter === filter) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
    
    // Apply filter to activity items
    document.querySelectorAll('.activity-item').forEach(item => {
        const eventType = item.dataset.eventType;
        if (filter === 'all' || eventType === filter) {
            item.classList.remove('hidden');
        } else {
            item.classList.add('hidden');
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

// Update metrics
function updateMetrics() {
    // Total events
    document.getElementById('total-events').textContent = messages.length;
    
    // Active tools
    document.getElementById('active-tools').textContent = Object.keys(toolUsage).length;
    
    // Events per minute
    const now = Date.now();
    const oneMinuteAgo = now - 60000;
    eventTimestamps = eventTimestamps.filter(ts => ts > oneMinuteAgo);
    document.getElementById('event-rate').textContent = eventTimestamps.length;
    
    // Notifications
    document.getElementById('notifications').textContent = eventCounts.Notification;
}

// Update tool usage
function updateToolUsage() {
    const toolsList = document.getElementById('tools-list');
    toolsList.innerHTML = '';
    
    // Sort tools by usage
    const sortedTools = Object.entries(toolUsage)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10); // Top 10
    
    if (sortedTools.length === 0) {
        toolsList.innerHTML = '<div class="empty-state">No tool usage yet</div>';
        return;
    }
    
    const maxCount = sortedTools[0][1];
    
    sortedTools.forEach(([tool, count]) => {
        const item = document.createElement('div');
        item.className = 'tool-item';
        item.innerHTML = `
            <span class="tool-name">${tool.replace('mcp__', '')}</span>
            <div class="tool-count">
                <div class="tool-bar">
                    <div class="tool-bar-fill" style="width: ${(count / maxCount) * 100}%"></div>
                </div>
                <span class="tool-number">${count}</span>
            </div>
        `;
        toolsList.appendChild(item);
    });
}

// Create activity item
function createActivityItem(messageData) {
    const parsedMessage = JSON.parse(messageData.message);
    const eventType = parsedMessage.hook_event_name;
    
    const item = document.createElement('div');
    item.className = 'activity-item';
    item.dataset.eventType = eventType;
    
    let detail = '';
    if (parsedMessage.tool_name) {
        detail = parsedMessage.tool_name.replace('mcp__', '');
    } else if (parsedMessage.message) {
        detail = parsedMessage.message;
    } else if (eventType === 'Stop' || eventType === 'SubagentStop') {
        detail = `Hook ${parsedMessage.stop_hook_active ? 'active' : 'inactive'}`;
    }
    
    item.innerHTML = `
        <div class="activity-icon ${eventType}"></div>
        <div class="activity-content">
            <div class="activity-type">${eventType}</div>
            <div class="activity-detail">${detail}</div>
        </div>
        <div class="activity-time">${formatTime(messageData.timestamp)}</div>
    `;
    
    return item;
}

// Add message
function addMessage(messageData) {
    messages.push(messageData);
    eventTimestamps.push(Date.now());
    
    const parsedMessage = JSON.parse(messageData.message);
    const eventType = parsedMessage.hook_event_name;
    
    // Update event counts
    if (eventCounts.hasOwnProperty(eventType)) {
        eventCounts[eventType]++;
    }
    
    // Update tool usage
    if (parsedMessage.tool_name) {
        toolUsage[parsedMessage.tool_name] = (toolUsage[parsedMessage.tool_name] || 0) + 1;
    }
    
    // Add to activity feed
    const activityList = document.getElementById('activity-list');
    const activityItem = createActivityItem(messageData);
    
    // Remove empty state if exists
    const emptyState = activityList.querySelector('.empty-state');
    if (emptyState) {
        emptyState.remove();
    }
    
    // Insert at the beginning
    activityList.insertBefore(activityItem, activityList.firstChild);
    
    // Keep only last 50 items
    while (activityList.children.length > 50) {
        activityList.removeChild(activityList.lastChild);
    }
    
    // Apply filter
    if (activeFilter !== 'all' && eventType !== activeFilter) {
        activityItem.classList.add('hidden');
    }
    
    // Update UI
    updateChart();
    updateMetrics();
    updateToolUsage();
}

// Refresh dashboard
function refreshDashboard() {
    // Clear all data
    messages = [];
    eventCounts = {
        PreToolUse: 0,
        PostToolUse: 0,
        Notification: 0,
        Stop: 0,
        SubagentStop: 0
    };
    toolUsage = {};
    eventTimestamps = [];
    
    // Clear UI
    document.getElementById('activity-list').innerHTML = '<div class="empty-state">No activity yet</div>';
    updateChart();
    updateMetrics();
    updateToolUsage();
}

// Update connection status (not used in this design, but needed for sample-data.js)
function updateConnectionStatus(connected) {
    // This design doesn't have a connection status indicator
    // Function exists for compatibility with sample-data.js
}

// Update metrics every second
setInterval(updateMetrics, 1000);

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    initChart();
    refreshDashboard();
});