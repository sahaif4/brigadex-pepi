import { initializeApp } from 'firebase/app';
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyCltms5NiFJfjyLrJPovdyXvHucVqlSnd8",
  authDomain: "orbital-office-zj1d7.firebaseapp.com",
  projectId: "orbital-office-zj1d7",
  storageBucket: "orbital-office-zj1d7.firebasestorage.app",
  messagingSenderId: "715014353510",
  appId: "1:715014353510:web:9a95d77238f30398f033a7",
  measurementId: ""
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, "ai-studio-remixbrigadexpep-610863d5-f7b2-4c55-890c-fcbf89208760");

// Enable offline persistence
enableIndexedDbPersistence(db).catch((err) => {
  if (err.code == 'failed-precondition') {
    console.warn('Multiple tabs open, persistence can only be enabled in one tab at a a time.');
  } else if (err.code == 'unimplemented') {
    console.warn('The current browser does not support all of the features required to enable persistence');
  }
});

export const auth = getAuth(app);

