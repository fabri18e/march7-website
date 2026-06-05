import Link from 'next/link';

export default function ContactPage() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-14">
      <Link href="/" className="text-sm text-accent hover:underline mb-8 inline-block">← Back</Link>
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Contact Us</h1>
      <p className="text-gray-500 text-sm mb-10">Estamos aquí para ayudarte con cualquier pregunta sobre tu pedido.</p>

      <div className="space-y-5">

        {/* Email card */}
        <div className="border border-gray-100 rounded-2xl p-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0 text-lg">
              📧
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">Email</h3>
              <a
                href="mailto:support@march7.net"
                className="text-accent hover:underline font-medium"
              >
                support@march7.net
              </a>
              <p className="text-sm text-gray-500 mt-1">
                Respondemos dentro de las próximas 24–48 horas en días hábiles.
              </p>
            </div>
          </div>
        </div>

        {/* Response time */}
        <div className="border border-gray-100 rounded-2xl p-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center flex-shrink-0 text-lg">
              ⏱️
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">Tiempo de respuesta</h3>
              <p className="text-sm text-gray-600">
                Nuestro equipo de soporte está disponible de <strong>lunes a viernes</strong>.
                Los mensajes recibidos durante el fin de semana serán respondidos el lunes siguiente.
              </p>
            </div>
          </div>
        </div>

        {/* Before contacting */}
        <div className="bg-gray-50 border border-gray-100 rounded-2xl p-6">
          <h3 className="font-semibold text-gray-900 mb-3">Antes de contactarnos, revisa:</h3>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-center gap-2">
              <svg className="w-4 h-4 text-accent flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeWidth="2" strokeLinecap="round" d="M9 5l7 7-7 7"/>
              </svg>
              <Link href="/legal/faq" className="hover:text-accent hover:underline">
                Preguntas frecuentes (FAQ)
              </Link>
            </li>
            <li className="flex items-center gap-2">
              <svg className="w-4 h-4 text-accent flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeWidth="2" strokeLinecap="round" d="M9 5l7 7-7 7"/>
              </svg>
              <Link href="/legal/shipping" className="hover:text-accent hover:underline">
                Política de envíos
              </Link>
            </li>
            <li className="flex items-center gap-2">
              <svg className="w-4 h-4 text-accent flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeWidth="2" strokeLinecap="round" d="M9 5l7 7-7 7"/>
              </svg>
              <Link href="/legal/returns" className="hover:text-accent hover:underline">
                Política de devoluciones
              </Link>
            </li>
            <li className="flex items-center gap-2">
              <svg className="w-4 h-4 text-accent flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeWidth="2" strokeLinecap="round" d="M9 5l7 7-7 7"/>
              </svg>
              <Link href="/account" className="hover:text-accent hover:underline">
                Tu historial de órdenes
              </Link>
            </li>
          </ul>
        </div>

        {/* CTA */}
        <div className="text-center pt-2">
          <a
            href="mailto:support@march7.net"
            className="inline-flex items-center gap-2 bg-accent hover:bg-accent-hover text-white font-semibold px-8 py-3.5 rounded-xl transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
            </svg>
            Enviar email
          </a>
        </div>

      </div>
    </div>
  );
}
