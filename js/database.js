// Работа с базой данных Firestore для RuBlocks

class Database {
    constructor() {
        this.db = db;
        this.usersCollection = 'users';
        this.gamesCollection = 'games';
    }

    // Создание профиля пользователя
    async createUserProfile(userId, userData) {
        try {
            await this.db.collection(this.usersCollection).doc(userId).set({
                username: userData.username,
                email: userData.email,
                avatar: userData.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`,
                stats: {
                    gamesPlayed: 0,
                    highScore: 0,
                    totalPlayTime: 0,
                    level: 1,
                    coins: 0,
                    experience: 0
                },
                inventory: [],
                friends: [],
                achievements: [],
                settings: {
                    notifications: true,
                    soundEnabled: true,
                    musicEnabled: true
                },
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                lastLogin: firebase.firestore.FieldValue.serverTimestamp(),
                isOnline: true
            });

            console.log('✅ Профиль пользователя создан');
            return true;
        } catch (error) {
            console.error('❌ Ошибка создания профиля:', error);
            return false;
        }
    }

    // Получение профиля пользователя
    async getUserProfile(userId) {
        try {
            const doc = await this.db.collection(this.usersCollection).doc(userId).get();
            
            if (doc.exists) {
                return { id: doc.id, ...doc.data() };
            } else {
                console.warn('⚠️ Профиль не найден');
                return null;
            }
        } catch (error) {
            console.error('❌ Ошибка получения профиля:', error);
            return null;
        }
    }

    // Обновление последнего входа
    async updateLastLogin(userId) {
        try {
            await this.db.collection(this.usersCollection).doc(userId).update({
                lastLogin: firebase.firestore.FieldValue.serverTimestamp(),
                isOnline: true
            });
            console.log('✅ Время входа обновлено');
        } catch (error) {
            console.error('❌ Ошибка обновления времени входа:', error);
        }
    }

    // Обновление статистики игрока
    async updateStats(userId, stats) {
        try {
            const userRef = this.db.collection(this.usersCollection).doc(userId);
            const doc = await userRef.get();
            
            if (!doc.exists) {
                console.error('❌ Пользователь не найден');
                return null;
            }

            const currentStats = doc.data().stats || {};
            
            // Обновляем статистику
            const updatedStats = {
                gamesPlayed: (currentStats.gamesPlayed || 0) + (stats.gamesPlayed || 0),
                highScore: Math.max(currentStats.highScore || 0, stats.highScore || 0),
                totalPlayTime: (currentStats.totalPlayTime || 0) + (stats.totalPlayTime || 0),
                level: currentStats.level || 1,
                coins: (currentStats.coins || 0) + (stats.coins || 0),
                experience: (currentStats.experience || 0) + (stats.experience || 0)
            };

            // Проверяем повышение уровня
            const newLevel = Math.floor(updatedStats.experience / 100) + 1;
            if (newLevel > updatedStats.level) {
                updatedStats.level = newLevel;
                console.log('🎉 Новый уровень:', newLevel);
            }

            await userRef.update({ stats: updatedStats });
            console.log('✅ Статистика обновлена:', updatedStats);
            
            return updatedStats;
        } catch (error) {
            console.error('❌ Ошибка обновления статистики:', error);
            return null;
        }
    }

    // Установка онлайн статуса
    async setOnlineStatus(userId, isOnline) {
        try {
            await this.db.collection(this.usersCollection).doc(userId).update({
                isOnline: isOnline,
                lastSeen: firebase.firestore.FieldValue.serverTimestamp()
            });
        } catch (error) {
            console.error('❌ Ошибка обновления статуса:', error);
        }
    }

    // Получение таблицы лидеров
    async getLeaderboard(limit = 10) {
        try {
            const snapshot = await this.db.collection(this.usersCollection)
                .orderBy('stats.highScore', 'desc')
                .limit(limit)
                .get();

            const leaderboard = [];
            snapshot.forEach(doc => {
                const data = doc.data();
                leaderboard.push({
                    id: doc.id,
                    username: data.username,
                    highScore: data.stats?.highScore || 0,
                    level: data.stats?.level || 1,
                    avatar: data.avatar
                });
            });

            console.log('✅ Таблица лидеров загружена:', leaderboard.length, 'игроков');
            return leaderboard;
        } catch (error) {
            console.error('❌ Ошибка получения таблицы лидеров:', error);
            return [];
        }
    }

    // Добавление предмета в инвентарь
    async addToInventory(userId, item) {
        try {
            const userRef = this.db.collection(this.usersCollection).doc(userId);
            
            await userRef.update({
                inventory: firebase.firestore.FieldValue.arrayUnion(item)
            });

            console.log('✅ Предмет добавлен в инвентарь:', item);
            return true;
        } catch (error) {
            console.error('❌ Ошибка добавления в инвентарь:', error);
            return false;
        }
    }

    // Сохранение игровой сессии
    async saveGameSession(userId, gameData) {
        try {
            await this.db.collection(this.gamesCollection).add({
                userId: userId,
                score: gameData.score,
                duration: gameData.duration,
                level: gameData.level,
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            });

            console.log('✅ Игровая сессия сохранена');
            return true;
        } catch (error) {
            console.error('❌ Ошибка сохранения сессии:', error);
            return false;
        }
    }
}

// Создаём глобальный экземпляр
const database = new Database();
console.log('💾 Database инициализирована');