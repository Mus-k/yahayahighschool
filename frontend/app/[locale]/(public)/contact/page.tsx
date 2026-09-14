import React from 'react';
import type { Metadata } from 'next';
import { PageHeader } from '@/components/public/shared/PageHeader';
import { ContactSection, ContactMap } from '@/components/public/contact/ContactSection';
import { cmsService } from '@/services/cms.service';

export async function generateMetadata({ params }: { params: Promise<{ locale?: string }> }): Promise<Metadata> {
  const { locale = 'en' } = await params;
  const page = await cmsService.getPageBySlug('contact', locale);
  return {
    title: page?.seo?.metaTitle || 'Contact | YAHAYASCHOOL',
    description: page?.seo?.metaDescription || "We're here to answer your questions and guide your child's educational journey towards Modern Islamic Excellence.",
  };
}

export default async function ContactPage({ params }: { params: Promise<{ locale?: string }> }) {
  const { locale = 'en' } = await params;
  const page = await cmsService.getPageBySlug('contact', locale);
  const contactInfo = await cmsService.fetchStrapi<any>('/contact-info', { locale, populate: '*' });

  return (
    <main className="min-h-screen bg-white">
      <PageHeader 
        title={page?.title || 'Get in Touch'} 
        crumb={page?.breadcrumbTitle || 'Contact'}
      >
        {page?.seo?.metaDescription || "We're here to answer your questions and guide your child's educational journey towards Modern Islamic Excellence."}
      </PageHeader>

      <ContactSection info={contactInfo} />

      <ContactMap info={contactInfo} />
    </main>
  );
}
