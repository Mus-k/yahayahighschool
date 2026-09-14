'use client';

import React, { useEffect } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useLenis } from 'lenis/react';
import { X } from 'lucide-react';

export function PolicyModal() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations('policyModal');
  const lenis = useLenis();

  const policyType = searchParams.get('policy');
  const isOpen = policyType === 'terms';

  useEffect(() => {
    if (isOpen) {
      lenis?.stop();
    } else {
      lenis?.start();
    }
    return () => lenis?.start();
  }, [isOpen, lenis]);

  if (!isOpen) return null;

  const handleClose = () => {
    // Remove the policy parameter from the URL to close the modal
    const params = new URLSearchParams(searchParams.toString());
    params.delete('policy');
    const newUrl = pathname + (params.toString() ? `?${params.toString()}` : '');
    router.push(newUrl, { scroll: false });
  };

  const title = t('titleTerms');
  const content = t.raw('contentTerms');

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" 
        onClick={handleClose}
      />
      
      {/* Modal Dialog */}
      <div 
        className="relative w-full max-w-2xl bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col"
        style={{ maxHeight: 'calc(100vh - 2rem)' }}
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-[#121C2A]">{title}</h2>
          <button 
            onClick={handleClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
            aria-label={t('close')}
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto">
          <div 
            className="prose prose-sm md:prose-base max-w-none text-[#3F4941] rtl:text-right [&_h3]:text-[#121C2A] [&_h3]:font-bold [&_h3]:mt-6 [&_h3]:mb-3 [&_p]:mb-4 [&_p]:leading-relaxed [&_ul]:list-disc [&_ul]:mx-6 [&_ul]:mb-4 [&_li]:mb-1 [&_hr]:my-6 [&_hr]:border-[#EAF5FD]"
            dangerouslySetInnerHTML={{ __html: content }}
          />
        </div>
      </div>
    </div>
  );
}
