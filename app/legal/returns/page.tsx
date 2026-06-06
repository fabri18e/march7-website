import Link from 'next/link';

export default function ReturnsPage() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-14">
      <Link href="/" className="text-sm text-accent hover:underline mb-8 inline-block">← Back</Link>
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Returns & Refunds Policy</h1>
      <p className="text-gray-500 text-sm mb-10">Last updated: June 2026</p>

      <div className="space-y-8 text-sm text-gray-700 leading-relaxed">

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">📅 Return Period</h2>
          <p>
            We accept returns within <strong>30 calendar days</strong> from the date of delivery.
            After this period, we are unable to process returns.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">📦 Return Conditions</h2>
          <p className="mb-3">To be eligible for a return, the item must meet the following conditions:</p>
          <ul className="space-y-2">
            {[
              'Unused and in the same condition as received',
              'In its original packaging, undamaged and unaltered',
              'Including all original accessories and documentation',
              'Proof of purchase required (order number)',
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-2">
                <svg className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
                </svg>
                {item}
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">🔄 Return Process</h2>
          <ol className="list-decimal list-inside space-y-2">
            <li>Contact us at <a href="mailto:support@march7.net" className="text-accent hover:underline">support@march7.net</a> with your order number and the reason for the return.</li>
            <li>Our team will reply within 24 hours with shipping instructions.</li>
            <li>Ship the item using a trackable shipping service.</li>
            <li>Once received and inspected, we will process your refund within <strong>5–10 business days</strong>.</li>
          </ol>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">💸 Refunds</h2>
          <p>
            Refunds are issued to the original payment method. Processing time depends on your bank or payment provider (typically 5–10 business days).
            Return shipping costs are the buyer&apos;s responsibility, <strong>unless the item arrived defective or incorrect</strong>.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">🚫 Non-Returnable Items</h2>
          <ul className="space-y-2">
            {[
              'Items damaged due to misuse, accidents, or modifications',
              'Items marked as "final sale" at the time of purchase',
              'Returns requested after the 30-day period',
              'Items without original packaging or with missing accessories',
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-2">
                <svg className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeWidth="2" strokeLinecap="round" d="M18 6 6 18M6 6l12 12"/>
                </svg>
                {item}
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">⚡ Defective or Incorrect Items</h2>
          <p>
            If you received a defective or wrong item, contact us within <strong>3 days</strong> of receiving your order and include photos of the issue.
            In these cases, we cover the return shipping cost and will send a replacement or issue a full refund at no extra charge.
          </p>
        </section>

        <div className="bg-gray-50 rounded-2xl p-5 text-center">
          <p className="text-sm text-gray-600 mb-3">Need to start a return?</p>
          <Link
            href="/legal/contact"
            className="inline-block bg-accent hover:bg-accent-hover text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors"
          >
            Contact support →
          </Link>
        </div>
      </div>
    </div>
  );
}
