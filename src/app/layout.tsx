import type { Metadata, Viewport } from 'next';
import '@fontsource/anton/latin-400.css';
import '@fontsource/space-grotesk/latin-400.css';
import '@fontsource/space-grotesk/latin-500.css';
import '@fontsource/instrument-serif/latin-400.css';
import '@fontsource/instrument-serif/latin-400-italic.css';
import '@fontsource/ibm-plex-mono/latin-400.css';
import './globals.css';
import { CartProvider } from '@/components/Cart';
import { Header, Footer } from '@/components/Chrome';
import Tracking from '@/components/Tracking';
import { getSettings } from '@/lib/data';


export const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const seo = (await getSettings()).seo || {};
  return {
  metadataBase: new URL(SITE),
  title: { default: seo.title || 'VEST', template: '%s — VEST' },
  description: seo.description,
  openGraph: { siteName: 'VEST', type: 'website', locale: 'en_BD' },
  twitter: { card: 'summary_large_image' },
  };
}
export const viewport: Viewport = { themeColor: '#111111', width: 'device-width', initialScale: 1 };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const s = await getSettings();
  const org = { '@context': 'https://schema.org', '@type': 'Organization', name: 'VEST', url: SITE, logo: `${SITE}/icon.svg` };
  return (
    <html lang="en">
      <body>
        <Tracking t={s.tracking} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(org) }} />
        <CartProvider>
          <Header announce={s.announce} />
          <main>{children}</main>
          <Footer social={s.social} line={s.statement?.footer} />
        </CartProvider>
      </body>
    </html>
  );
}
