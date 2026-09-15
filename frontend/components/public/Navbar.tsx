'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from '@/i18n/routing';
import { ChevronDown, ChevronRight, ArrowRight, User, HandHeart, GraduationCap } from 'lucide-react';
import { LanguageSwitcher } from './LanguageSwitcher';
import { Container } from '../ui/Container';
import { useTranslations } from 'next-intl';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Parallax } from 'swiper/modules';
import type { Swiper as SwiperType } from 'swiper';
import { useLenis } from 'lenis/react';
import 'swiper/css';
import type { StaticImport } from 'next/dist/shared/lib/get-img-props';

export interface AboutMenuOption {
  id: string;
  label: string;
  href: string;
  image: string | StaticImport;
  badge: string;
}

export function Navbar({
  locale = 'en',
  menu,
  topbarMenu,
  contactInfo
}: {
  locale?: string;
  menu?: any;
  topbarMenu?: any;
  contactInfo?: any;
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileAboutOpen, setMobileAboutOpen] = useState(false);
  const [aboutDropdownOpen, setAboutDropdownOpen] = useState(false);
  const [activeAboutMenu, setActiveAboutMenu] = useState('about');
  const lenis = useLenis();
  const swiperRef = useRef<SwiperType | null>(null);
  const pathname = usePathname();
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollY = useRef(0);
  const t = useTranslations('publicNav');

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const delta = currentScrollY - lastScrollY.current;

      // Ignore micro-scrolls from Lenis animation frames (< 8px)
      if (Math.abs(delta) < 8) return;

      if (delta > 0 && currentScrollY > 80) {
        setIsVisible(false);
      } else if (delta < 0) {
        setIsVisible(true);
      }
      lastScrollY.current = currentScrollY;
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setAboutDropdownOpen(false);
    setMobileMenuOpen(false);
    setMobileAboutOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (mobileMenuOpen) {
      lenis?.stop();
    } else {
      lenis?.start();
    }
    return () => {
      lenis?.start();
    };
  }, [mobileMenuOpen, lenis]);

  // ── Social icon helper ──────────────────────────────────
  const getSocialIconClass = (rawName?: string) => {
    if (!rawName) return 'icon-link';
    const name = rawName.toLowerCase().trim().replace(/^icon-/, '');
    if (name === 'twitter' || name === 'x') return 'icon-x';
    if (name === 'facebook' || name === 'fb') return 'icon-facebook';
    if (name === 'instagram' || name === 'insta' || name === 'ig') return 'icon-instagram';
    if (name === 'youtube' || name === 'yt') return 'icon-youtube';
    if (name === 'linkedin') return 'icon-linkedin';
    if (name === 'tiktok') return 'icon-tiktok';
    if (name === 'whatsapp') return 'icon-whatsapp';
    return `icon-${name}`;
  };

  const socialLinks =
    contactInfo?.socialMedia?.length > 0
      ? contactInfo.socialMedia.map((s: any) => ({
          title: s.title || s.name || s.platform || 'Social Media',
          url: s.url,
          icon: getSocialIconClass(s.icon || s.platform || s.title || s.name || ''),
        }))
      : [
          { title: 'Facebook', url: 'https://facebook.com', icon: 'icon-facebook' },
          { title: 'X', url: 'https://x.com', icon: 'icon-x' },
          { title: 'YouTube', url: 'https://youtube.com', icon: 'icon-youtube' },
          { title: 'Instagram', url: 'https://instagram.com', icon: 'icon-instagram' },
        ];

  // ── Nav item helpers ──────────────────────────────────
  const isOnlineLearning = (url?: string) => Boolean(url && url.includes('online-learning'));

  const isAboutItem = (item: any) => {
    if (!item) return false;
    if (item.subItems && item.subItems.length > 0) return true;
    const url = (item.url || '').toLowerCase();
    if (url === '/about' || url === 'about' || url.includes('/about')) return true;
    const title = (item.title || '').toLowerCase();
    return (
      title.includes('about') ||
      title.includes('hakkımızda') ||
      title.includes('propos') ||
      title.includes('حول')
    );
  };

  const isDonationItem = (item: any) => {
    const url = (item.url || '').toLowerCase();
    const title = (item.title || '').toLowerCase();
    return (
      url.includes('donat') || url.includes('waqf') ||
      title.includes('donat') || title.includes('waqf')
    );
  };

  const isExcludedItem = (item: any) => {
    const url = (item.url || '').toLowerCase();
    const title = (item.title || '').toLowerCase();
    return (
      url.includes('department') || title.includes('department') ||
      url.includes('admission') || title.includes('admission')
    );
  };

  const rawItems: any[] =
    menu?.items && Array.isArray(menu.items) && menu.items.length > 0 ? menu.items : [];

  // Find About item from CMS — used for both the dropdown label and sub-items
  const aboutMenuItem = rawItems.find((item: any) => isAboutItem(item));

  const isMatchingAbout = (item: any) => {
    if (!item) return false;
    if (aboutMenuItem && item === aboutMenuItem) return true;
    if (aboutMenuItem?.id && item.id && item.id === aboutMenuItem.id) return true;
    if (aboutMenuItem?.url && item.url && item.url === aboutMenuItem.url) return true;
    return isAboutItem(item);
  };

  const dynamicAboutOptions = aboutMenuItem?.subItems?.map((child: any) => ({
    id: (child.title || 'item').toLowerCase().replace(/\s+/g, '-'),
    label: child.title,
    href: child.url,
    image: child.media?.url || '/images/figma-home/02-about.jpeg',
    badge: child.badge || t('ourCommunity'),
  }));

  const aboutMenuOptions: AboutMenuOption[] =
    dynamicAboutOptions && dynamicAboutOptions.length > 0
      ? dynamicAboutOptions
      : [
          {
            id: 'about',
            label: t('aboutUs'),
            href: '/about',
            image: '/images/figma-home/02-about.jpeg',
            badge: t('ourCommunity'),
          },
          {
            id: 'staffs',
            label: t('staffs'),
            href: '/staffs',
            image: '/images/figma-home/20-news.jpeg',
            badge: t('ourTeam'),
          },
          {
            id: 'career',
            label: t('career'),
            href: '/career',
            image: '/images/figma-home/15-news.jpeg',
            badge: t('joinUs'),
          },
        ];

  const isContactItem = (item: any) => {
    if (!item) return false;
    const url = (item.url || '').toLowerCase();
    const title = (item.title || '').toLowerCase();
    return (
      url === '/contact' || url === 'contact' || url.includes('/contact') ||
      title.includes('contact') || title.includes('اتصل') || title.includes('iletişim')
    );
  };

  const contactMenuItem = rawItems.find((item: any) => isContactItem(item));

  // Left items: all CMS navigation items that are not About, Online Learning, Donation, Contact, Departments, or Admissions
  const leftItemsFromCMS = rawItems.filter(
    (i: any) =>
      !isMatchingAbout(i) &&
      !isOnlineLearning(i.url) &&
      !isDonationItem(i) &&
      !isContactItem(i) &&
      !isExcludedItem(i)
  );

  // Fallback if CMS is empty or loading
  const defaultLeftNav = [
    { id: 'nav-home',     title: t('home'),             url: '/'        },
    { id: 'nav-programs', title: t('academicPrograms'), url: '/programs' },
    { id: 'nav-news',     title: t('newsAndEvents'),    url: '/news'    },
  ];

  const leftNavItems = leftItemsFromCMS.length > 0 ? leftItemsFromCMS : defaultLeftNav;

  const rightNavItems = [
    contactMenuItem || { id: 'nav-contact', title: t('contact'), url: '/contact' },
  ];

  const getLocalizedTitle = (item: any) => {
    if (!item) return '';
    if (item.title) return item.title;
    const url = (item.url || '').toLowerCase();
    if (url === '/' || url === '') return t('home');
    if (url.includes('/programs') || url === 'programs') return t('academicPrograms');
    if (url.includes('/news') || url === 'news') return t('newsAndEvents');
    if (url.includes('/online') || url === 'online-learning') return t('onlineLearning');
    if (url.includes('/about') || url === 'about') return t('about');
    if (url.includes('/contact') || url === 'contact') return t('contact');
    if (url.includes('/gallery') || url === 'gallery') return t('gallery');
    return item.title || '';
  };

  const isLinkActive = (url: string) => {
    if (url === '/') return pathname === '/' || pathname === `/${locale}` || pathname === `/${locale}/`;
    return pathname.includes(url);
  };

  const getHref = (url: string) => {
    if (!url) return '/';
    if (url.startsWith('http') || url.startsWith('#')) return url;
    if (locale === 'en' || !locale) return url;
    const cleanUrl = url.startsWith('/') ? url : `/${url}`;
    return cleanUrl === '/' ? `/${locale}` : `/${locale}${cleanUrl}`;
  };

  const NavLink = ({
    href,
    children,
    hasDropdown = false,
    isOpen = false,
    className = '',
  }: {
    href: string;
    children: React.ReactNode;
    hasDropdown?: boolean;
    isOpen?: boolean;
    className?: string;
  }) => {
    const active = isLinkActive(href);
    return (
      <Link
        href={getHref(href)}
        className={`flex items-center gap-1 text-[15px] font-semibold transition-colors outline-none ${
          active ? 'text-[#048ED6]' : 'text-gray-800 hover:text-[#048ED6]'
        } ${className}`}
      >
        {children}
        {hasDropdown && (
          <ChevronDown
            className={`w-4 h-4 transition-transform duration-300 ${
              isOpen ? '-rotate-180' : 'lg:group-hover:-rotate-180'
            }`}
          />
        )}
      </Link>
    );
  };

  return (
    <>
      <header
        className={`sticky top-0 z-50 bg-white border-b border-gray-100 transition-transform duration-500 ${
          isVisible ? 'translate-y-0' : '-translate-y-[calc(100%+40px)]'
        }`}
      >
        {/* ── Top Bar (desktop only) ── */}
        <div className="hidden h-[50px] lg:flex w-full bg-linear-to-r from-primary via-white to-primary text-white py-2 px-[var(--spacing-side)] justify-between items-center text-sm font-medium z-20 relative border-b border-white/10">
          {/* Left: topbar nav links */}
          <div className="flex items-center gap-6">
            {topbarMenu?.items ? (
              topbarMenu.items.map((item: any, idx: number) => (
                <Link
                  key={idx}
                  href={getHref(item.url)}
                  className="group hover:text-white/80 transition-colors flex items-center gap-2 font-semibold text-[13px] tracking-wide"
                >
                  {isOnlineLearning(item.url) && (
                    <div className="relative flex items-center justify-center">
                      <div className="absolute inset-0 bg-white/40 rounded-full animate-ping opacity-75 duration-1000" />
                      <div className="relative bg-white/10 group-hover:bg-white/20 p-1.5 rounded-full transition-colors flex items-center justify-center">
                        <GraduationCap className="w-4 h-4 relative z-10" />
                      </div>
                    </div>
                  )}
                  <span className="text-[13px]">{item.title}</span>
                </Link>
              ))
            ) : (
              <Link
                href={getHref('/online-learning')}
                className="group hover:text-white/80 transition-colors flex items-center gap-2 font-semibold text-[13px] tracking-wide"
              >
                <div className="relative flex items-center justify-center">
                  <div className="absolute inset-0 bg-white/40 rounded-full animate-ping opacity-75 duration-1000" />
                  <div className="relative bg-white/10 group-hover:bg-white/20 p-1.5 rounded-full transition-colors flex items-center justify-center">
                    <GraduationCap className="w-4 h-4 relative z-10" />
                  </div>
                </div>
                <span className="text-[13px]">{t('onlineLearning')}</span>
              </Link>
            )}
          </div>

          {/* Right: social + login */}
          <div className="flex items-center gap-5">
            <div className="flex items-center gap-4 text-white/90">
              {socialLinks.map((s: any, i: number) => (
                <a
                  key={i}
                  href={s.url || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.title}
                  className="lg:hover:text-white/80 transition-all lg:hover:-translate-y-[1px] flex items-center justify-center text-white"
                >
                  <i className={`${s.icon} text-[15px] flex justify-center items-center`} aria-hidden />
                </a>
              ))}
            </div>

            <div className="w-[1px] h-4 bg-white/40" />

            <a
              href={getHref(topbarMenu?.ctaButtonUrl || '/login')}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-transparent border border-white text-white hover:bg-white/10 px-5 py-1.5 rounded-full transition-all flex items-center gap-2 font-medium text-[13px]"
            >
              <User className="w-4 h-4" />
              {(topbarMenu?.locale === locale && topbarMenu?.ctaButtonTitle) || t('loginPortal')}
            </a>
          </div>
        </div>

        {/* ── Main Navbar ── */}
        <Container className="max-w-[1920px] px-[var(--spacing-side)]">
          {/* Decorative center underline image */}
          <div className="w-[300px] h-[40px] max-lg:hidden flex justify-center items-end pointer-events-none absolute bottom-[-12px] left-1/2 -translate-x-1/2 z-[10]">
            <Image
              src="/logo-under.webp"
              alt="Brand Under Logo"
              width={185}
              height={145}
              className="object-contain lg:hover:scale-105 transition-transform"
              priority
            />
          </div>

          <div className="w-full h-full relative">
            <nav className="w-full h-[96px] bg-white flex max-lg:rtl:flex-row-reverse justify-between items-center lg:grid lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
              {/* Left nav links */}
              <div className="hidden lg:flex items-center gap-4 xl:gap-8 text-[15px] xl:text-[17px]">
                {leftNavItems.map((item: any, idx: number) => (
                  <NavLink key={idx} href={item.url}>
                    {getLocalizedTitle(item)}
                  </NavLink>
                ))}
              </div>

              {/* Center logo */}
              <Link
                href={getHref('/')}
                className="flex lg:max-w-[76px] items-center justify-center z-10 shrink-0 mx-4"
              >
                <Image
                  src="/headerlogo.png"
                  alt="YAHAYASCHOOL Logo"
                  width={80}
                  height={95}
                  className="object-contain hover:scale-105 lg:max-w-[76px] max-w-[48px] transition-transform"
                  priority
                />
              </Link>

              {/* Right: about dropdown + right nav + language + CTA */}
              <div className="hidden lg:flex items-center gap-4 xl:gap-6 h-full justify-end ps-4">
                {/* About mega-menu */}
                <div
                  className="group relative h-full flex items-center outline-none cursor-pointer"
                  onClick={() => setAboutDropdownOpen(!aboutDropdownOpen)}
                >
                  <NavLink
                    href="/about"
                    hasDropdown
                    isOpen={aboutDropdownOpen}
                    className="w-full h-full relative cursor-pointer"
                  >
                    {aboutMenuItem ? getLocalizedTitle(aboutMenuItem) : t('about')}
                  </NavLink>

                  {/* Dropdown panel */}
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      setAboutDropdownOpen(false);
                    }}
                    className={`lg:absolute lg:top-full z-50 lg:left-[-120px] rtl:lg:left-auto rtl:lg:right-[-120px] w-[clamp(400px,48vw,580px)] 3xl:w-[clamp(580px,48vw,680px)] bg-white rounded-2xl shadow-2xl border border-gray-100 p-4 transition-all duration-300 origin-top ${
                      aboutDropdownOpen
                        ? 'opacity-100 visible scale-100 pointer-events-auto'
                        : 'opacity-0 invisible scale-95 pointer-events-none lg:group-hover:opacity-100 lg:group-hover:visible lg:group-hover:scale-100 lg:group-hover:pointer-events-auto'
                    }`}
                  >
                    <div className="grid grid-cols-1 lg:grid-cols-[200px_1fr] gap-4">
                      {/* Left column – menu list */}
                      <div className="flex flex-col gap-2">
                        {aboutMenuOptions.map((item: AboutMenuOption, index: number) => (
                          <Link
                            key={item.id}
                            href={getHref(item.href)}
                            onMouseEnter={() => {
                              setActiveAboutMenu(item.id);
                              if (swiperRef.current) {
                                swiperRef.current.slideTo(index);
                              }
                            }}
                            className={`flex items-center justify-between px-4 py-3 rounded-xl text-[15px] font-medium transition-all cursor-pointer border ${
                              activeAboutMenu === item.id
                                ? 'bg-[#048ED6] text-white border-[#048ED6] shadow-sm'
                                : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            <span>{item.label}</span>
                            <ChevronRight className="w-5 h-5 rtl:rotate-180" />
                          </Link>
                        ))}
                      </div>

                      {/* Right column – parallax image slider */}
                      <div className="hidden lg:block relative rounded-2xl overflow-hidden h-[240px] bg-gray-100">
                        <Swiper
                          direction="vertical"
                          className="w-full h-full"
                          parallax={true}
                          modules={[Parallax]}
                          onSwiper={(swiper) => {
                            swiperRef.current = swiper;
                          }}
                          allowTouchMove={false}
                          speed={800}
                        >
                          {aboutMenuOptions.map((item: AboutMenuOption) => (
                            <SwiperSlide
                              key={item.id}
                              className="group/slide w-full h-full relative overflow-hidden"
                            >
                              <div className="w-full h-full relative overflow-hidden">
                                <Link
                                  href={getHref(item.href)}
                                  className="w-full h-full block overflow-hidden"
                                >
                                  <div
                                    className="w-full h-full relative scale-125"
                                    data-swiper-parallax-y="-20%"
                                  >
                                    <Image
                                      src={item.image}
                                      alt={
                                        typeof item.label === 'string' ? item.label : 'Menu image'
                                      }
                                      fill
                                      className="object-cover w-full h-full"
                                    />
                                  </div>
                                  <div
                                    className="absolute opacity-0 group-[&.swiper-slide-active]/slide:opacity-100 translate-x-[-100%] group-[&.swiper-slide-active]/slide:translate-x-0 group-[&.swiper-slide-active]/slide:delay-300 duration-500 top-4 left-4 group-[&.swiper-slide-active]/slide:bg-white/90 group-[&.swiper-slide-active]/slide:backdrop-blur-sm px-4 py-1.5 rounded-full text-[#048ED6] font-medium text-sm shadow-sm z-10"
                                    data-swiper-parallax-y="-20"
                                    data-swiper-parallax-opacity="0"
                                  >
                                    {item.badge}
                                  </div>
                                </Link>
                              </div>
                            </SwiperSlide>
                          ))}
                        </Swiper>
                      </div>
                    </div>
                  </div>
                </div>

               {/* // Right nav links */}
                {rightNavItems.map((item: any, idx: number) => (
                  <NavLink key={idx} href={item.url}>
                    {getLocalizedTitle(item)}
                  </NavLink>
                ))}

                {/* Language switcher + Donations CTA */}
                <div className="flex items-center h-full gap-4">
                  <LanguageSwitcher currentLocale={locale} />
                  <Link
                    href={getHref(menu?.ctaButtonUrl || '/donations')}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-bold text-white bg-[#048ED6] hover:bg-sky-500 shadow-sm transition-all"
                  >
                    <HandHeart className="w-4 h-4" />
                    <span>
                      {(menu?.locale === locale && menu?.ctaButtonTitle) || t('donations')}
                    </span>
                    <ArrowRight className="w-4 h-4 rtl:rotate-180" />
                  </Link>
                </div>
              </div>

              {/* Mobile: language + hamburger */}
              <div className="lg:hidden h-full flex rtl:flex-row-reverse items-center gap-4 z-50 relative">
                <LanguageSwitcher
                  currentLocale={locale}
                  forceClose={mobileMenuOpen}
                  onToggle={(isOpen) => {
                    if (isOpen) setMobileMenuOpen(false);
                  }}
                />
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="cursor-pointer p-2"
                  aria-label="Toggle Navigation Menu"
                >
                  <div className="w-7 h-5 flex flex-col justify-between items-center relative">
                    <span
                      className={`block h-[2px] w-full transform transition duration-300 ease-in-out ${
                        mobileMenuOpen
                          ? 'rotate-45 translate-y-[9px] bg-[#048ED6]'
                          : 'bg-gray-800'
                      }`}
                    />
                    <span
                      className={`block h-[2px] w-full transform transition duration-300 ease-in-out ${
                        mobileMenuOpen ? 'opacity-0' : 'bg-gray-800'
                      }`}
                    />
                    <span
                      className={`block h-[2px] w-full transform transition duration-300 ease-in-out ${
                        mobileMenuOpen
                          ? '-rotate-45 -translate-y-[9px] bg-[#048ED6]'
                          : 'bg-gray-800'
                      }`}
                    />
                  </div>
                </button>
              </div>
            </nav>
          </div>
        </Container>

        {/* ── Mobile Menu Drawer ── */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-white border-t border-gray-100 pt-4 pb-6 shadow-xl absolute w-full left-0 z-50 overflow-hidden transition-all duration-300 origin-top animate-in fade-in slide-in-from-top-2">
            <div className="flex flex-col">
              {(
                rawItems.length > 0
                  ? rawItems
                  : [
                      { id: 'home', title: t('home'), url: '/' },
                      { id: 'about-fallback', title: t('about'), url: '/about', subItems: aboutMenuOptions },
                      { id: 'programs', title: t('academicPrograms'), url: '/programs' },
                      { id: 'news', title: t('newsAndEvents'), url: '/news' },
                      { id: 'contact', title: t('contact'), url: '/contact' },
                    ]
              )
                .filter((item: any) => !isDonationItem(item) && !isOnlineLearning(item.url) && !isExcludedItem(item))
                .map((item: any, idx: number) => {
                  const isAbout = isMatchingAbout(item) || item.id === 'about-fallback';

                  if (isAbout) {
                    return (
                      <div key={idx} className="flex flex-col">
                        <button
                          onClick={() => setMobileAboutOpen(!mobileAboutOpen)}
                          className={`flex justify-between items-center px-[var(--spacing-side)] py-3 text-[17px] font-semibold text-gray-800 transition-colors ${
                            mobileAboutOpen ? 'bg-primary/5 text-[#048ED6]' : 'bg-white'
                          }`}
                        >
                          <span>{getLocalizedTitle(item)}</span>
                          <ChevronDown
                            className={`w-5 h-5 transition-transform duration-300 ${
                              mobileAboutOpen ? 'rotate-180' : ''
                            }`}
                          />
                        </button>
                        <div
                          className={`grid transition-all duration-300 ease-in-out ${
                            mobileAboutOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                          }`}
                        >
                          <div className="overflow-hidden flex flex-col bg-[#0D3B2E]">
                            {aboutMenuOptions.map((subItem: AboutMenuOption) => (
                              <Link
                                key={subItem.id}
                                href={getHref(subItem.href)}
                                onClick={() => setMobileMenuOpen(false)}
                                className="px-[var(--spacing-side)] py-2.5 text-[15px] border-t border-white/10 font-medium text-white hover:bg-white/10 transition-colors block"
                              >
                                {subItem.label}
                              </Link>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <Link
                      key={idx}
                      href={getHref(item.url)}
                      onClick={() => setMobileMenuOpen(false)}
                      className="px-[var(--spacing-side)] py-3 text-[17px] font-semibold text-gray-800 hover:text-[#048ED6] transition-colors"
                    >
                      {getLocalizedTitle(item)}
                    </Link>
                  );
                })}


              {/* Mobile CTA buttons */}
              <div className="pt-4 mt-2 flex flex-col min-[450px]:flex-row gap-3 px-[var(--spacing-side)]">
                <Link
                  href={getHref(menu?.ctaButtonUrl || '/donations')}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex-1 py-3 px-3 rounded-full text-center font-bold text-white bg-[#048ED6] hover:bg-sky-500 transition-colors flex items-center justify-center gap-1.5 text-[14px]"
                >
                  <HandHeart className="w-4 h-4 shrink-0" />
                  <span className="truncate">
                    {(menu?.locale === locale && menu?.ctaButtonTitle) || t('donations')}
                  </span>
                </Link>
                <a
                  href={getHref(topbarMenu?.ctaButtonUrl || '/login')}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-3 px-3 rounded-full text-center font-bold text-[#048ED6] bg-blue-50 border border-[#048ED6]/20 hover:bg-blue-100 transition-colors flex items-center justify-center gap-1.5 text-[14px]"
                >
                  <User className="w-4 h-4 shrink-0" />
                  <span className="truncate">
                    {(topbarMenu?.locale === locale && topbarMenu?.ctaButtonTitle) ||
                      t('loginPortal')}
                  </span>
                </a>
              </div>

              {/* Mobile social links */}
              <div className="pt-4 px-[var(--spacing-side)] flex items-center justify-center gap-4 text-gray-500">
                {socialLinks.map((s: any, i: number) => (
                  <a
                    key={i}
                    href={s.url || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={s.title}
                    className="w-9 h-9 rounded-full bg-[#E6F0FB] text-[#048ED6] flex items-center justify-center hover:bg-[#048ED6] hover:text-white transition-colors"
                  >
                    <i className={`${s.icon} text-[15px] flex justify-center items-center`} aria-hidden />
                  </a>
                ))}
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Mobile overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-[45] bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}
    </>
  );
}
