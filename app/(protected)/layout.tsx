import { PriceModeProvider } from '@/lib/price-mode';
import FloatingPriceMode from '@/components/FloatingPriceMode';
import Footer from '@/components/ui/Footer';

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PriceModeProvider>
      {children}
      <Footer />
      <FloatingPriceMode />
    </PriceModeProvider>
  );
}
