import type { Metadata } from "next";
import { DM_Sans, Syne } from "next/font/google";
import "./globals.css";
import { BookmarkProvider } from "@/contexts/BookmarkContext";
import { CartProvider } from "@/contexts/CartContext";
import { CheckoutProvider } from "@/contexts/CheckoutContext";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const syne = Syne({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Fashion Dirt — Discover Latest Fashion",
  description:
    "Shop premium streetwear and fashion essentials. Discover the latest t-shirts, shirts, pants, and jackets from WELCOME.",
  keywords: ["fashion", "streetwear", "clothing", "t-shirts", "shirts"],
  icons: {
    icon: "./logo.png"
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${syne.variable}`}>
      <body>
        <BookmarkProvider>
          <CartProvider>
            <CheckoutProvider>
              <div className="app-shell">{children}</div>
            </CheckoutProvider>
          </CartProvider>
        </BookmarkProvider>
      </body>
    </html>
  );
}