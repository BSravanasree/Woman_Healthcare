const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Define user schema
const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: 6,
    },
    role: {
        type: String,
        enum: ['woman', 'doctor', 'nutritionist', 'pharmacy', 'admin'],
        required: [true, 'User role is required'],
    },
    phone: {
        type: String,
    },
    isVerified: {
        type: Boolean,
        default: false,
    },
    isTwoFactorEnabled: {
        type: Boolean,
        default: false,
    },
    twoFactorSecret: String,
    twoFactorToken: String,
    twoFactorTokenExpires: Date,
}, { timestamps: true });

// 🔐 Hash password before saving to database
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();  // Only hash if password is new/changed
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

// 🔍 Compare entered password with hashed password in DB
userSchema.methods.correctPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

// Export model
module.exports = mongoose.model('User', userSchema);
