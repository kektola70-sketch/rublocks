// Игровая логика RuBlocks

class RuBlocks {
    constructor() {
        // Проверяем авторизацию
        const user = auth.getCurrentUser();
        if (!user) {
            window.location.href = '../index.html';
            return;
        }

        this.user = user;
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        
        this.score = 0;
        this.gameOver = false;
        
        this.init();
    }

    init() {
        // Отображаем информацию о пользователе
        document.getElementById('username').textContent = this.user.username;
        document.getElementById('high-score').textContent = this.user.stats?.highScore || 0;
        
        // Начинаем игру
        this.startGame();
    }

    startGame() {
        this.ctx.fillStyle = '#000';
        this.ctx.font = '30px Arial';
        this.ctx.fillText('Добро пожаловать, ' + this.user.username + '!', 200, 300);
        this.ctx.fillText('Игра в разработке...', 250, 350);
        
        // Здесь будет основная игровая логика
    }

    updateScore(points) {
        this.score += points;
        document.getElementById('current-score').textContent = this.score;
        
        // Обновляем рекорд если нужно
        if (this.score > (this.user.stats?.highScore || 0)) {
            this.user.stats.highScore = this.score;
            this.saveUserStats();
        }
    }

    saveUserStats() {
        localStorage.setItem(CONFIG.STORAGE_KEYS.CURRENT_USER, JSON.stringify(this.user));
        
        // Обновляем в общем списке пользователей
        const users = JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEYS.USERS) || '[]');
        const userIndex = users.findIndex(u => u.id === this.user.id);
        if (userIndex !== -1) {
            users[userIndex] = this.user;
            localStorage.setItem(CONFIG.STORAGE_KEYS.USERS, JSON.stringify(users));
        }
    }
}

// Запускаем игру после загрузки страницы
window.addEventListener('load', () => {
    const game = new RuBlocks();
});