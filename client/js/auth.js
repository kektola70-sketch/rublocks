// Система авторизации для RuBlocks

class AuthSystem {
    constructor() {
        this.currentUser = null;
        this.init();
    }

    init() {
        // Проверяем, авторизован ли уже пользователь
        this.checkAuth();
        
        // Привязываем обработчики событий
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

    // Проверка авторизации
    checkAuth() {
        const token = localStorage.getItem(CONFIG.STORAGE_KEYS.USER_TOKEN);
        const userData = localStorage.getItem(CONFIG.STORAGE_KEYS.CURRENT_USER);

        if (token && userData) {
            this.currentUser = JSON.parse(userData);
            // Если мы на странице авторизации - перенаправляем в игру
            if (window.location.pathname.includes('index.html') || window.location.pathname === '/') {
                window.location.href = 'pages/game.html';
            }
        }
    }

    // Обработка входа
    async handleLogin(e) {
        e.preventDefault();
        
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        const errorElement = document.getElementById('login-error');

        try {
            const result = await this.login(email, password);
            
            if (result.success) {
                // Сохраняем данные пользователя
                localStorage.setItem(CONFIG.STORAGE_KEYS.USER_TOKEN, result.token);
                localStorage.setItem(CONFIG.STORAGE_KEYS.CURRENT_USER, JSON.stringify(result.user));
                
                // Перенаправляем в игру
                window.location.href = 'pages/game.html';
            } else {
                errorElement.textContent = result.message;
            }
        } catch (error) {
            errorElement.textContent = 'Ошибка входа. Попробуйте снова.';
        }
    }

    // Обработка регистрации
    async handleRegister(e) {
        e.preventDefault();
        
        const username = document.getElementById('register-username').value;
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;
        const passwordConfirm = document.getElementById('register-password-confirm').value;
        const errorElement = document.getElementById('register-error');

        // Валидация
        if (password !== passwordConfirm) {
            errorElement.textContent = 'Пароли не совпадают!';
            return;
        }

        if (password.length < CONFIG.VALIDATION.MIN_PASSWORD_LENGTH) {
            errorElement.textContent = `Пароль должен быть минимум ${CONFIG.VALIDATION.MIN_PASSWORD_LENGTH} символов!`;
            return;
        }

        if (username.length < CONFIG.VALIDATION.MIN_USERNAME_LENGTH) {
            errorElement.textContent = `Имя должно быть минимум ${CONFIG.VALIDATION.MIN_USERNAME_LENGTH} символа!`;
            return;
        }

        try {
            const result = await this.register(username, email, password);
            
            if (result.success) {
                errorElement.className = 'success-message';
                errorElement.textContent = 'Регистрация успешна! Войдите в аккаунт.';
                
                // Переключаемся на форму входа
                setTimeout(() => {
                    showTab('login');
                    document.getElementById('login-email').value = email;
                }, 1500);
            } else {
                errorElement.className = 'error-message';
                errorElement.textContent = result.message;
            }
        } catch (error) {
            errorElement.textContent = 'Ошибка регистрации. Попробуйте снова.';
        }
    }

    // Метод входа (LocalStorage версия)
    async login(email, password) {
        if (CONFIG.USE_LOCAL_STORAGE) {
            const users = JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEYS.USERS) || '[]');
            const user = users.find(u => u.email === email);

            if (!user) {
                return { success: false, message: 'Пользователь не найден!' };
            }

            // Простая проверка пароля (в реальном приложении используйте хеширование!)
            if (user.password !== this.hashPassword(password)) {
                return { success: false, message: 'Неверный пароль!' };
            }

            const token = this.generateToken();
            
            return {
                success: true,
                token: token,
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email
                }
            };
        }
        
        // Здесь будет код для реального API
        // const response = await fetch(`${CONFIG.API_URL}/login`, { ... });
    }

    // Метод регистрации (LocalStorage версия)
    async register(username, email, password) {
        if (CONFIG.USE_LOCAL_STORAGE) {
            const users = JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEYS.USERS) || '[]');
            
            // Проверяем, существует ли пользователь
            if (users.find(u => u.email === email)) {
                return { success: false, message: 'Email уже зарегистрирован!' };
            }

            if (users.find(u => u.username === username)) {
                return { success: false, message: 'Имя пользователя уже занято!' };
            }

            // Создаём нового пользователя
            const newUser = {
                id: Date.now().toString(),
                username: username,
                email: email,
                password: this.hashPassword(password),
                createdAt: new Date().toISOString(),
                stats: {
                    gamesPlayed: 0,
                    highScore: 0
                }
            };

            users.push(newUser);
            localStorage.setItem(CONFIG.STORAGE_KEYS.USERS, JSON.stringify(users));

            return { success: true };
        }
        
        // Здесь будет код для реального API
    }

    // Простое хеширование (для продакшена используйте bcrypt на сервере!)
    hashPassword(password) {
        let hash = 0;
        for (let i = 0; i < password.length; i++) {
            const char = password.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return hash.toString();
    }

    // Генерация токена
    generateToken() {
        return Math.random().toString(36).substring(2) + Date.now().toString(36);
    }

    // Выход
    logout() {
        localStorage.removeItem(CONFIG.STORAGE_KEYS.USER_TOKEN);
        localStorage.removeItem(CONFIG.STORAGE_KEYS.CURRENT_USER);
        window.location.href = '../index.html';
    }

    // Получить текущего пользователя
    getCurrentUser() {
        const userData = localStorage.getItem(CONFIG.STORAGE_KEYS.CURRENT_USER);
        return userData ? JSON.parse(userData) : null;
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

// Инициализация системы авторизации
const auth = new AuthSystem();