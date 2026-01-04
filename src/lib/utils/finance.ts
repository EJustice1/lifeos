// Financial utility functions (client-side safe)

/**
 * Calculate the next occurrence date for a recurring transaction
 * @param startDate - The original start date
 * @param frequency - How often the transaction recurs
 * @returns Next occurrence date in YYYY-MM-DD format
 */
export function calculateNextOccurrence(startDate: string, frequency: string): string {
  const start = new Date(startDate)
  const now = new Date()

  // If start date is in the future, use it
  if (start > now) return start.toISOString().split('T')[0]

  // Otherwise calculate next occurrence based on frequency
  const next = new Date()

  switch (frequency) {
    case 'daily':
      next.setDate(next.getDate() + 1)
      break
    case 'weekly':
      next.setDate(next.getDate() + 7)
      break
    case 'biweekly':
      next.setDate(next.getDate() + 14)
      break
    case 'monthly':
      next.setMonth(next.getMonth() + 1)
      break
    case 'quarterly':
      next.setMonth(next.getMonth() + 3)
      break
    case 'yearly':
      next.setFullYear(next.getFullYear() + 1)
      break
  }

  return next.toISOString().split('T')[0]
}

/**
 * Calculate frequency display text
 * @param frequency - Frequency code
 * @returns Human-readable frequency text
 */
export function getFrequencyDisplay(frequency: string): string {
  const frequencyMap: Record<string, string> = {
    'daily': 'Daily',
    'weekly': 'Weekly',
    'biweekly': 'Bi-weekly',
    'monthly': 'Monthly',
    'quarterly': 'Quarterly',
    'yearly': 'Yearly'
  }
  return frequencyMap[frequency] || frequency
}

/**
 * Calculate stock portfolio value
 * @param stocks - Array of stock holdings
 * @returns Total portfolio value
 */
export function calculateStockPortfolioValue(stocks: Array<{
  shares: number
  current_price: number | null
}>): number {
  return stocks.reduce((sum, stock) => {
    return sum + (stock.shares * (stock.current_price ?? 0))
  }, 0)
}