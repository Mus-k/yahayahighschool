import type { Metadata } from 'next';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { ChevronRight } from 'lucide-react';
import { cmsService } from '@/services/cms.service';
import { HomepageBuilder } from '@/components/public/HomepageBuilder';
import { FaqAccordion } from '@/components/public/faq/FaqAccordion';
import { InteractiveDotsBackground } from '@/components/public/shared/InteractiveDotsBackground';

interface FaqPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: FaqPageProps): Promise<Metadata> {
  const { locale } = await params;
  const page = await cmsService.getPageBySlug('faq', locale);

  return {
    title: page?.seo?.metaTitle || (locale === 'ar' ? 'الأسئلة الشائعة | يهايا سكول' : 'Frequently Asked Questions | YAHAYASCOOL'),
    description: page?.seo?.metaDescription || 'Find clear, comprehensive answers regarding admissions, tuition fees, Qur\'an memorization tracks, Cambridge exams, and campus life.',
  };
}

export default async function FaqListingPage({ params }: FaqPageProps) {
  const { locale } = await params;
  const page = await cmsService.getPageBySlug('faq', locale);

  const t = await getTranslations({ locale, namespace: 'publicNav' });

  if (page?.sections && page.sections.length > 0) {
    return <HomepageBuilder sections={page.sections} locale={locale} />;
  }

  const faqs = await cmsService.getFaqs(locale);

  const fallbackFaqs = faqs && faqs.length > 0 ? faqs : [
    {
      id: 1,
      question: 'Does YAHAYASCOOL prepare students for both international and national examinations?',
      answer: 'Yes. Our senior secondary students sit for Cambridge IGCSE, SAT, and IELTS alongside national senior school certificate examinations, ensuring 100% eligibility for top universities in North America, Europe, Turkey, and across Africa.',
      category: 'Curriculum & Exams',
    },
    {
      id: 2,
      question: 'How does the 3-Year Tahfidz Al-Qur\'an memorization track work?',
      answer: 'Students enrolled in the Tahfidz track have dedicated morning and evening memorization circles led by certified Hafiz instructors with Ijazah. Academic Western subjects are scheduled efficiently during core day hours without overwhelming the student.',
      category: 'Islamic Studies & Tahfidz',
    },
    {
      id: 3,
      question: 'Are boarding and hostel accommodations available on campus?',
      answer: 'Yes. We offer separate, highly secure, fully air-conditioned hostel facilities for both boys and girls, supervised 24/7 by dedicated housemasters and resident medical nurses.',
      category: 'Campus Life & Boarding',
    },
    {
      id: 4,
      question: 'What are the tuition payment options and Waqf scholarship eligibility?',
      answer: 'Tuition can be paid per academic term. Through our Sadaqah Jariyah and Waqf Endowment Fund, need-based and academic merit scholarships covering up to 100% of tuition are awarded annually to exceptional students and orphans.',
      category: 'Admissions & Scholarships',
    },
  ];

  return (
    <main className="min-h-screen bg-gray-50/70 pb-24">
      {/* Hero Header */}
      <section className="bg-[#048ED6] text-white py-10 sm:py-28 relative overflow-hidden">
        <InteractiveDotsBackground />
        <div className="max-w-7xl mx-auto px-4 sm:px-8 relative z-10 text-center">
          <nav aria-label="Breadcrumb" className="flex items-center justify-center gap-2 mb-8 text-white/80 text-[clamp(0.8125rem,0.73vw,0.875rem)]">
            <Link href={`/${locale}`} className="transition-colors hover:text-white">{t('home')}</Link>
            <ChevronRight className="w-4 h-4 text-white/50 rtl:rotate-180" aria-hidden />
            <span className="font-medium text-white">{locale === 'ar' ? 'الأسئلة الشائعة' : 'FAQ'}</span>
          </nav>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white mb-6">
            {page?.title || (locale === 'ar' ? 'الأسئلة الشائعة' : 'Frequently Asked Questions')}
          </h1>
          <p className="text-lg sm:text-xl text-gray-300 max-w-3xl mx-auto font-light leading-relaxed">
            {page?.seo?.metaDescription || 'Everything you need to know about our dual curriculum, admission requirements, boarding facilities, and scholarship opportunities.'}
          </p>
        </div>
      </section>

      {/* FAQ Accordion List */}
      <section className="max-w-4xl mx-auto px-4 sm:px-8 mt-16 max-sm:mt-6">
        <FaqAccordion faqs={fallbackFaqs} />
      </section>
    </main>
  );
}
