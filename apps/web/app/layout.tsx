import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'emergemos · Medicina Integrativa',
  description: 'Plataforma clínica segura de emergemos',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
