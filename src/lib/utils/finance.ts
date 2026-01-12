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

/**
 * Format currency value
 * @param value - The numeric value to format
 * @param currency - The currency symbol (default: '$')
 * @returns Formatted currency string
 */
export function formatCurrency(value: number, currency = '$'): string {
  return `${currency}${value.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`
}

/**
 * Calculate percentage change
 * @param oldValue - The original value
 * @param newValue - The new value
 * @returns Percentage change as number
 */
export function calculatePercentageChange(oldValue: number, newValue: number): number {
  if (oldValue === 0) return newValue > 0 ? 100 : 0
  return ((newValue - oldValue) / oldValue) * 100
}

/**
 * Generate color variations for chart segments
 * @param baseHue - Base hue value (0-360)
 * @param count - Number of variations needed
 * @param saturation - Saturation percentage (default: 70)
 * @param lightness - Lightness percentage (default: 50)
 * @returns Array of color strings
 */
export function generateColorVariations(baseHue: number, count: number, saturation = 70, lightness = 50): string[] {
  return Array.from({ length: count }, (_, i) => {
    const hue = (baseHue + (i * 5)) % 360
    return `hsl(${hue}, ${saturation}%, ${lightness}%)`
  })
}

/**
 * Format date for display
 * @param dateString - ISO date string
 * @param format - Date format (default: 'MMM d, yyyy')
 * @returns Formatted date string
 */
export function formatDate(dateString: string, format = 'MMM d, yyyy'): string {
  const date = new Date(dateString)

  const formats: Record<string, Intl.DateTimeFormatOptions> = {
    'MMM d, yyyy': { month: 'short', day: 'numeric', year: 'numeric' },
    'MMMM d, yyyy': { month: 'long', day: 'numeric', year: 'numeric' },
    'MM/dd/yyyy': { month: '2-digit', day: '2-digit', year: 'numeric' },
    'yyyy-MM-dd': { year: 'numeric', month: '2-digit', day: '2-digit' },
  }

  const options = formats[format] || formats['MMM d, yyyy']
  return date.toLocaleDateString('en-US', options)
}

/**
 * Validate stock symbol format
 * @param symbol - Stock symbol to validate
 * @returns Boolean indicating if symbol is valid
 */
export function validateStockSymbol(symbol: string): boolean {
  // Basic validation: 1-5 uppercase letters, may include dots for some exchanges
  const regex = /^[A-Z]{1,5}(\.[A-Z]{1,2})?$/
  return regex.test(symbol.trim().toUpperCase())
}

/**
 * Calculate total value from shares and price
 * @param shares - Number of shares
 * @param price - Price per share
 * @returns Total value
 */
export function calculateTotalValue(shares: number, price: number): number {
  return parseFloat((shares * price).toFixed(2))
}