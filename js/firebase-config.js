// Firebase Configuration для RuBlocks
// Используем compat версию для простоты

const firebaseConfig = {
    apiKey: "AIzaSyA76Du2jnVguJavcO7k6XFEQJ0tPhHF_UI",
    authDomain: "rublocks-2862b.firebaseapp.com",
    projectId: "rublocks-2862b",
    storageBucket: "rublocks-2862b.firebasestorage.app",
    messagingSenderId: "1035853997972",
    appId: "1:1035853997972:web:77cf13e7197b9387cd9181"
};

// Инициализация Firebase
try {
    firebase.initializeApp(firebaseConfig);
    console.log('🔥 Firebase инициализирован успешно!');
    console.log('📦 Project ID:', firebaseConfig.projectId);
} catch (error) {
    console.error('❌ Ошибка инициализации Firebase:', error);
    alert('Ошибка подключения к Firebase!');
}

// Получаем сервисы
const auth = firebase.auth();
const db = firebase.firestore();

// Настраиваем язык ошибок на русский
auth.languageCode = 'ru';

// Настройки Firestore
db.settings({
    cacheSizeBytes: firebase.firestore.CACHE_SIZE_UNLIMITED
});

// Включаем оффлайн режим (опционально)
db.enablePersistence({ synchronizeTabs: true })
    .then(() => {
        console.log('💾 Оффлайн режим включён');
    })
    .catch((err) => {
        if (err.code === 'failed-precondition') {
            console.warn('⚠️ Несколько вкладок открыто, оффлайн режим отключён');
        } else if (err.code === 'unimplemented') {
            console.warn('⚠️ Браузер не поддерживает оффлайн режим');
        }
    });

// Проверка подключения к Firestore
console.log('🔌 Проверка подключения к Firestore...');

db.collection('_test_').doc('connection_check')
    .set({ 
        test: true, 
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        message: 'RuBlocks подключён!'
    })
    .then(() => {
        console.log('✅ Firestore работает! Подключение успешно');
        return db.collection('_test_').doc('connection_check').delete();
    })
    .then(() => {
        console.log('🧹 Тестовые данные очищены');
    })
    .catch((error) => {
        console.error('❌ ОШИБКА FIRESTORE:', error.code);
        console.error('📄 Сообщение:', error.message);
        
        if (error.code === 'permission-denied') {
            console.error(`
╔═══════════════════════════════════════════════════╗
║  ⚠️  ОШИБКА ДОСТУПА К FIRESTORE                   ║
╠═══════════════════════════════════════════════════╣
║                                                   ║
║  РЕШЕНИЕ:                                         ║
║                                                   ║
║  1. Откройте Firebase Console                     ║
║  2. Firestore Database → Rules                    ║
║  3. Вставьте правила (см. ниже)                   ║
║  4. Нажмите "Publish"                             ║
║  5. Подождите 30 секунд                           ║
║  6. Обновите страницу (F5)                        ║
║                                                   ║
╚═══════════════════════════════════════════════════╝

ПРАВИЛА ДЛЯ FIRESTORE:

rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null && request.auth.uid == userId;
      allow update, delete: if request.auth != null && request.auth.uid == userId;
    }
    match /_test_/{document=**} {
      allow read, write: if true;
    }
  }
}
            `);
            
            alert('⚠️ Ошибка доступа к базе данных!\n\nОткройте консоль (F12) для подробностей.');
        }
    });

// Отслеживание состояния авторизации
auth.onAuthStateChanged((user) => {
    if (user) {
        console.log('👤 Пользователь:', user.email);
        console.log('🆔 UID:', user.uid);
    } else {
        console.log('👋 Не авторизован');
    }
});