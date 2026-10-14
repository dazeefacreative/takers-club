const { sendMail } = require("./mailer");

const money = (n) => `₦${Number(n).toLocaleString()}`;

const deliveryEstimate = (state) =>
  (state || "").trim().toLowerCase() === "lagos"
    ? "1–3 business days"
    : "3–7 business days";

const itemsTableRows = (items) =>
  items.map((i) => {
    const variantLabel = i.category_slug === "baseball-caps" ? "Color" : "Size";
    return `
    <tr>
      <td style="padding:8px 0;border-bottom:1px solid #eee;">${i.product_name} (${variantLabel}: ${i.size}) × ${i.quantity}</td>
      <td style="padding:8px 0;border-bottom:1px solid #eee;text-align:right;">${money(i.subtotal)}</td>
    </tr>
  `;
  }).join("");

const sendCustomerReceipt = async (order, items) => {
  const html = `
    <div style="font-family:sans-serif;max-width:480px;margin:0 auto;">
      <h2 style="margin-bottom:0;">Thanks for your order, ${order.first_name}!</h2>
      <p style="color:#555;">Order <strong>${order.order_number}</strong> is confirmed.</p>
      <table style="width:100%;border-collapse:collapse;margin:16px 0;">
        ${itemsTableRows(items)}
        <tr><td style="padding:8px 0;">Subtotal</td><td style="padding:8px 0;text-align:right;">${money(order.subtotal)}</td></tr>
        <tr><td style="padding:8px 0;">Shipping</td><td style="padding:8px 0;text-align:right;">${order.shipping_fee === 0 ? "Free" : money(order.shipping_fee)}</td></tr>
        <tr><td style="padding:8px 0;font-weight:bold;">Total</td><td style="padding:8px 0;text-align:right;font-weight:bold;">${money(order.total)}</td></tr>
      </table>
      <p><strong>Delivery address:</strong><br/>
        ${order.address_line1}${order.address_line2 ? ", " + order.address_line2 : ""}<br/>
        ${order.city}, ${order.state}, ${order.country}
      </p>
      <p><strong>Estimated delivery:</strong> ${deliveryEstimate(order.state)} after processing (orders are processed within 24 hours on business days).</p>
      <p style="color:#999;font-size:12px;margin-top:24px;">We'll email you tracking details as soon as your order ships. Questions? Just reply to this email.</p>
      <p style="color:#999;font-size:12px;">Takers Club — Wear your own crown.</p>
    </div>
  `;
  await sendMail({ to: order.email, subject: `Order Confirmed — ${order.order_number}`, html });
};

const sendAdminOrderAlert = async (order, items) => {
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail) {
    console.warn("Admin order alert not sent: ADMIN_EMAIL not configured");
    return;
  }
  const html = `
    <div style="font-family:sans-serif;max-width:480px;margin:0 auto;">
      <h2 style="margin-bottom:0;">New paid order — ${order.order_number}</h2>
      <p><strong>Customer:</strong> ${order.first_name} ${order.last_name} (${order.email}${order.phone ? ", " + order.phone : ""})</p>
      <table style="width:100%;border-collapse:collapse;margin:16px 0;">
        ${itemsTableRows(items)}
        <tr><td style="padding:8px 0;font-weight:bold;">Total</td><td style="padding:8px 0;text-align:right;font-weight:bold;">${money(order.total)}</td></tr>
      </table>
      <p><strong>Ship to:</strong><br/>
        ${order.address_line1}${order.address_line2 ? ", " + order.address_line2 : ""}<br/>
        ${order.city}, ${order.state}, ${order.country}
      </p>
    </div>
  `;
  await sendMail({ to: adminEmail, subject: `New order: ${order.order_number} — ${money(order.total)}`, html });
};

module.exports = { sendCustomerReceipt, sendAdminOrderAlert };
