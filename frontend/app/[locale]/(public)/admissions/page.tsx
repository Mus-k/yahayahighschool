import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { cmsService } from '@/services/cms.service';
import { HomepageBuilder } from '@/components/public/HomepageBuilder';
import { CheckCircle2, FileText, HelpCircle, ArrowRight, GraduationCap, DollarSign, Calendar } from 'lucide-react';

interface AdmissionsPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: AdmissionsPageProps): Promise<Metadata> {
  const { locale } = await params;
  const page = await cmsService.getPageBySlug('admissions', locale);

  return {
    title: page?.seo?.metaTitle || (locale === 'ar' ? 'القبول والتسجيل | يهايا سكول' : 'Admissions & Fees | YAHAYASCOOL'),
    description: page?.seo?.metaDescription || 'Complete guide to admissions requirements, tuition fees, scholarships, and online application procedures for Yahaya International High School.',
  };
}

export default async function AdmissionsPage({ params }: AdmissionsPageProps) {
  const { locale } = await params;
  const page = await cmsService.getPageBySlug('admissions', locale);

  if (page?.sections && page.sections.length > 0) {
    return <HomepageBuilder sections={page.sections} locale={locale} />;
  }

  const getHref = (url: string) => {
    return locale === 'en' ? url : `/${locale}${url}`;
  };

  return (
    <main className="min-h-screen bg-white">
      {/* Hero Header */}
      <section className="bg-gradient-to-br from-emerald-950 via-emerald-900 to-emerald-950 text-white py-20 sm:py-28 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:24px_24px]" />
        <div className="max-w-7xl mx-auto px-4 sm:px-8 relative z-10 text-center">
          <span className="inline-block px-4 py-1.5 rounded-full bg-emerald-800/80 border border-emerald-700 text-amber-300 text-xs sm:text-sm font-semibold mb-6">
            Join the 2026/2027 Academic Session
          </span>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white mb-6">
            Admissions & Tuition Guide
          </h1>
          <p className="text-lg sm:text-xl text-emerald-100 max-w-3xl mx-auto font-light leading-relaxed">
            Discover our simple, transparent 4-step admission process. We welcome dedicated students seeking excellence across Western sciences and Islamic character.
          </p>
        </div>
      </section>

      {/* 4-Step Admission Process */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-block px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-100 text-emerald-900 mb-3">
            How to Apply
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-emerald-950 mb-4 tracking-tight">
            Our 4-Step Enrollment Roadmap
          </h2>
          <p className="text-gray-600 text-base sm:text-lg">
            Our online portal makes registering your child quick, secure, and fully traceable.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="bg-emerald-50/60 rounded-3xl p-8 border border-emerald-100/80 relative flex flex-col justify-between">
            <div className="w-12 h-12 rounded-2xl bg-emerald-900 text-amber-400 font-black text-xl flex items-center justify-center mb-6 shadow-md">
              1
            </div>
            <h3 className="text-xl font-bold text-emerald-950 mb-3">Online Registration</h3>
            <p className="text-gray-600 text-base leading-relaxed mb-6">
              Complete the digital application form with your child\'s personal details, desired academic track, and parent contact information.
            </p>
            <Link
              href={getHref('/online-registration')}
              className="text-emerald-900 font-bold text-sm flex items-center gap-1 hover:text-amber-600 transition-colors"
            >
              <span>Start Form</span>
              <ArrowRight className="w-4 h-4 rtl:rotate-180" />
            </Link>
          </div>

          <div className="bg-emerald-50/60 rounded-3xl p-8 border border-emerald-100/80 relative flex flex-col justify-between">
            <div className="w-12 h-12 rounded-2xl bg-emerald-900 text-amber-400 font-black text-xl flex items-center justify-center mb-6 shadow-md">
              2
            </div>
            <h3 className="text-xl font-bold text-emerald-950 mb-3">Document Upload</h3>
            <p className="text-gray-600 text-base leading-relaxed mb-6">
              Attach digital copies of your child\'s birth certificate, recent passport photograph, and previous two years\' school report cards.
            </p>
            <div className="text-xs font-semibold text-emerald-800 bg-emerald-100/80 px-3 py-1.5 rounded-lg self-start">
              Secure Uploads
            </div>
          </div>

          <div className="bg-emerald-50/60 rounded-3xl p-8 border border-emerald-100/80 relative flex flex-col justify-between">
            <div className="w-12 h-12 rounded-2xl bg-emerald-900 text-amber-400 font-black text-xl flex items-center justify-center mb-6 shadow-md">
              3
            </div>
            <h3 className="text-xl font-bold text-emerald-950 mb-3">Assessment & Interview</h3>
            <p className="text-gray-600 text-base leading-relaxed mb-6">
              Shortlisted candidates sit for a friendly placement test in Mathematics, English, and basic Qur\'an reading alongside a parent interview.
            </p>
            <div className="text-xs font-semibold text-emerald-800 bg-emerald-100/80 px-3 py-1.5 rounded-lg self-start">
              Scheduled via Email
            </div>
          </div>

          <div className="bg-emerald-50/60 rounded-3xl p-8 border border-emerald-100/80 relative flex flex-col justify-between">
            <div className="w-12 h-12 rounded-2xl bg-emerald-900 text-amber-400 font-black text-xl flex items-center justify-center mb-6 shadow-md">
              4
            </div>
            <h3 className="text-xl font-bold text-emerald-950 mb-3">Admission Offer</h3>
            <p className="text-gray-600 text-base leading-relaxed mb-6">
              Upon successful evaluation, an official Admission Letter is issued with details on tuition payment, uniform sizing, and school orientation.
            </p>
            <div className="text-xs font-semibold text-emerald-800 bg-emerald-100/80 px-3 py-1.5 rounded-lg self-start">
              Welcome to YAHAYASCOOL
            </div>
          </div>
        </div>
      </section>

      {/* Tuition & Fee Structure Table */}
      <section id="fees" className="bg-gray-50/80 py-20 border-t border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-emerald-950 mb-4 tracking-tight">
              Transparent Tuition & Fee Schedule (2026/2027)
            </h2>
            <p className="text-gray-600 text-base sm:text-lg">
              Our fee structure supports top-tier laboratories, native language instructors, and state-of-the-art sports and mosque facilities. Need-based Waqf scholarships are available.
            </p>
          </div>

          <div className="bg-white rounded-3xl shadow-md border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-emerald-950 text-white text-sm uppercase tracking-wider">
                    <th className="py-5 px-6 font-bold">Academic Track / Section</th>
                    <th className="py-5 px-6 font-bold">Tuition per Term</th>
                    <th className="py-5 px-6 font-bold">Lab & Digital Resources</th>
                    <th className="py-5 px-6 font-bold">Hostel Boarding (Optional)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm sm:text-base text-gray-700">
                  <tr className="hover:bg-gray-50 transition-colors">
                    <td className="py-5 px-6 font-bold text-emerald-950">Junior High School (JSS 1 - 3)</td>
                    <td className="py-5 px-6 font-mono font-semibold text-emerald-900">$1,200</td>
                    <td className="py-5 px-6 font-mono text-gray-600">$150</td>
                    <td className="py-5 px-6 font-mono text-gray-600">$600 / Term</td>
                  </tr>
                  <tr className="hover:bg-gray-50 transition-colors">
                    <td className="py-5 px-6 font-bold text-emerald-950">Senior High (Pure Sciences & Robotics)</td>
                    <td className="py-5 px-6 font-mono font-semibold text-emerald-900">$1,450</td>
                    <td className="py-5 px-6 font-mono text-gray-600">$250</td>
                    <td className="py-5 px-6 font-mono text-gray-600">$600 / Term</td>
                  </tr>
                  <tr className="hover:bg-gray-50 transition-colors">
                    <td className="py-5 px-6 font-bold text-emerald-950">Senior High (Humanities & Languages)</td>
                    <td className="py-5 px-6 font-mono font-semibold text-emerald-900">$1,350</td>
                    <td className="py-5 px-6 font-mono text-gray-600">$180</td>
                    <td className="py-5 px-6 font-mono text-gray-600">$600 / Term</td>
                  </tr>
                  <tr className="hover:bg-gray-50 transition-colors">
                    <td className="py-5 px-6 font-bold text-emerald-950">Intensive 3-Year Tahfidz Al-Qur\'an Track</td>
                    <td className="py-5 px-6 font-mono font-semibold text-emerald-900">$1,500</td>
                    <td className="py-5 px-6 font-mono text-gray-600">$200</td>
                    <td className="py-5 px-6 font-mono text-gray-600">$600 / Term</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="bg-emerald-50/60 p-6 border-t border-emerald-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs sm:text-sm text-emerald-950 font-medium">
              <span>* Note: Fees are payable in full prior to the start of each academic term unless an installment plan is pre-approved by the Bursary.</span>
              <Link
                href={getHref('/online-registration')}
                className="bg-emerald-900 hover:bg-emerald-800 text-white font-bold px-6 py-2.5 rounded-xl shadow-sm transition-colors whitespace-nowrap"
              >
                Apply Online Now
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
