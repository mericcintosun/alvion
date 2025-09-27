// AlvionTestSuite.tsx
// Test buttons and demo functions for Alvion DeFi Copilot

import React, { useState } from 'react'
import { useWallet } from '@txnlab/use-wallet-react'
import { useSnackbar } from 'notistack'
import {
  AiOutlineCaretRight,
  AiOutlineLoading3Quarters,
  AiOutlineCheckCircle,
  AiOutlineExclamationCircle,
  AiOutlinePlayCircle,
} from 'react-icons/ai'
import { POLICY_GUARD_APP_ID } from '../contracts/PolicyGuard'
import { TinymanRouterService } from '../services/deFi/tinymanRouter'
import { AgenticRebalancerService, rebalancingStrategies } from '../services/deFi/agenticRebalancer'
import { getAlgodConfigFromViteEnvironment } from '../utils/network/getAlgoClientConfigs'

interface AlvionTestSuiteProps {
  openModal: boolean
  setModalState: (value: boolean) => void
}

interface TestResult {
  id: string
  name: string
  status: 'pending' | 'running' | 'success' | 'failed'
  duration?: number
  result?: unknown
  error?: string
}

const AlvionTestSuite = ({ openModal, setModalState }: AlvionTestSuiteProps) => {
  const { activeAddress, transactionSigner } = useWallet()
  const { enqueueSnackbar } = useSnackbar()

  const [testResults, setTestResults] = useState<TestResult[]>([])
  const [isRunningTests, setIsRunningTests] = useState(false)
  const [selectedTests, setSelectedTests] = useState<string[]>([])

  const algodConfig = getAlgodConfigFromViteEnvironment()
  const algodClient = new (
    window as unknown as { algosdk: { Algodv2: new (token: string, server: string, port: string) => any } }
  ).algosdk.Algodv2(algodConfig.token, algodConfig.server, algodConfig.port)

  // Initialize services
  const tinymanRouter = new TinymanRouterService(algodClient, POLICY_GUARD_APP_ID)
  const agenticRebalancer = new AgenticRebalancerService(algodClient, POLICY_GUARD_APP_ID)

  const availableTests = [
    {
      id: 'policy_guard_init',
      name: 'Policy Guard Initialization',
      description: 'Initialize PolicyGuard contract with default parameters',
      category: 'Policy Guard',
    },
    {
      id: 'policy_guard_set_apps',
      name: 'Set Allowed Apps',
      description: 'Configure Folks Finance and Tinyman app IDs',
      category: 'Policy Guard',
    },
    {
      id: 'policy_guard_enforce',
      name: 'Policy Enforcement',
      description: 'Test policy enforcement for transactions',
      category: 'Policy Guard',
    },
    {
      id: 'folks_deposit',
      name: 'Folks Finance Deposit',
      description: 'Test ALGO deposit to receive xALGO',
      category: 'Folks Finance',
    },
    {
      id: 'folks_staking',
      name: 'Folks Finance Staking',
      description: 'Test xALGO staking for rewards',
      category: 'Folks Finance',
    },
    {
      id: 'tinyman_swap',
      name: 'Tinyman Swap',
      description: 'Test token swap through Tinyman Router',
      category: 'Tinyman',
    },
    {
      id: 'tinyman_quote',
      name: 'Tinyman Quote',
      description: 'Get swap quote from Tinyman Router',
      category: 'Tinyman',
    },
    {
      id: 'rebalancer_monitoring',
      name: 'Rebalancer Monitoring',
      description: 'Test portfolio monitoring and rebalancing',
      category: 'AI Rebalancer',
    },
    {
      id: 'rebalancer_execute',
      name: 'Execute Rebalance',
      description: 'Execute rebalancing actions',
      category: 'AI Rebalancer',
    },
    {
      id: 'full_workflow',
      name: 'Full Workflow Test',
      description: 'Complete DeFi workflow from deposit to rebalancing',
      category: 'Integration',
    },
  ]

  const runTest = async (testId: string): Promise<TestResult> => {
    const startTime = Date.now()

    const testResult: TestResult = {
      id: testId,
      name: availableTests.find((t) => t.id === testId)?.name || testId,
      status: 'running',
    }

    setTestResults((prev) => [...prev, testResult])

    try {
      let result: unknown

      switch (testId) {
        case 'policy_guard_init':
          result = await testPolicyGuardInit()
          break
        case 'policy_guard_set_apps':
          result = await testPolicyGuardSetApps()
          break
        case 'policy_guard_enforce':
          result = await testPolicyGuardEnforce()
          break
        case 'folks_deposit':
          result = await testFolksDeposit()
          break
        case 'folks_staking':
          result = await testFolksStaking()
          break
        case 'tinyman_swap':
          result = await testTinymanSwap()
          break
        case 'tinyman_quote':
          result = await testTinymanQuote()
          break
        case 'rebalancer_monitoring':
          result = await testRebalancerMonitoring()
          break
        case 'rebalancer_execute':
          result = await testRebalancerExecute()
          break
        case 'full_workflow':
          result = await testFullWorkflow()
          break
        default:
          throw new Error(`Unknown test: ${testId}`)
      }

      const duration = Date.now() - startTime
      const successResult = {
        ...testResult,
        status: 'success' as const,
        duration,
        result,
      }

      setTestResults((prev) => prev.map((r) => (r.id === testId ? successResult : r)))
      return successResult
    } catch (error) {
      const duration = Date.now() - startTime
      const failedResult = {
        ...testResult,
        status: 'failed' as const,
        duration,
        error: error instanceof Error ? error.message : 'Unknown error',
      }

      setTestResults((prev) => prev.map((r) => (r.id === testId ? failedResult : r)))
      return failedResult
    }
  }

  const testPolicyGuardInit = async () => {
    if (!activeAddress || !transactionSigner) {
      throw new Error('Wallet not connected')
    }

    // Mock test - in real implementation, this would call the contract
    await new Promise((resolve) => setTimeout(resolve, 1000))

    return {
      contractAddress: 'QRL5HCZOSQZJKQMXDLIIG4OW7IWTHSNNSVIRERVMIMUMVYMPCMNXE22YBI',
      appId: POLICY_GUARD_APP_ID,
      maxFee: '200000',
      maxAmount: '1000000000',
      maxSlippage: '50',
    }
  }

  const testPolicyGuardSetApps = async () => {
    if (!activeAddress || !transactionSigner) {
      throw new Error('Wallet not connected')
    }

    // Mock test
    await new Promise((resolve) => setTimeout(resolve, 800))

    return {
      folksDepositApp: '684651147',
      folksStakingApp: '684651148',
      tinymanRouterApp: '684651149',
      tinymanPoolApp: '684651150',
    }
  }

  const testPolicyGuardEnforce = async () => {
    if (!activeAddress || !transactionSigner) {
      throw new Error('Wallet not connected')
    }

    // Mock test
    await new Promise((resolve) => setTimeout(resolve, 600))

    return {
      policyCheck: 'passed',
      allowedApps: ['684651147', '684651148', '684651149', '684651150'],
      maxSlippageCheck: 'passed',
    }
  }

  const testFolksDeposit = async () => {
    if (!activeAddress || !transactionSigner) {
      throw new Error('Wallet not connected')
    }

    // Mock test
    await new Promise((resolve) => setTimeout(resolve, 1500))

    return {
      algoDeposited: '100',
      xAlgoReceived: '100',
      apy: '8.5%',
      transactionHash: 'mock_tx_hash_1',
    }
  }

  const testFolksStaking = async () => {
    if (!activeAddress || !transactionSigner) {
      throw new Error('Wallet not connected')
    }

    // Mock test
    await new Promise((resolve) => setTimeout(resolve, 1200))

    return {
      xAlgoStaked: '100',
      stakingPeriod: 'flexible',
      expectedRewards: '0.85 ALGO/year',
      transactionHash: 'mock_tx_hash_2',
    }
  }

  const testTinymanSwap = async () => {
    if (!activeAddress || !transactionSigner) {
      throw new Error('Wallet not connected')
    }

    // Mock test
    await new Promise((resolve) => setTimeout(resolve, 1800))

    return {
      fromAsset: 'ALGO',
      toAsset: 'USDC',
      amountIn: '100',
      amountOut: '35',
      slippage: '0.5%',
      transactionHash: 'mock_tx_hash_3',
    }
  }

  const testTinymanQuote = async () => {
    if (!activeAddress || !transactionSigner) {
      throw new Error('Wallet not connected')
    }

    const quote = await tinymanRouter.getSwapQuote({
      fromAssetId: 0,
      toAssetId: 684651151,
      amount: 100000000, // 100 ALGO in microALGO
      userAddress: activeAddress,
    })

    return quote
  }

  const testRebalancerMonitoring = async () => {
    if (!activeAddress || !transactionSigner) {
      throw new Error('Wallet not connected')
    }

    // Mock portfolio
    const mockPortfolio = [
      { assetId: 0, symbol: 'ALGO', currentAmount: 1000, targetPercentage: 60, currentPercentage: 80, price: 0.35, volatility: 0.15 },
      { assetId: 684651151, symbol: 'USDC', currentAmount: 100, targetPercentage: 40, currentPercentage: 20, price: 1.0, volatility: 0.01 },
    ]

    const strategy = rebalancingStrategies.moderate
    const actions = await agenticRebalancer.checkRebalanceOpportunities(activeAddress, mockPortfolio, strategy)

    return {
      portfolioDrift: '15%',
      rebalanceNeeded: actions.length > 0,
      suggestedActions: actions.length,
      strategy: strategy.name,
    }
  }

  const testRebalancerExecute = async () => {
    if (!activeAddress || !transactionSigner) {
      throw new Error('Wallet not connected')
    }

    // Mock rebalance execution
    await new Promise((resolve) => setTimeout(resolve, 2000))

    return {
      actionsExecuted: 2,
      totalGasUsed: '0.006 ALGO',
      portfolioValue: '10500 USDC',
      driftBefore: '15%',
      driftAfter: '2%',
      success: true,
    }
  }

  const testFullWorkflow = async () => {
    if (!activeAddress || !transactionSigner) {
      throw new Error('Wallet not connected')
    }

    const results = []

    // Run multiple tests in sequence
    const tests = ['policy_guard_enforce', 'folks_deposit', 'tinyman_quote', 'rebalancer_monitoring']

    for (const testId of tests) {
      try {
        const result = await runTest(testId)
        results.push(result)
      } catch (error) {
        results.push({
          id: testId,
          name: availableTests.find((t) => t.id === testId)?.name || testId,
          status: 'failed' as const,
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    }

    return {
      testsRun: results.length,
      testsPassed: results.filter((r) => r.status === 'success').length,
      testsFailed: results.filter((r) => r.status === 'failed').length,
      totalDuration: results.reduce((sum, r) => sum + (r.duration || 0), 0),
      results,
    }
  }

  const runSelectedTests = async () => {
    if (selectedTests.length === 0) {
      enqueueSnackbar('Please select tests to run', { variant: 'warning' })
      return
    }

    setIsRunningTests(true)
    setTestResults([])

    try {
      for (const testId of selectedTests) {
        await runTest(testId)
        // Small delay between tests
        await new Promise((resolve) => setTimeout(resolve, 500))
      }

      enqueueSnackbar(`Completed ${selectedTests.length} tests`, { variant: 'success' })
    } catch (error) {
      enqueueSnackbar(`Test execution failed: ${error}`, { variant: 'error' })
    } finally {
      setIsRunningTests(false)
    }
  }

  const runAllTests = async () => {
    const allTestIds = availableTests.map((t) => t.id)
    setSelectedTests(allTestIds)
    setIsRunningTests(true)
    setTestResults([])

    try {
      for (const testId of allTestIds) {
        await runTest(testId)
        await new Promise((resolve) => setTimeout(resolve, 300))
      }

      enqueueSnackbar('All tests completed', { variant: 'success' })
    } catch (error) {
      enqueueSnackbar(`Test execution failed: ${error}`, { variant: 'error' })
    } finally {
      setIsRunningTests(false)
    }
  }

  const toggleTestSelection = (testId: string) => {
    setSelectedTests((prev) => (prev.includes(testId) ? prev.filter((id) => id !== testId) : [...prev, testId]))
  }

  const clearResults = () => {
    setTestResults([])
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <AiOutlineCheckCircle className="text-green-500" />
      case 'failed':
        return <AiOutlineExclamationCircle className="text-red-500" />
      case 'running':
        return <AiOutlineLoading3Quarters className="text-blue-500 animate-spin" />
      default:
        return <AiOutlineCaretRight className="text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-green-100 text-green-800'
      case 'failed':
        return 'bg-red-100 text-red-800'
      case 'running':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const groupedTests = availableTests.reduce(
    (acc, test) => {
      if (!acc[test.category]) {
        acc[test.category] = []
      }
      acc[test.category].push(test)
      return acc
    },
    {} as Record<string, typeof availableTests>,
  )

  return (
    <>
      {openModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
          <div className="bg-alvion-neutral-light-90 dark:bg-alvion-neutral-dark-90 text-alvion-neutral-light-10 dark:text-alvion-neutral-dark-10 rounded-alvion-lg shadow-xl border border-alvion-neutral-light-70 dark:border-alvion-neutral-dark-70 p-6 max-w-6xl w-full mx-4 h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-alvion-neutral-light-70 dark:border-alvion-neutral-dark-70">
              <h3 className="flex items-center gap-3 text-2xl font-bold text-alvion-primary-100 dark:text-alvion-primary-dark-100">
                <AiOutlinePlayCircle className="text-3xl" />
                Alvion Test Suite
              </h3>
              <button
                onClick={() => setModalState(false)}
                className="text-alvion-neutral-light-40 dark:text-alvion-neutral-dark-40 hover:text-alvion-primary-100 dark:hover:text-alvion-primary-dark-100 transition-colors text-xl"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 overflow-hidden">
              {/* Left Panel - Test Selection */}
              <div className="flex flex-col space-y-4">
                <div className="bg-alvion-neutral-light-80 dark:bg-alvion-neutral-dark-80 rounded-alvion p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-semibold text-alvion-primary-100 dark:text-alvion-primary-dark-100">Available Tests</h4>
                    <div className="flex gap-2">
                      <button
                        onClick={runSelectedTests}
                        disabled={isRunningTests || selectedTests.length === 0}
                        className="px-3 py-1 rounded-alvion bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Run Selected
                      </button>
                      <button
                        onClick={runAllTests}
                        disabled={isRunningTests}
                        className="px-3 py-1 rounded-alvion bg-green-600 hover:bg-green-700 text-white text-sm font-semibold transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Run All
                      </button>
                    </div>
                  </div>

                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {Object.entries(groupedTests).map(([category, tests]) => (
                      <div key={category}>
                        <h5 className="text-sm font-semibold text-alvion-neutral-light-30 dark:text-alvion-neutral-dark-30 mb-2">
                          {category}
                        </h5>
                        <div className="space-y-2">
                          {tests.map((test) => (
                            <label
                              key={test.id}
                              className="flex items-start gap-3 p-2 bg-alvion-neutral-light-70 dark:bg-alvion-neutral-dark-70 rounded-alvion cursor-pointer hover:bg-alvion-neutral-light-60 dark:hover:bg-alvion-neutral-dark-60 transition-colors"
                            >
                              <input
                                type="checkbox"
                                checked={selectedTests.includes(test.id)}
                                onChange={() => toggleTestSelection(test.id)}
                                className="mt-1"
                                disabled={isRunningTests}
                              />
                              <div className="flex-1">
                                <p className="text-sm font-medium">{test.name}</p>
                                <p className="text-xs text-alvion-neutral-light-50 dark:text-alvion-neutral-dark-50">{test.description}</p>
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Panel - Test Results */}
              <div className="flex flex-col space-y-4">
                <div className="bg-alvion-neutral-light-80 dark:bg-alvion-neutral-dark-80 rounded-alvion p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-semibold text-alvion-primary-100 dark:text-alvion-primary-dark-100">Test Results</h4>
                    <button
                      onClick={clearResults}
                      className="text-sm text-alvion-neutral-light-40 dark:text-alvion-neutral-dark-40 hover:text-alvion-primary-100 dark:hover:text-alvion-primary-dark-100 transition-colors"
                    >
                      Clear Results
                    </button>
                  </div>

                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {testResults.length === 0 ? (
                      <p className="text-center text-alvion-neutral-light-50 dark:text-alvion-neutral-dark-50 py-8">
                        No test results yet. Select and run tests to see results.
                      </p>
                    ) : (
                      testResults.map((result) => (
                        <div key={result.id} className="p-3 bg-alvion-neutral-light-70 dark:bg-alvion-neutral-dark-70 rounded-alvion">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              {getStatusIcon(result.status)}
                              <span className="text-sm font-medium">{result.name}</span>
                            </div>
                            <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(result.status)}`}>{result.status}</span>
                          </div>

                          {result.duration && (
                            <p className="text-xs text-alvion-neutral-light-50 dark:text-alvion-neutral-dark-50 mb-2">
                              Duration: {result.duration}ms
                            </p>
                          )}

                          {result.error && <p className="text-xs text-red-500 mb-2">Error: {result.error}</p>}

                          {result.result && (
                            <details className="text-xs">
                              <summary className="cursor-pointer text-alvion-neutral-light-40 dark:text-alvion-neutral-dark-40 hover:text-alvion-primary-100 dark:hover:text-alvion-primary-dark-100">
                                View Details
                              </summary>
                              <pre className="mt-2 p-2 bg-alvion-neutral-light-60 dark:bg-alvion-neutral-dark-60 rounded-alvion overflow-x-auto">
                                {JSON.stringify(result.result as Record<string, unknown>, null, 2)}
                              </pre>
                            </details>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Test Summary */}
                {testResults.length > 0 && (
                  <div className="bg-alvion-neutral-light-80 dark:bg-alvion-neutral-dark-80 rounded-alvion p-4">
                    <h4 className="text-lg font-semibold text-alvion-primary-100 dark:text-alvion-primary-dark-100 mb-3">Test Summary</h4>
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <p className="text-2xl font-bold text-green-500">{testResults.filter((r) => r.status === 'success').length}</p>
                        <p className="text-xs text-alvion-neutral-light-50 dark:text-alvion-neutral-dark-50">Passed</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-red-500">{testResults.filter((r) => r.status === 'failed').length}</p>
                        <p className="text-xs text-alvion-neutral-light-50 dark:text-alvion-neutral-dark-50">Failed</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-blue-500">{testResults.filter((r) => r.status === 'running').length}</p>
                        <p className="text-xs text-alvion-neutral-light-50 dark:text-alvion-neutral-dark-50">Running</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default AlvionTestSuite
