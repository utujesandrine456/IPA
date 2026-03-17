import nodemailer from "nodemailer";
import * as dotenv from 'dotenv';
import path from 'path';

// Load .env explicitly for standalone usage/utils
dotenv.config();

console.log("SMTP CONFIG CHECK:", {
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    user: process.env.SMTP_USER,
    hasPassword: !!process.env.SMTP_PASSWORD
});

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: 587,
    secure: false, // false for 587 (STARTTLS), true for 465 (SSL)
    family: 4, // Force IPv4 to avoid ENETUNREACH on IPv6
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
    },
    tls: {
        rejectUnauthorized: false // Helps in some cloud environments
    }
} as any);


export async function sendProfileCompletionEmail(to: string, token: string) {
    const websiteUrl = process.env.WEBSITE_URL || "https://iap-system.vercel.app";
    const profileLink = `${websiteUrl}/complete-profile?token=${token}`;

    const mailOptions = {
        from: `"IAP System" <${process.env.SMTP_USER}>`,
        to,
        subject: "Complete Your Profile",
        html: `
      <p>Hello,</p>
      <p>Please complete your profile by clicking the link below:</p>
      <a href="${profileLink}">Complete Profile</a>
      <p>Thank you!</p>
    `,
    };

    try {
        if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
            console.error("SMTP configuration is missing in environment variables!");
            throw new Error("Email configuration is missing on the server.");
        }

        const info = await transporter.sendMail(mailOptions);
        console.log("Email sent:", info.messageId);
        return info;
    } catch (error: any) {
        console.error("CRITICAL: Error sending profile completion email:", error);
        // Throw a more descriptive error for the frontend to show
        const detail = error?.message || "Unknown SMTP error";
        throw new Error(`SMTP Error: ${detail}`);
    }
}
export async function sendResetPasswordEmail(to: string, token: string) {
    const websiteUrl = process.env.WEBSITE_URL || "http://localhost:3000";
    const resetLink = `${websiteUrl}/reset-password?token=${token}`;

    const mailOptions = {
        from: `"IAP System" <${process.env.SMTP_USER}>`,
        to,
        subject: "Password Reset Request",
        html: `
      <p>Hello,</p>
      <p>You requested a password reset. Please click the link below to set a new password:</p>
      <a href="${resetLink}">Reset Password</a>
      <p>If you did not request this, please ignore this email.</p>
      <p>Thank you!</p>
    `,
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log("Reset email sent:", info.messageId);
        return info;
    } catch (error: any) {
        console.error("CRITICAL: Error sending reset email:", error);
        const detail = error?.message || "Unknown SMTP error";
        throw new Error(`SMTP Error: ${detail}`);
    }
}
