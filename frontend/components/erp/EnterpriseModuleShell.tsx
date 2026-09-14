'use client';

import React from 'react';
import { ChevronRight, Calendar, Clock, Filter } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useLocale } from 'next-intl';
import { i18nDict } from '@/lib/i18n-dict';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface EnterpriseModuleShellProps {
  title: string;
  description: string;
  breadcrumbs: BreadcrumbItem[];
  icon?: React.ReactNode;
  recordCount?: number | string;
  recordLabel?: string;
  academicYear?: string;
  lastUpdated?: string;
  activeFilterCount?: number;
  onClearFilters?: () => void;
  headerActions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

// ERP-specific translation terms (merged with central i18n-dict)
const erpLocalDict: Record<string, Record<string, string>> = {
    ar: {
      'dashboard': 'لوحة التحكم',
      'academic year:': 'العام الدراسي:',
      'updated': 'تم التحديث',
      'just now': 'الآن',
      'records': 'سجلات',
      'records found': 'سجلات تم العثور عليها',
      'active filter': 'فلتر نشط',
      'active filters': 'فلاتر نشطة',
      'clear': 'مسح',
      'click to clear all active filters': 'اضغط لمسح كافة الفلاتر النشطة',
      'search': 'بحث',
      'filter': 'تصفية',
      'export': 'تصدير',
      'import': 'استيراد',
      'export csv': 'تصدير CSV',
      'open new cash drawer': 'فتح درج نقدي جديد',
      'open new cash drawer +': 'فتح درج نقدي جديد +',
      'open drawer session +': 'فتح جلسة صندوق +',
      'open session float +': 'بدء رصيد الجلسة +',
      'advanced': 'متقدم',
      'all session statuses': 'كافة حالات الجلسة',
      'cashier session management & cash drawer reconciliation': 'إدارة جلسات الصناديق وتسوية الخزائن المالية',
      'monitor opening float balances, track daily pos terminal and physical cash receipts across cashiers, and enforce strict zero-variance daily closing reconciliation': 'مراقبة أرصدة البداية، وتتبع عمليات نقاط البيع والمتحصلات النقدية اليومية، وفرض تسوية يومية دقيقة بدون فروقات.',
      'cash variance compliance': 'الامتثال لفروقات النقدية',
      'balanced 100%': 'متوازن 100%',
      'unexplained cash differences (academic year) $0.00': 'فروق نقدية غير مبررة (السنة الأكاديمية) $0.00',
      'unexplained cash differences (academic year)': 'فروق نقدية غير مبررة (السنة الأكاديمية)',
      'closed & reconciled sessions': 'الجلسات المغلقة والمستواة',
      'sessions': 'جلسات',
      'reconciled and balanced by account lead': 'تمت التسوية والمطابقة من قبل رئيس الحسابات',
      'current open drawer collections': 'متحصلات الصناديق المفتوحة حالياً',
      'cash, pos card, and physical cheque receipts today': 'المقبوضات النقدية وبطاقات الدفع والشيكات اليوم',
      'open cashier sessions': 'جلسات الصناديق المفتوحة',
      'campus cashier terminal drawers active': 'صناديق نقاط البيع النشطة في الحرم المدرسي',
      'student running ledger': 'دفتر الحساب الجاري للطلاب',
      'cashier sessions & drawer': 'جلسات الخزينة والصناديق',
      'multi-method cashier & pos': 'نقاط البيع متعددة الوسائل',
      'invoices console': 'لوحة التحكم بالفواتير',
      'no cashier sessions found': 'لم يتم العثور على جلسات صناديق',
      'no records match your search query or status filter': 'لا توجد سجلات تطابق بحثك أو حالة التصفية المحددة.',
      'session ref & cashier': 'مرجع الجلسة وأمين الصندوق',
      'timestamps (opened / closed)': 'التوقيت (مفتوح / مغلق)',
      'float & collections ($)': 'الرصيد الافتتاحي والمتحصلات ($)',
      'closing drawer & variance ($)': 'الرصيد الإغلاقي والفروقات ($)',
      'actions': 'الإجراءات',
      'opened': 'مفتوح',
      'closed': 'مغلق',
      'active now': 'نشط الآن',
      'opening float': 'الرصيد الافتتاحي',
      'collected': 'متحصل عليه',
      'receipts': 'إيصالات',
      'expected closing': 'الإغلاق المتوقع',
      'variance': 'الفروقات المالية',
      'status': 'الحالة',
      'finance': 'المالية',
      'billing': 'الفواتير والرسوم',
      'sessions & drawers': 'الجلسات والصناديق',
      'parents': 'أولياء الأمور',
      'guardians': 'الأوصياء والجهات الكفيلة',
      'parents & guardians registry': 'سجل أولياء الأمور والأوصياء',
      'registered mothers, fathers, and legal guardians linked to enrolled scholars with portal access and financial clearance tracking': 'الأوصياء والأمهات والآباء المسجلين والمرتبطين بالطلاب مع تتبع براءة الذمة المالية والوصول للنظام.',
      'overdue accounts': 'الحسابات المتأخرة سدادها',
      'clearance status': 'حالة براءة الذمة',
      'linked scholars': 'الطلاب المرتبطين',
      'registered guardians': 'الأوصياء المسجلين',
      'all relationships': 'كل صلات القرابة',
      'father': 'أب',
      'mother': 'أم',
      'legal guardian': 'وصي قانوني',
      'other sponsor': 'كفيل آخر',
      'all billing clearance': 'كل براءات الذمم المالي',
      'cleared accounts': 'الحسابات الخالية من الديون',
      'overdue balance': 'الأرصدة المتأخرة المستحقة',
      'no guardians found': 'لم يتم العثور على أولياء أمور.',
      'guardian profile': 'ملف ولي الأمر',
      'linked student scholars': 'الطلاب المرتبطين',
      'contact details': 'معلومات الاتصال',
      'billing clearance': 'براءة الذمة المالية',
      'cleared': 'مستوفي الدفع',
      'overdue': 'متأخرات مالية',
      'search sessions by reference (csh-2026-xxxx) or cashier name...': 'البحث عن الجلسات بالرقم المرجعي (CSH-2026-XXXX) أو باسم أمين الصندوق...',
      'open (active drawers)': 'مفتوح (الصناديق النشطة)',
      'reconciled / closed': 'تمت التسوية / مغلق',
      'no terminal sessions match your search query or status filter.': 'لا توجد جلسات مطابقة لبحثك أو حالة التصفية المحددة.',
      '+ open new cash drawer': 'فتح درج نقدي جديد +',
      '+ open drawer session': 'فتح جلسة صندوق +',
      'enterprise system portal': 'بوابة النظام للمؤسسة',
      'live erp overview, system metrics, academic distribution, and security monitoring.': 'نظرة عامة حية على نظام إدارة موارد المؤسسة، ومقاييس النظام، والتوزيع الأكاديمي، والمراقبة الأمنية.',
      'refresh live data': 'تحديث البيانات الحية',
      'total students': 'إجمالي الطلاب',
      'live vs last term': 'الحالي مقارنة بالفصل الأخير',
      'faculty members': 'أعضاء هيئة التدريس',
      'active teaching staff': 'أعضاء هيئة التدريس النشطين',
      'parent accounts': 'حسابات أولياء الأمور',
      'linked guardian profiles': 'ملفات أولياء الأمور المرتبطة',
      'academic depts': 'الأقسام الأكاديمية',
      'active programs': 'برامج نشطة',
      'attendance logs': 'سجلات الحضور',
      'total session entries recorded': 'إجمالي قيود الجلسات المسجلة',
      'active homework': 'الواجبات المنزلية النشطة',
      'lesson plans': 'خطط الدروس',
      'examinations': 'الامتحانات',
      'certificates issued': 'الشهادات الصادرة',
      'audit trail logs': 'سجلات تتبع التدقيق',
      'security events logged': 'الأنشطة الأمنية المسجلة',
      'academic enrollment by level': 'التسجيل الأكاديمي حسب المستوى',
      'student distribution across sections': 'توزيع الطلاب على الأقسام',
      'departmental share': 'توزيع الأقسام الأكاديمية',
      'active student/faculty breakdown': 'توزيع الطلاب وأعضاء التدريس',
      'weekly attendance trend (%)': 'اتجاه الحضور الأسبوعي (%)',
      'platform-wide attendance verification rate': 'معدل التحقق من الحضور على مستوى المنصة',
      'live system audit trail': 'سجل تدقيق النظام المباشر',
      'view all logs →': 'عرض كافة السجلات ←',
      'loading recent system activities...': 'جاري تحميل أنشطة النظام الأخيرة...',
      'no recent audit logs found in live database.': 'لم يتم العثور على سجلات تدقيق حديثة في قاعدة البيانات.',
      'live announcements': 'الإعلانات المباشرة',
      'new +': 'جديد +',
      'loading announcements...': 'جاري تحميل الإعلانات...',
      'no active announcements published yet.': 'لم يتم نشر أي إعلانات نشطة بعد.',
    },
    fr: {
      'dashboard': 'Tableau de bord',
      'academic year:': 'Année Académique:',
      'updated': 'Mis à jour',
      'just now': "À l'instant",
      'records': 'Registres',
      'records found': 'enregistrements trouvés',
      'active filter': 'Filtre actif',
      'active filters': 'Filtres actifs',
      'clear': 'Effacer',
      'click to clear all active filters': 'Cliquez pour effacer les filtres actifs',
      'search': 'Rechercher',
      'filter': 'Filtrer',
      'export': 'Exporter',
      'import': 'Importer',
      'export csv': 'Exporter en CSV',
      'open new cash drawer': 'Ouvrir tiroir-caisse',
      'open new cash drawer +': 'Ouvrir tiroir-caisse +',
      'open drawer session +': 'Ouvrir session +',
      'open session float +': 'Ouvrir fonds de caisse +',
      'advanced': 'Avancé',
      'all session statuses': 'Tous les statuts de session',
      'cashier session management & cash drawer reconciliation': 'Gestion des sessions de caisse & Réconciliation',
      'monitor opening float balances, track daily pos terminal and physical cash receipts across cashiers, and enforce strict zero-variance daily closing reconciliation': 'Surveillez les soldes de départ, suivez les terminaux de paiement et assurez une réconciliation quotidienne stricte.',
      'cash variance compliance': 'Conformité des écarts de caisse',
      'balanced 100%': 'Équilibré 100%',
      'unexplained cash differences (academic year) $0.00': 'Écarts de caisse inexpliqués (Année académique) 0,00 $',
      'unexplained cash differences (academic year)': 'Écarts de caisse inexpliqués (Année académique)',
      'closed & reconciled sessions': 'Sessions clôturées & réconciliées',
      'sessions': 'sessions',
      'reconciled and balanced by account lead': 'Réconcilié par le responsable comptable',
      'current open drawer collections': 'Collectes du tiroir-caisse actif',
      'cash, pos card, and physical cheque receipts today': 'Recettes en espèces, carte POS et chèques aujourd\'hui',
      'open cashier sessions': 'Sessions de caisse ouvertes',
      'campus cashier terminal drawers active': 'Terminaux de caisse de campus actifs',
      'student running ledger': 'Grand livre courant étudiant',
      'cashier sessions & drawer': 'Sessions de caisse & Tiroir',
      'multi-method cashier & pos': 'Caisse multi-méthodes & POS',
      'invoices console': 'Console de facturation',
      'no cashier sessions found': 'Aucune session de caisse trouvée',
      'no records match your search query or status filter': 'Aucun enregistrement ne correspond à vos filtres.',
      'session ref & cashier': 'Réf Session & Caissier',
      'timestamps (opened / closed)': 'Horodatage (Ouvert / Fermé)',
      'float & collections ($)': 'Fonds de caisse & Collectes ($)',
      'closing drawer & variance ($)': 'Tiroir de fermeture & Écart ($)',
      'actions': 'Actions',
      'opened': 'Ouvert',
      'closed': 'Fermé',
      'active now': 'Actif maintenant',
      'opening float': 'Solde d\'ouverture',
      'collected': 'Collecté',
      'receipts': 'recettes',
      'expected closing': 'Clôture attendue',
      'variance': 'Écart financier',
      'status': 'Statut',
      'finance': 'Finance',
      'billing': 'Facturation',
      'sessions & drawers': 'Sessions & Tiroirs',
      'parents': 'Parents',
      'guardians': 'Tuteurs',
      'parents & guardians registry': 'Registre des Parents & Tuteurs',
      'registered mothers, fathers, and legal guardians linked to enrolled scholars with portal access and financial clearance tracking': 'Mères, pères et tuteurs enregistrés liés aux élèves avec accès au portail et suivi financier.',
      'overdue accounts': 'Comptes en retard',
      'clearance status': 'Statut de paiement',
      'linked scholars': 'Élèves liés',
      'registered guardians': 'Tuteurs enregistrés',
      'all relationships': 'Toutes les relations',
      'father': 'Père',
      'mother': 'Mère',
      'legal guardian': 'Tuteur légal',
      'other sponsor': 'Autre parrain',
      'all billing clearance': 'Tous les statuts de paiement',
      'cleared accounts': 'Comptes en règle',
      'overdue balance': 'Solde en retard',
      'no guardians found': 'Aucun tuteur trouvé.',
      'guardian profile': 'Profil du tuteur',
      'linked student scholars': 'Élèves liés',
      'contact details': 'Détails de contact',
      'billing clearance': 'Règlement financier',
      'cleared': 'En règle',
      'overdue': 'En retard',
      'search sessions by reference (csh-2026-xxxx) or cashier name...': 'Rechercher des sessions par référence (CSH-2026-XXXX) ou par nom de caissier...',
      'open (active drawers)': 'Ouvert (Tiroirs actifs)',
      'reconciled / closed': 'Réconcilié / Fermé',
      'no terminal sessions match your search query or status filter.': 'Aucune session de caisse ne correspond à votre recherche ou filtre.',
      '+ open new cash drawer': 'Ouvrir tiroir-caisse +',
      '+ open drawer session': 'Ouvrir session +',
      'enterprise system portal': 'Portail Système de l\'Entreprise',
      'live erp overview, system metrics, academic distribution, and security monitoring.': 'Aperçu de l\'ERP en direct, métriques système, répartition académique et surveillance.',
      'refresh live data': 'Actualiser les données en direct',
      'total students': 'Total des étudiants',
      'live vs last term': 'Actuel vs dernier trimestre',
      'faculty members': 'Membres de la faculté',
      'active teaching staff': 'Personnel enseignant actif',
      'parent accounts': 'Comptes parents',
      'linked guardian profiles': 'Profils de tuteurs liés',
      'academic depts': 'Départements Académiques',
      'active programs': 'programmes actifs',
      'attendance logs': 'Registres de Présence',
      'total session entries recorded': 'Total des entrées de session enregistrées',
      'active homework': 'Devoirs Actifs',
      'lesson plans': 'plans de cours',
      'examinations': 'Examens',
      'certificates issued': 'certificats délivrés',
      'audit trail logs': 'Registres d\'Audit',
      'security events logged': 'Événements de sécurité enregistrés',
      'academic enrollment by level': 'Inscriptions Académiques par Niveau',
      'student distribution across sections': 'Répartition des élèves par section',
      'departmental share': 'Part Départementale',
      'active student/faculty breakdown': 'Répartition active élèves/enseignants',
      'weekly attendance trend (%)': 'Tendance Hebdomadaire des Présences (%)',
      'platform-wide attendance verification rate': 'Taux de vérification des présences sur la plateforme',
      'live system audit trail': 'Piste d\'Audit Système en Direct',
      'view all logs →': 'Voir tous les registres →',
      'loading recent system activities...': 'Chargement des activités système récentes...',
      'no recent audit logs found in live database.': 'Aucun registre d\'audit récent trouvé dans la base de données.',
      'live announcements': 'Annonces en Direct',
      'new +': 'Nouveau +',
      'loading announcements...': 'Chargement des annonces...',
      'no active announcements published yet.': 'Aucune annonce active publiée pour le moment.',
    },
    tr: {
      'dashboard': 'Kontrol Paneli',
      'academic year:': 'Akademik Yıl:',
      'updated': 'Güncellendi',
      'just now': 'Şimdi',
      'records': 'Kayıtlar',
      'records found': 'kayıt bulundu',
      'active filter': 'Aktif filtre',
      'active filters': 'Aktif filtreler',
      'clear': 'Temizle',
      'click to clear all active filters': 'Tüm aktif filtreleri temizle',
      'search': 'Ara',
      'filter': 'Filtrele',
      'export': 'Dışa Aktar',
      'import': 'İçe Aktar',
      'export csv': 'CSV Dışa Aktar',
      'open new cash drawer': 'Yeni Kasa Aç',
      'open new cash drawer +': 'Yeni Kasa Aç +',
      'open drawer session +': 'Kasa Oturumu Aç +',
      'open session float +': 'Kasa Nakit Limiti Aç +',
      'advanced': 'Gelişmiş',
      'all session statuses': 'Tüm Oturum Durumları',
      'cashier session management & cash drawer reconciliation': 'Vezne Oturum Yönetimi & Kasa Mutabakatı',
      'monitor opening float balances, track daily pos terminal and physical cash receipts across cashiers, and enforce strict zero-variance daily closing reconciliation': 'Açılış nakit limitlerini izleyin, günlük POS terminali ve fiziki nakit işlemlerini takip edin.',
      'cash variance compliance': 'Kasa Farkı Uyumluluğu',
      'balanced 100%': 'Dengeli %100',
      'unexplained cash differences (academic year) $0.00': 'Açıklanmayan kasa farkı (Akademik Yıl) $0.00',
      'unexplained cash differences (academic year)': 'Açıklanmayan kasa farkı (Akademik Yıl)',
      'closed & reconciled sessions': 'Kapatılan & Mutabık Oturumlar',
      'sessions': 'oturumlar',
      'reconciled and balanced by account lead': 'Muhasebe Müdürü tarafından kontrol edildi',
      'current open drawer collections': 'Aktif Kasa Tahsilatları',
      'cash, pos card, and physical cheque receipts today': 'Bugünkü nakit, POS kartı ve fiziksel çek tahsilatları',
      'open cashier sessions': 'Açık Vezne Oturumları',
      'campus cashier terminal drawers active': 'Kampüs aktif vezne çekmeceleri',
      'student running ledger': 'Öğrenci Güncel Hesap Defteri',
      'cashier sessions & drawer': 'Vezne Oturumları & Kasa',
      'multi-method cashier & pos': 'Çok Yöntemli Vezne & POS',
      'invoices console': 'Fatura Paneli',
      'no cashier sessions found': 'Kasa oturumu bulunamadı',
      'no records match your search query or status filter': 'Arama kriterlerinize veya durum filtrelerinize uygun kayıt bulunamadı.',
      'session ref & cashier': 'Oturum Ref & Veznedar',
      'timestamps (opened / closed)': 'Zaman Damgaları (Açılış / Kapanış)',
      'float & collections ($)': 'Açılış Bakiyesi & Tahsilat ($)',
      'closing drawer & variance ($)': 'Kapanış Kasası & Fark ($)',
      'actions': 'İşlemler',
      'opened': 'Açıldı',
      'closed': 'Kapatıldı',
      'active now': 'Şu An Aktif',
      'opening float': 'Açılış Kasası',
      'collected': 'Tahsil edilen',
      'receipts': 'makbuzlar',
      'expected closing': 'Beklenen Kapanış',
      'variance': 'Kasa Farkı',
      'status': 'Durum',
      'finance': 'Finans',
      'billing': 'Faturalandırma',
      'sessions & drawers': 'Oturumlar & Kasalar',
      'parents': 'Veliler',
      'guardians': 'Vasiler',
      'parents & guardians registry': 'Veli ve Vasi Kayıt Defteri',
      'registered mothers, fathers, and legal guardians linked to enrolled scholars with portal access and financial clearance tracking': 'Portala erişimi ve mali durum takibi bulunan, kayıtlı öğrencilerle ilişkili anne, baba ve yasal vasiler.',
      'overdue accounts': 'Gecikmiş Hesaplar',
      'clearance status': 'Borç Durumu',
      'linked scholars': 'Bağlantılı Öğrenciler',
      'registered guardians': 'Kayıtlı Veliler',
      'all relationships': 'Tüm İlişkiler',
      'father': 'Baba',
      'mother': 'Anne',
      'legal guardian': 'Yasal Vasi',
      'other sponsor': 'Diğer Sponsor',
      'all billing clearance': 'Tüm Borç Durumları',
      'cleared accounts': 'Borcu Olmayan Hesaplar',
      'overdue balance': 'Gecikmiş Borç Bakiyesi',
      'no guardians found': 'Hiçbir veli bulunamadı.',
      'guardian profile': 'Veli Profili',
      'linked student scholars': 'Bağlantılı Öğrenciler',
      'contact details': 'İletişim Bilgileri',
      'billing clearance': 'Mali Borç Durumu',
      'cleared': 'Borcu Yok',
      'overdue': 'Borçlu',
      'search sessions by reference (csh-2026-xxxx) or cashier name...': 'Referansa (CSH-2026-XXXX) veya veznedar adına göre oturumları arayın...',
      'open (active drawers)': 'Açık (Aktif Kasalar)',
      'reconciled / closed': 'Mutabık / Kapalı',
      'no terminal sessions match your search query or status filter.': 'Arama kriterlerinize veya durum filtrelerinize uygun kasa oturumu bulunamadı.',
      '+ open new cash drawer': 'Yeni Kasa Çekmecesi Aç +',
      '+ open drawer session': 'Kasa Oturumu Aç +',
      'enterprise system portal': 'Kurumsal Sistem Portalı',
      'live erp overview, system metrics, academic distribution, and security monitoring.': 'Canlı ERP genel bakışı, sistem metrikleri, akademik dağılım ve güvenlik izleme.',
      'refresh live data': 'Canlı Verileri Yenile',
      'total students': 'Toplam Öğrenci',
      'live vs last term': 'Geçen döneme göre canlı durum',
      'faculty members': 'Öğretim Üyeleri',
      'active teaching staff': 'Aktif öğretim kadrosu',
      'parent accounts': 'Veli Hesapları',
      'linked guardian profiles': 'Bağlantılı veli profilleri',
      'academic depts': 'Akademik Bölümler',
      'active programs': 'aktif program',
      'attendance logs': 'Devamsızlık Kayıtları',
      'total session entries recorded': 'Toplam kaydedilen oturum girişi',
      'active homework': 'Aktif Ödevler',
      'lesson plans': 'ders planı',
      'examinations': 'Sınavlar',
      'certificates issued': 'sertifika düzenlendi',
      'audit trail logs': 'Denetim Günlükleri',
      'security events logged': 'Kaydedilen güvenlik olayları',
      'academic enrollment by level': 'Kademeye Göre Akademik Kayıt Durumu',
      'student distribution across sections': 'Şubelere göre öğrenci dağılımı',
      'departmental share': 'Bölüm Paylaşımı',
      'active student/faculty breakdown': 'Aktif öğrenci/öğretmen dağılımı',
      'weekly attendance trend (%)': 'Haftalık Devam Eğilimi (%)',
      'platform-wide attendance verification rate': 'Platform geneli devam doğrulama oranı',
      'live system audit trail': 'Canlı Sistem Denetim Günlüğü',
      'view all logs →': 'Tüm günlükleri görüntüle →',
      'loading recent system activities...': 'Sistem etkinlikleri yükleniyor...',
      'no recent audit logs found in live database.': 'Canlı veritabanında son denetim günlüğü bulunamadı.',
      'live announcements': 'Canlı Duyurular',
      'new +': 'Yeni +',
      'loading announcements...': 'Duyurular yükleniyor...',
      'no active announcements published yet.': 'Henüz yayınlanmış aktif bir duyuru bulunuyor.',
    }
  };

// Comprehensive ERP Dynamic Translation Map — merges centralized i18n-dict with ERP-specific terms
export function getTranslation(text: string | undefined, locale: string): string {
  if (!text) return '';
  const norm = text.toLowerCase().trim().replace(/\s+/g, ' ');

  // Merge central dict + ERP-specific dict (ERP-specific takes precedence)
  const centralDict = (i18nDict as Record<string, Record<string, string>>)[locale] || {};
  const erpDict = erpLocalDict[locale] || {};
  const merged = { ...centralDict, ...erpDict };

  return merged[norm] || merged[norm.replace(/\.$/, '')] || text;
}

export function EnterpriseModuleShell({
  title,
  description,
  breadcrumbs = [],
  icon,
  recordCount,
  recordLabel = 'Records',
  academicYear = '2026-2027',
  lastUpdated = 'Just now',
  activeFilterCount = 0,
  onClearFilters,
  headerActions,
  children,
  className,
}: EnterpriseModuleShellProps) {
  const locale = useLocale();

  return (
    <div className={cn("w-full px-4 sm:px-6 py-4 space-y-4 transition-all", className)}>
      {/* Ultra-Compact Light Enterprise Header Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 sm:px-5 py-3 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Left Block: Breadcrumbs, Title, Description */}
          <div className="min-w-0 flex-1 space-y-1">
            {/* Top Meta Line */}
            <div className="flex flex-wrap items-center gap-2 text-[11px] font-medium text-slate-500 dark:text-slate-400">
              <nav aria-label="Breadcrumb" className="flex items-center gap-1">
                <Link href="/dashboard" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
                  {getTranslation('Dashboard', locale)}
                </Link>
                {breadcrumbs.map((item, index) => (
                  <React.Fragment key={index}>
                    <ChevronRight className="w-3 h-3 text-slate-400 shrink-0" />
                    {item.href ? (
                      <Link href={item.href} className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
                        {getTranslation(item.label, locale)}
                      </Link>
                    ) : (
                      <span className="text-slate-700 dark:text-slate-300 font-semibold">{getTranslation(item.label, locale)}</span>
                    )}
                  </React.Fragment>
                ))}
              </nav>

              <span className="text-slate-300 dark:text-slate-700">|</span>

              <span className="flex items-center gap-1 font-mono">
                <Calendar className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>{getTranslation('Academic Year:', locale)} <strong className="text-slate-800 dark:text-slate-200">{academicYear}</strong></span>
              </span>

              <span className="text-slate-300 dark:text-slate-700">|</span>

              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                <span>{getTranslation('Updated', locale)} {getTranslation(lastUpdated, locale)}</span>
              </span>
            </div>

            {/* Title & Record Pill */}
            <div className="flex items-center gap-2.5 pt-0.5">
              {icon && (
                <div className="text-emerald-600 dark:text-emerald-500 shrink-0 [&>svg]:w-5 [&>svg]:h-5">
                  {icon}
                </div>
              )}
              <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight truncate">
                {getTranslation(title, locale)}
              </h1>
              {recordCount !== undefined && (
                <span className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-semibold text-xs border border-emerald-200 dark:border-emerald-800/80 font-mono shrink-0">
                  {typeof recordCount === 'number' ? recordCount.toLocaleString('en-US') : recordCount} {getTranslation(recordLabel, locale)}
                </span>
              )}
            </div>

            {/* Concise Description */}
            <p className="text-xs text-slate-600 dark:text-slate-400 truncate max-w-4xl font-normal">
              {getTranslation(description, locale)}
            </p>
          </div>

          {/* Right Block: Actions & Filters Badge */}
          <div className="flex flex-wrap items-center gap-2 shrink-0 self-start lg:self-center">
            {activeFilterCount > 0 && (
              <button
                onClick={onClearFilters}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/50 border border-amber-200 dark:border-amber-800/80 text-amber-800 dark:text-amber-300 font-semibold text-xs transition-colors cursor-pointer shadow-2xs"
                title={getTranslation('Click to clear all active filters', locale)}
              >
                <Filter className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                <span>{activeFilterCount} {getTranslation(activeFilterCount > 1 ? 'Active Filters' : 'Active Filter', locale)} ({getTranslation('Clear', locale)})</span>
              </button>
            )}

            {headerActions}
          </div>
        </div>
      </div>

      {/* Module Body Children */}
      <div className="space-y-4 w-full">
        {children}
      </div>
    </div>
  );
}
