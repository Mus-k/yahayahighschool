import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import { ThemeProvider } from "@/providers/theme.provider";
import { LenisProvider } from "@/providers/lenis.provider";
import "./globals.css";

// ─────────────────────────────────────────────────────────────────────────────
// Root Layout — Minimal shell with global ThemeProvider
// Locale-specific providers are in app/[locale]/layout.tsx
// Placing ThemeProvider here ensures NextThemesProvider never re-renders across client locale changes
// ─────────────────────────────────────────────────────────────────────────────

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  display: 'swap',
  weight: ['300', '400', '500', '600', '700', '800', '900'],
});

export const metadata: Metadata = {
  title: {
    default: "YAHAYASCOOL — Yahaya International Islamic and English High School",
    template: "%s | YAHAYASCOOL",
  },
  description:
    "Enterprise educational management platform for Yahaya International Islamic and English High School — managing students, teachers, finance, hostel, and more.",
  keywords: ["school management", "Islamic school", "educational platform", "YAHAYASCOOL"],
  authors: [{ name: "YAHAYASCOOL Team" }],
  robots: {
    index: false, // Internal platform — not for public indexing
    follow: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html suppressHydrationWarning className={outfit.variable} data-scroll-behavior="smooth">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className="min-h-screen antialiased bg-background text-foreground overflow-x-clip" suppressHydrationWarning>
        <ThemeProvider>
          <LenisProvider>
            {children}
          </LenisProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
