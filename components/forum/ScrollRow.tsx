'use client';

/** Yatay kaydırılan satır: masaüstünde (fare ile) sol/sağ ok düğmeleri gösterir */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function ScrollRow({ className, children, label, role }: { className: string; children: React.ReactNode; label?: string; role?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ left: false, right: false });

  const update = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    setEdges({ left: el.scrollLeft > 4, right: el.scrollLeft + el.clientWidth < el.scrollWidth - 4 });
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    update();
    el.addEventListener('scroll', update, { passive: true });
    const ro = new ResizeObserver(update);
    ro.observe(el);
    Array.from(el.children).forEach(c => ro.observe(c));
    return () => { el.removeEventListener('scroll', update); ro.disconnect(); };
  }, [update, children]);

  const go = (dir: 1 | -1) => ref.current?.scrollBy({ left: dir * ref.current.clientWidth * 0.8, behavior: 'smooth' });

  return (
    <div className="fx-scrollrow">
      <div ref={ref} className={className} role={role} aria-label={label}>{children}</div>
      {edges.left && (
        <button type="button" className="fx-scroll-arrow is-left" onClick={() => go(-1)} aria-label="Sola kaydır" tabIndex={-1}>
          <ChevronLeft size={18} />
        </button>
      )}
      {edges.right && (
        <button type="button" className="fx-scroll-arrow is-right" onClick={() => go(1)} aria-label="Sağa kaydır" tabIndex={-1}>
          <ChevronRight size={18} />
        </button>
      )}
    </div>
  );
}
