// agenticRebalancer.ts
// AI-powered portfolio rebalancing service

import { Algodv2 } from 'algosdk'
import { FolksFinanceService } from './folksFinance'
import { TinymanRouterService } from './tinymanRouter'
import { policyGuardContract, POLICY_GUARD_APP_ID } from '../../contracts/PolicyGuard'
import { PriceApiService } from '../api/priceApi'

export interface PortfolioAsset {
  assetId: number
  symbol: string
  currentAmount: number
  targetPercentage: number
  currentPercentage: number
  price: number
  volatility: number
}

export interface RebalanceAction {
  id: string
  type: 'buy' | 'sell' | 'stake' | 'unstake'
  assetId: number
  symbol: string
  amount: number
  reason: string
  priority: 'low' | 'medium' | 'high'
  estimatedImpact: number
  gasEstimate: number
}

export interface RebalanceTrigger {
  id: string
  type: 'drift' | 'volatility' | 'market' | 'manual'
  threshold: number
  currentValue: number
  description: string
  severity: 'low' | 'medium' | 'high'
}

export interface RebalanceStrategy {
  name: string
  description: string
  parameters: {
    driftThreshold: number // Percentage drift before rebalancing
    maxSlippage: number // Maximum slippage tolerance
    rebalanceFrequency: number // Hours between rebalances
    minTradeSize: number // Minimum trade size in ALGO
    maxTradeSize: number // Maximum trade size in ALGO
    volatilityThreshold: number // Volatility threshold for dynamic rebalancing
  }
}

export interface RebalanceHistory {
  id: string
  timestamp: Date
  trigger: RebalanceTrigger
  actions: RebalanceAction[]
  totalGasUsed: number
  portfolioValue: number
  driftBefore: number
  driftAfter: number
  success: boolean
  error?: string
}

export class AgenticRebalancerService {
  private algodClient: Algodv2
  private folksFinance: FolksFinanceService
  private tinymanRouter: TinymanRouterService
  private priceService: PriceApiService
  private policyGuardAppId: number
  private rebalanceHistory: RebalanceHistory[] = []
  private monitoringInterval?: NodeJS.Timeout

  constructor(algodClient: Algodv2, policyGuardAppId: number = POLICY_GUARD_APP_ID) {
    this.algodClient = algodClient
    this.policyGuardAppId = policyGuardAppId
    this.folksFinance = new FolksFinanceService(algodClient, policyGuardAppId)
    this.tinymanRouter = new TinymanRouterService(algodClient, policyGuardAppId)
    this.priceService = new PriceApiService()
  }

  /**
   * Start monitoring portfolio for rebalancing opportunities
   */
  async startMonitoring(userAddress: string, targetAllocation: PortfolioAsset[], strategy: RebalanceStrategy): Promise<void> {
    console.log('Starting portfolio monitoring...')

    this.monitoringInterval = setInterval(
      async () => {
        try {
          await this.checkRebalanceOpportunities(userAddress, targetAllocation, strategy)
        } catch (error) {
          console.error('Monitoring error:', error)
        }
      },
      strategy.parameters.rebalanceFrequency * 60 * 60 * 1000,
    ) // Convert hours to milliseconds
  }

  /**
   * Stop monitoring portfolio
   */
  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval)
      this.monitoringInterval = undefined
      console.log('Portfolio monitoring stopped')
    }
  }

  /**
   * Check for rebalancing opportunities
   */
  async checkRebalanceOpportunities(
    userAddress: string,
    targetAllocation: PortfolioAsset[],
    strategy: RebalanceStrategy,
  ): Promise<RebalanceAction[]> {
    try {
      // Get current portfolio
      const currentPortfolio = await this.getCurrentPortfolio(userAddress, targetAllocation)

      // Calculate portfolio drift
      const drift = this.calculatePortfolioDrift(currentPortfolio, targetAllocation)

      // Check if rebalancing is needed
      if (drift < strategy.parameters.driftThreshold) {
        console.log(`Portfolio drift (${drift.toFixed(2)}%) below threshold (${strategy.parameters.driftThreshold}%)`)
        return []
      }

      // Generate rebalancing actions
      const actions = await this.generateRebalanceActions(currentPortfolio, targetAllocation, strategy)

      if (actions.length === 0) {
        console.log('No rebalancing actions needed')
        return []
      }

      // Log rebalancing opportunity
      console.log(`Rebalancing opportunity detected: ${actions.length} actions needed`)

      return actions
    } catch (error) {
      throw new Error(`Failed to check rebalance opportunities: ${error}`)
    }
  }

  /**
   * Execute rebalancing actions
   */
  async executeRebalance(userAddress: string, actions: RebalanceAction[], trigger: RebalanceTrigger): Promise<RebalanceHistory> {
    const rebalanceId = `rebalance_${Date.now()}`
    const startTime = new Date()

    try {
      const executedActions: RebalanceAction[] = []
      let totalGasUsed = 0
      let portfolioValueBefore = await this.getPortfolioValue(userAddress)

      for (const action of actions) {
        try {
          // Execute individual action
          const gasUsed = await this.executeAction(userAddress, action)
          totalGasUsed += gasUsed
          executedActions.push({ ...action, id: `${action.id}_executed` })

          // Small delay between actions to avoid rate limiting
          await new Promise((resolve) => setTimeout(resolve, 1000))
        } catch (error) {
          console.error(`Failed to execute action ${action.id}:`, error)
          // Continue with other actions
        }
      }

      const portfolioValueAfter = await this.getPortfolioValue(userAddress)

      const rebalanceHistory: RebalanceHistory = {
        id: rebalanceId,
        timestamp: startTime,
        trigger,
        actions: executedActions,
        totalGasUsed,
        portfolioValue: portfolioValueAfter,
        driftBefore: await this.calculateCurrentDrift(userAddress),
        driftAfter: await this.calculateCurrentDrift(userAddress),
        success: executedActions.length === actions.length,
      }

      this.rebalanceHistory.unshift(rebalanceHistory)

      // Keep only last 100 rebalances
      if (this.rebalanceHistory.length > 100) {
        this.rebalanceHistory = this.rebalanceHistory.slice(0, 100)
      }

      return rebalanceHistory
    } catch (error) {
      const failedHistory: RebalanceHistory = {
        id: rebalanceId,
        timestamp: startTime,
        trigger,
        actions: [],
        totalGasUsed: 0,
        portfolioValue: await this.getPortfolioValue(userAddress),
        driftBefore: await this.calculateCurrentDrift(userAddress),
        driftAfter: await this.calculateCurrentDrift(userAddress),
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }

      this.rebalanceHistory.unshift(failedHistory)
      throw error
    }
  }

  /**
   * Get current portfolio allocation
   */
  private async getCurrentPortfolio(userAddress: string, targetAllocation: PortfolioAsset[]): Promise<PortfolioAsset[]> {
    const currentPortfolio: PortfolioAsset[] = []

    for (const target of targetAllocation) {
      try {
        let currentAmount = 0

        if (target.assetId === 0) {
          // ALGO
          const accountInfo = await this.algodClient.accountInformation(userAddress).do()
          currentAmount = accountInfo.amount
        } else {
          const accountInfo = await this.algodClient.accountInformation(userAddress).do()
          const asset = accountInfo.assets?.find((a: any) => a['asset-id'] === target.assetId)
          currentAmount = asset ? asset.amount : 0
        }

        // Get current price and volatility
        const [price, volatility] = await Promise.all([this.getAssetPrice(target.assetId), this.getAssetVolatility(target.assetId)])

        currentPortfolio.push({
          ...target,
          currentAmount,
          price,
          volatility,
        })
      } catch (error) {
        console.error(`Failed to get balance for asset ${target.assetId}:`, error)
      }
    }

    return currentPortfolio
  }

  /**
   * Calculate portfolio drift from target allocation
   */
  private calculatePortfolioDrift(current: PortfolioAsset[], target: PortfolioAsset[]): number {
    let totalDrift = 0

    for (const currentAsset of current) {
      const targetAsset = target.find((t) => t.assetId === currentAsset.assetId)
      if (targetAsset) {
        const drift = Math.abs(currentAsset.currentPercentage - targetAsset.targetPercentage)
        totalDrift += drift
      }
    }

    return totalDrift / 2 // Divide by 2 because drift is counted twice (over and under)
  }

  /**
   * Generate rebalancing actions
   */
  private async generateRebalanceActions(
    current: PortfolioAsset[],
    target: PortfolioAsset[],
    strategy: RebalanceStrategy,
  ): Promise<RebalanceAction[]> {
    const actions: RebalanceAction[] = []

    for (const currentAsset of current) {
      const targetAsset = target.find((t) => t.assetId === currentAsset.assetId)
      if (!targetAsset) continue

      const currentValue = currentAsset.currentAmount * currentAsset.price
      const targetValue = this.calculateTargetValue(current, targetAsset)
      const difference = targetValue - currentValue

      // Skip if difference is below minimum trade size
      if (Math.abs(difference) < strategy.parameters.minTradeSize) {
        continue
      }

      if (difference > 0) {
        // Need to buy more
        actions.push({
          id: `buy_${currentAsset.assetId}_${Date.now()}`,
          type: 'buy',
          assetId: currentAsset.assetId,
          symbol: currentAsset.symbol,
          amount: Math.abs(difference),
          reason: `Underweight by ${(targetAsset.targetPercentage - currentAsset.currentPercentage).toFixed(2)}%`,
          priority: this.calculatePriority(Math.abs(difference)),
          estimatedImpact: await this.estimatePriceImpact(Math.abs(difference), currentAsset.assetId),
          gasEstimate: 0.003,
        })
      } else if (difference < 0) {
        // Need to sell
        actions.push({
          id: `sell_${currentAsset.assetId}_${Date.now()}`,
          type: 'sell',
          assetId: currentAsset.assetId,
          symbol: currentAsset.symbol,
          amount: Math.abs(difference),
          reason: `Overweight by ${(currentAsset.currentPercentage - targetAsset.targetPercentage).toFixed(2)}%`,
          priority: this.calculatePriority(Math.abs(difference)),
          estimatedImpact: await this.estimatePriceImpact(Math.abs(difference), currentAsset.assetId),
          gasEstimate: 0.003,
        })
      }
    }

    // Sort by priority (high to low)
    return actions.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 }
      return priorityOrder[b.priority] - priorityOrder[a.priority]
    })
  }

  /**
   * Execute individual rebalancing action
   */
  private async executeAction(userAddress: string, action: RebalanceAction): Promise<number> {
    try {
      console.log(`Executing ${action.type} ${action.symbol}: ${action.amount}`)

      switch (action.type) {
        case 'swap':
          // Execute swap through Tinyman Router
          const swapTransactions = await this.tinymanRouter.executeSwap({
            fromAssetId: action.fromAssetId || 0,
            toAssetId: action.assetId,
            amount: action.amount,
            userAddress,
            minAmountOut: action.minAmountOut,
            maxSlippage: action.maxSlippage || 0.5,
          })

          // In a real implementation, you would sign and submit these transactions
          // For now, we'll return the estimated gas cost
          return action.gasEstimate

        case 'deposit':
          // Execute deposit through Folks Finance
          const depositTransactions = await this.folksFinance.deposit({
            assetId: action.assetId,
            amount: action.amount,
            userAddress,
          })

          return action.gasEstimate

        case 'withdraw':
          // Execute withdrawal through Folks Finance
          const withdrawTransactions = await this.folksFinance.withdraw({
            assetId: action.assetId,
            amount: action.amount,
            userAddress,
          })

          return action.gasEstimate

        default:
          throw new Error(`Unknown action type: ${action.type}`)
      }
    } catch (error) {
      console.error(`Failed to execute ${action.type} action:`, error)
      throw error
    }
  }

  /**
   * Get rebalance history
   */
  getRebalanceHistory(limit: number = 10): RebalanceHistory[] {
    return this.rebalanceHistory.slice(0, limit)
  }

  /**
   * Get current portfolio drift
   */
  private async calculateCurrentDrift(userAddress: string): Promise<number> {
    // Mock implementation
    return Math.random() * 5 // Random drift between 0-5%
  }

  /**
   * Get portfolio value
   */
  private async getPortfolioValue(userAddress: string): Promise<number> {
    // Mock implementation
    return 10000 + Math.random() * 1000 // Random value between 10k-11k
  }

  /**
   * Calculate target value for an asset
   */
  private calculateTargetValue(current: PortfolioAsset[], target: PortfolioAsset): number {
    const totalValue = current.reduce((sum, asset) => sum + asset.currentAmount * asset.price, 0)
    return totalValue * (target.targetPercentage / 100)
  }

  /**
   * Calculate action priority based on amount
   */
  private calculatePriority(amount: number): 'low' | 'medium' | 'high' {
    if (amount > 1000) return 'high'
    if (amount > 100) return 'medium'
    return 'low'
  }

  /**
   * Estimate price impact of a trade using real market data
   */
  private async estimatePriceImpact(amount: number, assetId: number): Promise<number> {
    try {
      const response = await this.priceService.getAssetPrice(assetId)

      if (!response.success || !response.data) {
        // Fallback to simple calculation
        return Math.min(amount / 10000, 0.05) // Max 5% impact
      }

      // Use volume data to estimate impact
      const volume24h = response.data.volume24h
      if (volume24h === 0) return 0.05 // 5% default for unknown liquidity

      const liquidityRatio = amount / volume24h
      return Math.min(liquidityRatio * 10, 0.1) // Max 10% impact
    } catch (error) {
      console.error(`Error estimating price impact for asset ${assetId}:`, error)
      return 0.05 // 5% fallback
    }
  }

  /**
   * Get real asset price from market data
   */
  private async getAssetPrice(assetId: number): Promise<number> {
    try {
      const response = await this.priceService.getAssetPrice(assetId)

      if (!response.success || !response.data) {
        console.warn(`Failed to get price for asset ${assetId}, using fallback`)
        return 1.0 // Fallback price
      }

      return response.data.price
    } catch (error) {
      console.error(`Error fetching price for asset ${assetId}:`, error)
      return 1.0 // Fallback price
    }
  }

  /**
   * Get asset volatility based on historical price data
   */
  private async getAssetVolatility(assetId: number): Promise<number> {
    try {
      const response = await this.priceService.getAssetPrice(assetId)

      if (!response.success || !response.data) {
        // Fallback to known volatilities for major assets
        const fallbackVolatilities: { [key: number]: number } = {
          0: 0.15, // ALGO 15% volatility
          684651151: 0.01, // USDC 1% volatility
          684651152: 0.01, // USDT 1% volatility
        }
        return fallbackVolatilities[assetId] || 0.1
      }

      // Use price change as a proxy for volatility
      const priceChange = Math.abs(response.data.priceChange24h) / 100
      return Math.min(Math.max(priceChange, 0.01), 0.5) // Clamp between 1% and 50%
    } catch (error) {
      console.error(`Error fetching volatility for asset ${assetId}:`, error)
      return 0.1 // Default volatility
    }
  }
}

// Predefined rebalancing strategies
export const rebalancingStrategies: { [key: string]: RebalanceStrategy } = {
  conservative: {
    name: 'Conservative',
    description: 'Low-risk, low-frequency rebalancing',
    parameters: {
      driftThreshold: 5.0, // 5% drift before rebalancing
      maxSlippage: 0.5, // 0.5% max slippage
      rebalanceFrequency: 24, // 24 hours
      minTradeSize: 50, // 50 ALGO minimum
      maxTradeSize: 1000, // 1000 ALGO maximum
      volatilityThreshold: 0.2, // 20% volatility threshold
    },
  },
  moderate: {
    name: 'Moderate',
    description: 'Balanced risk and frequency',
    parameters: {
      driftThreshold: 3.0, // 3% drift before rebalancing
      maxSlippage: 1.0, // 1% max slippage
      rebalanceFrequency: 12, // 12 hours
      minTradeSize: 25, // 25 ALGO minimum
      maxTradeSize: 2000, // 2000 ALGO maximum
      volatilityThreshold: 0.15, // 15% volatility threshold
    },
  },
  aggressive: {
    name: 'Aggressive',
    description: 'High-frequency, tight rebalancing',
    parameters: {
      driftThreshold: 1.0, // 1% drift before rebalancing
      maxSlippage: 2.0, // 2% max slippage
      rebalanceFrequency: 6, // 6 hours
      minTradeSize: 10, // 10 ALGO minimum
      maxTradeSize: 5000, // 5000 ALGO maximum
      volatilityThreshold: 0.1, // 10% volatility threshold
    },
  },
}

export default AgenticRebalancerService
