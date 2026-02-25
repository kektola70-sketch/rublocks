require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

const app = express();

// Подключение к БД
connectDB();

// Middleware
app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:8080',
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Роуты
app.use('/api/auth', require('./routes/auth'));

// Базовый роут
app.get('/', (req, res) => {
    res.json({
        message: '🎮 RuBlocks API Server',
        version: '1.0.0',
        status: 'running'
    });
});

// Обработка ошибок 404
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Маршрут не найден'
    });
});

// Обработка глобальных ошибок
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        message: 'Ошибка сервера',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`🚀 Сервер запущен на порту ${PORT}`);
    console.log(`📡 API доступен по адресу: http://localhost:${PORT}`);
});