'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import productsData from '@/data/products.json';
import type { Product } from '@/types';

const catalog = productsData as unknown as Product[];

// ── Types ─────────────────────────────────────────────────────────
interface OrderItem {
  product_id?: string | null;
  name: string;
  quantity: number;
  unit_price?: number;
  total: number;
}

interface ShippingAddress {
  line1?: string;
  line2?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
}

interface Order {
  id: string;
  stripe_session_id: string;
  email: string;
  total_amount: number;
  status: string;
  items: OrderItem[];
  shipping_address: ShippingAddress | null;
  tracking_number: string | null;
  tracking_url: string | null;
  estimated_delivery: string | null;
  created_at: string;
}

interface DBProduct {
  id: string;
  name: string;
  price: number;
  old_price: number | null;
  short_desc: string;
  description: string;
  category: string;
  tags: string[];
  badge: string | null;
  image: string | null;
  features: string[];
  specs: [string, string][];
  pros: string[];
  cons: string[];
  supplier_url: string | null;
  supplier_price: number | null;
  images: string[];
  free_shipping: boolean;
  active: boolean;
  sort_order: number;
}

const STATUSES = ['paid', 'processing', 'shipped', 'delivered', 'refunded', 'cancelled'];
const BADGES = ['', 'Best Seller', 'Sale', 'New'];
const CATEGORIES = ['Audio', 'Peripherals', 'Accessories', 'Gaming', 'Networking', 'Storage', 'Other'];

const STATUS_STYLES: Record<string, string> = {
  paid:       'bg-blue-50 text-blue-700',
  processing: 'bg-yellow-50 text-yellow-700',
  shipped:    'bg-purple-50 text-purple-700',
  delivered:  'bg-green-50 text-green-700',
  refunded:   'bg-gray-100 text-gray-600',
  cancelled:  'bg-red-50 text-red-600',
};

// ── Shared input style ─────────────────────────────────────────────
const inp = 'w-full text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent';

// ── Shipping address ───────────────────────────────────────────────
function ShippingAddr({ address }: { address: ShippingAddress | null }) {
  const [copied, setCopied] = useState(false);
  if (!address) return <p className="text-xs text-gray-400 italic">No shipping address captured</p>;
  const lines = [
    address.line1, address.line2,
    [address.city, address.state, address.postal_code].filter(Boolean).join(', '),
    address.country,
  ].filter(Boolean);
  const full = lines.join('\n');
  return (
    <div className="bg-white border border-orange-100 rounded-xl p-3 flex items-start justify-between gap-3">
      <p className="text-xs text-gray-700 leading-relaxed whitespace-pre-line">{full}</p>
      <button
        onClick={() => { navigator.clipboard.writeText(full); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
        className="flex-shrink-0 text-xs font-medium text-orange-500 hover:text-orange-700"
      >
        {copied ? '✓ Copied' : 'Copy'}
      </button>
    </div>
  );
}

// ── Fulfill panel ──────────────────────────────────────────────────
function FulfillPanel({ order }: { order: Order }) {
  const enriched = order.items.map(item => {
    const product = item.product_id ? catalog.find(p => p.id === item.product_id) : null;
    const qty = item.quantity ?? 1;
    const sellTotal = item.total;
    const costEach = product?.supplierPrice ?? null;
    const costTotal = costEach != null ? costEach * qty : null;
    const profit = costTotal != null ? sellTotal - costTotal : null;
    return { ...item, product, qty, sellTotal, costTotal, profit };
  });
  const totalRevenue = enriched.reduce((s, i) => s + i.sellTotal, 0);
  const allHaveCost = enriched.every(i => i.costTotal != null);
  const totalCost = allHaveCost ? enriched.reduce((s, i) => s + i.costTotal!, 0) : null;
  const totalProfit = totalCost != null ? totalRevenue - totalCost : null;

  return (
    <div className="mt-3 rounded-xl border border-orange-200 bg-orange-50/40 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-xs font-bold uppercase tracking-wide text-orange-600">Fulfill Order</span>
        <span className="text-xs text-orange-400">— compra en AliExpress y envía a la dirección de abajo</span>
      </div>
      <ShippingAddr address={order.shipping_address} />
      <div className="space-y-2">
        {enriched.map((item, i) => (
          <div key={i} className="flex items-center gap-3 bg-white rounded-xl border border-orange-100 p-3">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
              <p className="text-xs text-gray-500">
                Qty: {item.qty} · Sell: <strong>${item.sellTotal.toFixed(2)}</strong>
                {item.costTotal != null && <> · Cost: ${item.costTotal.toFixed(2)}</>}
              </p>
            </div>
            {item.profit != null && (
              <span className={`text-xs font-bold px-2 py-1 rounded-lg ${item.profit >= 0 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'}`}>
                {item.profit >= 0 ? '+' : ''}${item.profit.toFixed(2)}
              </span>
            )}
            {item.product?.supplierUrl ? (
              <a href={item.product.supplierUrl} target="_blank" rel="noopener noreferrer"
                className="flex-shrink-0 text-xs bg-orange-500 hover:bg-orange-600 text-white font-semibold px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap">
                AliExpress →
              </a>
            ) : (
              <span className="flex-shrink-0 text-xs bg-gray-100 text-gray-400 px-3 py-1.5 rounded-lg whitespace-nowrap">
                No link
              </span>
            )}
          </div>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-4 pt-1 border-t border-orange-100 text-xs">
        <span className="text-gray-600">Revenue: <strong className="text-gray-900">${totalRevenue.toFixed(2)}</strong></span>
        {totalCost != null && <span className="text-gray-600">Cost: <strong className="text-gray-900">${totalCost.toFixed(2)}</strong></span>}
        {totalProfit != null && (
          <span className={`font-bold ${totalProfit >= 0 ? 'text-green-600' : 'text-red-500'}`}>
            Profit: {totalProfit >= 0 ? '+' : ''}${totalProfit.toFixed(2)}
          </span>
        )}
        {!allHaveCost && <span className="text-gray-400 italic">Agrega supplier_price en el producto para ver margen</span>}
      </div>
    </div>
  );
}

// ── Tracking form ──────────────────────────────────────────────────
function TrackingForm({ order, onSave }: {
  order: Order;
  onSave: (u: Partial<Order> & { id: string }) => void;
}) {
  const [tracking, setTracking] = useState(order.tracking_number || '');
  const [url, setUrl] = useState(order.tracking_url || '');
  const [delivery, setDelivery] = useState(order.estimated_delivery || '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const save = async () => {
    setSaving(true);
    await fetch('/api/admin/orders', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId: order.id, tracking_number: tracking || null, tracking_url: url || null, estimated_delivery: delivery || null }),
    });
    onSave({ id: order.id, tracking_number: tracking, tracking_url: url, estimated_delivery: delivery });
    setSaving(false); setSaved(true); setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="mt-3 pt-3 border-t border-gray-50 grid grid-cols-1 sm:grid-cols-3 gap-2">
      <input type="text" value={tracking} onChange={e => setTracking(e.target.value)} placeholder="Tracking number" className="text-xs border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-accent" />
      <input type="text" value={url} onChange={e => setUrl(e.target.value)} placeholder="Tracking URL (optional)" className="text-xs border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-accent" />
      <div className="flex gap-2">
        <input type="date" value={delivery} onChange={e => setDelivery(e.target.value)} className="flex-1 text-xs border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-accent" />
        <button onClick={save} disabled={saving} className="text-xs bg-accent hover:bg-accent-hover disabled:opacity-60 text-white font-semibold px-3 py-1.5 rounded-lg transition-colors">
          {saved ? '✓' : saving ? '...' : 'Save'}
        </button>
      </div>
    </div>
  );
}

// ── Product form (add / edit) ──────────────────────────────────────
const EMPTY: Partial<DBProduct> = {
  name: '', price: 0, old_price: null, short_desc: '', description: '',
  category: '', tags: [], badge: null, image: null,
  features: [], specs: [], pros: [], cons: [],
  supplier_url: null, supplier_price: null,
  images: [], free_shipping: false, active: true, sort_order: 0,
};

function ProductForm({ initial, onSave, onCancel }: {
  initial?: DBProduct;
  onSave: (p: DBProduct) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<Partial<DBProduct>>(initial ?? EMPTY);
  // Raw strings for textarea fields — avoids Enter key being swallowed
  const [rawFeatures, setRawFeatures] = useState((initial?.features || []).join('\n'));
  const [rawTags, setRawTags]         = useState((initial?.tags || []).join('\n'));
  const [rawPros, setRawPros]         = useState((initial?.pros || []).join('\n'));
  const [rawCons, setRawCons]         = useState((initial?.cons || []).join('\n'));
  const [rawImages, setRawImages]     = useState((initial?.images || []).join('\n'));
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  const set = (key: keyof DBProduct, val: unknown) => setForm(f => ({ ...f, [key]: val }));
  const toArr = (raw: string) => raw.split('\n').map(s => s.trim()).filter(Boolean);

  const submit = async () => {
    if (!form.name?.trim()) { setErr('Name is required'); return; }
    if (!form.price) { setErr('Price is required'); return; }
    setSaving(true); setErr('');
    const method = initial ? 'PATCH' : 'POST';
    const body = {
      ...form,
      id: initial?.id,
      features: toArr(rawFeatures),
      tags:     toArr(rawTags),
      pros:     toArr(rawPros),
      cons:     toArr(rawCons),
      images:   toArr(rawImages),
    };
    const res = await fetch('/api/admin/products', {
      method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) { setErr(data.error || 'Error saving'); setSaving(false); return; }
    onSave(initial ? { ...initial, ...body } as DBProduct : data.product);
    setSaving(false);
  };

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-6 space-y-5">
      <h3 className="font-bold text-gray-900">{initial ? 'Edit Product' : 'Add New Product'}</h3>
      {err && <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">{err}</p>}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <label className="text-xs font-semibold text-gray-500 mb-1 block">Product Name *</label>
          <input className={inp} value={form.name || ''} onChange={e => set('name', e.target.value)} placeholder="e.g. Wireless Earbuds Pro X1" />
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-500 mb-1 block">Sale Price (USD) *</label>
          <input className={inp} type="number" step="0.01" value={form.price || ''} onChange={e => set('price', e.target.value)} placeholder="34.99" />
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-500 mb-1 block">Original Price (strikethrough)</label>
          <input className={inp} type="number" step="0.01" value={form.old_price || ''} onChange={e => set('old_price', e.target.value || null)} placeholder="59.99 (optional)" />
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-500 mb-1 block">AliExpress URL</label>
          <input className={inp} value={form.supplier_url || ''} onChange={e => set('supplier_url', e.target.value || null)} placeholder="https://aliexpress.com/item/..." />
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-500 mb-1 block">Your Cost (AliExpress price)</label>
          <input className={inp} type="number" step="0.01" value={form.supplier_price || ''} onChange={e => set('supplier_price', e.target.value || null)} placeholder="8.50" />
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-500 mb-1 block">Category</label>
          <select className={inp} value={form.category || ''} onChange={e => set('category', e.target.value)}>
            <option value="">Select category</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-500 mb-1 block">Badge</label>
          <select className={inp} value={form.badge || ''} onChange={e => set('badge', e.target.value || null)}>
            {BADGES.map(b => <option key={b} value={b}>{b || '— None —'}</option>)}
          </select>
        </div>

        <div className="sm:col-span-2">
          <label className="text-xs font-semibold text-gray-500 mb-1 block">Main Image URL (thumbnail)</label>
          <input className={inp} value={form.image || ''} onChange={e => set('image', e.target.value || null)} placeholder="https://..." />
        </div>

        <div className="sm:col-span-2">
          <label className="text-xs font-semibold text-gray-500 mb-1 block">Gallery Images (one URL per line)</label>
          <textarea className={`${inp} min-h-[60px] resize-y`}
            value={rawImages}
            onChange={e => setRawImages(e.target.value)}
            placeholder={"https://cdn.example.com/img1.jpg\nhttps://cdn.example.com/img2.jpg"} />
          <p className="text-xs text-gray-400 mt-1">These replace the main image in the product gallery. Add all angles here.</p>
        </div>

        <div className="sm:col-span-2">
          <label className="text-xs font-semibold text-gray-500 mb-1 block">Short Description (1 line)</label>
          <input className={inp} value={form.short_desc || ''} onChange={e => set('short_desc', e.target.value)} placeholder="True wireless earbuds with ANC, 30h battery..." />
        </div>

        <div className="sm:col-span-2">
          <label className="text-xs font-semibold text-gray-500 mb-1 block">Full Description</label>
          <textarea className={`${inp} min-h-[80px] resize-y`} value={form.description || ''} onChange={e => set('description', e.target.value)} placeholder="Full product description..." />
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-500 mb-1 block">Features (one per line)</label>
          <textarea className={`${inp} min-h-[80px] resize-y`}
            value={rawFeatures}
            onChange={e => setRawFeatures(e.target.value)}
            placeholder={"ANC up to 25dB\n30h battery\nIPX5 waterproof"} />
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-500 mb-1 block">Tags (one per line)</label>
          <textarea className={`${inp} min-h-[80px] resize-y`}
            value={rawTags}
            onChange={e => setRawTags(e.target.value)}
            placeholder={"wireless\nearbuds\nbluetooth"} />
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-500 mb-1 block">Pros (one per line)</label>
          <textarea className={`${inp} min-h-[60px] resize-y`}
            value={rawPros}
            onChange={e => setRawPros(e.target.value)}
            placeholder={"Great ANC\nLong battery"} />
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-500 mb-1 block">Cons (one per line)</label>
          <textarea className={`${inp} min-h-[60px] resize-y`}
            value={rawCons}
            onChange={e => setRawCons(e.target.value)}
            placeholder={"No wireless charging\nPlastic build"} />
        </div>

        <div className="flex items-center gap-3">
          <label className="text-xs font-semibold text-gray-500">Visible in store</label>
          <button
            type="button"
            onClick={() => set('active', !form.active)}
            className={`relative w-10 h-5 rounded-full transition-colors ${form.active ? 'bg-green-500' : 'bg-gray-300'}`}
          >
            <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.active ? 'translate-x-5' : ''}`} />
          </button>
        </div>

        <div className="flex items-center gap-3">
          <label className="text-xs font-semibold text-gray-500">Free Shipping</label>
          <button
            type="button"
            onClick={() => set('free_shipping', !form.free_shipping)}
            className={`relative w-10 h-5 rounded-full transition-colors ${form.free_shipping ? 'bg-green-500' : 'bg-gray-300'}`}
          >
            <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.free_shipping ? 'translate-x-5' : ''}`} />
          </button>
        </div>

        {form.supplier_price && form.price ? (
          <div className="flex items-center gap-2 text-xs">
            <span className="text-gray-500">Margin:</span>
            <span className="font-bold text-green-600">
              ${(Number(form.price) - Number(form.supplier_price)).toFixed(2)}
              {' '}({Math.round((1 - Number(form.supplier_price) / Number(form.price)) * 100)}%)
            </span>
          </div>
        ) : null}
      </div>

      <div className="flex gap-3 pt-2">
        <button onClick={submit} disabled={saving}
          className="bg-accent hover:bg-accent-hover disabled:opacity-60 text-white text-sm font-semibold px-5 py-2 rounded-xl transition-colors">
          {saving ? 'Saving...' : initial ? 'Save Changes' : 'Add Product'}
        </button>
        <button onClick={onCancel} className="text-sm text-gray-500 hover:text-gray-900 px-4 py-2 rounded-xl border border-gray-200 transition-colors">
          Cancel
        </button>
      </div>
    </div>
  );
}

// ── Products tab ───────────────────────────────────────────────────
function ProductsTab() {
  const [products, setProducts] = useState<DBProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<DBProduct | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/admin/products')
      .then(r => r.json())
      .then(d => { setProducts(d.products ?? []); setLoading(false); });
  }, []);

  const handleSave = useCallback((p: DBProduct) => {
    setProducts(prev => {
      const exists = prev.find(x => x.id === p.id);
      return exists ? prev.map(x => x.id === p.id ? p : x) : [p, ...prev];
    });
    setShowForm(false); setEditing(null);
  }, []);

  const handleDelete = useCallback(async (id: string) => {
    if (!confirm('Delete this product? This cannot be undone.')) return;
    setDeleting(id);
    await fetch('/api/admin/products', {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }),
    });
    setProducts(prev => prev.filter(p => p.id !== id));
    setDeleting(null);
  }, []);

  const toggleActive = useCallback(async (p: DBProduct) => {
    const newActive = !p.active;
    const res = await fetch('/api/admin/products', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: p.id, active: newActive }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      alert('Failed to update: ' + (err.error ?? res.status));
      return;
    }
    setProducts(prev => prev.map(x => x.id === p.id ? { ...x, active: newActive } : x));
  }, []);

  if (loading) return <div className="text-center py-12 text-gray-400 text-sm">Loading products...</div>;

  if (showForm || editing) {
    return (
      <ProductForm
        initial={editing ?? undefined}
        onSave={handleSave}
        onCancel={() => { setShowForm(false); setEditing(null); }}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{products.length} products in Supabase</p>
        <button
          onClick={() => setShowForm(true)}
          className="bg-accent hover:bg-accent-hover text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
        >
          + Add Product
        </button>
      </div>

      {products.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-gray-200 rounded-2xl">
          <p className="text-gray-500 mb-2">No products yet</p>
          <p className="text-sm text-gray-400">Click "Add Product" to add your first AliExpress product</p>
        </div>
      ) : (
        <div className="border border-gray-100 rounded-2xl divide-y divide-gray-50">
          {products.map(p => {
            const margin = p.supplier_price && p.price
              ? ((p.price - p.supplier_price) / p.price * 100).toFixed(0)
              : null;
            return (
              <div key={p.id} className="flex items-center gap-4 px-5 py-4">
                {p.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.image} alt={p.name} className="w-12 h-12 object-cover rounded-xl flex-shrink-0 bg-gray-50" />
                ) : (
                  <div className="w-12 h-12 bg-gray-100 rounded-xl flex-shrink-0 flex items-center justify-center text-gray-300 text-xl">📦</div>
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-gray-900 truncate">{p.name}</p>
                    {p.badge && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">{p.badge}</span>
                    )}
                    {p.free_shipping && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">Free Ship</span>
                    )}
                    {!p.active && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">Hidden</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-500">
                    <span className="font-semibold text-gray-900">${p.price.toFixed(2)}</span>
                    {p.supplier_price && <span>Cost: ${p.supplier_price.toFixed(2)}</span>}
                    {margin && <span className="text-green-600 font-semibold">{margin}% margin</span>}
                    <span>{p.category}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  {p.supplier_url && (
                    <a href={p.supplier_url} target="_blank" rel="noopener noreferrer"
                      className="text-xs text-orange-500 hover:text-orange-700 font-medium">
                      AliExpress ↗
                    </a>
                  )}
                  <button onClick={() => toggleActive(p)}
                    className={`text-xs px-2.5 py-1 rounded-lg border font-medium transition-colors ${p.active ? 'border-green-200 text-green-600 hover:bg-red-50 hover:text-red-500 hover:border-red-200' : 'border-gray-200 text-gray-400 hover:bg-green-50 hover:text-green-600 hover:border-green-200'}`}>
                    {p.active ? 'Hide' : 'Show'}
                  </button>
                  <button onClick={() => setEditing(p)}
                    className="text-xs px-2.5 py-1 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors">
                    Edit
                  </button>
                  <button onClick={() => handleDelete(p.id)} disabled={deleting === p.id}
                    className="text-xs px-2.5 py-1 rounded-lg border border-red-100 text-red-400 hover:bg-red-50 transition-colors disabled:opacity-40">
                    {deleting === p.id ? '...' : 'Delete'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <p className="text-xs text-gray-400 text-center">
        Los productos de Supabase reemplazan data/products.json cuando agregues la integración.
        Por ahora el JSON sigue siendo la fuente para la tienda.
      </p>
    </div>
  );
}

// ── Main admin page ────────────────────────────────────────────────
export default function AdminPage() {
  const { user, loading: authLoading, isAdmin } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<'orders' | 'products'>('orders');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [filter, setFilter] = useState('all');
  const [expandedFulfill, setExpandedFulfill] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!authLoading && (!user || !isAdmin)) router.replace('/');
  }, [user, authLoading, isAdmin, router]);

  useEffect(() => {
    if (!isAdmin) return;
    fetch('/api/admin/orders')
      .then(r => r.json())
      .then(d => { setOrders(d.orders ?? []); setLoading(false); });
  }, [isAdmin]);

  const updateStatus = useCallback(async (orderId: string, status: string) => {
    setUpdatingId(orderId);
    await fetch('/api/admin/orders', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId, status }),
    });
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
    setUpdatingId(null);
  }, []);

  const toggleFulfill = useCallback((id: string) => {
    setExpandedFulfill(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  if (authLoading || loading) {
    return <div className="max-w-6xl mx-auto px-6 py-20 text-center text-gray-400">Loading...</div>;
  }

  const filtered = filter === 'all' ? orders : orders.filter(o => o.status === filter);
  const revenue = orders.filter(o => !['refunded', 'cancelled'].includes(o.status)).reduce((s, o) => s + o.total_amount, 0);
  const toFulfill = orders.filter(o => ['paid', 'processing'].includes(o.status)).length;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
          <p className="text-sm text-gray-500 mt-1">Gestiona pedidos y productos de tu tienda</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Orders', value: orders.length },
          { label: 'Revenue', value: `$${(revenue / 100).toFixed(2)}` },
          { label: 'To Fulfill', value: toFulfill, highlight: toFulfill > 0 },
          { label: 'Shipped', value: orders.filter(o => o.status === 'shipped').length },
        ].map(stat => (
          <div key={stat.label} className={`border rounded-2xl p-5 ${(stat as { highlight?: boolean }).highlight ? 'bg-orange-50 border-orange-200' : 'bg-white border-gray-100'}`}>
            <p className="text-xs text-gray-500 mb-1">{stat.label}</p>
            <p className={`text-2xl font-bold ${(stat as { highlight?: boolean }).highlight ? 'text-orange-600' : 'text-gray-900'}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-gray-100">
        {(['orders', 'products'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-semibold capitalize transition-colors border-b-2 -mb-px ${tab === t ? 'border-accent text-accent' : 'border-transparent text-gray-500 hover:text-gray-900'}`}>
            {t === 'orders' ? `Orders (${orders.length})` : 'Products'}
          </button>
        ))}
      </div>

      {/* Orders tab */}
      {tab === 'orders' && (
        <>
          <div className="flex gap-2 mb-6 flex-wrap">
            {['all', ...STATUSES].map(s => (
              <button key={s} onClick={() => setFilter(s)}
                className={`text-xs font-semibold px-3 py-1.5 rounded-full capitalize transition-colors ${filter === s ? 'bg-accent text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                {s}
              </button>
            ))}
          </div>

          <div className="border border-gray-100 rounded-2xl overflow-hidden">
            {filtered.length === 0 ? (
              <div className="py-12 text-center text-gray-400 text-sm">No orders found.</div>
            ) : (
              <div className="divide-y divide-gray-50">
                {filtered.map(order => {
                  const needsFulfill = ['paid', 'processing'].includes(order.status);
                  const fulfillOpen = expandedFulfill.has(order.id);
                  return (
                    <div key={order.id} className="px-5 py-4">
                      <div className="flex items-start justify-between gap-4 flex-wrap">
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono text-xs text-gray-500">#{order.stripe_session_id.slice(-10).toUpperCase()}</span>
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${STATUS_STYLES[order.status]}`}>{order.status}</span>
                            {needsFulfill && <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-orange-100 text-orange-600">Needs fulfillment</span>}
                          </div>
                          <p className="text-sm font-medium text-gray-700 truncate">{order.email}</p>
                          <p className="text-xs text-gray-400">{order.items.map(i => `${i.quantity}× ${i.name}`).join(', ')}</p>
                          <p className="text-xs text-gray-400">
                            {new Date(order.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0">
                          <span className="font-bold text-gray-900">${(order.total_amount / 100).toFixed(2)}</span>
                          {needsFulfill && (
                            <button onClick={() => toggleFulfill(order.id)}
                              className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors ${fulfillOpen ? 'bg-orange-500 text-white border-orange-500' : 'bg-white text-orange-600 border-orange-300 hover:bg-orange-50'}`}>
                              {fulfillOpen ? 'Hide' : 'Fulfill'}
                            </button>
                          )}
                          <select value={order.status} disabled={updatingId === order.id}
                            onChange={e => updateStatus(order.id, e.target.value)}
                            className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-accent bg-white">
                            {STATUSES.map(s => <option key={s} value={s} className="capitalize">{s}</option>)}
                          </select>
                        </div>
                      </div>
                      {needsFulfill && fulfillOpen && <FulfillPanel order={order} />}
                      {['shipped', 'delivered'].includes(order.status) && (
                        <TrackingForm order={order} onSave={u => setOrders(prev => prev.map(o => o.id === u.id ? { ...o, ...u } : o))} />
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}

      {/* Products tab */}
      {tab === 'products' && <ProductsTab />}
    </div>
  );
}
