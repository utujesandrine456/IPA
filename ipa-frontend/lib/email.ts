import nodemailer from "nodemailer";


const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: false, 
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

export async function sendProfileCompletionEmail(to: string, token: string) {
  const profileLink = `${process.env.NEXT_PUBLIC_BASE_URL}/complete-profile?token=${token}`;

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
  } catch (error) {
    console.error("Error sending email:", error);
    throw new Error("Failed to send email");
  }
}
