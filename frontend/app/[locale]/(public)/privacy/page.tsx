import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { marked } from 'marked';
import { PageHeader } from '@/components/public/shared/PageHeader';
import { cmsService } from '@/services/cms.service';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale = 'en' } = await params;
  const pageData = await cmsService.getPrivacyPage(locale);
  const t = await getTranslations({ locale, namespace: 'privacyPage' });

  const title =
    pageData?.seo?.metaTitle ||
    `${pageData?.title || t('title')} | YAHAYASCHOOL`;
  const description =
    pageData?.seo?.metaDescription ||
    'Learn how Yahaya International Islamic and English High School collects, uses, and safeguards your personal information.';

  return {
    title,
    description,
  };
}

export default async function PrivacyPolicyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale = 'en' } = await params;
  const t = await getTranslations({ locale, namespace: 'privacyPage' });
  let pageData = await cmsService.getPrivacyPage(locale);

  if (!pageData && locale !== 'en') {
    pageData = await cmsService.getPrivacyPage('en');
  }

  const title = pageData?.title || t('title');
  const crumb = pageData?.breadcrumbTitle || title;
  const lastUpdated = pageData?.lastUpdated || t('lastUpdated');
  const rawContent = pageData?.content || t.raw('content');

  // Convert markdown to HTML if content contains markdown formatting, or preserve HTML
  const htmlContent = rawContent
    ? typeof rawContent === 'string' &&
      (rawContent.includes('#') || rawContent.includes('*') || rawContent.includes('[')) &&
      !rawContent.trim().startsWith('<')
      ? (marked.parse(rawContent) as string)
      : rawContent
    : '';

  return (
    <main className="bg-[#F7FBFE] min-h-screen pb-20">
      <PageHeader title={title} crumb={crumb}>
        {lastUpdated}
      </PageHeader>

      <div className="max-w-[1152px] mx-auto px-(--spacing-side) mt-12">
        <div className="bg-white rounded-2xl shadow-sm p-[clamp(1.5rem,3vw,3rem)] border border-[#EAF5FD]">
          <div
            className="prose prose-sm md:prose-base max-w-none text-[#3F4941] rtl:text-right [&_h1]:text-[#121C2A] [&_h1]:font-bold [&_h1]:text-2xl [&_h1]:mt-8 [&_h1]:mb-4 [&_h2]:text-[#121C2A] [&_h2]:font-bold [&_h2]:text-xl [&_h2]:mt-8 [&_h2]:mb-4 [&_h3]:text-[#121C2A] [&_h3]:font-bold [&_h3]:text-xl [&_h3]:mt-8 [&_h3]:mb-4 [&_p]:mb-4 [&_p]:leading-relaxed [&_ul]:list-disc [&_ul]:mx-6 [&_ul]:mb-4 [&_ol]:list-decimal [&_ol]:mx-6 [&_ol]:mb-4 [&_li]:mb-2 [&_hr]:my-8 [&_hr]:border-[#EAF5FD]"
            dangerouslySetInnerHTML={{ __html: htmlContent }}
          />
        </div>
      </div>
    </main>
  );
}
