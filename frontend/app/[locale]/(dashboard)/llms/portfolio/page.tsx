'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { apiClient } from '@/services/api.service';
import { PageContainer, PageHeader } from '@/components/shared/layout/PageContainer';
import { useRouter } from '@/i18n/routing';
import { useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { useLocale } from 'next-intl';
import { t as i18nT } from '@/lib/i18n-dict';
import { 
  BookOpen, 
  Plus, 
  X,
  FileText,
  Headphones,
  Video,
  PenTool,
  CheckCircle2,
  Clock,
  MessageSquare
} from 'lucide-react';

const ITEM_TYPES = [
  'Writing Sample', 'Reading Record', 'Audio Recording', 
  'Video Presentation', 'Project', 'Grammar Exercise'
];

export default function LanguagePortfolioPage() {
  const { user, isLoading: authLoading } = useAuth();
  const teacher = (user as any)?.profile;
  const router = useRouter();
  const searchParams = useSearchParams();
  const offeringParam = searchParams.get('offering');
  const locale = useLocale();
  const t = (key: string) => i18nT(key, locale);

  const [isLoading, setIsLoading] = useState(true);
  const [isDataLoading, setIsDataLoading] = useState(false);
  const [offerings, setOfferings] = useState<any[]>([]);
  const [selectedOfferingId, setSelectedOfferingId] = useState<string>('');
  
  const [students, setStudents] = useState<any[]>([]);
  const [portfolios, setPortfolios] = useState<any[]>([]);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [reviewItem, setReviewItem] = useState<any | null>(null);
  const [reviewFeedback, setReviewFeedback] = useState('');

  // Form
  const [formData, setFormData] = useState({
    studentId: '',
    title: '',
    itemType: ITEM_TYPES[0],
    content: '',
    dateAdded: new Date().toISOString().split('T')[0],
    teacherFeedback: ''
  });

  useEffect(() => {
    if (authLoading) return;
    if (!teacher?.id) {
      setIsLoading(false);
      return;
    }
    loadOfferings();
  }, [authLoading, teacher?.id]);

  useEffect(() => {
    if (selectedOfferingId) {
      loadOfferingData(selectedOfferingId);
    } else {
      setStudents([]);
      setPortfolios([]);
    }
  }, [selectedOfferingId]);

  const loadOfferings = async () => {
    try {
      setIsLoading(true);
      const res = await apiClient.get('/course-offerings', {
        params: {
          filters: { teacher: { id: { $eq: teacher.id } }, offeringStatus: { $eq: 'ACTIVE' } },
          populate: ['subject', 'academicSection', 'gradeLevel', 'academicTerm'],
          pagination: { limit: 100 }
        }
      });
      
      const allOfferings = res.data?.data || [];
      const langOfferings = allOfferings.filter((offering: any) => {
        const subjectName = offering.subject?.name?.toLowerCase() || '';
        return subjectName.includes('english') || subjectName.includes('arabic') || subjectName.includes('french') || subjectName.includes('language');
      });

      setOfferings(langOfferings);

      if (offeringParam && langOfferings.some((o: any) => o.documentId === offeringParam)) {
        setSelectedOfferingId(offeringParam);
      } else if (langOfferings.length > 0) {
        setSelectedOfferingId(langOfferings[0].documentId);
      }
    } catch (error) {
      console.error(error);
      toast.error(t('Failed to load course offerings'));
    } finally {
      setIsLoading(false);
    }
  };

  const loadOfferingData = async (offeringId: string) => {
    try {
      setIsDataLoading(true);
      const [studentsRes, portfoliosRes] = await Promise.all([
        apiClient.get('/student-enrollments', {
          params: {
            filters: { courseOffering: { documentId: { $eq: offeringId } }, enrollmentStatus: { $eq: 'active' } },
            populate: ['student'],
            pagination: { limit: 200 }
          }
        }),
        // language-portfolios: courseOffering column newly added — Strapi needs restart.
        // Filter by teacher.id and cross-reference enrolled students client-side.
        apiClient.get('/language-portfolios', {
          params: {
            filters: { teacher: { id: { $eq: teacher.id } } },
            populate: ['student', 'teacher'],
            sort: 'dateAdded:desc',
            pagination: { limit: 100 }
          }
        })
      ]);

      const enrolledStudents = studentsRes.data?.data?.map((e: any) => e.student).filter(Boolean) || [];
      const enrolledIds = new Set(enrolledStudents.map((s: any) => s.id));
      const allPortfolios = portfoliosRes.data?.data || [];
      const filteredPortfolios = allPortfolios.filter(
        (p: any) => p.student && enrolledIds.has(p.student.id)
      );

      setStudents(enrolledStudents);
      setPortfolios(filteredPortfolios);
    } catch (error) {
      console.error(error);
      toast.error(t('Failed to load portfolios data'));
    } finally {
      setIsDataLoading(false);
    }
  };

  const handleAddPortfolio = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.post('/language-portfolios', {
        data: {
          title: formData.title,
          itemType: formData.itemType,
          content: formData.content, // simplified string representation
          dateAdded: formData.dateAdded,
          teacherFeedback: formData.teacherFeedback,
          student: formData.studentId,
          teacher: teacher.id,
          courseOffering: selectedOfferingId
        }
      });
      toast.success(t('Portfolio item added successfully'));
      setIsAddModalOpen(false);
      setFormData({
        ...formData,
        title: '',
        content: '',
        teacherFeedback: ''
      });
      loadOfferingData(selectedOfferingId);
    } catch (error) {
      console.error(error);
      toast.error(t('Failed to add portfolio item'));
    }
  };

  const handleSaveFeedback = async () => {
    if (!reviewItem) return;
    try {
      await apiClient.put(`/language-portfolios/${reviewItem.documentId}`, {
        data: {
          teacherFeedback: reviewFeedback
        }
      });
      toast.success(t('Feedback saved successfully'));
      
      // Update local state
      setPortfolios(prev => prev.map(p => 
        p.documentId === reviewItem.documentId 
          ? { ...p, teacherFeedback: reviewFeedback } 
          : p
      ));
      
      setReviewItem(null);
    } catch (error) {
      console.error(error);
      toast.error(t('Failed to save feedback'));
    }
  };

  const openReview = (item: any) => {
    setReviewItem(item);
    setReviewFeedback(item.teacherFeedback || '');
  };

  const getTypeIcon = (type: string) => {
    switch(type) {
      case 'Writing Sample': return <FileText className="h-4 w-4" />;
      case 'Reading Record': return <BookOpen className="h-4 w-4" />;
      case 'Audio Recording': return <Headphones className="h-4 w-4" />;
      case 'Video Presentation': return <Video className="h-4 w-4" />;
      case 'Project': return <PenTool className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  if (authLoading || isLoading) {
    return (
      <PageContainer>
        <div className="animate-pulse space-y-4 p-6">
          <div className="h-12 bg-slate-200 dark:bg-slate-800 rounded-xl" />
          <div className="h-64 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
        </div>
      </PageContainer>
    );
  }

  if (!teacher?.id) {
    return (
      <PageContainer>
        <div className="flex flex-col items-center justify-center p-16 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 m-6">
          <FileText className="h-12 w-12 text-slate-300 dark:text-slate-600 mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{t('No Profile Found')}</h3>
          <p className="text-slate-500 mt-2 max-w-sm text-sm">
            {t('Your user profile does not have an associated teacher record.')}
          </p>
        </div>
      </PageContainer>
    );
  }

  if (offerings.length === 0) {
    return (
      <PageContainer>
        <PageHeader title={t('Language Portfolio')} description={t('Review and manage student portfolios.')} />
        <div className="flex flex-col items-center justify-center p-16 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 m-6 shadow-sm">
          <BookOpen className="h-12 w-12 text-slate-300 dark:text-slate-600 mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{t('No Language Offerings Found')}</h3>
          <p className="text-slate-500 mt-2 max-w-sm text-sm">
            {t('You need an active language course offering to manage portfolios.')}
          </p>
          <button onClick={() => router.push('/llms/programs')} className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700">
            {t('View Language Programs')}
          </button>
        </div>
      </PageContainer>
    );
  }

  const totalItems = portfolios.length;
  const reviewedItems = portfolios.filter(p => !!p.teacherFeedback).length;
  const pendingItems = totalItems - reviewedItems;

  return (
    <PageContainer>
      <PageHeader title={t('Student Portfolios')} description={t('Review, grade, and add to student language portfolios.')} />
      
      <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
        {/* Top Controls */}
        <div className="flex flex-wrap items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-3">
            <BookOpen className="h-5 w-5 text-indigo-500" />
            <select 
              value={selectedOfferingId}
              onChange={(e) => setSelectedOfferingId(e.target.value)}
              className="border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none min-w-[250px] font-medium"
            >
              {offerings.map(o => (
                <option key={o.documentId} value={o.documentId}>
                  {o.subject?.name} - {o.academicSection?.name}
                </option>
              ))}
            </select>
          </div>
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-4 py-2 text-sm font-semibold transition-colors"
          >
            <Plus className="h-4 w-4" /> {t('Add Item')}
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 flex items-center gap-4 shadow-sm">
            <div className="p-3 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl text-indigo-600 dark:text-indigo-400">
              <FileText className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{t('Total Items')}</p>
              <h4 className="text-2xl font-bold text-slate-900 dark:text-white">{totalItems}</h4>
            </div>
          </div>
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 flex items-center gap-4 shadow-sm">
            <div className="p-3 bg-amber-50 dark:bg-amber-500/10 rounded-xl text-amber-600 dark:text-amber-400">
              <Clock className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{t('Needs Review')}</p>
              <h4 className="text-2xl font-bold text-slate-900 dark:text-white">{pendingItems}</h4>
            </div>
          </div>
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 flex items-center gap-4 shadow-sm">
            <div className="p-3 bg-green-50 dark:bg-green-500/10 rounded-xl text-green-600 dark:text-green-400">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{t('Reviewed')}</p>
              <h4 className="text-2xl font-bold text-slate-900 dark:text-white">{reviewedItems}</h4>
            </div>
          </div>
        </div>

        {/* Gallery */}
        <div className="space-y-4">
          {isDataLoading ? (
            <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>
          ) : portfolios.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-16 text-center text-slate-500 dark:text-slate-400">
              {t('No portfolio items found for this offering.')}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {portfolios.map(item => (
                <div key={item.documentId} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                  <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 flex items-center justify-center font-bold text-xs">
                        {item.student?.firstName?.[0]}{item.student?.lastName?.[0]}
                      </div>
                      <div className="text-sm font-medium text-slate-900 dark:text-white truncate max-w-[120px]">
                        {item.student?.firstName} {item.student?.lastName}
                      </div>
                    </div>
                    {item.teacherFeedback ? (
                      <span title={t('Reviewed')}><CheckCircle2 className="h-4 w-4 text-green-500" /></span>
                    ) : (
                      <span title={t('Pending Review')} className="flex h-2 w-2 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                      </span>
                    )}
                  </div>
                  <div className="p-5 flex-1 flex flex-col">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-medium bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 mb-3 w-fit">
                      {getTypeIcon(item.itemType)} {t(item.itemType)}
                    </span>
                    <h4 className="font-bold text-slate-900 dark:text-white mb-2 leading-tight">{item.title}</h4>
                    <p className="text-xs text-slate-500 mt-auto">{new Date(item.dateAdded).toLocaleDateString()}</p>
                  </div>
                  <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900">
                    <button 
                      onClick={() => openReview(item)}
                      className="w-full flex items-center justify-center gap-1 text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 py-1"
                    >
                      <MessageSquare className="h-4 w-4" /> {item.teacherFeedback ? t('View/Edit Review') : t('Review Item')}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl w-full max-w-lg overflow-hidden">
            <div className="flex justify-between items-center p-5 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">{t('Add Portfolio Item')}</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleAddPortfolio} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('Student *')}</label>
                <select 
                  required
                  value={formData.studentId}
                  onChange={e => setFormData({...formData, studentId: e.target.value})}
                  className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="" disabled>{t('Select Student')}</option>
                  {students.map(s => (
                    <option key={s.documentId} value={s.documentId}>{s.firstName} {s.lastName}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('Title *')}</label>
                <input 
                  required
                  type="text" 
                  value={formData.title}
                  onChange={e => setFormData({...formData, title: e.target.value})}
                  className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500" 
                  placeholder={t('e.g. Essay on Climate Change')}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('Item Type *')}</label>
                  <select 
                    required
                    value={formData.itemType}
                    onChange={e => setFormData({...formData, itemType: e.target.value})}
                    className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {ITEM_TYPES.map(type => (
                      <option key={type} value={type}>{t(type)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('Date *')}</label>
                  <input 
                    required
                    type="date" 
                    value={formData.dateAdded}
                    onChange={e => setFormData({...formData, dateAdded: e.target.value})}
                    className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500" 
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('Content (Text/Description)')}</label>
                <textarea 
                  rows={4}
                  value={formData.content}
                  onChange={e => setFormData({...formData, content: e.target.value})}
                  className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500" 
                  placeholder={t('Content or description of the file...')}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('Teacher Feedback (Optional)')}</label>
                <textarea 
                  rows={2}
                  value={formData.teacherFeedback}
                  onChange={e => setFormData({...formData, teacherFeedback: e.target.value})}
                  className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500" 
                  placeholder={t('Initial feedback...')}
                />
              </div>
              <div className="pt-2 flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                >
                  {t('Cancel')}
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-700 rounded-xl transition-colors"
                >
                  {t('Save Item')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Review Drawer */}
      {reviewItem && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 shadow-xl w-full max-w-md h-full flex flex-col animate-in slide-in-from-right">
            <div className="flex justify-between items-center p-6 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="font-bold text-xl text-slate-900 dark:text-white">{t('Review Item')}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">{reviewItem.student?.firstName} {reviewItem.student?.lastName}</p>
              </div>
              <button onClick={() => setReviewItem(null)} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="space-y-4">
                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400 mb-2">
                    {getTypeIcon(reviewItem.itemType)} {t(reviewItem.itemType)}
                  </span>
                  <h4 className="font-bold text-lg text-slate-900 dark:text-white">{reviewItem.title}</h4>
                  <p className="text-xs text-slate-500 mb-4">{new Date(reviewItem.dateAdded).toLocaleDateString()}</p>
                  
                  <div className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                    {reviewItem.content || <span className="italic text-slate-400">{t('No text content provided.')}</span>}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-bold text-slate-900 dark:text-white">{t('Teacher Feedback')}</label>
                  <textarea 
                    rows={6}
                    value={reviewFeedback}
                    onChange={(e) => setReviewFeedback(e.target.value)}
                    className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder={t('Provide constructive feedback here...')}
                  />
                </div>
              </div>
            </div>
            
            <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
              <button 
                onClick={handleSaveFeedback}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-4 py-3 text-sm font-semibold transition-colors"
              >
                {t('Save Feedback')}
              </button>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
