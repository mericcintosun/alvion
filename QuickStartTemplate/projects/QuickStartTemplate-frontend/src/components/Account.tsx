import { useWallet } from '@txnlab/use-wallet-react'
import { useMemo } from 'react'
import { ellipseAddress } from '../utils/ellipseAddress'
import { getAlgodConfigFromViteEnvironment } from '../utils/network/getAlgoClientConfigs'

const Account = () => {
  const { activeAddress } = useWallet()
  const algoConfig = getAlgodConfigFromViteEnvironment()

  const networkName = useMemo(() => {
    return algoConfig.network === '' ? 'localnet' : algoConfig.network.toLocaleLowerCase()
  }, [algoConfig.network])

  return (
    <div className="text-alvion-neutral-light-10 dark:text-alvion-neutral-dark-10">
      <a
        className="text-xl text-alvion-primary-100 dark:text-alvion-primary-dark-100 hover:text-alvion-primary-90 dark:hover:text-alvion-primary-dark-90 transition-colors"
        target="_blank"
        href={`https://lora.algokit.io/${networkName}/account/${activeAddress}/`}
      >
        Address: {ellipseAddress(activeAddress)}
      </a>
      <div className="text-xl text-alvion-neutral-light-40 dark:text-alvion-neutral-dark-40">Network: {networkName}</div>
    </div>
  )
}

export default Account
