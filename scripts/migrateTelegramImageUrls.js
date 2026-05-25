import { readFileSync } from 'node:fs'
import process from 'node:process'
import { applicationDefault, cert, getApps, initializeApp } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

const TELEGRAM_DIRECT_URL_REGEX = /^https:\/\/api\.telegram\.org\/file\/bot[^/]+\/(.+)$/i
const PROXY_PREFIX = '/api/image/'
const BATCH_WRITE_LIMIT = 400

function parseArgs(argv) {
  const args = new Set(argv)
  return {
    dryRun: !args.has('--apply') && !args.has('--write'),
    limit: args.has('--limit') ? Number(argv[argv.indexOf('--limit') + 1]) : null,
    collectionName: args.has('--collection') ? String(argv[argv.indexOf('--collection') + 1] || 'products') : 'products',
  }
}

function loadCredential() {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    return cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON))
  }

  if (process.env.FIREBASE_SERVICE_ACCOUNT_FILE) {
    const raw = readFileSync(process.env.FIREBASE_SERVICE_ACCOUNT_FILE, 'utf8')
    return cert(JSON.parse(raw))
  }

  return applicationDefault()
}

function initializeFirebaseAdmin() {
  if (getApps().length) {
    return
  }

  initializeApp({
    credential: loadCredential(),
    projectId: process.env.FIREBASE_PROJECT_ID || process.env.GCLOUD_PROJECT,
  })
}

function buildProxyUrl(fileRef) {
  return `${PROXY_PREFIX}${encodeURIComponent(fileRef)}`
}

function extractProxyReference(value) {
  if (typeof value !== 'string') {
    return ''
  }

  const trimmed = value.trim()
  if (!trimmed) {
    return ''
  }

  try {
    const parsed = trimmed.startsWith('http://') || trimmed.startsWith('https://')
      ? new URL(trimmed)
      : new URL(trimmed, 'http://local')

    if (!parsed.pathname.startsWith(PROXY_PREFIX)) {
      return ''
    }

    return decodeURIComponent(parsed.pathname.slice(PROXY_PREFIX.length))
  } catch {
    return ''
  }
}

function extractTelegramFilePath(value) {
  if (typeof value !== 'string') {
    return ''
  }

  const match = value.match(TELEGRAM_DIRECT_URL_REGEX)
  return match?.[1] ? decodeURIComponent(match[1]) : ''
}

function isProxyUrl(value) {
  return typeof value === 'string' && !!extractProxyReference(value)
}

function migrateTelegramImageValue(value) {
  if (typeof value === 'string') {
    const proxyRef = extractProxyReference(value)
    if (proxyRef) {
      const nextUrl = buildProxyUrl(proxyRef)
      return {
        value: nextUrl,
        changed: value !== nextUrl,
        matched: true,
        source: 'proxy-url',
        fileRef: proxyRef,
      }
    }

    const filePath = extractTelegramFilePath(value)
    if (!filePath) {
      return { value, changed: false, matched: false }
    }

    return {
      value: buildProxyUrl(filePath),
      changed: true,
      matched: true,
      source: 'legacy-string-url',
      fileRef: filePath,
    }
  }

  if (!value || typeof value !== 'object') {
    return { value, changed: false, matched: false }
  }

  const nextValue = { ...value }
  const currentUrl = typeof value.url === 'string' ? value.url : ''
  const proxyRef = extractProxyReference(currentUrl)
  const fileRef = typeof value.file_id === 'string' && value.file_id
    ? value.file_id
    : typeof value.file_path === 'string' && value.file_path
      ? value.file_path
      : proxyRef
        || extractTelegramFilePath(currentUrl)

  if (!fileRef) {
    if (isProxyUrl(currentUrl)) {
      return { value, changed: false, matched: true }
    }

    return { value, changed: false, matched: false }
  }

  const nextUrl = buildProxyUrl(fileRef)
  const nextFilePath = fileRef.includes('/') ? fileRef : nextValue.file_path || null
  const changed = currentUrl !== nextUrl || nextValue.file_path !== nextFilePath || nextValue.url !== nextUrl

  nextValue.url = nextUrl

  nextValue.file_path = nextFilePath

  return {
    value: nextValue,
    changed,
    matched: true,
    source: value.file_id ? 'file-id' : value.file_path ? 'file-path' : 'legacy-object-url',
    fileRef,
  }
}

function migrateProductDocument(data) {
  const nextData = { ...data }
  const changedFields = []
  const matchedLegacyTelegram = []

  if (Array.isArray(data.images)) {
    const migratedImages = data.images.map((item, index) => {
      const migrated = migrateTelegramImageValue(item)
      if (migrated.matched) {
        matchedLegacyTelegram.push(`images[${index}]`)
      }
      if (migrated.changed) {
        return migrated.value
      }
      return item
    })

    if (JSON.stringify(migratedImages) !== JSON.stringify(data.images)) {
      nextData.images = migratedImages
      changedFields.push('images')
    }
  }

  if (Object.prototype.hasOwnProperty.call(data, 'sizeChartImage') && data.sizeChartImage !== null && data.sizeChartImage !== undefined && data.sizeChartImage !== '') {
    const migratedSizeChart = migrateTelegramImageValue(data.sizeChartImage)
    if (migratedSizeChart.matched) {
      matchedLegacyTelegram.push('sizeChartImage')
    }
    if (migratedSizeChart.changed) {
      nextData.sizeChartImage = migratedSizeChart.value
      changedFields.push('sizeChartImage')
    }
  }

  return {
    nextData,
    changedFields,
    matchedLegacyTelegram,
    changed: changedFields.length > 0,
  }
}

function logSummary({ dryRun, total, matched, changed, skipped, limit, collectionName }) {
  console.log(`Mode: ${dryRun ? 'dry-run' : 'apply'}`)
  console.log(`Collection: ${collectionName}`)
  if (typeof limit === 'number' && Number.isFinite(limit)) {
    console.log(`Limit: ${limit}`)
  }
  console.log(`Scanned: ${total}`)
  console.log(`Matched Telegram records: ${matched}`)
  console.log(`Updated records: ${changed}`)
  console.log(`Skipped non-Telegram records: ${skipped}`)
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  initializeFirebaseAdmin()

  const db = getFirestore()
  const snapshot = await db.collection(args.collectionName).get()

  let scanned = 0
  let matched = 0
  let updated = 0
  let skipped = 0
  let pendingBatch = db.batch()
  let pendingWrites = 0

  const flushBatch = async () => {
    if (args.dryRun || pendingWrites === 0) {
      pendingBatch = db.batch()
      pendingWrites = 0
      return
    }

    await pendingBatch.commit()
    pendingBatch = db.batch()
    pendingWrites = 0
  }

  for (const docSnap of snapshot.docs) {
    if (typeof args.limit === 'number' && Number.isFinite(args.limit) && scanned >= args.limit) {
      break
    }

    scanned += 1

    const data = docSnap.data()
    const migration = migrateProductDocument(data)

    if (!migration.matchedLegacyTelegram.length) {
      skipped += 1
      continue
    }

    matched += 1

    if (!migration.changed) {
      console.log(`Already migrated: ${docSnap.id}${data.name ? ` (${data.name})` : ''}`)
      continue
    }

    updated += 1
    console.log(`Updating: ${docSnap.id}${data.name ? ` (${data.name})` : ''} -> ${migration.changedFields.join(', ')}`)

    if (!args.dryRun) {
      const updateData = {}

      if (migration.changedFields.includes('images')) {
        updateData.images = migration.nextData.images
      }

      if (migration.changedFields.includes('sizeChartImage')) {
        updateData.sizeChartImage = migration.nextData.sizeChartImage
      }

      pendingBatch.update(docSnap.ref, updateData)
      pendingWrites += 1

      if (pendingWrites >= BATCH_WRITE_LIMIT) {
        await flushBatch()
      }
    }
  }

  await flushBatch()
  logSummary({
    dryRun: args.dryRun,
    total: scanned,
    matched,
    changed: updated,
    skipped,
    limit: args.limit,
    collectionName: args.collectionName,
  })
}

main().catch((error) => {
  console.error('Telegram URL migration failed:')
  console.error(error)
  process.exitCode = 1
})