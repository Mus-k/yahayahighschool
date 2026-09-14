'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, Phone, Mail, X, Container } from 'lucide-react';
import type { HeroSectionComponent, HomepageEntity } from '../../../types/cms.types';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, Autoplay, EffectFade } from 'swiper/modules';
import { useTranslations } from 'next-intl';
import { getStrapiMediaUrl } from '@/services/cms.service';

import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/effect-fade';

interface HeroProps {
  data?: HeroSectionComponent | HomepageEntity | any;
  locale?: string;
}

export function HeroSection({ data, locale = 'en' }: HeroProps) {
  const t = useTranslations('hero');
  const [isOpen, setIsOpen] = React.useState(false);

  const homepage = data as HomepageEntity | undefined;
  const legacyHero = data as HeroSectionComponent | undefined;

  // Escape closes the contact menu — the backdrop handles pointer dismissal,
  // this covers keyboard users.
  React.useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen]);
  const [paginationEl, setPaginationEl] = React.useState<HTMLElement | null>(null);
  const [swiperInstance, setSwiperInstance] = React.useState<any>(null);
  const ctaText = homepage?.heroPrimaryCtaText || legacyHero?.primaryCtaText || t('startApplication');
  const ctaUrl = homepage?.heroPrimaryCtaUrl || legacyHero?.primaryCtaUrl || "/contact";
  const establishedText = homepage?.heroEstablishedText || t('established');
  const heroPhone = homepage?.heroPhone || "+23188368801";
  const heroEmail = homepage?.heroEmail || "info@yahayaschool.com";
  const heroWhatsapp = homepage?.heroWhatsapp || "23188368801";

  React.useEffect(() => {
    if (swiperInstance && paginationEl && swiperInstance.params.pagination) {
      // @ts-ignore - params.pagination can be typed as boolean in swiper's types
      swiperInstance.params.pagination.el = paginationEl;
      swiperInstance.pagination.destroy();
      swiperInstance.pagination.init();
      swiperInstance.pagination.render();
      swiperInstance.pagination.update();
    }
  }, [swiperInstance, paginationEl]);

  const getHref = (url: string) => {
    if (url.startsWith('http') || url.startsWith('#')) return url;
    if (locale === 'en' || !locale) return url;
    const cleanUrl = url.startsWith('/') ? url : `/${url}`;
    return cleanUrl === '/' ? `/${locale}` : `/${locale}${cleanUrl}`;
  };

  // Manual click handler to bypass Swiper's broken loop index mapping
  const handlePaginationClick = (e: React.MouseEvent) => {
    if (!swiperInstance || !paginationEl) return;
    const target = e.target as HTMLElement;
    if (target.classList.contains('swiper-pagination-bullet')) {
      const bullets = Array.from(paginationEl.children);
      const index = bullets.indexOf(target);
      if (index !== -1) {
        // Use slideToLoop for accurate navigation when loop={true}
        swiperInstance.slideToLoop(index);
      }
    }
  };

  const defaultSlides = [
    {
      id: 1,
      image: '/images/figma-home/19.png',
      titlePart1: t('slide1Title1'),
      titlePart2: t('slide1Title2'),
      description: legacyHero?.subtitle || t('slide1Desc'),
    },
    {
      id: 2,
      image: '/images/figma-home/slide2-new.png',
      titlePart1: t('slide2Title1'),
      titlePart2: t('slide2Title2'),
      description: t('slide2Desc'),
    },
    {
      id: 3,
      image: '/images/figma-home/17.png',
      titlePart1: t('slide3Title1'),
      titlePart2: t('slide3Title2'),
      description: t('slide3Desc'),
    }
  ];

  const slides = (homepage?.heroSlides && homepage.heroSlides.length > 0)
    ? homepage.heroSlides.map((slide, i) => ({
        id: slide.id || i + 1,
        image: getStrapiMediaUrl(slide.image?.url) || defaultSlides[i % defaultSlides.length].image,
        titlePart1: slide.titlePart1 || defaultSlides[i % defaultSlides.length].titlePart1,
        titlePart2: slide.titlePart2 || defaultSlides[i % defaultSlides.length].titlePart2,
        description: slide.description || defaultSlides[i % defaultSlides.length].description,
      }))
    : defaultSlides;


  return (
    <>
      <style>{`
        /* Pagination Styling */
        .hero-pagination .swiper-pagination-bullet {
          width: 14px;
          height: 14px;
          background-color: #d1d5db; /* Light gray inner */
          border: 1.5px solid #0066ff; /* Blue border */
          opacity: 1;
          border-radius: 50%;
          transition: all 0.3s ease;
          margin: 0 6px !important;
          cursor: pointer;
          pointer-events: auto;
          position: relative;
          z-index: 50;
        }
        .hero-pagination .swiper-pagination-bullet-active {
          width: 36px;
          background-color: #0066ff; /* Solid blue */
          border-color: #0066ff;
          border-radius: 14px;
        }

        /* Ken Burns (Scale) Effect for Background Image */
        @keyframes zoomIn {
          0% { transform: scale(1); }
          100% { transform: scale(1.05); }
        }
        .hero-bg-image {
          animation: none; /* Reset animation when not active */
        }
        .swiper-slide-active .hero-bg-image {
          animation: zoomIn 7s linear forwards; /* 7s duration to match autoplay delay + transition speed */
        }

        /* Swiper's stylesheet is injected AFTER Tailwind's, so its bare rules
           (.swiper{position:relative} .swiper-slide{display:block;height:100%})
           beat equal-specificity utility classes. Two-class selectors win. */
        .hero-swiper.swiper { height: auto; }
        .hero-swiper .swiper-wrapper { height: auto; }
        .hero-swiper .swiper-slide {
          display: flex;
          flex-direction: column;
          height: auto;
        }
        /* keep in sync with --breakpoint-lg in globals.css */
        @media (min-width: 1281px) {
          .hero-swiper.swiper,
          .hero-swiper .swiper-wrapper,
          .hero-swiper .swiper-slide { height: 100%; }
        }
      `}</style>

      <section className="w-full relative lg:h-[calc(100vh-150px)] z-20 overflow-hidden border-b max-h-275 border-white">
        <div className='w-full h-full relative'>
          <Swiper
            modules={[Pagination, Autoplay, EffectFade]}
            effect="fade"
            fadeEffect={{ crossFade: true }}
            pagination={{ el: paginationEl, clickable: false }}
            onSwiper={setSwiperInstance}
            speed={1500}
            autoplay={{ delay: 5000, disableOnInteraction: false }}
            loop={true}
            className="hero-swiper"
          >
            {slides.map((slide) => (
              <SwiperSlide key={slide.id} className='group/slide bg-black w-full relative'>
                {/* Background Image Container */}
                <div className="absolute inset-0 z-0 w-full h-full pointer-events-none overflow-hidden">
                  <div className="w-full h-full relative hero-bg-image">
                    <img src={slide.image} alt="hero" className="w-full h-full object-cover" />
                  </div>
                  {/* Dark gradient overlay for text readability (kept above the image so it doesn't scale) */}
                  <div className="absolute inset-0 bg-black/40 z-10" />
                </div>
                {/* Content Container */}
                <div className='max-w-[1920px] mx-auto  relative  h-full w-full'>
                  <div className='main-container pb-(--spacing-side) max-lg:pb-[80px] max-sm:pt-[150px] sm:pt-[100px] px-(--spacing-side) mx-auto grid grid-cols-1 justify-end items-end w-full h-full relative'>
                    <div className="flex flex-col lg:flex-row max-lg:h-fit justify-between items-end gap-5 lg:gap-12 md:gap-8 w-full max-md:pr-[50px]">

                      {/* Left Column */}
                      <div className="flex-1 w-full text-white">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md border border-white/20 text-[10px] font-bold mb-4 opacity-0 group-[&.swiper-slide-active]/slide:opacity-100 duration-500 group-[&.swiper-slide-active]/slide:delay-400 translate-y-5 group-[&.swiper-slide-active]/slide:translate-y-0 overflow-hidden">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="tracking-widest uppercase">{establishedText}</span>
                        </div>


                        <h1 className="text-4xl line-clamp-3 md:text-5xl lg:text-[3.5rem] font-bold leading-[1.03] tracking-tight text-white drop-shadow-md opacity-0 group-[&.swiper-slide-active]/slide:opacity-100 duration-500 group-[&.swiper-slide-active]/slide:delay-500 translate-y-5 group-[&.swiper-slide-active]/slide:translate-y-0 overflow-hidden">
                          {slide.titlePart1} <br className="max-md:hidden" />
                          <span className="italic font-medium">{slide.titlePart2}</span>
                        </h1>
                      </div>

                      {/* Right Column */}
                      <div className="flex-1 w-full xl:max-w-[450px]  lg:max-w-[350px] text-white">
                        <p className="max-md:text-[16px] line-clamp-4 text-[18px] leading-relaxed md:mb-6 mb-5 text-gray-100 drop-shadow-sm font-regular opacity-0 group-[&.swiper-slide-active]/slide:opacity-100 duration-500 group-[&.swiper-slide-active]/slide:delay-600 translate-y-5 group-[&.swiper-slide-active]/slide:translate-y-0 overflow-hidden">
                          {slide.description}
                        </p>
                        <div className='opacity-0 group-[&.swiper-slide-active]/slide:opacity-100 duration-500 group-[&.swiper-slide-active]/slide:delay-700 translate-y-5 group-[&.swiper-slide-active]/slide:translate-y-0 overflow-hidden'>
                          <Link
                            href={getHref(ctaUrl)}
                            className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-white text-gray-900 font-bold text-xs hover:bg-gray-100 transition-colors shadow-xl"
                          >
                            <span>{ctaText}</span>
                            <ArrowRight className="w-4 h-4 rtl:rotate-180" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
          {/* Backdrop — blurs the page behind the menu; click anywhere to dismiss.
              z sits above the bottom curve (z-500) so the blur covers it, and
              below the menu itself. */}
          <button
            type="button"
            aria-label="Close contact menu"
            tabIndex={isOpen ? 0 : -1}
            onClick={() => setIsOpen(false)}
            className={`fixed inset-0 z-[900] cursor-default bg-black/25 transition-opacity duration-300 ${
              // Filter only while open. Left on permanently, an invisible
              // backdrop-filter still forces the compositor to keep filtering
              // the page behind it, which some engines render badly.
              isOpen ? 'opacity-100 backdrop-blur-md' : 'opacity-0 pointer-events-none'
            }`}
          />

          {/* Floating Contact Menu */}
          <div dir="ltr" className="absolute right-0 top-1/2 -translate-y-1/2 z-[901] flex items-center">
            {/* Expanded items */}
            <div
              className={`absolute right-14 flex flex-col gap-3 transition-all duration-300 origin-right ${isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-50 pointer-events-none'
                }`}
            >
              <div className="ml-[20px]">
                <a
                  href={`tel:${heroPhone.replace(/\s+/g, '')}`}
                  className="w-12 h-12 rounded-full bg-[#0ea5e9] text-white flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
                  title="Call Us"
                >
                  <Phone className="w-5 h-5" fill="currentColor" />
                </a>
              </div>
              <div className="">
                <a
                  href={`mailto:${heroEmail}`}
                  className="w-12 h-12 rounded-full bg-[#0ea5e9] text-white flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
                  title="Email Us"
                >
                  <Mail className="w-5 h-5" />
                </a>
              </div>
              <div className="ml-[20px]">
                <a
                  href={`https://wa.me/${heroWhatsapp.replace(/[^0-9]/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-12 h-12 rounded-full bg-[#0ea5e9] text-white flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
                  title="WhatsApp Us"
                >
                  <div className="w-7 h-7 bg-[#25D366] rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
                    </svg>
                  </div>
                </a>
              </div>

            </div>

            {/* Toggle Button */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="w-16 bg-white rounded-l-full cursor-pointer flex items-center justify-start pl-[10px] h-[50px] justify-center shadow-xl transition-all"
              aria-label="Toggle contact menu"
            >
              <div className={`w-8 h-8 rounded-full bg-[#22c55e] text-white flex items-center justify-center transition-transform duration-300 ${isOpen ? 'rotate-90' : ''}`}>
                {isOpen ? <X className="w-4 h-4" /> : <Phone className="w-4 h-4" fill="currentColor" />}
              </div>
            </button>
          </div>
          {/* Bottom Curve & Slider Dots */}
          <div className="absolute sm:bottom-[-58px] bottom-0 left-1/2 -translate-x-1/2 w-full z-500 flex justify-center items-center">
            <img
              src="/hero-under.webp"
              alt="Curve"
              className="object-contain max-w-[800px] max-h-[169px] pointer-events-none max-sm:hidden  w-full h-full"
              style={{ objectFit: 'fill' }}
            />
            {/* Slider Dots */}
            <div className="absolute sm:bottom-[70px] bottom-8 left-1/2 -translate-x-1/2 flex items-center justify-center pointer-events-auto z-10">
              <div ref={setPaginationEl} onClick={handlePaginationClick} className="hero-pagination flex items-center justify-center pointer-events-auto"></div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

