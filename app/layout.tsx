import type { Metadata } from "next";
import { GeistSans } from 'geist/font/sans';
import "./globals.css";

export const metadata: Metadata = {
  title: "Mon Planner — Votre espace de productivité",
  description: "Un planner digital moderne pour une vie intentionnelle",
  icons: {
    icon: '/logo.jpg',
    apple: '/logo.jpg',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={GeistSans.variable}>
      <body className={`${GeistSans.className} paper-bg min-h-screen`}>
        {children}
      </body>
    </html>
  );
}
