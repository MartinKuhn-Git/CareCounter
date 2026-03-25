// User Service - Firestore CRUD für User
const UserService = {
  // Alle User laden
  async getAll() {
    const snapshot = await db.collection('users').orderBy('name').get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },

  // User erstellen
  async create(name) {
    const docRef = await db.collection('users').add({
      name: name.trim(),
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    return { id: docRef.id, name: name.trim() };
  },

  // User löschen
  async delete(userId) {
    // Erst alle Aktivitäten des Users löschen
    const activities = await db.collection('activities')
      .where('userId', '==', userId)
      .get();
    const batch = db.batch();
    activities.docs.forEach(doc => batch.delete(doc.ref));
    batch.delete(db.collection('users').doc(userId));
    await batch.commit();
  }
};
