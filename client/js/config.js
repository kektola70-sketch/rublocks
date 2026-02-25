const CONFIG = {
    // API URL вашего сервера
    API_URL: 'http://localhost:3000/api',
    
    // Ключи для LocalStorage
    STORAGE_KEYS: {
        USER_TOKEN: 'rublocks_token',
        CURRENT_USER: 'rublocks_user'
    },
    
    // Настройки валидации
    VALIDATION: {
        MIN_PASSWORD_LENGTH: 6,
        MIN_USERNAME_LENGTH: 3,
        MAX_USERNAME_LENGTH: 20
    }
};