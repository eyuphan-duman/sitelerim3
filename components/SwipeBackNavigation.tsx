'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { ArrowLeft, ChevronLeft } from 'lucide-react';

const THRESHOLD = 75; // Minimum horizontal drag pixels to trigger back

export default function SwipeBackNavigation() {
  const router = useRouter();
  const pathname = usePathname();

  const [active, setActive] = useState(false);
  const [distance, setDistance] = useState(0);
  const [indicatorY, setIndicatorY] = useState(200);
  const [triggered, setTriggered] = useState(false);

  const touchStartRef = useRef<{ x: number; y: number; time: number; valid: boolean }>({
    x: 0,
    y: 0,
    time: 0,
    valid: false,
  });

  const activeRef = useRef(false);
  const distanceRef = useRef(0);
  const triggeredRef = useRef(false);

  useEffect(() => {
    // Only activate for touch screens
    if (typeof window === 'undefined') return;

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) {
        touchStartRef.current.valid = false;
        return;
      }

      const touch = e.touches[0];
      const startX = touch.clientX;
      const startY = touch.clientY;
      const target = e.target as HTMLElement | null;

      // Don't trigger inside inputs, textareas, contenteditable or non-swipe elements
      if (target?.closest('input, textarea, select, [contenteditable="true"], .no-swipe-back, [data-no-swipe]')) {
        touchStartRef.current.valid = false;
        return;
      }

      // Check if user is scrolling inside a horizontally scrollable element that is not at left edge
      let el = target;
      let isInsideScrollable = false;
      while (el && el !== document.body) {
        if (el.scrollWidth > el.clientWidth && el.scrollLeft > 6) {
          isInsideScrollable = true;
          break;
        }
        el = el.parentElement;
      }

      if (isInsideScrollable) {
        touchStartRef.current.valid = false;
        return;
      }

      // Valid gesture starting
      touchStartRef.current = {
        x: startX,
        y: startY,
        time: Date.now(),
        valid: true,
      };

      activeRef.current = false;
      distanceRef.current = 0;
      triggeredRef.current = false;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!touchStartRef.current.valid || e.touches.length !== 1) return;

      const touch = e.touches[0];
      const deltaX = touch.clientX - touchStartRef.current.x;
      const deltaY = touch.clientY - touchStartRef.current.y;

      // User swiping to the left -> cancel
      if (deltaX < 0) {
        touchStartRef.current.valid = false;
        if (activeRef.current) {
          setActive(false);
          activeRef.current = false;
        }
        return;
      }

      // If vertical scroll is dominating before horizontal swipe takes off, cancel
      if (!activeRef.current) {
        if (Math.abs(deltaY) > 25 && Math.abs(deltaY) > deltaX) {
          touchStartRef.current.valid = false;
          return;
        }

        // When horizontal movement is clear and exceeds 14px
        if (deltaX > 14 && deltaX > Math.abs(deltaY) * 1.2) {
          activeRef.current = true;
          setActive(true);
          const safeY = Math.min(Math.max(touch.clientY, 100), window.innerHeight - 100);
          setIndicatorY(safeY);
        }
      }

      if (activeRef.current) {
        // Prevent vertical scrolling jitter while pulling back
        if (e.cancelable) {
          e.preventDefault();
        }

        const clampedDistance = Math.min(deltaX, 140);
        distanceRef.current = clampedDistance;
        setDistance(clampedDistance);

        const safeY = Math.min(Math.max(touch.clientY, 100), window.innerHeight - 100);
        setIndicatorY(safeY);

        const isReady = clampedDistance >= THRESHOLD;
        if (isReady !== triggeredRef.current) {
          triggeredRef.current = isReady;
          setTriggered(isReady);
          if (isReady && typeof navigator !== 'undefined' && navigator.vibrate) {
            try {
              navigator.vibrate(12);
            } catch {
              // Ignore vibration failure
            }
          }
        }
      }
    };

    const handleTouchEnd = () => {
      if (activeRef.current) {
        const canTrigger = distanceRef.current >= THRESHOLD;

        if (canTrigger) {
          // Trigger light vibration
          if (typeof navigator !== 'undefined' && navigator.vibrate) {
            try {
              navigator.vibrate([15, 30, 20]);
            } catch {
              // Ignore
            }
          }

          // Navigate back
          if (typeof window !== 'undefined') {
            if (window.history.length > 1) {
              router.back();
            } else if (pathname !== '/') {
              router.push('/');
            }
          }
        }

        // Reset state
        setActive(false);
        activeRef.current = false;
        setDistance(0);
        distanceRef.current = 0;
        setTriggered(false);
        triggeredRef.current = false;
      }

      touchStartRef.current.valid = false;
    };

    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });
    window.addEventListener('touchcancel', handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [router, pathname]);

  if (!active || distance < 12) return null;

  const progress = Math.min(distance / THRESHOLD, 1);
  const translateX = Math.min(distance * 0.45, 45);

  return (
    <div
      style={{
        position: 'fixed',
        left: 0,
        top: indicatorY,
        transform: `translateY(-50%) translateX(${translateX - 45}px)`,
        zIndex: 999999,
        pointerEvents: 'none',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        transition: 'transform 0.05s ease-out',
      }}
    >
      {/* Curved Indicator Bubble */}
      <div
        style={{
          width: 52,
          height: 52,
          borderRadius: '50%',
          background: triggered
            ? 'linear-gradient(135deg, #0b1524 0%, #1e293b 100%)'
            : 'rgba(11, 21, 36, 0.88)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          border: triggered ? '2px solid #d4aa70' : '1.5px solid rgba(212, 175, 55, 0.4)',
          boxShadow: triggered
            ? '0 0 25px rgba(212, 175, 55, 0.5), 0 8px 24px rgba(0,0,0,0.5)'
            : '0 8px 20px rgba(0, 0, 0, 0.35)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: triggered ? '#facc15' : 'white',
          transform: `scale(${0.75 + progress * 0.35})`,
          transition: 'all 0.15s cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}
      >
        {triggered ? (
          <ArrowLeft size={22} strokeWidth={2.5} />
        ) : (
          <ChevronLeft size={22} strokeWidth={2.5} style={{ transform: `translateX(${-2 + progress * 2}px)` }} />
        )}
      </div>

      {/* Pill label when reaching threshold */}
      <div
        style={{
          opacity: progress > 0.5 ? 1 : 0,
          transform: `translateX(${progress > 0.5 ? 0 : -10}px)`,
          transition: 'all 0.18s ease-out',
          background: triggered ? 'rgba(212, 175, 55, 0.95)' : 'rgba(15, 23, 42, 0.85)',
          color: triggered ? '#0a1628' : '#e2e8f0',
          fontWeight: 800,
          fontSize: '0.74rem',
          padding: '4px 10px',
          borderRadius: 999,
          border: triggered ? '1px solid #d4aa70' : '1px solid rgba(255,255,255,0.1)',
          boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
          whiteSpace: 'nowrap',
          letterSpacing: '0.02em',
        }}
      >
        {triggered ? 'Bırak: Geri Dön' : 'Geri'}
      </div>
    </div>
  );
}
