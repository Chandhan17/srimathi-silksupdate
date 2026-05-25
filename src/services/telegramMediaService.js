import axios from 'axios'
import { getIdToken } from './authService'

const deleteEndpoint = '/api/delete-telegram-media'

export async function deleteTelegramMedia(items = []) {
  if (!Array.isArray(items) || !items.length) {
    return {
      deletedCount: 0,
      skippedCount: 0,
      failedCount: 0,
      failures: [],
    }
  }

  const token = await getIdToken()
  const response = await axios.post(deleteEndpoint, { items }, { headers: token ? { Authorization: `Bearer ${token}` } : undefined })
  return response.data || {
    deletedCount: 0,
    skippedCount: 0,
    failedCount: 0,
    failures: [],
  }
}