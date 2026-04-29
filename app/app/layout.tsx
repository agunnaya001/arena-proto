import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/navbar';
import { Providers } from '@/components/providers';

export const metadata: Metadata = {
  title: 'Arena Protocol - Web3 GameFi',
  description: 'Battle, earn, and trade in the Arena Protocol ecosystem',
  openGraph: {
    title: 'Arena Protocol',
    description: 'Web3 GameFi on Base',
    images: ['/og-image.png'],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="bg-background">
      <body className="bg-background text-foreground">
        <Providers>
          <Navbar />
          <main className="min-h-screen">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
