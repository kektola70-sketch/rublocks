const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { protect, generateToken } = require('../middleware/auth');

// @route   POST /api/auth/register
// @desc    Регистрация пользователя
// @access  Public
router.post('/register', [
    body('username')
        .trim()
        .isLength({ min: 3, max: 20 })
        .withMessage('Имя должно быть от 3 до 20 символов')
        .matches(/^[a-zA-Z0-9_]+$/)
        .withMessage('Имя может содержать только буквы, цифры и _'),
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Введите корректный email'),
    body('password')
        .isLength({ min: 6 })
        .withMessage('Пароль должен быть минимум 6 символов')
], async (req, res) => {
    try {
        // Проверка валидации
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        const { username, email, password } = req.body;

        // Проверяем существование пользователя
        let user = await User.findOne({ $or: [{ email }, { username }] });
        
        if (user) {
            if (user.email === email) {
                return res.status(400).json({
                    success: false,
                    message: 'Email уже зарегистрирован!'
                });
            }
            if (user.username === username) {
                return