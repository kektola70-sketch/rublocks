// Система проверки прав администратора

class AdminSystem {
    constructor() {
        this.adminEmails = [
            'tolikpro128@gmail.com',
            'tolikpro128@mail.ru',
            'tolikpro128@yandex.ru'
            // Добавьте все ваши email-адреса
        ];
        
        this.adminUIDs = [
            // Добавятся автоматически при первом входе
        ];
    }

    // Проверка является ли пользователь админом
    isAdmin(user) {
        if (!user) return false;
        
        // Проверяем по email
        if (this.adminEmails.includes(user.email)) {
            return true;
        }
        
        // Проверяем по UID
        if (this.adminUIDs.includes(user.uid)) {
            return true;
        }
        
        // Проверяем по username
        if (user.username === 'tolikpro128' || user.displayName === 'tolikpro128') {
            return true;
        }
        
        return false;
    }

    // Установка прав администратора в профиле
    async setAdminRights(userId) {
        try {
            await db.collection('users').doc(userId).update({
                isAdmin: true,
                adminSince: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            console.log('✅ Права администратора установлены');
            return true;
        } catch (error) {
            console.error('❌ Ошибка установки прав:', error);
            return false;
        }
    }

    // Проверка прав из базы данных
    async checkAdminInDatabase(userId) {
        try {
            const doc = await db.collection('users').doc(userId).get();
            
            if (doc.exists) {
                return doc.data().isAdmin === true;
            }
            
            return false;
        } catch (error) {
            console.error('❌ Ошибка проверки прав:', error);
            return false;
        }
    }

    // Показать кнопку админ-панели
    showAdminButton() {
        const adminBtn = document.createElement('button');
        adminBtn.className = 'btn-admin';
        adminBtn.innerHTML = '⚙️ Админ-панель';
        adminBtn.onclick = () => {
            window.location.href = '../admin/index.html';
        };
        
        const header = document.querySelector('.game-header');
        if (header) {
            header.appendChild(adminBtn);
        }
    }
}

const adminSystem = new AdminSystem();