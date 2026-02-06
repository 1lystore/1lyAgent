import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "1lyAgent - Sovereign AI Commerce",
  description: "Self-pricing autonomous agent. Charges USDC for work. Spends earnings in the real world."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
