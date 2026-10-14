import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { AppProviders } from "@/lib/query/provider";
import "./globals.css";

const SITE = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
const TITLE = "AutoAPI by Garde — Know before your APIs break";
const DESCRIPTION =
  "AutoAPI watches the third-party APIs your code depends on, catches breaking changes, maps them to the exact lines that use them, and opens verified repair pull requests. It never merges on its own.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: { default: TITLE, template: "%s · AutoAPI" },
  description: DESCRIPTION,
  applicationName: "AutoAPI",
  keywords: ["API monitoring", "breaking changes", "OpenAPI diff", "SDK upgrades", "automated repair", "pull requests", "developer tools", "Garde"],
  authors: [{ name: "Garde" }],
  creator: "Garde",
  publisher: "Garde",
  category: "technology",
  manifest: "/favicon_manfest/site.webmanifest",
  icons: {
    icon: [
      { url: "/favicon_manfest/favicon.ico", sizes: "any" },
      { url: "/favicon_manfest/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon_manfest/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon_manfest/android-chrome-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/favicon_manfest/android-chrome-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/favicon_manfest/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
    shortcut: ["/favicon_manfest/favicon.ico"],
  },
  // The card image itself comes from app/opengraph-image.tsx and app/twitter-image.tsx (1200×630).
  openGraph: {
    type: "website",
    siteName: "AutoAPI",
    title: TITLE,
    description: DESCRIPTION,
    url: SITE,
    locale: "en_US",
  },
  twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large" } },
  appleWebApp: { capable: true, statusBarStyle: "default", title: "AutoAPI" },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f5f5f7" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
};

/* Applies the remembered appearance (or the system one) before first paint, then tracks system changes. */
const themeScript = `(function(){try{var m=matchMedia('(prefers-color-scheme: dark)');var a=function(){var s=localStorage.getItem('autoapi.theme');document.documentElement.classList.toggle('dark',s?s==='dark':m.matches)};a();m.addEventListener('change',a);}catch(e){}})();`;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased" data-scroll-behavior="smooth" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="flex min-h-full flex-col">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
