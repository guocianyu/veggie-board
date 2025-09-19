import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/ui/Navbar';
import { DSProvider } from '@/components/ds/Provider';
import { PriceModeProvider } from '@/lib/price-mode';
import FloatingPriceMode from '@/components/FloatingPriceMode';
import Footer from '@/components/ui/Footer';
import Gatekeeper from '@/components/Gatekeeper';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: {
    default: '菜價看板 | VeggieBoard',
    template: '%s | 菜價看板 | VeggieBoard'
  },
  description: '即時掌握蔬果批發價格趨勢，提供零售價格估算，讓您做出更明智的採購決策。',
  keywords: [
    '菜價',
    '蔬果價格',
    '批發市場',
    '零售估算',
    '價格趨勢',
    '農產品',
    'VeggieBoard',
    '菜價看板'
  ],
  authors: [{ name: 'VeggieBoard Team' }],
  creator: 'VeggieBoard',
  publisher: 'VeggieBoard',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'zh_TW',
    url: '/',
    title: '菜價看板 | VeggieBoard',
    description: '即時掌握蔬果批發價格趨勢，提供零售價格估算，讓您做出更明智的採購決策。',
    siteName: '菜價看板 | VeggieBoard',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: '菜價看板 | VeggieBoard',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: '菜價看板 | VeggieBoard',
    description: '即時掌握蔬果批發價格趨勢，提供零售價格估算，讓您做出更明智的採購決策。',
    images: ['/og-image.jpg'],
    creator: '@veggieboard',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'your-google-verification-code',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-TW" className="h-full">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#4CAF50" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className={`${inter.className} h-full flex flex-col`}>
        <DSProvider>
          <PriceModeProvider>
            {/* <Gatekeeper> */}
              <Navbar />
              <main className="flex-1">
                {children}
              </main>
            {/* </Gatekeeper> */}
            <Footer />
            <FloatingPriceMode />
          </PriceModeProvider>
        </DSProvider>
      </body>
    </html>
  );
}
