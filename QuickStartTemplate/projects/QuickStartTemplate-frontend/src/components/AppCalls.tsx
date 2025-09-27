import { AlgorandClient } from '@algorandfoundation/algokit-utils'
import { OnSchemaBreak, OnUpdate } from '@algorandfoundation/algokit-utils/types/app'
import { useWallet } from '@txnlab/use-wallet-react'
import { useSnackbar } from 'notistack'
import { useState } from 'react'
import { AiOutlineDeploymentUnit, AiOutlineLoading3Quarters, AiOutlineWarning } from 'react-icons/ai'
import { HelloWorldFactory } from '../contracts/HelloWorld'
import { getAlgodConfigFromViteEnvironment, getIndexerConfigFromViteEnvironment } from '../utils/network/getAlgoClientConfigs'

interface AppCallsInterface {
  openModal: boolean
  setModalState: (value: boolean) => void
}

const AppCalls = ({ openModal, setModalState }: AppCallsInterface) => {
  const [loading, setLoading] = useState<boolean>(false)
  const [contractInput, setContractInput] = useState<string>('')
  const { enqueueSnackbar } = useSnackbar()
  const { transactionSigner, activeAddress } = useWallet()

  const algodConfig = getAlgodConfigFromViteEnvironment()
  const indexerConfig = getIndexerConfigFromViteEnvironment()
  const algorand = AlgorandClient.fromConfig({
    algodConfig,
    indexerConfig,
  })
  algorand.setDefaultSigner(transactionSigner)

  const sendAppCall = async () => {
    setLoading(true)

    // Please note, in typical production scenarios,
    // you wouldn't want to use deploy directly from your frontend.
    // Instead, you would deploy your contract on your backend and reference it by id.
    // Given the simplicity of the starter contract, we are deploying it on the frontend
    // for demonstration purposes.
    const factory = new HelloWorldFactory({
      defaultSender: activeAddress ?? undefined,
      algorand,
    })
    const deployResult = await factory
      .deploy({
        onSchemaBreak: OnSchemaBreak.AppendApp,
        onUpdate: OnUpdate.AppendApp,
      })
      .catch((e: Error) => {
        enqueueSnackbar(`Error deploying the contract: ${e.message}`, { variant: 'error' })
        setLoading(false)
        return undefined
      })

    if (!deployResult) {
      return
    }

    const { appClient } = deployResult

    const response = await appClient.send.hello({ args: { name: contractInput } }).catch((e: Error) => {
      enqueueSnackbar(`Error calling the contract: ${e.message}`, { variant: 'error' })
      setLoading(false)
      return undefined
    })

    if (!response) {
      return
    }

    enqueueSnackbar(`Response from the contract: ${response.return}`, { variant: 'success' })
    setLoading(false)
  }

  return (
    <>
      {openModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
          <div className="bg-alvion-neutral-light-90 dark:bg-alvion-neutral-dark-90 text-alvion-neutral-light-10 dark:text-alvion-neutral-dark-10 rounded-alvion-lg shadow-xl border border-alvion-neutral-light-70 dark:border-alvion-neutral-dark-70 p-6 max-w-md w-full mx-4">
            <h3 className="flex items-center gap-3 text-2xl font-bold text-alvion-primary-100 dark:text-alvion-primary-dark-100 mb-6">
              <AiOutlineDeploymentUnit className="text-3xl" />
              Smart Contract Interaction
            </h3>

            <div className="bg-alvion-neutral-light-80 dark:bg-alvion-neutral-dark-80 p-4 rounded-alvion mb-6">
              <p className="flex items-center gap-2 text-sm text-alvion-neutral-light-40 dark:text-alvion-neutral-dark-40">
                <AiOutlineWarning className="text-xl text-yellow-500" />
                **Note:** This demo deploys the contract on the frontend. In a production scenario, you would typically deploy it via a
                backend and reference it by ID.
              </p>
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text text-alvion-neutral-light-40 dark:text-alvion-neutral-dark-40">Input for 'hello' function</span>
              </label>
              <input
                type="text"
                className="input input-bordered w-full bg-alvion-neutral-light-80 dark:bg-alvion-neutral-dark-80 text-alvion-neutral-light-10 dark:text-alvion-neutral-dark-10 border-alvion-neutral-light-60 dark:border-alvion-neutral-dark-60 focus:outline-none focus:border-alvion-primary-100 dark:focus:border-alvion-primary-dark-100 focus:ring-1 focus:ring-alvion-primary-100 dark:focus:ring-alvion-primary-dark-100 rounded-alvion"
                placeholder="e.g., world!"
                value={contractInput}
                onChange={(e) => {
                  setContractInput(e.target.value)
                }}
              />
            </div>

            <div className="flex flex-col-reverse sm:flex-row-reverse gap-3 mt-6">
              <button
                type="button"
                className="btn w-full sm:w-auto bg-alvion-neutral-light-80 dark:bg-alvion-neutral-dark-80 hover:bg-alvion-neutral-light-70 dark:hover:bg-alvion-neutral-dark-70 border-none text-alvion-neutral-light-10 dark:text-alvion-neutral-dark-10 rounded-alvion"
                onClick={() => setModalState(false)}
              >
                Close
              </button>
              <button
                type="button"
                className={`
              btn w-full sm:w-auto bg-alvion-primary-100 hover:bg-alvion-primary-90 text-white rounded-alvion border-none font-semibold transition-all duration-300 transform active:scale-95
              ${contractInput ? '' : 'btn-disabled opacity-50 cursor-not-allowed'}
            `}
                onClick={sendAppCall}
                disabled={loading || !contractInput}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <AiOutlineLoading3Quarters className="animate-spin" />
                    Sending...
                  </span>
                ) : (
                  'Send application call'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default AppCalls
