// Helper function to get the review date based on configurable cutoff hour
// If it's before the cutoff hour, return yesterday's date, otherwise return today's date
export function getReviewDate(cutoffHour: number = 9): string {
  const now = new Date()
  const hour = now.getHours()
  
  // If before cutoff hour, use yesterday's date
  if (hour < cutoffHour) {
    const yesterday = new Date(now)
    yesterday.setDate(yesterday.getDate() - 1)
    return yesterday.toISOString().split('T')[0]
  }
  
  // Otherwise use today's date
  return now.toISOString().split('T')[0]
}
