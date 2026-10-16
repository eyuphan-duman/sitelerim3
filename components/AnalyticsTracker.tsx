'use client';

import { useEffect, Suspense } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

function AnalyticsTrackerInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Route change tracking (Virtual Pageview for Next.js App Router)
  useEffect(() => {
    if (typeof window === 'undefined' || !(window as any).gtag) return;

    const url = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : '');

    (window as any).gtag('event', 'page_view', {
      page_path: url,
      page_location: window.location.href,
      page_title: document.title,
    });
  }, [pathname, searchParams]);

  // Global click tracking for Phone, WhatsApp, and Contact interactions
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleGlobalClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement)?.closest('a');
      if (!target || !(window as any).gtag) return;

      const href = target.getAttribute('href') || '';

      // Phone click tracking
      if (href.startsWith('tel:')) {
        (window as any).gtag('event', 'phone_call_click', {
          event_category: 'engagement',
          event_label: href,
        });
        (window as any).gtag('event', 'ads_conversion_Ki_i_1');
      }

      // WhatsApp click tracking
      if (href.includes('wa.me') || href.includes('whatsapp.com')) {
        (window as any).gtag('event', 'whatsapp_click', {
          event_category: 'engagement',
          event_label: href,
        });
        (window as any).gtag('event', 'ads_conversion_Ki_i_1');
      }

      // Email click tracking
      if (href.startsWith('mailto:')) {
        (window as any).gtag('event', 'email_click', {
          event_category: 'engagement',
          event_label: href,
        });
      }
    };

    document.addEventListener('click', handleGlobalClick);
    return () => {
      document.removeEventListener('click', handleGlobalClick);
    };
  }, []);

  return null;
}

export default function AnalyticsTracker() {
  return (
    <Suspense fallback={null}>
      <AnalyticsTrackerInner />
    </Suspense>
  );
}
