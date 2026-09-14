/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, Search, Upload, Download, Phone, Mail, GraduationCap, Eye, 
  Heart, DollarSign, CheckCircle2, AlertCircle, MessageSquare, X, 
  Edit, Trash2, Shield, Calendar, RefreshCw, Layers, CheckSquare, Square,
  Building, BookOpen, User, ShieldAlert, Plus
} from 'lucide-react';
import { apiClient } from '@/services/api.service';
import { PageContainer } from '@/components/shared/layout/PageContainer';
import { Avatar } from '@/components/shared/Avatar';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useLocale } from 'next-intl';

interface ParentData {
  id: number;
  documentId?: string;
  schoolId?: string;
  name: string;
  relationship: 'father' | 'mother' | 'guardian' | 'other';
  gender?: 'male' | 'female';
  phone: string;
  email?: string;
  occupation?: string;
  employer?: string;
  address?: string;
  nationalId?: string;
  passport?: string;
  emergencyContact?: string;
  preferredLanguage?: 'en' | 'ar' | 'fr' | 'tr';
  children?: any[];
  user?: any;
}

export default function ParentsListPage() {
  const locale = useLocale();
  const isRtl = locale === 'ar';

  const t = (key: string) => {
    const dict: Record<string, Record<string, string>> = {
      ar: {
        'registry_title': 'سجل أولياء الأمور والأوصياء',
        'registry_desc': 'الأوصياء والأمهات والآباء المسجلين والمرتبطين بالطلاب مع تتبع حالة براءة الذمة والوصول إلى بوابة النظام.',
        'register_guardian': 'تسجيل ولي أمر +',
        'registered_guardians': 'الأوصياء المسجلين',
        'linked_scholars': 'الطلاب المرتبطين',
        'clearance_status': 'حالة براءة الذمة',
        'overdue_accounts': 'الحسابات المتأخرة سدادها',
        'search_placeholder': 'ابحث عن ولي الأمر بالاسم، الهوية، الهاتف، أو البريد...',
        'all_relationships': 'كل صلات القرابة',
        'father': 'أب',
        'mother': 'أم',
        'guardian': 'وصي قانوني',
        'other': 'كفيل آخر',
        'all_clearance': 'كل الحسابات والذمم',
        'cleared': 'حسابات خالية من الديون',
        'overdue': 'أرصدة متأخرة المستحقة',
        'loading_registry': 'جاري تحميل سجل أولياء الأمور من Strapi...',
        'no_guardians': 'لم يتم العثور على أولياء أمور.',
        'col_profile': 'ملف ولي الأمر',
        'col_scholars': 'الطلاب المرتبطين',
        'col_contact': 'معلومات الاتصال',
        'col_clearance': 'براءة الذمة المالية',
        'col_actions': 'الإجراءات',
        'cleared_status': 'مستوفي الدفع',
        'overdue_status': 'متأخرات مالية',
      },
      fr: {
        'registry_title': 'Registre des Parents & Tuteurs',
        'registry_desc': 'Mères, pères et tuteurs légaux enregistrés liés aux élèves inscrits avec accès au portail et suivi financier.',
        'register_guardian': 'Enregistrer un tuteur',
        'registered_guardians': 'Tuteurs Enregistrés',
        'linked_scholars': 'Élèves Liés',
        'clearance_status': 'Statut Financier',
        'overdue_accounts': 'Comptes en Retard',
        'search_placeholder': 'Rechercher un parent par nom, ID, téléphone, email...',
        'all_relationships': 'Toutes les relations',
        'father': 'Père',
        'mother': 'Mère',
        'guardian': 'Tuteur légal',
        'other': 'Autre parrain',
        'all_clearance': 'Tous les statuts financiers',
        'cleared': 'Comptes en règle',
        'overdue': 'Soldes impayés',
        'loading_registry': 'Chargement du registre depuis Strapi...',
        'no_guardians': 'Aucun tuteur trouvé.',
        'col_profile': 'Profil du Tuteur',
        'col_scholars': 'Élèves Liés',
        'col_contact': 'Détails de Contact',
        'col_clearance': 'Règlement Financier',
        'col_actions': 'Actions',
        'cleared_status': 'En règle',
        'overdue_status': 'En retard',
      },
      tr: {
        'registry_title': 'Veli ve Vasi Kayıt Defteri',
        'registry_desc': 'Sistem erişimi ve mali durum takibi bulunan, kayıtlı öğrencilerle ilişkili anne, baba ve yasal vasiler.',
        'register_guardian': 'Yeni Veli Kaydet',
        'registered_guardians': 'Kayıtlı Veliler',
        'linked_scholars': 'Bağlantılı Öğrenciler',
        'clearance_status': 'Mali Temiz Raporu',
        'overdue_accounts': 'Vadesi Geçmiş Hesaplar',
        'search_placeholder': 'Veli adı, TC/Kimlik, telefon veya eposta ile ara...',
        'all_relationships': 'Tüm İlişkiler',
        'father': 'Baba',
        'mother': 'Anne',
        'guardian': 'Yasal Vasi',
        'other': 'Diğer Sponsor',
        'all_clearance': 'Tüm Ödeme Durumları',
        'cleared': 'Ödemesi Tamamlanmış',
        'overdue': 'Gecikmiş Bakiye',
        'loading_registry': 'Veli kayıtları Strapi\'den yükleniyor...',
        'no_guardians': 'Hiçbir veli bulunamadı.',
        'col_profile': 'Veli Profili',
        'col_scholars': 'Bağlantılı Öğrenciler',
        'col_contact': 'İletişim Bilgileri',
        'col_clearance': 'Mali Durum',
        'col_actions': 'İşlemler',
        'cleared_status': 'Borcu Yok',
        'overdue_status': 'Borçlu',
      }
    };
    return dict[locale]?.[key] || {
      'registry_title': 'Parents & Guardians Registry',
      'registry_desc': 'Registered mothers, fathers, and legal guardians linked to enrolled scholars with portal access and financial clearance tracking.',
      'register_guardian': 'Register Guardian',
      'registered_guardians': 'Registered Guardians',
      'linked_scholars': 'Linked Scholars',
      'clearance_status': 'Clearance Status',
      'overdue_accounts': 'Overdue Accounts',
      'search_placeholder': 'Search parents by name, ID, phone, or email...',
      'all_relationships': 'All Relationships',
      'father': 'Father',
      'mother': 'Mother',
      'guardian': 'Legal Guardian',
      'other': 'Other Sponsor',
      'all_clearance': 'All Billing Clearance',
      'cleared': 'Cleared Accounts',
      'overdue': 'Overdue Balance',
      'loading_registry': 'Loading parents directory from Strapi...',
      'no_guardians': 'No guardians found.',
      'col_profile': 'Guardian Profile',
      'col_scholars': 'Linked Student Scholars',
      'col_contact': 'Contact Details',
      'col_clearance': 'Billing clearance',
      'col_actions': 'Actions',
      'cleared_status': 'Cleared',
      'overdue_status': 'Overdue',
    }[key] || key;
  };

  const [parents, setParents] = useState<ParentData[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  
  // Filters
  const [relationshipFilter, setRelationshipFilter] = useState('all');
  const [billingFilter, setBillingFilter] = useState('all');

  // Modals state
  const [showFormModal, setShowFormModal] = useState(false);
  const [showInspectModal, setShowInspectModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedParent, setSelectedParent] = useState<ParentData | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Parent Details loaded on inspect
  const [inspectDetails, setInspectDetails] = useState<any | null>(null);
  const [loadingInspect, setLoadingInspect] = useState(false);

  // Form Fields
  const [formName, setFormName] = useState('');
  const [formSchoolId, setFormSchoolId] = useState('');
  const [formRelationship, setFormRelationship] = useState<'father' | 'mother' | 'guardian' | 'other'>('guardian');
  const [formGender, setFormGender] = useState<'male' | 'female'>('male');
  const [formPhone, setFormPhone] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formOccupation, setFormOccupation] = useState('');
  const [formEmployer, setFormEmployer] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formNationalId, setFormNationalId] = useState('');
  const [formPassport, setFormPassport] = useState('');
  const [formEmergencyContact, setFormEmergencyContact] = useState('');
  const [formLanguage, setFormLanguage] = useState<'en' | 'ar' | 'fr' | 'tr'>('en');
  const [selectedStudentIds, setSelectedStudentIds] = useState<number[]>([]);
  const [searchStudentQuery, setSearchStudentQuery] = useState('');

  useEffect(() => {
    loadParents();
    loadMetadata();
  }, []);

  const loadParents = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/parents', {
        params: {
          populate: ['photo', 'children'],
          'pagination[limit]': 150
        }
      });
      setParents(res.data?.data || []);
    } catch (err) {
      toast.error('Failed to sync parent guardian registry.');
    } finally {
      setLoading(false);
    }
  };

  const loadMetadata = async () => {
    try {
      const res = await apiClient.get('/students?pagination[limit]=300');
      setStudents(res.data?.data || []);
    } catch (err) {
      console.warn('Failed to load students list for form selection.');
    }
  };

  const loadParentDetails = async (parent: ParentData) => {
    setLoadingInspect(true);
    try {
      const res = await apiClient.get(`/parents/${parent.documentId || parent.id}`, {
        params: {
          populate: {
            photo: '*',
            children: {
              populate: {
                photo: '*',
                sections: {
                  populate: {
                    teachers: '*',
                    program: '*'
                  }
                }
              }
            }
          }
        }
      });
      setInspectDetails(res.data?.data || parent);
    } catch (err) {
      setInspectDetails(parent);
    } finally {
      setLoadingInspect(false);
    }
  };

  const handleOpenCreate = () => {
    setIsEditing(false);
    setSelectedParent(null);
    setFormName('');
    setFormSchoolId('');
    setFormRelationship('guardian');
    setFormGender('male');
    setFormPhone('');
    setFormEmail('');
    setFormOccupation('');
    setFormEmployer('');
    setFormAddress('');
    setFormNationalId('');
    setFormPassport('');
    setFormEmergencyContact('');
    setFormLanguage('en');
    setSelectedStudentIds([]);
    setSearchStudentQuery('');
    setShowFormModal(true);
  };

  const handleOpenEdit = (par: ParentData) => {
    setIsEditing(true);
    setSelectedParent(par);
    setFormName(par.name);
    setFormSchoolId(par.schoolId || '');
    setFormRelationship(par.relationship || 'guardian');
    setFormGender(par.gender || 'male');
    setFormPhone(par.phone);
    setFormEmail(par.email || '');
    setFormOccupation(par.occupation || '');
    setFormEmployer(par.employer || '');
    setFormAddress(par.address || '');
    setFormNationalId(par.nationalId || '');
    setFormPassport(par.passport || '');
    setFormEmergencyContact(par.emergencyContact || '');
    setFormLanguage(par.preferredLanguage || 'en');
    setSelectedStudentIds(par.children?.map(c => c.id) || []);
    setSearchStudentQuery('');
    setShowFormModal(true);
  };

  const handleOpenInspect = (par: ParentData) => {
    setSelectedParent(par);
    setInspectDetails(null);
    setShowInspectModal(true);
    loadParentDetails(par);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formPhone.trim()) {
      toast.error('Guardian Name and Phone number are required.');
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        data: {
          name: formName,
          schoolId: formSchoolId || null,
          relationship: formRelationship,
          gender: formGender,
          phone: formPhone,
          email: formEmail || null,
          occupation: formOccupation,
          employer: formEmployer,
          address: formAddress,
          nationalId: formNationalId,
          passport: formPassport,
          emergencyContact: formEmergencyContact,
          preferredLanguage: formLanguage,
          children: selectedStudentIds,
        }
      };

      if (isEditing && selectedParent) {
        await apiClient.put(`/parents/${selectedParent.documentId || selectedParent.id}`, payload);
        toast.success('Guardian profile updated successfully.');
      } else {
        await apiClient.post('/parents', payload);
        toast.success('New guardian registered successfully.');
      }

      setShowFormModal(false);
      loadParents();
    } catch (err) {
      toast.error('Failed to save guardian profile.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (par: ParentData) => {
    if (!confirm(`Are you sure you want to delete guardian "${par.name}"?`)) return;
    try {
      await apiClient.delete(`/parents/${par.documentId || par.id}`);
      toast.success('Guardian deleted successfully.');
      loadParents();
    } catch (err) {
      toast.error('Failed to delete guardian.');
    }
  };

  const toggleStudentSelection = (id: number) => {
    setSelectedStudentIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  // Filter computations
  const filteredParents = useMemo(() => {
    return parents.filter(par => {
      const matchSearch = par.name.toLowerCase().includes(query.toLowerCase()) ||
        par.schoolId?.toLowerCase().includes(query.toLowerCase()) ||
        par.phone.includes(query) ||
        par.email?.toLowerCase().includes(query.toLowerCase());

      const matchRelationship = relationshipFilter === 'all' || par.relationship === relationshipFilter;
      
      // Billing mockup filter
      const isCleared = (par.id % 7 !== 0); // Mock Overdue status
      const matchBilling = billingFilter === 'all' || 
        (billingFilter === 'cleared' && isCleared) || 
        (billingFilter === 'overdue' && !isCleared);

      return matchSearch && matchRelationship && matchBilling;
    });
  }, [parents, query, relationshipFilter, billingFilter]);

  // Statistics computations
  const stats = useMemo(() => {
    const totalCount = parents.length;
    const totalChildren = parents.reduce((sum, p) => sum + (p.children?.length || 0), 0);
    const avgSiblings = totalCount > 0 ? (totalChildren / totalCount).toFixed(1) : '0';
    const overdueCount = parents.filter(p => p.id % 7 === 0).length;
    const clearanceRate = totalCount > 0 ? (((totalCount - overdueCount) / totalCount) * 100).toFixed(1) : '100';

    return {
      total: totalCount,
      children: totalChildren,
      avg: avgSiblings,
      clearance: clearanceRate,
      overdue: overdueCount
    };
  }, [parents]);

  // Search filter for students checklist
  const filteredStudentsList = useMemo(() => {
    return students.filter(s => 
      s.name?.toLowerCase().includes(searchStudentQuery.toLowerCase()) ||
      s.schoolId?.toLowerCase().includes(searchStudentQuery.toLowerCase())
    );
  }, [students, searchStudentQuery]);

  // Extract associates from inspected details
  const associates = useMemo(() => {
    if (!inspectDetails) return { teachers: [], sections: [] };

    const parentTeachers: any[] = [];
    const parentSections: any[] = [];

    inspectDetails.children?.forEach((child: any) => {
      child.sections?.forEach((sec: any) => {
        // Collect Sections
        if (!parentSections.some((s: any) => s.id === sec.id)) {
          parentSections.push({
            id: sec.id,
            name: sec.name,
            code: sec.code,
            childName: child.name || 'Scholar'
          });
        }
        // Collect Teachers
        sec.teachers?.forEach((tch: any) => {
          if (!parentTeachers.some((t: any) => t.id === tch.id)) {
            parentTeachers.push({
              id: tch.id,
              name: tch.name || [tch.firstName, tch.lastName].filter(Boolean).join(' '),
              schoolId: tch.schoolId,
              childName: child.name || 'Scholar',
              sectionCode: sec.code
            });
          }
        });
      });
    });

    return {
      teachers: parentTeachers,
      sections: parentSections
    };
  }, [inspectDetails]);

  return (
    <PageContainer>
      <div className="space-y-6 w-full text-slate-800 dark:text-slate-100 animate-fade-in">
        
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
              <Users className="w-8 h-8 text-purple-600 dark:text-purple-400" />
              <span>{t('registry_title')}</span>
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              {t('registry_desc')}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleOpenCreate}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg shadow-purple-600/30 transition-all border-none cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{t('register_guardian')}</span>
            </button>
          </div>
        </div>

        {/* KPI Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between shadow-sm">
            <div>
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t('registered_guardians')}</p>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">{stats.total}</h3>
            </div>
            <div className="p-3 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400"><Users className="w-5 h-5" /></div>
          </div>
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between shadow-sm">
            <div>
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t('linked_scholars')}</p>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">{stats.children}</h3>
            </div>
            <div className="p-3 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400"><GraduationCap className="w-5 h-5" /></div>
          </div>
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between shadow-sm">
            <div>
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t('clearance_status')}</p>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">{stats.clearance}%</h3>
            </div>
            <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"><DollarSign className="w-5 h-5" /></div>
          </div>
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between shadow-sm">
            <div>
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t('overdue_accounts')}</p>
              <h3 className="text-2xl font-black text-slate-950 dark:text-white mt-1 text-rose-600">{stats.overdue}</h3>
            </div>
            <div className="p-3 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-450"><AlertCircle className="w-5 h-5" /></div>
          </div>
        </div>

        {/* Toolbar Controls */}
        <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row gap-4 items-center justify-between shadow-sm">
          
          <div className="relative flex-1 w-full md:max-w-md">
            <Search className={cn("absolute top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400", isRtl ? "right-3.5" : "left-3.5")} />
            <input
              type="text"
              placeholder={t('search_placeholder')}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className={cn(
                "w-full py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-purple-550 font-medium",
                isRtl ? "pr-10 pl-4" : "pl-10 pr-4"
              )}
            />
          </div>

          <div className="flex flex-wrap gap-2 w-full md:w-auto items-center justify-end">
            <select
              value={relationshipFilter}
              onChange={(e) => setRelationshipFilter(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-semibold focus:outline-none"
            >
              <option value="all">{t('all_relationships')}</option>
              <option value="father">{t('father')}</option>
              <option value="mother">{t('mother')}</option>
              <option value="guardian">{t('guardian')}</option>
              <option value="other">{t('other')}</option>
            </select>

            <select
              value={billingFilter}
              onChange={(e) => setBillingFilter(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-semibold focus:outline-none"
            >
              <option value="all">{t('all_clearance')}</option>
              <option value="cleared">{t('cleared')}</option>
              <option value="overdue">{t('overdue')}</option>
            </select>
          </div>

        </div>

        {/* Data Registry Table */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
          {loading ? (
            <div className="p-12 text-center text-slate-500 dark:text-slate-400 text-sm flex items-center justify-center gap-2">
              <RefreshCw className="w-5 h-5 animate-spin text-purple-550" />
              <span>{t('loading_registry')}</span>
            </div>
          ) : filteredParents.length === 0 ? (
            <div className="p-12 text-center text-slate-500 dark:text-slate-400 text-sm italic">{t('no_guardians')}</div>
          ) : (
            <div className="overflow-x-auto">
              <table className={cn("w-full border-collapse text-sm", isRtl ? "text-right" : "text-left")}>
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider bg-slate-50 dark:bg-slate-800/50">
                    <th className="py-3.5 px-4">{t('col_profile')}</th>
                    <th className="py-3.5 px-4">{t('col_scholars')}</th>
                    <th className="py-3.5 px-4">{t('col_contact')}</th>
                    <th className="py-3.5 px-4">{t('col_clearance')}</th>
                    <th className={cn("py-3.5 px-4", isRtl ? "text-left" : "text-right")}>{t('col_actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 text-slate-700 dark:text-slate-300">
                  {filteredParents.map((par) => {
                    const isCleared = (par.id % 7 !== 0);
                    return (
                      <tr key={par.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-805 flex items-center justify-center text-sm font-bold shrink-0">
                              {par.name?.[0] || 'G'}
                            </div>
                            <div>
                              <strong className="text-slate-905 dark:text-white font-bold block">{par.name}</strong>
                              <span className="text-[10px] text-purple-650 dark:text-purple-400 font-bold uppercase">{t(par.relationship || 'guardian')}</span>
                              <span className="text-[10px] text-slate-400 font-mono"> | {par.schoolId || `PAR-${String(par.id).padStart(4, '0')}`}</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex flex-wrap gap-1.5 max-w-xs">
                            {(!par.children || par.children.length === 0) ? (
                              <span className="text-xs text-slate-400 italic">
                                {locale === 'ar' ? 'لا يوجد طلاب مرتبطين' : locale === 'fr' ? 'Aucun enfant lié' : locale === 'tr' ? 'Bağlantılı çocuk yok' : 'No linked children'}
                              </span>
                            ) : (
                              par.children.map((child: any, i: number) => (
                                <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-semibold">
                                  <GraduationCap className="w-3 h-3 text-emerald-500" />
                                  <span>{child.name || [child.firstName, child.lastName].filter(Boolean).join(' ')}</span>
                                </span>
                              ))
                            )}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-xs space-y-1">
                          <div className="flex items-center gap-1.5">
                            <Phone className="w-3 h-3 text-slate-400" />
                            <span>{par.phone}</span>
                          </div>
                          {par.email && (
                            <div className="flex items-center gap-1.5 text-slate-400">
                              <Mail className="w-3 h-3 text-slate-400" />
                              <span className="truncate max-w-[180px]">{par.email}</span>
                            </div>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={cn(
                            "px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border",
                            isCleared 
                              ? "bg-emerald-50 text-emerald-700 border-emerald-250 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30"
                              : "bg-rose-50 text-rose-700 border-rose-250 dark:bg-rose-950/20 dark:text-rose-450 dark:border-rose-900/30"
                          )}>
                            {isCleared ? t('cleared_status') : t('overdue_status')}
                          </span>
                        </td>
                        <td className={cn("py-3.5 px-4", isRtl ? "text-left" : "text-right")}>
                          <div className={cn("flex items-center gap-1.5", isRtl ? "justify-start" : "justify-end")}>
                            <button
                              onClick={() => handleOpenInspect(par)}
                              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 border-none bg-transparent cursor-pointer transition-colors"
                              title="Inspect Associates"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleOpenEdit(par)}
                              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 border-none bg-transparent cursor-pointer transition-colors"
                              title="Edit"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(par)}
                              className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/20 text-rose-600 hover:text-rose-700 border-none bg-transparent cursor-pointer transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ── INSPECT PARENT GUARDIAN ASSOCIATES MODAL ─────────────────── */}
        {showInspectModal && selectedParent && (
          <div className="fixed inset-0 z-50 bg-slate-950/50 flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-6xl p-6 rounded-3xl shadow-2xl flex flex-col gap-6 max-h-[90vh] overflow-y-auto relative animate-slide-up text-xs text-slate-800 dark:text-slate-205">
              
              <button
                onClick={() => {
                  setShowInspectModal(false);
                  setSelectedParent(null);
                  setInspectDetails(null);
                }}
                className="absolute top-4 right-4 p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-650 rounded-full border-none bg-transparent cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-start gap-4 pb-4 border-b border-slate-150 dark:border-slate-800">
                <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 flex items-center justify-center text-lg font-bold">
                  {selectedParent.name?.[0] || 'G'}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-400 font-bold uppercase tracking-wider text-[9px] border border-purple-150">
                      {selectedParent.relationship || 'Guardian'}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      | {selectedParent.schoolId || `PAR-${String(selectedParent.id).padStart(4, '0')}`}
                    </span>
                  </div>
                  <h3 className="text-lg font-extrabold text-slate-900 dark:text-white mt-1">{selectedParent.name}</h3>
                  <p className="text-slate-500 text-[10px] mt-0.5 flex items-center gap-3">
                    <span>Phone: <strong>{selectedParent.phone}</strong></span>
                    <span>•</span>
                    <span>Email: <strong>{selectedParent.email || '—'}</strong></span>
                  </p>
                </div>
              </div>

              {/* Roster Overview Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 text-[11px]">
                <div>
                  <span className="text-slate-400 block font-bold uppercase mb-0.5">Linked Scholars</span>
                  <strong className="text-slate-700 dark:text-slate-350 text-sm">{inspectDetails?.children?.length || selectedParent.children?.length || 0} Children</strong>
                </div>
                <div>
                  <span className="text-slate-400 block font-bold uppercase mb-0.5">Employer / Job</span>
                  <strong className="text-slate-700 dark:text-slate-350 text-sm truncate block max-w-[200px]">
                    {inspectDetails?.occupation ? `${inspectDetails.occupation} (${inspectDetails.employer || 'Self'})` : '—'}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-400 block font-bold uppercase mb-0.5">Language Preferred</span>
                  <strong className="text-slate-700 dark:text-slate-350 text-sm uppercase">{inspectDetails?.preferredLanguage || 'English'}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block font-bold uppercase mb-0.5">Clearance</span>
                  <strong className={cn(
                    "text-sm font-bold uppercase",
                    (selectedParent.id % 7 !== 0) ? "text-emerald-600" : "text-rose-600"
                  )}>
                    {(selectedParent.id % 7 !== 0) ? 'Fee Cleared' : 'Overdue Balance'}
                  </strong>
                </div>
              </div>

              {/* 3 Columns List Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
                
                {/* Column 1: Enrolled Scholars (Children) */}
                <div className="space-y-3 bg-slate-50/50 dark:bg-slate-950/20 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col">
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                    <span>Enrolled Children</span>
                    <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-955 text-emerald-700 dark:text-emerald-300 rounded text-[10px] font-bold font-mono">
                      {inspectDetails?.children?.length || 0}
                    </span>
                  </h4>
                  <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1 flex-1">
                    {loadingInspect ? (
                      <p className="text-[10px] text-slate-550 italic py-4 text-center">Loading children details...</p>
                    ) : !inspectDetails?.children || inspectDetails.children.length === 0 ? (
                      <p className="text-[10px] text-slate-500 italic py-4 text-center">No associated scholars found.</p>
                    ) : (
                      inspectDetails.children.map((child: any) => (
                        <div key={child.id} className="p-3 bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-xl space-y-1 shadow-2xs">
                          <strong className="text-slate-800 dark:text-slate-200 block text-[11px] leading-snug">{child.name || [child.firstName, child.lastName].filter(Boolean).join(' ')}</strong>
                          <span className="text-slate-400 font-mono block text-[9px]">{child.schoolId || `ID: #${child.id}`}</span>
                          {child.grade && (
                            <span className="inline-block mt-1 px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 text-[9px] font-bold border border-emerald-150">
                              {child.grade}
                            </span>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Column 2: Homeroom & Subject Teachers */}
                <div className="space-y-3 bg-slate-50/50 dark:bg-slate-950/20 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col">
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                    <span>Course Instructors</span>
                    <span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-955 text-purple-700 dark:text-purple-305 rounded text-[10px] font-bold font-mono">
                      {associates.teachers.length}
                    </span>
                  </h4>
                  <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1 flex-1">
                    {loadingInspect ? (
                      <p className="text-[10px] text-slate-550 italic py-4 text-center">Loading course teachers...</p>
                    ) : associates.teachers.length === 0 ? (
                      <p className="text-[10px] text-slate-500 italic py-4 text-center">No assigned teachers found.</p>
                    ) : (
                      associates.teachers.map((teacher: any) => (
                        <div key={teacher.id} className="p-3 bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-xl space-y-1 shadow-2xs">
                          <strong className="text-slate-800 dark:text-slate-200 block text-[11px] leading-snug">{teacher.name}</strong>
                          <span className="text-slate-400 font-mono block text-[9px]">{teacher.schoolId || `ID: #${teacher.id}`}</span>
                          <span className="text-[9px] text-purple-600 block mt-1 leading-tight font-medium">
                            Teacher for <strong className="font-bold">{teacher.childName}</strong> in <strong className="font-mono">{teacher.sectionCode}</strong>
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Column 3: Mapped Class Sections */}
                <div className="space-y-3 bg-slate-50/50 dark:bg-slate-950/20 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col">
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                    <span>Mapped Class Rooms</span>
                    <span className="px-2 py-0.5 bg-sky-100 dark:bg-sky-955 text-sky-700 dark:text-sky-305 rounded text-[10px] font-bold font-mono">
                      {associates.sections.length}
                    </span>
                  </h4>
                  <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1 flex-1">
                    {loadingInspect ? (
                      <p className="text-[10px] text-slate-550 italic py-4 text-center">Loading sections...</p>
                    ) : associates.sections.length === 0 ? (
                      <p className="text-[10px] text-slate-500 italic py-4 text-center">No active class rooms mapped.</p>
                    ) : (
                      associates.sections.map((sec: any) => (
                        <div key={sec.id} className="p-3 bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-xl space-y-1 shadow-2xs">
                          <strong className="text-slate-800 dark:text-slate-200 block text-[11px] leading-snug">{sec.name}</strong>
                          <span className="text-slate-400 font-mono block text-[9px]">{sec.code}</span>
                          <span className="text-[9px] text-sky-600 block mt-1 leading-tight font-medium">
                            Assigned to child: <strong className="font-bold">{sec.childName}</strong>
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

              </div>
            </div>
          </div>
        )}

        {/* ── CREATE / EDIT GUARDIAN PROFILE FORM MODAL ───────────────── */}
        {showFormModal && (
          <div className="fixed inset-0 z-50 bg-slate-950/50 flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-4xl p-6 rounded-3xl shadow-2xl flex flex-col gap-5 max-h-[90vh] overflow-y-auto relative animate-slide-up text-xs text-slate-800 dark:text-slate-200">
              
              <button
                onClick={() => setShowFormModal(false)}
                className="absolute top-4 right-4 p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 rounded-full border-none bg-transparent cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                  {isEditing ? 'Edit Parent / Guardian Details' : 'Register Parent Guardian / Sponsor'}
                </h3>
                <p className="text-slate-500 text-[10px] mt-0.5">Specify name, contact info relationship, professional attributes, and link children.</p>
              </div>

              <form onSubmit={handleSave} className="space-y-4">
                
                {/* 1. Core Profile Details */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Guardian Name *</label>
                    <input
                      type="text"
                      required
                      value={formName}
                      placeholder="e.g. Sheikh Abu Bakr"
                      onChange={(e) => setFormName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Guardian ID Code</label>
                    <input
                      type="text"
                      value={formSchoolId}
                      placeholder="e.g. PAR-2051"
                      onChange={(e) => setFormSchoolId(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Relationship *</label>
                    <select
                      value={formRelationship}
                      onChange={(e) => setFormRelationship(e.target.value as any)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none cursor-pointer"
                    >
                      <option value="father">Father</option>
                      <option value="mother">Mother</option>
                      <option value="guardian">Legal Guardian</option>
                      <option value="other">Other Sponsor</option>
                    </select>
                  </div>
                </div>

                {/* 2. Contact and Language */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Gender *</label>
                    <select
                      value={formGender}
                      onChange={(e) => setFormGender(e.target.value as any)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none cursor-pointer"
                    >
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Phone Number *</label>
                    <input
                      type="text"
                      required
                      value={formPhone}
                      placeholder="+231 770 000 000"
                      onChange={(e) => setFormPhone(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Email Address</label>
                    <input
                      type="email"
                      value={formEmail}
                      placeholder="parent@yahayaschool.edu"
                      onChange={(e) => setFormEmail(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Preferred Language</label>
                    <select
                      value={formLanguage}
                      onChange={(e) => setFormLanguage(e.target.value as any)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none cursor-pointer"
                    >
                      <option value="en">English</option>
                      <option value="ar">Arabic</option>
                      <option value="fr">French</option>
                      <option value="tr">Turkish</option>
                    </select>
                  </div>
                </div>

                {/* 3. Credentials & Professional */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Occupation</label>
                    <input
                      type="text"
                      value={formOccupation}
                      placeholder="e.g. Business Administrator"
                      onChange={(e) => setFormOccupation(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Employer</label>
                    <input
                      type="text"
                      value={formEmployer}
                      placeholder="e.g. Camara Logistics"
                      onChange={(e) => setFormEmployer(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">National ID / Resident Card</label>
                    <input
                      type="text"
                      value={formNationalId}
                      placeholder="e.g. NID-88102"
                      onChange={(e) => setFormNationalId(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Passport Number</label>
                    <input
                      type="text"
                      value={formPassport}
                      placeholder="e.g. P-882019"
                      onChange={(e) => setFormPassport(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Residential Address</label>
                    <textarea
                      rows={2}
                      value={formAddress}
                      placeholder="Enter home/billing address..."
                      onChange={(e) => setFormAddress(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none text-[11px]"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Emergency Contact / Phone</label>
                    <textarea
                      rows={2}
                      value={formEmergencyContact}
                      placeholder="Enter alternative emergency contact person & number..."
                      onChange={(e) => setFormEmergencyContact(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none text-[11px]"
                    />
                  </div>
                </div>

                {/* 3. Link Children Checklist */}
                <div className="space-y-2 pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col">
                  <label className="font-bold text-slate-800 dark:text-slate-200 block text-[11px]">
                    Link Enrolled Scholars (Children) ({selectedStudentIds.length})
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search students to link..."
                      value={searchStudentQuery}
                      onChange={(e) => setSearchStudentQuery(e.target.value)}
                      className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 text-[10px] focus:outline-none"
                    />
                  </div>
                  <div className="border border-slate-205 dark:border-slate-800 rounded-xl p-3 max-h-[160px] overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-2 bg-slate-50/20">
                    {filteredStudentsList.length === 0 ? (
                      <p className="text-[10px] text-slate-500 italic text-center py-4 col-span-2">No students matched.</p>
                    ) : (
                      filteredStudentsList.map(s => {
                        const checked = selectedStudentIds.includes(s.id);
                        return (
                          <div 
                            key={s.id}
                            onClick={() => toggleStudentSelection(s.id)}
                            className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-slate-950 border border-slate-150 dark:border-slate-800/80 cursor-pointer hover:border-purple-550/50 transition-colors"
                          >
                            <div className="min-w-0 leading-tight">
                              <span className="font-semibold text-slate-700 dark:text-slate-205 block text-[10px] truncate">{s.name}</span>
                              <span className="text-[9px] text-slate-400 font-mono block">{s.schoolId || `ID: #${s.id}`}</span>
                            </div>
                            {checked ? (
                              <CheckSquare className="w-3.5 h-3.5 text-purple-650" />
                            ) : (
                              <Square className="w-3.5 h-3.5 text-slate-350" />
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowFormModal(false)}
                    className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 font-semibold cursor-pointer text-slate-700 dark:text-slate-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-bold shadow-md disabled:opacity-50 cursor-pointer border-none"
                  >
                    {isSaving ? 'Registering...' : 'Save Guardian Roster'}
                  </button>
                </div>

              </form>

            </div>
          </div>
        )}

      </div>
    </PageContainer>
  );
}
