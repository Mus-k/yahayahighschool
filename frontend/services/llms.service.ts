import { apiClient } from './api.service';
import type { StrapiCollectionResponse, StrapiSingleResponse } from '../types/api.types';
import type { 
  LanguageProgram, LanguageLevel, PlacementTest, SkillAssessment, 
  LanguagePortfolio, ObservationJournal, LanguageCompetition, 
  LanguageAchievement, LanguageCertificate 
} from '../types/llms.types';

export const llmsService = {
  // Programs & Levels
  getPrograms: async (language?: 'Arabic' | 'English') => {
    const url = language 
      ? `/language-programs?filters[language][$eq]=${language}&populate=*`
      : '/language-programs?populate=*';
    const response = await apiClient.get<StrapiCollectionResponse<LanguageProgram>>(url);
    return response.data.data;
  },
  
  getLevels: async () => {
    const response = await apiClient.get<StrapiCollectionResponse<LanguageLevel>>('/language-levels?populate=*');
    return response.data.data;
  },

  // Placement Tests
  getPlacementTests: async (studentId?: number) => {
    const url = studentId 
      ? `/placement-tests?filters[student][id][$eq]=${studentId}&populate=*&sort=dateTaken:desc`
      : '/placement-tests?populate=*&sort=dateTaken:desc';
    const response = await apiClient.get<StrapiCollectionResponse<PlacementTest>>(url);
    return response.data.data;
  },

  // Skill Assessments
  getSkillAssessments: async (studentId?: number, skillType?: string) => {
    let url = '/skill-assessments?populate=*&sort=date:desc';
    if (studentId && skillType) {
      url = `/skill-assessments?filters[student][id][$eq]=${studentId}&filters[skillType][$eq]=${skillType}&populate=*&sort=date:desc`;
    } else if (studentId) {
      url = `/skill-assessments?filters[student][id][$eq]=${studentId}&populate=*&sort=date:desc`;
    } else if (skillType) {
      url = `/skill-assessments?filters[skillType][$eq]=${skillType}&populate=*&sort=date:desc`;
    }
    const response = await apiClient.get<StrapiCollectionResponse<SkillAssessment>>(url);
    return response.data.data;
  },

  // Portfolios
  getPortfolios: async (studentId?: number) => {
    const url = studentId 
      ? `/language-portfolios?filters[student][id][$eq]=${studentId}&populate=*&sort=dateAdded:desc`
      : '/language-portfolios?populate=*&sort=dateAdded:desc';
    const response = await apiClient.get<StrapiCollectionResponse<LanguagePortfolio>>(url);
    return response.data.data;
  },

  // Observation Journals
  getObservationJournals: async (studentId?: number) => {
    const url = studentId 
      ? `/observation-journals?filters[student][id][$eq]=${studentId}&populate=*&sort=date:desc`
      : '/observation-journals?populate=*&sort=date:desc';
    const response = await apiClient.get<StrapiCollectionResponse<ObservationJournal>>(url);
    return response.data.data;
  },

  // Competitions
  getCompetitions: async () => {
    const response = await apiClient.get<StrapiCollectionResponse<LanguageCompetition>>('/language-competitions?populate=*&sort=date:desc');
    return response.data.data;
  },

  // Achievements
  getAchievements: async (studentId?: number) => {
    const url = studentId 
      ? `/language-achievements?filters[student][id][$eq]=${studentId}&populate=*&sort=dateEarned:desc`
      : '/language-achievements?populate=*&sort=dateEarned:desc';
    const response = await apiClient.get<StrapiCollectionResponse<LanguageAchievement>>(url);
    return response.data.data;
  },

  // Certificates
  getCertificates: async (studentId?: number) => {
    const url = studentId 
      ? `/language-certificates?filters[student][id][$eq]=${studentId}&populate=*&sort=issueDate:desc`
      : '/language-certificates?populate=*&sort=issueDate:desc';
    const response = await apiClient.get<StrapiCollectionResponse<LanguageCertificate>>(url);
    return response.data.data;
  }
};
