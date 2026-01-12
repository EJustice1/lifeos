import { createClient } from '@/lib/supabase/client';

// Configuration for stock APIs
const API_CONFIG = {
  alphaVantage: {
    baseUrl: 'https://www.alphavantage.co/query',
    apiKey: process.env.ALPHA_VANTAGE_API_KEY || 'demo',
    freeTierLimit: 5, // requests per minute
    freeTierDaily: 500 // requests per day
  },
  twelveData: {
    baseUrl: 'https://api.twelvedata.com',
    apiKey: process.env.TWELVE_DATA_API_KEY || '',
    freeTierLimit: 8, // requests per minute
    freeTierDaily: 800 // requests per day
  }
};

interface StockPriceResponse {
  symbol: string;
  price: number;
  currency: string;
  timestamp: string;
  source: 'alphaVantage' | 'twelveData' | 'cached';
  isCached: boolean;
}

interface CacheEntry {
  price: number;
  timestamp: string;
  expiresAt: number;
}

// In-memory cache for stock prices
const inMemoryCache: Record<string, CacheEntry> = {};
const CACHE_TTL = 15 * 60 * 1000; // 15 minutes

class StockApiClient {
  private currentApi: 'alphaVantage' | 'twelveData' = 'alphaVantage';
  private requestCount: number = 0;
  private lastRequestTime: number = 0;
  private rateLimitCooldown: boolean = false;

  constructor() {
    // Initialize with in-memory cache
    this.loadPersistentCache();
  }

  private async loadPersistentCache(): Promise<void> {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        // Check if the table exists first
        try {
          const { data } = await supabase
            .from('stock_price_cache')
            .select('symbol, price, timestamp, expires_at')
            .eq('user_id', user.id)
            .gte('expires_at', new Date().toISOString());

          if (data) {
            data.forEach(entry => {
              inMemoryCache[entry.symbol] = {
                price: entry.price,
                timestamp: entry.timestamp,
                expiresAt: new Date(entry.expires_at).getTime()
              };
            });
          }
        } catch (tableError) {
          // If table doesn't exist, log but don't fail
          if (tableError.message.includes('relation "stock_price_cache" does not exist')) {
            console.log('Stock price cache table does not exist yet. Will be created on first write.');
          } else {
            throw tableError;
          }
        }
      }
    } catch (error) {
      console.error('Failed to load persistent cache:', error);
    }
  }

  private async saveToPersistentCache(symbol: string, entry: CacheEntry): Promise<void> {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        try {
          await supabase
            .from('stock_price_cache')
            .upsert({
              user_id: user.id,
              symbol,
              price: entry.price,
              timestamp: entry.timestamp,
              expires_at: new Date(entry.expiresAt).toISOString()
            });
        } catch (tableError) {
          // If table doesn't exist, try to create it
          if (tableError.message.includes('relation "stock_price_cache" does not exist')) {
            console.log('Creating stock_price_cache table...');
            await this.createCacheTable();
            // Retry the save operation
            await supabase
              .from('stock_price_cache')
              .upsert({
                user_id: user.id,
                symbol,
                price: entry.price,
                timestamp: entry.timestamp,
                expires_at: new Date(entry.expiresAt).toISOString()
              });
          } else {
            throw tableError;
          }
        }
      }
    } catch (error) {
      console.error('Failed to save to persistent cache:', error);
    }
  }

  private async createCacheTable(): Promise<void> {
    try {
      const supabase = createClient();

      // Create the table using raw SQL
      await supabase.rpc('create_stock_price_cache_table', {});

      console.log('Successfully created stock_price_cache table');
    } catch (error) {
      console.error('Failed to create stock_price_cache table:', error);
      throw error;
    }
  }

  private checkRateLimit(): void {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;

    // Reset count if it's been more than 1 minute
    if (timeSinceLastRequest > 60000) {
      this.requestCount = 0;
      this.rateLimitCooldown = false;
    }

    const config = API_CONFIG[this.currentApi];

    // Check if we've hit the rate limit
    if (this.requestCount >= config.freeTierLimit) {
      this.rateLimitCooldown = true;

      // Try to switch to fallback API if available
      if (this.currentApi === 'alphaVantage' && API_CONFIG.twelveData.apiKey) {
        this.currentApi = 'twelveData';
        this.requestCount = 0;
        this.rateLimitCooldown = false;
        console.log('Switched to Twelve Data API due to rate limiting');
        return; // Allow the request to proceed with the new API
      }
    }

    if (this.rateLimitCooldown) {
      throw new Error('API rate limit exceeded. Please try again later.');
    }

    this.requestCount++;
    this.lastRequestTime = now;
  }

  private async fetchFromAlphaVantage(symbol: string): Promise<StockPriceResponse> {
    // Check if API key is properly configured
    if (!API_CONFIG.alphaVantage.apiKey || API_CONFIG.alphaVantage.apiKey === 'demo') {
      console.warn('Alpha Vantage API key is not properly configured. Using demo key with limited functionality.');
      // For demo key, we'll still try but expect limited functionality
    }

    this.checkRateLimit();

    const url = new URL(API_CONFIG.alphaVantage.baseUrl);
    url.searchParams.append('function', 'GLOBAL_QUOTE');
    url.searchParams.append('symbol', symbol);
    url.searchParams.append('apikey', API_CONFIG.alphaVantage.apiKey);
    url.searchParams.append('datatype', 'json');

    try {
      const response = await fetch(url.toString(), {
        headers: {
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Alpha Vantage API error: ${response.status}`);
      }

      const data = await response.json();

      // Enhanced validation for Alpha Vantage API response
      if (!data || typeof data !== 'object') {
        throw new Error('Invalid API response format');
      }

      if (!data['Global Quote']) {
        // Check for error messages in the response
        if (data['Error Message']) {
          throw new Error(`Alpha Vantage Error: ${data['Error Message']}`);
        }
        if (data['Note']) {
          throw new Error(`Alpha Vantage Note: ${data['Note']}`);
        }
        throw new Error('No Global Quote data received');
      }

      const quote = data['Global Quote'];

      if (!quote['05. price'] || quote['05. price'] === '0.00' || isNaN(parseFloat(quote['05. price']))) {
        throw new Error('Invalid or missing price data');
      }

      const price = parseFloat(quote['05. price']);
      if (isNaN(price) || price <= 0) {
        throw new Error('Invalid price value');
      }

      const timestamp = (quote['07. latest trading day'] || new Date().toISOString().split('T')[0]) +
                       (quote['08. previous close time'] ? ' ' + quote['08. previous close time'] : '');

      return {
        symbol,
        price,
        currency: 'USD',
        timestamp,
        source: 'alphaVantage',
        isCached: false
      };
    } catch (error) {
      console.error('Alpha Vantage API error:', error);
      throw new Error('Failed to fetch stock price from Alpha Vantage');
    }
  }

  private async fetchFromTwelveData(symbol: string): Promise<StockPriceResponse> {
    this.checkRateLimit();

    const endpoint = `/price?symbol=${symbol}&apikey=${API_CONFIG.twelveData.apiKey}`;
    const url = new URL(endpoint, API_CONFIG.twelveData.baseUrl);

    try {
      const response = await fetch(url.toString(), {
        headers: {
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Twelve Data API error: ${response.status}`);
      }

      const data = await response.json();

      if (!data.price || data.price === null) {
        throw new Error('Invalid stock data received');
      }

      return {
        symbol,
        price: parseFloat(data.price),
        currency: data.currency || 'USD',
        timestamp: data.timestamp || new Date().toISOString(),
        source: 'twelveData',
        isCached: false
      };
    } catch (error) {
      console.error('Twelve Data API error:', error);
      throw new Error('Failed to fetch stock price from Twelve Data');
    }
  }

  public async getStockPrice(symbol: string): Promise<StockPriceResponse> {
    // Normalize symbol (uppercase, remove spaces)
    const normalizedSymbol = symbol.toUpperCase().trim();

    // Check in-memory cache first
    const cachedEntry = inMemoryCache[normalizedSymbol];
    if (cachedEntry && cachedEntry.expiresAt > Date.now()) {
      return {
        symbol: normalizedSymbol,
        price: cachedEntry.price,
        currency: 'USD',
        timestamp: cachedEntry.timestamp,
        source: 'cached',
        isCached: true
      };
    }

    try {
      // Try primary API first
      let result: StockPriceResponse;

      if (this.currentApi === 'alphaVantage') {
        result = await this.fetchFromAlphaVantage(normalizedSymbol);
      } else {
        result = await this.fetchFromTwelveData(normalizedSymbol);
      }

      // Update cache
      const cacheEntry: CacheEntry = {
        price: result.price,
        timestamp: result.timestamp,
        expiresAt: Date.now() + CACHE_TTL
      };

      inMemoryCache[normalizedSymbol] = cacheEntry;

      // Save to persistent cache
      await this.saveToPersistentCache(normalizedSymbol, cacheEntry);

      return result;
    } catch (error) {
      console.error(`Failed to fetch ${normalizedSymbol} from ${this.currentApi}:`, error);

      // Try fallback API if available
      if (this.currentApi === 'alphaVantage' && API_CONFIG.twelveData.apiKey) {
        try {
          const result = await this.fetchFromTwelveData(normalizedSymbol);

          // Update cache
          const cacheEntry: CacheEntry = {
            price: result.price,
            timestamp: result.timestamp,
            expiresAt: Date.now() + CACHE_TTL
          };

          inMemoryCache[normalizedSymbol] = cacheEntry;
          await this.saveToPersistentCache(normalizedSymbol, cacheEntry);

          return result;
        } catch (fallbackError) {
          console.error('Fallback API also failed:', fallbackError);
        }
      }

      // If we have stale cache data, return it as fallback
      if (cachedEntry) {
        return {
          symbol: normalizedSymbol,
          price: cachedEntry.price,
          currency: 'USD',
          timestamp: cachedEntry.timestamp,
          source: 'cached',
          isCached: true
        };
      }

      throw new Error('Failed to fetch stock price. Please check the symbol and try again.');
    }
  }

  public async getMultipleStockPrices(symbols: string[]): Promise<StockPriceResponse[]> {
    const results: StockPriceResponse[] = [];

    for (const symbol of symbols) {
      try {
        const result = await this.getStockPrice(symbol);
        results.push(result);
      } catch (error) {
        console.error(`Failed to fetch price for ${symbol}:`, error);
        results.push({
          symbol,
          price: 0,
          currency: 'USD',
          timestamp: new Date().toISOString(),
          source: 'cached',
          isCached: false
        });
      }
    }

    return results;
  }

  public clearCache(): void {
    Object.keys(inMemoryCache).forEach(symbol => {
      if (inMemoryCache[symbol].expiresAt <= Date.now()) {
        delete inMemoryCache[symbol];
      }
    });
  }

  public getCacheStatus(): { cachedSymbols: string[], cacheSize: number } {
    const cachedSymbols = Object.keys(inMemoryCache);
    return {
      cachedSymbols,
      cacheSize: cachedSymbols.length
    };
  }
}

// Singleton instance
export const stockApiClient = new StockApiClient();