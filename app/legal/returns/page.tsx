import Link from 'next/link';

export default function ReturnsPage() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-14">
      <Link href="/" className="text-sm text-accent hover:underline mb-8 inline-block">← Back</Link>
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Returns & Refunds Policy</h1>
      <p className="text-gray-500 text-sm mb-10">Última actualización: Junio 2025</p>

      <div className="space-y-8 text-sm text-gray-700 leading-relaxed">

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">📅 Período de devolución</h2>
          <p>
            Aceptamos devoluciones dentro de los <strong>14 días calendario</strong> desde la fecha de entrega del producto.
            Pasado este plazo, no podemos procesar devoluciones.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">📦 Condiciones para devolución</h2>
          <p className="mb-3">Para que tu devolución sea aceptada, el producto debe cumplir con lo siguiente:</p>
          <ul className="space-y-2">
            {[
              'Estar sin uso y en las mismas condiciones en que fue recibido',
              'Estar en su empaque original, sin daños ni alteraciones',
              'Incluir todos los accesorios y documentos originales',
              'Presentar comprobante de compra (número de orden)',
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
          <h2 className="text-lg font-semibold text-gray-900 mb-3">🔄 Proceso de devolución</h2>
          <ol className="list-decimal list-inside space-y-2">
            <li>Contáctanos a <a href="mailto:support@march7.net" className="text-accent hover:underline">support@march7.net</a> con tu número de orden y el motivo de la devolución.</li>
            <li>Nuestro equipo te responderá dentro de 24–48 horas con las instrucciones de envío.</li>
            <li>Envía el producto usando un servicio de paquetería rastreable.</li>
            <li>Una vez recibido e inspeccionado, procesaremos tu reembolso en <strong>5–10 días hábiles</strong>.</li>
          </ol>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">💸 Reembolsos</h2>
          <p>
            El reembolso se procesa al método de pago original. El tiempo que tarde en reflejarse depende de tu banco o procesador de pagos (generalmente 5–10 días hábiles).
            Los costos de envío de la devolución son responsabilidad del comprador, <strong>salvo que el producto haya llegado defectuoso o incorrecto</strong>.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">🚫 No aplican devoluciones</h2>
          <ul className="space-y-2">
            {[
              'Productos dañados por mal uso, accidentes o modificaciones',
              'Artículos marcados como "venta final" al momento de la compra',
              'Devoluciones solicitadas después del período de 14 días',
              'Productos sin empaque original o con accesorios faltantes',
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
          <h2 className="text-lg font-semibold text-gray-900 mb-3">⚡ Producto defectuoso o incorrecto</h2>
          <p>
            Si recibiste un producto defectuoso o diferente al que pediste, contáctanos dentro de los <strong>3 días</strong> de recibir tu pedido con fotos del problema.
            En estos casos cubrimos el costo de devolución y te enviamos un reemplazo o reembolso completo sin costo adicional.
          </p>
        </section>

        <div className="bg-gray-50 rounded-2xl p-5 text-center">
          <p className="text-sm text-gray-600 mb-3">¿Necesitas iniciar una devolución?</p>
          <Link
            href="/legal/contact"
            className="inline-block bg-accent hover:bg-accent-hover text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors"
          >
            Contactar soporte →
          </Link>
        </div>
      </div>
    </div>
  );
}
