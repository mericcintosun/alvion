// AlvionDeFiCopilot.tsx
// DeFi Copilot + Agentic Rebalancer component
// Türkçe talimat girişi ve AI-powered portfolio management

import React, { useState, useEffect } from 'react'
import { useWallet } from '@txnlab/use-wallet-react'
import { useSnackbar } from 'notistack'
import {
  AiOutlineSend,
  AiOutlineLoading3Quarters,
  AiOutlineRobot,
  AiOutlineWallet,
  AiOutlineRise,
  AiOutlineSafety,
  AiOutlineSync,
  AiOutlineCheckCircle,
} from 'react-icons/ai'
import { POLICY_GUARD_APP_ID } from '../contracts/PolicyGuard'

interface AlvionDeFiCopilotProps {
  openModal: boolean
  setModalState: (value: boolean) => void
}

interface TransactionStep {
  id: string
  type: 'folks_deposit' | 'folks_staking' | 'tinyman_swap' | 'policy_check'
  description: string
  status: 'pending' | 'preview' | 'approved' | 'completed' | 'failed'
  details?: any
  estimatedGas?: number
  slippage?: number
}

interface PortfolioAllocation {
  asset: string
  currentAmount: number
  targetPercentage: number
  currentPercentage: number
  action?: 'buy' | 'sell' | 'stake' | 'unstake'
  amount?: number
}

const AlvionDeFiCopilot = ({ openModal, setModalState }: AlvionDeFiCopilotProps) => {
  const { activeAddress, transactionSigner } = useWallet()
  const { enqueueSnackbar } = useSnackbar()

  const [userInstruction, setUserInstruction] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [transactionSteps, setTransactionSteps] = useState<TransactionStep[]>([])
  const [portfolioAllocation, setPortfolioAllocation] = useState<PortfolioAllocation[]>([])
  const [previewMode, setPreviewMode] = useState(false)
  const [isRebalancing, setIsRebalancing] = useState(false)
  const [rebalanceHistory, setRebalanceHistory] = useState<any[]>([])

  // Demo portfolio data
  const [demoPortfolio] = useState<PortfolioAllocation[]>([
    { asset: 'ALGO', currentAmount: 1000, targetPercentage: 60, currentPercentage: 80, action: 'sell', amount: 200 },
    { asset: 'xALGO', currentAmount: 0, targetPercentage: 40, currentPercentage: 0, action: 'buy', amount: 400 },
    { asset: 'USDC', currentAmount: 100, targetPercentage: 0, currentPercentage: 20, action: 'sell', amount: 100 },
  ])

  useEffect(() => {
    if (openModal) {
      setPortfolioAllocation(demoPortfolio)
    }
  }, [openModal, demoPortfolio])

  const processNaturalLanguageInstruction = async (instruction: string) => {
    setIsAnalyzing(true)

    try {
      // Simulate AI analysis of Turkish instruction
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // Parse common Turkish DeFi instructions
      const lowerInstruction = instruction.toLowerCase()
      const steps: TransactionStep[] = []

      if (lowerInstruction.includes('faiz') || lowerInstruction.includes('faize')) {
        steps.push({
          id: '1',
          type: 'folks_deposit',
          description: "ALGO'ları Folks Finance'e yatır",
          status: 'preview',
          estimatedGas: 0.002,
          details: { amount: 800, targetYield: '8.5% APY' },
        })

        steps.push({
          id: '2',
          type: 'folks_staking',
          description: 'xALGO stake et',
          status: 'preview',
          estimatedGas: 0.001,
          details: { amount: 800, stakingPeriod: 'Flexible' },
        })
      }

      if (lowerInstruction.includes('swap') || lowerInstruction.includes('çevir') || lowerInstruction.includes('değiştir')) {
        steps.push({
          id: '3',
          type: 'tinyman_swap',
          description: 'Tinyman ile token swap',
          status: 'preview',
          estimatedGas: 0.003,
          slippage: 0.5,
          details: { from: 'ALGO', to: 'USDC', amount: 200 },
        })
      }

      // Add policy guard check
      steps.push({
        id: '4',
        type: 'policy_check',
        description: 'Policy Guard ile güvenlik kontrolü',
        status: 'preview',
        estimatedGas: 0.001,
      })

      setTransactionSteps(steps)
      setPreviewMode(true)
    } catch (error) {
      enqueueSnackbar('Talimat analiz edilirken hata oluştu', { variant: 'error' })
    } finally {
      setIsAnalyzing(false)
    }
  }

  const executeTransactions = async () => {
    if (!activeAddress || !transactionSigner) {
      enqueueSnackbar('Cüzdan bağlantısı gerekli', { variant: 'error' })
      return
    }

    setIsProcessing(true)

    try {
      // Simulate transaction execution
      for (let i = 0; i < transactionSteps.length; i++) {
        const step = transactionSteps[i]

        // Update step status to approved
        setTransactionSteps((prev) => prev.map((s) => (s.id === step.id ? { ...s, status: 'approved' } : s)))

        // Simulate transaction processing
        await new Promise((resolve) => setTimeout(resolve, 1500))

        // Update step status to completed
        setTransactionSteps((prev) => prev.map((s) => (s.id === step.id ? { ...s, status: 'completed' } : s)))

        enqueueSnackbar(`${step.description} tamamlandı`, { variant: 'success' })
      }

      // Start monitoring for rebalancing
      setIsRebalancing(true)
      enqueueSnackbar('Portföy izleme başlatıldı', { variant: 'info' })
    } catch (error) {
      enqueueSnackbar('İşlemler sırasında hata oluştu', { variant: 'error' })
    } finally {
      setIsProcessing(false)
    }
  }

  const simulateRebalance = () => {
    const rebalanceAction = {
      id: Date.now().toString(),
      timestamp: new Date(),
      trigger: 'Portfolio drift detected',
      action: 'Minor rebalance executed',
      details: 'ALGO price increased 2.3%, executed small rebalance',
    }

    setRebalanceHistory((prev) => [rebalanceAction, ...prev])
    enqueueSnackbar('Otomatik rebalans gerçekleştirildi', { variant: 'info' })
  }

  const handleSubmit = () => {
    if (!userInstruction.trim()) {
      enqueueSnackbar('Lütfen bir talimat girin', { variant: 'warning' })
      return
    }

    processNaturalLanguageInstruction(userInstruction)
  }

  const getStepIcon = (type: string) => {
    switch (type) {
      case 'folks_deposit':
        return <AiOutlineWallet className="text-blue-500" />
      case 'folks_staking':
        return <AiOutlineRise className="text-green-500" />
      case 'tinyman_swap':
        return <AiOutlineSync className="text-purple-500" />
      case 'policy_check':
        return <AiOutlineSafety className="text-orange-500" />
      default:
        return <AiOutlineRobot />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-500'
      case 'approved':
        return 'text-blue-500'
      case 'preview':
        return 'text-yellow-500'
      case 'failed':
        return 'text-red-500'
      default:
        return 'text-gray-500'
    }
  }

  return (
    <>
      {openModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
          <div className="bg-alvion-neutral-light-90 dark:bg-alvion-neutral-dark-90 text-alvion-neutral-light-10 dark:text-alvion-neutral-dark-10 rounded-alvion-lg shadow-xl border border-alvion-neutral-light-70 dark:border-alvion-neutral-dark-70 p-6 max-w-6xl w-full mx-4 h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-alvion-neutral-light-70 dark:border-alvion-neutral-dark-70">
              <h3 className="flex items-center gap-3 text-2xl font-bold text-alvion-primary-100 dark:text-alvion-primary-dark-100">
                <AiOutlineRobot className="text-3xl" />
                Alvion DeFi Copilot
              </h3>
              <button
                onClick={() => setModalState(false)}
                className="text-alvion-neutral-light-40 dark:text-alvion-neutral-dark-40 hover:text-alvion-primary-100 dark:hover:text-alvion-primary-dark-100 transition-colors text-xl"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 overflow-hidden">
              {/* Left Panel - Input & Preview */}
              <div className="flex flex-col space-y-4">
                {/* Natural Language Input */}
                <div className="bg-alvion-neutral-light-80 dark:bg-alvion-neutral-dark-80 rounded-alvion p-4">
                  <h4 className="text-lg font-semibold mb-3 text-alvion-primary-100 dark:text-alvion-primary-dark-100">
                    Türkçe Talimat Girişi
                  </h4>
                  <div className="space-y-3">
                    <textarea
                      value={userInstruction}
                      onChange={(e) => setUserInstruction(e.target.value)}
                      placeholder="Örnek: ALGO'larımı faize bağla, riski %5'i aşma..."
                      className="w-full p-3 bg-alvion-neutral-light-70 dark:bg-alvion-neutral-dark-70 text-alvion-neutral-light-10 dark:text-alvion-neutral-dark-10 border border-alvion-neutral-light-60 dark:border-alvion-neutral-dark-60 focus:outline-none focus:border-alvion-primary-100 dark:focus:border-alvion-primary-dark-100 rounded-alvion resize-none"
                      rows={3}
                      disabled={isAnalyzing || isProcessing}
                    />
                    <button
                      onClick={handleSubmit}
                      disabled={!userInstruction.trim() || isAnalyzing || isProcessing}
                      className="w-full py-2 rounded-alvion bg-alvion-primary-100 hover:bg-alvion-primary-90 text-white font-semibold transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isAnalyzing ? (
                        <>
                          <AiOutlineLoading3Quarters className="animate-spin" />
                          Analiz Ediliyor...
                        </>
                      ) : (
                        <>
                          <AiOutlineSend />
                          Talimatı İşle
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Transaction Steps Preview */}
                {previewMode && (
                  <div className="bg-alvion-neutral-light-80 dark:bg-alvion-neutral-dark-80 rounded-alvion p-4">
                    <h4 className="text-lg font-semibold mb-3 text-alvion-primary-100 dark:text-alvion-primary-dark-100">İşlem Planı</h4>
                    <div className="space-y-3">
                      {transactionSteps.map((step) => (
                        <div
                          key={step.id}
                          className="flex items-center gap-3 p-3 bg-alvion-neutral-light-70 dark:bg-alvion-neutral-dark-70 rounded-alvion"
                        >
                          {getStepIcon(step.type)}
                          <div className="flex-1">
                            <p className="text-sm font-medium">{step.description}</p>
                            {step.estimatedGas && (
                              <p className="text-xs text-alvion-neutral-light-50 dark:text-alvion-neutral-dark-50">
                                Tahmini Gas: {step.estimatedGas} ALGO
                              </p>
                            )}
                          </div>
                          <span className={`text-sm font-medium ${getStatusColor(step.status)}`}>
                            {step.status === 'preview' && 'Önizleme'}
                            {step.status === 'approved' && 'Onaylandı'}
                            {step.status === 'completed' && 'Tamamlandı'}
                          </span>
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={executeTransactions}
                      disabled={isProcessing}
                      className="w-full mt-4 py-2 rounded-alvion bg-green-600 hover:bg-green-700 text-white font-semibold transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isProcessing ? (
                        <>
                          <AiOutlineLoading3Quarters className="animate-spin" />
                          İşlemler Yürütülüyor...
                        </>
                      ) : (
                        <>
                          <AiOutlineCheckCircle />
                          Tüm İşlemleri Onayla
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>

              {/* Right Panel - Portfolio & Monitoring */}
              <div className="flex flex-col space-y-4">
                {/* Portfolio Allocation */}
                <div className="bg-alvion-neutral-light-80 dark:bg-alvion-neutral-dark-80 rounded-alvion p-4">
                  <h4 className="text-lg font-semibold mb-3 text-alvion-primary-100 dark:text-alvion-primary-dark-100">Portföy Dağılımı</h4>
                  <div className="space-y-2">
                    {portfolioAllocation.map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2 bg-alvion-neutral-light-70 dark:bg-alvion-neutral-dark-70 rounded-alvion"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{item.asset}</span>
                          {item.action && (
                            <span
                              className={`text-xs px-2 py-1 rounded-full ${
                                item.action === 'buy'
                                  ? 'bg-green-100 text-green-800'
                                  : item.action === 'sell'
                                    ? 'bg-red-100 text-red-800'
                                    : 'bg-blue-100 text-blue-800'
                              }`}
                            >
                              {item.action === 'buy' ? 'AL' : item.action === 'sell' ? 'SAT' : 'STAKE'}
                            </span>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-sm">{item.currentAmount}</p>
                          <p className="text-xs text-alvion-neutral-light-50 dark:text-alvion-neutral-dark-50">
                            {item.currentPercentage}% → {item.targetPercentage}%
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Agentic Rebalancer */}
                <div className="bg-alvion-neutral-light-80 dark:bg-alvion-neutral-dark-80 rounded-alvion p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-lg font-semibold text-alvion-primary-100 dark:text-alvion-primary-dark-100">AI Rebalancer</h4>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${isRebalancing ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
                      <span className="text-xs text-alvion-neutral-light-50 dark:text-alvion-neutral-dark-50">
                        {isRebalancing ? 'Aktif' : 'Pasif'}
                      </span>
                    </div>
                  </div>

                  {isRebalancing && (
                    <div className="space-y-3">
                      <button
                        onClick={simulateRebalance}
                        className="w-full py-2 rounded-alvion bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-colors duration-200 flex items-center justify-center gap-2"
                      >
                        <AiOutlineSync />
                        Demo Rebalans
                      </button>

                      {rebalanceHistory.length > 0 && (
                        <div className="max-h-32 overflow-y-auto space-y-2">
                          {rebalanceHistory.slice(0, 3).map((item) => (
                            <div
                              key={item.id}
                              className="p-2 bg-alvion-neutral-light-70 dark:bg-alvion-neutral-dark-70 rounded-alvion text-xs"
                            >
                              <p className="font-medium">{item.action}</p>
                              <p className="text-alvion-neutral-light-50 dark:text-alvion-neutral-dark-50">
                                {item.timestamp.toLocaleTimeString()}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default AlvionDeFiCopilot
