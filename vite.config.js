import Razorpay from 'razorpay'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import {
  createTelegramImageHandler,
  createTelegramImageProxyHandler,
  createTelegramMediaDeleteHandler,
} from './api/_lib/telegramUpload.js'

function localRazorpayApi({ keyId, keySecret }) {
  return {
    name: 'local-razorpay-api',
    configureServer(server) {
      server.middlewares.use('/api/razorpay/create-order', async (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: 'Method Not Allowed' }))
          return
        }

        if (!keyId || !keySecret) {
          res.statusCode = 500
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: 'Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env.' }))
          return
        }

        try {
          const chunks = []
          for await (const chunk of req) {
            chunks.push(chunk)
          }
          const rawBody = Buffer.concat(chunks).toString('utf8')
          const body = rawBody ? JSON.parse(rawBody) : {}

          const amount = Number(body.amount)
          const currency = body.currency || 'INR'
          const receipt = body.receipt || `receipt_${Date.now()}`

          if (!amount || amount <= 0) {
            res.statusCode = 400
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: 'Valid amount is required.' }))
            return
          }

          const razorpay = new Razorpay({
            key_id: keyId,
            key_secret: keySecret,
          })

          const order = await razorpay.orders.create({
            amount,
            currency,
            receipt,
            payment_capture: 1,
          })

          res.statusCode = 200
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify(order))
        } catch (error) {
          res.statusCode = 500
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: error?.message || 'Unable to create Razorpay order.' }))
        }
      })
    },
  }
}

function localTelegramUploadApi({ telegramToken, telegramChannelId }) {
  return {
    name: 'local-telegram-upload-api',
    configureServer(server) {
      const handler = createTelegramImageHandler({ telegramToken, telegramChannelId })
      const proxyHandler = createTelegramImageProxyHandler({ telegramToken })
      const deleteHandler = createTelegramMediaDeleteHandler({ telegramToken, telegramChannelId })

      server.middlewares.use('/api/upload-image', handler)
      server.middlewares.use('/api/image', proxyHandler)
      server.middlewares.use('/api/delete-telegram-media', deleteHandler)
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const tunnelHost = String(env.VITE_NGROK_HOST || '')
    .trim()
    .replace(/^https?:\/\//, '')
    .replace(/\/$/, '')

  return {
    plugins: [
      react(),
      localRazorpayApi({
        keyId: env.RAZORPAY_KEY_ID || env.VITE_RAZORPAY_KEY_ID,
        keySecret: env.RAZORPAY_KEY_SECRET || env.VITE_RAZORPAY_KEY_SECRET,
      }),
      localTelegramUploadApi({
        telegramToken: env.TELEGRAM_BOT_TOKEN,
        telegramChannelId: env.TELEGRAM_CHANNEL_ID,
      }),
    ],
    // Temporary tunnel access for remote testing via ngrok.
    server: {
      host: true,
      allowedHosts: [
        'localhost',
        '127.0.0.1',
        '.ngrok-free.app',
        '.ngrok.io',
        ...(tunnelHost ? [tunnelHost] : []),
      ],
    },
  }
})
