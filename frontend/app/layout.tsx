import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next"
import { Inter } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Dossier AI - Research-Backed AI Presentations",
  description: "Generate presentations backed by credible sources. No fluff. Turn a prompt into a professional, well-structured presentation in under 5 minutes.",
  keywords: ["AI", "presentation", "slides", "research", "citations", "AI presentations", "research-backed"],
  authors: [{ name: "Dossier AI" }],
  icons: {
    icon: '/logo.png',
    apple: '/logo.png',
  },
  openGraph: {
    title: "Dossier AI - Research-Backed Presentations",
    description: "Generate presentations backed by credible sources. No fluff.",
    type: "website",
    siteName: "Dossier AI",
    locale: "en_US",
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Dossier AI - Research-backed presentations',
        type: 'image/png',
      }
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Dossier AI - Research-Backed Presentations",
    description: "Generate presentations backed by credible sources. No fluff.",
    images: ['/og-image.png'],
    creator: "@DossierAI",
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable}`} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('theme');
                  if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                    document.documentElement.classList.add('dark');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="font-sans antialiased">
        <ThemeProvider>
          {children}
          <Analytics />
        </ThemeProvider>
      </body>
    </html>
  );
}
