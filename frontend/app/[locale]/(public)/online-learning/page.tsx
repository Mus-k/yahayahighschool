import React from 'react';
import type { Metadata } from 'next';
import { OnlineLearning } from '@/components/public/online/OnlineSections';
import { AcademicApproach } from '@/components/public/academic/AcademicSections';
import { cmsService } from '@/services/cms.service';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale = 'en' } = await params;
  const pageData = await cmsService.getOnlineLearningPage(locale);
  return {
    title: pageData?.seo?.metaTitle || `${pageData?.title || 'Online Learning'} | YAHAYASCHOOL`,
    description:
      pageData?.seo?.metaDescription ||
      pageData?.lede ||
      'Access world-class Islamic and academic education from anywhere in the world.',
  };
}

export default async function OnlineLearningPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale = 'en' } = await params;
  const [pageData, courses] = await Promise.all([
    cmsService.getOnlineLearningPage(locale),
    cmsService.getOnlineCourses(locale),
  ]);

  const approachPageData = pageData
    ? {
        id: pageData.id,
        approachTagline: pageData.approachTagline,
        approachTitle: pageData.approachTitle,
        approachImage: pageData.approachImage,
        approachStatValue: pageData.approachStatValue,
        approachStatDescription: pageData.approachStatDescription,
        approachItems: pageData.approachItems,
      }
    : null;

  return (
    <main className="min-h-screen bg-white">
      <OnlineLearning locale={locale} pageData={pageData} courses={courses} />
      <AcademicApproach pageData={approachPageData as any} />
    </main>
  );
}
