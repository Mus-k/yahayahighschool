'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { motion, type Variants } from 'framer-motion';
import { ArrowRight, ChevronLeft, ChevronRight, Eye, Download } from 'lucide-react';
import { Swiper, SwiperSlide } from 'swiper/react';
import type { Swiper as SwiperType } from 'swiper';
import type { AboutCertificatesSectionComponent } from '@/types/cms.types';
import { getStrapiMediaUrl } from '@/services/cms.service';
import 'swiper/css';

const FALLBACK_CERTIFICATES = [
  { id: 1, title: 'Outstanding Academic Performance', image: '/images/about/cert-1.jpg', url: '/images/about/cert-1.jpg' },
  { id: 2, title: 'Global Educational Accreditation', image: '/images/about/cert-2.jpg', url: '/images/about/cert-2.jpg' },
  { id: 3, title: 'Diploma of Highest Achievement', image: '/images/about/cert-3.jpg', url: '/images/about/cert-3.jpg' },
  { id: 4, title: 'Certificate of Professional Excellence', image: '/images/about/cert-4.jpg', url: '/images/about/cert-4.jpg' },
  { id: 5, title: 'Innovation in Islamic Studies', image: '/images/about/sample-certificate.jpg', url: '/images/about/sample-certificate.jpg' },
];

const headerVariants: Variants = {
  hidden: { opacity: 0, y: -20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
};

function NavButton({
  dir,
  onClick,
  disabled,
}: {
  dir: 'prev' | 'next';
  onClick: () => void;
  disabled: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`group flex h-12 w-12 items-center justify-center rounded-full border transition-all 
        ${disabled 
          ? 'border-[#E9EAEC] text-[#D0D4DA] cursor-not-allowed' 
          : 'border-[#048ED6] text-[#048ED6] hover:bg-[#048ED6] hover:text-white cursor-pointer'
        }`}
      aria-label={dir === 'prev' ? 'Previous certificate' : 'Next certificate'}
    >
      {dir === 'prev' ? (
        <ChevronLeft className="h-5 w-5 rtl:-scale-x-100 transition-transform" />
      ) : (
        <ChevronRight className="h-5 w-5 rtl:-scale-x-100 transition-transform" />
      )}
    </button>
  );
}

export function AboutCertificateSection({ locale = 'en', data }: { locale?: string; data?: AboutCertificatesSectionComponent }) {
  const t = useTranslations('certificateSection');
  const [swiper, setSwiper] = useState<SwiperType | null>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const sync = (s: SwiperType) => {
    setAtStart(s.isBeginning);
    setAtEnd(s.isEnd);
  };

  const title = data?.title || t('title');
  const certificates = data?.certificates?.length ? data.certificates.map(c => ({
    id: c.id,
    title: c.title,
    image: c.image ? getStrapiMediaUrl(c.image) : (c.imageUrl || ''),
    url: c.file ? getStrapiMediaUrl(c.file) : (c.url || '')
  })) : FALLBACK_CERTIFICATES;

  return (
    <section className="w-full bg-[#F9FAFB] py-[clamp(2rem,6vw,8rem)] overflow-hidden">
      <div className="mx-auto max-w-[1920px]">
        <div className="px-[var(--spacing-side)]">
          
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.1 }}
              variants={headerVariants}
              className="max-w-[36rem]"
            >
              <h2 className="font-serif text-[clamp(2rem,3.1vw,3.75rem)] leading-[1.1] text-[#121C2A]">
                {title}
              </h2>
            </motion.div>

            <div className="hidden sm:flex items-center gap-4 shrink-0 pb-2">
              <NavButton dir="prev" onClick={() => swiper?.slidePrev()} disabled={atStart} />
              <NavButton dir="next" onClick={() => swiper?.slideNext()} disabled={atEnd} />
            </div>
          </div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.1 }}
            variants={headerVariants}
          >
            <Swiper
              onSwiper={(sw) => {
                setSwiper(sw);
                sync(sw);
              }}
              onSlideChange={sync}
              onResize={sync}
              speed={600}
              spaceBetween={23}
              slidesPerView={1.15}
              breakpoints={{
                769: { slidesPerView: 2 },
                1025: { slidesPerView: 3 },
                1281: { slidesPerView: 4 },
              }}
              className="cert-swiper mt-[clamp(2.5rem,4.7vw,5.7rem)]"
            >
              {certificates.map((cert) => (
                <SwiperSlide key={cert.id} className="h-auto">
                  <motion.article
                    variants={itemVariants}
                    className="h-full flex flex-col rounded-xl overflow-hidden bg-white border border-black/[0.06] shadow-[0_2px_14px_rgba(16,24,40,0.06)]"
                  >
                    <div 
                      className="w-full aspect-[4/3] overflow-hidden bg-gray-50 flex items-center justify-center p-6 border-b border-gray-100 cursor-pointer group relative"
                      onClick={() => setSelectedImage(cert.image)}
                    >
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors z-10 flex items-center justify-center">
                        <Eye className="text-white opacity-0 group-hover:opacity-100 w-8 h-8 transition-opacity duration-300" />
                      </div>
                      <img src={cert.image || ''} alt={cert.title} className="w-full h-full object-contain drop-shadow-sm group-hover:scale-105 transition-transform duration-500" />
                    </div>

                    <div className="flex flex-col flex-1 p-6">
                      <h3 className="font-medium text-[#1A1C1C] leading-[1.3] text-[clamp(1.0625rem,1.09vw,1.25rem)] text-center line-clamp-2">
                        {cert.title}
                      </h3>

                      <div className="mt-auto pt-6 flex items-center justify-center gap-3">
                        <button
                          type="button"
                          onClick={() => setSelectedImage(cert.image)}
                          className="flex-1 inline-flex justify-center items-center gap-2 py-2.5 rounded-lg border border-[#048ED6] text-[#048ED6] hover:bg-[#048ED6] hover:text-white transition-colors text-sm font-semibold cursor-pointer"
                        >
                          <Eye className="w-4 h-4" />
                          <span>{t('view')}</span>
                        </button>
                        {cert.url && (
                          <a
                            href={cert.url}
                            download
                            className="flex-1 inline-flex justify-center items-center gap-2 py-2.5 rounded-lg bg-[#048ED6] text-white hover:bg-[#037ab8] transition-colors text-sm font-semibold"
                          >
                            <Download className="w-4 h-4" />
                            <span>{t('download')}</span>
                          </a>
                        )}
                      </div>
                    </div>
                  </motion.article>
                </SwiperSlide>
              ))}
            </Swiper>
          </motion.div>

          <div className="sm:hidden mt-8 flex items-center justify-center gap-4">
            <NavButton dir="prev" onClick={() => swiper?.slidePrev()} disabled={atStart} />
            <NavButton dir="next" onClick={() => swiper?.slideNext()} disabled={atEnd} />
          </div>

        </div>
      </div>

      <style>{`
        .cert-swiper {
          padding: 6px;
          margin-inline: -6px;
        }
        .cert-swiper .swiper-slide { height: auto; display: flex; }
        .cert-swiper .swiper-slide > * { width: 100%; }
      `}</style>

      {/* Lightbox / Fancybox Modal */}
      {selectedImage && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 sm:p-8"
          onClick={() => setSelectedImage(null)}
        >
          <button 
            type="button"
            className="absolute top-6 right-6 p-2 text-white/70 hover:text-white bg-black/20 hover:bg-black/40 rounded-full transition-all"
            onClick={() => setSelectedImage(null)}
            aria-label="Close"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          
          <motion.img 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            src={selectedImage} 
            className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl" 
            onClick={(e) => e.stopPropagation()} 
            alt="Certificate Preview"
          />
        </div>
      )}
    </section>
  );
}
