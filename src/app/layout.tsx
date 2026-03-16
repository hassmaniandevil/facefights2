import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'FaceFights — Your Face is the Controller',
  description: 'The fighting game where your face is simultaneously the controller, the character, and the joke.',
  openGraph: {
    title: 'FaceFights',
    description: 'Fight with your face. Make expressions to attack, block, and dodge.',
    type: 'website',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
