const admin = require('firebase-admin')

// ඔබගේ Firebase Admin SDK Configuration එක මෙතනට ඇතුලත් කරන්න
const serviceAccount = require('./path/to/your/serviceAccountKey.json')

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
})

const db = admin.firestore()

async function updateEmployeeIds() {
  const salariesRef = db.collection('salaries')
  const snapshot = await salariesRef.get()

  snapshot.forEach((doc) => {
    const data = doc.data()
    // මෙතන ඔබගේ වැරදි employeeId හඳුනාගැනීමේ Logic එක දාන්න
    // උදාහරණයක් විදිහට, යම් රටාවකට නොගැලපෙන ඒවා හෝ නිශ්චිත වැරදි අගයන්
    if (data.employeeId === 'old-wrong-id') {
      const newEmployeeId = 'correct-user-uid' // නිවැරදි uid එක මෙතනට දාන්න
      salariesRef
        .doc(doc.id)
        .update({ employeeId: newEmployeeId })
        .then(() => console.log(`Document ${doc.id} updated!`))
        .catch((error) => console.error(`Error updating document ${doc.id}:`, error))
    }
  })
}

updateEmployeeIds()
