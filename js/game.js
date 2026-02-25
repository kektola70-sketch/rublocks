// Игровая логика RuBlocks

class RuBlocks {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.user = null;
        this.score = 0;
        this.coins = 0;
        this.startTime = null;
        this.isInitialized = false;
        
        console.log('🎮 RuBlocks: Конструктор вызван');
        
        // Ждём полной загрузки страницы
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.waitForAuth());
        } else {
            this.waitForAuth();
        }
    }

    // Ждём авторизации
    waitForAuth() {
        console.log('⏳ Ожидание авторизации...');
        
        // Проверяем наличие auth
        if (typeof auth === 'undefined') {
            console.error('❌ Firebase Auth не загружен!');
            this.showError('Ошибка загрузки Firebase');
            return;
        }

        // Слушаем изменения авторизации
        auth.onAuthStateChanged((user) => {
            if (user) {
                console.log('✅ Пользователь авторизован:', user.email);
                this.onUserReady(user);
            } else {
                console.log('❌ Пользователь не авторизован, перенаправление...');
                setTimeout(() => {
                    window.location.href = '../index.html';
                }, 1000);
            }
        });
    }

    // Когда пользователь готов
    async onUserReady(firebaseUser) {
        console.log('👤 Загрузка профиля пользователя...');
        
        try {
            // Ждём полной загрузки профиля
            let attempts = 0;
            const maxAttempts = 20;
            
            while (attempts < maxAttempts) {
                const currentUser = authSystem.getCurrentUser();
                
                if (currentUser && currentUser.username) {
                    this.user = currentUser;
                    console.log('✅ Профиль загружен:', this.user.username);
                    await this.init();
                    return;
                }
                
                await this.sleep(250);
                attempts++;
            }
            
            // Если профиль не загрузился - создаём базовый
            console.warn('⚠️ Профиль не загрузился, создаём базовый');
            this.user = {
                uid: firebaseUser.uid,
                username: firebaseUser.displayName || firebaseUser.email.split('@')[0],
                email: firebaseUser.email,
                stats: {
                    highScore: 0,
                    level: 1,
                    coins: 0,
                    gamesPlayed: 0
                }
            };
            
            await this.init();
            
        } catch (error) {
            console.error('❌ Ошибка загрузки пользователя:', error);
            this.showError('Ошибка загрузки профиля');
        }
    }

    // Инициализация игры
    async init() {
        if (this.isInitialized) {
            console.warn('⚠️ Игра уже инициализирована');
            return;
        }

        console.log('🎮 Инициализация игры...');

        try {
            // Получаем элементы
            this.canvas = document.getElementById('game-canvas');
            
            if (!this.canvas) {
                throw new Error('Canvas не найден!');
            }

            this.ctx = this.canvas.getContext('2d');
            this.startTime = Date.now();

            // Обновляем UI
            this.updateUI();

            // Настраиваем canvas
            this.setupCanvas();

            // Скрываем экран загрузки
            this.hideLoadingScreen();

            // Запускаем игру
            this.startGame();

            // Привязываем события
            this.bindEvents();

            this.isInitialized = true;
            console.log('✅ Игра инициализирована успешно!');

        } catch (error) {
            console.error('❌ Ошибка инициализации:', error);
            this.showError('Ошибка запуска игры: ' + error.message);
        }
    }

    // Обновление UI
    updateUI() {
        try {
            const username = document.getElementById('username');
            const level = document.getElementById('level');
            const highScore = document.getElementById('high-score');
            const coins = document.getElementById('coins');
            const avatar = document.getElementById('user-avatar');

            if (username) username.textContent = this.user.username || 'Игрок';
            if (level) level.textContent = this.user.stats?.level || 1;
            if (highScore) highScore.textContent = this.user.stats?.highScore || 0;
            if (coins) coins.textContent = this.user.stats?.coins || 0;
            
            if (avatar) {
                const avatarUrl = this.user.avatar || 
                                this.user.photoURL || 
                                `https://api.dicebear.com/7.x/avataaars/svg?seed=${this.user.uid}`;
                avatar.src = avatarUrl;
            }

            console.log('✅ UI обновлён');
        } catch (error) {
            console.error('❌ Ошибка обновления UI:', error);
        }
    }

    // Настройка canvas
    setupCanvas() {
        const updateSize = () => {
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight - 70;
            this.redraw();
        };

        updateSize();
        window.addEventListener('resize', updateSize);
        
        console.log('✅ Canvas настроен:', this.canvas.width, 'x', this.canvas.height);
    }

    // Скрыть экран загрузки
    hideLoadingScreen() {
        const loadingScreen = document.getElementById('loading-screen');
        const gameMain = document.getElementById('game-main');

        if (loadingScreen) {
            loadingScreen.style.opacity = '0';
            loadingScreen.style.transition = 'opacity 0.5s';
            
            setTimeout(() => {
                loadingScreen.style.display = 'none';
            }, 500);
        }

        if (gameMain) {
            gameMain.style.display = 'flex';
        }

        console.log('✅ Экран загрузки скрыт');
    }

    // Показать ошибку
    showError(message) {
        const loadingScreen = document.getElementById('loading-screen');
        
        if (loadingScreen) {
            loadingScreen.innerHTML = `
                <div style="text-align: center; color: #e74c3c;">
                    <div style="font-size: 60px; margin-bottom: 20px;">❌</div>
                    <h2>${message}</h2>
                    <p style="margin-top: 20px;">
                        <button onclick="window.location.reload()" 
                                style="padding: 10px 30px; font-size: 16px; cursor: pointer; 
                                       background: #667eea; color: white; border: none; 
                                       border-radius: 8px;">
                            Перезагрузить
                        </button>
                    </p>
                </div>
            `;
        }
    }

    // Запуск игры
    startGame() {
        console.log('🎮 Игра запущена!');
        this.redraw();
    }

    // Перерисовка
    redraw() {
        if (!this.ctx || !this.canvas) return;

        // Очищаем canvas
        this.ctx.fillStyle = '#87CEEB';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Рисуем траву
        this.ctx.fillStyle = '#90EE90';
        this.ctx.fillRect(0, this.canvas.height - 50, this.canvas.width, 50);

        // Заголовок
        this.ctx.fillStyle = '#000';
        this.ctx.font = 'bold 48px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('🎮 RuBlocks', this.canvas.width / 2, 100);

        // Приветствие
        this.ctx.font = '28px Arial';
        this.ctx.fillText(`Добро пожаловать, ${this.user.username}!`, 
                         this.canvas.width / 2, 160);

        // Инструкция
        this.ctx.font = '20px Arial';
        this.ctx.fillStyle = '#666';
        this.ctx.fillText('Нажмите ПРОБЕЛ чтобы добавить очки', 
                         this.canvas.width / 2, 220);

        // Текущий счёт (если есть)
        if (this.score > 0) {
            this.ctx.font = 'bold 36px Arial';
            this.ctx.fillStyle = '#667eea';
            this.ctx.fillText(`Счёт: ${this.score}`, this.canvas.width / 2, 300);
        }

        // Дополнительная информация
        this.ctx.font = '16px Arial';
        this.ctx.fillStyle = '#999';
        this.ctx.fillText('Игровая механика в разработке...', 
                         this.canvas.width / 2, this.canvas.height - 100);
    }

    // Привязка событий
    bindEvents() {
        // Обработка клавиатуры
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space') {
                e.preventDefault();
                this.addScore(10);
                this.addCoins(1);
            }
        });

        // Обработка клика
        this.canvas.addEventListener('click', () => {
            this.addScore(5);
        });

        console.log('✅ События привязаны');
    }

    // Добавление очков
    addScore(points) {
        this.score += points;
        
        const scoreElement = document.getElementById('current-score');
        if (scoreElement) {
            scoreElement.textContent = this.score;
            
            // Анимация
            scoreElement.style.transform = 'scale(1.2)';
            setTimeout(() => {
                scoreElement.style.transform = 'scale(1)';
            }, 200);
        }

        // Обновляем рекорд
        const highScoreElement = document.getElementById('high-score');
        if (highScoreElement) {
            const currentHighScore = parseInt(highScoreElement.textContent);
            if (this.score > currentHighScore) {
                highScoreElement.textContent = this.score;
                console.log('🎉 Новый рекорд!', this.score);
            }
        }

        this.redraw();
    }

    // Добавление монет
    addCoins(amount) {
        this.coins += amount;
        
        const coinsElement = document.getElementById('coins');
        if (coinsElement) {
            const currentCoins = parseInt(coinsElement.textContent);
            coinsElement.textContent = currentCoins + amount;
            
            // Анимация
            coinsElement.style.transform = 'scale(1.2)';
            setTimeout(() => {
                coinsElement.style.transform = 'scale(1)';
            }, 200);
        }
    }

    // Сохранение данных игры
    async saveGameData() {
        if (!this.user || !this.startTime) {
            console.warn('⚠️ Нет данных для сохранения');
            return;
        }

        const playTime = Math.floor((Date.now() - this.startTime) / 1000);

        const stats = {
            highScore: this.score,
            gamesPlayed: 1,
            totalPlayTime: playTime,
            coins: this.coins,
            experience: this.score
        };

        console.log('💾 Сохранение статистики...', stats);

        try {
            const updatedStats = await authSystem.updateStats(stats);
            
            if (updatedStats) {
                console.log('✅ Статистика сохранена!');
                
                // Обновляем отображение
                const levelElement = document.getElementById('level');
                if (levelElement && updatedStats.level) {
                    levelElement.textContent = updatedStats.level;
                }
            } else {
                console.warn('⚠️ Статистика не обновлена');
            }
        } catch (error) {
            console.error('❌ Ошибка сохранения:', error);
        }
    }

    // Перезапуск игры
    restart() {
        console.log('🔄 Перезапуск игры');
        this.score = 0;
        this.coins = 0;
        this.startTime = Date.now();
        
        document.getElementById('current-score').textContent = '0';
        
        this.redraw();
    }

    // Вспомогательная функция задержки
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// ========================================
// Автозапуск при загрузке страницы
// ========================================

console.log('📜 game.js загружен');

// Ждём полной загрузки DOM
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initGame);
} else {
    initGame();
}

function initGame() {
    console.log('🚀 Запуск инициализации игры...');
    
    // Проверяем наличие всех необходимых объектов
    const checkDependencies = setInterval(() => {
        if (typeof firebase !== 'undefined' && 
            typeof auth !== 'undefined' && 
            typeof authSystem !== 'undefined') {
            
            clearInterval(checkDependencies);
            console.log('✅ Все зависимости загружены');
            
            // Создаём игру
            window.game = new RuBlocks();
            
        } else {
            console.log('⏳ Ожидание загрузки зависимостей...');
        }
    }, 100);
    
    // Таймаут на случай если что-то не загрузилось
    setTimeout(() => {
        clearInterval(checkDependencies);
        if (!window.game) {
            console.error('❌ Таймаут загрузки зависимостей!');
            const loadingScreen = document.getElementById('loading-screen');
            if (loadingScreen) {
                loadingScreen.innerHTML = `
                    <div style="text-align: center; color: #e74c3c;">
                        <div style="font-size: 60px; margin-bottom: 20px;">❌</div>
                        <h2>Ошибка загрузки</h2>
                        <p>Не удалось загрузить необходимые компоненты</p>
                        <button onclick="window.location.reload()" 
                                style="padding: 10px 30px; margin-top: 20px; font-size: 16px; 
                                       cursor: pointer; background: #667eea; color: white; 
                                       border: none; border-radius: 8px;">
                            Перезагрузить страницу
                        </button>
                    </div>
                `;
            }
        }
    }, 10000); // 10 секунд таймаут
}