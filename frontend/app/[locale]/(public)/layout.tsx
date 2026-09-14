import React from 'react';
import { Topbar } from '@/components/public/Topbar';
import { Navbar } from '@/components/public/Navbar';
import { Footer } from '@/components/public/Footer';
import { PolicyModal } from '@/components/public/shared/PolicyModal';
import { cmsService } from '@/services/cms.service';

import { routing } from '@/i18n/routing';

interface PublicLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export default async function PublicLayout({ children, params }: PublicLayoutProps) {
  const { locale } = await params;

  // If locale is not valid (e.g. static assets leaking through), render children directly
  if (!routing.locales.includes(locale as any)) {
    return <>{children}</>;
  }

  // Fetch dynamic header menu, topbar menu, and footer configuration from Strapi CMS
  const [headerMenu, topbarMenu, footerConfig, contactInfo] = await Promise.all([
    cmsService.getNavigationMenu('header', locale),
    cmsService.getNavigationMenu('topbar', locale),
    cmsService.getFooterConfig(locale),
    cmsService.getContactInfo(locale),
  ]);

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Navbar locale={locale} menu={headerMenu} topbarMenu={topbarMenu} contactInfo={contactInfo} />
      <div className="flex-1">
        {children}
      </div>
      <Footer config={footerConfig} locale={locale} contactInfo={contactInfo} />
      <PolicyModal />
    </div>
  );
}
