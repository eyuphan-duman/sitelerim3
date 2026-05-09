'use client';

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { Plus } from 'lucide-react';

export default function AdminCreateButton() {
  const { user } = useAuth();
  const ADMIN_EMAILS = ['pskfurkan.manav@gmail.com', 'furkan@furkanmanav.com'];

  if (!user || !ADMIN_EMAILS.includes(user.email || '')) return null;

  return (
    <div className="flex justify-center mt-8">
      <Link href="/admin?tab=posts" className="inline-flex items-center gap-2 bg-[var(--navy)] text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:bg-[var(--gold)] hover:text-[var(--navy)] transition-colors">
        <Plus size={20} />
        Yeni Makale Yayımla
      </Link>
    </div>
  );
}
