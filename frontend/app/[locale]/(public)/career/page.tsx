import React from 'react';
import type { Metadata } from 'next';
import { CareerHero, CareerBoard } from '@/components/public/career/CareerSections';
import { cmsService } from '@/services/cms.service';
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const pageData = await cmsService.getPageBySlug('career', locale);

  if (pageData?.seo) {
    return {
      title: pageData.seo.metaTitle || 'Career | YAHAYASCHOOL',
      description: pageData.seo.metaDescription || 'We seek visionary educators and staff committed to nurturing the next generation of global leaders.',
    };
  }

  return {
    title: 'Career | YAHAYASCHOOL',
    description: 'We seek visionary educators and staff committed to nurturing the next generation of global leaders.',
  };
}

export default async function CareerPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const [positions, pageData, careerSetting] = await Promise.all([
    cmsService.getCareerPositions(locale),
    cmsService.getPageBySlug('career', locale),
    cmsService.getCareerSetting(locale)
  ]);

  return (
    <main className="min-h-screen bg-white">
      <CareerHero pageData={pageData} hasPositions={positions && positions.length > 0} />

      <CareerBoard positions={positions} careerSetting={careerSetting} />
    </main>
  );
}
