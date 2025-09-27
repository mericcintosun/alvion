// Gemini API service for Algorand dApp
// Handles both regular and streaming chat requests

export interface ChatResponse {
  text: string
}

export interface StreamResponse {
  delta: string
  error?: string
}

// Detect backend URL automatically for Codespaces
function getBackendUrl(): string {
  const currentUrl = window.location.href
  const match = currentUrl.match(/https:\/\/([^.]+)-\d+\.app\.github\.dev/)

  if (match) {
    const baseCodespace = match[1]
    return `https://${baseCodespace}-3001.app.github.dev`
  }

  // Fallback for local development
  return 'http://localhost:3001'
}

const BACKEND_URL = getBackendUrl()

export async function askGemini(message: string): Promise<string> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message }),
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data: ChatResponse = await response.json()
    return data.text
  } catch (error) {
    console.error('Gemini API error:', error)
    throw new Error(`Failed to get response from Gemini: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

export async function* askGeminiStream(message: string): AsyncGenerator<string, void, unknown> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message }),
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const reader = response.body?.getReader()
    if (!reader) {
      throw new Error('Response body is not readable')
    }

    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { value, done } = await reader.read()

      if (done) break

      buffer += decoder.decode(value, { stream: true })

      // Process complete events
      const events = buffer.split('\n\n')
      buffer = events.pop() || '' // Keep incomplete event in buffer

      for (const event of events) {
        if (event.startsWith('data: ')) {
          try {
            const data: StreamResponse = JSON.parse(event.slice(6))

            if (data.error) {
              throw new Error(data.error)
            }

            if (data.delta) {
              yield data.delta
            }
          } catch (parseError) {
            console.error('Failed to parse SSE data:', parseError)
          }
        }
      }
    }
  } catch (error) {
    console.error('Gemini Stream API error:', error)
    throw new Error(`Failed to stream from Gemini: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

// Test backend connectivity
export async function testBackendConnection(): Promise<boolean> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/health`)
    return response.ok
  } catch {
    return false
  }
}
