import type { Metadata } from "next";
import "./globals.css";
import { siteConfig } from "@/config/site";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import CartDrawer from "@/components/CartDrawer";
import Footer from "@/components/Footer";
import AffiliateTracker from "@/components/AffiliateTracker";
import { KvaAdvisorModal } from "@/components/KvaAdvisorModal";

export const metadata: Metadata = {
  title: `${siteConfig.storeName} | ${siteConfig.tagline}`,
  description: siteConfig.description,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="scroll-smooth">
      <body className="antialiased bg-[var(--background)]">
        <AffiliateTracker />
        <Header />
        <CartDrawer />
        <KvaAdvisorModal />
        {children}
        <Footer />
        <BottomNav />
      </body>
    </html>
  );
}