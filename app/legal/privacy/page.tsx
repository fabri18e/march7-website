import Link from 'next/link';

export default function PrivacyPage() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-14">
      <Link href="/" className="text-sm text-accent hover:underline mb-8 inline-block">← Back</Link>
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
      <p className="text-gray-500 text-sm mb-10">Last updated: June 2025</p>

      <div className="space-y-8 text-sm text-gray-700 leading-relaxed">
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Information We Collect</h2>
          <p>We collect information you provide directly: name, email address, shipping address, and payment information (processed securely by Stripe — we never store card numbers).</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">How We Use Your Information</h2>
          <ul className="list-disc list-inside space-y-1">
            <li>Process and fulfill your orders</li>
            <li>Send order confirmations and shipping updates</li>
            <li>Respond to customer support requests</li>
            <li>Improve our store and product offerings</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Data Sharing</h2>
          <p>We do not sell your personal information. We share data only with: <strong>Stripe</strong> (payment processing) and <strong>shipping carriers</strong> (order delivery). Both are subject to their own privacy policies.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Cookies</h2>
          <p>We use cookies to maintain your shopping cart session. No third-party advertising cookies are used.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Your Rights</h2>
          <p>You can request access to, correction of, or deletion of your personal data at any time by emailing <a href="mailto:support@march7.com" className="text-accent hover:underline">support@march7.com</a>.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Contact</h2>
          <p>Questions about this policy? Contact us at <a href="mailto:support@march7.com" className="text-accent hover:underline">support@march7.com</a>.</p>
        </section>
      </div>
    </div>
  );
}
