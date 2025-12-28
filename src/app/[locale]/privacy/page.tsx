'use client';

import { useTranslations } from 'next-intl';
import { LegalPageLayout } from '@/components/LegalPageLayout';

export default function PrivacyPage() {
  const t = useTranslations('privacy');

  const sections = {
    overview: {
      title: t('sections.overview.title'),
      content: t('sections.overview.content'),
    },
    dataCollection: {
      title: t('sections.dataCollection.title'),
      content: t('sections.dataCollection.content'),
      items: t.raw('sections.dataCollection.items') as string[],
    },
    dataRetention: {
      title: t('sections.dataRetention.title'),
      content: t('sections.dataRetention.content'),
    },
    noPersonalData: {
      title: t('sections.noPersonalData.title'),
      content: t('sections.noPersonalData.content'),
      items: t.raw('sections.noPersonalData.items') as string[],
    },
    thirdParty: {
      title: t('sections.thirdParty.title'),
      content: t('sections.thirdParty.content'),
      items: t.raw('sections.thirdParty.items') as string[],
    },
    contact: {
      title: t('sections.contact.title'),
      content: t('sections.contact.content'),
    },
  };

  return (
    <LegalPageLayout
      title={t('title')}
      lastUpdated={t('lastUpdated', { date: '2025-01-01' })}
      sections={sections}
    />
  );
}
