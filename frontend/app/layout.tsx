import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "IntelliForge 2.0 — Autonomous SOC Platform",
  description: "AI-Powered Autonomous Cyber Security Operations Center",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full antialiased bg-[#050816] text-white">
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}

