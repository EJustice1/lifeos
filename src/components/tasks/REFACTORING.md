# Task Form Refactoring

## Overview

The task form system has been refactored to use a common base component for shared functionality, making the codebase more maintainable and consistent.

## Architecture

### Before Refactoring

```
TaskFormModal
├─ Inline form fields (160+ lines)
├─ Direct useProjects hook
├─ Duplicate field styling
└─ Mixed concerns (UI + logic)
```

### After Refactoring

```
TaskFormModal
├─ TaskFormFields (reusable component)
│   ├─ All form field UI
│   ├─ Consistent styling
│   ├─ Project loading state
│   └─ Self-contained logic
└─ Modal-specific logic (actions, delete, etc.)
```

## Components

### 1. TaskFormFields Component

**Location:** `/src/components/tasks/TaskFormFields.tsx`

**Purpose:** Common base component for all task form fields

**Features:**
- ✅ Consistent styling across all forms
- ✅ Self-contained field logic
- ✅ Handles project loading state
- ✅ Configurable (showAllFields, autoFocus)
- ✅ Type-safe props
- ✅ Reusable in any form context

**Props:**
```typescript
interface TaskFormFieldsProps {
  // Form state
  title: string
  description: string
  projectId: string
  scheduledDate: string
  scheduledTime: string
  durationMinutes: number | ''
  priority: number
  tags: string

  // Form handlers
  onTitleChange: (value: string) => void
  onDescriptionChange: (value: string) => void
  onProjectIdChange: (value: string) => void
  onScheduledDateChange: (value: string) => void
  onScheduledTimeChange: (value: string) => void
  onDurationMinutesChange: (value: number | '') => void
  onPriorityChange: (value: number) => void
  onTagsChange: (value: string) => void

  // Optional config
  autoFocus?: boolean
  showAllFields?: boolean
}
```

**Usage Example:**
```tsx
<TaskFormFields
  title={title}
  description={description}
  projectId={projectId}
  scheduledDate={scheduledDate}
  scheduledTime={scheduledTime}
  durationMinutes={durationMinutes}
  priority={priority}
  tags={tags}
  onTitleChange={setTitle}
  onDescriptionChange={setDescription}
  onProjectIdChange={setProjectId}
  onScheduledDateChange={setScheduledDate}
  onScheduledTimeChange={setScheduledTime}
  onDurationMinutesChange={setDurationMinutes}
  onPriorityChange={setPriority}
  onTagsChange={setTags}
/>
```

### 2. TaskFormModal (Refactored)

**Location:** `/src/components/modals/TaskFormModal.tsx`

**New Button Structure for Editing:**

When editing a task, users now have three clear action buttons:

1. **"Save"** (emerald, full width, primary)
   - Saves all changes
   - Keeps task in current location (today/backlog)
   - Most common action

2. **"Move to Backlog"** (purple, half width)
   - Saves changes AND moves to backlog
   - Clears scheduled date
   - Sets status to 'backlog'

3. **"Move to Today"** (emerald/green, half width)
   - Saves changes AND moves to today
   - Sets scheduled date to today
   - Sets status to 'today'

**Visual Layout:**
```
┌──────────────────────────────────┐
│ [Delete Task]                     │ (if editing)
├──────────────────────────────────┤
│          Save                     │ (emerald, primary)
├──────────────────────────────────┤
│  Move to Backlog │ Move to Today │ (purple) │ (green)
└──────────────────────────────────┘
```

**New Form Submit Logic:**

```typescript
const handleSubmit = async (e: React.FormEvent, targetStatus?: 'today' | 'backlog' | 'keep') => {
  // 'today'   - moves to today with today's date
  // 'backlog' - moves to backlog, clears date
  // 'keep'    - saves changes, keeps current status
  // undefined - for new tasks, determines from scheduled date
}
```

## Benefits

### 1. Code Reusability
- TaskFormFields can be used in any form context
- No duplication of field styling or logic
- Easy to create new forms (quick add, inline edit, etc.)

### 2. Consistency
- All task forms use identical field styling
- Unified user experience
- Single source of truth for form behavior

### 3. Maintainability
- Changes to field styling happen in one place
- Clear separation of concerns
- Easier to test and debug

### 4. Reduced Complexity
- TaskFormModal went from ~400 lines to ~290 lines
- Form fields extracted to dedicated component
- Easier to understand and modify

### 5. Better UX
- Clear action buttons with distinct purposes
- "Save" button is prominent for common use case
- Move actions are secondary but accessible

## Future Possibilities

With this architecture, we can now easily create:

1. **Quick Add Modal** - Minimal fields, fast entry
```tsx
<TaskFormFields showAllFields={false} />
```

2. **Inline Task Editor** - Edit task details in place
```tsx
<div className="inline-task-editor">
  <TaskFormFields />
  <button>Save</button>
</div>
```

3. **Bulk Edit Form** - Edit multiple tasks at once
```tsx
<TaskFormFields showAllFields={false} />
{/* Apply to selected tasks */}
```

4. **Template Creator** - Save task templates
```tsx
<TaskFormFields />
<button>Save as Template</button>
```

## Migration Notes

### For Developers

If you need to create a new task form:

1. Use `TaskFormFields` for the form fields
2. Add your custom logic (submit, validation, etc.)
3. Style your action buttons
4. Done! ✨

### Example: Creating a Quick Add Form

```tsx
function QuickAddTask() {
  const [title, setTitle] = useState('')
  const { createTask } = useTasks()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await createTask({ title })
  }

  return (
    <form onSubmit={handleSubmit}>
      <TaskFormFields
        title={title}
        onTitleChange={setTitle}
        showAllFields={false}  // Only show title field
      />
      <button type="submit">Add Task</button>
    </form>
  )
}
```

## Testing Checklist

- [x] Save button keeps current status
- [x] Move to Backlog clears date and moves to backlog
- [x] Move to Today sets today's date and moves to today
- [x] Delete still works as expected
- [x] Create new task still works
- [x] All fields prefill correctly when editing
- [x] Project dropdown loads correctly
- [x] Priority buttons work
- [x] Tags parse correctly

## Related Documentation

- [TaskCard Component](./README.md)
- [Task Management Architecture](../../../docs/architecture/tasks.md)
