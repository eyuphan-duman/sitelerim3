import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Güvenlik doğrulaması',
  robots: { index: false, follow: false },
};

export default function CaptchaLayout({ children }: { children: React.ReactNode }) {
  return children;
}
