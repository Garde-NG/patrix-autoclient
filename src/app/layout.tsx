import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { AppProviders } from "@/lib/query/provider";
import "./globals.css";

const SITE = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
const DESCRIPTION =
  "AutoAPI watches the third-party APIs your code depends on, detects breaking changes, maps them to the exact lines that use them, and proposes verified repairs as pull requests. It never merges on its own.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: { default: "AutoAPI — API change monitoring and verified repairs", template: "%s · AutoAPI" },
  description: DESCRIPTION,
  applicationName: "AutoAPI",
  keywords: ["API monitoring", "breaking changes", "OpenAPI diff", "SDK upgrades", "automated repair", "pull requests", "developer tools"],
  authors: [{ name: "Garde" }],
  creator: "Garde",
  category: "technology",
  icons: { icon: "/images/logo/logo-collaspes.svg", apple: "/images/logo/logo-collaspes.svg" },
  openGraph: {
    type: "website",
    siteName: "AutoAPI",
    title: "AutoAPI — API change monitoring and verified repairs",
    description: DESCRIPTION,
    url: SITE,
    locale: "en_US",
  },
  twitter: { card: "summary", title: "AutoAPI", description: DESCRIPTION },
  robots: { index: true, follow: true },
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
