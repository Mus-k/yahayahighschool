import { Suspense } from 'react';
import type { Metadata } from 'next';
import { cmsService } from '@/services/cms.service';
import LoginForm from './LoginForm';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale = 'en' } = await params;
  const pageData = await cmsService.getLoginPage(locale);

  return {
    title:
      pageData?.seo?.metaTitle ||
      pageData?.title ||
      'Login | Yahaya International Islamic and English High School',
    description:
      pageData?.seo?.metaDescription ||
      pageData?.tagline ||
      'Enterprise educational management platform for Yahaya International Islamic and English High School',
  };
}

export default async function LoginPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale = 'en' } = await params;
  let pageData = await cmsService.getLoginPage(locale);

  if (!pageData && locale !== 'en') {
    pageData = await cmsService.getLoginPage('en');
  }

  return (
    <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center" />}>
      <LoginForm data={pageData} locale={locale} />
    </Suspense>
  );
}
