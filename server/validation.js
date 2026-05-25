import { z } from 'zod'

export const deleteTelegramSchema = z.object({
  items: z
    .array(
      z.object({
        telegram_message_id: z.union([z.number().int().positive(), z.string().regex(/^[0-9]+$/)]).optional(),
        message_id: z.union([z.number().int().positive(), z.string().regex(/^[0-9]+$/)]).optional(),
        telegram_chat_id: z.union([z.string(), z.number()]).optional(),
        chat_id: z.union([z.string(), z.number()]).optional(),
      })
    )
    .max(50),
})

export const razorpayOrderSchema = z.object({
  amount: z.number().int().positive().max(50000000),
  currency: z.string().optional().default('INR'),
  receipt: z.string().optional().max(100),
})
