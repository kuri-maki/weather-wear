// Firebase の設定
const firebaseConfig = {
    apiKey: "AIzaSyD_8bJZ2RJ2bWO33j_eXVmleLYLhZZQADU",
    authDomain: "weatherwear-5f7fd.firebaseapp.com",
    databaseURL: "https://weatherwear-5f7fd-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "weatherwear-5f7fd",
    storageBucket: "weatherwear-5f7fd.appspot.com",
    messagingSenderId: "1098015301561",
    appId: "1:1098015301561:web:27829bfa70d31eef7da068",
    measurementId: "G-KQMKDC17XL"
};

//const app = initializeApp(firebaseConfig);
//const auth = getAuth(app);
//const db = getDatabase(app);

firebase.initializeApp(firebaseConfig);

// Auth, Realtime Database のインスタンスを取得

const auth = firebase.auth();
const db = firebase.database();

// Firebase 初期化
//const auth = firebase.auth();
//const db = firebase.database();
