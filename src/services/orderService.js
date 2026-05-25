import {
  addDoc,
  collection,
  deleteDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  doc,
} from 'firebase/firestore'
import { db } from './firebase'

const ordersCollection = collection(db, 'orders')

function normalizeOrder(snapshot) {
  const data = snapshot.data()

  return {
    id: snapshot.id,
    ...data,
    createdAt: data.createdAt?.toDate?.() || null,
  }
}

export async function createOrder(data) {
  const payload = {
    productName: data.productName || '',
    price: Number(data.price) || 0,
    image: data.image || '',
    selectedSize: data.selectedSize || '',
    customer: {
      name: data.customer?.name || '',
      phone: data.customer?.phone || '',
      address: data.customer?.address || '',
    },
    paymentMethod: data.paymentMethod || 'whatsapp',
    paymentStatus: data.paymentStatus || 'pending',
    orderStatus: data.orderStatus || 'initiated',
    createdAt: serverTimestamp(),
  }

  const docRef = await addDoc(ordersCollection, payload)
  return docRef.id
}

export async function getOrders() {
  const ordersQuery = query(ordersCollection, orderBy('createdAt', 'desc'))
  const snapshot = await getDocs(ordersQuery)
  return snapshot.docs.map(normalizeOrder)
}

export async function updateOrder(orderId, updates) {
  const orderRef = doc(db, 'orders', orderId)
  await updateDoc(orderRef, updates)
}

export async function removeOrder(orderId) {
  const orderRef = doc(db, 'orders', orderId)
  await deleteDoc(orderRef)
}

export function subscribeOrders(onNext, onError) {
  const ordersQuery = query(ordersCollection, orderBy('createdAt', 'desc'))

  return onSnapshot(
    ordersQuery,
    (snapshot) => {
      onNext(snapshot.docs.map(normalizeOrder))
    },
    onError,
  )
}
