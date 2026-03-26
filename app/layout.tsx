import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Navbar, Footer } from "@/components/Layout";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "Neuronix AI - Premium Digital Assets Marketplace",
    template: "%s | Neuronix AI"
  },
  description: "Neuronix AI is the premier marketplace for premium digital assets, including high-quality website templates, UI kits, SaaS dashboards, and AI source code. Built for developers and designers to accelerate their workflow.",
  keywords: [
    "AI Marketplace", "Digital Assets", "Website Templates", "UI Kits", "SaaS Dashboards", 
    "React Templates", "Next.js Templates", "Source Code Marketplace", "Developer Tools", 
    "Web Design Assets", "Premium Scripts", "SaaS UI Kit", "Neon UI Design"
  ],
  authors: [{ name: "Neuronix AI Team" }],
  creator: "Neuronix AI",
  publisher: "Neuronix AI",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    title: "Neuronix AI - Premium Digital Assets Marketplace",
    description: "Discover high-quality website templates, UI kits, and SaaS dashboards at Neuronix AI. The world's most advanced marketplace for premium digital assets.",
    url: "https://neuronix-ai.run.app",
    siteName: "Neuronix AI",
    images: [
      {
        url: "https://picsum.photos/seed/neuronix/1200/630",
        width: 1200,
        height: 630,
        alt: "Neuronix AI Marketplace Preview",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Neuronix AI - Premium Digital Assets Marketplace",
    description: "The world's most advanced marketplace for premium digital assets. Built for developers, by developers.",
    images: ["https://picsum.photos/seed/neuronix/1200/630"],
    creator: "@neuronix_ai",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: "google-site-verification-placeholder",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={`${inter.className} bg-dark-bg text-text min-h-screen flex flex-col`} suppressHydrationWarning>
        <Navbar />
        <main className="flex-grow">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
