// Activity Service - Firestore CRUD für Tätigkeiten

// Vordefinierte Tätigkeiten
const DEFAULT_ACTIVITIES = [
  'Aufräumen',
  'Putzen',
  'Kochen',
  'Lebensmitteleinkauf',
  'Wäsche',
  'Kinderkleidung kaufen/organisieren/ausmisten',
  'Kinder bringen/abholen (Kita/Schule)',
  'Arztbesuche (Kinder)',
  'Hausaufgaben/Schulbegleitung',
  'Spielen mit Kindern'
];

const ActivityService = {
  // Alle Aktivitäten eines Users laden
  async getByUser(userId) {
    const snapshot = await db.collection('activities')
      .where('userId', '==', userId)
      .get();
    const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    // Client-seitig sortieren um zusammengesetzten Index zu vermeiden
    return docs.sort((a, b) => {
      const ta = a.createdAt?.seconds || 0;
      const tb = b.createdAt?.seconds || 0;
      return tb - ta;
    });
  },

  // Alle Aktivitäten laden (für Dashboard)
  async getAll() {
    const snapshot = await db.collection('activities').get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },

  // Aktivität erstellen
  async create(userId, activityName, duration, unit) {
    const docRef = await db.collection('activities').add({
      userId,
      activityName,
      duration: parseFloat(duration),
      unit, // 'hours_per_day' oder 'hours_per_week'
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    return { id: docRef.id, userId, activityName, duration: parseFloat(duration), unit };
  },

  // Aktivität aktualisieren
  async update(activityId, data) {
    await db.collection('activities').doc(activityId).update({
      ...data,
      duration: parseFloat(data.duration),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
  },

  // Aktivität löschen
  async delete(activityId) {
    await db.collection('activities').doc(activityId).delete();
  },

  // Alle einzigartigen Tätigkeitsnamen laden (vordefinierte + benutzerdefinierte)
  async getAllActivityNames() {
    const snapshot = await db.collection('activities').get();
    const customNames = new Set(snapshot.docs.map(doc => doc.data().activityName));
    const allNames = new Set([...DEFAULT_ACTIVITIES, ...customNames]);
    return [...allNames].sort();
  },

  // Stunden pro Woche berechnen
  toWeeklyHours(duration, unit) {
    if (unit === 'hours_per_day') {
      return duration * 7;
    }
    return duration; // already hours_per_week
  }
};
