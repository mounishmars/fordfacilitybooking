import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Ford Facility Admin',
  description: 'Facility booking approvals and management',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
