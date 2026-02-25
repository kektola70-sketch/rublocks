const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
    username: {
        type: String,
        required: [true, 'Введите имя пользователя'],
        unique: true,
        trim: true,
        minlength: [3, 'Минимум 3 символа'],
        maxlength: [20, 'Максимум 20 символов']
    },
    email: {
        type: String,
        required: [true, 'Введите email'],
        unique: true,
        lowercase: true,
        match: [
            /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
            'Введите корректный email'
        ]
    },
    password: {
        type: String,
        required: [true, 'Введите пароль'],
        minlength: [6, 'Минимум 6 символов'],
        select: false // Не возвращать пароль при запросах
    },
    avatar: {
        type: String,
        default: 'default-avatar.png'
    },
    stats: {
        gamesPlayed: {
            type: Number,
            default: 0
        },
        highScore: {
            type: Number,
            default: 0
        },
        totalPlayTime: {
            type: Number,
            default: 0
        },
        level: {
            type: Number,
            default: 1
        }
    },
    inventory: [{
        itemId: String,
        itemName: String,
        quantity: Number
    }],
    friends: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    createdAt: {
        type: Date,
        default: Date.now
    },
    lastLogin: {
        type: Date,
        default: Date.now
    },
    isActive: {
        type: Boolean,
        default: true
    }
});

// Хеширование пароля перед сохранением
UserSchema.pre('save', async function(next) {
    if (!this.isModified('password')) {
        return next();
    }
    
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

// Метод для сравнения паролей
UserSchema.methods.matchPassword = async function(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

// Метод для получения публичного профиля
UserSchema.methods.getPublicProfile = function() {
    return {
        id: this._id,
        username: this.username,
        email: this.email,
        avatar: this.avatar,
        stats: this.stats,
        createdAt: this.createdAt,
        lastLogin: this.lastLogin
    };
};

module.exports = mongoose.model('User', UserSchema);