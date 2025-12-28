'use client';

import { useTranslations } from 'next-intl';
import { LegalPageLayout } from '@/components/LegalPageLayout';

export default function TermsPage() {
  const t = useTranslations('terms');

  const sections = {
    acceptance: {
      title: t('sections.acceptance.title'),
      content: t('sections.acceptance.content'),
    },
    serviceDescription: {
      title: t('sections.serviceDescription.title'),
      content: t('sections.serviceDescription.content'),
    },
    prohibitedUse: {
      title: t('sections.prohibitedUse.title'),
      content: t('sections.prohibitedUse.content'),
      items: t.raw('sections.prohibitedUse.items') as string[],
    },
    noGuarantee: {
      title: t('sections.noGuarantee.title'),
      content: t('sections.noGuarantee.content'),
      items: t.raw('sections.noGuarantee.items') as string[],
    },
    dataExpiration: {
      title: t('sections.dataExpiration.title'),
      content: t('sections.dataExpiration.content'),
    },
    limitation: {
      title: t('sections.limitation.title'),
      content: t('sections.limitation.content'),
    },
    changes: {
      title: t('sections.changes.title'),
      content: t('sections.changes.content'),
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
