"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendProfileCompletionEmail = sendProfileCompletionEmail;
exports.sendResetPasswordEmail = sendResetPasswordEmail;
const nodemailer_1 = __importDefault(require("nodemailer"));
const transporter = nodemailer_1.default.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: false,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
    },
});
async function sendProfileCompletionEmail(to, token) {
    const websiteUrl = process.env.WEBSITE_URL || "http://localhost:3000";
    const profileLink = `${websiteUrl}/complete-profile?token=${token}`;
    const mailOptions = {
        from: `"IPA System" <${process.env.SMTP_USER}>`,
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
        const info = await transporter.sendMail(mailOptions);
        console.log("Email sent:", info.messageId);
        return info;
    }
    catch (error) {
        console.error("Error sending email:", error);
        throw new Error("Failed to send email");
    }
}
async function sendResetPasswordEmail(to, token) {
    const websiteUrl = process.env.WEBSITE_URL || "http://localhost:3000";
    const resetLink = `${websiteUrl}/reset-password?token=${token}`;
    const mailOptions = {
        from: `"IPA System" <${process.env.SMTP_USER}>`,
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
    }
    catch (error) {
        console.error("Error sending reset email:", error);
        throw new Error("Failed to send email");
    }
}
