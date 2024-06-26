import { cn } from "~/utils/helper";
import { AppProviders } from "~/providers";
import type { Metadata } from "next";
import { Inter as FontSans } from "next/font/google";
import "./globals.css";
import { Menu } from "~/components/layout/Menu/Menu";
import { Toaster } from "~/components/ui/toaster";

const fontSans = FontSans({
  subsets: ["latin"],
  variable: "--font-sans",
});

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
          "min-h-screen bg-secondary font-sans antialiased flex flex-col md:flex-row",
          fontSans.variable
        )}
      >
        <AppProviders>
          <Menu />
          <Toaster />
          {children}
        </AppProviders>
      </body>
    </html>
  );
}
