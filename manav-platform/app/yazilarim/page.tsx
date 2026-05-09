import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { ArrowRight, Clock, Folder } from 'lucide-react';
import AdminCreateButton from './AdminCreateButton';

// Force dynamic rendering to ensure fresh data
export const dynamic = 'force-dynamic';

async function getArticles() {
  const q = query(collection(db, 'articles'), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
}

export default async function ArticlesPage() {
  const articles = await getArticles();

  return (
    <div className="min-h-screen bg-[#fafafa]">
      {/* Premium Header */}
      <div className="relative pt-40 md:pt-48 pb-20 overflow-hidden bg-white border-b border-gray-100">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-[1200px] pointer-events-none">
          <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full bg-[radial-gradient(circle,rgba(201,169,110,0.05),transparent_70%)]" />
          <div className="absolute bottom-[-10%] left-[-5%] w-[400px] h-[400px] rounded-full bg-[radial-gradient(circle,rgba(10,22,40,0.03),transparent_70%)]" />
        </div>
        <div className="max-w-7xl mx-auto px-6 relative z-10 text-center">
          <span className="inline-block py-1.5 px-4 rounded-full bg-[#f8fafc] text-[var(--gold-dim)] text-xs font-bold tracking-[0.2em] uppercase mb-6 border border-gray-100 shadow-sm">
            Psikoloji & Varoluş
          </span>
          <h1 className="font-serif text-5xl md:text-7xl font-bold text-[var(--navy)] tracking-tight mb-6 leading-[1.1]">
            Derinlemesine <span className="italic text-[var(--gold)] font-light">İncelemeler</span>
          </h1>
          <p className="max-w-2xl mx-auto text-lg text-gray-500 leading-relaxed font-serif">
            Psikanalitik ve varoluşçu perspektiften insan ruhunun katmanlarına dair yazılar, düşünceler ve analizler.
          </p>
          <AdminCreateButton />
        </div>
      </div>

      {/* Articles Grid */}
      <div className="max-w-7xl mx-auto px-6 py-20">
        {articles.length === 0 ? (
          <div className="text-center text-gray-400 py-20 font-serif text-lg italic">
            Henüz yayımlanmış bir makale bulunmuyor.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {articles.map((article: any) => (
              <Link href={`/yazilarim/${article.id}`} key={article.id} className="group flex flex-col bg-white rounded-3xl overflow-hidden shadow-[0_4px_30px_rgba(0,0,0,0.03)] border border-gray-100 hover:shadow-[0_15px_40px_rgba(0,0,0,0.08)] transition-all duration-300 transform hover:-translate-y-1 h-full min-h-[300px] p-8 md:p-12 relative">
                
                {article.category && (
                  <span className="absolute top-8 right-8 flex items-center gap-1.5 text-gray-400 text-xs font-bold tracking-widest uppercase">
                    <Folder size={14} className="text-[var(--gold)]" /> {article.category}
                  </span>
                )}

                {/* Content */}
                <div className="flex flex-col flex-1">
                  <div className="flex items-center gap-2 text-sm font-semibold text-[var(--gold-dim)] mb-4 tracking-wider uppercase">
                    <Clock size={16} />
                    {article.createdAt ? format(new Date(article.createdAt.seconds ? article.createdAt.toDate() : article.createdAt), 'd MMMM yyyy', { locale: tr }) : 'Tarih Yok'}
                  </div>
                  <h3 className="font-serif text-3xl md:text-4xl font-bold text-[var(--navy)] mb-6 leading-snug group-hover:text-[var(--gold)] transition-colors">
                    {article.title}
                  </h3>
                  <p className="text-gray-500 text-lg leading-relaxed mb-10 line-clamp-4 font-serif flex-1">
                    {article.excerpt}
                  </p>
                  
                  {/* Footer */}
                  <div className="mt-auto pt-6 border-t border-gray-100/50 flex items-center">
                    <span className="text-[var(--navy)] text-sm font-bold tracking-widest uppercase flex items-center gap-2 group-hover:text-[var(--gold)] transition-colors bg-gray-50 px-6 py-3 rounded-full">
                      Makaleyi Oku <ArrowRight size={16} className="transform group-hover:translate-x-1 transition-transform" />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
