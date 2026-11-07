import type { MetadataRoute } from 'next';
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'VEST — Graphic T-Shirts', short_name: 'VEST', description: 'Premium DTF printed graphic t-shirts. Cash on delivery all over Bangladesh.',
    start_url: '/', display: 'standalone', background_color: '#0B0B0F', theme_color: '#0B0B0F',
    icons: [{ src: '/icon-192.png', sizes: '192x192', type: 'image/png' }, { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' }, { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }],
  };
}
