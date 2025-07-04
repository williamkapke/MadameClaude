# Compact List View - Features Documentation

## Overview

The Compact List view is a streamlined, information-dense interface for
monitoring Claude Code hook events. It provides a tabular layout optimized for
scanning through many events quickly while offering powerful filtering and
inspection capabilities.

## Layout & Design

### Visual Theme

- **Dark theme** with a gradient "Claudia" title
- **Ultra-compact design** with minimal padding and spacing
- **Color-coded event types** for quick visual identification
- **Monospace fonts** for technical data (session IDs, timestamps, tool names)

### Grid Layout

The events are displayed in a 5-column grid:

1. **Session** (70px) - First 7 characters of session ID
2. **Time** (62px) - Timestamp in HH:MM:SS format
3. **Type** (100px) - Event type with color-coded badge
4. **Tool/Action** (180px) - Tool or action name
5. **Details** (remaining space) - Brief description or parameters

## Filtering Capabilities

### Session Filter

- **Location**: Text input in the Session column header
- **Function**: Filter events by session ID (partial match)
- **Use case**: Focus on a specific Claude Code session

### Type Filter Dropdown

- **Location**: Dropdown menu in the Type column header
- **Options**:
  - All Events (master toggle)
  - PreToolUse
  - PostToolUse
  - Notification
  - Stop
  - SubagentStop
- **UI**: Modern toggle switches instead of checkboxes
- **Behavior**: Click outside to close dropdown

### Tool/Action Filter

- **Location**: Text input in the Tool/Action column header
- **Function**: Filter events by tool name (partial match)
- **Use case**: Find all uses of specific tools (e.g., "Read", "Bash")

### Combined Filtering

All three filters work together - an event must match ALL active filters to be
displayed.

## Interactive Features

### Expandable Rows

- **Trigger**: Click anywhere on a row
- **Content**: Full JSON data of the event
- **Behavior**:
  - Only one row can be expanded at a time
  - Smooth expand/collapse animation
  - Click another row to switch
  - Click the same row to collapse

### Clear All Function

- **Location**: Trash icon at the far right of the Details header
- **Function**: Clears all events from the display
- **Design**: Subtle gray icon that turns red on hover

## Event Type Styling

Each event type has a distinct color for quick identification:

- **PreToolUse**: Blue (#1e40af)
- **PostToolUse**: Green (#065f46)
- **Notification**: Orange (#92400e)
- **Stop**: Red (#991b1b)
- **SubagentStop**: Purple (#6b21a8)

## Technical Details

### Data Display

- **Session IDs**: Truncated to 7 characters for space efficiency
- **Timestamps**: 24-hour format for clarity
- **Tool names**: MCP prefixes are removed (e.g., "mcp__kapture__" becomes
  "kapture__")
- **Details**: Smart extraction based on event type:
  - Commands show descriptions
  - File operations show file paths
  - Notifications show messages
  - Stop events show hook status

### Performance Optimizations

- **Minimal DOM updates**: Only visible elements are rendered
- **Efficient filtering**: Uses CSS classes for show/hide
- **Smooth animations**: Hardware-accelerated CSS transitions
- **Compact data**: No unnecessary UI elements or decorations

### Responsive Behavior

- **Full-width layout**: Maximizes horizontal space
- **Scrollable content**: Vertical scrolling for long event lists
- **Fixed headers**: Column headers stay visible while scrolling
- **Narrow columns**: Optimized widths for typical content

## Use Cases

1. **Debugging Sessions**: Use session filter to isolate a problematic
   interaction
2. **Tool Analysis**: Filter by tool name to see all operations of a specific
   type
3. **Event Flow**: View chronological sequence of events with type filtering
4. **Performance Monitoring**: Quickly scan timestamps to identify slow
   operations
5. **Error Investigation**: Filter by Notification type to see all system
   messages

## Keyboard Accessibility

- Tab navigation through filters
- Enter key to toggle dropdowns
- Standard text input for filter fields

## Future Enhancement Possibilities

- Column sorting
- Export filtered results
- Keyboard shortcuts for common filters
- Time range filtering
- Event grouping by session
- Search highlighting in expanded JSON view
