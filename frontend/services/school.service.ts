import { apiClient, normalizeError } from './api.service';
import type { StrapiSingleResponse } from '@/types/api.types';

// ─────────────────────────────────────────────────────────────────────────────
// YAHAYASCOOL — School Profile Service
// ─────────────────────────────────────────────────────────────────────────────

export interface SchoolProfile {
  id: number;
  documentId: string;
  schoolName: string;
  motto: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  logo: {
    id: number;
    url: string;
    alternativeText: string | null;
  } | null;
  academicYearStart: string | null;
  academicYearEnd: string | null;
  timezone: string;
  defaultLanguage: 'en' | 'ar' | 'fr' | 'tr';
  socialLinks: Record<string, string> | null;
  registrationNumber: string | null;
  foundedYear: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateSchoolProfilePayload {
  schoolName?: string;
  motto?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  academicYearStart?: string;
  academicYearEnd?: string;
  timezone?: string;
  defaultLanguage?: 'en' | 'ar' | 'fr' | 'tr';
  socialLinks?: Record<string, string>;
  registrationNumber?: string;
  foundedYear?: number;
}

export const schoolService = {
  /**
   * Get the school profile (single type).
   */
  async getSchoolProfile(locale = 'en'): Promise<SchoolProfile> {
    try {
      const { data } = await apiClient.get<StrapiSingleResponse<SchoolProfile>>(
        '/school-profile',
        { params: { populate: ['logo'], locale } }
      );
      return data.data;
    } catch (error) {
      throw normalizeError(error);
    }
  },

  /**
   * Update the school profile.
   */
  async updateSchoolProfile(
    payload: UpdateSchoolProfilePayload,
    locale = 'en'
  ): Promise<SchoolProfile> {
    try {
      const { data } = await apiClient.put<StrapiSingleResponse<SchoolProfile>>(
        '/school-profile',
        { data: payload },
        { params: { locale } }
      );
      return data.data;
    } catch (error) {
      throw normalizeError(error);
    }
  },
};
