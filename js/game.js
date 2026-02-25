// Игровая логика RuBlocks

class RuBlocks {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        
        this.score = 0;
        this.coins = 0;
        this.startTime = Date.now();
        
        this.waitForUser();
    }

    // Ждём загрузки пользователя
    waitForUser() {
        const checkUser = setInterval(() => {
            const user = authSystem.getCurrentUser();
            
            if (user) {
                clearInterval(checkUser);
                this.user = user;
                this.init();
            }
        }, 100);
    }

    init() {
        console.log('🎮 Игра инициализирована для:', this.user.username);
        
        // Отображаем информацию о пользователе
        document.getElementById('username').textContent = this.user.username || this.user.displayName;
        document.getElementById('level').textContent = this.user.stats?.level || 1;
        document.getElementById('high-score').textContent = this.user.stats?.highScore || 0;
        document.getElementById('coins').textContent = this.user.stats?.coins || 0;
        
        // Устанавливаем аватар
        const avatar = this.user.avatar || this.user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${this.user.uid}`;
        document.getElementById('user-avatar').src = avatar;
        
        // Настраиваем canvas
        this.setupCanvas();
        
        // Начинаем игру
        this.startGame();
        
        // Сохраняем при закрытии
        window.addEventListener('beforeunload', () => this.saveGameData());
    }

    setupCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight - 100;
        
        window.addEventListener('resize', () => {
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight - 100;
            this.redraw();
        });
    }

    startGame() {
        this.redraw();
        
        // Симуляция игрового процесса
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space') {
                this.addScore(10);
                this.addCoins(1);
            }
        });
    }

    redraw() {
        this.ctx.fillStyle = '#87CEEB';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.fillStyle = '#000';
        this.ctx.font = 'bold 40px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('🎮 RuBlocks', this.canvas.width / 2, 150);
        
        this.ctx.font = '24px Arial';
        this.ctx.fillText(`Добро пожаловать, ${this.user.username}!`, this.canvas.width / 2, 220);
        
        this.ctx.font = '18px Arial';
        this.ctx.fillStyle = '#666';
        this.ctx.fillText('Игра в разработке...', this.canvas.width / 2, 300);
        this.ctx.fillText('Нажмите ПРОБЕЛ для добавления очков (демо)', this.canvas.width / 2, 330);
    }

    addScore(points) {
        this.score += points;
        document.getElementById('current-score').textContent = this.score;
        
        const currentHighScore = parseInt(document.getElementById('high-score').textContent);
        if (this.score > currentHighScore) {
            document.getElementById('high-score').textContent = this.score;
        }
    }

    addCoins(amount) {
        this.coins += amount;
        const currentCoins = parseInt(document.getElementById('coins').textContent);
        document.getElementById('coins').textContent = currentCoins + amount;
    }

    async saveGameData() {
        const playTime = Math.floor((Date.now() - this.startTime) / 1000);

        const stats = {
            highScore: this.score,
            gamesPlayed: 1,
            totalPlayTime: playTime,
            coins: this.coins,
            experience: this.score
        };

        const updatedStats = await authSystem.updateStats(stats);
        
        if (updatedStats) {
            console.log('💾 Статистика сохранена:', stats);
            
            // Обновляем отображение
            document.getElementById('level').textContent = updatedStats.level;
            document.getElementById('coins').textContent = updatedStats.coins;
        }
    }
}

// Запускаем игру
window.addEventListener('load', () => {
    const game = new RuBlocks();
});