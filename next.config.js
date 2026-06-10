/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'mlzkjufdyphxatprtcpb.supabase.co' },
    ],
    unoptimized: false,
    formats: ['image/webp'],
  },
};

module.exports = nextConfig;
