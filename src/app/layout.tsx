import { cn } from "~/lib/utils";
import { AppProviders } from "~/providers";
import type { Metadata } from "next";
import { Inter as FontSans } from "next/font/google";
import "./globals.css";
import { Menu } from "~/components/layout/Menu/Menu";

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
          <main className="flex-1 mx-auto w-full flex flex-col auto-rows-max gap-4 p-4 md:p-8">
            {children}
          </main>
        </AppProviders>
      </body>
    </html>
  );
}
