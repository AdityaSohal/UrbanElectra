import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

const transporter = nodemailer.createTransport({
	service: "gmail",
	auth: {
		user: process.env.EMAIL_USER,
		pass: process.env.EMAIL_PASS,
	},
});

// ─── OTP Email ────────────────────────────────────────────────────────────────

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

// ─── Order Confirmation Email ─────────────────────────────────────────────────

export const sendOrderConfirmationEmail = async (to, order) => {
	const itemsHtml = order.products
		.map(
			(item) => `
      <tr>
        <td style="padding:12px 8px;border-bottom:1px solid #374151;">
          <div style="display:flex;align-items:center;gap:12px;">
            <img src="${item.product?.image || ""}" alt="${item.product?.name}" 
              style="width:48px;height:48px;border-radius:8px;object-fit:cover;" />
            <span style="color:#f3f4f6;font-size:14px;">${item.product?.name || "Product"}</span>
          </div>
        </td>
        <td style="padding:12px 8px;border-bottom:1px solid #374151;text-align:center;color:#9ca3af;font-size:14px;">
          x${item.quantity}
        </td>
        <td style="padding:12px 8px;border-bottom:1px solid #374151;text-align:right;color:#34d399;font-size:14px;font-weight:600;">
          $${(item.price * item.quantity).toFixed(2)}
        </td>
      </tr>
    `
		)
		.join("");

	const addr = order.shippingAddress;
	const addressHtml = addr
		? `
    <div style="background:#1f2937;border-radius:8px;padding:16px;margin-top:20px;">
      <p style="color:#6b7280;font-size:12px;text-transform:uppercase;letter-spacing:1px;margin:0 0 8px;">Shipping To</p>
      <p style="color:#f3f4f6;margin:0;font-size:14px;">${addr.fullName}</p>
      <p style="color:#9ca3af;margin:4px 0 0;font-size:13px;">
        ${addr.addressLine1}${addr.addressLine2 ? ", " + addr.addressLine2 : ""}<br/>
        ${addr.city}${addr.state ? ", " + addr.state : ""} ${addr.postalCode}<br/>
        ${addr.country}
      </p>
    </div>
  `
		: "";

	await transporter.sendMail({
		from: `"UrbanElectra" <${process.env.EMAIL_USER}>`,
		to,
		subject: `Order Confirmed #${order._id.toString().slice(-8).toUpperCase()} – UrbanElectra`,
		html: `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;background:#111;color:#fff;border-radius:12px;overflow:hidden;">
        <div style="background:#059669;padding:28px 32px;">
          <h1 style="margin:0;font-size:22px;letter-spacing:1px;">UrbanElectra</h1>
          <p style="margin:6px 0 0;font-size:13px;opacity:.85;">Order Confirmation</p>
        </div>
        <div style="padding:32px;">
          <h2 style="color:#34d399;font-size:20px;margin:0 0 8px;">Thanks for your order, ${order.user?.name || ""}!</h2>
          <p style="color:#9ca3af;font-size:13px;margin:0 0 24px;">
            Order ID: <strong style="color:#fff;font-family:monospace;">#${order._id.toString().slice(-8).toUpperCase()}</strong>
          </p>

          <table style="width:100%;border-collapse:collapse;">
            <thead>
              <tr>
                <th style="text-align:left;padding:8px;color:#6b7280;font-size:12px;text-transform:uppercase;border-bottom:1px solid #374151;">Item</th>
                <th style="text-align:center;padding:8px;color:#6b7280;font-size:12px;text-transform:uppercase;border-bottom:1px solid #374151;">Qty</th>
                <th style="text-align:right;padding:8px;color:#6b7280;font-size:12px;text-transform:uppercase;border-bottom:1px solid #374151;">Price</th>
              </tr>
            </thead>
            <tbody>${itemsHtml}</tbody>
          </table>

          <div style="text-align:right;margin-top:16px;padding-top:16px;border-top:1px solid #374151;">
            <span style="color:#9ca3af;font-size:14px;">Total: </span>
            <span style="color:#34d399;font-size:20px;font-weight:700;">$${order.totalAmount.toFixed(2)}</span>
          </div>

          ${addressHtml}

          <div style="background:#1f2937;border-radius:8px;padding:16px;margin-top:20px;">
            <p style="color:#6b7280;font-size:12px;text-transform:uppercase;letter-spacing:1px;margin:0 0 8px;">Estimated Delivery</p>
            <p style="color:#f3f4f6;margin:0;font-size:14px;">3–5 business days</p>
          </div>

          <p style="color:#9ca3af;font-size:13px;margin-top:24px;">
            You can track your order status anytime in <strong style="color:#34d399;">My Orders</strong>.
          </p>
        </div>
        <div style="background:#1f2937;padding:16px 32px;text-align:center;">
          <p style="font-size:12px;color:#6b7280;margin:0;">© ${new Date().getFullYear()} UrbanElectra. All rights reserved.</p>
        </div>
      </div>
    `,
	});
};

// ─── Order Status Update Email ────────────────────────────────────────────────

export const sendOrderStatusEmail = async (to, order, newStatus) => {
	const statusMessages = {
		confirmed:  { label: "Confirmed",   msg: "Your order has been confirmed and is being prepared." },
		processing: { label: "Processing",  msg: "Your order is currently being processed." },
		shipped:    { label: "Shipped",     msg: `Your order is on its way!${order.trackingNumber ? ` Tracking: ${order.trackingCarrier || ""} ${order.trackingNumber}` : ""}` },
		delivered:  { label: "Delivered",   msg: "Your order has been delivered. Enjoy!" },
		cancelled:  { label: "Cancelled",   msg: "Your order has been cancelled." },
		refunded:   { label: "Refunded",    msg: `A refund of $${order.refundAmount?.toFixed(2) || "0.00"} has been processed to your original payment method.` },
	};

	const info = statusMessages[newStatus];
	if (!info) return; // don't email for every status

	await transporter.sendMail({
		from: `"UrbanElectra" <${process.env.EMAIL_USER}>`,
		to,
		subject: `Order ${info.label} #${order._id.toString().slice(-8).toUpperCase()} – UrbanElectra`,
		html: `
      <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;background:#111;color:#fff;border-radius:12px;overflow:hidden;">
        <div style="background:#059669;padding:28px 32px;">
          <h1 style="margin:0;font-size:22px;letter-spacing:1px;">UrbanElectra</h1>
          <p style="margin:6px 0 0;font-size:13px;opacity:.85;">Order Update</p>
        </div>
        <div style="padding:32px;">
          <h2 style="color:#34d399;font-size:18px;margin:0 0 8px;">Order ${info.label}</h2>
          <p style="color:#9ca3af;font-size:13px;margin:0 0 20px;">
            Order <strong style="color:#fff;font-family:monospace;">#${order._id.toString().slice(-8).toUpperCase()}</strong>
          </p>
          <div style="background:#1f2937;border-radius:8px;padding:20px;">
            <p style="color:#d1fae5;font-size:15px;margin:0;">${info.msg}</p>
          </div>
        </div>
        <div style="background:#1f2937;padding:16px 32px;text-align:center;">
          <p style="font-size:12px;color:#6b7280;margin:0;">© ${new Date().getFullYear()} UrbanElectra. All rights reserved.</p>
        </div>
      </div>
    `,
	});
};