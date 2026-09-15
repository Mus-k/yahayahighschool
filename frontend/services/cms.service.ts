import axios from 'axios';
import qs from 'qs';
import type {
  HomepageEntity,
  CustomPageEntity,
  ProgramEntity,
  DepartmentEntity,
  ArticleEntity,
  CategoryEntity,
  EventEntity,
  AnnouncementEntity,
  TestimonialEntity,
  GalleryItemEntity,
  DownloadItemEntity,
  FaqEntity,
  ContactInfo,
  FooterConfig,
  NavigationMenu,
  PartnerEntity,
  DonationCampaignEntity,
  ContactSubmissionPayload,
  AdmissionApplicationPayload,
  DonationSettingsEntity,
  CareerPositionEntity,
  CareerSettingEntity,
  StaffMemberEntity,
  PursuitCtaEntity,
  AboutPageEntity,
  NewsPageEntity,
  SchoolAcademicProgramEntity,
  SchoolAcademicProgramsPageEntity,
  OnlineLearningPageEntity,
  OnlineCourseEntity,
  LoginPageEntity,
  PrivacyPageEntity
} from '../types/cms.types';

// ── Dedicated CMS client ────────────────────────────────────────────────────
// Public CMS reads (homepage, about, nav, footer…) must use the Strapi API
// Token, NOT the end-user JWT, because these are called server-side where
// no cookie exists, and Strapi returns 403 for unauthenticated requests.
const STRAPI_BASE =
  process.env.NEXT_PUBLIC_STRAPI_URL ||
  process.env.STRAPI_URL ||
  'http://localhost:1339';

const STRAPI_TOKEN =
  process.env.STRAPI_API_TOKEN ||
  process.env.NEXT_PUBLIC_STRAPI_API_TOKEN ||
  '';

const cmsClient = axios.create({
  baseURL: `${STRAPI_BASE}/api`,
  timeout: 30_000,
  headers: {
    'Content-Type': 'application/json',
    ...(STRAPI_TOKEN ? { Authorization: `Bearer ${STRAPI_TOKEN}` } : {}),
  },
});

export const cmsService = {
  /** Helper for robust querying — uses the CMS API-token client, not user JWT */
  async fetchStrapi<T>(endpoint: string, queryParams: any = {}): Promise<T | null> {
    try {
      const queryString = qs.stringify(queryParams, { encodeValuesOnly: true });
      const url = `${endpoint}${queryString ? `?${queryString}` : ''}`;
      const { data } = await cmsClient.get<{ data: T }>(url);
      return data.data;
    } catch (error: any) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        // Entry not yet published in Strapi for this locale — frontend falls back cleanly
        return null;
      }
      console.warn(`[CMS] Notice on ${endpoint}: ${error?.response?.status || error?.message || 'offline'}`);
      return null;
    }
  },


  async getHomepage(locale = 'en'): Promise<HomepageEntity | null> {
    const query = {
      locale,
      populate: {
        seo: { populate: '*' },
        heroSlides: { populate: ['image'] },
        aboutImage: { populate: '*' },
        activitiesCenterImage: { populate: '*' },
        activitiesCards: { populate: ['image'] },
        testimonials: { populate: ['image'] },
      }
    };
    const data = await this.fetchStrapi<HomepageEntity>('/homepage', query);
    return data || null;
  },

  async getLoginPage(locale = 'en'): Promise<LoginPageEntity | null> {
    const query = {
      locale,
      populate: {
        seo: { populate: '*' },
        badgeLogo: { populate: '*' },
        features: { populate: '*' },
      }
    };
    const data = await this.fetchStrapi<LoginPageEntity>('/login-page', query);
    return data || null;
  },

  async getPrivacyPage(locale = 'en'): Promise<PrivacyPageEntity | null> {
    const query = {
      locale,
      populate: {
        seo: { populate: '*' },
      }
    };
    const data = await this.fetchStrapi<PrivacyPageEntity>('/privacy-page', query);
    return data || null;
  },


  async getAboutPage(locale = 'en'): Promise<AboutPageEntity | null> {
    const query = {
      locale,
      populate: {
        seo: { populate: '*' },
        introSection: { populate: '*' },
        missionVisionSection: { populate: '*' },
        valuesSection: { populate: '*' },
        directorSection: { populate: '*' },
        whyChooseSection: { populate: '*' },
        timelineSection: {
          populate: {
            milestones: { populate: '*' }
          }
        },
        certificatesSection: {
          populate: {
            certificates: { populate: '*' }
          }
        }
      }
    };
    const data = await this.fetchStrapi<AboutPageEntity>('/about-page', query);
    return data || null;
  },

  async getNewsPage(locale = 'en'): Promise<NewsPageEntity | null> {
    const query = {
      locale,
      populate: {
        seo: { populate: '*' },
        featuredEvents: {
          populate: ['image', 'gallery', 'tags']
        },
        newsletterCard: { populate: '*' }
      }
    };
    const data = await this.fetchStrapi<NewsPageEntity>('/news-page', query);
    return data || null;
  },

  async getSchoolAcademicProgramsPage(locale = 'en'): Promise<SchoolAcademicProgramsPageEntity | null> {
    const query = {
      locale,
      populate: {
        seo: { populate: '*' },
        heroImage: { populate: '*' },
        approachImage: { populate: '*' },
        approachItems: { populate: '*' }
      }
    };
    const data = await this.fetchStrapi<SchoolAcademicProgramsPageEntity>('/school-academic-programs-page', query);
    return data || null;
  },

  async getSchoolAcademicPrograms(locale = 'en', limit = 50): Promise<SchoolAcademicProgramEntity[]> {
    const query = {
      locale,
      populate: ['coverImage', 'downloadPdf', 'pathwaySteps', 'pathwayImages', 'seo'],
      pagination: { limit },
      sort: ['order:asc', 'createdAt:asc']
    };
    const data = await this.fetchStrapi<SchoolAcademicProgramEntity[]>('/school-academic-programs', query);
    return data || [];
  },

  async getSchoolAcademicProgramBySlug(slug: string, locale = 'en'): Promise<SchoolAcademicProgramEntity | null> {
    const query = {
      locale,
      filters: { slug: { $eq: slug } },
      populate: ['coverImage', 'downloadPdf', 'pathwaySteps', 'pathwayImageLeft', 'pathwayImageTop', 'pathwayImageBottom', 'pathwayImages', 'seo']
    };
    const data = await this.fetchStrapi<SchoolAcademicProgramEntity[]>('/school-academic-programs', query);
    return data && data.length > 0 ? data[0] : null;
  },

  async getOnlineLearningPage(locale = 'en'): Promise<OnlineLearningPageEntity | null> {
    const query = {
      locale,
      populate: {
        heroImage: { populate: '*' },
        approachImage: { populate: '*' },
        approachItems: { populate: '*' },
        seo: { populate: '*' }
      }
    };
    const data = await this.fetchStrapi<OnlineLearningPageEntity>('/online-learning-page', query);
    if (!data && locale !== 'en') {
      return this.getOnlineLearningPage('en');
    }
    return data;
  },

  async getOnlineCourses(locale = 'en'): Promise<OnlineCourseEntity[]> {
    const query = {
      locale,
      sort: ['order:asc', 'createdAt:asc'],
      filters: {
        enrollmentOpen: { $eq: true }
      },
      populate: ['image']
    };
    const data = await this.fetchStrapi<OnlineCourseEntity[]>('/online-courses', query);
    if ((!data || data.length === 0) && locale !== 'en') {
      return this.getOnlineCourses('en');
    }
    return data || [];
  },
  
  async getPageBySlug(slug: string, locale = 'en'): Promise<CustomPageEntity | null> {
    const query = {
      locale,
      filters: { slug: { $eq: slug } },
      populate: {
        seo: { populate: '*' },
        sections: { populate: '*' },
        bulletPoints: { populate: '*' },
        coverImage: { populate: '*' }
      }
    };
    const data = await this.fetchStrapi<CustomPageEntity[]>('/pages', query);
    return data && data.length > 0 ? data[0] : null;
  },

  async getDonationSettings(locale = 'en'): Promise<DonationSettingsEntity | null> {
    const query = {
      locale,
      populate: {
        bankTransfer: {
          populate: {
            image: true,
            bankAccounts: true,
          }
        },
        formLabels: true,
        targetedGiving: true,
        wallOfGratitude: {
          populate: {
            patrons: true
          }
        },
        amounts: true,
        currencies: true,
        designations: true
      }
    };
    const data = await this.fetchStrapi<DonationSettingsEntity>('/donation-setting', query);
    return data;
  },
  
  async getCareerPositions(locale = 'en'): Promise<CareerPositionEntity[]> {
    const query = {
      locale,
      filters: { isActive: { $eq: true } },
      sort: ['order:asc', 'createdAt:desc'],
      populate: ['requirements', 'responsibilities']
    };
    const data = await this.fetchStrapi<CareerPositionEntity[]>('/career-positions', query);
    return data || [];
  },

  async getCareerSetting(locale = 'en'): Promise<CareerSettingEntity | null> {
    const data = await this.fetchStrapi<CareerSettingEntity>('/career-setting', { 
      locale,
      populate: ['formBackgroundImage']
    });
    return data || null;
  },

  async getPrograms(locale = 'en', featuredOnly = false, limit = 20): Promise<ProgramEntity[]> {
    const query: any = {
      locale,
      populate: ['images', 'department'],
      pagination: { limit }
    };
    if (featuredOnly) {
      query.filters = { isFeatured: { $eq: true } };
    }
    const data = await this.fetchStrapi<ProgramEntity[]>('/programs', query);
    return data || [];
  },
  
  async getProgramBySlug(slug: string, locale = 'en'): Promise<ProgramEntity | null> {
    const query = {
      locale,
      filters: { slug: { $eq: slug } },
      populate: '*'
    };
    const data = await this.fetchStrapi<ProgramEntity[]>('/programs', query);
    return data && data.length > 0 ? data[0] : null;
  },
  
  async getDepartments(locale = 'en', limit = 20): Promise<DepartmentEntity[]> {
    const query = {
      locale,
      populate: ['gallery', 'programs'],
      pagination: { limit }
    };
    const data = await this.fetchStrapi<DepartmentEntity[]>('/departments', query);
    return data || [];
  },
  
  async getDepartmentBySlug(slug: string, locale = 'en'): Promise<DepartmentEntity | null> {
    const query = {
      locale,
      filters: { slug: { $eq: slug } },
      populate: '*'
    };
    const data = await this.fetchStrapi<DepartmentEntity[]>('/departments', query);
    return data && data.length > 0 ? data[0] : null;
  },
  
  async getArticles(locale = 'en', page = 1, pageSize = 6, categorySlug?: string): Promise<{ data: ArticleEntity[]; total: number }> {
    const query: any = {
      locale,
      populate: ['featuredImage', 'category', 'gallery'],
      pagination: { page, pageSize }
    };
    if (categorySlug) {
      query.filters = { category: { slug: { $eq: categorySlug } } };
    }
    try {
      const queryString = qs.stringify(query, { encodeValuesOnly: true });
      const { data } = await apiClient.get(`/articles?${queryString}`);
      return {
        data: data.data || [],
        total: data.meta?.pagination?.total || 0
      };
    } catch (e) {
      return { data: [], total: 0 };
    }
  },
  
  async getArticleBySlug(slug: string, locale = 'en'): Promise<ArticleEntity | null> {
    const query = {
      locale,
      filters: { slug: { $eq: slug } },
      populate: '*'
    };
    const data = await this.fetchStrapi<ArticleEntity[]>('/articles', query);
    return data && data.length > 0 ? data[0] : null;
  },
  

  async getEvents(locale = 'en', limit = 10): Promise<EventEntity[]> {
    const query = {
      locale,
      populate: ['banner', 'gallery', 'department'],
      pagination: { limit },
      sort: ['startDate:asc']
    };
    const data = await this.fetchStrapi<EventEntity[]>('/events', query);
    return data || [];
  },
  
  async getAnnouncements(locale = 'en'): Promise<AnnouncementEntity[]> {
    const query = {
      locale,
      pagination: { limit: 5 },
      sort: ['createdAt:desc']
    };
    const data = await this.fetchStrapi<AnnouncementEntity[]>('/announcements', query);
    return data || [];
  },
  
  async getTestimonials(locale = 'en', limit = 6): Promise<TestimonialEntity[]> {
    const query = {
      locale,
      populate: ['avatar'],
      pagination: { limit }
    };
    const data = await this.fetchStrapi<TestimonialEntity[]>('/testimonials', query);
    return data || [];
  },
  
  async getGalleryItems(locale = 'en', limit = 12): Promise<GalleryItemEntity[]> {
    const query = {
      locale,
      populate: ['mediaFile'],
      pagination: { limit }
    };
    const data = await this.fetchStrapi<GalleryItemEntity[]>('/gallery-items', query);
    return data || [];
  },
  
  async getDownloadItems(locale = 'en'): Promise<DownloadItemEntity[]> {
    const query = {
      locale,
      populate: ['file']
    };
    const data = await this.fetchStrapi<DownloadItemEntity[]>('/download-items', query);
    return data || [];
  },
  
  async getFaqs(locale = 'en', category?: string): Promise<FaqEntity[]> {
    const query: any = { locale };
    if (category) {
      query.filters = { category: { slug: { $eq: category } } };
    }
    const data = await this.fetchStrapi<FaqEntity[]>('/faqs', query);
    return data || [];
  },
  
  async getContactInfo(locale = 'en'): Promise<ContactInfo> {
    const data = await this.fetchStrapi<ContactInfo>('/contact-info', { locale, populate: '*' });
    // Fallback if not configured in Strapi yet
    return data as ContactInfo || {
      id: 0,
      campusInfo: {
        address: '123 School St',
        phone: '+1234567890',
        email: 'info@yahayaschool.com'
      }
    };
  },
  
  async getFooterConfig(locale = 'en'): Promise<FooterConfig> {
    const data = await this.fetchStrapi<FooterConfig>('/footer-config', { locale, populate: '*' });
    return data as FooterConfig || {
      id: 0,
      copyrightText: '© 2026 YAHAYASCOOL'
    };
  },
  
  async getNavigationMenu(location: 'header' | 'footer' | 'topbar', locale = 'en'): Promise<NavigationMenu | null> {
    const query = {
      locale,
      filters: { location: { $eq: location } },
      populate: {
        items: {
          populate: ['subItems.media']
        }
      },
      sort: ['updatedAt:desc']
    };

    try {
      const data = await this.fetchStrapi<NavigationMenu[]>('/navigation-menus', query);
      if (data && Array.isArray(data) && data.length > 0) {
        const menuWithItems = data.find(m => m.items && m.items.length > 0);
        if (menuWithItems) return menuWithItems;
        return data[0];
      }
    } catch (e) {
      console.error('Error fetching navigation menu:', e);
    }

    // If requested non-English locale returned no menu from Strapi, fallback to English Strapi menu
    if (locale !== 'en') {
      try {
        const fallbackQuery = {
          locale: 'en',
          filters: { location: { $eq: location } },
          populate: {
            items: {
              populate: ['subItems.media']
            }
          },
          sort: ['updatedAt:desc']
        };
        const fbData = await this.fetchStrapi<NavigationMenu[]>('/navigation-menus', fallbackQuery);
        if (fbData && Array.isArray(fbData) && fbData.length > 0) {
          const menuWithItems = fbData.find(m => m.items && m.items.length > 0);
          if (menuWithItems) return menuWithItems;
          return fbData[0];
        }
      } catch (e) {
        // ignore
      }
    }
    
    // Fallback for header if Strapi returns nothing
    if (location === 'header') {
      return {
        id: 1,
        name: 'Header',
        slug: 'header',
        location: 'header',
        ctaButtonTitle: 'Donations',
        ctaButtonUrl: '/donations',
        items: [
          { id: 1, title: 'Home', url: '/' },
          { id: 2, title: 'Academic Programs', url: '/programs' },
          { id: 3, title: 'News and Events', url: '/news' },
          { id: 4, title: 'About', url: '/about' },
          { id: 5, title: 'Contact Us', url: '/contact' }
        ]
      };
    }

    if (location === 'topbar') {
      return {
        id: 2,
        name: 'Topbar',
        slug: 'topbar',
        location: 'topbar',
        ctaButtonTitle: 'Login Portal',
        ctaButtonUrl: '/login',
        items: [
          { id: 10, title: 'Online Learning', url: '/online-learning' }
        ]
      };
    }
    return null;
  },
  
  async getPartners(locale = 'en'): Promise<PartnerEntity[]> {
    const query = {
      locale,
      populate: ['logo']
    };
    const data = await this.fetchStrapi<PartnerEntity[]>('/partners', query);
    return data || [];
  },
  
  async getDonationCampaigns(locale = 'en'): Promise<DonationCampaignEntity[]> {
    const query = {
      locale,
      populate: ['banner']
    };
    const data = await this.fetchStrapi<DonationCampaignEntity[]>('/donation-campaigns', query);
    return data || [];
  },
  
  async submitContactForm(payload: ContactSubmissionPayload): Promise<{ success: boolean; message?: string }> {
    try {
      await apiClient.post('/contact-submissions', { data: payload });
      return { success: true };
    } catch (e) {
      return { success: false, message: 'Failed to submit form' };
    }
  },
  
  async submitAdmissionApplication(payload: AdmissionApplicationPayload): Promise<{ success: boolean; applicationNumber?: string; message?: string }> {
    try {
      const res = await apiClient.post('/admission-applications', { data: payload });
      return { success: true, applicationNumber: res.data?.data?.applicationNumber || 'APP-00000' };
    } catch (e) {
      return { success: false, message: 'Failed to submit application' };
    }
  },

  async subscribeNewsletter(email: string, locale = 'en'): Promise<{ success: boolean; message?: string }> {
    try {
      await apiClient.post('/newsletter-subscribers', {
        data: {
          email,
          locale,
          status: 'active'
        }
      });
      return { success: true };
    } catch (e: any) {
      return {
        success: false,
        message: e?.response?.data?.error?.message || 'Failed to subscribe'
      };
    }
  },

  async getStaffMembers(locale = 'en'): Promise<StaffMemberEntity[]> {
    const data = await this.fetchStrapi<StaffMemberEntity[]>('/staff-members', {
      locale,
      sort: ['order:asc'],
      populate: ['image'],
    });
    return data || [];
  },

  /**
   * Create a new event
   */
  async createEvent(payload: Partial<EventEntity>): Promise<EventEntity> {
    const res = await apiClient.post('/events', { data: payload });
    return res.data?.data || res.data;
  },

  /**
   * Create a new announcement
   */
  async createAnnouncement(payload: Partial<AnnouncementEntity>): Promise<AnnouncementEntity> {
    const res = await apiClient.post('/announcements', { data: payload });
    return res.data?.data || res.data;
  },

  async getPursuitCta(locale = 'en'): Promise<PursuitCtaEntity | null> {
    const data = await this.fetchStrapi<PursuitCtaEntity>('/pursuit-cta', { locale });
    return data || null;
  }
};

export function getStrapiMediaUrl(media: any): string | null {
  if (!media) return null;
  const rawUrl = typeof media === 'string' 
    ? media 
    : (media.url || media.photoUrl || media.avatarUrl || media.data?.attributes?.url || media.data?.url);
  if (!rawUrl || typeof rawUrl !== 'string') return null;
  
  // Paths under /images belong to the frontend's own public folder (fallback content)
  if (rawUrl.startsWith('/') && !rawUrl.startsWith('/images/')) {
    const strapiUrl = process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1339';
    return `${strapiUrl}${rawUrl}`;
  }
  
  return rawUrl;
}
