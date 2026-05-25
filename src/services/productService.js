import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore'
import { db } from './firebase'
import { normalizeImages } from '../utils/imageHelpers'
import { deleteTelegramMedia } from './telegramMediaService'

const productsCollection = collection(db, 'products')
let productsCache = null
let productsPromise = null

function normalizeProduct(snapshot) {
  const data = snapshot.data()
  return {
    id: snapshot.id,
    ...data,
    images: normalizeImages(data.images || []),
    inStock: data.inStock ?? true,
  }
}

export function invalidateProductsCache() {
  productsCache = null
  productsPromise = null
}

export async function fetchProducts(forceRefresh = false) {
  if (!forceRefresh && productsCache) {
    return productsCache
  }

  if (!forceRefresh && productsPromise) {
    return productsPromise
  }

  const productsQuery = query(productsCollection, orderBy('createdAt', 'desc'))

  productsPromise = getDocs(productsQuery)
    .then((snapshot) => {
      productsCache = snapshot.docs.map(normalizeProduct)
      return productsCache
    })
    .finally(() => {
      productsPromise = null
    })

  return productsPromise
}

export async function fetchProductById(productId) {
  if (productsCache) {
    const found = productsCache.find((product) => product.id === productId)
    if (found) return found
  }

  const productRef = doc(db, 'products', productId)
  const snapshot = await getDoc(productRef)

  if (!snapshot.exists()) {
    return null
  }

  return normalizeProduct(snapshot)
}

export async function createProduct(payload) {
  const data = {
    ...payload,
    images: normalizeImages(payload.images || []),
    createdAt: serverTimestamp(),
  }

  const docRef = await addDoc(productsCollection, data)
  invalidateProductsCache()
  return docRef.id
}

export async function editProduct(productId, payload) {
  const productRef = doc(db, 'products', productId)
  await updateDoc(productRef, {
    ...payload,
    images: normalizeImages(payload.images || []),
  })
  invalidateProductsCache()
}

export async function removeProduct(productId) {
  const productRef = doc(db, 'products', productId)

  const snapshot = await getDoc(productRef)
  if (!snapshot.exists()) {
    return
  }

  const product = normalizeProduct(snapshot)
  const deleteResult = await deleteTelegramMedia(product.images || [])

  await deleteDoc(productRef)
  invalidateProductsCache()

  return deleteResult
}
