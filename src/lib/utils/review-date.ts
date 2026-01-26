// Helper function to get the review date based on 9am cutoff
// If it's before 9am, return yesterday's date, otherwise return today's date
export function getReviewDate(): string {
  const now = new Date()
  const hour = now.getHours()
  
  // If before 9am, use yesterday's date
  if (hour < 9) {
    const yesterday = new Date(now)
    yesterday.setDate(yesterday.getDate() - 1)
    return yesterday.toISOString().split('T')[0]
  }
  
  // Otherwise use today's date
  return now.toISOString().split('T')[0]
}
