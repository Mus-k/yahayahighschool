import React from 'react';
import type { Metadata } from 'next';
import { getLocale, getTranslations } from 'next-intl/server';
import { cmsService } from '@/services/cms.service';
import { MissionVisionSection } from '@/components/public/about/MissionVisionSection';
import { AboutIntroSection } from '@/components/public/about/AboutIntroSections';
import { PageHeader } from '@/components/public/shared/PageHeader';
import { CoreValuesBar, FoundingDirectorSection } from '@/components/public/about/AboutValuesDirector';
import { WhyChooseSection } from '@/components/public/about/AboutWhyChooseCta';
import { PursuitCta } from '@/components/public/shared/PursuitCta';
import { AboutTimelineSection } from '@/components/public/about/AboutTimelineSection';
import { AboutCertificateSection } from '@/components/public/about/AboutCertificateSection';
import type {
  AboutIntroSectionComponent,
  AboutMissionVisionSectionComponent,
  AboutValuesSectionComponent,
  AboutDirectorSectionComponent,
  AboutWhyChooseSectionComponent,
  AboutTimelineSectionComponent,
  AboutCertificatesSectionComponent
} from '@/types/cms.types';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const pageData = await cmsService.getAboutPage(locale);
  
  if (pageData?.seo) {
    return {
      title: pageData.seo.metaTitle || pageData.title,
      description: pageData.seo.metaDescription,
    };
  }

  return {
    title: 'About Us | YAHAYASCHOOL',
    description: 'Learn about our history, mission, leadership, and dual academic curriculum.',
  };
}

export default async function AboutUsPage() {
  const locale = await getLocale();
  const t = await getTranslations({ locale, namespace: 'pageHeaders.about' });
  const pageData = await cmsService.getAboutPage(locale);

  const title = pageData?.title || t('title');
  const description = pageData?.seo?.metaDescription || t('description');
  const breadcrumb = pageData?.breadcrumbTitle || title;

  const introData = pageData?.introSection;
  const missionVisionData = pageData?.missionVisionSection;
  const valuesData = pageData?.valuesSection;
  const directorData = pageData?.directorSection;
  const whyChooseData = pageData?.whyChooseSection;
  const timelineData = pageData?.timelineSection;
  const certificatesData = pageData?.certificatesSection;

  return (
    <main className="min-h-screen bg-white">
      
      <PageHeader title={title} crumb={breadcrumb}>
        {description}
      </PageHeader>

      <AboutIntroSection data={introData} />

      {/* Mission & Vision — crest is a real SVG mask, see MissionVisionSection */}
      <MissionVisionSection data={missionVisionData} />

      <CoreValuesBar data={valuesData} />

      <FoundingDirectorSection data={directorData} />

      <WhyChooseSection data={whyChooseData} />

      <AboutTimelineSection data={timelineData} />

      <AboutCertificateSection data={certificatesData} />

      <PursuitCta />

    </main>
  );
}
