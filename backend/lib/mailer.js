import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

const transporter = nodemailer.createTransport({
	service: "gmail",
	auth: {
		user: process.env.EMAIL_USER,
		pass: process.env.EMAIL_PASS, // Gmail App Password (not your account password)
	},
});

export const sendOtpEmail = async (to, otp) => {
	await transporter.sendMail({
		from: `"UrbanElectra" <${process.env.EMAIL_USER}>`,
		to,
		subject: "Your Password Reset OTP – UrbanElectra",
		html: `
      <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;background:#111;color:#fff;border-radius:12px;overflow:hidden;">
        <div style="background:#059669;padding:28px 32px;">
          <h1 style="margin:0;font-size:22px;letter-spacing:1px;">UrbanElectra</h1>
          <p style="margin:6px 0 0;font-size:13px;opacity:.85;">Password Reset Request</p>
        </div>
        <div style="padding:32px;">
          <p style="font-size:15px;color:#d1fae5;">Use the OTP below to reset your password.</p>
          <div style="background:#1f2937;border-radius:8px;padding:24px;text-align:center;margin:24px 0;">
            <span style="font-size:38px;font-weight:700;letter-spacing:10px;color:#34d399;">${otp}</span>
          </div>
          <p style="font-size:13px;color:#9ca3af;">This OTP is valid for <strong style="color:#fff;">10 minutes</strong>. Do not share it with anyone.</p>
          <p style="font-size:13px;color:#9ca3af;margin-top:16px;">If you didn't request this, you can safely ignore this email.</p>
        </div>
        <div style="background:#1f2937;padding:16px 32px;text-align:center;">
          <p style="font-size:12px;color:#6b7280;margin:0;">© ${new Date().getFullYear()} UrbanElectra. All rights reserved.</p>
        </div>
      </div>
    `,
	});
};