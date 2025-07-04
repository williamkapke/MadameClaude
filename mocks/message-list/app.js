// State management
let messages = [];
let activeFilter = "all";
const eventCounts = {
  all: 0,
  PreToolUse: 0,
  PostToolUse: 0,
  Notification: 0,
  Stop: 0,
  SubagentStop: 0,
};

// DOM elements
const messagesContainer = document.getElementById("messages");
const filterButtons = document.querySelectorAll(".filter-btn");

// Initialize filter buttons
filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const filter = button.dataset.filter;
    setActiveFilter(filter);
  });
});

// Set active filter
function setActiveFilter(filter) {
  activeFilter = filter;

  // Update button states
  filterButtons.forEach((btn) => {
    if (btn.dataset.filter === filter) {
      btn.classList.add("active");
    } else {
      btn.classList.remove("active");
    }
  });

  // Apply filter
  applyFilter();
}

// Apply filter to messages
function applyFilter() {
  const messageElements = document.querySelectorAll(".message-item");

  messageElements.forEach((element) => {
    const messageType = element.dataset.messageType;

    if (activeFilter === "all" || messageType === activeFilter) {
      element.classList.remove("hidden");
    } else {
      element.classList.add("hidden");
    }
  });
}

// Update event counts
function updateCounts() {
  // Reset counts
  Object.keys(eventCounts).forEach((key) => {
    eventCounts[key] = 0;
  });

  // Count messages
  messages.forEach((msg) => {
    const parsedMessage = JSON.parse(msg.message);
    const eventType = parsedMessage.hook_event_name;

    if (eventCounts.hasOwnProperty(eventType)) {
      eventCounts[eventType]++;
    }
    eventCounts.all++;
  });

  // Update UI
  Object.keys(eventCounts).forEach((key) => {
    const countElement = document.getElementById(`count-${key}`);
    if (countElement) {
      countElement.textContent = eventCounts[key];
    }
  });
}

// Format timestamp
function formatTimestamp(timestamp) {
  const date = new Date(timestamp);
  return date.toLocaleTimeString("en-US", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    millisecond: "numeric",
  });
}

// Create message element
function createMessageElement(messageData) {
  const parsedMessage = JSON.parse(messageData.message);
  const eventType = parsedMessage.hook_event_name;

  const messageDiv = document.createElement("div");
  messageDiv.className = "message-item";
  messageDiv.dataset.messageType = eventType;

  // Build message HTML
  let messageHTML = `
        <div class="message-header">
            <span class="message-type ${eventType}">${eventType}</span>
            <span class="message-timestamp">${
    formatTimestamp(messageData.timestamp)
  }</span>
        </div>
        <div class="message-content">
            <div class="message-details">
    `;

  // Add session ID
  if (parsedMessage.session_id) {
    messageHTML += `
            <div class="detail-row">
                <span class="detail-label">Session ID:</span>
                <span class="detail-value">${
      parsedMessage.session_id.slice(0, 8)
    }...</span>
            </div>
        `;
  }

  // Add tool name if present
  if (parsedMessage.tool_name) {
    messageHTML += `
            <div class="detail-row">
                <span class="detail-label">Tool:</span>
                <span class="detail-value"><span class="tool-name">${parsedMessage.tool_name}</span></span>
            </div>
        `;
  }

  // Add notification message if present
  if (parsedMessage.message) {
    messageHTML += `
            <div class="detail-row">
                <span class="detail-label">Message:</span>
                <span class="detail-value">${parsedMessage.message}</span>
            </div>
        `;
  }

  // Add tool input if present (preview only)
  if (
    parsedMessage.tool_input && Object.keys(parsedMessage.tool_input).length > 0
  ) {
    const inputPreview = JSON.stringify(parsedMessage.tool_input).slice(0, 100);
    messageHTML += `
            <div class="detail-row">
                <span class="detail-label">Input:</span>
                <span class="detail-value">${inputPreview}${
      inputPreview.length >= 100 ? "..." : ""
    }</span>
            </div>
        `;
  }

  // Add stop hook status if present
  if (parsedMessage.hasOwnProperty("stop_hook_active")) {
    messageHTML += `
            <div class="detail-row">
                <span class="detail-label">Stop Hook Active:</span>
                <span class="detail-value">${parsedMessage.stop_hook_active}</span>
            </div>
        `;
  }

  messageHTML += `
            </div>
        </div>
    `;

  messageDiv.innerHTML = messageHTML;
  return messageDiv;
}

// Add message to UI
function addMessage(messageData) {
  messages.push(messageData);
  const messageElement = createMessageElement(messageData);
  messagesContainer.appendChild(messageElement);

  // Update counts
  updateCounts();

  // Apply current filter
  if (activeFilter !== "all") {
    const parsedMessage = JSON.parse(messageData.message);
    if (parsedMessage.hook_event_name !== activeFilter) {
      messageElement.classList.add("hidden");
    }
  }

  // Scroll to bottom
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Clear all messages
function clearMessages() {
  messages = [];
  messagesContainer.innerHTML = `
        <div class="empty-state">
            <h3>No messages yet</h3>
            <p>Messages will appear here when hooks are triggered</p>
        </div>
    `;
  updateCounts();
}

// Simulate connection status
function updateConnectionStatus(connected) {
  const indicator = document.querySelector(".status-indicator");
  const statusText = document.querySelector(".status-text");

  if (connected) {
    indicator.classList.remove("disconnected");
    indicator.classList.add("connected");
    statusText.textContent = "Connected";
  } else {
    indicator.classList.remove("connected");
    indicator.classList.add("disconnected");
    statusText.textContent = "Disconnected";
  }
}

// Initialize empty state
clearMessages();
