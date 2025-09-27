// tinymanRouter.ts
// Tinyman Router integration for optimal swap routing

import {
  Algodv2,
  Transaction,
  makeAssetTransferTxnWithSuggestedParamsFromObject,
  makeApplicationCallTxnWithSuggestedParamsFromObject,
} from 'algosdk'
import { POLICY_GUARD_APP_ID } from '../../contracts/PolicyGuard'
import { TinymanApiService, TinymanTransaction } from '../api/tinymanApi'
import { PriceApiService } from '../api/priceApi'

// Tinyman Router App IDs (TestNet)
export const TINYMAN_ROUTER_APP_ID = 684651149
export const TINYMAN_POOL_APP_ID = 684651150

// Common Asset IDs
export const ALGO_ASSET_ID = 0
export const USDC_ASSET_ID = 684651151 // TestNet USDC
export const USDT_ASSET_ID = 684651152 // TestNet USDT

export interface SwapParams {
  fromAssetId: number
  toAssetId: number
  amount: number
  userAddress: string
  minAmountOut?: number
  maxSlippage?: number
}

export interface SwapQuote {
  amountIn: number
  amountOut: number
  priceImpact: number
  route: SwapRoute[]
  estimatedGas: number
}

export interface SwapRoute {
  poolId: string
  assetIn: number
  assetOut: number
  amountIn: number
  amountOut: number
  fee: number
}

export interface PoolInfo {
  poolId: string
  asset1: number
  asset2: number
  liquidity: number
  fee: number
  price: number
}

export class TinymanRouterService {
  private algodClient: Algodv2
  private policyGuardAppId: number
  private apiService: TinymanApiService
  private priceService: PriceApiService

  constructor(algodClient: Algodv2, policyGuardAppId: number = POLICY_GUARD_APP_ID) {
    this.algodClient = algodClient
    this.policyGuardAppId = policyGuardAppId
    this.apiService = new TinymanApiService()
    this.priceService = new PriceApiService()
  }

  /**
   * Get optimal swap quote
   */
  async getSwapQuote(params: SwapParams): Promise<SwapQuote> {
    const { fromAssetId, toAssetId, amount, maxSlippage = 0.5 } = params

    try {
      const response = await this.apiService.getSwapQuote(fromAssetId, toAssetId, amount, maxSlippage)

      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to get swap quote')
      }

      const apiQuote = response.data
      const quote: SwapQuote = {
        amountIn: apiQuote.amountIn,
        amountOut: apiQuote.amountOut,
        priceImpact: apiQuote.priceImpact,
        route: apiQuote.route,
        estimatedGas: apiQuote.estimatedGas,
      }

      return quote
    } catch (error) {
      throw new Error(`Failed to get swap quote: ${error}`)
    }
  }

  /**
   * Execute swap transaction
   */
  async executeSwap(params: SwapParams): Promise<Transaction[]> {
    const { fromAssetId, toAssetId, amount, userAddress, minAmountOut, maxSlippage = 0.5 } = params

    try {
      const suggestedParams = await this.algodClient.getTransactionParams().do()

      // Get swap quote first
      const quote = await this.getSwapQuote(params)

      // Create asset transfer for input asset
      const assetTransferTxn = makeAssetTransferTxnWithSuggestedParamsFromObject({
        sender: userAddress,
        receiver: 'TINYMAN_ROUTER_ADDRESS',
        amount: amount,
        assetIndex: fromAssetId,
        suggestedParams,
      })

      // Create swap transaction
      const swapTxn = makeApplicationCallTxnWithSuggestedParamsFromObject({
        sender: userAddress,
        appIndex: TINYMAN_ROUTER_APP_ID,
        appArgs: [
          new Uint8Array(Buffer.from('swap')), // method
          new Uint8Array(Buffer.from(fromAssetId.toString())), // asset in
          new Uint8Array(Buffer.from(toAssetId.toString())), // asset out
          new Uint8Array(Buffer.from(amount.toString())), // amount in
          new Uint8Array(Buffer.from((minAmountOut || quote.amountOut).toString())), // min amount out
          new Uint8Array(Buffer.from((maxSlippage * 100).toString())), // max slippage in basis points
        ],
        suggestedParams,
      })

      // Create policy guard transaction
      const policyGuardTxn = makeApplicationCallTxnWithSuggestedParamsFromObject({
        sender: userAddress,
        appIndex: this.policyGuardAppId,
        appArgs: [
          new Uint8Array(Buffer.from('enforce')), // method
        ],
        suggestedParams,
      })

      return [assetTransferTxn, swapTxn, policyGuardTxn]
    } catch (error) {
      throw new Error(`Swap execution failed: ${error}`)
    }
  }

  /**
   * Get available pools for an asset pair
   */
  async getAvailablePools(asset1: number, asset2: number): Promise<PoolInfo[]> {
    try {
      const response = await this.apiService.getPoolsForPair(asset1, asset2)

      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to fetch pools')
      }

      const pools: PoolInfo[] = response.data.map((pool) => ({
        poolId: pool.id,
        asset1: pool.asset1.id,
        asset2: pool.asset2.id,
        liquidity: pool.liquidity,
        fee: pool.fee,
        price: pool.price,
      }))

      return pools
    } catch (error) {
      throw new Error(`Failed to fetch pools: ${error}`)
    }
  }

  /**
   * Get current price for an asset pair
   */
  async getCurrentPrice(fromAssetId: number, toAssetId: number): Promise<number> {
    try {
      const response = await this.apiService.getCurrentPrice(fromAssetId, toAssetId)

      if (!response.success || response.data === undefined) {
        throw new Error(response.error || 'Failed to get current price')
      }

      return response.data
    } catch (error) {
      throw new Error(`Failed to get current price: ${error}`)
    }
  }

  /**
   * Calculate minimum amount out with slippage
   */
  calculateMinAmountOut(amountOut: number, slippagePercent: number): number {
    const slippageMultiplier = 1 - slippagePercent / 100
    return Math.floor(amountOut * slippageMultiplier)
  }

  /**
   * Calculate price impact
   */
  calculatePriceImpact(amountIn: number, poolLiquidity: number): number {
    // Simplified price impact calculation
    return (amountIn / poolLiquidity) * 100
  }

  /**
   * Validate swap parameters
   */
  validateSwapParams(params: SwapParams): boolean {
    return (
      params.amount > 0 && params.fromAssetId !== params.toAssetId && params.maxSlippage! >= 0 && params.maxSlippage! <= 10 // Max 10% slippage
    )
  }

  /**
   * Get optimal route for multi-hop swaps
   */
  async getOptimalRoute(fromAssetId: number, toAssetId: number, amount: number): Promise<SwapRoute[]> {
    try {
      const response = await this.apiService.getOptimalRoute(fromAssetId, toAssetId, amount)

      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to find optimal route')
      }

      return response.data
    } catch (error) {
      throw new Error(`Failed to find optimal route: ${error}`)
    }
  }

  /**
   * Calculate real amount out using current market prices
   */
  private async calculateRealAmountOut(fromAssetId: number, toAssetId: number, amountIn: number): Promise<number> {
    try {
      const quote = await this.priceService.getPriceQuote(fromAssetId, toAssetId, amountIn)

      if (!quote.success || !quote.data) {
        throw new Error('Failed to get price quote')
      }

      return Math.floor(quote.data.amountOut)
    } catch (error) {
      // Failed to calculate real amount out, using fallback
      // Fallback to simple 1:1 ratio for unknown assets
      return amountIn
    }
  }

  /**
   * Get transaction history for an address
   */
  async getSwapHistory(userAddress: string, limit: number = 10): Promise<TinymanTransaction[]> {
    try {
      const response = await this.apiService.getTransactionHistory(userAddress, limit)

      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to fetch swap history')
      }

      return response.data
    } catch (error) {
      throw new Error(`Failed to fetch swap history: ${error}`)
    }
  }

  /**
   * Estimate gas fees for a swap
   */
  async estimateGasFees(route: SwapRoute[]): Promise<number> {
    try {
      // Convert SwapRoute[] to TinymanRoute[]
      const tinymanRoute = route.map((r) => ({
        ...r,
        price: r.amountOut / r.amountIn, // Calculate price from amounts
      }))

      const response = await this.apiService.estimateGasFees(tinymanRoute)

      if (!response.success || response.data === undefined) {
        throw new Error(response.error || 'Failed to estimate gas fees')
      }

      return response.data
    } catch (error) {
      throw new Error(`Failed to estimate gas fees: ${error}`)
    }
  }
}

// Utility functions for Tinyman Router integration
export const tinymanRouterUtils = {
  /**
   * Format asset amount for display
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
   * Validate slippage tolerance
   */
  validateSlippage: (slippage: number): boolean => {
    return slippage >= 0 && slippage <= 10
  },

  /**
   * Get asset symbol by ID
   */
  getAssetSymbol: (assetId: number): string => {
    const symbols: { [key: number]: string } = {
      0: 'ALGO',
      684651151: 'USDC',
      684651152: 'USDT',
    }
    return symbols[assetId] || `ASA-${assetId}`
  },

  /**
   * Format price for display
   */
  formatPrice: (price: number, fromSymbol: string, toSymbol: string): string => {
    return `1 ${fromSymbol} = ${price.toFixed(6)} ${toSymbol}`
  },
}

export default TinymanRouterService
