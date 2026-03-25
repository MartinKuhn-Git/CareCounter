// Firebase Konfiguration
const firebaseConfig = {
  apiKey: "AIzaSyDjHY6KBUkh1qv7bybZ1WurNsSizTnIg9I",
  authDomain: "carecounter.firebaseapp.com",
  projectId: "carecounter",
  storageBucket: "carecounter.firebasestorage.app",
  messagingSenderId: "107321952484",
  appId: "1:107321952484:web:ebd740fd162fcebed204f1",
  measurementId: "G-DPBVDHQT4Q"
};

// Firebase initialisieren
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
