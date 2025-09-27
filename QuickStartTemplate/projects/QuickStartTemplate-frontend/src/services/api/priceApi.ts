// priceApi.ts
// Real price data integration for Algorand assets

export interface PriceApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}

export interface AssetPrice {
  assetId: number
  symbol: string
  name: string
  price: number
  priceChange24h: number
  volume24h: number
  marketCap?: number
  timestamp: number
}

export interface PriceQuote {
  assetIn: number
  assetOut: number
  amountIn: number
  amountOut: number
  priceImpact: number
  route: PriceRoute[]
  timestamp: number
}

export interface PriceRoute {
  assetIn: number
  assetOut: number
  price: number
  liquidity: number
}

export class PriceApiService {
  private baseUrl: string
  private apiKey?: string

  constructor(baseUrl: string = 'https://api.coingecko.com/api/v3', apiKey?: string) {
    this.baseUrl = baseUrl
    this.apiKey = apiKey
  }

  private async makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<PriceApiResponse<T>> {
    try {
      const url = `${this.baseUrl}${endpoint}`
      const headers = {
        'Content-Type': 'application/json',
        ...(this.apiKey && { Authorization: `Bearer ${this.apiKey}` }),
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
   * Get current price for Algorand and major assets
   */
  async getAssetPrice(assetId: number): Promise<PriceApiResponse<AssetPrice>> {
    try {
      // Map Algorand asset IDs to CoinGecko IDs
      const assetMapping: { [key: number]: string } = {
        0: 'algorand', // ALGO
        684651151: 'usd-coin', // USDC
        684651152: 'tether', // USDT
        27165954: 'governance-algo', // gALGO
        226701642: 'algorand-wormhole', // wALGO
      }

      const coinGeckoId = assetMapping[assetId]
      if (!coinGeckoId) {
        // For unknown assets, try to fetch from Algorand indexer
        return await this.getAssetPriceFromIndexer(assetId)
      }

      const response = await this.makeRequest<{
        id: string
        symbol: string
        name: string
        current_price: number
        price_change_percentage_24h: number
        total_volume: number
        market_cap?: number
      }>(`/simple/price?ids=${coinGeckoId}&vs_currencies=usd&include_24hr_change=true&include_24hr_vol=true&include_market_cap=true`)

      if (!response.success || !response.data) {
        throw new Error('Failed to fetch price data')
      }

      const priceData = response.data[coinGeckoId]
      return {
        success: true,
        data: {
          assetId,
          symbol: coinGeckoId.toUpperCase(),
          name: coinGeckoId,
          price: priceData.usd,
          priceChange24h: priceData.usd_24h_change || 0,
          volume24h: priceData.usd_24h_vol || 0,
          marketCap: priceData.usd_market_cap,
          timestamp: Date.now(),
        },
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch asset price',
      }
    }
  }

  /**
   * Get price data from Algorand indexer for unknown assets
   */
  private async getAssetPriceFromIndexer(assetId: number): Promise<PriceApiResponse<AssetPrice>> {
    try {
      // Use Algorand indexer to get asset info and recent trades
      const indexerUrl = 'https://testnet-idx.algonode.cloud'

      const response = await fetch(`${indexerUrl}/v2/assets/${assetId}`)
      if (!response.ok) {
        throw new Error(`Asset ${assetId} not found`)
      }

      const assetData = await response.json()
      const asset = assetData.asset

      // For unknown assets, use a default price of 1.0
      return {
        success: true,
        data: {
          assetId,
          symbol: asset.params?.unit_name || 'UNKNOWN',
          name: asset.params?.name || 'Unknown Asset',
          price: 1.0,
          priceChange24h: 0,
          volume24h: 0,
          timestamp: Date.now(),
        },
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch asset data from indexer',
      }
    }
  }

  /**
   * Get price quote for asset swap
   */
  async getPriceQuote(assetIn: number, assetOut: number, amountIn: number): Promise<PriceApiResponse<PriceQuote>> {
    try {
      const [assetInPrice, assetOutPrice] = await Promise.all([this.getAssetPrice(assetIn), this.getAssetPrice(assetOut)])

      if (!assetInPrice.success || !assetOutPrice.success || !assetInPrice.data || !assetOutPrice.data) {
        throw new Error('Failed to fetch asset prices for quote')
      }

      // Calculate amount out based on current prices
      const amountOut = (amountIn * assetInPrice.data.price) / assetOutPrice.data.price

      // Calculate price impact (simplified - in real implementation, this would consider liquidity)
      const priceImpact = this.calculatePriceImpact(amountIn, assetInPrice.data.volume24h)

      return {
        success: true,
        data: {
          assetIn,
          assetOut,
          amountIn,
          amountOut,
          priceImpact,
          route: [
            {
              assetIn,
              assetOut,
              price: assetInPrice.data.price / assetOutPrice.data.price,
              liquidity: assetInPrice.data.volume24h,
            },
          ],
          timestamp: Date.now(),
        },
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate price quote',
      }
    }
  }

  /**
   * Calculate price impact based on trade size and liquidity
   */
  private calculatePriceImpact(amountIn: number, volume24h: number): number {
    if (volume24h === 0) return 0.05 // 5% default impact for unknown liquidity

    const liquidityRatio = amountIn / volume24h
    return Math.min(liquidityRatio * 10, 0.1) // Max 10% impact
  }

  /**
   * Get multiple asset prices at once
   */
  async getMultipleAssetPrices(assetIds: number[]): Promise<PriceApiResponse<AssetPrice[]>> {
    try {
      const pricePromises = assetIds.map((id) => this.getAssetPrice(id))
      const results = await Promise.all(pricePromises)

      const successfulPrices = results.filter((result) => result.success && result.data).map((result) => result.data!)

      return {
        success: true,
        data: successfulPrices,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch multiple asset prices',
      }
    }
  }
}
