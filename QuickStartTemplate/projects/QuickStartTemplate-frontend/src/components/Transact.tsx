// Transact.tsx
// Simple payment component: send 1 ALGO or 1 USDC from connected wallet → receiver address.
// Uses Algokit + wallet connector. Designed for TestNet demos.

import { algo, AlgorandClient } from '@algorandfoundation/algokit-utils'
import { useWallet } from '@txnlab/use-wallet-react'
import { useSnackbar } from 'notistack'
import { useState } from 'react'
import { AiOutlineLoading3Quarters, AiOutlineSend } from 'react-icons/ai'
import { getAlgodConfigFromViteEnvironment } from '../utils/network/getAlgoClientConfigs'

interface TransactInterface {
  openModal: boolean
  setModalState: (value: boolean) => void
}

const Transact = ({ openModal, setModalState }: TransactInterface) => {
  // UI state
  const [loading, setLoading] = useState<boolean>(false)
  const [receiverAddress, setReceiverAddress] = useState<string>('')
  const [assetType, setAssetType] = useState<'ALGO' | 'USDC'>('ALGO') // toggle between ALGO and USDC

  // Algorand client setup (TestNet by default from env)
  const algodConfig = getAlgodConfigFromViteEnvironment()
  const algorand = AlgorandClient.fromConfig({ algodConfig })

  // Wallet + notifications
  const { enqueueSnackbar } = useSnackbar()
  const { transactionSigner, activeAddress } = useWallet()

  // USDC constants (TestNet ASA)
  const usdcAssetId = 10458941n
  const usdcDecimals = 6

  // ------------------------------
  // Handle sending payment
  // ------------------------------
  const handleSubmit = async () => {
    setLoading(true)

    // Guard: wallet must be connected
    if (!transactionSigner || !activeAddress) {
      enqueueSnackbar('Please connect wallet first', { variant: 'warning' })
      return
    }

    try {
      enqueueSnackbar(`Sending ${assetType} transaction...`, { variant: 'info' })

      if (assetType === 'ALGO') {
        // Send 1 ALGO
        const result = await algorand.send.payment({
          signer: transactionSigner,
          sender: activeAddress,
          receiver: receiverAddress,
          amount: algo(1),
        })
        enqueueSnackbar(`✅ 1 ALGO sent! TxID: ${result.txIds[0]}`, { variant: 'success' })
      } else {
        // Send 1 USDC (convert to base units: 1 * 10^decimals)
        const usdcAmount = 1n * 10n ** BigInt(usdcDecimals)
        const result = await algorand.send.assetTransfer({
          signer: transactionSigner,
          sender: activeAddress,
          receiver: receiverAddress,
          assetId: usdcAssetId,
          amount: usdcAmount,
        })
        enqueueSnackbar(`✅ 1 USDC sent! TxID: ${result.txIds[0]}`, { variant: 'success' })
      }

      // Reset form
      setReceiverAddress('')

      // -----------------------------------------------------
      // Group transaction example (covered in Session 6)
      // This shows payment + asset opt-in + asset transfer
      // -----------------------------------------------------
      /*
      const groupTx = algorand.newGroup()

      groupTx.addPayment({
        signer: account1!.signer,
        sender: account1!.addr,
        receiver: account2!.addr,
        amount: algo(0.20),
        staticFee: algo(0.003),
      })

      groupTx.addAssetOptIn({
        signer: account2!.signer,
        sender: account2!.addr,
        assetId: usdcAssetId, // 10458941n
        staticFee: algo(0),
      })

      groupTx.addAssetTransfer({
        signer: account1!.signer,
        sender: account1!.addr,
        assetId: usdcAssetId,
        amount: BigInt(0.1 * 10 ** usdcDecimals),
        receiver: account2!.addr,
        staticFee: algo(0),
      })

      const txResult = await groupTx.send()
      */
    } catch (e) {
      console.error(e)
      enqueueSnackbar(`Failed to send ${assetType}`, { variant: 'error' })
    }

    setLoading(false)
  }

  // ------------------------------
  // Modal UI
  // ------------------------------
  return (
    <>
      {openModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
          <div className="bg-alvion-neutral-light-90 dark:bg-alvion-neutral-dark-90 text-alvion-neutral-light-10 dark:text-alvion-neutral-dark-10 rounded-alvion-lg shadow-xl border border-alvion-neutral-light-70 dark:border-alvion-neutral-dark-70 p-6 max-w-md w-full mx-4">
            <h3 className="flex items-center gap-3 text-2xl font-bold text-alvion-primary-100 dark:text-alvion-primary-dark-100 mb-6">
              <AiOutlineSend className="text-3xl" />
              Send a Payment
            </h3>

            {/* Receiver Address input */}
            <div className="form-control">
              <label className="label">
                <span className="label-text text-alvion-neutral-light-40 dark:text-alvion-neutral-dark-40">Receiver's Address</span>
              </label>
              <input
                type="text"
                data-test-id="receiver-address"
                className="input input-bordered w-full bg-alvion-neutral-light-80 dark:bg-alvion-neutral-dark-80 text-alvion-neutral-light-10 dark:text-alvion-neutral-dark-10 border-alvion-neutral-light-60 dark:border-alvion-neutral-dark-60 focus:outline-none focus:border-alvion-primary-100 dark:focus:border-alvion-primary-dark-100 focus:ring-1 focus:ring-alvion-primary-100 dark:focus:ring-alvion-primary-dark-100 rounded-alvion"
                placeholder="e.g., KPLX..."
                value={receiverAddress}
                onChange={(e) => setReceiverAddress(e.target.value)}
              />
              {/* Address length check for Algorand (58 chars) */}
              <div className="flex justify-between items-center text-xs mt-2">
                <span className="text-alvion-neutral-light-50 dark:text-alvion-neutral-dark-50">Amount: 1 {assetType}</span>
                <span className={`font-mono ${receiverAddress.length === 58 ? 'text-green-500' : 'text-red-500'}`}>
                  {receiverAddress.length}/58
                </span>
              </div>
            </div>

            {/* Toggle ALGO ↔ USDC */}
            <div className="flex justify-center gap-4 mt-4">
              <button
                type="button"
                className={`px-4 py-2 rounded-alvion font-semibold transition ${
                  assetType === 'ALGO'
                    ? 'bg-alvion-primary-100 text-white'
                    : 'bg-alvion-neutral-light-80 dark:bg-alvion-neutral-dark-80 text-alvion-neutral-light-10 dark:text-alvion-neutral-dark-10 hover:bg-alvion-neutral-light-70 dark:hover:bg-alvion-neutral-dark-70'
                }`}
                onClick={() => setAssetType('ALGO')}
              >
                ALGO
              </button>
              <button
                type="button"
                className={`px-4 py-2 rounded-alvion font-semibold transition ${
                  assetType === 'USDC'
                    ? 'bg-alvion-primary-100 text-white'
                    : 'bg-alvion-neutral-light-80 dark:bg-alvion-neutral-dark-80 text-alvion-neutral-light-10 dark:text-alvion-neutral-dark-10 hover:bg-alvion-neutral-light-70 dark:hover:bg-alvion-neutral-dark-70'
                }`}
                onClick={() => setAssetType('USDC')}
              >
                USDC
              </button>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col-reverse sm:flex-row-reverse gap-3 mt-6">
              <button
                data-test-id="send"
                type="button"
                className={`
              btn w-full sm:w-auto bg-alvion-primary-100 hover:bg-alvion-primary-90 text-white rounded-alvion border-none font-semibold transition-all duration-300 transform active:scale-95
              ${receiverAddress.length === 58 ? '' : 'btn-disabled opacity-50 cursor-not-allowed'}
            `}
                onClick={handleSubmit}
                disabled={loading || receiverAddress.length !== 58}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <AiOutlineLoading3Quarters className="animate-spin" />
                    Sending...
                  </span>
                ) : (
                  `Send 1 ${assetType}`
                )}
              </button>
              <button
                type="button"
                className="btn w-full sm:w-auto bg-alvion-neutral-light-80 dark:bg-alvion-neutral-dark-80 hover:bg-alvion-neutral-light-70 dark:hover:bg-alvion-neutral-dark-70 border-none text-alvion-neutral-light-10 dark:text-alvion-neutral-dark-10 rounded-alvion"
                onClick={() => setModalState(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default Transact
