import React from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { cmsService } from '@/services/cms.service';
import { HomepageBuilder } from '@/components/public/HomepageBuilder';

interface CustomPageProps {
  params: Promise<{ locale: string; slug: string }>;
}

export async function generateMetadata({ params }: CustomPageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  const page = await cmsService.getPageBySlug(slug, locale);

  if (!page) {
    return { title: 'Page Not Found | YAHAYASCOOL' };
  }

  return {
    title: page.seo?.metaTitle || `${page.title} | YAHAYASCOOL`,
    description: page.seo?.metaDescription || `Official YAHAYASCOOL page for ${page.title}`,
  };
}

export default async function CustomDynamicPage({ params }: CustomPageProps) {
  const { locale, slug } = await params;
  const page = await cmsService.getPageBySlug(slug, locale);

  if (!page) {
    notFound();
  }

  if (page.sections && page.sections.length > 0) {
    return <HomepageBuilder sections={page.sections} locale={locale} />;
  }

  return (
    <main className="min-h-screen bg-white pb-24">
      {/* Hero Header */}
      <section className="bg-gradient-to-br from-emerald-950 via-emerald-900 to-emerald-950 text-white py-20 relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 sm:px-8 relative z-10 text-center">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white mb-6">
            {page.title}
          </h1>
        </div>
      </section>

      {/* Basic Text Body */}
      <div className="max-w-4xl mx-auto px-4 sm:px-8 mt-14">
        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-gray-200/80 shadow-xs">
          <p className="text-gray-700 leading-relaxed">
            Content for {page.title} is being managed by the school administration via Strapi CMS.
          </p>
        </div>
      </div>
    </main>
  );
}
