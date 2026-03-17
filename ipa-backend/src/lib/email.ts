import { google } from 'googleapis';
import * as dotenv from 'dotenv';

// Load .env explicitly for standalone usage/utils
dotenv.config();

const GMAIL_USER = process.env.GMAIL_USER;
const CLIENT_ID = process.env.GMAIL_CLIENT_ID;
const CLIENT_SECRET = process.env.GMAIL_CLIENT_SECRET;
const REFRESH_TOKEN = process.env.GMAIL_REFRESH_TOKEN;

// OAuth2 Setup
const oauth2Client = new google.auth.OAuth2(
    CLIENT_ID,
    CLIENT_SECRET,
    'https://developers.google.com/oauthplayground'
);

oauth2Client.setCredentials({
    refresh_token: REFRESH_TOKEN,
});

const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

/**
 * Encodes the email into base64url format for Gmail API
 */
function createEncodedEmail(to: string, subject: string, html: string) {
    const str = [
        `Content-Type: text/html; charset="UTF-8"\n`,
        `MIME-Version: 1.0\n`,
        `Content-Transfer-Encoding: 7bit\n`,
        `to: ${to}\n`,
        `from: "IAP System" <${GMAIL_USER}>\n`,
        `subject: ${subject}\n\n`,
        html,
    ].join('');

    return Buffer.from(str)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
}

export async function sendProfileCompletionEmail(to: string, token: string) {
    const websiteUrl = process.env.WEBSITE_URL || "https://iap-system.vercel.app";
    const profileLink = `${websiteUrl}/complete-profile?token=${token}`;

    const htmlContent = `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
            <h2 style="color: #0070f3;">Welcome to IAP System</h2>
            <p>Hello,</p>
            <p>Your account has been created. Please complete your profile by clicking the button below:</p>
            <div style="margin: 30px 0;">
                <a href="${profileLink}" style="background-color: #0070f3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Complete Profile</a>
            </div>
            <p>If the button doesn't work, copy and paste this link into your browser:</p>
            <p>${profileLink}</p>
            <hr style="border: none; border-top: 1px solid #eee; margin-top: 30px;">
            <p style="font-size: 12px; color: #888;">This is an automated message, please do not reply.</p>
        </div>
    `;

    const encodedMessage = createEncodedEmail(to, "Complete Your Profile - IAP System", htmlContent);

    try {
        console.log(`GMAIL REST API: Attempting to send profile completion email to ${to}`);
        const res = await gmail.users.messages.send({
            userId: 'me',
            requestBody: {
                raw: encodedMessage,
            },
        });
        console.log("Email sent successfully via Gmail REST API:", res.data.id);
        return res.data;
    } catch (error: any) {
        console.error("CRITICAL: Gmail REST API Error (Profile):", error);
        throw new Error(`Gmail API Error: ${error.message || "Unknown error"}`);
    }
}

export async function sendResetPasswordEmail(to: string, token: string) {
    const websiteUrl = process.env.WEBSITE_URL || "https://iap-system.vercel.app";
    const resetLink = `${websiteUrl}/reset-password?token=${token}`;

    const htmlContent = `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
            <h2 style="color: #0070f3;">Password Reset</h2>
            <p>Hello,</p>
            <p>We received a request to reset your password. Click the button below to set a new one:</p>
            <div style="margin: 30px 0;">
                <a href="${resetLink}" style="background-color: #0070f3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Reset Password</a>
            </div>
            <p>If you did not request this, you can safely ignore this email.</p>
            <p>If the button doesn't work, copy and paste this link:</p>
            <p>${resetLink}</p>
            <hr style="border: none; border-top: 1px solid #eee; margin-top: 30px;">
            <p style="font-size: 12px; color: #888;">This is an automated message, please do not reply.</p>
        </div>
    `;

    const encodedMessage = createEncodedEmail(to, "Password Reset Request - IAP System", htmlContent);

    try {
        console.log(`GMAIL REST API: Attempting to send password reset email to ${to}`);
        const res = await gmail.users.messages.send({
            userId: 'me',
            requestBody: {
                raw: encodedMessage,
            },
        });
        console.log("Reset email sent successfully via Gmail REST API:", res.data.id);
        return res.data;
    } catch (error: any) {
        console.error("CRITICAL: Gmail REST API Error (Reset):", error);
        throw new Error(`Gmail API Error: ${error.message || "Unknown error"}`);
    }
}
