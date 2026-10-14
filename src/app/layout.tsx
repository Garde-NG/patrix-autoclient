import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { AppProviders } from "@/lib/query/provider";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "AutoAPI", template: "%s · AutoAPI" },
  description: "API compatibility monitoring and verified automated repair for the third-party APIs your code depends on.",
  applicationName: "AutoAPI",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "AutoAPI" },
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
