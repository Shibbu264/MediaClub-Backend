import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import {getStorage,ref,deleteObject,getDownloadURL,uploadBytesResumable} from "firebase/storage"
const firebaseConfig = {
  apiKey: "AIzaSyCIdSUAaMvMILoIwJDzV1ITEeJ_ba4YUK0",
  authDomain: "media-website-5f8ce.firebaseapp.com",
  projectId: "media-website-5f8ce",
  storageBucket: "media-website-5f8ce.appspot.com",
  messagingSenderId:"337852377444",
  appId: "1:337852377444:web:41defc1dc18671a17df271",
  measurementId: "G-DDGQLS44Z2"
};
const app1 = initializeApp(firebaseConfig);

const storage =getStorage(app1)

export { storage, ref,deleteObject, uploadBytesResumable, getDownloadURL };



