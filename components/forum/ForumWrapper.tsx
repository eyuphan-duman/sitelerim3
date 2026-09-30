'use client';

import dynamic from 'next/dynamic';

import ForumLoadingScreen from './ForumLoadingScreen';

const ForumClient = dynamic(() => import('@/app/forum/ForumClient'), {
  ssr: false,
  loading: () => <ForumLoadingScreen />,
});

export default function ForumWrapper() {
  return <ForumClient />;
}
