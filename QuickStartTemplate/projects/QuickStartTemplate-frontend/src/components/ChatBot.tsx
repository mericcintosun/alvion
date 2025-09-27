// ChatBot.tsx
// AI-powered chat component integrated with Gemini backend
// Matches the existing Alvion design system

import React, { useState, useRef, useEffect } from 'react'
import { useSnackbar } from 'notistack'
import { AiOutlineSend, AiOutlineLoading3Quarters, AiOutlineRobot, AiOutlineUser } from 'react-icons/ai'
import { askGemini, askGeminiStream, testBackendConnection } from '../services/api/geminiApi'

interface ChatBotProps {
  openModal: boolean
  setModalState: (value: boolean) => void
}

interface Message {
  id: string
  type: 'user' | 'assistant'
  content: string
  timestamp: Date
}

const ChatBot = ({ openModal, setModalState }: ChatBotProps) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'assistant',
      content:
        "Hello! I'm your Algorand & DeFi assistant. I can help you with blockchain concepts, smart contracts, NFTs, tokens, and more. How can I assist you today?",
      timestamp: new Date(),
    },
  ])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isStreaming, setIsStreaming] = useState(false)
  const [backendConnected, setBackendConnected] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { enqueueSnackbar } = useSnackbar()

  // Test backend connection on component mount
  useEffect(() => {
    const checkBackend = async () => {
      const connected = await testBackendConnection()
      setBackendConnected(connected)
      if (!connected) {
        enqueueSnackbar('Backend server not connected. Please start the Gemini backend.', { variant: 'warning' })
      }
    }
    checkBackend()
  }, [enqueueSnackbar])

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSendMessage = async (useStream = false) => {
    if (!inputMessage.trim() || isLoading || isStreaming) return

    if (!backendConnected) {
      enqueueSnackbar('Backend server not connected', { variant: 'error' })
      return
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputMessage.trim(),
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInputMessage('')

    if (useStream) {
      setIsStreaming(true)
      await handleStreamingResponse(inputMessage.trim())
    } else {
      setIsLoading(true)
      await handleRegularResponse(inputMessage.trim())
    }
  }

  const handleRegularResponse = async (message: string) => {
    try {
      const response = await askGemini(message)
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: response,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, assistantMessage])
    } catch (error) {
      enqueueSnackbar(`Error: ${error instanceof Error ? error.message : 'Failed to get response'}`, { variant: 'error' })
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleStreamingResponse = async (message: string) => {
    try {
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: '',
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, assistantMessage])

      for await (const chunk of askGeminiStream(message)) {
        setMessages((prev) => {
          const newMessages = [...prev]
          const lastMessage = newMessages[newMessages.length - 1]
          if (lastMessage && lastMessage.type === 'assistant' && lastMessage.id === assistantMessage.id) {
            lastMessage.content += chunk
          }
          return newMessages
        })
      }
    } catch (error) {
      enqueueSnackbar(`Streaming error: ${error instanceof Error ? error.message : 'Failed to stream response'}`, { variant: 'error' })
      setMessages((prev) => {
        const newMessages = [...prev]
        const lastMessage = newMessages[newMessages.length - 1]
        if (lastMessage && lastMessage.type === 'assistant') {
          lastMessage.content = 'Sorry, I encountered an error while streaming. Please try again.'
        }
        return newMessages
      })
    } finally {
      setIsStreaming(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const clearChat = () => {
    setMessages([
      {
        id: '1',
        type: 'assistant',
        content:
          "Hello! I'm your Algorand & DeFi assistant. I can help you with blockchain concepts, smart contracts, NFTs, tokens, and more. How can I assist you today?",
        timestamp: new Date(),
      },
    ])
  }

  return (
    <>
      {openModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
          <div className="bg-alvion-neutral-light-90 dark:bg-alvion-neutral-dark-90 text-alvion-neutral-light-10 dark:text-alvion-neutral-dark-10 rounded-alvion-lg shadow-xl border border-alvion-neutral-light-70 dark:border-alvion-neutral-dark-70 p-6 max-w-4xl w-full mx-4 h-[80vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between mb-4 pb-4 border-b border-alvion-neutral-light-70 dark:border-alvion-neutral-dark-70">
              <h3 className="flex items-center gap-3 text-2xl font-bold text-alvion-primary-100 dark:text-alvion-primary-dark-100">
                <AiOutlineRobot className="text-3xl" />
                AI Assistant
              </h3>
              <div className="flex items-center gap-2">
                <div
                  className={`w-3 h-3 rounded-full ${backendConnected ? 'bg-green-500' : 'bg-red-500'}`}
                  title={backendConnected ? 'Backend Connected' : 'Backend Disconnected'}
                />
                <button
                  onClick={clearChat}
                  className="text-sm text-alvion-neutral-light-40 dark:text-alvion-neutral-dark-40 hover:text-alvion-primary-100 dark:hover:text-alvion-primary-dark-100 transition-colors"
                >
                  Clear Chat
                </button>
                <button
                  onClick={() => setModalState(false)}
                  className="text-alvion-neutral-light-40 dark:text-alvion-neutral-dark-40 hover:text-alvion-primary-100 dark:hover:text-alvion-primary-dark-100 transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto mb-4 space-y-4 pr-2">
              {messages.map((message) => (
                <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[80%] p-3 rounded-alvion-lg ${
                      message.type === 'user'
                        ? 'bg-alvion-primary-100 text-white'
                        : 'bg-alvion-neutral-light-80 dark:bg-alvion-neutral-dark-80 text-alvion-neutral-light-10 dark:text-alvion-neutral-dark-10'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      {message.type === 'assistant' && <AiOutlineRobot className="text-lg mt-1 flex-shrink-0" />}
                      {message.type === 'user' && <AiOutlineUser className="text-lg mt-1 flex-shrink-0" />}
                      <div className="flex-1">
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                        {isStreaming && message.type === 'assistant' && messages[messages.length - 1]?.id === message.id && (
                          <span className="inline-block w-2 h-4 bg-alvion-primary-100 dark:bg-alvion-primary-dark-100 animate-pulse ml-1" />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="border-t border-alvion-neutral-light-70 dark:border-alvion-neutral-dark-70 pt-4">
              <div className="flex gap-2">
                <textarea
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask me about Algorand, DeFi, smart contracts, NFTs..."
                  className="flex-1 p-3 bg-alvion-neutral-light-80 dark:bg-alvion-neutral-dark-80 text-alvion-neutral-light-10 dark:text-alvion-neutral-dark-10 border border-alvion-neutral-light-60 dark:border-alvion-neutral-dark-60 focus:outline-none focus:border-alvion-primary-100 dark:focus:border-alvion-primary-dark-100 focus:ring-1 focus:ring-alvion-primary-100 dark:focus:ring-alvion-primary-dark-100 rounded-alvion resize-none"
                  rows={2}
                  disabled={isLoading || isStreaming}
                />
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => handleSendMessage(false)}
                    disabled={!inputMessage.trim() || isLoading || isStreaming}
                    className="btn bg-alvion-primary-100 hover:bg-alvion-primary-90 text-white rounded-alvion border-none font-semibold transition-all duration-300 transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? <AiOutlineLoading3Quarters className="animate-spin" /> : <AiOutlineSend />}
                  </button>
                  <button
                    onClick={() => handleSendMessage(true)}
                    disabled={!inputMessage.trim() || isLoading || isStreaming}
                    className="btn bg-alvion-neutral-light-70 dark:bg-alvion-neutral-dark-70 hover:bg-alvion-neutral-light-60 dark:hover:bg-alvion-neutral-dark-60 text-alvion-neutral-light-10 dark:text-alvion-neutral-dark-10 rounded-alvion border-none font-semibold transition-all duration-300 transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed text-xs"
                  >
                    {isStreaming ? <AiOutlineLoading3Quarters className="animate-spin" /> : 'Stream'}
                  </button>
                </div>
              </div>
              <p className="text-xs text-alvion-neutral-light-50 dark:text-alvion-neutral-dark-50 mt-2">
                Press Enter to send, Shift+Enter for new line
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default ChatBot
