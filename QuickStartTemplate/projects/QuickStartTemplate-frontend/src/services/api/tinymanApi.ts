// tinymanApi.ts
// Real Tinyman API integration

export interface TinymanApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}

export interface TinymanPool {
  id: string
  asset1: {
    id: number
    name: string
    unitName: string
    decimals: number
  }
  asset2: {
    id: number
    name: string
    unitName: string
    decimals: number
  }
  liquidity: number
  fee: number
  price: number
  volume24h: number
  priceChange24h: number
}

export interface TinymanQuote {
  amountIn: number
  amountOut: number
  priceImpact: number
  route: TinymanRoute[]
  estimatedGas: number
  slippage: number
  minAmountOut: number
}

export interface TinymanRoute {
  poolId: string
  assetIn: number
  assetOut: number
  amountIn: number
  amountOut: number
  fee: number
  price: number
}

export interface TinymanAsset {
  id: number
  name: string
  unitName: string
  decimals: number
  totalSupply: number
  circulatingSupply: number
  verified: boolean
  logoUrl?: string
}

export interface TinymanTransaction {
  id: string
  type: 'swap' | 'add_liquidity' | 'remove_liquidity'
  asset1: number
  asset2: number
  amount1: number
  amount2: number
  price: number
  timestamp: number
  user: string
}

export class TinymanApiService {
  private baseUrl: string
  private apiKey?: string

  constructor(baseUrl: string = 'https://api.tinyman.org', apiKey?: string) {
    this.baseUrl = baseUrl
    this.apiKey = apiKey
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<TinymanApiResponse<T>> {
    try {
      const url = `${this.baseUrl}${endpoint}`
      const headers = {
        'Content-Type': 'application/json',
        ...(this.apiKey && { 'Authorization': `Bearer ${this.apiKey}` }),
        ...options.headers,
      }

      const response = await fetch(url, {
        ...options,
        headers,
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      return { success: true, data }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  /**
   * Get all available pools
   */
  async getPools(): Promise<TinymanApiResponse<TinymanPool[]>> {
    return this.makeRequest<TinymanPool[]>('/v1/pools')
  }

  /**
   * Get specific pool by ID
   */
  async getPool(poolId: string): Promise<TinymanApiResponse<TinymanPool>> {
    return this.makeRequest<TinymanPool>(`/v1/pools/${poolId}`)
  }

  /**
   * Get pools for an asset pair
   */
  async getPoolsForPair(asset1: number, asset2: number): Promise<TinymanApiResponse<TinymanPool[]>> {
    return this.makeRequest<TinymanPool[]>(`/v1/pools?asset1=${asset1}&asset2=${asset2}`)
  }

  /**
   * Get swap quote
   */
  async getSwapQuote(
    assetIn: number,
    assetOut: number,
    amountIn: number,
    slippage: number = 0.5
  ): Promise<TinymanApiResponse<TinymanQuote>> {
    return this.makeRequest<TinymanQuote>(
      `/v1/quote/swap?assetIn=${assetIn}&assetOut=${assetOut}&amountIn=${amountIn}&slippage=${slippage}`
    )
  }

  /**
   * Get optimal route for swap
   */
  async getOptimalRoute(
    assetIn: number,
    assetOut: number,
    amountIn: number
  ): Promise<TinymanApiResponse<TinymanRoute[]>> {
    return this.makeRequest<TinymanRoute[]>(
      `/v1/route?assetIn=${assetIn}&assetOut=${assetOut}&amountIn=${amountIn}`
    )
  }

  /**
   * Get current price for an asset pair
   */
  async getCurrentPrice(asset1: number, asset2: number): Promise<TinymanApiResponse<number>> {
    const response = await this.getPoolsForPair(asset1, asset2)
    if (response.success && response.data && response.data.length > 0) {
      return { success: true, data: response.data[0].price }
    }
    return { success: false, error: 'No pools found for this pair' }
  }

  /**
   * Get asset information
   */
  async getAsset(assetId: number): Promise<TinymanApiResponse<TinymanAsset>> {
    return this.makeRequest<TinymanAsset>(`/v1/assets/${assetId}`)
  }

  /**
   * Get popular assets
   */
  async getPopularAssets(): Promise<TinymanApiResponse<TinymanAsset[]>> {
    return this.makeRequest<TinymanAsset[]>('/v1/assets/popular')
  }

  /**
   * Get transaction history for an address
   */
  async getTransactionHistory(
    address: string,
    limit: number = 50
  ): Promise<TinymanApiResponse<TinymanTransaction[]>> {
    return this.makeRequest<TinymanTransaction[]>(
      `/v1/transactions/${address}?limit=${limit}`
    )
  }

  /**
   * Get pool analytics
   */
  async getPoolAnalytics(poolId: string): Promise<TinymanApiResponse<{
    volume24h: number
    volume7d: number
    volume30d: number
    fees24h: number
    fees7d: number
    fees30d: number
    priceChange24h: number
    priceChange7d: number
    priceChange30d: number
  }>> {
    return this.makeRequest<{
      volume24h: number
      volume7d: number
      volume30d: number
      fees24h: number
      fees7d: number
      fees30d: number
      priceChange24h: number
      priceChange7d: number
      priceChange30d: number
    }>(`/v1/pools/${poolId}/analytics`)
  }

  /**
   * Get market data for an asset
   */
  async getMarketData(assetId: number): Promise<TinymanApiResponse<{
    price: number
    priceChange24h: number
    volume24h: number
    marketCap: number
    liquidity: number
  }>> {
    return this.makeRequest<{
      price: number
      priceChange24h: number
      volume24h: number
      marketCap: number
      liquidity: number
    }>(`/v1/assets/${assetId}/market-data`)
  }

  /**
   * Estimate gas fees for a transaction
   */
  async estimateGasFees(route: TinymanRoute[]): Promise<TinymanApiResponse<number>> {
    // Base fee + fee per hop
    const baseFee = 0.001
    const hopFee = 0.002
    const totalFee = baseFee + (route.length * hopFee)
    
    return { success: true, data: totalFee }
  }

  /**
   * Get trending pools
   */
  async getTrendingPools(): Promise<TinymanApiResponse<TinymanPool[]>> {
    return this.makeRequest<TinymanPool[]>('/v1/pools/trending')
  }

  /**
   * Search assets by name or symbol
   */
  async searchAssets(query: string): Promise<TinymanApiResponse<TinymanAsset[]>> {
    return this.makeRequest<TinymanAsset[]>(`/v1/assets/search?q=${encodeURIComponent(query)}`)
  }

  /**
   * Get price history for an asset pair
   */
  async getPriceHistory(
    asset1: number,
    asset2: number,
    timeframe: '1h' | '4h' | '1d' | '1w' = '1d',
    limit: number = 100
  ): Promise<TinymanApiResponse<Array<{ timestamp: number; price: number }>>> {
    return this.makeRequest<Array<{ timestamp: number; price: number }>>(
      `/v1/price-history?asset1=${asset1}&asset2=${asset2}&timeframe=${timeframe}&limit=${limit}`
    )
  }
}

// Utility functions for Tinyman integration
export const tinymanUtils = {
  /**
   * Calculate price impact
   */
  calculatePriceImpact: (amountIn: number, poolLiquidity: number): number => {
    return (amountIn / poolLiquidity) * 100
  },

  /**
   * Calculate minimum amount out with slippage
   */
  calculateMinAmountOut: (amountOut: number, slippagePercent: number): number => {
    const slippageMultiplier = 1 - (slippagePercent / 100)
    return Math.floor(amountOut * slippageMultiplier)
  },

  /**
   * Format asset amount
   */
  formatAssetAmount: (amount: number, decimals: number = 6): string => {
    return (amount / Math.pow(10, decimals)).toFixed(6)
  },

  /**
   * Parse asset amount from user input
   */
  parseAssetAmount: (input: string, decimals: number = 6): number => {
    const amount = parseFloat(input)
    return Math.floor(amount * Math.pow(10, decimals))
  },

  /**
   * Calculate slippage percentage
   */
  calculateSlippagePercent: (expectedAmount: number, actualAmount: number): number => {
    return ((expectedAmount - actualAmount) / expectedAmount) * 100
  },

  /**
   * Get asset symbol by ID
   */
  getAssetSymbol: (assetId: number): string => {
    const symbols: { [key: number]: string } = {
      0: 'ALGO',
      684651151: 'USDC',
      684651152: 'USDT'
    }
    return symbols[assetId] || `ASA-${assetId}`
  },

  /**
   * Format price for display
   */
  formatPrice: (price: number, fromSymbol: string, toSymbol: string): string => {
    return `1 ${fromSymbol} = ${price.toFixed(6)} ${toSymbol}`
  },

  /**
   * Calculate trade value
   */
  calculateTradeValue: (amount: number, price: number): number => {
    return amount * price
  },

  /**
   * Check if trade is profitable
   */
  isTradeProfitable: (amountIn: number, amountOut: number, price: number): boolean => {
    return amountOut > amountIn * price
  },

  /**
   * Get optimal trade size
   */
  getOptimalTradeSize: (liquidity: number, maxPriceImpact: number = 1): number => {
    return liquidity * (maxPriceImpact / 100)
  }
}

export default TinymanApiService
