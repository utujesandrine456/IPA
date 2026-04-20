import nodemailer from 'nodemailer';
import * as dotenv from 'dotenv';

// Load .env explicitly for standalone usage/utils
dotenv.config();

export class EmailService {
    private static _transporter: nodemailer.Transporter | null = null;

    private static getTransporter() {
        if (!this._transporter) {
            const gmailUser = process.env.GMAIL_USER;
            const appPassword = process.env.GMAIL_APP_PASSWORD;

            if (!gmailUser || !appPassword) {
                console.error("Missing email credentials. GMAIL_USER:", !!gmailUser, "GMAIL_APP_PASSWORD:", !!appPassword);
                throw new Error('Email credentials not configured. Please set GMAIL_USER and GMAIL_APP_PASSWORD in your .env file.');
            }

            this._transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: gmailUser,
                    pass: appPassword,
                },
            });
        }
        return this._transporter;
    }

    /**
     * Sends an email for profile completion
     */
    static async sendProfileCompletionEmail(to: string, token: string) {
        const websiteUrl = process.env.WEBSITE_URL || "https://iap-system.vercel.app";
        const profileLink = `${websiteUrl}/complete-profile?token=${token}`;

        const mailOptions = {
            from: `"IAP System" <${process.env.GMAIL_USER}>`,
            to: to,
            subject: "Complete Your Profile - IAP System",
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
                    <h2 style="color: #1A264A;">Welcome to IAP System</h2>
                    <p>Hello,</p>
                    <p>Your account has been created. Please complete your profile by clicking the button below:</p>
                    <div style="margin: 30px 0;">
                        <a href="${profileLink}" style="background-color: #1A264A; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Complete Profile</a>
                    </div>
                    <p>If the button doesn't work, copy and paste this link into your browser:</p>
                    <p>${profileLink}</p>
                    <hr style="border: none; border-top: 1px solid #eee; margin-top: 30px;">
                    <p style="font-size: 12px; color: #888;">This is an automated message, please do not reply.</p>
                </div>
            `,
        };

        try {
            console.log(`SMTP: Attempting to send profile completion email to ${to}`);
            const info = await this.getTransporter().sendMail(mailOptions);
            console.log("Email sent successfully via SMTP:", info.messageId);
            return info;
        } catch (error: any) {
            console.error("CRITICAL: SMTP Error (Profile):", error);
            throw new Error(`Email Error: ${error.message || "Unknown error"}`);
        }
    }

    /**
     * Sends an email for password reset
     */
    static async sendResetPasswordEmail(to: string, token: string) {
        const websiteUrl = process.env.WEBSITE_URL || "https://iap-system.vercel.app";
        const resetLink = `${websiteUrl}/reset-password?token=${token}`;

        const mailOptions = {
            from: `"IAP System" <${process.env.GMAIL_USER}>`,
            to: to,
            subject: "Password Reset Request - IAP System",
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
                    <h2 style="color: #1A264A;">Password Reset</h2>
                    <p>Hello,</p>
                    <p>We received a request to reset your password. Click the button below to set a new one:</p>
                    <div style="margin: 30px 0;">
                        <a href="${resetLink}" style="background-color: #1A264A; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Reset Password</a>
                    </div>
                    <p>If you did not request this, you can safely ignore this email.</p>
                    <p>If the button doesn't work, copy and paste this link:</p>
                    <p>${resetLink}</p>
                    <hr style="border: none; border-top: 1px solid #eee; margin-top: 30px;">
                    <p style="font-size: 12px; color: #888;">This is an automated message, please do not reply.</p>
                </div>
            `,
        };

        try {
            console.log(`SMTP: Attempting to send password reset email to ${to}`);
            const info = await this.getTransporter().sendMail(mailOptions);
            console.log("Reset email sent successfully via SMTP:", info.messageId);
            return info;
        } catch (error: any) {
            console.error("CRITICAL: SMTP Error (Reset):", error);
            throw new Error(`Email Error: ${error.message || "Unknown error"}`);
        }
    }

    /**
     * Sends a 2FA OTP code
     */
    static async send2FAOTP(to: string, otp: string) {
        const mailOptions = {
            from: `"IAP Security" <${process.env.GMAIL_USER}>`,
            to: to,
            subject: 'IAP System: Your 2FA Verification Code',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd;">
                    <h2 style="color: #1A264A;">Your Verification Code</h2>
                    <p>Please enter the following 6-digit code to complete your login:</p>
                    <div style="font-size: 32px; font-weight: bold; color: #1A264A; padding: 10px; border: 1px dashed #1A264A; text-align: center;">
                        ${otp}
                    </div>
                    <p>This code will expire in 10 minutes.</p>
                    <hr/>
                    <p style="font-size: 12px; color: #777;">If you did not request this code, please secure your account immediately.</p>
                </div>
            `,
        };

        try {
            console.log(`SMTP: Attempting to send 2FA OTP email to ${to}`);
            const info = await this.getTransporter().sendMail(mailOptions);
            console.log("2FA OTP email sent successfully via SMTP:", info.messageId);
            return info;
        } catch (error: any) {
            console.error('SMTP Error (2FA):', error.message);
            throw new Error(`Email Error: ${error.message || "Unknown error"}`);
        }
    }
}

/**
 * Backward compatibility wrappers
 */
export async function sendProfileCompletionEmail(to: string, token: string) {
    return EmailService.sendProfileCompletionEmail(to, token);
}

export async function sendResetPasswordEmail(to: string, token: string) {
    return EmailService.sendResetPasswordEmail(to, token);
}
