'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import ForumShell from '@/components/forum/ForumShell';
import { Leaderboard } from '@/components/forum/Scores';

/** Logos liderlik tablosu: haftanın, ayın ve tüm zamanların birincileri */
export default function LeadersPage() {
  const router = useRouter();
  return (
    <ForumShell active="leaders">
      {() => (
        <>
          <div className="fx-head">
            <div className="fx-thead fx-thead-flat">
              <button type="button" className="fx-icon-btn" onClick={() => router.push('/forum')} aria-label="Geri" style={{ color: 'var(--fx-ink)' }}>
                <ArrowLeft size={20} />
              </button>
              <h2 style={{ flex: 1 }}>Liderlik</h2>
            </div>
          </div>
          <Leaderboard />
        </>
      )}
    </ForumShell>
  );
}
