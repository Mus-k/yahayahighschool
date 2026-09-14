import React from 'react';
import type { Metadata } from 'next';
import {
  DonationHero,
  GiveSection,
  TargetedGiving,
  WallOfGratitude,
} from '@/components/public/donation/DonationSections';
import { cmsService } from '@/services/cms.service';

export const metadata: Metadata = {
  title: 'Donation | YAHAYASCHOOL',
  description:
    'Your contribution nurtures faith, knowledge, and character at Yahaya International.',
};

export default async function DonationsPage({ params }: { params: Promise<{ locale?: string }> }) {
  const { locale = 'en' } = await params;
  const page = await cmsService.getPageBySlug('donations', locale);
  const campaigns = await cmsService.getDonationCampaigns(locale);
  const settings = await cmsService.getDonationSettings(locale);

  return (
    <main className="min-h-screen bg-white">
      <DonationHero 
        title={page?.title} 
        description={page?.seo?.metaDescription} 
        bulletPoints={page?.bulletPoints}
        coverImage={page?.coverImage}
        breadcrumbTitle={page?.breadcrumbTitle}
      />
      <GiveSection settings={settings || undefined} />
      <TargetedGiving campaigns={campaigns} settings={settings || undefined} />
      <WallOfGratitude settings={settings || undefined} />
    </main>
  );
}
