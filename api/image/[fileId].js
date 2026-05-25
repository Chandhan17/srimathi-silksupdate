import { createTelegramImageProxyHandler } from '../_lib/telegramUpload.js'

export default createTelegramImageProxyHandler({
  telegramToken: process.env.TELEGRAM_BOT_TOKEN,
})