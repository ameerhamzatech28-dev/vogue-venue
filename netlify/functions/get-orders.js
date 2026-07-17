/**
 * Ten11 Pizza Valley — Clients Orders data feed (Netlify Functions)
 * GET /.netlify/functions/get-orders?passcode=XXXX
 *
 * Returns every order saved by contact-handler.js, newest first.
 *
 * IMPORTANT: this list includes customer names, phone numbers, and
 * delivery addresses. To stop it being wide open to anyone on the
 * internet, it requires a passcode — set ADMIN_PASSCODE in Netlify's
 * dashboard under Site configuration → Environment variables (pick
 * any word/PIN you'll remember; share it only with staff who should
 * see the orders list).
 */

const { getStore } = require("@netlify/blobs");

exports.handler = async (event) => {
  if (event.httpMethod !== "GET") {
    return { statusCode: 405, body: JSON.stringify({ ok: false, message: "GET only." }) };
  }

  const passcode = (event.queryStringParameters && event.queryStringParameters.passcode) || "";

  if (!process.env.ADMIN_PASSCODE) {
    return {
      statusCode: 500,
      body: JSON.stringify({ ok: false, message: "ADMIN_PASSCODE isn't set up yet on the server." }),
    };
  }

  if (passcode !== process.env.ADMIN_PASSCODE) {
    return { statusCode: 401, body: JSON.stringify({ ok: false, message: "Wrong passcode." }) };
  }

  try {
    const store = getStore("orders");
    const { blobs } = await store.list();
    const orders = await Promise.all(
      blobs.map((b) => store.get(b.key, { type: "json" }))
    );
    orders.sort((a, b) => (b && a ? new Date(b.receivedAt) - new Date(a.receivedAt) : 0));

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ok: true, orders: orders.filter(Boolean) }),
    };
  } catch (err) {
    console.error("Failed to list orders:", err);
    return { statusCode: 500, body: JSON.stringify({ ok: false, message: "Could not load orders." }) };
  }
};
