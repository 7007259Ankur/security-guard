import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Security Guard — Zero-Knowledge Security Platform",
  description: "Advanced cyber security dashboard, zero-knowledge credential vault, encrypted file manager, and audit calendar.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="bg-slate-950 text-slate-100 antialiased min-h-screen selection:bg-emerald-500/30 selection:text-emerald-200">
        {children}
      </body>
    </html>
  );
}
