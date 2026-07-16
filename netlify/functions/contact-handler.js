/**
 * Ten11 Pizza Valley — order form handler (Netlify Functions)
 * Netlify auto-detects files in netlify/functions/ and serves this at:
 *   POST /.netlify/functions/contact-handler
 *
 * (This is a separate file from api/contact-handler.js, which is the same
 * logic written for Vercel's different function signature — keep both if
 * you might deploy to either platform; delete whichever one you don't use.)
 *
 * Requires two environment variables, set in Netlify's dashboard under
 * Site configuration → Environment variables — see README.md for how to
 * generate the Gmail App Password:
 *
 *   GMAIL_USER          e.g. ten11pizzavalley@gmail.com
 *   GMAIL_APP_PASSWORD  a 16-character Gmail "App Password"
 */

const nodemailer = require("nodemailer");

const TO_EMAIL = "ameerhamzatech28@gmail.com";

function validate({ name, phone, order, cart_summary }) {
  const errors = [];
  if (!name || !name.trim()) errors.push("Name is required.");
  if (!phone || !/^[0-9+\-\s()]{7,20}$/.test(phone.trim())) errors.push("A valid phone number is required.");
  if ((!order || !order.trim()) && (!cart_summary || !cart_summary.trim())) errors.push("Please select at least one menu item, or add a note.");
  return errors;
}

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ ok: false, message: "This endpoint only accepts POST requests." }),
    };
  }

  let body = {};
  try {
    body = JSON.parse(event.body || "{}");
  } catch (e) {
    return { statusCode: 400, body: JSON.stringify({ ok: false, message: "Invalid request body." }) };
  }

  const name = (body.name || "").toString().trim();
  const phone = (body.phone || "").toString().trim();
  const address = (body.address || "").toString().trim();
  const order = (body.order || "").toString().trim();
  const cart_summary = (body.cart_summary || "").toString().trim();
  const cart_total = (body.cart_total || "0").toString().trim();
  const company = (body.company || "").toString().trim(); // honeypot

  if (company) {
    return { statusCode: 200, body: JSON.stringify({ ok: true, message: "Thanks!" }) };
  }

  const errors = validate({ name, phone, order, cart_summary });
  if (errors.length) {
    return { statusCode: 400, body: JSON.stringify({ ok: false, message: errors.join(" ") }) };
  }

  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    console.error("Missing GMAIL_USER / GMAIL_APP_PASSWORD environment variables.");
    return {
      statusCode: 500,
      body: JSON.stringify({
        ok: false,
        message: "Ordering isn't set up yet on the server — please call +92 300 1691011 to order.",
      }),
    };
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
        (cart_summary ? `Selected items:\n${cart_summary}\n\nTotal: Rs. ${Number(cart_total).toLocaleString()}\n\n` : "") +
        (order ? `Additional notes:\n${order}\n` : ""),
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ ok: true, message: `Thanks ${name}! We've got your order and will call ${phone} to confirm.` }),
    };
  } catch (err) {
    console.error("Order email failed:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({
        ok: false,
        message: "We could not send that automatically — please call us at +92 300 1691011 to place your order.",
      }),
    };
  }
};
