import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Setsuna - デバイス間でテキストを共有',
  description: 'デバイス間でテキストをリアルタイム共有するWebアプリケーション',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className="min-h-screen bg-gray-50">{children}</body>
    </html>
  );
}
