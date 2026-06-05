import Link from 'next/link';

export default function TermsPage() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-14">
      <Link href="/" className="text-sm text-accent hover:underline mb-8 inline-block">← Back</Link>
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Terms of Service</h1>
      <p className="text-gray-500 text-sm mb-10">Last updated: June 2025</p>

      <div className="space-y-8 text-sm text-gray-700 leading-relaxed">
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Acceptance of Terms</h2>
          <p>By using March7 you agree to these terms. If you disagree, do not use the site.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Products and Pricing</h2>
          <p>Prices are in USD and subject to change without notice. We reserve the right to limit quantities or refuse orders. Product images are for illustration purposes; minor variations may occur.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Orders and Payment</h2>
          <p>An order confirmation does not guarantee fulfillment. We reserve the right to cancel any order due to pricing errors, stock issues, or suspected fraud. Payment is processed by Stripe under their terms of service.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Shipping</h2>
          <p>Delivery times are estimates only. We are not responsible for delays caused by carriers or customs. Risk of loss passes to you upon delivery.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Returns and Refunds</h2>
          <p>See our <Link href="/legal/returns" className="text-accent hover:underline">Return Policy</Link> for full details.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Limitation of Liability</h2>
          <p>March7 shall not be liable for any indirect, incidental, or consequential damages arising from the use of our products or services beyond the purchase price paid.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Contact</h2>
          <p>Questions? Email <a href="mailto:support@march7.com" className="text-accent hover:underline">support@march7.com</a>.</p>
        </section>
      </div>
    </div>
  );
}
