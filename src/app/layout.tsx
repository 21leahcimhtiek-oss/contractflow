import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "ContractFlow — AI-Powered Contract Management",
    template: "%s | ContractFlow",
  },
  description:
    "ContractFlow transforms how enterprise teams draft, review, sign, and manage contracts. AI-powered risk scoring, e-signature workflows, and approval chains.",
  keywords: [
    "contract management",
    "AI contracts",
    "e-signature",
    "legal operations",
    "contract lifecycle",
    "CLM",
  ],
  authors: [{ name: "ContractFlow" }],
  openGraph: {
    type: "website",
    locale: "en_US",
    url: process.env.NEXT_PUBLIC_APP_URL,
    siteName: "ContractFlow",
    title: "ContractFlow — AI-Powered Contract Management",
    description: "From draft to signed in minutes. AI contract review, risk scoring, and e-signature for enterprise teams.",
  },
  twitter: {
    card: "summary_large_image",
    title: "ContractFlow",
    description: "AI-powered contract lifecycle management for enterprise teams.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}