// src/firebase.js
import { initializeApp } from 'firebase/app'
import { getAuth, onAuthStateChanged } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
// Replace this with your actual config
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: 'AIzaSyCrL26aKI-T3Vnb6fFfzLbikQSQyxMtUCo',
  authDomain: 'payroll-system-12a3f.firebaseapp.com',
  projectId: 'payroll-system-12a3f',
  storageBucket: 'payroll-system-12a3f.firebasestorage.app',
  messagingSenderId: '788344871563',
  appId: '1:788344871563:web:6c153cca41312b1c56d28e',
  measurementId: 'G-DL13QCBY2H',
}

const app = initializeApp(firebaseConfig)

const auth = getAuth(app)
const db = getFirestore(app)

export { auth, db, onAuthStateChanged }
