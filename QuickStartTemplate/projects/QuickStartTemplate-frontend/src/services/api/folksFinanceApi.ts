// folksFinanceApi.ts
// Real Folks Finance API integration

export interface FolksApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}

export interface FolksMarketData {
  assetId: number
  symbol: string
  name: string
  price: number
  apy: number
  totalLiquidity: number
  utilizationRate: number
}

export interface FolksUserPosition {
  assetId: number
  supplied: number
  borrowed: number
  collateralValue: number
  healthFactor: number
}

export interface FolksDepositQuote {
  assetIn: number
  assetOut: number
  amountIn: number
  amountOut: number
  exchangeRate: number
  slippage: number
  minAmountOut: number
}

export class FolksFinanceApiService {
  private baseUrl: string
  private apiKey?: string

  constructor(baseUrl: string = 'https://api.folks.finance', apiKey?: string) {
    this.baseUrl = baseUrl
    this.apiKey = apiKey
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<FolksApiResponse<T>> {
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
   * Get all available markets
   */
  async getMarkets(): Promise<FolksApiResponse<FolksMarketData[]>> {
    return this.makeRequest<FolksMarketData[]>('/markets')
  }

  /**
   * Get specific market data
   */
  async getMarket(assetId: number): Promise<FolksApiResponse<FolksMarketData>> {
    return this.makeRequest<FolksMarketData>(`/markets/${assetId}`)
  }

  /**
   * Get user positions
   */
  async getUserPositions(userAddress: string): Promise<FolksApiResponse<FolksUserPosition[]>> {
    return this.makeRequest<FolksUserPosition[]>(`/users/${userAddress}/positions`)
  }

  /**
   * Get deposit quote
   */
  async getDepositQuote(
    assetIn: number,
    assetOut: number,
    amountIn: number
  ): Promise<FolksApiResponse<FolksDepositQuote>> {
    return this.makeRequest<FolksDepositQuote>(
      `/quote/deposit?assetIn=${assetIn}&assetOut=${assetOut}&amountIn=${amountIn}`
    )
  }

  /**
   * Get current APY for an asset
   */
  async getCurrentAPY(assetId: number): Promise<FolksApiResponse<number>> {
    const response = await this.getMarket(assetId)
    if (response.success && response.data) {
      return { success: true, data: response.data.apy }
    }
    return { success: false, error: response.error || 'Failed to fetch APY' }
  }

  /**
   * Get xALGO exchange rate
   */
  async getXAlgoExchangeRate(): Promise<FolksApiResponse<number>> {
    // xALGO typically has asset ID 684651147 on TestNet
    return this.getCurrentAPY(684651147)
  }

  /**
   * Get staking rewards for user
   */
  async getStakingRewards(userAddress: string): Promise<FolksApiResponse<{
    totalRewards: number
    claimableRewards: number
    stakedAmount: number
  }>> {
    return this.makeRequest<{
      totalRewards: number
      claimableRewards: number
      stakedAmount: number
    }>(`/users/${userAddress}/staking/rewards`)
  }

  /**
   * Get liquidation threshold for an asset
   */
  async getLiquidationThreshold(assetId: number): Promise<FolksApiResponse<number>> {
    const response = await this.getMarket(assetId)
    if (response.success && response.data) {
      // Calculate liquidation threshold based on utilization rate
      const threshold = Math.max(0.75, 0.95 - (response.data.utilizationRate * 0.2))
      return { success: true, data: threshold }
    }
    return { success: false, error: response.error || 'Failed to fetch liquidation threshold' }
  }

  /**
   * Get historical APY data
   */
  async getHistoricalAPY(
    assetId: number,
    days: number = 30
  ): Promise<FolksApiResponse<Array<{ date: string; apy: number }>>> {
    return this.makeRequest<Array<{ date: string; apy: number }>>(
      `/markets/${assetId}/historical-apy?days=${days}`
    )
  }

  /**
   * Get pool liquidity
   */
  async getPoolLiquidity(assetId: number): Promise<FolksApiResponse<{
    totalLiquidity: number
    availableLiquidity: number
    borrowedLiquidity: number
  }>> {
    return this.makeRequest<{
      totalLiquidity: number
      availableLiquidity: number
      borrowedLiquidity: number
    }>(`/markets/${assetId}/liquidity`)
  }

  /**
   * Get optimal deposit amount for maximum yield
   */
  async getOptimalDepositAmount(
    userAddress: string,
    assetId: number
  ): Promise<FolksApiResponse<{
    recommendedAmount: number
    maxAmount: number
    expectedAPY: number
  }>> {
    return this.makeRequest<{
      recommendedAmount: number
      maxAmount: number
      expectedAPY: number
    }>(`/users/${userAddress}/optimal-deposit/${assetId}`)
  }
}

// Utility functions for Folks Finance integration
export const folksFinanceUtils = {
  /**
   * Calculate compound interest
   */
  calculateCompoundInterest: (
    principal: number,
    rate: number,
    time: number,
    frequency: number = 365
  ): number => {
    return principal * Math.pow(1 + rate / frequency, frequency * time)
  },

  /**
   * Calculate simple interest
   */
  calculateSimpleInterest: (principal: number, rate: number, time: number): number => {
    return principal * rate * time
  },

  /**
   * Format APY for display
   */
  formatAPY: (apy: number): string => {
    return `${apy.toFixed(2)}% APY`
  },

  /**
   * Calculate risk score based on utilization and liquidity
   */
  calculateRiskScore: (utilizationRate: number, totalLiquidity: number): number => {
    const utilizationRisk = Math.min(utilizationRate * 100, 100)
    const liquidityRisk = Math.max(0, 100 - (totalLiquidity / 1000000) * 10)
    return Math.round((utilizationRisk + liquidityRisk) / 2)
  },

  /**
   * Get risk level from score
   */
  getRiskLevel: (riskScore: number): 'Low' | 'Medium' | 'High' => {
    if (riskScore < 30) return 'Low'
    if (riskScore < 70) return 'Medium'
    return 'High'
  },

  /**
   * Calculate health factor
   */
  calculateHealthFactor: (
    collateralValue: number,
    borrowedValue: number,
    liquidationThreshold: number
  ): number => {
    if (borrowedValue === 0) return Infinity
    return (collateralValue * liquidationThreshold) / borrowedValue
  },

  /**
   * Check if position is healthy
   */
  isPositionHealthy: (healthFactor: number): boolean => {
    return healthFactor > 1.5
  },

  /**
   * Get recommended action based on health factor
   */
  getRecommendedAction: (healthFactor: number): string => {
    if (healthFactor === Infinity) return 'Safe - No debt'
    if (healthFactor > 2) return 'Safe - Consider increasing leverage'
    if (healthFactor > 1.5) return 'Safe - Monitor position'
    if (healthFactor > 1.2) return 'Caution - Consider reducing debt'
    if (healthFactor > 1.0) return 'Warning - Close to liquidation'
    return 'Danger - Immediate action required'
  }
}

export default FolksFinanceApiService
