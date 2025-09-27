# Gemini Backend Service

AI-powered backend service for Algorand dApp using Google's Gemini API.

## Features

- **Gemini 2.5 Flash** integration
- **Non-streaming** chat responses
- **SSE streaming** chat responses
- **Algorand/DeFi** specialized assistant
- **CORS** enabled for frontend integration
- **Environment-based** configuration

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Configuration

Copy the example environment file and configure your API key:

```bash
cp env.example .env
```

Edit `.env` file with your configuration:

```env
PORT=3001
CORS_ORIGIN=http://localhost:5173
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.5-flash
TEMPERATURE=0.7
MAX_TOKENS=2048
```

### 3. Get Gemini API Key

1. Go to [Google AI Studio](https://aistudio.google.com/)
2. Create a new API key
3. Copy the key to your `.env` file

## Running the Server

### Development Mode

```bash
npm run dev
```

### Production Mode

```bash
npm start
```

The server will start on `http://localhost:3001` by default.

## API Endpoints

### Health Check

```http
GET /api/health
```

Returns server status.

### Regular Chat

```http
POST /api/chat
Content-Type: application/json

{
  "message": "Explain Algorand smart contracts",
  "system": "Optional system instruction"
}
```

### Streaming Chat

```http
POST /api/stream
Content-Type: application/json

{
  "message": "How do NFTs work on Algorand?",
  "system": "Optional system instruction"
}
```

Returns Server-Sent Events (SSE) stream.

## Integration with Frontend

The backend automatically detects the frontend URL in Codespaces environments. For local development, ensure the `CORS_ORIGIN` in your `.env` matches your frontend URL.

## System Prompt

The assistant is configured with a specialized system prompt for Algorand and DeFi topics:

> "You are an Algorand/DeFi savvy assistant. You help users understand Algorand blockchain, smart contracts, NFTs, tokens, and DeFi concepts. Be factual, concise, and helpful. When users ask about Algorand-specific features, provide accurate technical details."

## Troubleshooting

### Backend Not Connecting

1. Check if the server is running on the correct port
2. Verify your Gemini API key is valid
3. Ensure CORS_ORIGIN matches your frontend URL
4. Check console for error messages

### API Key Issues

1. Verify your API key is correct in `.env`
2. Check if you have sufficient quota in Google AI Studio
3. Ensure the API key has the necessary permissions

### Streaming Issues

1. Check browser compatibility for Server-Sent Events
2. Verify network connectivity
3. Check browser developer tools for errors
