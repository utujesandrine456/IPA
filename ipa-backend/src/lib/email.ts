import { Resend } from 'resend';
import * as dotenv from 'dotenv';

// Load .env explicitly for standalone usage/utils
dotenv.config();

const resend = new Resend(process.env.RESEND_API_KEY);

// Resend free tier usually requires sending from onboarding@resend.dev unless domain is verified
const FROM_EMAIL = "onboarding@resend.dev"; 

export async function sendProfileCompletionEmail(to: string, token: string) {
    const websiteUrl = process.env.WEBSITE_URL || "https://iap-system.vercel.app";
    const profileLink = `${websiteUrl}/complete-profile?token=${token}`;

    try {
        console.log(`RESEND: Attempting to send profile completion email to ${to}`);
        const { data, error } = await resend.emails.send({
            from: `IAP System <${FROM_EMAIL}>`,
            to: [to],
            subject: "Complete Your Profile",
            html: `
                <div style="font-family: sans-serif; padding: 20px;">
                    <h2>Welcome to IAP System</h2>
                    <p>Hello,</p>
                    <p>Please complete your profile by clicking the button below:</p>
                    <a href="${profileLink}" style="display: inline-block; padding: 10px 20px; background-color: #0070f3; color: white; text-decoration: none; border-radius: 5px;">Complete Profile</a>
                    <p>Or copy this link: ${profileLink}</p>
                    <p>Thank you!</p>
                </div>
            `,
        });

        if (error) {
            console.error("Resend Error (Profile):", error);
            throw new Error(`Resend API Error: ${error.message}`);
        }

        console.log("Email sent via Resend successfully:", data?.id);
        return data;
    } catch (error: any) {
        console.error("CRITICAL: Error sending profile completion email via Resend:", error);
        throw new Error(`Email Service Error: ${error.message || "Unknown error"}`);
    }
}

export async function sendResetPasswordEmail(to: string, token: string) {
    const websiteUrl = process.env.WEBSITE_URL || "https://iap-system.vercel.app";
    const resetLink = `${websiteUrl}/reset-password?token=${token}`;

    try {
        console.log(`RESEND: Attempting to send password reset email to ${to}`);
        const { data, error } = await resend.emails.send({
            from: `IAP System <${FROM_EMAIL}>`,
            to: [to],
            subject: "Password Reset Request",
            html: `
                <div style="font-family: sans-serif; padding: 20px;">
                    <h2>Password Reset</h2>
                    <p>Hello,</p>
                    <p>You requested a password reset. Please click the button below to set a new password:</p>
                    <a href="${resetLink}" style="display: inline-block; padding: 10px 20px; background-color: #0070f3; color: white; text-decoration: none; border-radius: 5px;">Reset Password</a>
                    <p>Or copy this link: ${resetLink}</p>
                    <p>If you did not request this, please ignore this email.</p>
                    <p>Thank you!</p>
                </div>
            `,
        });

        if (error) {
            console.error("Resend Error (Reset):", error);
            throw new Error(`Resend API Error: ${error.message}`);
        }

        console.log("Reset email sent via Resend successfully:", data?.id);
        return data;
    } catch (error: any) {
        console.error("CRITICAL: Error sending reset email via Resend:", error);
        throw new Error(`Email Service Error: ${error.message || "Unknown error"}`);
    }
}
