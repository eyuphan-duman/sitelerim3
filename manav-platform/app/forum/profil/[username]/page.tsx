import { Metadata } from 'next';
import ProfilClient from './ProfilClient';

type Props = {
  params: Promise<{ username: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const resolvedParams = await params;
  const username = decodeURIComponent(resolvedParams.username);
  return {
    title: `@${username} - Psikoloji Forumu`,
    description: `${username} kullanıcısının Furkan Manav psikoloji forumu profili.`,
  };
}

export default async function Page({ params }: Props) {
  const resolvedParams = await params;
  const username = decodeURIComponent(resolvedParams.username);
  return <ProfilClient username={username} />;
}
