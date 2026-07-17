import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from 'react-hot-toast';

export const metadata: Metadata = {
  title: 'Pixora — AI Creative Studio',
  description: 'Generate stunning images, videos, and more with the power of AI.',
  keywords: 'AI image generation, AI video, text to image, AI creative studio',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="noise">
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#0e0e16',
              color: '#f1f1f3',
              border: '1px solid rgba(124,58,237,0.3)',
              borderRadius: '12px',
              fontSize: '14px',
            },
            success: { iconTheme: { primary: '#a855f7', secondary: '#0e0e16' } },
            error: { iconTheme: { primary: '#ef4444', secondary: '#0e0e16' } },
          }}
        />
      </body>
    </html>
  );
}
