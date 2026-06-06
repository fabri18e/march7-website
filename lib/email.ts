const BREVO_API_KEY = process.env.BREVO_API_KEY!;
const FROM_EMAIL = process.env.EMAIL_FROM_ADDRESS || 'store@march7.net';
const FROM_NAME = process.env.EMAIL_FROM_NAME || 'March7';
const SITE_URL = process.env.NEXT_PUBLIC_URL || 'https://march7.com';

export interface OrderItem {
  name: string;
  quantity: number;
  unit_price: number;
  total: number;
  product_id?: string | null;
}

async function sendEmail({ to, subject, html }: { to: string; subject: string; html: string }) {
  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: { 'api-key': BREVO_API_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sender: { name: FROM_NAME, email: FROM_EMAIL },
      to: [{ email: to }],
      subject,
      htmlContent: html,
    }),
  });
  if (!res.ok) throw new Error(`Brevo: ${await res.text()}`);
  return res.json();
}

// ─── Shared layout wrapper ────────────────────────────────────────────────────

function emailLayout(body: string) {
  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F9FAFB;font-family:system-ui,sans-serif">
<div style="max-width:520px;margin:40px auto;background:#FFFFFF;border-radius:16px;overflow:hidden;border:1px solid #E5E7EB">
  <div style="background:#0F172A;padding:28px 32px;text-align:center">
    <span style="color:#FFFFFF;font-size:24px;font-weight:800;letter-spacing:-0.5px">March7</span>
  </div>
  ${body}
  <div style="background:#F9FAFB;border-top:1px solid #E5E7EB;padding:20px 32px;text-align:center">
    <p style="margin:0;font-size:12px;color:#9CA3AF">
      Questions? <a href="mailto:${FROM_EMAIL}" style="color:#2563EB;text-decoration:none">Contact support</a>
      &nbsp;·&nbsp;
      <a href="${SITE_URL}/legal/returns" style="color:#2563EB;text-decoration:none">Return policy</a>
    </p>
    <p style="margin:8px 0 0;font-size:11px;color:#D1D5DB">© ${new Date().getFullYear()} March7. All rights reserved.</p>
  </div>
</div>
</body></html>`;
}

function itemsTable(items: OrderItem[], totalAmount: number) {
  const rows = items.map(item => `
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid #F3F4F6;font-size:14px;color:#374151">${item.name}</td>
      <td style="padding:10px 0;border-bottom:1px solid #F3F4F6;font-size:14px;color:#6B7280;text-align:center">×${item.quantity}</td>
      <td style="padding:10px 0;border-bottom:1px solid #F3F4F6;font-size:14px;font-weight:600;color:#111827;text-align:right">$${item.total.toFixed(2)}</td>
    </tr>`).join('');

  return `
    <table style="width:100%;border-collapse:collapse;margin-bottom:16px">
      <thead>
        <tr>
          <th style="text-align:left;font-size:11px;color:#9CA3AF;text-transform:uppercase;padding-bottom:8px">Product</th>
          <th style="text-align:center;font-size:11px;color:#9CA3AF;text-transform:uppercase;padding-bottom:8px">Qty</th>
          <th style="text-align:right;font-size:11px;color:#9CA3AF;text-transform:uppercase;padding-bottom:8px">Price</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
    <div style="display:flex;justify-content:space-between;border-top:2px solid #111827;padding-top:12px">
      <span style="font-weight:700;color:#111827">Total</span>
      <span style="font-size:18px;font-weight:800;color:#111827">$${(totalAmount / 100).toFixed(2)}</span>
    </div>`;
}

function ctaButton(href: string, text: string, color = '#2563EB') {
  return `<a href="${href}" style="display:inline-block;background:${color};color:#FFFFFF;font-size:14px;font-weight:700;padding:14px 32px;border-radius:10px;text-decoration:none">${text}</a>`;
}

// ─── 0. Admin: New Order Alert ───────────────────────────────────────────────

export async function sendAdminOrderAlert({
  orderId, email, items, totalAmount, shippingAddress,
}: {
  orderId: string;
  email: string;
  items: OrderItem[];
  totalAmount: number;
  shippingAddress?: (Record<string, string | null> & { name?: string | null }) | null;
}) {
  const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL;
  if (!adminEmail) return;

  const addressLines = shippingAddress
    ? [
        shippingAddress.name,
        shippingAddress.line1,
        shippingAddress.line2,
        [shippingAddress.city, shippingAddress.state, shippingAddress.postal_code].filter(Boolean).join(', '),
        shippingAddress.country,
      ].filter(Boolean).join('<br>')
    : 'Not captured';

  const itemRows = items.map(i =>
    `<tr>
      <td style="padding:8px 0;border-bottom:1px solid #F3F4F6;font-size:13px;color:#374151">${i.name}</td>
      <td style="padding:8px 0;border-bottom:1px solid #F3F4F6;font-size:13px;color:#6B7280;text-align:center">×${i.quantity}</td>
      <td style="padding:8px 0;border-bottom:1px solid #F3F4F6;font-size:13px;font-weight:600;color:#111827;text-align:right">$${i.total.toFixed(2)}</td>
    </tr>`
  ).join('');

  const html = emailLayout(`
    <div style="padding:32px 32px 20px">
      <div style="background:#FFF7ED;border:1px solid #FED7AA;border-radius:10px;padding:14px 18px;margin-bottom:24px;text-align:center">
        <p style="margin:0;font-size:16px;font-weight:700;color:#C2410C">🛍️ New Order — Action Required</p>
        <p style="margin:4px 0 0;font-size:13px;color:#EA580C">Go to admin panel → click Fulfill to place on AliExpress</p>
      </div>

      <div style="margin-bottom:20px">
        <p style="margin:0 0 4px;font-size:11px;color:#9CA3AF;text-transform:uppercase">Customer</p>
        <p style="margin:0;font-size:14px;color:#111827;font-weight:600">${email}</p>
        <p style="margin:4px 0 0;font-size:12px;color:#9CA3AF;font-family:monospace">
          Order #${orderId.replace('paypal_', '').slice(-10).toUpperCase()}
        </p>
      </div>

      <div style="margin-bottom:20px">
        <p style="margin:0 0 8px;font-size:11px;color:#9CA3AF;text-transform:uppercase">Items ordered</p>
        <table style="width:100%;border-collapse:collapse">${itemRows}</table>
        <div style="display:flex;justify-content:space-between;padding-top:10px;border-top:2px solid #111827;margin-top:4px">
          <span style="font-weight:700;color:#111827">Total</span>
          <span style="font-size:16px;font-weight:800;color:#111827">$${(totalAmount / 100).toFixed(2)}</span>
        </div>
      </div>

      <div style="margin-bottom:24px">
        <p style="margin:0 0 8px;font-size:11px;color:#9CA3AF;text-transform:uppercase">Ship to (AliExpress address)</p>
        <div style="background:#F9FAFB;border:1px solid #E5E7EB;border-radius:8px;padding:12px 14px;font-size:13px;color:#374151;line-height:1.6">
          ${addressLines}
        </div>
      </div>

      <div style="text-align:center">
        ${ctaButton(`${SITE_URL}/admin`, '→ Open Admin Panel to Fulfill', '#EA580C')}
      </div>
    </div>`);

  return sendEmail({ to: adminEmail, subject: `🛍️ New order $${(totalAmount / 100).toFixed(2)} from ${email}`, html });
}

// ─── 1. Order Confirmed ───────────────────────────────────────────────────────

export async function sendOrderConfirmation({
  to, orderId, items, totalAmount,
}: { to: string; orderId: string; items: OrderItem[]; totalAmount: number }) {
  const html = emailLayout(`
    <div style="padding:40px 32px 24px;text-align:center">
      <div style="font-size:48px;margin-bottom:16px">🎉</div>
      <h1 style="margin:0 0 10px;font-size:24px;font-weight:700;color:#111827">Order Confirmed!</h1>
      <p style="margin:0 0 6px;color:#6B7280;font-size:15px">Thank you for choosing March7. We're getting your order ready.</p>
      <p style="margin:0 0 28px;font-size:12px;color:#9CA3AF;font-family:monospace">
        Order #${orderId.replace('paypal_', '').slice(-10).toUpperCase()}
      </p>
    </div>
    <div style="padding:0 32px 32px">${itemsTable(items, totalAmount)}</div>
    <div style="padding:0 32px 32px;text-align:center">
      ${ctaButton(`${SITE_URL}/account`, 'View My Order →')}
    </div>
    <div style="margin:0 32px 28px;background:#F0FDF4;border:1px solid #BBF7D0;border-radius:10px;padding:14px 18px">
      <p style="margin:0;font-size:13px;color:#15803D;text-align:center">
        🛡️ Quality Verified &nbsp;·&nbsp; 🚚 Delivers in 7–15 days &nbsp;·&nbsp; ↩ 30-Day Returns
      </p>
    </div>`);

  return sendEmail({ to, subject: 'Your March7 order is confirmed ✓', html });
}

// ─── 2. Processing ────────────────────────────────────────────────────────────

export async function sendOrderProcessing({
  to, orderId, items, totalAmount,
}: { to: string; orderId: string; items: OrderItem[]; totalAmount: number }) {
  const html = emailLayout(`
    <div style="padding:40px 32px 24px;text-align:center">
      <div style="font-size:48px;margin-bottom:16px">⚙️</div>
      <h1 style="margin:0 0 10px;font-size:24px;font-weight:700;color:#111827">We're Preparing Your Order</h1>
      <p style="margin:0 0 6px;color:#6B7280;font-size:15px">Our team is carefully packing your items. You'll get another update when it ships.</p>
      <p style="margin:0 0 28px;font-size:12px;color:#9CA3AF;font-family:monospace">
        Order #${orderId.replace('paypal_', '').slice(-10).toUpperCase()}
      </p>
    </div>
    <div style="padding:0 32px 32px">${itemsTable(items, totalAmount)}</div>
    <div style="padding:0 32px 32px;text-align:center">
      ${ctaButton(`${SITE_URL}/account`, 'Track My Order →')}
    </div>`);

  return sendEmail({ to, subject: 'Your March7 order is being processed ⚙️', html });
}

// ─── 3. Shipped ───────────────────────────────────────────────────────────────

export async function sendOrderShipped({
  to, orderId, items, totalAmount, trackingNumber, trackingUrl, estimatedDelivery,
}: {
  to: string; orderId: string; items: OrderItem[]; totalAmount: number;
  trackingNumber?: string | null; trackingUrl?: string | null; estimatedDelivery?: string | null;
}) {
  const trackingBlock = trackingNumber ? `
    <div style="margin:0 32px 24px;background:#EFF6FF;border:1px solid #BFDBFE;border-radius:12px;padding:16px 20px;text-align:center">
      <p style="margin:0 0 4px;font-size:12px;color:#3B82F6;text-transform:uppercase;letter-spacing:0.05em">Tracking Number</p>
      ${trackingUrl
        ? `<a href="${trackingUrl}" style="font-size:18px;font-family:monospace;font-weight:700;color:#1D4ED8;text-decoration:none">${trackingNumber} →</a>`
        : `<p style="margin:0;font-size:18px;font-family:monospace;font-weight:700;color:#111827">${trackingNumber}</p>`
      }
      ${estimatedDelivery ? `<p style="margin:8px 0 0;font-size:13px;color:#6B7280">Estimated delivery: <strong>${new Date(estimatedDelivery).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</strong></p>` : ''}
    </div>` : '';

  const html = emailLayout(`
    <div style="padding:40px 32px 24px;text-align:center">
      <div style="font-size:48px;margin-bottom:16px">📦</div>
      <h1 style="margin:0 0 10px;font-size:24px;font-weight:700;color:#111827">Your Order Is On Its Way!</h1>
      <p style="margin:0 0 28px;color:#6B7280;font-size:15px">Your package has been shipped and is heading to you.</p>
    </div>
    ${trackingBlock}
    <div style="padding:0 32px 28px">${itemsTable(items, totalAmount)}</div>
    <div style="padding:0 32px 32px;text-align:center">
      ${ctaButton(`${SITE_URL}/account`, 'Track My Order →')}
    </div>`);

  return sendEmail({ to, subject: 'Your March7 order has shipped 📦', html });
}

// ─── 4. Delivered + Rate ──────────────────────────────────────────────────────

export async function sendOrderDelivered({
  to, orderId, items, totalAmount,
}: { to: string; orderId: string; items: OrderItem[]; totalAmount: number }) {
  const reviewButtons = items
    .filter(item => item.product_id)
    .map(item => `
      <a href="${SITE_URL}/products/${item.product_id}?review=true"
         style="display:block;margin-bottom:8px;background:#F9FAFB;border:1px solid #E5E7EB;border-radius:10px;padding:12px 16px;text-decoration:none;color:#111827;font-size:13px;text-align:left">
        <span style="font-weight:600">${item.name}</span>
        <span style="float:right;color:#F59E0B">⭐⭐⭐⭐⭐</span>
      </a>`).join('');

  const html = emailLayout(`
    <div style="padding:40px 32px 24px;text-align:center">
      <div style="font-size:48px;margin-bottom:16px">✅</div>
      <h1 style="margin:0 0 10px;font-size:24px;font-weight:700;color:#111827">Your Order Was Delivered!</h1>
      <p style="margin:0 0 28px;color:#6B7280;font-size:15px">
        We hope you love your purchase. Enjoy your new gear!
      </p>
    </div>
    <div style="padding:0 32px 28px">${itemsTable(items, totalAmount)}</div>

    ${reviewButtons ? `
    <div style="padding:0 32px 32px">
      <p style="font-size:14px;font-weight:700;color:#111827;margin:0 0 12px">How was your experience?</p>
      <p style="font-size:13px;color:#6B7280;margin:0 0 16px">Tap a product below to leave your review — it takes 30 seconds and helps other customers.</p>
      ${reviewButtons}
    </div>` : ''}

    <div style="padding:0 32px 32px;text-align:center">
      ${ctaButton(`${SITE_URL}/account`, 'View My Orders →')}
    </div>
    <div style="margin:0 32px 28px;background:#FFF7ED;border:1px solid #FED7AA;border-radius:10px;padding:14px 18px;text-align:center">
      <p style="margin:0;font-size:13px;color:#C2410C">
        Not happy? We offer <strong>30-day no-questions-asked returns</strong>.
        <a href="${SITE_URL}/legal/returns" style="color:#C2410C">Learn more →</a>
      </p>
    </div>`);

  return sendEmail({ to, subject: 'Your March7 order has been delivered ✅', html });
}

// ─── 5. Refunded ──────────────────────────────────────────────────────────────

export async function sendOrderRefunded({
  to, orderId, items, totalAmount,
}: { to: string; orderId: string; items: OrderItem[]; totalAmount: number }) {
  const html = emailLayout(`
    <div style="padding:40px 32px 24px;text-align:center">
      <div style="font-size:48px;margin-bottom:16px">💸</div>
      <h1 style="margin:0 0 10px;font-size:24px;font-weight:700;color:#111827">Your Refund Is On Its Way</h1>
      <p style="margin:0 0 6px;color:#6B7280;font-size:15px">We've processed a full refund for your order. It usually takes 5–10 business days to appear on your statement depending on your bank.</p>
      <p style="margin:0 0 28px;font-size:12px;color:#9CA3AF;font-family:monospace">
        Order #${orderId.replace('paypal_', '').slice(-10).toUpperCase()}
      </p>
    </div>
    <div style="padding:0 32px 28px">${itemsTable(items, totalAmount)}</div>
    <div style="margin:0 32px 28px;background:#F0FDF4;border:1px solid #BBF7D0;border-radius:10px;padding:14px 18px;text-align:center">
      <p style="margin:0;font-size:13px;color:#15803D">
        Amount refunded: <strong>$${(totalAmount / 100).toFixed(2)}</strong>
      </p>
    </div>
    <div style="padding:0 32px 32px;text-align:center">
      ${ctaButton(`${SITE_URL}/products`, 'Continue Shopping →', '#111827')}
    </div>`);

  return sendEmail({ to, subject: 'Your March7 refund has been processed 💸', html });
}

// ─── 6. Cancelled ────────────────────────────────────────────────────────────

export async function sendOrderCancelled({
  to, orderId, items, totalAmount,
}: { to: string; orderId: string; items: OrderItem[]; totalAmount: number }) {
  const html = emailLayout(`
    <div style="padding:40px 32px 24px;text-align:center">
      <div style="font-size:48px;margin-bottom:16px">❌</div>
      <h1 style="margin:0 0 10px;font-size:24px;font-weight:700;color:#111827">Order Cancelled</h1>
      <p style="margin:0 0 6px;color:#6B7280;font-size:15px">Your order has been cancelled. If you were charged, a full refund will be processed within 5–10 business days.</p>
      <p style="margin:0 0 28px;font-size:12px;color:#9CA3AF;font-family:monospace">
        Order #${orderId.replace('paypal_', '').slice(-10).toUpperCase()}
      </p>
    </div>
    <div style="padding:0 32px 28px">${itemsTable(items, totalAmount)}</div>
    <div style="padding:0 32px 32px;text-align:center">
      ${ctaButton(`${SITE_URL}/legal/contact`, 'Contact Support →', '#6B7280')}
    </div>
    <div style="padding:0 32px 32px;text-align:center">
      ${ctaButton(`${SITE_URL}/products`, 'Browse Products →', '#111827')}
    </div>`);

  return sendEmail({ to, subject: 'Your March7 order has been cancelled', html });
}
