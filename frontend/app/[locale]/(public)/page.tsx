import React from 'react';
import type { Metadata } from 'next';
import { cmsService } from '@/services/cms.service';
import { HomepageBuilder } from '@/components/public/HomepageBuilder';

interface HomepageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: HomepageProps): Promise<Metadata> {
  const { locale } = await params;
  let homepage = null;
  try {
    homepage = await cmsService.getHomepage(locale);
  } catch (error) {
    console.warn('Failed to fetch homepage data for metadata (Strapi might be down).', error);
  }
  if (homepage?.seo) {
    return {
      title: homepage.seo.metaTitle || homepage.title || 'Welcome to YAHAYASCOOL',
      description: homepage.seo.metaDescription || 'Enterprise educational management platform for Yahaya International Islamic and English High School',
    };
  }

  const isArabic = locale === 'ar';
  return {
    title: isArabic ? 'يهايا سكول — المدرسة الإسلامية والإنجليزية الثانوية' : 'YAHAYASCOOL — Islamic & English High School',
    description: isArabic
      ? 'نصنع قادة المستقبل بدمج العلوم الحديثة مع التميز الأخلاقي والقرآني في بيئة تعليمية متكاملة.'
      : 'Empowering future Muslim leaders with world-class Western sciences, rigorous Islamic scholarship, and exemplary Qur\'anic moral excellence.',
  };
}

export default async function PublicHomepage({ params }: HomepageProps) {
  const { locale } = await params;

  let homepage = null;
  let academicPrograms: any[] = [];
  let newsPage = null;

  try {
    const results = await Promise.all([
      cmsService.getHomepage(locale).catch(() => null),
      cmsService.getSchoolAcademicPrograms(locale).catch(() => []),
      cmsService.getNewsPage(locale).catch(() => null),
    ]);
    homepage = results[0];
    academicPrograms = results[1] || [];
    newsPage = results[2];

    // Fallback to 'en' if homepage or newsPage missing in non-en locale
    if (!homepage && locale !== 'en') {
      homepage = await cmsService.getHomepage('en').catch(() => null);
    }
    if ((!academicPrograms || academicPrograms.length === 0) && locale !== 'en') {
      academicPrograms = await cmsService.getSchoolAcademicPrograms('en').catch(() => []);
    }
    if (!newsPage && locale !== 'en') {
      newsPage = await cmsService.getNewsPage('en').catch(() => null);
    }
  } catch (error) {
    console.warn('Failed to fetch homepage data (Strapi might be down). Rendering static UI.', error);
  }

  return (
    <HomepageBuilder
      homepage={homepage}
      academicPrograms={academicPrograms}
      newsPage={newsPage}
      sections={homepage?.sections}
      locale={locale}
    />
  );
}
