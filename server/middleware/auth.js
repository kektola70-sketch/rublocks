const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Защита маршрутов
exports.protect = async (req, res, next) => {
    let token;

    // Проверяем наличие токена в заголовках
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Доступ запрещён. Авторизуйтесь!'
        });
    }

    try {
        // Верифицируем токен
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Получаем пользователя
        req.user = await User.findById(decoded.id).select('-password');

        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Пользователь не найден'
            });
        }

        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: 'Неверный токен'
        });
    }
};

// Генерация JWT токена
exports.generateToken = (userId) => {
    return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE
    });
};