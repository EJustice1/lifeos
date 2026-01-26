 /plan 
  ⎿  Current Plan
     /Users/ejustice/.claude/plans/compiled-coalescing-whistle.md
     
     # LifeOS Editorial Design Language Transformation
     
     ## Vision
     
     Transform LifeOS from a card-based UI into a bold, editorial/magazine-style
     design system inspired by Stripe and Notion. Eliminate all cards, introduce
     asymmetric layouts, create informative color usage, and establish a unified
     design language across 85+ components.
     
     **Style:** Editorial/Magazine with bold typography, generous spacing, asymmetric
      content blocks
     **Scope:** Design language only (performance fixes are separate)
     **Approach:** Bold transformation with unified responsive system
     
     ## Current State
     
     ### Problems Identified
     - **5 card types** across codebase: LifeGoalCard, ProjectCard, TaskCard,
     CalendarEventCard, MobileCard
     - **192 instances** of `bg-zinc-800/900` card patterns
     - **Status badge logic duplicated** in 4+ files (TaskCard, TaskListItem,
     LifeGoalCard, ProjectCard)
     - **Duplicate forms**: TaskFormModal (294 lines) + tasks/new/page.tsx (243
     lines) = 537 lines duplicated
     - **Inconsistent buttons**: PrimaryButton vs inline buttons across views
     - **Design split**: Mobile uses CSS variables, desktop uses direct Tailwind
     classes
     - **No asymmetric layouts**: Everything is symmetric, centered, or conventional
     grid
     
     ### What Works (Keep)
     - **Informative color semantics**: emerald=success, blue=primary,
     purple=backlog, yellow=warning, red=danger
     - **Category colors**: health, career, relationships, finance, personal
     - **Spacing scale**: 4px/8px/12px/16px/24px mostly consistent
     - **Dark-first design**: zinc-950 background, good foundation
     
     ## Design System Foundation
     
     ### 1. Typography Scale (Editorial Hierarchy)
     
     Add to `src/app/globals.css`:
     
     ```css
     :root {
       /* Display - Hero sections (tight leading) */
       --font-display: system-ui, -apple-system, sans-serif;
     
       /* Mono - Data, metrics, timers */
       --font-mono: "SF Mono", "Monaco", "Inconsolata", monospace;
     }
     
     /* Editorial Type Scale */
     :root {
       /* Display - Large feature headings */
       --text-display-lg: 3rem;         /* 48px */
       --text-display-md: 2.25rem;      /* 36px */
     
       /* Headline - Page/section headers */
       --text-headline-lg: 1.875rem;    /* 30px */
       --text-headline-md: 1.5rem;      /* 24px */
     
       /* Title - Component titles */
       --text-title-lg: 1.25rem;        /* 20px */
       --text-title-md: 1.125rem;       /* 18px */
     
       /* Body - Content */
       --text-body-lg: 1.125rem;        /* 18px */
       --text-body-md: 1rem;            /* 16px */
       --text-body-sm: 0.875rem;        /* 14px */
     
       /* Label - UI metadata */
       --text-label-md: 0.8125rem;      /* 13px */
       --text-label-sm: 0.75rem;        /* 12px */
     }
     ```
     
     Extend `tailwind.config.ts`:
     
     ```typescript
     fontSize: {
       'display-lg': ['3rem', { lineHeight: '1.1', letterSpacing: '-0.025em' }],
       'headline-lg': ['1.875rem', { lineHeight: '1.25', letterSpacing: '-0.025em'
     }],
       'headline-md': ['1.5rem', { lineHeight: '1.25' }],
       'title-lg': ['1.25rem', { lineHeight: '1.25' }],
       'title-md': ['1.125rem', { lineHeight: '1.25' }],
       'body-lg': ['1.125rem', { lineHeight: '1.625' }],
       'body-md': ['1rem', { lineHeight: '1.5' }],
       'body-sm': ['0.875rem', { lineHeight: '1.5' }],
       'label-md': ['0.8125rem', { lineHeight: '1.5' }],
       'label-sm': ['0.75rem', { lineHeight: '1.5', letterSpacing: '0.025em' }],
     }
     ```
     
     ### 2. Color System (Informative)
     
     Add to `globals.css`:
     
     ```css
     :root {
       /* Status Colors (keep existing semantics) */
       --color-success-bg: rgba(16, 185, 129, 0.1);
       --color-success-border: rgba(16, 185, 129, 0.3);
       --color-success-text: #34d399;
       --color-success-solid: #10b981;
     
       --color-primary-bg: rgba(59, 130, 246, 0.1);
       --color-primary-border: rgba(59, 130, 246, 0.3);
       --color-primary-text: #60a5fa;
       --color-primary-solid: #3b82f6;
     
       /* Similar for warning, danger, backlog */
     
       /* Category Colors */
       --color-health: #34d399;
       --color-career: #60a5fa;
       --color-relationships: #f9a8d4;
       --color-finance: #fbbf24;
       --color-personal: #c084fc;
     }
     ```
     
     **Usage Rules:**
     - Use color for status/category (informative)
     - Accent borders (3px left border) for hierarchy
     - Subtle backgrounds (10% opacity) for grouping
     - No decorative color
     
     ### 3. Spacing System
     
     ```css
     :root {
       --space-section: 4rem;    /* Between major sections */
       --space-block: 2rem;      /* Between content blocks */
       --space-item: 1rem;       /* Between list items */
       --space-inline: 0.75rem;  /* Inline elements */
     }
     ```
     
     ## Component Architecture
     
     ### Primitive Components (New)
     
     Create in `/src/components/editorial/`:
     
     #### 1. **Section.tsx** - Top-level container
     ```tsx
     interface SectionProps {
       children: React.ReactNode
       spacing?: 'compact' | 'normal' | 'spacious'
     }
     // No background, relies on spacing
     ```
     
     #### 2. **Panel.tsx** - Structured content block
     ```tsx
     interface PanelProps {
       children: React.ReactNode
       variant?: 'default' | 'elevated' | 'bordered'
       accent?: 'left' | 'top' | 'none'
       accentColor?: string
     }
     // Optional left accent border (3px)
     // Subtle bg for elevated variant only
     ```
     
     #### 3. **ContentBlock.tsx** - Asymmetric layouts
     ```tsx
     interface ContentBlockProps {
       layout?: 'default' | 'split-left' | 'split-right' | 'stacked'
       primary: React.ReactNode
       secondary?: React.ReactNode
     }
     // split-left: 40%/60% (metadata left, content right)
     // split-right: 60%/40% (content left, metadata right)
     ```
     
     #### 4. **ListItem.tsx** - Replace TaskCard/TaskListItem
     ```tsx
     interface ListItemProps {
       title: string
       description?: string
       metadata?: React.ReactNode
       actions?: React.ReactNode
       status?: 'active' | 'today' | 'backlog' | 'completed' | 'cancelled'
       interactive?: boolean
       onClick?: () => void
     }
     // Border-bottom separator
     // Status accent via border-left
     // Hover state for interactive
     ```
     
     #### 5. **StatusBadge.tsx** - Unified status indicators
     ```tsx
     interface StatusBadgeProps {
       status: 'active' | 'today' | 'backlog' | 'completed' | 'cancelled' |
     'in_progress'
       size?: 'sm' | 'md'
       variant?: 'subtle' | 'solid'
     }
     // Replace duplicated status logic
     // Subtle: bg-${color}-500/20 text-${color}-400
     ```
     
     #### 6. **CollapsibleSection.tsx** - Replace collapsible cards
     ```tsx
     interface CollapsibleSectionProps {
       title: string
       badge?: string | number
       children: React.ReactNode
       defaultExpanded?: boolean
     }
     // Clean header with chevron
     // No card container
     ```
     
     #### 7. **Divider.tsx** - Section breaks
     ```tsx
     interface DividerProps {
       spacing?: 'compact' | 'normal' | 'spacious'
       label?: string
     }
     // Horizontal line, optional label
     ```
     
     ### Composite Components (New)
     
     #### 8. **DataGrid.tsx** - Metric display
     ```tsx
     interface DataGridProps {
       metrics: Array<{
         label: string
         value: string | number
         trend?: 'up' | 'down' | 'neutral'
         color?: string
       }>
       columns?: 2 | 3 | 4
       layout?: 'balanced' | 'emphasized'
     }
     // Replace dashboard stats
     ```
     
     #### 9. **Timeline.tsx** - Chronological display
     ```tsx
     interface TimelineProps {
       items: Array<{
         time?: string
         title: string
         description?: string
         status?: string
         actions?: React.ReactNode
       }>
       variant?: 'default' | 'compact'
     }
     // Left-aligned times, vertical line
     ```
     
     ## Implementation Plan
     
     ### Phase 1: Foundation (Week 1)
     
     **Goal:** Build design system without breaking existing UI
     
     **Tasks:**
     
     1. **Update globals.css** (`src/app/globals.css`)
        - Add editorial typography variables
        - Add color system tokens
        - Add spacing tokens
        - Keep existing mobile tokens
     
     2. **Update tailwind.config.ts**
        - Extend with editorial fontSize scale
        - Add custom spacing if needed
     
     3. **Create primitive components** (`src/components/editorial/`)
        - `Section.tsx`
        - `Panel.tsx`
        - `ContentBlock.tsx`
        - `ListItem.tsx`
        - `StatusBadge.tsx`
        - `CollapsibleSection.tsx`
        - `Divider.tsx`
        - `index.ts` (barrel export)
     
     4. **Create composite components**
        - `DataGrid.tsx`
        - `Timeline.tsx`
     
     5. **Validation:** Test components in isolation, ensure responsive behavior
     
     ### Phase 2: Core Views (Week 2)
     
     **Goal:** Transform high-traffic task management views
     
     **Priority 1: TodayView** (`src/components/focus/TodayView.tsx` - 305 lines)
     - Replace calendar event cards (line 88) → Timeline items
     - Replace active task cards (line 249) → ListItem components
     - Replace completed task cards (line 135) → ListItem with completed styling
     - Keep swipeable actions behind ListItem
     - Use StatusBadge for linked domains
     - **Expected: ~200 lines after transformation**
     
     **Priority 2: TaskCard** (`src/components/day-view/TaskCard.tsx` - 151 lines)
     - Migrate to use ListItem primitive
     - Move status logic (lines 128-143) to StatusBadge component
     - Keep border-left accent for project color
     - Preserve completion toggle functionality
     - **Expected: ~80 lines after transformation**
     
     **Priority 3: LifeGoalCard** (`src/components/strategy/LifeGoalCard.tsx` - 127
     lines)
     - Replace card wrapper (line 44) → CollapsibleSection
     - Add category accent border (3px left)
     - Use ContentBlock for asymmetric header layout (title left, stats right)
     - Remove nested project cards → Clean project list
     - Use StatusBadge for category/status (replace lines 17-35)
     - **Expected: ~90 lines after transformation**
     
     **Priority 4: ProjectCard** (`src/components/strategy/ProjectCard.tsx` - likely
     ~120 lines)
     - Replace card → CollapsibleSection with project color accent
     - Clean header, no nested cards
     - Use ListItem for tasks inside
     - **Expected: ~70 lines**
     
     **Priority 5: TaskListItem** (`src/components/strategy/TaskListItem.tsx` - 119
     lines)
     - Migrate to use ListItem primitive
     - Use StatusBadge component
     - **Expected: ~50 lines (mostly logic)**
     
     **Validation:**
     - Task flows work correctly
     - Status colors are clear
     - Touch targets ≥44px on mobile
     - Swipe gestures preserved
     
     ### Phase 3: Dashboard & Forms (Week 3)
     
     **Goal:** Transform dashboards and consolidate duplicate forms
     
     **Priority 1: BacklogView** (`src/components/focus/BacklogView.tsx` - 391 lines)
     - Replace project grouping cards → CollapsibleSection
     - Use ListItem for tasks
     - Remove bg-zinc-900 containers
     - **Expected: ~250 lines**
     
     **Priority 2: DayViewClient** (`src/app/DayViewClient.tsx` - 295 lines)
     - Replace summary card → DataGrid for metrics
     - Use Timeline for calendar events
     - Editorial header with bold typography
     - **Expected: ~200 lines**
     
     **Priority 3: Consolidate Task Forms**
     - Create shared `TaskForm.tsx` in `src/components/forms/`
     - Extract common logic from:
       - `src/components/modals/TaskFormModal.tsx` (294 lines)
       - `src/app/tasks/new/page.tsx` (243 lines)
     - Use editorial form styling (no card wrappers)
     - **Result: ~250 lines shared + 2×50 line wrappers**
     - **Saves: ~240 lines**
     
     **Validation:**
     - Forms work in both modal and page contexts
     - No functionality lost
     - Dashboards feel more spacious
     
     ### Phase 4: Mobile & Specialty (Week 4)
     
     **Goal:** Apply editorial style to mobile-first features
     
     **Priority 1: Gym Logger** (`src/app/m/gym/gym-logger.tsx` - 590 lines)
     - Remove MobileCard usage
     - Use Panel for structure
     - Display typography for weight/reps numbers
     - DataGrid for workout metrics
     - **Expected: ~450 lines**
     
     **Priority 2: Study Timer** (`src/app/m/study/career-tracker.tsx` - 790 lines)
     - Clean timer display (display typography)
     - Replace card layouts → editorial sections
     - **Expected: ~600 lines**
     
     **Priority 3: Daily Context Review** (`src/app/m/daily-context-review/page.tsx`
     - 255 lines)
     - Minimal step indicators
     - Full-screen editorial layout
     - Headline typography for questions
     - **Expected: ~180 lines**
     
     **Validation:**
     - Mobile interactions feel smooth
     - Touch targets maintained
     - Data-dense screens readable
     
     ### Phase 5: Polish & Cleanup (Week 5)
     
     **Goal:** Complete migration and ensure consistency
     
     1. **Remove legacy components**
        - Delete `src/components/mobile/cards/MobileCard.tsx`
        - Find/replace all MobileCard usages
     
     2. **Status badge audit**
        - Replace all inline status logic with StatusBadge component
        - Files to check: All views, modals, lists
     
     3. **Typography audit**
        - Replace `text-xl`, `text-2xl`, etc. with editorial scale
        - Check all 85+ TSX files
     
     4. **Color audit**
        - Ensure all color is informative, not decorative
        - Remove decorative backgrounds
     
     5. **Spacing audit**
        - Use design token spacing consistently
        - Check mobile spacing
     
     6. **Accessibility check**
        - Heading hierarchy (h1 → h6)
        - Keyboard navigation
        - Color contrast ratios
        - ARIA labels
     
     ## Layout Patterns
     
     ### Asymmetric Grid Templates
     
     **Pattern 1: Metadata Left, Content Right (1/3 - 2/3)**
     ```tsx
     <div className="grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-8 lg:gap-12">
       <div>{/* Metadata */}</div>
       <div>{/* Primary content */}</div>
     </div>
     ```
     
     **Pattern 2: Content Left, Actions Right (2/3 - 1/3)**
     ```tsx
     <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-8">
       <div>{/* Main content */}</div>
       <div>{/* Sidebar */}</div>
     </div>
     ```
     
     **Pattern 3: Stacked Mobile, Asymmetric Desktop**
     ```tsx
     <ContentBlock layout="split-right">
       <div>{/* Primary */}</div>
       <div>{/* Secondary */}</div>
     </ContentBlock>
     ```
     
     ## Example Transformations
     
     ### Before: LifeGoalCard (127 lines with cards)
     
     ```tsx
     <div className="bg-zinc-900 rounded-lg border border-zinc-800">
       <button className="w-full p-4 hover:bg-zinc-850">
         <div className="flex items-start gap-3">
           <div className="flex-1">
             <span className="px-2 py-1 rounded bg-emerald-500/20 text-emerald-400">
               health
             </span>
             <h2 className="text-xl font-bold">{goal.title}</h2>
             {/* ... */}
           </div>
         </div>
       </button>
       {expanded && <div className="px-4 pb-4">{/* Projects */}</div>}
     </div>
     ```
     
     ### After: Editorial Goal Section (~90 lines)
     
     ```tsx
     <CollapsibleSection title={goal.title} badge={`${totalTasks} tasks`}>
       <div className="border-l-[3px] border-emerald-400 pl-6 space-y-6">
         <ContentBlock layout="split-right">
           <div>
             <div className="flex gap-3 mb-3">
               <StatusBadge status={goal.category} size="sm" />
               <StatusBadge status={goal.status} size="sm" />
             </div>
             <p className="text-body-md text-zinc-300 leading-relaxed">
               {goal.description}
             </p>
           </div>
           <DataGrid
             metrics={[
               { label: 'Projects', value: projects.length },
               { label: 'Tasks', value: totalTasks },
               { label: 'Progress', value: `${progress}%`, color: 'emerald' },
             ]}
             columns={1}
           />
         </ContentBlock>
     
         <Divider spacing="normal" />
     
         <div className="space-y-4">
           {projects.map(project => (
             <ProjectSection key={project.id} project={project} />
           ))}
         </div>
       </div>
     </CollapsibleSection>
     ```
     
     **Key Changes:**
     - Card → CollapsibleSection with accent border
     - Inline badges → StatusBadge component
     - Symmetric → Asymmetric ContentBlock
     - Progress bar → DataGrid metrics
     - Nested cards → Clean list
     
     ## Critical Files
     
     ### Must Modify
     
     1. **`src/app/globals.css`** (56 lines) - Add design tokens
     2. **`tailwind.config.ts`** - Extend typography scale
     3. **`src/components/editorial/`** (NEW) - All primitives
     4. **`src/components/focus/TodayView.tsx`** (305 lines) - Highest traffic
     5. **`src/components/strategy/LifeGoalCard.tsx`** (127 lines) - Complex
     hierarchy
     6. **`src/components/day-view/TaskCard.tsx`** (151 lines) - Used everywhere
     7. **`src/app/DayViewClient.tsx`** (295 lines) - Dashboard pattern
     8. **`src/app/m/gym/gym-logger.tsx`** (590 lines) - Mobile stress test
     
     ### Will Impact
     
     - 85+ TSX component files
     - All views using cards (majority of app)
     - All status badge logic (4+ duplicates)
     - All task forms (2 duplicates to consolidate)
     
     ## Success Metrics
     
     ### Quantitative
     - **Code reduction**: 20-30% in component code
     - **Card elimination**: 192 instances → 0
     - **Status badges**: 4+ duplicates → 1 component
     - **Typography**: 100% editorial scale usage
     - **Form consolidation**: 537 lines → ~350 lines
     
     ### Qualitative
     - Clear visual hierarchy through typography
     - Scannable task lists and dashboards
     - Professional, polished feel
     - Information density without cramping
     - Every color conveys meaning
     
     ## Technical Considerations
     
     ### Performance
     - Use `React.memo` for ListItem, Panel components
     - Preserve existing optimistic updates in contexts
     - Maintain current Lighthouse scores
     
     ### Accessibility
     - Proper h1→h6 hierarchy with editorial typography
     - Visible focus rings (interactive elements)
     - 4.5:1 contrast for body text
     - 44×44px touch targets on mobile
     - ARIA labels for status badges
     
     ### Mobile Responsiveness
     - Asymmetric layouts stack on mobile
     - Typography scales appropriately
     - Preserve swipe gestures (TodayView, BacklogView)
     - Touch-optimized interactive elements
     
     ### Backward Compatibility
     - Keep existing mobile CSS variables during transition
     - Gradual migration, one component at a time
     - Test each phase before proceeding
     

  Todos
  ☒ Phase 2: All core views transformed
  ☒ Phase 3: Transform BacklogView to editorial design
  ☐ Phase 3: Transform DayViewClient dashboard
  ☒ Phase 3: Skip form consolidation (defer to future)
  ☐ Phase 4: Transform actions page
  ☐ Phase 4: Update remaining mobile views typography
  ☐ Phase 5: Remove MobileCard component
  ☐ Phase 5: Run final typography audit
  ☐ Phase 5: Final build test
