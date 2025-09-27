// folksFinance.ts
// Folks Finance integration for xALGO staking and lending

import {
  Algodv2,
  Transaction,
  SuggestedParams,
  makePaymentTxnWithSuggestedParamsFromObject,
  makeApplicationCallTxnWithSuggestedParamsFromObject,
  makeAssetTransferTxnWithSuggestedParamsFromObject,
} from 'algosdk'
import { POLICY_GUARD_APP_ID } from '../../contracts/PolicyGuard'
import { FolksFinanceApiService } from '../api/folksFinanceApi'

// Folks Finance App IDs (TestNet)
export const FOLKS_DEPOSIT_APP_ID = 684651147
export const FOLKS_STAKING_APP_ID = 684651148

// Asset IDs
export const ALGO_ASSET_ID = 0
export const xALGO_ASSET_ID = 684651147 // TestNet xALGO

export interface FolksDepositParams {
  amount: number
  userAddress: string
  maxSlippage?: number
}

export interface FolksStakingParams {
  xAlgoAmount: number
  userAddress: string
  stakingPeriod?: 'flexible' | 'locked'
}

export interface FolksLendingParams {
  assetId: number
  amount: number
  userAddress: string
  collateralRatio?: number
}

export class FolksFinanceService {
  private algodClient: Algodv2
  private policyGuardAppId: number
  private apiService: FolksFinanceApiService

  constructor(algodClient: Algodv2, policyGuardAppId: number = POLICY_GUARD_APP_ID) {
    this.algodClient = algodClient
    this.policyGuardAppId = policyGuardAppId
    this.apiService = new FolksFinanceApiService()
  }

  /**
   * Deposit ALGO to Folks Finance and receive xALGO
   */
  async depositAlgo(params: FolksDepositParams): Promise<Transaction[]> {
    const { amount, userAddress, maxSlippage = 0.5 } = params

    try {
      // Get suggested parameters
      const suggestedParams = await this.algodClient.getTransactionParams().do()

      // Create payment transaction for ALGO
      const paymentTxn = makePaymentTxnWithSuggestedParamsFromObject({
        sender: userAddress,
        receiver: 'ALGO_ADDRESS_FOR_FOLKS', // Folks Finance ALGO address
        amount: amount,
        suggestedParams,
      })

      // Create deposit transaction
      const depositTxn = makeApplicationCallTxnWithSuggestedParamsFromObject({
        sender: userAddress,
        appIndex: FOLKS_DEPOSIT_APP_ID,
        appArgs: [
          new Uint8Array(Buffer.from('deposit')), // method
          new Uint8Array(Buffer.from(amount.toString())), // amount
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

      return [paymentTxn, depositTxn, policyGuardTxn]
    } catch (error) {
      throw new Error(`Folks Finance deposit failed: ${error}`)
    }
  }

  /**
   * Stake xALGO for rewards
   */
  async stakeXAlgo(params: FolksStakingParams): Promise<Transaction[]> {
    const { xAlgoAmount, userAddress, stakingPeriod = 'flexible' } = params

    try {
      const suggestedParams = await this.algodClient.getTransactionParams().do()

      // Create asset transfer for xALGO
      const assetTransferTxn = makeAssetTransferTxnWithSuggestedParamsFromObject({
        sender: userAddress,
        receiver: 'FOLKS_STAKING_ADDRESS', // Folks staking address
        amount: xAlgoAmount,
        assetIndex: xALGO_ASSET_ID,
        suggestedParams,
      })

      // Create staking transaction
      const stakeTxn = makeApplicationCallTxnWithSuggestedParamsFromObject({
        sender: userAddress,
        appIndex: FOLKS_STAKING_APP_ID,
        appArgs: [
          new Uint8Array(Buffer.from('stake')), // method
          new Uint8Array(Buffer.from(xAlgoAmount.toString())), // amount
          new Uint8Array(Buffer.from(stakingPeriod)), // staking period
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

      return [assetTransferTxn, stakeTxn, policyGuardTxn]
    } catch (error) {
      throw new Error(`Folks Finance staking failed: ${error}`)
    }
  }

  /**
   * Get current APY for xALGO staking
   */
  async getCurrentAPY(): Promise<number> {
    try {
      const response = await this.apiService.getCurrentAPY(xALGO_ASSET_ID)
      if (response.success && response.data !== undefined) {
        return response.data
      }
      throw new Error(response.error || 'Failed to fetch APY')
    } catch (error) {
      throw new Error(`Failed to fetch APY: ${error}`)
    }
  }

  /**
   * Get user's xALGO balance
   */
  async getXAlgoBalance(userAddress: string): Promise<number> {
    try {
      const accountInfo = await this.algodClient.accountInformation(userAddress).do()

      const xAlgoAsset = accountInfo.assets?.find((asset: any) => asset['asset-id'] === xALGO_ASSET_ID)
      return xAlgoAsset ? Number(xAlgoAsset.amount) : 0
    } catch (error) {
      throw new Error(`Failed to fetch xALGO balance: ${error}`)
    }
  }

  /**
   * Get user's staked amount from Folks Finance
   */
  async getStakedAmount(userAddress: string): Promise<number> {
    try {
      const response = await this.apiService.getUserPositions(userAddress)

      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to fetch user position')
      }

      // Find ALGO position and return staked amount
      const algoPosition = response.data.find((pos: any) => pos.assetId === 0)
      return algoPosition ? algoPosition.supplied : 0
    } catch (error) {
      throw new Error(`Failed to fetch staked amount: ${error}`)
    }
  }

  /**
   * Calculate expected xALGO amount from ALGO deposit
   */
  async calculateXAlgoAmount(algoAmount: number): Promise<number> {
    try {
      const response = await this.apiService.getDepositQuote(ALGO_ASSET_ID, xALGO_ASSET_ID, algoAmount)
      if (response.success && response.data) {
        return response.data.amountOut
      }
      throw new Error(response.error || 'Failed to calculate xALGO amount')
    } catch (error) {
      throw new Error(`Failed to calculate xALGO amount: ${error}`)
    }
  }

  /**
   * Withdraw from Folks Finance
   */
  async withdraw(params: { assetId: number; amount: number; userAddress: string }): Promise<Transaction[]> {
    const { assetId, amount, userAddress } = params

    try {
      // Get suggested parameters
      const suggestedParams = await this.algodClient.getTransactionParams().do()

      // Create withdraw transaction
      const withdrawTxn = makeApplicationCallTxnWithSuggestedParamsFromObject({
        sender: userAddress,
        appIndex: FOLKS_DEPOSIT_APP_ID,
        appArgs: [
          new Uint8Array(Buffer.from('withdraw')), // method
          new Uint8Array(Buffer.from(amount.toString())), // amount
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

      return [withdrawTxn, policyGuardTxn]
    } catch (error) {
      throw new Error(`Folks Finance withdrawal failed: ${error}`)
    }
  }

  /**
   * Get liquidation threshold for lending positions
   */
  async getLiquidationThreshold(assetId: number): Promise<number> {
    try {
      const response = await this.apiService.getLiquidationThreshold(assetId)
      if (response.success && response.data !== undefined) {
        return response.data * 100 // Convert to percentage
      }
      throw new Error(response.error || 'Failed to fetch liquidation threshold')
    } catch (error) {
      throw new Error(`Failed to fetch liquidation threshold: ${error}`)
    }
  }
}

// Utility functions for Folks Finance integration
export const folksFinanceUtils = {
  /**
   * Convert ALGO to microALGO
   */
  algoToMicroAlgo: (algo: number): number => {
    return Math.floor(algo * 1000000)
  },

  /**
   * Convert microALGO to ALGO
   */
  microAlgoToAlgo: (microAlgo: number): number => {
    return microAlgo / 1000000
  },

  /**
   * Calculate slippage in basis points
   */
  calculateSlippageBps: (slippagePercent: number): number => {
    return Math.floor(slippagePercent * 100)
  },

  /**
   * Validate deposit amount
   */
  validateDepositAmount: (amount: number): boolean => {
    return amount > 0 && amount <= 1000000 // Max 1M ALGO for safety
  },

  /**
   * Format APY for display
   */
  formatAPY: (apy: number): string => {
    return `${apy.toFixed(2)}% APY`
  },
}

export default FolksFinanceService
