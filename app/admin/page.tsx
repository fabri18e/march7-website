'use client';

import { useEffect, useState, useCallback } from 'react';
import { PageLoader } from '@/components/Spinner';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import type { Product } from '@/types';

// ── Types ─────────────────────────────────────────────────────────
interface OrderItem {
  product_id?: string | null;
  name: string;
  quantity: number;
  unit_price?: number;
  total: number;
}

interface ShippingAddress {
  name?: string;
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
  reviews: { id: string; name: string; rating: number; date: string; text: string; source?: string; images?: string[]; verified?: boolean }[];
  supplier_url: string | null;
  supplier_price: number | null;
  images: string[];
  free_shipping: boolean;
  default_color_label: string | null;
  default_color_hex: string | null;
  variants: { color: string; hex?: string; price?: number; oldPrice?: number; images: string[] }[];
  is_bundle: boolean;
  bundle_items: string[];
  bundle_discount: number;
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
  const clipboardText = address.name ? `${address.name}\n${full}` : full;
  return (
    <div className="bg-white border border-orange-100 rounded-xl p-3 flex items-start justify-between gap-3">
      <div>
        {address.name && <p className="text-xs font-semibold text-gray-900 mb-0.5">{address.name}</p>}
        <p className="text-xs text-gray-700 leading-relaxed whitespace-pre-line">{full}</p>
      </div>
      <button
        onClick={() => { navigator.clipboard.writeText(clipboardText); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
        className="flex-shrink-0 text-xs font-medium text-orange-500 hover:text-orange-700"
      >
        {copied ? '✓ Copied' : 'Copy'}
      </button>
    </div>
  );
}

// ── Fulfill panel ──────────────────────────────────────────────────
function FulfillPanel({ order, products }: { order: Order; products: DBProduct[] }) {
  const enriched = order.items.map(item => {
    const product = item.product_id ? products.find(p => p.id === item.product_id) : null;
    const qty = item.quantity ?? 1;
    const sellTotal = item.total;
    const costEach = product?.supplier_price ?? null;
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
            {item.product?.supplier_url ? (
              <a href={item.product.supplier_url} target="_blank" rel="noopener noreferrer"
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
  features: [], specs: [], pros: [], cons: [], reviews: [],
  supplier_url: null, supplier_price: null,
  images: [], free_shipping: false, default_color_label: null, default_color_hex: null, variants: [], is_bundle: false, bundle_items: [], bundle_discount: 0, active: true, sort_order: 0,
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
  const [uploadingMain, setUploadingMain] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const [reviewRows, setReviewRows]   = useState<{ name: string; rating: string; date: string; text: string; source: string; images: string[]; uploading: boolean }[]>(
    (initial?.reviews || []).map(r => ({ name: r.name, rating: String(r.rating), date: r.date, text: r.text, source: r.source || '', images: (r as { images?: string[] }).images || [], uploading: false }))
  );
  const [specRows, setSpecRows]       = useState<[string, string][]>(initial?.specs || []);
  const [variantRows, setVariantRows] = useState<{ color: string; hex: string; price: string; oldPrice: string; images: string; uploading: boolean }[]>(
    (initial?.variants || []).map(v => ({
      color: v.color,
      hex: v.hex || '',
      price: v.price != null ? String(v.price) : '',
      oldPrice: v.oldPrice != null ? String(v.oldPrice) : '',
      images: (v.images || []).join('\n'),
      uploading: false,
    }))
  );
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
      specs:    specRows.filter(([k]) => k.trim()),
      reviews:  reviewRows.filter(r => r.name.trim() && r.text.trim()).map((r, i) => ({
        id: `r${i}`,
        name: r.name.trim(),
        rating: Math.min(5, Math.max(1, Number(r.rating) || 5)),
        date: r.date.trim() || new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        text: r.text.trim(),
        ...(r.source.trim() ? { source: r.source.trim() } : {}),
        ...(r.images.length ? { images: r.images } : {}),
      })),
      variants: variantRows
        .filter(v => v.color.trim())
        .map(v => ({
          color: v.color.trim(),
          hex: v.hex.trim() || undefined,
          price: v.price ? Number(v.price) : undefined,
          oldPrice: v.oldPrice ? Number(v.oldPrice) : undefined,
          images: toArr(v.images),
        })),
    };
    try {
      const res = await fetch('/api/admin/products', {
        method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) { setErr(data.error || 'Error saving'); setSaving(false); return; }
      onSave(initial ? { ...initial, ...body } as DBProduct : data.product);
      setSaving(false);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Network error — check your connection');
      setSaving(false);
    }
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
          <label className="text-xs font-semibold text-gray-500 mb-1 block">Main Image</label>
          <div className="flex gap-2 items-start">
            <input className={`${inp} flex-1`} value={form.image || ''} onChange={e => set('image', e.target.value || null)} placeholder="URL or upload →" />
            <label className={`flex-shrink-0 cursor-pointer text-xs font-semibold px-3 py-2 rounded-xl border-2 border-dashed transition-colors ${uploadingMain ? 'border-gray-200 text-gray-300' : 'border-accent text-accent hover:bg-accent/5'}`}>
              {uploadingMain ? 'Uploading...' : '↑ Upload'}
              <input type="file" accept="image/*" className="hidden" disabled={uploadingMain} onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                setUploadingMain(true);
                const fd = new FormData();
                fd.append('file', file);
                try {
                  const res = await fetch('/api/upload-product-image', { method: 'POST', body: fd });
                  const data = await res.json();
                  if (res.ok) set('image', data.url);
                  else alert(data.error || 'Upload failed');
                } catch { alert('Upload failed'); }
                setUploadingMain(false);
                e.target.value = '';
              }} />
            </label>
          </div>
          {form.image && <img src={form.image} alt="" className="mt-2 h-20 w-20 object-cover rounded-xl border border-gray-200" />}
        </div>

        <div className="sm:col-span-2">
          <label className="text-xs font-semibold text-gray-500 mb-1 block">Gallery Images</label>
          <div className="flex gap-2 items-start">
            <textarea className={`${inp} min-h-[60px] resize-y flex-1`}
              value={rawImages}
              onChange={e => setRawImages(e.target.value)}
              placeholder={"One URL per line"} />
            <label className={`flex-shrink-0 cursor-pointer text-xs font-semibold px-3 py-2 rounded-xl border-2 border-dashed transition-colors ${uploadingGallery ? 'border-gray-200 text-gray-300' : 'border-accent text-accent hover:bg-accent/5'}`}>
              {uploadingGallery ? 'Uploading...' : '↑ Add'}
              <input type="file" accept="image/*" multiple className="hidden" disabled={uploadingGallery} onChange={async (e) => {
                const files = Array.from(e.target.files || []);
                if (!files.length) return;
                setUploadingGallery(true);
                const urls: string[] = [];
                for (const file of files) {
                  const fd = new FormData();
                  fd.append('file', file);
                  try {
                    const res = await fetch('/api/upload-product-image', { method: 'POST', body: fd });
                    const data = await res.json();
                    if (res.ok) urls.push(data.url);
                  } catch { /* skip failed */ }
                }
                setRawImages(prev => [...prev.split('\n').filter(Boolean), ...urls].join('\n'));
                setUploadingGallery(false);
                e.target.value = '';
              }} />
            </label>
          </div>
          <p className="text-xs text-gray-400 mt-1">Upload multiple images or paste URLs. These show in the product gallery.</p>
        </div>

        <div className="sm:col-span-2">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-semibold text-gray-500">Color Variants (optional)</label>
            <button
              type="button"
              onClick={() => setVariantRows(r => [...r, { color: '', hex: '', price: '', oldPrice: '', images: '', uploading: false }])}
              className="text-xs text-accent hover:underline font-semibold"
            >
              + Add Color
            </button>
          </div>
          {/* Default (base) color row */}
          <div className="border border-gray-100 rounded-xl p-3 space-y-2 bg-gray-50 mb-3">
            <p className="text-xs font-semibold text-gray-500">Base product color <span className="font-normal text-gray-400">(the color when no variant is selected)</span></p>
            <div className="flex gap-2 items-center">
              <input
                className={`${inp} flex-1`}
                value={form.default_color_label || ''}
                onChange={e => set('default_color_label', e.target.value || null)}
                placeholder='e.g. Black, Silver, White…'
              />
              <div className="flex items-center gap-1.5">
                <input
                  type="color"
                  value={form.default_color_hex || '#cccccc'}
                  onChange={e => set('default_color_hex', e.target.value)}
                  className="w-8 h-8 rounded cursor-pointer border border-gray-200"
                  title="Pick color"
                />
              </div>
            </div>
            <p className="text-xs text-gray-400">Leave name blank if the product has no specific default color.</p>
          </div>
          {variantRows.length === 0 ? (
            <p className="text-xs text-gray-400 italic py-1">No variants yet. Use this if the same product comes in different colors.</p>
          ) : (
            <div className="space-y-3">
              {variantRows.map((v, i) => (
                <div key={i} className="border border-gray-100 rounded-xl p-3 space-y-2 bg-gray-50">
                  <div className="flex gap-2 items-center">
                    <input
                      className={`${inp} flex-1`}
                      value={v.color}
                      onChange={e => setVariantRows(r => r.map((row, ri) => ri === i ? { ...row, color: e.target.value } : row))}
                      placeholder="Color (e.g. Black, Red, White)"
                    />
                    <div className="flex items-center gap-1.5">
                      <input
                        type="color"
                        value={v.hex || '#cccccc'}
                        onChange={e => setVariantRows(r => r.map((row, ri) => ri === i ? { ...row, hex: e.target.value } : row))}
                        className="w-8 h-8 rounded cursor-pointer border border-gray-200"
                        title="Pick color"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => setVariantRows(r => r.filter((_, ri) => ri !== i))}
                      className="text-gray-300 hover:text-red-400 text-lg leading-none"
                    >×</button>
                  </div>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <label className="text-xs text-gray-400 mb-1 block">Price (leave blank = same as product)</label>
                      <input
                        className={`${inp} text-xs`}
                        type="number" step="0.01"
                        value={v.price}
                        onChange={e => setVariantRows(r => r.map((row, ri) => ri === i ? { ...row, price: e.target.value } : row))}
                        placeholder={String(form.price || '')}
                      />
                    </div>
                    <div className="flex-1">
                      <label className="text-xs text-gray-400 mb-1 block">Original price (strikethrough)</label>
                      <input
                        className={`${inp} text-xs`}
                        type="number" step="0.01"
                        value={v.oldPrice}
                        onChange={e => setVariantRows(r => r.map((row, ri) => ri === i ? { ...row, oldPrice: e.target.value } : row))}
                        placeholder="Optional"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">Images for this color</label>
                    <div className="flex gap-2 items-start">
                      <textarea
                        className={`${inp} min-h-[52px] resize-y text-xs flex-1`}
                        value={v.images}
                        onChange={e => setVariantRows(r => r.map((row, ri) => ri === i ? { ...row, images: e.target.value } : row))}
                        placeholder="One URL per line"
                      />
                      <label className={`flex-shrink-0 cursor-pointer text-xs font-semibold px-3 py-2 rounded-xl border-2 border-dashed transition-colors ${v.uploading ? 'border-gray-200 text-gray-300' : 'border-accent text-accent hover:bg-accent/5'}`}>
                        {v.uploading ? '...' : '↑ Add'}
                        <input type="file" accept="image/*" multiple className="hidden" disabled={v.uploading} onChange={async (e) => {
                          const files = Array.from(e.target.files || []);
                          if (!files.length) return;
                          setVariantRows(r => r.map((row, ri) => ri === i ? { ...row, uploading: true } : row));
                          const urls: string[] = [];
                          for (const file of files) {
                            const fd = new FormData();
                            fd.append('file', file);
                            try {
                              const res = await fetch('/api/upload-product-image', { method: 'POST', body: fd });
                              const data = await res.json();
                              if (res.ok) urls.push(data.url);
                            } catch { /* skip */ }
                          }
                          setVariantRows(r => r.map((row, ri) => ri === i ? {
                            ...row,
                            images: [...row.images.split('\n').filter(Boolean), ...urls].join('\n'),
                            uploading: false,
                          } : row));
                          e.target.value = '';
                        }} />
                      </label>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
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

        <div className="sm:col-span-2">
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-semibold text-gray-500">Specifications</label>
            <button
              type="button"
              onClick={() => setSpecRows(r => [...r, ['', '']])}
              className="text-xs text-accent hover:underline font-semibold"
            >
              + Add row
            </button>
          </div>
          {specRows.length === 0 ? (
            <p className="text-xs text-gray-400 italic py-2">No specs yet. Click &quot;+ Add row&quot; to start.</p>
          ) : (
            <div className="space-y-2">
              {specRows.map(([k, v], i) => (
                <div key={i} className="flex gap-2 items-center">
                  <input
                    className={`${inp} flex-1`}
                    value={k}
                    onChange={e => setSpecRows(r => r.map((row, ri) => ri === i ? [e.target.value, row[1]] : row))}
                    placeholder="e.g. Battery"
                  />
                  <input
                    className={`${inp} flex-1`}
                    value={v}
                    onChange={e => setSpecRows(r => r.map((row, ri) => ri === i ? [row[0], e.target.value] : row))}
                    placeholder="e.g. 2 x AAA"
                  />
                  <button
                    type="button"
                    onClick={() => setSpecRows(r => r.filter((_, ri) => ri !== i))}
                    className="text-gray-300 hover:text-red-400 text-lg leading-none flex-shrink-0"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
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

        {/* Reviews editor */}
        <div className="border border-gray-100 rounded-xl p-3 space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-gray-500">Reviews</label>
            <button type="button"
              onClick={() => setReviewRows(r => [...r, { name: '', rating: '5', date: '', text: '', source: '', images: [], uploading: false }])}
              className="text-xs text-accent hover:text-accent-hover font-semibold">
              + Add Review
            </button>
          </div>
          {reviewRows.length === 0 && (
            <p className="text-xs text-gray-400 italic">No reviews yet. Add some to build trust.</p>
          )}
          {reviewRows.map((r, i) => (
            <div key={i} className="border border-gray-100 rounded-lg p-3 space-y-2 bg-gray-50/50">
              <div className="grid grid-cols-2 gap-2">
                <input className={inp} placeholder="Name (e.g. Sarah M.)" value={r.name}
                  onChange={e => setReviewRows(rows => rows.map((x, j) => j === i ? { ...x, name: e.target.value } : x))} />
                <div className="flex gap-2">
                  <input className={`${inp} w-16`} placeholder="★ 1-5" type="number" min={1} max={5} value={r.rating}
                    onChange={e => setReviewRows(rows => rows.map((x, j) => j === i ? { ...x, rating: e.target.value } : x))} />
                  <input className={`${inp} flex-1`} placeholder="Date (e.g. Jan 3, 2025)" value={r.date}
                    onChange={e => setReviewRows(rows => rows.map((x, j) => j === i ? { ...x, date: e.target.value } : x))} />
                </div>
              </div>
              <textarea className={`${inp} min-h-[56px] resize-y`} placeholder="Review text..." value={r.text}
                onChange={e => setReviewRows(rows => rows.map((x, j) => j === i ? { ...x, text: e.target.value } : x))} />

              {/* Photo upload for this review */}
              <div className="flex flex-wrap gap-2 items-center">
                {r.images.map((url, pi) => (
                  <div key={pi} className="relative w-14 h-14 rounded-lg overflow-hidden border border-gray-200 flex-shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt="" className="w-full h-full object-cover" />
                    <button type="button"
                      onClick={() => setReviewRows(rows => rows.map((x, j) => j === i ? { ...x, images: x.images.filter((_, k) => k !== pi) } : x))}
                      className="absolute top-0.5 right-0.5 w-4 h-4 bg-black/60 rounded-full flex items-center justify-center text-white text-xs leading-none">×</button>
                  </div>
                ))}
                {r.images.length < 3 && (
                  <label className={`w-14 h-14 rounded-lg border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-colors flex-shrink-0 ${r.uploading ? 'border-gray-200 opacity-50' : 'border-gray-200 hover:border-accent'}`}>
                    {r.uploading ? (
                      <div className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeWidth="1.5" strokeLinecap="round" d="M12 4v16m8-8H4"/>
                        </svg>
                        <span className="text-xs text-gray-400">Photo</span>
                      </>
                    )}
                    <input type="file" accept="image/*" className="hidden" disabled={r.uploading}
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        setReviewRows(rows => rows.map((x, j) => j === i ? { ...x, uploading: true } : x));
                        const fd = new FormData();
                        fd.append('file', file);
                        try {
                          const res = await fetch('/api/upload-review-image', { method: 'POST', body: fd });
                          const data = await res.json();
                          if (res.ok) {
                            setReviewRows(rows => rows.map((x, j) => j === i ? { ...x, images: [...x.images, data.url], uploading: false } : x));
                          } else {
                            alert(data.error || 'Upload failed');
                            setReviewRows(rows => rows.map((x, j) => j === i ? { ...x, uploading: false } : x));
                          }
                        } catch {
                          alert('Upload failed');
                          setReviewRows(rows => rows.map((x, j) => j === i ? { ...x, uploading: false } : x));
                        }
                        e.target.value = '';
                      }} />
                  </label>
                )}
                <span className="text-xs text-gray-400">Photos (max 3)</span>
              </div>

              <div className="flex items-center gap-2">
                <input className={`${inp} flex-1`} placeholder="Source (e.g. Amazon, AliExpress) — optional" value={r.source}
                  onChange={e => setReviewRows(rows => rows.map((x, j) => j === i ? { ...x, source: e.target.value } : x))} />
                <button type="button" onClick={() => setReviewRows(rows => rows.filter((_, j) => j !== i))}
                  className="text-gray-300 hover:text-red-400 text-lg leading-none flex-shrink-0 px-1">×</button>
              </div>
            </div>
          ))}
          {reviewRows.some(r => r.source.trim()) && (
            <p className="text-xs text-amber-600 bg-amber-50 rounded-lg px-2 py-1.5">
              ⚠️ Reviews with source will show a disclaimer to customers.
            </p>
          )}
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

      {err && <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">{err}</p>}
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

// ── Bundle form ────────────────────────────────────────────────────
function BundleForm({ products, initial, onSave, onCancel }: {
  products: DBProduct[];
  initial?: DBProduct;
  onSave: (p: DBProduct) => void;
  onCancel: () => void;
}) {
  const [name, setName]           = useState(initial?.name ?? '');
  const [discount, setDiscount]   = useState(initial?.bundle_discount ? String(initial.bundle_discount) : '');
  const [shortDesc, setShortDesc] = useState(initial?.short_desc ?? '');
  const [image, setImage]         = useState(initial?.image ?? '');
  const [rawDesc, setRawDesc]     = useState(initial?.description ?? '');
  const [rawFeatures, setRawFeatures] = useState((initial?.features ?? []).join('\n'));
  const [rawTags, setRawTags]     = useState((initial?.tags ?? []).join('\n'));
  const [rawPros, setRawPros]     = useState((initial?.pros ?? []).join('\n'));
  const [rawCons, setRawCons]     = useState((initial?.cons ?? []).join('\n'));
  const [selected, setSelected]   = useState<Set<string>>(new Set(initial?.bundle_items ?? []));
  const [saving, setSaving]       = useState(false);
  const [err, setErr]             = useState('');

  const toArr = (raw: string) => raw.split('\n').map(s => s.trim()).filter(Boolean);

  // All non-bundle products + pre-selected ones that may not be in the list
  const allChoices = products;

  const toggle = (id: string) =>
    setSelected(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });

  const selectedProducts = allChoices.filter(p => selected.has(p.id));
  const originalTotal = selectedProducts.reduce((s, p) => s + Number(p.price), 0);
  const discountPct = Math.min(Math.max(Number(discount) || 0, 0), 99);
  const bundlePrice = originalTotal > 0 ? Math.round(originalTotal * (1 - discountPct / 100) * 100) / 100 : 0;

  const submit = async () => {
    if (!name.trim()) { setErr('Bundle name is required'); return; }
    if (selected.size < 2) { setErr('Select at least 2 products'); return; }
    if (!discountPct) { setErr('Discount % is required'); return; }
    setSaving(true); setErr('');
    const firstProduct = selectedProducts[0];
    try {
      const isEdit = Boolean(initial);
      const resolvedImage = image.trim() || firstProduct?.image || null;
      const body = isEdit
        ? {
            id: initial!.id,
            name,
            price: bundlePrice,
            old_price: originalTotal,
            short_desc: shortDesc || initial!.short_desc,
            description: rawDesc,
            features: toArr(rawFeatures),
            pros: toArr(rawPros),
            cons: toArr(rawCons),
            tags: toArr(rawTags).length ? toArr(rawTags) : ['bundle'],
            image: image.trim() || initial!.image || null,
            bundle_items: Array.from(selected),
            bundle_discount: discountPct,
          }
        : {
            name,
            price: bundlePrice,
            old_price: originalTotal,
            short_desc: shortDesc || `Bundle: ${selectedProducts.map(p => p.name.split(' ').slice(0,2).join(' ')).join(' + ')}`,
            description: rawDesc,
            category: 'Bundle',
            tags: toArr(rawTags).length ? toArr(rawTags) : ['bundle'],
            badge: null,
            image: resolvedImage,
            images: [],
            features: toArr(rawFeatures),
            specs: [],
            pros: toArr(rawPros),
            cons: toArr(rawCons),
            is_bundle: true,
            bundle_items: Array.from(selected),
            bundle_discount: discountPct,
            active: true,
            sort_order: 0,
          };
      const res = await fetch('/api/admin/products', {
        method: isEdit ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) { setErr(data.error || 'Error saving'); setSaving(false); return; }
      onSave(isEdit
        ? { ...initial!, ...body, price: bundlePrice, old_price: originalTotal, bundle_discount: discountPct }
        : data.product
      );
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Network error');
      setSaving(false);
    }
  };

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-6 space-y-5">
      <h3 className="font-bold text-gray-900">🎁 {initial ? 'Edit Bundle' : 'Create Bundle'}</h3>
      {err && <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">{err}</p>}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <label className="text-xs font-semibold text-gray-500 mb-1 block">Bundle Name *</label>
          <input className={inp} value={name} onChange={e => setName(e.target.value)} placeholder='e.g. "Gaming Setup Bundle"' />
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-500 mb-1 block">Discount % *</label>
          <div className="relative">
            <input className={inp} type="number" min="1" max="99" value={discount}
              onChange={e => setDiscount(e.target.value)} placeholder="15" />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none">%</span>
          </div>
          {originalTotal > 0 && discountPct > 0 && (
            <div className="mt-1.5 flex items-center gap-2">
              <span className="text-xs text-gray-400 line-through">${originalTotal.toFixed(2)}</span>
              <span className="text-sm font-bold text-gray-900">${bundlePrice.toFixed(2)}</span>
              <span className="text-xs text-green-600 font-semibold bg-green-50 px-1.5 py-0.5 rounded">
                Customer saves ${(originalTotal - bundlePrice).toFixed(2)}
              </span>
            </div>
          )}
          {originalTotal === 0 && (
            <p className="text-xs text-gray-400 mt-1">Select products first to see the calculated price</p>
          )}
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-500 mb-1 block">Short Description (optional)</label>
          <input className={inp} value={shortDesc} onChange={e => setShortDesc(e.target.value)} placeholder="The perfect gaming setup" />
        </div>
      </div>

      <div>
        <label className="text-xs font-semibold text-gray-500 mb-2 block">
          Products Included * <span className="text-gray-400 font-normal">({selected.size} selected)</span>
        </label>
        {allChoices.length === 0 ? (
          <p className="text-xs text-gray-400 italic">No products available. Add products first.</p>
        ) : (
          <div className="border border-gray-100 rounded-xl divide-y divide-gray-50 max-h-64 overflow-y-auto scrollbar-hide">
            {allChoices.map(p => (
              <label key={p.id} className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors">
                <input
                  type="checkbox"
                  checked={selected.has(p.id)}
                  onChange={() => toggle(p.id)}
                  className="w-4 h-4 accent-accent rounded"
                />
                {p.image && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.image} alt={p.name} className="w-9 h-9 rounded-lg object-cover flex-shrink-0 bg-gray-50" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{p.name}</p>
                  <p className="text-xs text-gray-400">${Number(p.price).toFixed(2)}</p>
                </div>
              </label>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-xs font-semibold text-gray-500 mb-1 block">Bundle Image URL</label>
          <div className="flex gap-2 items-start">
            <input
              className={`${inp} flex-1`}
              value={image}
              onChange={e => setImage(e.target.value)}
              placeholder="https://... (leave blank to use first product's image)"
            />
            {(image || (selectedProducts[0]?.image)) && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={image || selectedProducts[0]?.image || ''}
                alt="preview"
                className="w-12 h-12 rounded-xl object-cover border border-gray-200 flex-shrink-0"
              />
            )}
          </div>
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-500 mb-1 block">Full Description</label>
          <textarea
            className={`${inp} min-h-[80px] resize-y`}
            value={rawDesc}
            onChange={e => setRawDesc(e.target.value)}
            placeholder="Describe what's in the bundle and why it's a great deal..."
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-500 mb-1 block">Features (one per line)</label>
          <textarea
            className={`${inp} min-h-[64px] resize-y`}
            value={rawFeatures}
            onChange={e => setRawFeatures(e.target.value)}
            placeholder={"Complete gaming setup\nSave 15% vs buying separately\nFree shipping included"}
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-500 mb-1 block">Tags (one per line)</label>
          <textarea
            className={`${inp} min-h-[48px] resize-y`}
            value={rawTags}
            onChange={e => setRawTags(e.target.value)}
            placeholder={"bundle\ngaming\nsetup"}
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1 block">Pros (one per line)</label>
            <textarea
              className={`${inp} min-h-[64px] resize-y`}
              value={rawPros}
              onChange={e => setRawPros(e.target.value)}
              placeholder={"Great value\nComplete setup\nFree shipping"}
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1 block">Cons (one per line)</label>
            <textarea
              className={`${inp} min-h-[64px] resize-y`}
              value={rawCons}
              onChange={e => setRawCons(e.target.value)}
              placeholder={"Ships in multiple packages"}
            />
          </div>
        </div>
      </div>

      {err && <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">{err}</p>}
      <div className="flex gap-3 pt-2">
        <button onClick={submit} disabled={saving}
          className="bg-accent hover:bg-accent-hover disabled:opacity-60 text-white text-sm font-semibold px-5 py-2 rounded-xl transition-colors">
          {saving ? 'Saving...' : initial ? 'Save Changes' : 'Create Bundle'}
        </button>
        <button onClick={onCancel} className="text-sm text-gray-500 hover:text-gray-900 px-4 py-2 rounded-xl border border-gray-200 transition-colors">
          Cancel
        </button>
      </div>
    </div>
  );
}

// ── Reviews tab ───────────────────────────────────────────────────
interface StaticReviewRow {
  id: string;
  name: string;
  rating: number;
  date: string;
  text: string;
  source?: string;
  images?: string[];
  verified?: boolean;
  productId: string;
  productName: string;
}

function ReviewsTab({ products, onProductsChange }: { products: DBProduct[]; onProductsChange: (p: DBProduct[]) => void }) {
  const [editingDate, setEditingDate] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);

  // Flatten all static reviews from all products
  const allStaticReviews: StaticReviewRow[] = products.flatMap(p =>
    (p.reviews || []).map(r => ({
      ...r,
      productId: p.id,
      productName: p.name,
    }))
  );

  const patchProductReviews = async (productId: string, updatedReviews: DBProduct['reviews']) => {
    await fetch('/api/admin/products', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: productId, reviews: updatedReviews }),
    });
    onProductsChange(
      products.map(p => p.id === productId ? { ...p, reviews: updatedReviews } : p)
    );
  };

  const toggleVerified = async (review: StaticReviewRow) => {
    setSaving(review.id + review.productId);
    const product = products.find(p => p.id === review.productId)!;
    const updatedReviews = product.reviews.map(r =>
      r.id === review.id ? { ...r, verified: !r.verified } : r
    );
    await patchProductReviews(review.productId, updatedReviews);
    setSaving(null);
  };

  const saveDate = async (review: StaticReviewRow) => {
    const newDate = editingDate[review.id + review.productId] ?? '';
    setSaving(review.id + review.productId);
    const product = products.find(p => p.id === review.productId)!;
    const updatedReviews = product.reviews.map(r =>
      r.id === review.id ? { ...r, date: newDate.trim() || r.date } : r
    );
    await patchProductReviews(review.productId, updatedReviews);
    setEditingDate(prev => { const next = { ...prev }; delete next[review.id + review.productId]; return next; });
    setSaving(null);
  };

  const deleteReview = async (review: StaticReviewRow) => {
    if (!confirm(`Delete review by ${review.name}?`)) return;
    setSaving(review.id + review.productId);
    const product = products.find(p => p.id === review.productId)!;
    const updatedReviews = product.reviews.filter(r => r.id !== review.id);
    await patchProductReviews(review.productId, updatedReviews);
    setSaving(null);
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500">{allStaticReviews.length} review{allStaticReviews.length !== 1 ? 's' : ''} en productos</p>

      {allStaticReviews.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-gray-200 rounded-2xl">
          <p className="text-gray-500">No hay reviews. Agrégalas desde el editor de producto.</p>
        </div>
      ) : (
        <div className="border border-gray-100 rounded-2xl divide-y divide-gray-50">
          {allStaticReviews.map(review => {
            const key = review.id + review.productId;
            const isEditingDate = key in editingDate;
            return (
              <div key={key} className="px-4 sm:px-5 py-4 space-y-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-gray-900">{review.name}</span>
                    <span className="text-xs text-amber-500">{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</span>
                    {review.verified ? (
                      <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full font-medium">Verified Buyer</span>
                    ) : (
                      <span className="text-xs bg-gray-100 text-gray-400 px-2 py-0.5 rounded-full">Sin verificar</span>
                    )}
                    {review.source && (
                      <span className="text-xs bg-blue-50 text-blue-500 px-2 py-0.5 rounded-full">External</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">{review.productName}</p>
                  <p className="text-sm text-gray-600 mt-1.5 line-clamp-2">{review.text}</p>
                  {(review.images?.length ?? 0) > 0 && (
                    <div className="flex gap-1.5 mt-2">
                      {review.images!.map((url, i) => (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img key={i} src={url} alt="" className="w-10 h-10 rounded-lg object-cover border border-gray-100" />
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 flex-wrap pt-1">
                  {/* Verified toggle */}
                  <button
                    onClick={() => toggleVerified(review)}
                    disabled={saving === key}
                    className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors disabled:opacity-50 ${
                      review.verified
                        ? 'bg-green-50 text-green-700 border-green-200 hover:bg-red-50 hover:text-red-500 hover:border-red-200'
                        : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-green-50 hover:text-green-700 hover:border-green-200'
                    }`}
                  >
                    {review.verified ? '✓ Verified · Quitar' : 'Marcar Verified'}
                  </button>

                  {/* Date editor */}
                  {isEditingDate ? (
                    <div className="flex items-center gap-1.5">
                      <input
                        type="text"
                        value={editingDate[key]}
                        onChange={e => setEditingDate(prev => ({ ...prev, [key]: e.target.value }))}
                        placeholder="e.g. January 2025"
                        className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-accent w-36"
                      />
                      <button
                        onClick={() => saveDate(review)}
                        disabled={saving === key}
                        className="text-xs bg-accent hover:bg-accent-hover disabled:opacity-50 text-white font-semibold px-2.5 py-1.5 rounded-lg transition-colors"
                      >
                        {saving === key ? '...' : 'Save'}
                      </button>
                      <button
                        onClick={() => setEditingDate(prev => { const next = { ...prev }; delete next[key]; return next; })}
                        className="text-xs text-gray-400 hover:text-gray-600 px-1.5"
                      >×</button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setEditingDate(prev => ({ ...prev, [key]: review.date }))}
                      className="text-xs border border-gray-200 text-gray-500 hover:bg-gray-50 px-3 py-1.5 rounded-lg transition-colors"
                    >
                      📅 {review.date}
                    </button>
                  )}

                  {/* Delete */}
                  <button
                    onClick={() => deleteReview(review)}
                    disabled={saving === key}
                    className="ml-auto text-xs text-red-400 hover:text-red-600 hover:bg-red-50 border border-red-100 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-40"
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Products tab ───────────────────────────────────────────────────
function ProductsTab() {
  const [products, setProducts] = useState<DBProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showBundleForm, setShowBundleForm] = useState(false);
  const [editing, setEditing] = useState<DBProduct | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<string>('');
  const [syncIds, setSyncIds] = useState<string[]>([]);
  const [showSyncIds, setShowSyncIds] = useState(false);

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
    setShowForm(false); setEditing(null); setShowBundleForm(false);
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

  if (loading) return <PageLoader />;

  if (editing?.is_bundle) {
    return (
      <BundleForm
        products={products.filter(p => !p.is_bundle)}
        initial={editing}
        onSave={handleSave}
        onCancel={() => setEditing(null)}
      />
    );
  }

  if (showForm || editing) {
    return (
      <ProductForm
        initial={editing ?? undefined}
        onSave={handleSave}
        onCancel={() => { setShowForm(false); setEditing(null); }}
      />
    );
  }

  if (showBundleForm) {
    return (
      <BundleForm
        products={products.filter(p => !p.is_bundle)}
        onSave={handleSave}
        onCancel={() => setShowBundleForm(false)}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="text-sm text-gray-500">{products.length} products in Supabase</p>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={async () => {
              setSyncing(true);
              setSyncResult('');
              try {
                const res = await fetch('/api/admin/sync-merchant', {
                  method: 'POST',
                  headers: { 'x-admin-secret': process.env.NEXT_PUBLIC_ADMIN_SECRET || '' },
                });
                const data = await res.json();
                if (data.error) setSyncResult(`Error: ${data.error}`);
                else {
                  const failMsg = data.details?.length ? ` — Error: ${data.details[0]?.status}` : '';
                  setSyncResult(`✓ Synced ${data.synced} to Google Merchant${data.failed ? ` (${data.failed} failed${failMsg})` : ''}`);
                  setSyncIds(data.sent || []);
                  setShowSyncIds(false);
                }
              } catch (e) {
                setSyncResult(`Error: ${e}`);
              } finally {
                setSyncing(false);
              }
            }}
            disabled={syncing}
            className="border border-gray-300 text-gray-600 hover:bg-gray-50 text-xs sm:text-sm font-semibold px-3 sm:px-4 py-2 rounded-xl transition-colors whitespace-nowrap disabled:opacity-50"
          >
            {syncing ? 'Syncing...' : '🛍 Sync Merchant'}
          </button>
          <button
            onClick={() => setShowBundleForm(true)}
            className="border border-accent text-accent hover:bg-accent-light text-xs sm:text-sm font-semibold px-3 sm:px-4 py-2 rounded-xl transition-colors whitespace-nowrap"
          >
            🎁 Add Bundle
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="bg-accent hover:bg-accent-hover text-white text-xs sm:text-sm font-semibold px-3 sm:px-4 py-2 rounded-xl transition-colors whitespace-nowrap"
          >
            + Add Product
          </button>
        </div>
      </div>
      {syncResult && (
        <div className={`text-xs px-3 py-2 rounded-lg ${syncResult.startsWith('Error') ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-700'}`}>
          <div className="flex items-center justify-between gap-2">
            <span>{syncResult}</span>
            {syncIds.length > 0 && (
              <button onClick={() => setShowSyncIds(v => !v)} className="underline opacity-70 hover:opacity-100 whitespace-nowrap">
                {showSyncIds ? 'Hide IDs' : 'Ver IDs enviados'}
              </button>
            )}
          </div>
          {showSyncIds && (
            <div className="mt-2 space-y-0.5 max-h-40 overflow-y-auto">
              <p className="font-semibold mb-1 opacity-80">Estos son los Item IDs enviados a Google Merchant — compáralos con los que tienes en Merchant Center → Productos:</p>
              {syncIds.map(id => (
                <p key={id} className="font-mono opacity-90">{id}</p>
              ))}
            </div>
          )}
        </div>
      )}

      {products.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-gray-200 rounded-2xl">
          <p className="text-gray-500 mb-2">No products yet</p>
          <p className="text-sm text-gray-400">Click "Add Product" to add your first AliExpress product</p>
        </div>
      ) : (
        <div className="border border-gray-100 rounded-2xl divide-y divide-gray-50">
          {products.map(p => {
            const margin = p.supplier_price && p.price
              ? ((Number(p.price) - Number(p.supplier_price)) / Number(p.price) * 100).toFixed(0)
              : null;
            return (
              <div key={p.id} className="px-4 sm:px-5 py-4 space-y-3">
                {/* Top row: image + info */}
                <div className="flex items-center gap-3">
                  {p.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.image} alt={p.name} className="w-11 h-11 object-cover rounded-xl flex-shrink-0 bg-gray-50" />
                  ) : (
                    <div className="w-11 h-11 bg-gray-100 rounded-xl flex-shrink-0 flex items-center justify-center text-gray-300 text-lg">📦</div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <p className="text-sm font-semibold text-gray-900 truncate">{p.name}</p>
                      {p.badge && <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">{p.badge}</span>}
                      {p.free_shipping && <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">Free Ship</span>}
                      {!p.active && <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">Hidden</span>}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-500 flex-wrap">
                      <span className="font-semibold text-gray-900">${Number(p.price).toFixed(2)}</span>
                      {p.supplier_price && <span>Cost: ${Number(p.supplier_price).toFixed(2)}</span>}
                      {margin && <span className="text-green-600 font-semibold">{margin}% margin</span>}
                      <span>{p.category}</span>
                    </div>
                  </div>
                </div>
                {/* Bottom row: action buttons */}
                <div className="flex items-center gap-2 flex-wrap">
                  {p.supplier_url && (
                    <a href={p.supplier_url} target="_blank" rel="noopener noreferrer"
                      className="text-xs bg-orange-50 text-orange-600 hover:bg-orange-100 font-semibold px-3 py-1.5 rounded-lg transition-colors">
                      AliExpress ↗
                    </a>
                  )}
                  <button onClick={() => toggleActive(p)}
                    className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-colors ${p.active ? 'border-green-200 text-green-600 hover:bg-red-50 hover:text-red-500 hover:border-red-200' : 'border-gray-200 text-gray-400 hover:bg-green-50 hover:text-green-600 hover:border-green-200'}`}>
                    {p.active ? 'Hide' : 'Show'}
                  </button>
                  <button onClick={() => setEditing(p)}
                    className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors">
                    Edit
                  </button>
                  <button onClick={() => handleDelete(p.id)} disabled={deleting === p.id}
                    className="text-xs px-3 py-1.5 rounded-lg border border-red-100 text-red-400 hover:bg-red-50 transition-colors disabled:opacity-40">
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
  const [tab, setTab] = useState<'orders' | 'products' | 'reviews'>('orders');
  const [orders, setOrders] = useState<Order[]>([]);
  const [adminProducts, setAdminProducts] = useState<DBProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [deletingOrderId, setDeletingOrderId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [filter, setFilter] = useState('all');
  const [expandedFulfill, setExpandedFulfill] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!authLoading && (!user || !isAdmin)) router.replace('/');
  }, [user, authLoading, isAdmin, router]);

  useEffect(() => {
    if (!isAdmin) return;
    Promise.all([
      fetch('/api/admin/orders').then(r => r.json()),
      fetch('/api/admin/products').then(r => r.json()),
    ]).then(([orderData, productData]) => {
      setOrders(orderData.orders ?? []);
      setAdminProducts(productData.products ?? []);
      setLoading(false);
    });
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

  const deleteOrder = useCallback(async (id: string) => {
    setDeletingOrderId(id);
    await fetch('/api/admin/orders', {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    setOrders(prev => prev.filter(o => o.id !== id));
    setDeletingOrderId(null);
    setConfirmDeleteId(null);
  }, []);

  if (authLoading || loading) {
    return <div className="max-w-6xl mx-auto px-6"><PageLoader /></div>;
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
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
        {[
          { label: 'Total Orders', value: orders.length },
          { label: 'Revenue', value: `$${(revenue / 100).toFixed(2)}` },
          { label: 'To Fulfill', value: toFulfill, highlight: toFulfill > 0 },
          { label: 'Shipped', value: orders.filter(o => o.status === 'shipped').length },
        ].map(stat => (
          <div key={stat.label} className={`border rounded-2xl p-4 sm:p-5 ${(stat as { highlight?: boolean }).highlight ? 'bg-orange-50 border-orange-200' : 'bg-white border-gray-100'}`}>
            <p className="text-xs text-gray-500 mb-1">{stat.label}</p>
            <p className={`text-xl sm:text-2xl font-bold ${(stat as { highlight?: boolean }).highlight ? 'text-orange-600' : 'text-gray-900'}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-gray-100">
        {(['orders', 'products', 'reviews'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-semibold capitalize transition-colors border-b-2 -mb-px ${tab === t ? 'border-accent text-accent' : 'border-transparent text-gray-500 hover:text-gray-900'}`}>
            {t === 'orders' ? `Orders (${orders.length})` : t === 'reviews' ? 'Reviews' : 'Products'}
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
            {/* Delete confirmation modal */}
            {confirmDeleteId && (
              <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                      </svg>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">Delete this order?</p>
                      <p className="text-sm text-gray-500 mt-0.5">This action cannot be undone.</p>
                    </div>
                  </div>
                  <div className="flex gap-3 pt-1">
                    <button
                      onClick={() => deleteOrder(confirmDeleteId)}
                      disabled={deletingOrderId === confirmDeleteId}
                      className="flex-1 bg-red-500 hover:bg-red-600 disabled:opacity-60 text-white font-semibold text-sm py-2 rounded-xl transition-colors"
                    >
                      {deletingOrderId === confirmDeleteId ? 'Deleting...' : 'Yes, delete'}
                    </button>
                    <button
                      onClick={() => setConfirmDeleteId(null)}
                      className="flex-1 border border-gray-200 text-gray-700 font-semibold text-sm py-2 rounded-xl hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            {filtered.length === 0 ? (
              <div className="py-12 text-center text-gray-400 text-sm">No orders found.</div>
            ) : (
              <div className="divide-y divide-gray-50">
                {filtered.map(order => {
                  const needsFulfill = ['paid', 'processing'].includes(order.status);
                  const fulfillOpen = expandedFulfill.has(order.id);
                  return (
                    <div key={order.id} className="px-4 sm:px-5 py-4 space-y-3">
                      {/* Order info */}
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-xs text-gray-500">#{order.stripe_session_id.slice(-10).toUpperCase()}</span>
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${STATUS_STYLES[order.status]}`}>{order.status}</span>
                          {needsFulfill && <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-orange-100 text-orange-600">Needs fulfillment</span>}
                          <span className="font-bold text-gray-900 ml-auto">${(order.total_amount / 100).toFixed(2)}</span>
                        </div>
                        <p className="text-sm font-medium text-gray-700 truncate">{order.email}</p>
                        <p className="text-xs text-gray-400 line-clamp-2">{order.items.map(i => `${i.quantity}× ${i.name}`).join(', ')}</p>
                        <p className="text-xs text-gray-400">
                          {new Date(order.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      {/* Actions row */}
                      <div className="flex items-center gap-2 flex-wrap">
                        {needsFulfill && (
                          <button onClick={() => toggleFulfill(order.id)}
                            className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors ${fulfillOpen ? 'bg-orange-500 text-white border-orange-500' : 'bg-white text-orange-600 border-orange-300 hover:bg-orange-50'}`}>
                            {fulfillOpen ? 'Hide Fulfill' : 'Fulfill'}
                          </button>
                        )}
                        <select value={order.status} disabled={updatingId === order.id}
                          onChange={e => updateStatus(order.id, e.target.value)}
                          className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-accent bg-white">
                          {STATUSES.map(s => <option key={s} value={s} className="capitalize">{s}</option>)}
                        </select>
                        <button
                          onClick={() => setConfirmDeleteId(order.id)}
                          className="text-gray-300 hover:text-red-400 transition-colors p-1.5 rounded-lg hover:bg-red-50 ml-auto"
                          title="Delete order"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/>
                          </svg>
                        </button>
                      </div>
                      {needsFulfill && fulfillOpen && <FulfillPanel order={order} products={adminProducts} />}
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

      {/* Reviews tab */}
      {tab === 'reviews' && <ReviewsTab products={adminProducts} onProductsChange={setAdminProducts} />}
    </div>
  );
}
