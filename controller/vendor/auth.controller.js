const Vendor = require('../../model/vendor');
const { generateVendorToken } = require('../../middleware/vendorAuth');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

class VendorAuthController {

    // Show registration form
    showRegisterForm = (req, res) => {
        res.render('Vendor/register', {
            title: 'Vendor Registration',
            success_msg: req.flash('success_msg'),
            error_msg: req.flash('error_msg')
        });
    };

    // Handle vendor registration
    register = async (req, res) => {
        try {
            const {
                businessName,
                ownerName,
                email,
                phone,
                password,
                confirmPassword,
                businessType,
                street,
                city,
                state,
                pincode,
                gstNumber,
                panNumber
            } = req.body;

            // Validation
            if (!businessName || !ownerName || !email || !phone || !password) {
                req.flash('error_msg', 'Please fill all required fields');
                return res.redirect('/vendor/register');
            }

            if (password !== confirmPassword) {
                req.flash('error_msg', 'Passwords do not match');
                return res.redirect('/vendor/register');
            }

            if (password.length < 6) {
                req.flash('error_msg', 'Password must be at least 6 characters long');
                return res.redirect('/vendor/register');
            }

            // Check if vendor already exists
            const existingVendor = await Vendor.findOne({ 
                $or: [{ email }, { phone }] 
            });

            if (existingVendor) {
                req.flash('error_msg', 'Vendor with this email or phone already exists');
                return res.redirect('/vendor/register');
            }

            // Create new vendor
            const vendor = new Vendor({
                businessName,
                ownerName,
                email,
                phone,
                password,
                businessType,
                address: {
                    street,
                    city,
                    state,
                    pincode: parseInt(pincode),
                    country: 'India'
                },
                gstNumber,
                panNumber
            });

            await vendor.save();

            req.flash('success_msg', 'Registration successful! Please login to continue.');
            res.redirect('/vendor/login');

        } catch (error) {
            console.error('Vendor registration error:', error);
            req.flash('error_msg', 'Registration failed. Please try again.');
            res.redirect('/vendor/register');
        }
    };

    // Show login form
    showLoginForm = (req, res) => {
        // If already logged in, redirect to dashboard
        if (req.cookies.vendorToken) {
            return res.redirect('/vendor/dashboard');
        }

        res.render('Vendor/login', {
            title: 'Vendor Login',
            success_msg: req.flash('success_msg'),
            error_msg: req.flash('error_msg')
        });
    };

    // Handle vendor login
    login = async (req, res) => {
        try {
            const { email, password } = req.body;

            if (!email || !password) {
                req.flash('error_msg', 'Please provide email and password');
                return res.redirect('/vendor/login');
            }

            const vendor = await Vendor.findByCredentials(email, password);
            const token = generateVendorToken(vendor._id);

            // Set cookie
            res.cookie('vendorToken', token, {
                httpOnly: true,
                maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
                secure: process.env.NODE_ENV === 'production'
            });

            req.flash('success_msg', 'Login successful!');
            res.redirect('/vendor/dashboard');

        } catch (error) {
            console.error('Vendor login error:', error);
            req.flash('error_msg', error.message);
            res.redirect('/vendor/login');
        }
    };

    // Handle logout
    logout = (req, res) => {
        res.clearCookie('vendorToken');
        req.flash('success_msg', 'Logged out successfully');
        res.redirect('/vendor/login');
    };

    // Show forgot password form
    showForgotPasswordForm = (req, res) => {
        res.render('Vendor/forgot-password', {
            title: 'Reset Password',
            success_msg: req.flash('success_msg'),
            error_msg: req.flash('error_msg')
        });
    };

    // Handle forgot password
    forgotPassword = async (req, res) => {
        try {
            const { email } = req.body;

            const vendor = await Vendor.findOne({ email, isActive: true });

            if (!vendor) {
                req.flash('error_msg', 'No vendor found with this email address');
                return res.redirect('/vendor/forgot-password');
            }

            // Generate reset token
            const resetToken = crypto.randomBytes(32).toString('hex');
            vendor.resetPasswordToken = resetToken;
            vendor.resetPasswordExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

            await vendor.save();

            // Here you would typically send an email with the reset link
            // For now, we'll just show the token (in production, remove this)
            console.log('Reset token for', email, ':', resetToken);

            req.flash('success_msg', 'Password reset instructions have been sent to your email');
            res.redirect('/vendor/login');

        } catch (error) {
            console.error('Forgot password error:', error);
            req.flash('error_msg', 'Error sending reset email. Please try again.');
            res.redirect('/vendor/forgot-password');
        }
    };

    // Show reset password form
    showResetPasswordForm = async (req, res) => {
        try {
            const { token } = req.params;

            const vendor = await Vendor.findOne({
                resetPasswordToken: token,
                resetPasswordExpires: { $gt: Date.now() }
            });

            if (!vendor) {
                req.flash('error_msg', 'Password reset token is invalid or has expired');
                return res.redirect('/vendor/forgot-password');
            }

            res.render('Vendor/reset-password', {
                title: 'Reset Password',
                token,
                success_msg: req.flash('success_msg'),
                error_msg: req.flash('error_msg')
            });

        } catch (error) {
            console.error('Reset password form error:', error);
            req.flash('error_msg', 'Error loading reset form');
            res.redirect('/vendor/forgot-password');
        }
    };

    // Handle reset password
    resetPassword = async (req, res) => {
        try {
            const { token } = req.params;
            const { password, confirmPassword } = req.body;

            if (!password || !confirmPassword) {
                req.flash('error_msg', 'Please provide both password fields');
                return res.redirect(`/vendor/reset-password/${token}`);
            }

            if (password !== confirmPassword) {
                req.flash('error_msg', 'Passwords do not match');
                return res.redirect(`/vendor/reset-password/${token}`);
            }

            if (password.length < 6) {
                req.flash('error_msg', 'Password must be at least 6 characters long');
                return res.redirect(`/vendor/reset-password/${token}`);
            }

            const vendor = await Vendor.findOne({
                resetPasswordToken: token,
                resetPasswordExpires: { $gt: Date.now() }
            });

            if (!vendor) {
                req.flash('error_msg', 'Password reset token is invalid or has expired');
                return res.redirect('/vendor/forgot-password');
            }

            // Update password and clear reset token
            vendor.password = password;
            vendor.resetPasswordToken = undefined;
            vendor.resetPasswordExpires = undefined;

            await vendor.save();

            req.flash('success_msg', 'Password updated successfully. Please login with your new password.');
            res.redirect('/vendor/login');

        } catch (error) {
            console.error('Reset password error:', error);
            req.flash('error_msg', 'Error resetting password. Please try again.');
            res.redirect(`/vendor/reset-password/${req.params.token}`);
        }
    };

}

module.exports = new VendorAuthController();