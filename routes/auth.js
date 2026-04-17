const express = require('express');
const { body, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const { User, WomanProfile, DoctorProfile, NutritionistProfile, Pharmacy } = require('../models');
const { auth } = require('../middleware/auth');
const TwoFactorAuth = require('../middleware/utils/twoFactor');
const emailService = require('../middleware/utils/emailService');
const router = express.Router();

// Generate JWT Token
const generateToken = (userId) => {
    return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

// Register User
router.post('/register', [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
    body('role').isIn(['woman', 'doctor', 'nutritionist', 'pharmacy', 'admin'])
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        const { email, password, role, phone } = req.body;

        // Check if user exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'User already exists with this email'
            });
        }

        // Create user
        const user = new User({
            email,
            password,
            role,
            phone
        });

        await user.save();

        // Create profile based on role
        let profile;
        switch (role) {
            case 'woman':
                profile = new WomanProfile({ userId: user._id });
                break;
            case 'doctor':
                profile = new DoctorProfile({ userId: user._id });
                break;
            case 'nutritionist':
                profile = new NutritionistProfile({ userId: user._id });
                break;
            case 'pharmacy':
                profile = new Pharmacy({ userId: user._id });
                break;
        }

        if (profile) await profile.save();

        // Generate verification token
        const verificationToken = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        // Send verification email
        await emailService.sendVerificationEmail(email, verificationToken);

        res.status(201).json({
            success: true,
            message: 'User registered successfully. Please check your email for verification.',
            userId: user._id
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during registration'
        });
    }
});

// Login User
router.post('/login', [
    body('email').isEmail().normalizeEmail(),
    body('password').exists()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        const { email, password } = req.body;

        // Find user
        const user = await User.findOne({ email });
        if (!user || !(await user.correctPassword(password, user.password))) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        if (!user.isVerified) {
            return res.status(401).json({
                success: false,
                message: 'Please verify your email before logging in'
            });
        }

        // Check if 2FA is enabled
        if (user.isTwoFactorEnabled) {
            // Generate 2FA token
            const twoFactorToken = Math.random().toString().substring(2, 8);
            user.twoFactorToken = twoFactorToken;
            user.twoFactorTokenExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
            await user.save();

            // Send 2FA code via email
            await emailService.sendTwoFactorEmail(email, twoFactorToken);

            return res.json({
                success: true,
                message: 'Two-factor authentication required',
                twoFactorRequired: true,
                tempToken: jwt.sign(
                    { userId: user._id, twoFactor: true },
                    process.env.JWT_SECRET,
                    { expiresIn: '10m' }
                )
            });
        }

        // Generate final token
        const token = generateToken(user._id);

        res.json({
            success: true,
            message: 'Login successful',
            token,
            user: {
                id: user._id,
                email: user.email,
                role: user.role,
                isTwoFactorEnabled: user.isTwoFactorEnabled
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during login'
        });
    }
});

// Verify Two-Factor Authentication
router.post('/verify-2fa', [
    body('token').isLength({ min: 6, max: 6 }),
    body('tempToken').exists()
], async (req, res) => {
    try {
        const { token, tempToken } = req.body;

        const decoded = jwt.verify(tempToken, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId);

        if (!user || !user.twoFactorToken || user.twoFactorTokenExpires < Date.now()) {
            return res.status(401).json({
                success: false,
                message: 'Invalid or expired two-factor token'
            });
        }

        if (user.twoFactorToken !== token) {
            return res.status(401).json({
                success: false,
                message: 'Invalid two-factor code'
            });
        }

        // Clear 2FA token
        user.twoFactorToken = undefined;
        user.twoFactorTokenExpires = undefined;
        await user.save();

        // Generate final token
        const finalToken = generateToken(user._id);

        res.json({
            success: true,
            message: 'Two-factor authentication successful',
            token: finalToken,
            user: {
                id: user._id,
                email: user.email,
                role: user.role,
                isTwoFactorEnabled: user.isTwoFactorEnabled
            }
        });

    } catch (error) {
        res.status(401).json({
            success: false,
            message: 'Two-factor authentication failed'
        });
    }
});

// Setup Two-Factor Authentication
router.post('/setup-2fa', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);

        const secret = TwoFactorAuth.generateSecret(user.email);
        const qrCode = await TwoFactorAuth.generateQRCode(secret);

        user.twoFactorSecret = secret.base32;
        await user.save();

        res.json({
            success: true,
            secret: secret.base32,
            qrCode,
            backupCodes: TwoFactorAuth.generateBackupCodes()
        });

    } catch (error) {
        console.error('2FA setup error:', error);
        res.status(500).json({
            success: false,
            message: 'Error setting up two-factor authentication'
        });
    }
});

// Enable Two-Factor Authentication
router.post('/enable-2fa', auth, [
    body('token').isLength({ min: 6, max: 6 })
], async (req, res) => {
    try {
        const { token } = req.body;
        const user = await User.findById(req.user.id);

        const isValid = TwoFactorAuth.verifyToken(user.twoFactorSecret, token);

        if (!isValid) {
            return res.status(400).json({
                success: false,
                message: 'Invalid two-factor authentication code'
            });
        }

        user.isTwoFactorEnabled = true;
        await user.save();

        res.json({
            success: true,
            message: 'Two-factor authentication enabled successfully'
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error enabling two-factor authentication'
        });
    }
});

// Verify Email
router.get('/verify-email', async (req, res) => {
    try {
        const { token } = req.query;

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId);

        if (!user) {
            return res.status(400).json({
                success: false,
                message: 'Invalid verification token'
            });
        }

        user.isVerified = true;
        await user.save();

        res.json({
            success: true,
            message: 'Email verified successfully'
        });

    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Invalid or expired verification token'
        });
    }
});

module.exports = router;