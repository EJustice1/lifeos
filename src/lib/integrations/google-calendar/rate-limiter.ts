/**
 * Rate Limiter for Google Calendar API
 *
 * Google Calendar API quotas:
 * - 1,000,000 queries per day per project
 * - 10 queries per second per user
 *
 * This rate limiter implements:
 * - Queue-based request management
 * - 10 requests per second limit
 * - Exponential backoff on errors
 * - Request prioritization
 */

interface QueuedRequest<T> {
  id: string
  priority: number
  execute: () => Promise<T>
  resolve: (value: T) => void
  reject: (error: Error) => void
  retries: number
  maxRetries: number
}

export class RateLimiter {
  private queue: QueuedRequest<any>[] = []
  private processing = false
  private lastRequestTime = 0
  private minInterval = 100 // 10 requests per second = 100ms between requests
  private requestCount = 0

  /**
   * Add a request to the queue
   * @param request Function that returns a promise
   * @param options Configuration options
   * @returns Promise that resolves with the request result
   */
  async enqueue<T>(
    request: () => Promise<T>,
    options: {
      priority?: number
      maxRetries?: number
    } = {}
  ): Promise<T> {
    const { priority = 0, maxRetries = 3 } = options

    return new Promise<T>((resolve, reject) => {
      const id = `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

      const queuedRequest: QueuedRequest<T> = {
        id,
        priority,
        execute: request,
        resolve,
        reject,
        retries: 0,
        maxRetries,
      }

      this.queue.push(queuedRequest)

      // Sort by priority (higher priority first)
      this.queue.sort((a, b) => b.priority - a.priority)

      this.processQueue()
    })
  }

  /**
   * Process the queue of requests
   */
  private async processQueue() {
    if (this.processing || this.queue.length === 0) return

    this.processing = true

    while (this.queue.length > 0) {
      const request = this.queue[0]

      // Wait for rate limit
      const now = Date.now()
      const timeSinceLastRequest = now - this.lastRequestTime

      if (timeSinceLastRequest < this.minInterval) {
        await this.sleep(this.minInterval - timeSinceLastRequest)
      }

      // Execute request
      try {
        this.lastRequestTime = Date.now()
        this.requestCount++

        const result = await request.execute()

        // Success - remove from queue and resolve
        this.queue.shift()
        request.resolve(result)
      } catch (error) {
        const err = error as Error

        // Check if it's a rate limit error
        if (this.isRateLimitError(err)) {
          // Exponential backoff
          const backoffMs = Math.min(1000 * Math.pow(2, request.retries), 32000)
          console.warn(`Rate limit hit, backing off for ${backoffMs}ms`)
          await this.sleep(backoffMs)

          // Don't increment retries for rate limit errors
          continue
        }

        // Check if we should retry
        if (request.retries < request.maxRetries && this.isRetryableError(err)) {
          request.retries++
          const backoffMs = Math.min(1000 * Math.pow(2, request.retries - 1), 16000)
          console.warn(`Request failed, retry ${request.retries}/${request.maxRetries} after ${backoffMs}ms`)
          await this.sleep(backoffMs)
          continue
        }

        // Failed - remove from queue and reject
        this.queue.shift()
        request.reject(err)
      }
    }

    this.processing = false
  }

  /**
   * Check if error is a rate limit error
   */
  private isRateLimitError(error: Error): boolean {
    const message = error.message.toLowerCase()
    return (
      message.includes('rate limit') ||
      message.includes('quota exceeded') ||
      message.includes('429') ||
      message.includes('too many requests')
    )
  }

  /**
   * Check if error is retryable
   */
  private isRetryableError(error: Error): boolean {
    const message = error.message.toLowerCase()
    return (
      message.includes('network') ||
      message.includes('timeout') ||
      message.includes('econnrefused') ||
      message.includes('enotfound') ||
      message.includes('500') ||
      message.includes('502') ||
      message.includes('503') ||
      message.includes('504')
    )
  }

  /**
   * Sleep for a given number of milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Get queue statistics
   */
  getStats() {
    return {
      queueLength: this.queue.length,
      processing: this.processing,
      requestCount: this.requestCount,
      lastRequestTime: this.lastRequestTime,
    }
  }

  /**
   * Clear the queue
   */
  clear() {
    this.queue.forEach(req => {
      req.reject(new Error('Queue cleared'))
    })
    this.queue = []
  }
}

// Singleton instance
let rateLimiterInstance: RateLimiter | null = null

/**
 * Get the singleton rate limiter instance
 */
export function getRateLimiter(): RateLimiter {
  if (!rateLimiterInstance) {
    rateLimiterInstance = new RateLimiter()
  }
  return rateLimiterInstance
}
