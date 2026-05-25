function getApiBaseUrl() {
  const configuredBase = import.meta.env.VITE_API_BASE_URL?.trim()
  if (configuredBase) {
    return configuredBase.replace(/\/$/, '')
  }

  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin
  }

  return ''
}

function isTelegramDirectUrl(value) {
  return typeof value === 'string' && /^https:\/\/api\.telegram\.org\/file\/bot[^/]+\/.+$/i.test(value)
}

function isTelegramProxyUrl(value) {
  return (
    typeof value === 'string' &&
    (value.startsWith('/api/image/') || /^https?:\/\/[^/]+\/api\/image\//i.test(value))
  )
}

function extractProxyReference(value) {
  if (typeof value !== 'string' || !value.trim()) {
    return ''
  }

  try {
    const url = value.startsWith('http://') || value.startsWith('https://') ? new URL(value) : new URL(value, 'http://local')
    if (!url.pathname.startsWith('/api/image/')) {
      return ''
    }

    return decodeURIComponent(url.pathname.replace(/^\/api\/image\//, ''))
  } catch {
    return ''
  }
}

function extractTelegramFilePath(value) {
  if (!isTelegramDirectUrl(value)) {
    return ''
  }

  try {
    const url = new URL(value)
    return url.pathname.replace(/^\/file\/bot[^/]+\//, '')
  } catch {
    return ''
  }
}

export function getTelegramProxyUrl(fileId) {
  if (!fileId) return ''
  const baseUrl = getApiBaseUrl()
  const proxyPath = `/api/image/${encodeURIComponent(fileId)}`
  return baseUrl ? `${baseUrl}${proxyPath}` : proxyPath
}

function normalizeTelegramUrl(value) {
  const proxyReference = extractProxyReference(value)
  if (proxyReference) {
    return {
      url: getTelegramProxyUrl(proxyReference),
      file_id: proxyReference.includes('/') ? null : proxyReference,
      file_path: proxyReference.includes('/') ? proxyReference : null,
    }
  }

  const telegramFilePath = extractTelegramFilePath(value)
  if (telegramFilePath) {
    return {
      url: getTelegramProxyUrl(telegramFilePath),
      file_id: null,
      file_path: telegramFilePath,
    }
  }

  return null
}

export function normalizeImageItem(item) {
  if (!item) return null

  if (typeof item === 'string') {
    const telegramUrl = normalizeTelegramUrl(item)
    if (telegramUrl) {
      return {
        ...telegramUrl,
        public_id: null,
        telegram_message_id: null,
        telegram_chat_id: null,
      }
    }

    return {
      url: item,
      public_id: null,
      telegram_message_id: null,
      telegram_chat_id: null,
    }
  }

  if (typeof item === 'object' && typeof item.url === 'string') {
    const telegramUrl = normalizeTelegramUrl(item.url)
    if (telegramUrl) {
      return {
        ...telegramUrl,
        public_id: item.public_id || null,
        file_id: item.file_id || telegramUrl.file_id,
        file_path: item.file_path || telegramUrl.file_path,
        telegram_message_id: item.telegram_message_id || null,
        telegram_chat_id: item.telegram_chat_id || null,
      }
    }

    return {
      url: item.url,
      public_id: item.public_id || null,
      file_id: item.file_id || null,
      file_path: item.file_path || null,
      telegram_message_id: item.telegram_message_id || null,
      telegram_chat_id: item.telegram_chat_id || null,
    }
  }

  if (typeof item === 'object' && item.file_id) {
    return {
      url: getTelegramProxyUrl(item.file_id),
      public_id: item.public_id || null,
      file_id: item.file_id,
      file_path: item.file_path || null,
      telegram_message_id: item.telegram_message_id || null,
      telegram_chat_id: item.telegram_chat_id || null,
    }
  }

  if (typeof item === 'object' && item.file_path) {
    return {
      url: getTelegramProxyUrl(item.file_path),
      public_id: item.public_id || null,
      file_id: null,
      file_path: item.file_path,
      telegram_message_id: item.telegram_message_id || null,
      telegram_chat_id: item.telegram_chat_id || null,
    }
  }

  return null
}

export function normalizeImages(items = []) {
  return items.map(normalizeImageItem).filter(Boolean)
}

export function getImageUrl(item) {
  if (!item) return ''
  if (typeof item === 'string') {
    if (isTelegramProxyUrl(item)) {
      const proxyReference = extractProxyReference(item)
      return proxyReference ? getTelegramProxyUrl(proxyReference) : item
    }

    if (isTelegramDirectUrl(item)) {
      const filePath = extractTelegramFilePath(item)
      return filePath ? getTelegramProxyUrl(filePath) : item
    }

    return item
  }
  if (item.file_id) return getTelegramProxyUrl(item.file_id)
  if (item.file_path) return getTelegramProxyUrl(item.file_path)
  if (item.url) {
    if (isTelegramProxyUrl(item.url)) {
      const proxyReference = extractProxyReference(item.url)
      return proxyReference ? getTelegramProxyUrl(proxyReference) : item.url
    }

    if (isTelegramDirectUrl(item.url)) {
      const filePath = extractTelegramFilePath(item.url)
      return filePath ? getTelegramProxyUrl(filePath) : item.url || ''
    }
  }
  return item.url || ''
}

export function getImagePublicId(item) {
  if (!item || typeof item === 'string') return ''
  return typeof item.public_id === 'string' ? item.public_id : ''
}

export function getPrimaryImageUrl(images, fallback = '') {
  const first = Array.isArray(images) ? images[0] : null
  return getImageUrl(first) || fallback
}