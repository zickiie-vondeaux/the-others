import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ServiceWorkerRegistrar } from "@/components/ServiceWorkerRegistrar";

export const metadata: Metadata = {
  title: "The Others",
  description: "Our private hub for gaming, movies, and everything in between.",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/icons/icon-16.png",  sizes: "16x16",   type: "image/png" },
      { url: "/icons/icon-32.png",  sizes: "32x32",   type: "image/png" },
    ],
    apple: { url: "/icons/icon-180.png", sizes: "180x180" },
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "The Others",
  },
};

export const viewport: Viewport = {
  themeColor: "#0f0f1a",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full">
        <ServiceWorkerRegistrar />
        {children}
      </body>
    </html>
  );
}
