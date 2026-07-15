/**
 * Ten11 Pizza Valley — order form handler (Vercel serverless function)
 * Vercel auto-detects any file in /api as a serverless function, so this
 * runs at:  POST /api/contact-handler
 *
 * Sends the order by email using your existing Gmail account via SMTP
 * (free — no third-party email service needed). Requires two environment
 * variables set in the Vercel dashboard (Project → Settings → Environment
 * Variables) — see README.md for how to generate the App Password:
 *
 *   GMAIL_USER          e.g. ten11pizzavalley@gmail.com
 *   GMAIL_APP_PASSWORD  a 16-character Gmail "App Password" (not your normal password)
 */

const nodemailer = require("nodemailer");

const TO_EMAIL = "ameerhamzatech28@gmail.com";

function validate({ name, phone, order }) {
  const errors = [];
  if (!name || !name.trim()) errors.push("Name is required.");
  if (!phone || !/^[0-9+\-\s()]{7,20}$/.test(phone.trim())) errors.push("A valid phone number is required.");
  if (!order || !order.trim()) errors.push("Please tell us what you would like to order.");
  return errors;
}

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).json({ ok: false, message: "This endpoint only accepts POST requests." });
    return;
  }

  const body = req.body || {};
  const name = (body.name || "").toString().trim();
  const phone = (body.phone || "").toString().trim();
  const address = (body.address || "").toString().trim();
  const order = (body.order || "").toString().trim();
  const company = (body.company || "").toString().trim(); // honeypot

  // Bots fill hidden fields — silently accept so they don't learn it failed.
  if (company) {
    res.status(200).json({ ok: true, message: "Thanks!" });
    return;
  }

  const errors = validate({ name, phone, order });
  if (errors.length) {
    res.status(400).json({ ok: false, message: errors.join(" ") });
    return;
  }

  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    console.error("Missing GMAIL_USER / GMAIL_APP_PASSWORD environment variables.");
    res.status(500).json({
      ok: false,
      message: "Ordering isn't set up yet on the server — please call +92 300 1691011 to order.",
    });
    return;
  }

  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });

    await transporter.sendMail({
      from: `"Ten11 Pizza Valley Website" <${process.env.GMAIL_USER}>`,
      to: TO_EMAIL,
      replyTo: process.env.GMAIL_USER,
      subject: `New order — ${name} (${phone})`,
      text:
        `New order received from the website:\n\n` +
        `Name:    ${name}\n` +
        `Phone:   ${phone}\n` +
        `Address: ${address}\n\n` +
        `Order:\n${order}\n`,
    });

    res.status(200).json({
      ok: true,
      message: `Thanks ${name}! We've got your order and will call ${phone} to confirm.`,
    });
  } catch (err) {
    console.error("Order email failed:", err);
    res.status(500).json({
      ok: false,
      message: "We could not send that automatically — please call us at +92 300 1691011 to place your order.",
    });
  }
};
