import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { ArrowRight, Clock, Folder } from 'lucide-react';

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
      <div className="relative pt-32 pb-20 overflow-hidden bg-white border-b border-gray-100">
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
        </div>
      </div>

      {/* Articles Grid */}
      <div className="max-w-7xl mx-auto px-6 py-20">
        {articles.length === 0 ? (
          <div className="text-center text-gray-400 py-20 font-serif text-lg italic">
            Henüz yayımlanmış bir makale bulunmuyor.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {articles.map((article: any) => (
              <Link href={`/yazilarim/${article.id}`} key={article.id} className="group block bg-white rounded-2xl overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-gray-100 hover:shadow-[0_12px_30px_rgba(0,0,0,0.08)] transition-all duration-300 transform hover:-translate-y-1 flex flex-col h-full">
                {/* Featured Image */}
                <div className="relative h-64 w-full overflow-hidden bg-gray-100">
                  {article.featuredImage ? (
                    <img 
                      src={article.featuredImage} 
                      alt={article.title}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-[var(--navy)] to-[#1e293b] flex items-center justify-center opacity-90 group-hover:opacity-100 transition-opacity">
                      <span className="font-serif text-white/20 text-4xl font-bold italic tracking-wider">FM</span>
                    </div>
                  )}
                  {/* Category Badge */}
                  {article.category && (
                    <div className="absolute top-4 left-4">
                      <span className="flex items-center gap-1.5 bg-white/95 backdrop-blur text-[var(--navy)] text-xs font-bold px-3 py-1.5 rounded-md shadow-sm tracking-wider uppercase">
                        <Folder size={12} className="text-[var(--gold)]" /> {article.category}
                      </span>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-8 flex flex-col flex-1">
                  <div className="flex items-center gap-2 text-xs font-semibold text-gray-400 mb-4 tracking-wider uppercase">
                    <Clock size={14} />
                    {article.createdAt ? format(new Date(article.createdAt.seconds ? article.createdAt.toDate() : article.createdAt), 'd MMMM yyyy', { locale: tr }) : 'Tarih Yok'}
                  </div>
                  <h3 className="font-serif text-2xl font-bold text-[var(--navy)] mb-4 leading-snug group-hover:text-[var(--gold)] transition-colors line-clamp-2">
                    {article.title}
                  </h3>
                  <p className="text-gray-500 leading-relaxed mb-6 line-clamp-3 font-serif flex-1">
                    {article.excerpt}
                  </p>
                  
                  {/* Footer */}
                  <div className="mt-auto pt-5 border-t border-gray-100 flex items-center justify-between">
                    <span className="text-[var(--gold-dim)] text-sm font-bold tracking-widest uppercase flex items-center gap-2 group-hover:text-[var(--gold)] transition-colors">
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
