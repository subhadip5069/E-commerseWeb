const argon2 = require('argon2');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const User = require('../model/user');
const emailService = require('./emailService');

class AuthService {
    constructor() {
        // Login attempt tracking (in production, use Redis)
        this.loginAttempts = new Map();
        this.resetTokens = new Map();
    }

    /**
     * Validate password strength
     */
    validatePassword(password) {
        const minLength = parseInt(process.env.PASSWORD_MIN_LENGTH) || 8;
        const requireUppercase = process.env.PASSWORD_REQUIRE_UPPERCASE === 'true';
        const requireLowercase = process.env.PASSWORD_REQUIRE_LOWERCASE === 'true';
        const requireNumbers = process.env.PASSWORD_REQUIRE_NUMBERS === 'true';
        const requireSymbols = process.env.PASSWORD_REQUIRE_SYMBOLS === 'true';

        const errors = [];

        if (password.length < minLength) {
            errors.push(`Password must be at least ${minLength} characters long`);
        }

        if (requireUppercase && !/[A-Z]/.test(password)) {
            errors.push('Password must contain at least one uppercase letter');
        }

        if (requireLowercase && !/[a-z]/.test(password)) {
            errors.push('Password must contain at least one lowercase letter');
        }

        if (requireNumbers && !/\d/.test(password)) {
            errors.push('Password must contain at least one number');
        }

        if (requireSymbols && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
            errors.push('Password must contain at least one special character');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * Hash password using Argon2
     */
    async hashPassword(password) {
        try {
            return await argon2.hash(password, {
                type: argon2.argon2id,
                memoryCost: 2 ** 16, // 64 MB
                timeCost: 3,
                parallelism: 1,
            });
        } catch (error) {
            throw new Error('Error hashing password');
        }
    }

    /**
     * Verify password using Argon2
     */
    async verifyPassword(hashedPassword, plainPassword) {
        try {
            return await argon2.verify(hashedPassword, plainPassword);
        } catch (error) {
            throw new Error('Error verifying password');
        }
    }

    /**
     * Generate JWT tokens (access and refresh)
     */
    generateTokens(userId, userRole, username) {
        const accessToken = jwt.sign(
            { 
                id: userId, 
                role: userRole, 
                username,
                type: 'access'
            },
            process.env.JWT_SECRET,
            { 
                expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN || '15m',
                issuer: 'e-commerce-app',
                audience: 'e-commerce-users'
            }
        );

        const refreshToken = jwt.sign(
            { 
                id: userId, 
                type: 'refresh'
            },
            process.env.JWT_SECRET,
            { 
                expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d',
                issuer: 'e-commerce-app',
                audience: 'e-commerce-users'
            }
        );

        return { accessToken, refreshToken };
    }

    /**
     * Verify JWT token
     */
    verifyToken(token, tokenType = 'access') {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET, {
                issuer: 'e-commerce-app',
                audience: 'e-commerce-users'
            });

            if (decoded.type !== tokenType) {
                throw new Error('Invalid token type');
            }

            return decoded;
        } catch (error) {
            throw new Error('Invalid or expired token');
        }
    }

    /**
     * Check if account is locked due to too many failed attempts
     */
    isAccountLocked(email) {
        const attempts = this.loginAttempts.get(email);
        if (!attempts) return false;

        const maxAttempts = parseInt(process.env.MAX_LOGIN_ATTEMPTS) || 5;
        const lockoutTime = parseInt(process.env.ACCOUNT_LOCKOUT_TIME) || 1800000; // 30 minutes

        if (attempts.count >= maxAttempts) {
            const timeSinceLastAttempt = Date.now() - attempts.lastAttempt;
            if (timeSinceLastAttempt < lockoutTime) {
                return {
                    locked: true,
                    remainingTime: Math.ceil((lockoutTime - timeSinceLastAttempt) / 60000) // minutes
                };
            } else {
                // Reset attempts after lockout period
                this.loginAttempts.delete(email);
                return false;
            }
        }

        return false;
    }

    /**
     * Record failed login attempt
     */
    recordFailedAttempt(email) {
        const attempts = this.loginAttempts.get(email) || { count: 0, lastAttempt: 0 };
        attempts.count += 1;
        attempts.lastAttempt = Date.now();
        this.loginAttempts.set(email, attempts);
    }

    /**
     * Clear login attempts on successful login
     */
    clearLoginAttempts(email) {
        this.loginAttempts.delete(email);
    }

    /**
     * Register new user
     */
    async register(userData) {
        try {
            const { username, email, password, phone } = userData;

            // Check if user already exists
            const existingUser = await User.findOne({ 
                $or: [{ email }, { phone }] 
            });

            if (existingUser) {
                if (existingUser.email === email) {
                    throw new Error('Email already registered');
                }
                if (existingUser.phone === phone) {
                    throw new Error('Phone number already registered');
                }
            }

            // Validate password strength
            const passwordValidation = this.validatePassword(password);
            if (!passwordValidation.isValid) {
                throw new Error(passwordValidation.errors.join('. '));
            }

            // Hash password
            const hashedPassword = await this.hashPassword(password);

            // Create user
            const newUser = new User({
                username,
                email,
                password: hashedPassword,
                phone,
                isVerified: false,
                role: 'user',
                status: 'active',
                loginAttempts: 0,
                accountLocked: false
            });

            await newUser.save();

            // Generate OTP
            const otp = this.generateOTP();
            
            // Store OTP (in production, use Redis with expiration)
            this.storeOTP(email, otp);

            // Send OTP email
            await emailService.sendOTPEmail(email, username, otp);

            return {
                success: true,
                message: 'Registration successful. Please verify your email.',
                userId: newUser._id
            };
        } catch (error) {
            throw new Error(error.message);
        }
    }

    /**
     * Verify OTP and complete registration
     */
    async verifyOTP(email, otp) {
        try {
            const storedOTP = this.getStoredOTP(email);
            
            if (!storedOTP || storedOTP.otp !== otp) {
                throw new Error('Invalid OTP code');
            }

            if (Date.now() > storedOTP.expiresAt) {
                this.clearOTP(email);
                throw new Error('OTP has expired');
            }

            // Update user verification status
            const user = await User.findOneAndUpdate(
                { email },
                { isVerified: true },
                { new: true }
            );

            if (!user) {
                throw new Error('User not found');
            }

            // Clear OTP
            this.clearOTP(email);

            // Send welcome email
            await emailService.sendWelcomeEmail(email, user.username);

            return {
                success: true,
                message: 'Email verified successfully',
                user: {
                    id: user._id,
                    username: user.username,
                    email: user.email,
                    role: user.role
                }
            };
        } catch (error) {
            throw new Error(error.message);
        }
    }

    /**
     * Login user
     */
    async login(email, password, ipAddress, userAgent) {
        try {
            // Check if account is locked
            const lockStatus = this.isAccountLocked(email);
            if (lockStatus && lockStatus.locked) {
                throw new Error(`Account locked. Try again in ${lockStatus.remainingTime} minutes.`);
            }

            // Find user
            const user = await User.findOne({ email });
            if (!user) {
                this.recordFailedAttempt(email);
                throw new Error('Invalid email or password');
            }

            // Check if user is verified
            if (!user.isVerified) {
                throw new Error('Please verify your email address first');
            }

            // Check if account is active
            if (user.status !== 'active') {
                throw new Error('Account is deactivated. Contact support.');
            }

            // Verify password
            const isPasswordValid = await this.verifyPassword(user.password, password);
            if (!isPasswordValid) {
                this.recordFailedAttempt(email);
                throw new Error('Invalid email or password');
            }

            // Clear login attempts on successful login
            this.clearLoginAttempts(email);

            // Generate tokens
            const tokens = this.generateTokens(user._id, user.role, user.username);

            // Update last login
            await User.findByIdAndUpdate(user._id, {
                lastLogin: new Date(),
                $push: {
                    loginHistory: {
                        timestamp: new Date(),
                        ipAddress,
                        userAgent
                    }
                }
            });

            return {
                success: true,
                message: 'Login successful',
                user: {
                    id: user._id,
                    username: user.username,
                    email: user.email,
                    role: user.role
                },
                tokens
            };
        } catch (error) {
            throw new Error(error.message);
        }
    }

    /**
     * Refresh access token
     */
    async refreshToken(refreshToken) {
        try {
            const decoded = this.verifyToken(refreshToken, 'refresh');
            
            const user = await User.findById(decoded.id);
            if (!user || user.status !== 'active') {
                throw new Error('User not found or inactive');
            }

            const tokens = this.generateTokens(user._id, user.role, user.username);
            
            return {
                success: true,
                tokens
            };
        } catch (error) {
            throw new Error('Invalid refresh token');
        }
    }

    /**
     * Request password reset
     */
    async requestPasswordReset(email) {
        try {
            const user = await User.findOne({ email });
            if (!user) {
                // Don't reveal if email exists
                return {
                    success: true,
                    message: 'If the email exists, you will receive a password reset link.'
                };
            }

            // Generate reset token
            const resetToken = crypto.randomBytes(32).toString('hex');
            const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

            // Store reset token (in production, use Redis with expiration)
            this.resetTokens.set(hashedToken, {
                userId: user._id,
                expiresAt: Date.now() + 3600000 // 1 hour
            });

            // Send reset email
            await emailService.sendPasswordResetEmail(email, user.username, resetToken);

            return {
                success: true,
                message: 'Password reset link sent to your email.'
            };
        } catch (error) {
            throw new Error('Failed to send password reset email');
        }
    }

    /**
     * Reset password with token
     */
    async resetPassword(token, newPassword) {
        try {
            const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
            const resetData = this.resetTokens.get(hashedToken);

            if (!resetData || Date.now() > resetData.expiresAt) {
                throw new Error('Invalid or expired reset token');
            }

            // Validate new password
            const passwordValidation = this.validatePassword(newPassword);
            if (!passwordValidation.isValid) {
                throw new Error(passwordValidation.errors.join('. '));
            }

            // Hash new password
            const hashedPassword = await this.hashPassword(newPassword);

            // Update user password
            await User.findByIdAndUpdate(resetData.userId, {
                password: hashedPassword,
                passwordChangedAt: new Date()
            });

            // Clear reset token
            this.resetTokens.delete(hashedToken);

            return {
                success: true,
                message: 'Password reset successful'
            };
        } catch (error) {
            throw new Error(error.message);
        }
    }

    /**
     * Generate OTP
     */
    generateOTP() {
        return crypto.randomInt(100000, 999999).toString();
    }

    /**
     * Store OTP (in production, use Redis)
     */
    storeOTP(email, otp) {
        // In production, this should be stored in Redis with TTL
        global.otpStore = global.otpStore || new Map();
        global.otpStore.set(email, {
            otp,
            expiresAt: Date.now() + 300000 // 5 minutes
        });
    }

    /**
     * Get stored OTP
     */
    getStoredOTP(email) {
        global.otpStore = global.otpStore || new Map();
        return global.otpStore.get(email);
    }

    /**
     * Clear OTP
     */
    clearOTP(email) {
        global.otpStore = global.otpStore || new Map();
        global.otpStore.delete(email);
    }

    /**
     * Generate 2FA secret
     */
    generate2FASecret(username) {
        const secret = speakeasy.generateSecret({
            name: `E-Commerce (${username})`,
            issuer: 'E-Commerce Store'
        });

        return {
            secret: secret.base32,
            qrCodeUrl: secret.otpauth_url
        };
    }

    /**
     * Generate QR code for 2FA setup
     */
    async generateQRCode(otpAuthUrl) {
        try {
            return await QRCode.toDataURL(otpAuthUrl);
        } catch (error) {
            throw new Error('Failed to generate QR code');
        }
    }

    /**
     * Verify 2FA token
     */
    verify2FAToken(secret, token) {
        return speakeasy.totp.verify({
            secret,
            encoding: 'base32',
            token,
            window: 1
        });
    }
}

module.exports = new AuthService();