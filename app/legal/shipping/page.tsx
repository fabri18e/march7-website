import Link from 'next/link';

export default function ShippingPage() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-14">
      <Link href="/" className="text-sm text-accent hover:underline mb-8 inline-block">← Back</Link>
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Shipping Policy</h1>
      <p className="text-gray-500 text-sm mb-10">Last updated: June 2026</p>

      <div className="space-y-8 text-sm text-gray-700 leading-relaxed">

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">⚙️ Order Processing</h2>
          <p>
            Orders are processed within <strong>1–3 business days</strong> after payment confirmation.
            During this time we verify your order, coordinate with the supplier, and prepare shipment.
          </p>
          <p className="mt-2 text-gray-500">
            Orders placed on weekends or public holidays are processed the next business day.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">🚚 Delivery Times</h2>
          <div className="border border-gray-100 rounded-2xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50">
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">Destination</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">Estimated Time</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t border-gray-50">
                  <td className="px-4 py-3">United States</td>
                  <td className="px-4 py-3">7–12 business days</td>
                </tr>
                {/* <tr className="border-t border-gray-50 bg-gray-50/50">
                  <td className="px-4 py-3">Latin America</td>
                  <td className="px-4 py-3">10–15 business days</td>
                </tr>
                <tr className="border-t border-gray-50">
                  <td className="px-4 py-3">Europe</td>
                  <td className="px-4 py-3">10–15 business days</td>
                </tr>
                <tr className="border-t border-gray-50 bg-gray-50/50">
                  <td className="px-4 py-3">Other countries</td>
                  <td className="px-4 py-3">12–20 business days</td>
                </tr> */}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-gray-500">
            👉 In many cases orders arrive earlier than estimated. Times are a guide, not an exact guarantee.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">📍 Shipping Origin</h2>
          <p>
            Products are shipped directly from different suppliers and warehouses depending on the item.
            If your order includes products from multiple suppliers, you may receive separate packages — we&apos;ll notify you if this is the case.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">📦 Order Tracking</h2>
          <p>
            Once your order ships, you&apos;ll receive an email with your tracking number.
            You can also check it anytime from{' '}
            <Link href="/account" className="text-accent hover:underline">My Orders</Link> in your account.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">🌎 Customs & Taxes</h2>
          <p>
            For international shipments, customs duties or import taxes may apply based on your country&apos;s regulations.
            These charges are the buyer&apos;s responsibility and are outside our control.
          </p>
        </section>

        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5">
          <p className="text-sm text-blue-800">
            Questions about your shipment?{' '}
            <Link href="/legal/contact" className="font-semibold hover:underline">Contact us →</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
