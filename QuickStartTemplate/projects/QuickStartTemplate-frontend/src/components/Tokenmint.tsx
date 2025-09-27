// Tokenmint.tsx
// Create a standard fungible token (ASA) on Algorand TestNet.
// Users can set asset name, unit name, total supply, and decimals.

import { AlgorandClient } from '@algorandfoundation/algokit-utils'
import { useWallet } from '@txnlab/use-wallet-react'
import { useSnackbar } from 'notistack'
import { useMemo, useState } from 'react'
import { AiOutlineLoading3Quarters, AiOutlineInfoCircle } from 'react-icons/ai'
import { BsCoin } from 'react-icons/bs'
import { getAlgodConfigFromViteEnvironment } from '../utils/network/getAlgoClientConfigs'

interface TokenMintProps {
  openModal: boolean
  setModalState: (value: boolean) => void
}

const Tokenmint = ({ openModal, setModalState }: TokenMintProps) => {
  // 👇 Default placeholder values (safe customization points for learners)
  const [assetName, setAssetName] = useState<string>('MasterPass Token') // token name
  const [unitName, setUnitName] = useState<string>('MPT') // short ticker
  const [total, setTotal] = useState<string>('1000') // human-readable total
  const [decimals, setDecimals] = useState<string>('0') // 0 = whole tokens only

  const [loading, setLoading] = useState<boolean>(false)

  // Wallet + notifications
  const { transactionSigner, activeAddress } = useWallet()
  const { enqueueSnackbar } = useSnackbar()

  // Algorand client (TestNet from Vite env)
  const algodConfig = getAlgodConfigFromViteEnvironment()
  const algorand = useMemo(() => AlgorandClient.fromConfig({ algodConfig }), [algodConfig])

  // ------------------------------
  // Handle Token Creation
  // ------------------------------
  const handleMintToken = async () => {
    if (!transactionSigner || !activeAddress) {
      enqueueSnackbar('Please connect your wallet first.', { variant: 'warning' })
      return
    }

    // Basic validation checks
    if (!assetName || !unitName) {
      enqueueSnackbar('Please enter an asset name and unit name.', { variant: 'warning' })
      return
    }
    if (!/^\d+$/.test(total)) {
      enqueueSnackbar('Total supply must be a whole number.', { variant: 'warning' })
      return
    }
    if (!/^\d+$/.test(decimals)) {
      enqueueSnackbar('Decimals must be a whole number.', { variant: 'warning' })
      return
    }

    try {
      setLoading(true)
      enqueueSnackbar('Creating token...', { variant: 'info' })

      const totalBig = BigInt(total)
      const decimalsBig = BigInt(decimals)

      // On-chain total supply = total × 10^decimals
      const onChainTotal = totalBig * 10n ** decimalsBig

      // 👇 Learners can customize all of these ASA parameters
      const createResult = await algorand.send.assetCreate({
        sender: activeAddress,
        signer: transactionSigner,
        total: onChainTotal,
        decimals: Number(decimalsBig),
        assetName, // <— customize token name
        unitName, // <— customize unit/ticker
        defaultFrozen: false,
      })

      enqueueSnackbar(`✅ Token Created! ASA ID: ${createResult.assetId}`, { variant: 'success' })

      // Reset back to defaults after successful mint
      setAssetName('MasterPass Token')
      setUnitName('MPT')
      setTotal('1000')
      setDecimals('0')
    } catch (error) {
      console.error(error)
      enqueueSnackbar('Failed to create token', { variant: 'error' })
    } finally {
      setLoading(false)
    }
  }

  // ------------------------------
  // Modal UI
  // ------------------------------
  return (
    <>
      {openModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
          <div className="bg-alvion-neutral-light-90 dark:bg-alvion-neutral-dark-90 text-alvion-neutral-light-10 dark:text-alvion-neutral-dark-10 rounded-alvion-lg shadow-xl border border-alvion-neutral-light-70 dark:border-alvion-neutral-dark-70 p-6 max-w-md w-full mx-4">
            <h3 className="flex items-center gap-3 text-2xl font-bold text-alvion-primary-100 dark:text-alvion-primary-dark-100 mb-2">
              <BsCoin size={48} color="#2D2DF1" />
              Create a MasterPass Token
            </h3>
            <p className="text-alvion-neutral-light-40 dark:text-alvion-neutral-dark-40 text-sm mb-6">
              This creates a standard fungible token (ASA) on the Algorand TestNet.
            </p>

            {/* Input fields for customization */}
            <div className="space-y-4">
              {/* Asset Name */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text text-alvion-neutral-light-40 dark:text-alvion-neutral-dark-40">Asset Name</span>
                </label>
                <input
                  type="text"
                  className="input input-bordered w-full bg-alvion-neutral-light-80 dark:bg-alvion-neutral-dark-80 text-alvion-neutral-light-10 dark:text-alvion-neutral-dark-10 border-alvion-neutral-light-60 dark:border-alvion-neutral-dark-60 focus:outline-none focus:border-alvion-primary-100 dark:focus:border-alvion-primary-dark-100 focus:ring-1 focus:ring-alvion-primary-100 dark:focus:ring-alvion-primary-dark-100 rounded-alvion"
                  placeholder="e.g., MasterPass Token"
                  value={assetName}
                  onChange={(e) => setAssetName(e.target.value)}
                />
              </div>

              {/* Unit Name */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text text-alvion-neutral-light-40 dark:text-alvion-neutral-dark-40">Unit Name</span>
                </label>
                <input
                  type="text"
                  className="input input-bordered w-full bg-alvion-neutral-light-80 dark:bg-alvion-neutral-dark-80 text-alvion-neutral-light-10 dark:text-alvion-neutral-dark-10 border-alvion-neutral-light-60 dark:border-alvion-neutral-dark-60 focus:outline-none focus:border-alvion-primary-100 dark:focus:border-alvion-primary-dark-100 focus:ring-1 focus:ring-alvion-primary-100 dark:focus:ring-alvion-primary-dark-100 rounded-alvion"
                  placeholder="e.g., MPT"
                  value={unitName}
                  onChange={(e) => setUnitName(e.target.value)}
                />
              </div>

              {/* Total Supply */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text text-alvion-neutral-light-40 dark:text-alvion-neutral-dark-40">Total Supply</span>
                </label>
                <input
                  type="number"
                  min={1}
                  className="input input-bordered w-full bg-alvion-neutral-light-80 dark:bg-alvion-neutral-dark-80 text-alvion-neutral-light-10 dark:text-alvion-neutral-dark-10 border-alvion-neutral-light-60 dark:border-alvion-neutral-dark-60 focus:outline-none focus:border-alvion-primary-100 dark:focus:border-alvion-primary-dark-100 focus:ring-1 focus:ring-alvion-primary-100 dark:focus:ring-alvion-primary-dark-100 rounded-alvion"
                  placeholder="e.g., 1000"
                  value={total}
                  onChange={(e) => setTotal(e.target.value)}
                />
              </div>

              {/* Decimals */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text text-alvion-neutral-light-40 dark:text-alvion-neutral-dark-40">Decimals</span>
                </label>
                <input
                  type="number"
                  min={0}
                  max={19}
                  className="input input-bordered w-full bg-alvion-neutral-light-80 dark:bg-alvion-neutral-dark-80 text-alvion-neutral-light-10 dark:text-alvion-neutral-dark-10 border-alvion-neutral-light-60 dark:border-alvion-neutral-dark-60 focus:outline-none focus:border-alvion-primary-100 dark:focus:border-alvion-primary-dark-100 focus:ring-1 focus:ring-alvion-primary-100 dark:focus:ring-alvion-primary-dark-100 rounded-alvion"
                  placeholder="0 for whole tokens"
                  value={decimals}
                  onChange={(e) => setDecimals(e.target.value)}
                />
                <div className="flex items-center gap-1 mt-2 text-xs text-alvion-neutral-light-50 dark:text-alvion-neutral-dark-50">
                  <AiOutlineInfoCircle size={16} color="#6B7280" />
                  <p>
                    On-chain total = <code>total × 10^decimals</code>.
                  </p>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col-reverse sm:flex-row-reverse gap-3 mt-6">
              <button
                type="button"
                className={`btn w-full sm:w-auto bg-alvion-primary-100 hover:bg-alvion-primary-90 text-white rounded-alvion border-none font-semibold ${
                  assetName && unitName && total ? '' : 'btn-disabled opacity-50 cursor-not-allowed'
                }`}
                onClick={handleMintToken}
                disabled={loading || !assetName || !unitName || !total}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <AiOutlineLoading3Quarters size={20} />
                    Creating...
                  </span>
                ) : (
                  'Create Token'
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

export default Tokenmint
