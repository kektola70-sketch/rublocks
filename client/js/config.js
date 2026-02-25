// Конфигурация приложения
const CONFIG = {
    // Для разработки используем LocalStorage
    // Для продакшена замените на реальный API
    USE_LOCAL_STORAGE: true,
    
    // URL вашего бэкенда (если используете)
    API_URL: 'https://your-backend-url.com/api',
    
    // Ключи для LocalStorage
    STORAGE_KEYS: {
        USERS: 'rublocks_users',
        CURRENT_USER: 'rublocks_current_user',
        USER_TOKEN: 'rublocks_token'
    },
    
    // Настройки валидации
    VALIDATION: {
        MIN_PASSWORD_LENGTH: 6,
        MIN_USERNAME_LENGTH: 3,
        MAX_USERNAME_LENGTH: 20
    }
};