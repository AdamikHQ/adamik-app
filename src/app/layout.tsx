import { cn } from "~/utils/helper";
import { AppProviders } from "~/providers";
import type { Metadata } from "next";
import "./globals.css";
import { Menu } from "~/components/layout/Menu/Menu";
import { Toaster } from "~/components/ui/toaster";
import { WalletModal } from "~/components/wallets/WalletModal";
import { WalletConnect, ConnectedChains } from "~/components";

export const metadata: Metadata = {
  title: "Adamik App",
  description: "Adamik App showcasing Adamik API",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          "min-h-screen bg-secondary font-sans antialiased flex flex-col md:flex-row"
        )}
      >
        <AppProviders>
          <div className="flex flex-row w-full">
            <Menu />
            <main className="flex-1 relative">
              {/* Top right wallet connection UI */}
              <div className="absolute top-4 right-4 z-[100]">
                <WalletConnect />
              </div>

              {children}
            </main>
          </div>
          <Toaster />
          <WalletModal />
          <ConnectedChains />
        </AppProviders>
      </body>
    </html>
  );
}
