import type { Metadata } from "next";
import { Sidebar } from "@/components/layout/sidebar";
import "./globals.css";

export const metadata: Metadata = {
  title: "Quantifi Marketing Dashboard",
  description: "Marketing performance dashboard for Quantifi brands",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">
        <Sidebar />
        <main className="ml-56 min-h-screen bg-slate-50">{children}</main>
      </body>
    </html>
  );
}
