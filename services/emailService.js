const brevo = require('@getbrevo/brevo');

class EmailService {
    constructor() {
        try {
            // Initialize Brevo API client
            this.apiInstance = new brevo.TransactionalEmailsApi();
            
            // Set API key using the correct method
            if (brevo.ApiClient && brevo.ApiClient.instance) {
                const defaultClient = brevo.ApiClient.instance;
                const apiKey = defaultClient.authentications['api-key'];
                if (apiKey) {
                    apiKey.apiKey = process.env.BREVO_API_KEY;
                }
            }
            
            // Default sender info
            this.defaultSender = {
                email: process.env.BREVO_SENDER_EMAIL || 'noreply@ecommerce.com',
                name: process.env.BREVO_SENDER_NAME || 'E-Commerce Store'
            };
            
            this.isConfigured = !!(process.env.BREVO_API_KEY && this.defaultSender.email);
        } catch (error) {
            console.error('Failed to initialize Brevo email service:', error);
            this.isConfigured = false;
            this.apiInstance = null;
        }
    }

    /**
     * Send OTP verification email
     */
    async sendOTPEmail(recipientEmail, recipientName, otp) {
        if (!this.isConfigured) {
            console.log('Brevo not configured, skipping OTP email to:', recipientEmail);
            console.log('OTP for development:', otp);
            return { success: true, messageId: 'dev-mode-skip' };
        }

        try {
            const sendSmtpEmail = new brevo.SendSmtpEmail();
            
            sendSmtpEmail.subject = "Email Verification - Your OTP Code";
            sendSmtpEmail.sender = this.defaultSender;
            sendSmtpEmail.to = [{ email: recipientEmail, name: recipientName }];
            sendSmtpEmail.htmlContent = this.getOTPEmailTemplate(recipientName, otp);
            sendSmtpEmail.textContent = `Hello ${recipientName}, Your OTP verification code is: ${otp}. This code will expire in 5 minutes.`;

            const result = await this.apiInstance.sendTransacEmail(sendSmtpEmail);
            console.log('OTP email sent successfully:', result.response?.statusCode);
            return { success: true, messageId: result.response?.messageId };
        } catch (error) {
            console.error('Error sending OTP email:', error);
            // In development, don't fail completely
            if (process.env.NODE_ENV === 'development') {
                console.log('Development mode: OTP =', otp);
                return { success: true, messageId: 'dev-fallback' };
            }
            throw new Error('Failed to send verification email');
        }
    }

    /**
     * Send welcome email after successful registration
     */
    async sendWelcomeEmail(recipientEmail, recipientName) {
        if (!this.isConfigured) {
            console.log('Brevo not configured, skipping welcome email to:', recipientEmail);
            return { success: true, messageId: 'dev-mode-skip' };
        }

        try {
            const sendSmtpEmail = new brevo.SendSmtpEmail();
            
            sendSmtpEmail.subject = "Welcome to Our E-Commerce Store!";
            sendSmtpEmail.sender = this.defaultSender;
            sendSmtpEmail.to = [{ email: recipientEmail, name: recipientName }];
            sendSmtpEmail.htmlContent = this.getWelcomeEmailTemplate(recipientName);
            sendSmtpEmail.textContent = `Welcome ${recipientName}! Thank you for joining our e-commerce platform. Start exploring our amazing products now!`;

            const result = await this.apiInstance.sendTransacEmail(sendSmtpEmail);
            console.log('Welcome email sent successfully:', result.response?.statusCode);
            return { success: true, messageId: result.response?.messageId };
        } catch (error) {
            console.error('Error sending welcome email:', error);
            // Don't throw error for welcome email as it's not critical
            return { success: false, error: error.message };
        }
    }

    /**
     * Send password reset email
     */
    async sendPasswordResetEmail(recipientEmail, recipientName, resetToken) {
        if (!this.isConfigured) {
            console.log('Brevo not configured, skipping password reset email to:', recipientEmail);
            console.log('Reset token for development:', resetToken);
            return { success: true, messageId: 'dev-mode-skip' };
        }

        try {
            const sendSmtpEmail = new brevo.SendSmtpEmail();
            
            sendSmtpEmail.subject = "Password Reset Request";
            sendSmtpEmail.sender = this.defaultSender;
            sendSmtpEmail.to = [{ email: recipientEmail, name: recipientName }];
            sendSmtpEmail.htmlContent = this.getPasswordResetEmailTemplate(recipientName, resetToken);
            sendSmtpEmail.textContent = `Hello ${recipientName}, You requested a password reset. Use this token: ${resetToken}. This link will expire in 1 hour.`;

            const result = await this.apiInstance.sendTransacEmail(sendSmtpEmail);
            console.log('Password reset email sent successfully:', result.response?.statusCode);
            return { success: true, messageId: result.response?.messageId };
        } catch (error) {
            console.error('Error sending password reset email:', error);
            throw new Error('Failed to send password reset email');
        }
    }

    /**
     * Send order confirmation email
     */
    async sendOrderConfirmationEmail(recipientEmail, recipientName, orderDetails) {
        if (!this.isConfigured) {
            console.log('Brevo not configured, skipping order confirmation email to:', recipientEmail);
            return { success: true, messageId: 'dev-mode-skip' };
        }

        try {
            const sendSmtpEmail = new brevo.SendSmtpEmail();
            
            sendSmtpEmail.subject = `Order Confirmation #${orderDetails.orderId}`;
            sendSmtpEmail.sender = this.defaultSender;
            sendSmtpEmail.to = [{ email: recipientEmail, name: recipientName }];
            sendSmtpEmail.htmlContent = this.getOrderConfirmationEmailTemplate(recipientName, orderDetails);
            sendSmtpEmail.textContent = `Hello ${recipientName}, Your order #${orderDetails.orderId} has been confirmed. Total: ₹${orderDetails.total}`;

            const result = await this.apiInstance.sendTransacEmail(sendSmtpEmail);
            console.log('Order confirmation email sent successfully:', result.response?.statusCode);
            return { success: true, messageId: result.response?.messageId };
        } catch (error) {
            console.error('Error sending order confirmation email:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * OTP Email Template
     */
    getOTPEmailTemplate(name, otp) {
        return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Email Verification</title>
            <style>
                body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; margin: 0; padding: 0; }
                .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 0 20px rgba(0,0,0,0.1); }
                .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
                .content { padding: 40px 30px; }
                .otp-box { background: #f8f9fa; border: 2px dashed #007bff; border-radius: 10px; text-align: center; padding: 30px; margin: 30px 0; }
                .otp-code { font-size: 32px; font-weight: bold; color: #007bff; letter-spacing: 5px; margin: 10px 0; }
                .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #666; }
                .btn { display: inline-block; background: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Email Verification</h1>
                    <p>Welcome to ${this.defaultSender.name}</p>
                </div>
                <div class="content">
                    <h2>Hello ${name},</h2>
                    <p>Thank you for signing up! To complete your registration, please verify your email address using the OTP code below:</p>
                    
                    <div class="otp-box">
                        <p style="margin: 0; font-size: 16px; color: #666;">Your verification code is:</p>
                        <div class="otp-code">${otp}</div>
                        <p style="margin: 0; font-size: 14px; color: #999;">This code will expire in 5 minutes</p>
                    </div>
                    
                    <p>If you didn't create an account with us, please ignore this email.</p>
                    
                    <p>Best regards,<br>The ${this.defaultSender.name} Team</p>
                </div>
                <div class="footer">
                    <p>&copy; 2025 ${this.defaultSender.name}. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
        `;
    }

    /**
     * Welcome Email Template
     */
    getWelcomeEmailTemplate(name) {
        return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Welcome!</title>
            <style>
                body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; margin: 0; padding: 0; }
                .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 0 20px rgba(0,0,0,0.1); }
                .header { background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; padding: 30px; text-align: center; }
                .content { padding: 40px 30px; }
                .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #666; }
                .btn { display: inline-block; background: #28a745; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🎉 Welcome to ${this.defaultSender.name}!</h1>
                </div>
                <div class="content">
                    <h2>Hello ${name},</h2>
                    <p>Welcome to our e-commerce family! Your account has been successfully verified and you're all set to start shopping.</p>
                    
                    <p>Here's what you can do now:</p>
                    <ul>
                        <li>🛍️ Browse our amazing product collection</li>
                        <li>💰 Enjoy exclusive member discounts</li>
                        <li>📦 Track your orders in real-time</li>
                        <li>⭐ Leave reviews and ratings</li>
                    </ul>
                    
                    <div style="text-align: center;">
                        <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}" class="btn">Start Shopping Now</a>
                    </div>
                    
                    <p>If you have any questions, feel free to reach out to our support team.</p>
                    
                    <p>Happy shopping!<br>The ${this.defaultSender.name} Team</p>
                </div>
                <div class="footer">
                    <p>&copy; 2025 ${this.defaultSender.name}. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
        `;
    }

    /**
     * Password Reset Email Template
     */
    getPasswordResetEmailTemplate(name, resetToken) {
        const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
        
        return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Password Reset</title>
            <style>
                body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; margin: 0; padding: 0; }
                .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 0 20px rgba(0,0,0,0.1); }
                .header { background: linear-gradient(135deg, #dc3545 0%, #fd7e14 100%); color: white; padding: 30px; text-align: center; }
                .content { padding: 40px 30px; }
                .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #666; }
                .btn { display: inline-block; background: #dc3545; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
                .warning { background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 5px; padding: 15px; margin: 20px 0; color: #856404; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🔒 Password Reset Request</h1>
                </div>
                <div class="content">
                    <h2>Hello ${name},</h2>
                    <p>We received a request to reset your password. If you made this request, click the button below to reset your password:</p>
                    
                    <div style="text-align: center;">
                        <a href="${resetUrl}" class="btn">Reset Password</a>
                    </div>
                    
                    <div class="warning">
                        <strong>⚠️ Security Notice:</strong>
                        <ul>
                            <li>This link will expire in 1 hour</li>
                            <li>If you didn't request this reset, please ignore this email</li>
                            <li>Never share this link with anyone</li>
                        </ul>
                    </div>
                    
                    <p>If the button doesn't work, copy and paste this link into your browser:</p>
                    <p style="word-break: break-all; background: #f8f9fa; padding: 10px; border-radius: 5px; font-family: monospace;">${resetUrl}</p>
                    
                    <p>Best regards,<br>The ${this.defaultSender.name} Team</p>
                </div>
                <div class="footer">
                    <p>&copy; 2025 ${this.defaultSender.name}. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
        `;
    }

    /**
     * Order Confirmation Email Template
     */
    getOrderConfirmationEmailTemplate(name, orderDetails) {
        return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Order Confirmation</title>
            <style>
                body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; margin: 0; padding: 0; }
                .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 0 20px rgba(0,0,0,0.1); }
                .header { background: linear-gradient(135deg, #6f42c1 0%, #e83e8c 100%); color: white; padding: 30px; text-align: center; }
                .content { padding: 40px 30px; }
                .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #666; }
                .order-details { background: #f8f9fa; border-radius: 5px; padding: 20px; margin: 20px 0; }
                .btn { display: inline-block; background: #6f42c1; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🎉 Order Confirmed!</h1>
                    <p>Order #${orderDetails.orderId}</p>
                </div>
                <div class="content">
                    <h2>Hello ${name},</h2>
                    <p>Thank you for your order! We're excited to get your items to you soon.</p>
                    
                    <div class="order-details">
                        <h3>Order Summary</h3>
                        <p><strong>Order ID:</strong> ${orderDetails.orderId}</p>
                        <p><strong>Total Amount:</strong> ₹${orderDetails.total}</p>
                        <p><strong>Order Date:</strong> ${new Date().toLocaleDateString()}</p>
                    </div>
                    
                    <p>We'll send you another email with tracking information once your order ships.</p>
                    
                    <div style="text-align: center;">
                        <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/orders" class="btn">Track Your Order</a>
                    </div>
                    
                    <p>Thank you for shopping with us!<br>The ${this.defaultSender.name} Team</p>
                </div>
                <div class="footer">
                    <p>&copy; 2025 ${this.defaultSender.name}. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
        `;
    }
}

module.exports = new EmailService();