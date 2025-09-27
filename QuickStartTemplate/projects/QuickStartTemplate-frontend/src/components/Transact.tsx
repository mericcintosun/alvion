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
    <dialog
      id="transact_modal"
      className={`modal modal-bottom sm:modal-middle backdrop-blur-sm ${openModal ? 'modal-open' : ''}`}
    >
      <div className="modal-box bg-neutral-800 text-gray-100 rounded-2xl shadow-xl border border-neutral-700 p-6">
        <h3 className="flex items-center gap-3 text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-teal-500 mb-6">
          <AiOutlineSend className="text-3xl" />
          Send a Payment
        </h3>

        {/* Receiver Address input */}
        <div className="form-control">
          <label className="label">
            <span className="label-text text-gray-400">Receiver's Address</span>
          </label>
          <input
            type="text"
            data-test-id="receiver-address"
            className="input input-bordered w-full bg-neutral-700 text-gray-100 border-neutral-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
            placeholder="e.g., KPLX..."
            value={receiverAddress}
            onChange={(e) => setReceiverAddress(e.target.value)}
          />
          {/* Address length check for Algorand (58 chars) */}
          <div className="flex justify-between items-center text-xs mt-2">
            <span className="text-gray-500">Amount: 1 {assetType}</span>
            <span className={`font-mono ${receiverAddress.length === 58 ? 'text-green-400' : 'text-red-400'}`}>
              {receiverAddress.length}/58
            </span>
          </div>
        </div>

        {/* Toggle ALGO ↔ USDC */}
        <div className="flex justify-center gap-4 mt-4">
          <button
            type="button"
            className={`px-4 py-2 rounded-lg font-semibold transition ${
              assetType === 'ALGO' ? 'bg-cyan-600 text-white' : 'bg-neutral-700 text-gray-300 hover:bg-neutral-600'
            }`}
            onClick={() => setAssetType('ALGO')}
          >
            ALGO
          </button>
          <button
            type="button"
            className={`px-4 py-2 rounded-lg font-semibold transition ${
              assetType === 'USDC' ? 'bg-cyan-600 text-white' : 'bg-neutral-700 text-gray-300 hover:bg-neutral-600'
            }`}
            onClick={() => setAssetType('USDC')}
          >
            USDC
          </button>
        </div>

        {/* Action buttons */}
        <div className="modal-action mt-6 flex flex-col-reverse sm:flex-row-reverse gap-3">
          <button
            data-test-id="send"
            type="button"
            className={`
              btn w-full sm:w-auto bg-green-500 hover:bg-green-600 text-white rounded-xl border-none font-semibold transition-all duration-300 transform active:scale-95
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
            className="btn w-full sm:w-auto bg-neutral-700 hover:bg-neutral-600 border-none text-gray-300 rounded-xl"
            onClick={() => setModalState(false)}
          >
            Close
          </button>
        </div>
      </div>
    </dialog>
  )
}

export default Transact
