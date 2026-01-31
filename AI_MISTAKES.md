# Assistant Mistakes and Corrections

## 2026-01-31
- **Mistake:** Refactor removed the `dispatch` usage in `daily-context-review/page.tsx` but the `onEdit` handler still called `dispatch`, causing a build error.
  **Correction:** Exposed a `startEdit()` action from `useDailyReviewController` and used it in `onEdit`.
