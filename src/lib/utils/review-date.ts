// Helper function to convert a Date to YYYY-MM-DD string in local timezone
export function toLocalDateString(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  
  return `${year}-${month}-${day}`
}

// Helper function to get today's date in local timezone
export function getTodayLocal(): string {
  return toLocalDateString(new Date())
}

// Helper function to get the review date based on configurable cutoff hour
// Always returns the current calendar date in local timezone
export function getReviewDate(cutoffHour: number = 9): string {
  return getTodayLocal()
}
