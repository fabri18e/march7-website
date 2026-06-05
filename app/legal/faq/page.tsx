'use client';

import { useState } from 'react';
import Link from 'next/link';

const faqs = [
  {
    q: 'How long does shipping take?',
    a: 'Delivery takes 5–15 business days from the moment your order is dispatched. In many cases orders arrive earlier depending on your location.',
  },
  {
    q: 'How long does order processing take?',
    a: 'Orders are processed within 1–3 business days before being shipped. Once dispatched, you\'ll receive an email with your tracking number.',
  },
  {
    q: 'Where are products shipped from?',
    a: 'Products are shipped from different suppliers and warehouses depending on the item. This is why delivery times may vary slightly between products.',
  },
  {
    q: 'What payment methods do you accept?',
    a: 'We accept credit and debit cards (Visa, Mastercard, Amex) through Stripe, one of the most secure payment platforms in the world. All payments are SSL encrypted.',
  },
  {
    q: 'How can I track my order?',
    a: 'Once your order ships, you\'ll receive an email with your tracking number. You can also check it anytime from the "My Orders" section in your account.',
  },
  {
    q: 'Can I cancel my order?',
    a: 'If your order hasn\'t been processed yet, you can request cancellation by contacting us at support@march7.net as soon as possible. Once processed, cancellation is no longer possible — but you can use our return policy.',
  },
  {
    q: 'What if my product arrived damaged or incorrect?',
    a: 'Contact us within 3 days of receiving your order with photos of the issue. If the damage is our fault, we cover return shipping and send a replacement or full refund at no extra cost.',
  },
  {
    q: 'Do I need an account to purchase?',
    a: 'Yes, an account is required to complete your purchase. This allows us to send you order updates, give you access to your order history, and make any returns easier.',
  },
];

export default function FAQPage() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <div className="max-w-2xl mx-auto px-6 py-14">
      <Link href="/" className="text-sm text-accent hover:underline mb-8 inline-block">← Back</Link>
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Frequently Asked Questions</h1>
      <p className="text-gray-500 text-sm mb-10">Everything you need to know before buying.</p>

      <div className="space-y-3">
        {faqs.map((faq, i) => (
          <div key={i} className="border border-gray-100 rounded-2xl overflow-hidden">
            <button
              onClick={() => setOpen(open === i ? null : i)}
              className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50 transition-colors"
            >
              <span className="font-semibold text-gray-900 text-sm pr-4">{faq.q}</span>
              <svg
                className={`w-5 h-5 text-gray-400 flex-shrink-0 transition-transform ${open === i ? 'rotate-180' : ''}`}
                fill="none" stroke="currentColor" viewBox="0 0 24 24"
              >
                <path strokeWidth="2" strokeLinecap="round" d="M19 9l-7 7-7-7"/>
              </svg>
            </button>
            {open === i && (
              <div className="px-5 pb-4 text-sm text-gray-600 leading-relaxed border-t border-gray-50 pt-3">
                {faq.a}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-10 p-5 bg-gray-50 rounded-2xl text-center">
        <p className="text-sm text-gray-600 mb-3">Didn&apos;t find your answer?</p>
        <Link
          href="/legal/contact"
          className="inline-block bg-accent hover:bg-accent-hover text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors"
        >
          Contact Us →
        </Link>
      </div>
    </div>
  );
}
