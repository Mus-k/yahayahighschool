import React from 'react';
import type { Metadata } from 'next';
import { useTranslations } from 'next-intl';
import { getTranslations } from 'next-intl/server';
import { PageHeader } from '@/components/public/shared/PageHeader';
import { PursuitCta } from '@/components/public/shared/PursuitCta';
import { StaffGrid } from '@/components/public/staff/StaffGrid';
import { cmsService } from '@/services/cms.service';

export const metadata: Metadata = {
  title: 'Staffs | YAHAYASCHOOL',
  description: 'Our faculty members are more than educators; they are mentors.',
};

export default async function StaffsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'pageHeaders.staffs' });
  const navT = await getTranslations({ locale, namespace: 'publicNav' });
  const staffMembers = await cmsService.getStaffMembers(locale);
  const pageData = await cmsService.getPageBySlug('staffs', locale);

  return (
    <main className="min-h-screen bg-white">
      <PageHeader 
        title={pageData?.title || t('title')} 
        crumb={pageData?.breadcrumbTitle}
        subMaxWidth={700}
        parentPage={{ label: navT('about'), href: '/about' }}
      >
        {pageData?.seo?.metaDescription || t('description')}
      </PageHeader>

      <StaffGrid initialStaff={staffMembers} />

      <PursuitCta />
    </main>
  );
}
