// Home.tsx
// Main landing UI: shows navbar, hero text, and feature cards.
// This file only handles layout and modals — safe place to customize design.

import React, { useState } from 'react'
import { useWallet } from '@txnlab/use-wallet-react'
import { AiOutlineSend, AiOutlineStar, AiOutlineDeploymentUnit, AiOutlineRobot, AiOutlinePlayCircle } from 'react-icons/ai'
import { BsArrowUpRightCircle, BsWallet2 } from 'react-icons/bs'

// Frontend modals
import ConnectWallet from './components/ConnectWallet'
import Transact from './components/Transact'
import NFTmint from './components/NFTmint'
import Tokenmint from './components/Tokenmint'
import DarkModeToggle from './components/DarkModeToggle'
import ChatBot from './components/ChatBot'
import AlvionDeFiCopilot from './components/AlvionDeFiCopilot'
import AlvionTestSuite from './components/AlvionTestSuite'

// Smart contract demo modal (backend app calls)
import AppCalls from './components/AppCalls'

interface HomeProps {}

const Home: React.FC<HomeProps> = () => {
  const [openWalletModal, setOpenWalletModal] = useState<boolean>(false)
  const [openPaymentModal, setOpenPaymentModal] = useState<boolean>(false)
  const [openMintModal, setOpenMintModal] = useState<boolean>(false)
  const [openTokenModal, setOpenTokenModal] = useState<boolean>(false)
  const [openAppCallsModal, setOpenAppCallsModal] = useState<boolean>(false)
  const [openChatModal, setOpenChatModal] = useState<boolean>(false)
  const [openDeFiCopilotModal, setOpenDeFiCopilotModal] = useState<boolean>(false)
  const [openTestSuiteModal, setOpenTestSuiteModal] = useState<boolean>(false)

  const { activeAddress } = useWallet()

  return (
    <div className="min-h-screen bg-alvion-neutral-light-100 dark:bg-alvion-neutral-dark-100 text-alvion-neutral-light-10 dark:text-alvion-neutral-dark-10 flex flex-col transition-colors duration-300">
      {/* ---------------- Navbar ---------------- */}
      <nav className="w-full bg-alvion-neutral-light-90 dark:bg-alvion-neutral-dark-90 border-b border-alvion-neutral-light-70 dark:border-alvion-neutral-dark-70 px-6 py-4 flex items-center justify-between transition-colors duration-300">
        <h1 className="text-xl font-bold text-alvion-primary-100 dark:text-alvion-primary-dark-100">Alvion</h1>
        <div className="flex items-center gap-3">
          <DarkModeToggle />
          <button
            className="flex items-center gap-2 px-4 py-2 rounded-alvion bg-alvion-neutral-light-80 dark:bg-alvion-neutral-dark-80 hover:bg-alvion-neutral-light-70 dark:hover:bg-alvion-neutral-dark-70 text-sm font-semibold text-alvion-primary-100 dark:text-alvion-primary-dark-100 transition-colors duration-200"
            onClick={() => setOpenChatModal(true)}
          >
            <AiOutlineRobot size={20} color="#2D2DF1" />
            <span>AI Assistant</span>
          </button>
          <button
            className="flex items-center gap-2 px-4 py-2 rounded-alvion bg-alvion-neutral-light-80 dark:bg-alvion-neutral-dark-80 hover:bg-alvion-neutral-light-70 dark:hover:bg-alvion-neutral-dark-70 text-sm font-semibold text-alvion-primary-100 dark:text-alvion-primary-dark-100 transition-colors duration-200"
            onClick={() => setOpenWalletModal(true)}
          >
            <BsWallet2 size={20} color="#2D2DF1" />
            <span>{activeAddress ? 'Wallet Connected' : 'Connect Wallet'}</span>
          </button>
        </div>
      </nav>

      {/* ---------------- Hero Section ---------------- */}
      <header className="text-center py-10 px-4">
        <h2 className="text-4xl sm:text-5xl font-extrabold text-alvion-primary-100 dark:text-alvion-primary-dark-100 mb-4">
          Alvion DeFi Copilot
        </h2>
        <p className="text-alvion-neutral-light-40 dark:text-alvion-neutral-dark-40 max-w-2xl mx-auto mb-6">
          AI-powered DeFi assistant that combines intelligent portfolio management with agentic rebalancing. Give instructions in Turkish
          and let Alvion handle the rest.
        </p>
        {activeAddress && (
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => setOpenDeFiCopilotModal(true)}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-alvion bg-alvion-primary-100 hover:bg-alvion-primary-90 text-white font-semibold transition-colors duration-200"
            >
              <AiOutlineRobot size={20} />
              <span>Open DeFi Copilot</span>
            </button>
            <button
              onClick={() => setOpenTestSuiteModal(true)}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-alvion bg-green-600 hover:bg-green-700 text-white font-semibold transition-colors duration-200"
            >
              <AiOutlinePlayCircle size={20} />
              <span>Test Suite</span>
            </button>
          </div>
        )}
      </header>

      {/* ---------------- Features Grid ---------------- */}
      <main className="flex-1 px-6 pb-12">
        {activeAddress ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {/* Send Payment */}
            <div className="p-6 bg-alvion-neutral-light-90 dark:bg-alvion-neutral-dark-90 rounded-alvion-lg border border-alvion-neutral-light-70 dark:border-alvion-neutral-dark-70 hover:border-alvion-primary-100 dark:hover:border-alvion-primary-dark-100 transition-all duration-200">
              <AiOutlineSend size={48} color="#A9A9F6" />
              <h3 className="text-lg font-semibold mb-2 text-alvion-neutral-light-10 dark:text-alvion-neutral-dark-10">Send Payment</h3>
              <p className="text-sm text-alvion-neutral-light-40 dark:text-alvion-neutral-dark-40 mb-4">
                Try sending 1 ALGO to any address on TestNet. This helps you understand wallet transactions.
              </p>
              <button
                className="w-full py-2 rounded-alvion bg-alvion-primary-100 hover:bg-alvion-primary-90 text-white font-semibold transition-colors duration-200"
                onClick={() => setOpenPaymentModal(true)}
              >
                Open
              </button>
            </div>

            {/* Mint NFT */}
            <div className="p-6 bg-alvion-neutral-light-90 dark:bg-alvion-neutral-dark-90 rounded-alvion-lg border border-alvion-neutral-light-70 dark:border-alvion-neutral-dark-70 hover:border-alvion-primary-100 dark:hover:border-alvion-primary-dark-100 transition-all duration-200">
              <AiOutlineStar size={48} color="#BFBFF9" />
              <h3 className="text-lg font-semibold mb-2 text-alvion-neutral-light-10 dark:text-alvion-neutral-dark-10">Mint NFT</h3>
              <p className="text-sm text-alvion-neutral-light-40 dark:text-alvion-neutral-dark-40 mb-4">
                Upload an image and mint it as an NFT on Algorand with IPFS metadata stored via Pinata.
              </p>
              <button
                className="w-full py-2 rounded-alvion bg-alvion-primary-100 hover:bg-alvion-primary-90 text-white font-semibold transition-colors duration-200"
                onClick={() => setOpenMintModal(true)}
              >
                Open
              </button>
            </div>

            {/* Create Token */}
            <div className="p-6 bg-alvion-neutral-light-90 dark:bg-alvion-neutral-dark-90 rounded-alvion-lg border border-alvion-neutral-light-70 dark:border-alvion-neutral-dark-70 hover:border-alvion-primary-100 dark:hover:border-alvion-primary-dark-100 transition-all duration-200">
              <BsArrowUpRightCircle size={48} color="#D4D4FA" />
              <h3 className="text-lg font-semibold mb-2 text-alvion-neutral-light-10 dark:text-alvion-neutral-dark-10">
                Create Token (ASA)
              </h3>
              <p className="text-sm text-alvion-neutral-light-40 dark:text-alvion-neutral-dark-40 mb-4">
                Spin up your own Algorand Standard Asset (ASA) in seconds. Perfect for testing token creation.
              </p>
              <button
                className="w-full py-2 rounded-alvion bg-alvion-primary-100 hover:bg-alvion-primary-90 text-white font-semibold transition-colors duration-200"
                onClick={() => setOpenTokenModal(true)}
              >
                Open
              </button>
            </div>

            {/* Contract Interactions */}
            <div className="p-6 bg-alvion-neutral-light-90 dark:bg-alvion-neutral-dark-90 rounded-alvion-lg border border-alvion-neutral-light-70 dark:border-alvion-neutral-dark-70 hover:border-alvion-primary-100 dark:hover:border-alvion-primary-dark-100 transition-all duration-200">
              <AiOutlineDeploymentUnit size={48} color="#E9E9FD" />
              <h3 className="text-lg font-semibold mb-2 text-alvion-neutral-light-10 dark:text-alvion-neutral-dark-10">
                Contract Interactions
              </h3>
              <p className="text-sm text-alvion-neutral-light-40 dark:text-alvion-neutral-dark-40 mb-4">
                Interact with a simple Algorand smart contract to see how stateful dApps work on chain.
              </p>
              <button
                className="w-full py-2 rounded-alvion bg-alvion-primary-100 hover:bg-alvion-primary-90 text-white font-semibold transition-colors duration-200"
                onClick={() => setOpenAppCallsModal(true)}
              >
                Open
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center text-alvion-neutral-light-50 dark:text-alvion-neutral-dark-50 mt-12">
            <p>⚡ Connect your wallet first to unlock the features below.</p>
          </div>
        )}
      </main>

      {/* ---------------- Modals ---------------- */}
      <ConnectWallet openModal={openWalletModal} closeModal={() => setOpenWalletModal(false)} />
      <Transact openModal={openPaymentModal} setModalState={setOpenPaymentModal} />
      <NFTmint openModal={openMintModal} setModalState={setOpenMintModal} />
      <Tokenmint openModal={openTokenModal} setModalState={setOpenTokenModal} />
      <AppCalls openModal={openAppCallsModal} setModalState={setOpenAppCallsModal} />
      <ChatBot openModal={openChatModal} setModalState={setOpenChatModal} />
      <AlvionDeFiCopilot openModal={openDeFiCopilotModal} setModalState={setOpenDeFiCopilotModal} />
      <AlvionTestSuite openModal={openTestSuiteModal} setModalState={setOpenTestSuiteModal} />
    </div>
  )
}

export default Home
