import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'March7 — Factory-Direct Tech';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background: '#070d1a',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          justifyContent: 'center',
          padding: '80px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Glow */}
        <div style={{
          position: 'absolute',
          right: '-100px',
          top: '50%',
          transform: 'translateY(-50%)',
          width: '600px',
          height: '600px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)',
        }} />

        {/* Badge */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: 'rgba(255,255,255,0.08)',
          color: 'rgba(255,255,255,0.7)',
          fontSize: '18px',
          fontWeight: 500,
          padding: '8px 20px',
          borderRadius: '100px',
          marginBottom: '36px',
        }}>
          <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#4ade80' }} />
          Every product personally tested &amp; verified
        </div>

        {/* Brand */}
        <div style={{
          fontSize: '80px',
          fontWeight: 800,
          color: 'white',
          letterSpacing: '-2px',
          lineHeight: 1,
          marginBottom: '24px',
        }}>
          March7
        </div>

        {/* Tagline */}
        <div style={{
          fontSize: '36px',
          fontWeight: 400,
          color: 'rgba(255,255,255,0.5)',
          marginBottom: '16px',
          maxWidth: '640px',
        }}>
          Factory-Direct Tech.
        </div>
        <div style={{
          fontSize: '36px',
          fontWeight: 700,
          color: 'rgba(255,255,255,0.85)',
          maxWidth: '640px',
        }}>
          No Overpriced Brands.
        </div>

        {/* Bottom trust */}
        <div style={{
          position: 'absolute',
          bottom: '60px',
          left: '80px',
          display: 'flex',
          gap: '32px',
          fontSize: '16px',
          color: 'rgba(255,255,255,0.4)',
        }}>
          <span>🛡️ Quality Tested</span>
          <span>🚚 Fast Shipping</span>
          <span>↩ 30-Day Returns</span>
          <span>🔒 Secure Checkout</span>
        </div>
      </div>
    ),
    { ...size }
  );
}
