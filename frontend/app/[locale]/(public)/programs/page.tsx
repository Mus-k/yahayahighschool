import React from 'react';
import type { Metadata } from 'next';
import { cmsService } from '@/services/cms.service';
import {
  AcademicHero,
  AcademicPrograms,
  AcademicApproach,
} from '@/components/public/academic/AcademicSections';

export async function generateMetadata({ params }: { params: Promise<{ locale?: string }> }): Promise<Metadata> {
  const { locale = 'en' } = await params;
  const pageData = await cmsService.getSchoolAcademicProgramsPage(locale);

  if (pageData?.seo) {
    return {
      title: pageData.seo.metaTitle || pageData.title || 'Academic Programs | YAHAYASCHOOL',
      description: pageData.seo.metaDescription || pageData.lede || 'Rigorous academics, Islamic character, and global readiness.',
    };
  }

  return {
    title: pageData?.title ? `${pageData.title} | YAHAYASCHOOL` : 'Academic Programs | YAHAYASCHOOL',
    description: pageData?.lede || 'Rigorous academics, Islamic character, and global readiness.',
  };
}

export default async function ProgramsPage({ params }: { params: Promise<{ locale?: string }> }) {
  const { locale = 'en' } = await params;

  let pageData = await cmsService.getSchoolAcademicProgramsPage(locale);
  if (!pageData && locale !== 'en') {
    pageData = await cmsService.getSchoolAcademicProgramsPage('en');
  }

  let programs = await cmsService.getSchoolAcademicPrograms(locale, 50);
  if ((!programs || programs.length === 0) && locale !== 'en') {
    programs = await cmsService.getSchoolAcademicPrograms('en', 50);
  }

  return (
    <main className="min-h-screen bg-white">
      <AcademicHero pageData={pageData} />
      <AcademicPrograms locale={locale} programs={programs} />
      <AcademicApproach pageData={pageData} />
    </main>
  );
}
