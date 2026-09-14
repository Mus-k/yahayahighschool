import React from 'react';
import type { Metadata } from 'next';
import {
  GalleryHero,
  PhotoGrid,
  VideoHighlights,
  VisitCta,
} from '@/components/public/gallery/GallerySections';
import { cmsService } from '@/services/cms.service';

export const metadata: Metadata = {
  title: 'Gallery | YAHAYASCHOOL',
  description:
    'Life at Yahaya International — photographs and films from across our campus and community.',
};

export default async function GalleryPage({ params }: { params: Promise<{ locale?: string }> }) {
  const { locale = 'en' } = await params;
  const items = await cmsService.getGalleryItems(locale, 100);

  return (
    <main className="min-h-screen bg-white">
      <GalleryHero />
      <PhotoGrid items={items} />
      <VideoHighlights />
      <VisitCta />
    </main>
  );
}
