import { db } from '../services/firebase'
import {
  doc,
  setDoc,
  collection,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore'

export const initializeFirestore = async (adminUid) => {
  try {
    if (!adminUid) {
      throw new Error('adminUid is required to initialize Firestore')
    }

    //----------------------------------
    // 1. CREATE ADMIN DOCUMENT
    //----------------------------------

    await setDoc(doc(db, 'admins', adminUid), {
      isAdmin: true,
      createdAt: serverTimestamp(),
    })

    console.log('Admin created')

    //----------------------------------
    // 2. ADD SAMPLE PRODUCTS
    //----------------------------------

    const sampleProducts = [
      {
        name: 'Kanchi Pattu Saree',
        price: 5500,
        category: 'Pattu',
        fabric: 'Kanchi pattu',
        description: 'Length: 5.5 mtr\nBlouse: 0.8 mtr',
        images: ['https://via.placeholder.com/300'],
        createdAt: serverTimestamp(),
      },
      {
        name: 'Gadwal Cotton Saree',
        price: 2500,
        category: 'Cotton',
        fabric: 'Gadwal cotton',
        description: 'Length: 5.5 mtr\nBlouse: 0.8 mtr',
        images: ['https://via.placeholder.com/300'],
        createdAt: serverTimestamp(),
      },
    ]

    for (const product of sampleProducts) {
      await addDoc(collection(db, 'products'), product)
    }

    console.log('Products added')

    //----------------------------------
    // 3. ADD SAMPLE INQUIRY
    //----------------------------------

    await addDoc(collection(db, 'inquiries'), {
      name: 'Demo Customer',
      phone: '9999999999',
      budget: '5000',
      property: 'Sample Product',
      status: 'pending',
      createdAt: serverTimestamp(),
    })

    console.log('Inquiry added')

    //----------------------------------

    console.log('Firestore initialized successfully')
  } catch (error) {
    console.error('Initialization error:', error)
    throw error
  }
}
