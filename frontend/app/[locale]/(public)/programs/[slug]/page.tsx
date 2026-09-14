import React from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { cmsService } from '@/services/cms.service';
import { ProgramHero, ProgramPathway } from '@/components/public/academic/AcademicDetail';
import { AcademicApproach } from '@/components/public/academic/AcademicSections';
import type { SchoolAcademicProgramEntity } from '@/types/cms.types';

interface ProgramDetailProps {
  params: Promise<{ locale: string; slug: string }>;
}

const KNOWN_SLUGS = ['english', 'arabic', 'quran-memorization', 'dawah', 'online'];

export async function generateStaticParams() {
  try {
    const programs = await cmsService.getSchoolAcademicPrograms('en', 100);
    if (programs && programs.length > 0) {
      return programs.map((p) => ({ slug: p.slug }));
    }
  } catch {
    // Fallback if CMS is offline during build
  }
  return KNOWN_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: ProgramDetailProps): Promise<Metadata> {
  const { slug, locale } = await params;
  let program = await cmsService.getSchoolAcademicProgramBySlug(slug, locale);
  if (!program && locale !== 'en') {
    program = await cmsService.getSchoolAcademicProgramBySlug(slug, 'en');
  }

  if (program?.seo) {
    return {
      title: program.seo.metaTitle || `${program.title} | YAHAYASCHOOL`,
      description: program.seo.metaDescription || program.description || program.shortDescription || 'Program details',
    };
  }

  if (program) {
    return {
      title: `${program.title} | YAHAYASCHOOL`,
      description: program.description || program.shortDescription || 'Program details',
    };
  }

  return {
    title: `${slug.charAt(0).toUpperCase() + slug.slice(1)} Program | YAHAYASCHOOL`,
    description: 'Academic program details and curriculum pathway at Yahaya International.',
  };
}

export default async function ProgramDetailPage({ params }: ProgramDetailProps) {
  const { locale, slug } = await params;

  // 1. Fetch program from Strapi
  let program: SchoolAcademicProgramEntity | null = null;
  try {
    program = await cmsService.getSchoolAcademicProgramBySlug(slug, locale);
    if (!program && locale !== 'en') {
      program = await cmsService.getSchoolAcademicProgramBySlug(slug, 'en');
    }
  } catch (error) {
    console.warn(`[Programs] Failed to fetch program slug "${slug}" from Strapi:`, error);
  }

  // 2. Fetch approach section and page data from Strapi
  let pageData = null;
  try {
    pageData = await cmsService.getSchoolAcademicProgramsPage(locale);
    if (!pageData && locale !== 'en') {
      pageData = await cmsService.getSchoolAcademicProgramsPage('en');
    }
  } catch (error) {
    console.warn('[Programs] Failed to fetch pageData from Strapi:', error);
  }

  // 3. Fallback for standard known programs if Strapi is offline or unseeded
  if (!program) {
    if (KNOWN_SLUGS.includes(slug)) {
      program = {
        id: 0,
        slug,
        title: `${slug.charAt(0).toUpperCase() + slug.slice(1)} Program`,
        description: `Explore our comprehensive ${slug} program designed to nurture academic excellence, intellectual curiosity, and moral character in a supportive environment.`,
        eyebrow: 'Academic Excellence',
        headlineLine2: 'Excellence Built for Life.',
        pathwayTitle: 'The Learning Pathway',
        pathwayDescription: 'Our curriculum is structured to guide students step-by-step towards mastery, ensuring deep understanding and practical application.',
        pathwaySteps: [],
      };
    } else {
      notFound();
    }
  }

  return (
    <main className="min-h-screen bg-white">
      <ProgramHero program={program} />
      <ProgramPathway program={program} />
      <AcademicApproach pageData={pageData} />
    </main>
  );
}
