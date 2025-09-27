// ConnectWallet.tsx
// Modal for selecting and connecting a wallet provider (Pera, Defly, KMD, etc).
// Uses @txnlab/use-wallet-react to manage multiple wallet options.
// 🔹 You don’t need to change logic in this file — it “just works”.
// 🔹 Safe place to redesign the modal UI if you want a different look.

import { useWallet, Wallet, WalletId } from '@txnlab/use-wallet-react'
import { BsWallet2, BsCheckCircleFill } from 'react-icons/bs'
import Account from './Account'

interface ConnectWalletInterface {
  openModal: boolean
  closeModal: () => void
}

const ConnectWallet = ({ openModal, closeModal }: ConnectWalletInterface) => {
  const { wallets, activeAddress } = useWallet()

  // Detect KMD (LocalNet dev wallet) since it has no icon
  const isKmd = (wallet: Wallet) => wallet.id === WalletId.KMD

  return (
    <>
      {openModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
          <div className="bg-alvion-neutral-light-90 dark:bg-alvion-neutral-dark-90 text-alvion-neutral-light-10 dark:text-alvion-neutral-dark-10 rounded-alvion-lg shadow-xl border border-alvion-neutral-light-70 dark:border-alvion-neutral-dark-70 p-6 max-w-md w-full mx-4">
            <h3 className="flex items-center gap-3 text-2xl font-bold text-alvion-primary-100 dark:text-alvion-primary-dark-100 mb-6">
              <BsWallet2 className="text-3xl" />
              Select wallet provider
            </h3>

            <div className="space-y-4">
              {activeAddress && (
                <>
                  <Account />
                  <div className="h-px bg-alvion-neutral-light-70 dark:bg-alvion-neutral-dark-70 my-4" />
                </>
              )}

              {!activeAddress &&
                wallets?.map((wallet) => (
                  <button
                    data-test-id={`${wallet.id}-connect`}
                    className={`
                  w-full flex items-center gap-4 p-4 rounded-xl transition-all duration-300 transform active:scale-95
                  bg-alvion-neutral-light-80 dark:bg-alvion-neutral-dark-80 hover:bg-alvion-neutral-light-70 dark:hover:bg-alvion-neutral-dark-70 border border-transparent rounded-alvion
                  focus:outline-none focus:ring-2 focus:ring-alvion-primary-100 dark:focus:ring-alvion-primary-dark-100 focus:ring-offset-2 focus:ring-offset-alvion-neutral-light-90 dark:focus:ring-offset-alvion-neutral-dark-90
                `}
                    key={`provider-${wallet.id}`}
                    onClick={() => {
                      return wallet.connect()
                    }}
                  >
                    {!isKmd(wallet) && (
                      <img alt={`wallet_icon_${wallet.id}`} src={wallet.metadata.icon} className="w-8 h-8 object-contain rounded-md" />
                    )}
                    <span className="font-semibold text-lg flex-1 text-left">
                      {isKmd(wallet) ? 'LocalNet Wallet' : wallet.metadata.name}
                    </span>
                    {wallet.isActive && <BsCheckCircleFill className="text-xl text-alvion-primary-100 dark:text-alvion-primary-dark-100" />}
                  </button>
                ))}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                data-test-id="close-wallet-modal"
                className="btn w-full sm:w-auto flex-1 bg-alvion-neutral-light-80 dark:bg-alvion-neutral-dark-80 hover:bg-alvion-neutral-light-70 dark:hover:bg-alvion-neutral-dark-70 border-none text-alvion-neutral-light-10 dark:text-alvion-neutral-dark-10 rounded-alvion"
                onClick={() => {
                  closeModal()
                }}
              >
                Close
              </button>
              {activeAddress && (
                <button
                  className="btn w-full sm:w-auto flex-1 bg-red-600 hover:bg-red-500 border-none text-white rounded-alvion"
                  data-test-id="logout"
                  onClick={async () => {
                    if (wallets) {
                      const activeWallet = wallets.find((w) => w.isActive)
                      if (activeWallet) {
                        await activeWallet.disconnect()
                      } else {
                        localStorage.removeItem('@txnlab/use-wallet:v3')
                        window.location.reload()
                      }
                    }
                  }}
                >
                  Logout
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default ConnectWallet
