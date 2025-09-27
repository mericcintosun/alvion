// -----------------------------
// server.js
// -----------------------------
// This backend handles image uploads, pins them (and metadata) to Pinata/IPFS,
// and returns a metadata URL that the frontend can use to mint an NFT on Algorand.
// -----------------------------

import express from 'express'
import cors from 'cors'
import multer from 'multer'
import pinataSDK from '@pinata/sdk'
import dotenv from 'dotenv'
import { Readable } from 'stream'

dotenv.config()

const app = express()
const port = process.env.PORT || 3001

// Allow requests from the frontend (CORS).
// '*' is fine for development; in production, restrict to your app’s URL.
app.use(cors({ origin: '*' }))

// Parse JSON payloads (mainly useful if you add more routes later).
app.use(express.json())

// Log whether environment variables are being read properly.
// Developers will need to set their own API keys in .env (never commit secrets).
console.log('Backend server starting...')
console.log('Pinata API Key:', process.env.PINATA_API_KEY ? 'Loaded' : 'Not Loaded')
console.log('Pinata API Secret:', process.env.PINATA_API_SECRET ? 'Loaded' : 'Not Loaded')
console.log('Pinata JWT:', process.env.PINATA_JWT ? 'Loaded' : 'Not Loaded')

// Multer setup: keep uploaded files in memory (not saved to disk).
// This makes it easier to forward the file directly to Pinata.
const upload = multer({ storage: multer.memoryStorage() })

// Pinata client setup.
// By default this uses API key + secret from your .env.
const pinata = process.env.PINATA_JWT
  ? new pinataSDK({ pinataJWTKey: process.env.PINATA_JWT })
  : new pinataSDK(process.env.PINATA_API_KEY, process.env.PINATA_API_SECRET)

// Test Pinata credentials when the server starts.
// If this fails, check your .env file.
;(async () => {
  try {
    const auth = await pinata.testAuthentication?.()
    console.log('Pinata auth OK:', auth || 'ok')
  } catch (e) {
    console.error('Pinata authentication FAILED. Check env vars.', e)
  }
})()

// Simple health endpoint so the frontend (or you) can check if the server is live.
app.get('/health', (_req, res) => {
  res.set('Cache-Control', 'no-store')
  res.json({ ok: true, ts: Date.now() })
})

// -----------------------------
// Main endpoint: /api/pin-image
// -----------------------------
// 1. Accepts an image file from the frontend
// 2. Pins the file to Pinata/IPFS
// 3. Creates NFT metadata JSON pointing to that image
// 4. Pins metadata JSON to IPFS
// 5. Returns the metadata URL for use in Algorand NFT minting
app.post('/api/pin-image', upload.single('file'), async (req, res) => {
  console.log('API endpoint /api/pin-image was hit!')
  try {
    const file = req.file
    if (!file) {
      console.log('Error: No file uploaded.')
      return res.status(400).json({ error: 'No file uploaded' })
    }
    console.log('File received:', {
      name: file.originalname,
      size: file.size,
      mimetype: file.mimetype,
    })

    // Convert the uploaded buffer into a Readable stream (Pinata expects a stream).
    const stream = Readable.from(file.buffer)
    // Give the stream a path so Pinata names it properly.
    // (You can customize naming here if you want.)
    // @ts-ignore (JS file): attach path so sdk has a name
    stream.path = file.originalname || 'upload'

    // Pin the image to IPFS
    const imageOptions = {
      pinataMetadata: { name: file.originalname || 'MasterPass Ticket Image' },
    }
    const imageResult = await pinata.pinFileToIPFS(stream, imageOptions)
    const imageUrl = `ipfs://${imageResult.IpfsHash}`
    console.log('Image pinned to IPFS:', imageUrl)

    // Build NFT metadata JSON (customize name/description/properties here).
    const metadata = {
      name: 'NFT Example',
      description: 'This is an unchangeable NFT',
      image: imageUrl,
      properties: {},
    }

    // Pin the metadata JSON to IPFS
    const jsonOptions = { pinataMetadata: { name: 'MasterPass Ticket Metadata' } }
    const jsonResult = await pinata.pinJSONToIPFS(metadata, jsonOptions)
    const metadataUrl = `ipfs://${jsonResult.IpfsHash}`
    console.log('Successfully pinned metadata. URL:', metadataUrl)

    // Respond back to the frontend with the metadata URL
    res.status(200).json({ metadataUrl })
    console.log('Response sent to frontend.')
  } catch (error) {
    // Log detailed error info for debugging.
    const details = {
      message: error?.message,
      status: error?.status || error?.response?.status,
      data: error?.response?.data,
      stack: error?.stack,
    }
    console.error('Error in /api/pin-image:', details)

    // Send a simplified error message to the frontend.
    const msg =
      (typeof details.data === 'string' && details.data) ||
      details.data?.error ||
      details.message ||
      'Failed to pin to IPFS.'
    res.status(500).json({ error: msg })
  }
})

// Start the server
app.listen(port, () => {
  console.log(`Backend listening at http://localhost:${port}`)
})
