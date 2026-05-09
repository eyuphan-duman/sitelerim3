'use client';

import { Suspense } from 'react';
import YazilarimClient from './YazilarimClient';

export default function YazilarimPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: '#fafafa' }} />}>
      <YazilarimClient />
    </Suspense>
  );
}
