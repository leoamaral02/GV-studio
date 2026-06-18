import type { Metadata, Viewport } from "next";
import { Toaster } from "sonner";
import { PWARegister } from "@/components/pwa-register";
import "./globals.css";

export const metadata: Metadata = {
  title: "GV Studio",
  description: "Controle interno para manicure e nail designer",
  manifest: "/manifest.json",
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg"
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "GV Studio"
  }
};

export const viewport: Viewport = {
  themeColor: "#0A0A0A"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className="dark" suppressHydrationWarning>
      <body suppressHydrationWarning>
        {children}
        <PWARegister />
        <Toaster richColors position="top-right" toastOptions={{ style: { background: "#141414", color: "#EDEAE4", border: "1px solid #242424" } }} />
      </body>
    </html>
  );
}
