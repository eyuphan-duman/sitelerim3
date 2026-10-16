import { Metadata } from 'next';
import { Suspense } from 'react';
import ProfilClient from './ProfilClient';

type Props = {
  params: Promise<{ username: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const resolvedParams = await params;
  const username = decodeURIComponent(resolvedParams.username || '');
  return {
    title: `@${username} | Logos`,
    description: `${username} kullanıcısının Logos psikoloji forumu profili.`,
  };
}

export default async function Page({ params }: Props) {
  const resolvedParams = await params;
  const username = decodeURIComponent(resolvedParams.username || '');
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>Yükleniyor...</div>}>
      <ProfilClient username={username} />
    </Suspense>
  );
}
