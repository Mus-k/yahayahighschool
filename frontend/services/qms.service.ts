import { apiClient } from './api.service';
import type { StrapiCollectionResponse, StrapiSingleResponse } from '../types/api.types';
import type { 
  QuranProgram, QuranGroup, Memorization, Murajaah, TajweedEvaluation, 
  Halaqah, QuranAttendance, QuranAssessment, DawahActivity, QuranCompetition, 
  QuranAchievement, QuranCertificate 
} from '../types/qms.types';

export const qmsService = {
  // Programs
  getPrograms: async () => {
    const response = await apiClient.get<StrapiCollectionResponse<QuranProgram>>('/quran-programs?populate=*');
    return response.data.data;
  },

  // Groups
  getGroups: async () => {
    const response = await apiClient.get<StrapiCollectionResponse<QuranGroup>>('/quran-groups?populate=*');
    return response.data.data;
  },

  // Memorization
  getMemorizationRecords: async (studentId?: number) => {
    const url = studentId 
      ? `/memorizations?filters[student][id][$eq]=${studentId}&populate=*&sort=date:desc`
      : '/memorizations?populate=*&sort=date:desc';
    const response = await apiClient.get<StrapiCollectionResponse<Memorization>>(url);
    return response.data.data;
  },

  // Revision (Murajaah)
  getMurajaahRecords: async (studentId?: number) => {
    const url = studentId 
      ? `/murajaahs?filters[student][id][$eq]=${studentId}&populate=*&sort=dueDate:desc`
      : '/murajaahs?populate=*&sort=dueDate:desc';
    const response = await apiClient.get<StrapiCollectionResponse<Murajaah>>(url);
    return response.data.data;
  },

  // Tajweed
  getTajweedEvaluations: async (studentId?: number) => {
    const url = studentId 
      ? `/tajweed-evaluations?filters[student][id][$eq]=${studentId}&populate=*&sort=evaluationDate:desc`
      : '/tajweed-evaluations?populate=*&sort=evaluationDate:desc';
    const response = await apiClient.get<StrapiCollectionResponse<TajweedEvaluation>>(url);
    return response.data.data;
  },

  // Daily Halaqah
  getHalaqahs: async () => {
    const response = await apiClient.get<StrapiCollectionResponse<Halaqah>>('/halaqahs?populate=*&sort=date:desc');
    return response.data.data;
  },

  // Attendance
  getAttendance: async () => {
    const response = await apiClient.get<StrapiCollectionResponse<QuranAttendance>>('/quran-attendances?populate=*&sort=date:desc');
    return response.data.data;
  },

  // Assessments
  getAssessments: async () => {
    const response = await apiClient.get<StrapiCollectionResponse<QuranAssessment>>('/quran-assessments?populate=*&sort=date:desc');
    return response.data.data;
  },

  // Da'wah
  getDawahActivities: async () => {
    const response = await apiClient.get<StrapiCollectionResponse<DawahActivity>>('/dawah-activities?populate=*&sort=date:desc');
    return response.data.data;
  },

  // Competitions
  getCompetitions: async () => {
    const response = await apiClient.get<StrapiCollectionResponse<QuranCompetition>>('/quran-competitions?populate=*&sort=date:desc');
    return response.data.data;
  },

  // Achievements
  getAchievements: async () => {
    const response = await apiClient.get<StrapiCollectionResponse<QuranAchievement>>('/quran-achievements?populate=*&sort=dateEarned:desc');
    return response.data.data;
  },

  // Certificates
  getCertificates: async () => {
    const response = await apiClient.get<StrapiCollectionResponse<QuranCertificate>>('/quran-certificates?populate=*&sort=issueDate:desc');
    return response.data.data;
  }
};
