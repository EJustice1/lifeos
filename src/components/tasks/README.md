# TaskCard Component

## Overview

The `TaskCard` is a universal, self-contained component for displaying and interacting with tasks throughout the application. It encapsulates all task-related functionality and UI logic in one place.

## Key Features

### 🎨 Self-Contained
- Manages its own modals (edit, domain launch)
- Handles all user interactions internally
- Automatically fetches project data for styling
- No need for parent components to manage modal state

### 🎯 Automatic Project Colors
- Fetches project color automatically via `useProjects()`
- Applies color to borders, backgrounds, text, and metadata
- Falls back to default blue (`#3b82f6`) for tasks without projects

### 🔄 Full Interaction Support
- **Checkbox**: Toggle task completion (with haptic feedback)
- **Click**: Opens edit modal (or domain launch modal if linked)
- **Edit Button**: Always opens edit modal
- **Domain Launch**: Automatically detects and handles gym/study tasks

### 📱 Variant System
Three display variants adapt to different contexts:

1. **`today`** - Full-size cards with completion highlighting
2. **`backlog`** - Compact cards optimized for list views
3. **`default`** - Standard styling for general use

## Usage

### Basic Example
```tsx
import { TaskCard } from '@/components/tasks/TaskCard'

function MyTaskList({ tasks }) {
  return (
    <div>
      {tasks.map(task => (
        <TaskCard 
          key={task.id} 
          task={task} 
          variant="today" 
        />
      ))}
    </div>
  )
}
```

### With Options
```tsx
<TaskCard
  task={task}
  variant="backlog"
  showCheckbox={false}      // Hide completion checkbox
  showEditButton={false}    // Hide edit button
  onTaskUpdate={() => {     // Optional callback after updates
    console.log('Task updated!')
  }}
/>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `task` | `Task` | *required* | The task object to display |
| `variant` | `'today' \| 'backlog' \| 'default'` | `'default'` | Visual style variant |
| `showCheckbox` | `boolean` | `true` | Show completion checkbox |
| `showEditButton` | `boolean` | `true` | Show edit button |
| `onTaskUpdate` | `() => void` | `undefined` | Callback after task changes |

## Variants

### Today Variant
```tsx
<TaskCard task={task} variant="today" />
```
- Large text (2xl title)
- 4px colored border
- Colored background tint
- Completion strikethrough styling
- Full metadata display

### Backlog Variant
```tsx
<TaskCard task={task} variant="backlog" />
```
- Compact text (lg title)
- Smaller checkbox (6x6)
- No left border or background
- Optimized for dense lists

### Default Variant
```tsx
<TaskCard task={task} variant="default" />
```
- Standard styling similar to 'today'
- Good for general-purpose use

## Styling System

### Project Colors
The component automatically applies the project's color to:
- Left border (today/default variants)
- Background tint (today/default variants)
- Checkbox border
- Time/duration text
- Tags
- Edit button icon

### Completion States
When a task is completed:
- Checkbox turns emerald green
- Title gets strikethrough
- Colors fade to gray
- Opacity reduced (today variant)

## Architecture Benefits

### Before (Old System)
```tsx
// Parent component had to manage:
const [taskToEdit, setTaskToEdit] = useState(null)
const [domainModal, setDomainModal] = useState(null)
const { projects } = useProjects()
const projectColor = projects.find(p => p.id === task.project_id)?.color

// Repetitive code in every parent
<TaskCard 
  task={task}
  projectColor={projectColor}
  onEdit={setTaskToEdit}
  onToggleComplete={handleToggle}
/>
<TaskFormModal isOpen={!!taskToEdit} ... />
<DomainLaunchModal isOpen={!!domainModal} ... />
```

### After (New System)
```tsx
// Parent component just renders:
<TaskCard task={task} variant="today" />
// Everything else is handled internally! ✨
```

## Migration Guide

### Old TodayView Pattern
```tsx
// ❌ OLD - Lots of boilerplate
{tasks.map(task => {
  const project = projects.find(p => p.id === task.project_id)
  const projectColor = project?.color || '#3b82f6'
  
  return (
    <TaskCard
      task={task}
      projectColor={projectColor}
      onToggleComplete={handleToggle}
      onEdit={setTaskToEdit}
      onTap={handleTap}
    />
  )
})}
```

```tsx
// ✅ NEW - Clean and simple
{tasks.map(task => (
  <TaskCard key={task.id} task={task} variant="today" />
))}
```

## Future Enhancements

Possible additions for future versions:
- Drag-and-drop support
- Keyboard navigation
- Accessibility improvements (ARIA labels)
- Animation variants
- Custom action buttons
- Bulk selection mode

## Related Components

- `TaskFormModal` - Edit task details
- `DomainLaunchModal` - Launch domain-specific actions
- `TodayView` - Uses TaskCard with `variant="today"`
- `BacklogView` - Uses TaskCard with `variant="backlog"`
