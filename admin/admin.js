// Логика админ-панели RuBlocks

class AdminPanel {
    constructor() {
        this.currentUser = null;
        this.logs = [];
        this.init();
    }

    async init() {
        this.addLog('Инициализация админ-панели...');
        
        // Ждём авторизации
        auth.onAuthStateChanged(async (user) => {
            if (user) {
                this.currentUser = user;
                await this.checkAdminAccess();
            } else {
                this.showAccessDenied('Необходима авторизация');
            }
        });
    }

    // Проверка прав доступа
    async checkAdminAccess() {
        this.addLog('Проверка прав доступа для: ' + this.currentUser.email);

        // Проверяем является ли пользователь админом
        if (adminSystem.isAdmin(this.currentUser)) {
            this.addLog('✅ Доступ разрешён');
            
            // Устанавливаем права в базе если их нет
            const isAdminInDB = await adminSystem.checkAdminInDatabase(this.currentUser.uid);
            if (!isAdminInDB) {
                await adminSystem.setAdminRights(this.currentUser.uid);
            }
            
            this.showAdminPanel();
        } else {
            this.addLog('❌ Доступ запрещён');
            this.showAccessDenied('У вас нет прав администратора');
        }
    }

    // Показать админ-панель
    async showAdminPanel() {
        document.getElementById('access-check').style.display = 'none';
        document.getElementById('admin-panel').style.display = 'block';

        // Устанавливаем имя админа
        document.getElementById('admin-name').textContent = 
            this.currentUser.displayName || this.currentUser.email;

        // Загружаем данные
        await this.loadDashboard();
        
        this.addLog('Админ-панель загружена успешно');
    }

    // Показать отказ в доступе
    showAccessDenied(reason) {
        document.getElementById('access-check').style.display = 'none';
        document.getElementById('access-denied').style.display = 'block';
        
        console.error('🚫 Доступ запрещён:', reason);
    }

    // Загрузка дашборда
    async loadDashboard() {
        try {
            // Загружаем статистику
            const stats = await this.getGeneralStats();
            
            document.getElementById('total-users').textContent = stats.totalUsers;
            document.getElementById('online-users').textContent = stats.onlineUsers;
            document.getElementById('total-games').textContent = stats.totalGames;
            document.getElementById('max-score').textContent = stats.maxScore;

            // Загружаем топ игроков
            await this.loadTopPlayers();

            this.addLog('Дашборд обновлён');
        } catch (error) {
            this.addLog('❌ Ошибка загрузки дашборда: ' + error.message, 'error');
        }
    }

    // Получение общей статистики
    async getGeneralStats() {
        try {
            const usersSnapshot = await db.collection('users').get();
            const gamesSnapshot = await db.collection('games').get();

            let onlineCount = 0;
            let maxScore = 0;

            usersSnapshot.forEach(doc => {
                const data = doc.data();
                if (data.isOnline) onlineCount++;
                if (data.stats && data.stats.highScore > maxScore) {
                    maxScore = data.stats.highScore;
                }
            });

            return {
                totalUsers: usersSnapshot.size,
                onlineUsers: onlineCount,
                totalGames: gamesSnapshot.size,
                maxScore: maxScore
            };
        } catch (error) {
            this.addLog('❌ Ошибка получения статистики: ' + error.message, 'error');
            return {
                totalUsers: 0,
                onlineUsers: 0,
                totalGames: 0,
                maxScore: 0
            };
        }
    }

    // Загрузка топ игроков
    async loadTopPlayers() {
        try {
            const snapshot = await db.collection('users')
                .orderBy('stats.highScore', 'desc')
                .limit(10)
                .get();

            const tbody = document.getElementById('top-players-body');
            tbody.innerHTML = '';

            if (snapshot.empty) {
                tbody.innerHTML = '<tr><td colspan="5">Нет данных</td></tr>';
                return;
            }

            let rank = 1;
            snapshot.forEach(doc => {
                const data = doc.data();
                const row = `
                    <tr>
                        <td>${rank}</td>
                        <td>${data.username || 'Неизвестно'}</td>
                        <td>${data.stats?.highScore || 0}</td>
                        <td>${data.stats?.level || 1}</td>
                        <td>${data.stats?.coins || 0}</td>
                    </tr>
                `;
                tbody.innerHTML += row;
                rank++;
            });

            this.addLog('Топ игроков загружен');
        } catch (error) {
            this.addLog('❌ Ошибка загрузки топ игроков: ' + error.message, 'error');
        }
    }

    // Загрузка всех пользователей
    async loadAllUsers() {
        try {
            const snapshot = await db.collection('users').get();
            const tbody = document.getElementById('users-body');
            tbody.innerHTML = '';

            if (snapshot.empty) {
                tbody.innerHTML = '<tr><td colspan="7">Нет пользователей</td></tr>';
                return;
            }

            snapshot.forEach(doc => {
                const data = doc.data();
                const status = data.isOnline ? 
                    '<span class="status-badge status-online">🟢 Онлайн</span>' :
                    '<span class="status-badge status-offline">⚫ Оффлайн</span>';

                const row = `
                    <tr>
                        <td><img src="${data.avatar || 'https://via.placeholder.com/40'}" class="user-avatar-small"></td>
                        <td>${data.username || 'N/A'}</td>
                        <td>${data.email || 'N/A'}</td>
                        <td>${data.stats?.level || 1}</td>
                        <td>${data.stats?.highScore || 0}</td>
                        <td>${status}</td>
                        <td>
                            <button class="action-btn action-btn-edit" onclick="editUser('${doc.id}')">✏️ Изменить</button>
                            <button class="action-btn action-btn-delete" onclick="deleteUser('${doc.id}')">🗑️ Удалить</button>
                        </td>
                    </tr>
                `;
                tbody.innerHTML += row;
            });

            this.addLog(`Загружено пользователей: ${snapshot.size}`);
        } catch (error) {
            this.addLog('❌ Ошибка загрузки пользователей: ' + error.message, 'error');
        }
    }

    // Добавление лога
    addLog(message, type = 'info') {
        const now = new Date();
        const time = now.toLocaleTimeString('ru-RU');
        
        const log = {
            time: time,
            message: message,
            type: type
        };

        this.logs.push(log);

        // Обновляем отображение логов если на вкладке логов
        const logsContainer = document.getElementById('logs-container');
        if (logsContainer) {
            const logClass = `log-${type}`;
            const logHTML = `
                <div class="log-entry ${logClass}">
                    <span class="log-time">${time}</span>
                    <span class="log-message">${message}</span>
                </div>
            `;
            logsContainer.innerHTML += logHTML;
            logsContainer.scrollTop = logsContainer.scrollHeight;
        }

        // Также пишем в консоль
        console.log(`[${time}] ${message}`);
    }
}

// Переключение вкладок
function showAdminTab(tabName) {
    // Скрываем все вкладки
    document.querySelectorAll('.admin-tab').forEach(tab => {
        tab.style.display = 'none';
    });

    // Убираем active у всех кнопок
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    // Показываем нужную вкладку
    document.getElementById('tab-' + tabName).style.display = 'block';

    // Активируем кнопку
    event.target.classList.add('active');

    // Загружаем данные для вкладки
    if (tabName === 'users') {
        adminPanel.loadAllUsers();
    }

    adminPanel.addLog(`Открыта вкладка: ${tabName}`);
}

// Поиск пользователей
async function searchUsers() {
    const query = document.getElementById('user-search').value.toLowerCase();
    
    if (!query) {
        adminPanel.loadAllUsers();
        return;
    }

    try {
        const snapshot = await db.collection('users').get();
        const tbody = document.getElementById('users-body');
        tbody.innerHTML = '';

        let found = 0;

        snapshot.forEach(doc => {
            const data = doc.data();
            const username = (data.username || '').toLowerCase();
            const email = (data.email || '').toLowerCase();

            if (username.includes(query) || email.includes(query)) {
                const status = data.isOnline ? 
                    '<span class="status-badge status-online">🟢 Онлайн</span>' :
                    '<span class="status-badge status-offline">⚫ Оффлайн</span>';

                const row = `
                    <tr>
                        <td><img src="${data.avatar || 'https://via.placeholder.com/40'}" class="user-avatar-small"></td>
                        <td>${data.username || 'N/A'}</td>
                        <td>${data.email || 'N/A'}</td>
                        <td>${data.stats?.level || 1}</td>
                        <td>${data.stats?.highScore || 0}</td>
                        <td>${status}</td>
                        <td>
                            <button class="action-btn action-btn-edit" onclick="editUser('${doc.id}')">✏️</button>
                            <button class="action-btn action-btn-delete" onclick="deleteUser('${doc.id}')">🗑️</button>
                        </td>
                    </tr>
                `;
                tbody.innerHTML += row;
                found++;
            }
        });

        if (found === 0) {
            tbody.innerHTML = '<tr><td colspan="7">Пользователи не найдены</td></tr>';
        }

        adminPanel.addLog(`Найдено пользователей: ${found}`);
    } catch (error) {
        adminPanel.addLog('❌ Ошибка поиска: ' + error.message, 'error');
    }
}

// Редактирование пользователя
function editUser(userId) {
    adminPanel.addLog(`Редактирование пользователя: ${userId}`);
    alert('Функция редактирования в разработке');
}

// Удаление пользователя
async function deleteUser(userId) {
    if (!confirm('Вы уверены, что хотите удалить этого пользователя?')) {
        return;
    }

    try {
        await db.collection('users').doc(userId).delete();
        adminPanel.addLog(`✅ Пользователь удалён: ${userId}`);
        adminPanel.loadAllUsers();
    } catch (error) {
        adminPanel.addLog(`❌ Ошибка удаления: ${error.message}`, 'error');
        alert('Ошибка удаления пользователя');
    }
}

// Сохранение настроек
async function saveSettings() {
    const settings = {
        baseReward: document.getElementById('setting-base-reward').value,
        winExp: document.getElementById('setting-win-exp').value,
        coinMultiplier: document.getElementById('setting-coin-multiplier').value,
        maintenance: document.getElementById('setting-maintenance').checked
    };

    try {
        await db.collection('settings').doc('game').set(settings);
        adminPanel.addLog('✅ Настройки сохранены');
        alert('Настройки сохранены успешно!');
    } catch (error) {
        adminPanel.addLog(`❌ Ошибка сохранения: ${error.message}`, 'error');
        alert('Ошибка сохранения настроек');
    }
}

// Очистка всех игр
async function clearAllGames() {
    if (!confirm('⚠️ ВНИМАНИЕ! Это удалит историю ВСЕХ игр. Продолжить?')) {
        return;
    }

    try {
        const snapshot = await db.collection('games').get();
        const batch = db.batch();

        snapshot.forEach(doc => {
            batch.delete(doc.ref);
        });

        await batch.commit();
        adminPanel.addLog(`✅ Удалено игр: ${snapshot.size}`);
        alert('История игр очищена');
    } catch (error) {
        adminPanel.addLog(`❌ Ошибка очистки: ${error.message}`, 'error');
        alert('Ошибка очистки истории');
    }
}

// Сброс статистики всех игроков
async function resetAllStats() {
    if (!confirm('⚠️⚠️⚠️ ОПАСНО! Это сбросит статистику ВСЕХ игроков. ВЫ УВЕРЕНЫ?')) {
        return;
    }

    if (!confirm('Последнее предупреждение! Действие необратимо!')) {
        return;
    }

    try {
        const snapshot = await db.collection('users').get();
        const batch = db.batch();

        snapshot.forEach(doc => {
            batch.update(doc.ref, {
                'stats.gamesPlayed': 0,
                'stats.highScore': 0,
                'stats.totalPlayTime': 0,
                'stats.coins': 0,
                'stats.experience': 0,
                'stats.level': 1
            });
        });

        await batch.commit();
        adminPanel.addLog(`✅ Статистика сброшена для ${snapshot.size} пользователей`);
        alert('Статистика всех игроков сброшена');
    } catch (error) {
        adminPanel.addLog(`❌ Ошибка сброса: ${error.message}`, 'error');
        alert('Ошибка сброса статистики');
    }
}

// Обновление логов
function refreshLogs() {
    adminPanel.addLog('🔄 Логи обновлены');
}

// Очистка логов
function clearLogs() {
    document.getElementById('logs-container').innerHTML = '';
    adminPanel.logs = [];
    adminPanel.addLog('Логи очищены');
}

// Экспорт логов
function exportLogs() {
    const logsText = adminPanel.logs.map(log => 
        `[${log.time}] ${log.message}`
    ).join('\n');

    const blob = new Blob([logsText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rublocks-logs-${new Date().getTime()}.txt`;
    a.click();

    adminPanel.addLog('📥 Логи экспортированы');
}

// Инициализация
const adminPanel = new AdminPanel();