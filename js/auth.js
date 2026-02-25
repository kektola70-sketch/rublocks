// Система авторизации для RuBlocks

class AuthSystem {
    constructor() {
        this.auth = auth;
        this.currentUser = null;
        this.init();
    }

    init() {
        this.setupAuthStateListener();
        this.bindEvents();
    }

    // Слушатель состояния авторизации
    setupAuthStateListener() {
        this.auth.onAuthStateChanged(async (user) => {
            if (user) {
                console.log('✅ Пользователь авторизован:', user.email);
                
                // Получаем полный профиль из Firestore
                let profile = await database.getUserProfile(user.uid);
                
                // Если профиля нет - создаём (для входа через Google)
                if (!profile) {
                    await database.createUserProfile(user.uid, {
                        username: user.displayName || user.email.split('@')[0],
                        email: user.email,
                        photoURL: user.photoURL
                    });
                    profile = await database.getUserProfile(user.uid);
                }
                
                this.currentUser = {
                    uid: user.uid,
                    email: user.email,
                    displayName: user.displayName,
                    photoURL: user.photoURL,
                    ...profile
                };

                // Обновляем время входа
                await database.updateLastLogin(user.uid);

                // Перенаправляем в игру если на странице авторизации
                if (this.isAuthPage()) {
                    window.location.href = 'pages/game.html';
                }
            } else {
                console.log('❌ Пользователь не авторизован');
                this.currentUser = null;

                // Перенаправляем на страницу входа если на игровой странице
                if (this.isGamePage()) {
                    window.location.href = '../index.html';
                }
            }
        });
    }

    // Проверка текущей страницы
    isAuthPage() {
        const path = window.location.pathname;
        return path.includes('index.html') || path === '/' || path.endsWith('/');
    }

    isGamePage() {
        return window.location.pathname.includes('game.html');
    }

    bindEvents() {
        const loginForm = document.getElementById('login-form');
        const registerForm = document.getElementById('register-form');
        const googleBtn = document.getElementById('google-login-btn');

        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }

        if (registerForm) {
            registerForm.addEventListener('submit', (e) => this.handleRegister(e));
        }

        if (googleBtn) {
            googleBtn.addEventListener('click', () => this.handleGoogleLogin());
        }
    }

    // Обработка входа
    async handleLogin(e) {
        e.preventDefault();
        
        const email = document.getElementById('login-email').value.trim();
        const password = document.getElementById('login-password').value;
        const errorElement = document.getElementById('login-error');
        const submitBtn = document.getElementById('login-btn');

        try {
            this.showLoading(submitBtn, true);
            errorElement.textContent = '';

            await this.auth.signInWithEmailAndPassword(email, password);
            console.log('✅ Вход выполнен успешно');

        } catch (error) {
            console.error('❌ Ошибка входа:', error);
            errorElement.textContent = this.getErrorMessage(error.code);
            errorElement.style.display = 'block';
            this.showLoading(submitBtn, false);
        }
    }

    // Обработка регистрации
    async handleRegister(e) {
        e.preventDefault();
        
        const username = document.getElementById('register-username').value.trim();
        const email = document.getElementById('register-email').value.trim();
        const password = document.getElementById('register-password').value;
        const passwordConfirm = document.getElementById('register-password-confirm').value;
        const errorElement = document.getElementById('register-error');
        const submitBtn = document.getElementById('register-btn');

        // Валидация
        if (password !== passwordConfirm) {
            errorElement.textContent = '❌ Пароли не совпадают!';
            errorElement.style.display = 'block';
            return;
        }

        if (username.length < 3) {
            errorElement.textContent = '❌ Имя должно быть минимум 3 символа!';
            errorElement.style.display = 'block';
            return;
        }

        try {
            this.showLoading(submitBtn, true);
            errorElement.textContent = '';

            // Регистрация в Firebase Auth
            const userCredential = await this.auth.createUserWithEmailAndPassword(email, password);
            const user = userCredential.user;

            // Обновляем displayName
            await user.updateProfile({
                displayName: username
            });

            // Создаём профиль в Firestore
            await database.createUserProfile(user.uid, {
                username: username,
                email: email,
                photoURL: user.photoURL
            });

            console.log('✅ Регистрация успешна');

            errorElement.className = 'success-message';
            errorElement.textContent = '✅ Регистрация успешна! Перенаправление...';
            errorElement.style.display = 'block';

        } catch (error) {
            console.error('❌ Ошибка регистрации:', error);
            errorElement.className = 'error-message';
            errorElement.textContent = this.getErrorMessage(error.code);
            errorElement.style.display = 'block';
            this.showLoading(submitBtn, false);
        }
    }

    // Вход через Google
    async handleGoogleLogin() {
        try {
            const provider = new firebase.auth.GoogleAuthProvider();
            provider.setCustomParameters({
                prompt: 'select_account'
            });

            await this.auth.signInWithPopup(provider);
            console.log('✅ Вход через Google выполнен');

        } catch (error) {
            console.error('❌ Ошибка входа через Google:', error);
            
            if (error.code !== 'auth/popup-closed-by-user') {
                alert('Ошибка входа через Google: ' + this.getErrorMessage(error.code));
            }
        }
    }

    // Выход
    async logout() {
        try {
            if (this.currentUser) {
                await database.setOnlineStatus(this.currentUser.uid, false);
            }

            await this.auth.signOut();
            console.log('✅ Выход выполнен');
        } catch (error) {
            console.error('❌ Ошибка выхода:', error);
        }
    }

    // Получить текущего пользователя
    getCurrentUser() {
        return this.currentUser;
    }

    // Обновить статистику
    async updateStats(stats) {
        if (this.currentUser) {
            const updatedStats = await database.updateStats(this.currentUser.uid, stats);
            
            if (updatedStats) {
                this.currentUser.stats = updatedStats;
                return updatedStats;
            }
        }
        return null;
    }

    // Показать/скрыть загрузку
    showLoading(button, isLoading) {
        const text = button.querySelector('.btn-text');
        const loader = button.querySelector('.btn-loader');
        
        if (isLoading) {
            text.style.display = 'none';
            loader.style.display = 'inline';
            button.disabled = true;
        } else {
            text.style.display = 'inline';
            loader.style.display = 'none';
            button.disabled = false;
        }
    }

    // Перевод кодов ошибок
    getErrorMessage(errorCode) {
        const errors = {
            'auth/email-already-in-use': 'Этот email уже используется',
            'auth/invalid-email': 'Неверный формат email',
            'auth/operation-not-allowed': 'Операция не разрешена',
            'auth/weak-password': 'Слишком простой пароль (минимум 6 символов)',
            'auth/user-disabled': 'Аккаунт заблокирован',
            'auth/user-not-found': 'Пользователь не найден',
            'auth/wrong-password': 'Неверный пароль',
            'auth/invalid-credential': 'Неверный email или пароль',
            'auth/too-many-requests': 'Слишком много попыток. Попробуйте позже',
            'auth/network-request-failed': 'Ошибка сети. Проверьте подключение',
            'auth/popup-closed-by-user': 'Окно входа было закрыто',
            'auth/cancelled-popup-request': 'Запрос отменён'
        };

        return errors[errorCode] || `Ошибка: ${errorCode}`;
    }
}

// Функция переключения вкладок
function showTab(tab) {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const tabs = document.querySelectorAll('.tab-btn');
    const loginError = document.getElementById('login-error');
    const registerError = document.getElementById('register-error');

    // Очищаем ошибки
    if (loginError) loginError.style.display = 'none';
    if (registerError) registerError.style.display = 'none';

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
const authSystem = new AuthSystem();
console.log('🔐 AuthSystem инициализирована');