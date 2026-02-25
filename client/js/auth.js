class AuthSystem {
    constructor() {
        this.currentUser = null;
        this.token = null;
        this.init();
    }

    init() {
        this.checkAuth();
        this.bindEvents();
    }

    bindEvents() {
        const loginForm = document.getElementById('login-form');
        const registerForm = document.getElementById('register-form');

        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }

        if (registerForm) {
            registerForm.addEventListener('submit', (e) => this.handleRegister(e));
        }
    }

    async checkAuth() {
        const token = localStorage.getItem(CONFIG.STORAGE_KEYS.USER_TOKEN);

        if (token) {
            try {
                // Проверяем токен на сервере
                const response = await fetch(`${CONFIG.API_URL}/auth/me`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                const data = await response.json();

                if (data.success) {
                    this.currentUser = data.user;
                    this.token = token;
                    
                    // Перенаправляем в игру если на странице входа
                    if (window.location.pathname.includes('index.html') || 
                        window.location.pathname === '/') {
                        window.location.href = 'pages/game.html';
                    }
                } else {
                    // Токен невалидный, удаляем
                    this.clearAuth();
                }
            } catch (error) {
                console.error('Ошибка проверки авторизации:', error);
                this.clearAuth();
            }
        }
    }

    async handleLogin(e) {
        e.preventDefault();
        
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        const errorElement = document.getElementById('login-error');
        const submitBtn = e.target.querySelector('button[type="submit"]');

        try {
            submitBtn.disabled = true;
            submitBtn.textContent = 'Вход...';

            const response = await fetch(`${CONFIG.API_URL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (data.success) {
                // Сохраняем токен и данные пользователя
                localStorage.setItem(CONFIG.STORAGE_KEYS.USER_TOKEN, data.token);
                localStorage.setItem(CONFIG.STORAGE_KEYS.CURRENT_USER, JSON.stringify(data.user));
                
                // Перенаправляем в игру
                window.location.href = 'pages/game.html';
            } else {
                errorElement.textContent = data.message || 'Ошибка входа';
            }

        } catch (error) {
            console.error('Ошибка входа:', error);
            errorElement.textContent = 'Ошибка соединения с сервером';
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Войти';
        }
    }

    async handleRegister(e) {
        e.preventDefault();
        
        const username = document.getElementById('register-username').value;
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;
        const passwordConfirm = document.getElementById('register-password-confirm').value;
        const errorElement = document.getElementById('register-error');
        const submitBtn = e.target.querySelector('button[type="submit"]');

        // Валидация на клиенте
        if (password !== passwordConfirm) {
            errorElement.textContent = 'Пароли не совпадают!';
            return;
        }

        if (password.length < CONFIG.VALIDATION.MIN_PASSWORD_LENGTH) {
            errorElement.textContent = `Пароль должен быть минимум ${CONFIG.VALIDATION.MIN_PASSWORD_LENGTH} символов!`;
            return;
        }

        try {
            submitBtn.disabled = true;
            submitBtn.textContent = 'Регистрация...';

            const response = await fetch(`${CONFIG.API_URL}/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, email, password })
            });

            const data = await response.json();

            if (data.success) {
                // Сохраняем токен и данные пользователя
                localStorage.setItem(CONFIG.STORAGE_KEYS.USER_TOKEN, data.token);
                localStorage.setItem(CONFIG.STORAGE_KEYS.CURRENT_USER, JSON.stringify(data.user));
                
                errorElement.className = 'success-message';
                errorElement.textContent = 'Регистрация успешна! Перенаправление...';
                
                // Перенаправляем в игру
                setTimeout(() => {
                    window.location.href = 'pages/game.html';
                }, 1000);
            } else {
                errorElement.className = 'error-message';
                errorElement.textContent = data.message || 'Ошибка регистрации';
            }

        } catch (error) {
            console.error('Ошибка регистрации:', error);
            errorElement.className = 'error-message';
            errorElement.textContent = 'Ошибка соединения с сервером';
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Зарегистрироваться';
        }
    }

    async logout() {
        const token = localStorage.getItem(CONFIG.STORAGE_KEYS.USER_TOKEN);

        if (token) {
            try {
                await fetch(`${CONFIG.API_URL}/auth/logout`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
            } catch (error) {
                console.error('Ошибка выхода:', error);
            }
        }

        this.clearAuth();
        window.location.href = '../index.html';
    }

    clearAuth() {
        localStorage.removeItem(CONFIG.STORAGE_KEYS.USER_TOKEN);
        localStorage.removeItem(CONFIG.STORAGE_KEYS.CURRENT_USER);
        this.currentUser = null;
        this.token = null;
    }

    getCurrentUser() {
        if (this.currentUser) return this.currentUser;
        
        const userData = localStorage.getItem(CONFIG.STORAGE_KEYS.CURRENT_USER);
        return userData ? JSON.parse(userData) : null;
    }

    getToken() {
        if (this.token) return this.token;
        return localStorage.getItem(CONFIG.STORAGE_KEYS.USER_TOKEN);
    }

    // Обновление статистики игрока
    async updateStats(stats) {
        const token = this.getToken();

        try {
            const response = await fetch(`${CONFIG.API_URL}/auth/stats`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(stats)
            });

            const data = await response.json();

            if (data.success) {
                // Обновляем локальные данные
                const user = this.getCurrentUser();
                user.stats = data.stats;
                localStorage.setItem(CONFIG.STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
                return true;
            }
            
            return false;
        } catch (error) {
            console.error('Ошибка обновления статистики:', error);
            return false;
        }
    }
}

// Функция переключения вкладок
function showTab(tab) {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const tabs = document.querySelectorAll('.tab-btn');

    if (tab === 'login') {
        loginForm.style.display = 'block';
        registerForm.style.display = 'none';
        tabs[0].classList.add('active');
        tabs[1].classList.remove('active');
    } else {
        loginForm.style.display = 'none';
        registerForm.style.display = 'block';
        tabs[0].classList.remove('active');
        tabs[1].classList.add('active');
    }
}

// Инициализация
const auth = new AuthSystem();