const speakeasy = require('speakeasy');
const QRCode = require('qrcode');

class TwoFactorAuth {
    static generateSecret(email) {
        return speakeasy.generateSecret({
            name: `Women Healthcare Portal (${email})`,
            issuer: 'Women Healthcare Portal'
        });
    }

    static async generateQRCode(secret) {
        try {
            return await QRCode.toDataURL(secret.otpauth_url);
        } catch (error) {
            throw new Error('Error generating QR code');
        }
    }

    static verifyToken(secret, token) {
        return speakeasy.totp.verify({
            secret: secret,
            encoding: 'base32',
            token: token,
            window: 2
        });
    }

    static generateBackupCodes() {
        const codes = [];
        for (let i = 0; i < 6; i++) {
            codes.push(Math.random().toString(36).substring(2, 10).toUpperCase());
        }
        return codes;
    }
}

module.exports = TwoFactorAuth;