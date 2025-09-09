import { PriceModeProvider } from '@/lib/price-mode';
import FloatingPriceMode from '@/components/FloatingPriceMode';
import Footer from '@/components/ui/Footer';
import Gatekeeper from '@/components/Gatekeeper';

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PriceModeProvider>
      <Gatekeeper>
        {children}
      </Gatekeeper>
      <Footer />
      <FloatingPriceMode />
    </PriceModeProvider>
  );
}
