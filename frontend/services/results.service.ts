import { apiClient } from './api.service';
import type { StrapiCollectionResponse, StrapiSingleResponse } from '../types/api.types';
import type { 
  ReportCard, StudentResult, StudentRanking, PromotionRecord, 
  AcademicTranscript, GraduationRecord, AcademicCertificate, HonorRoll 
} from '../types/results.types';

export const resultsService = {
  // Report Cards
  getReportCards: async (termId?: number, studentId?: number) => {
    let url = '/report-cards?populate=*&sort=createdAt:desc';
    if (termId && studentId) {
      url = `/report-cards?filters[academic_term][id][$eq]=${termId}&filters[student][id][$eq]=${studentId}&populate=*`;
    } else if (termId) {
      url = `/report-cards?filters[academic_term][id][$eq]=${termId}&populate=*`;
    } else if (studentId) {
      url = `/report-cards?filters[student][id][$eq]=${studentId}&populate=*`;
    }
    const response = await apiClient.get<StrapiCollectionResponse<ReportCard>>(url);
    return response.data.data;
  },

  getStudentResults: async (termId?: number, studentId?: number) => {
    let url = '/student-results?populate=*';
    if (termId && studentId) {
      url = `/student-results?filters[academic_term][id][$eq]=${termId}&filters[student][id][$eq]=${studentId}&populate=*`;
    } else if (studentId) {
      url = `/student-results?filters[student][id][$eq]=${studentId}&populate=*`;
    }
    const response = await apiClient.get<StrapiCollectionResponse<StudentResult>>(url);
    return response.data.data;
  },

  // Rankings & Merit
  getRankings: async (termId?: number, context?: string) => {
    let url = '/student-rankings?populate=*&sort=rankPosition:asc';
    if (termId && context) {
      url = `/student-rankings?filters[academic_term][id][$eq]=${termId}&filters[rankContext][$eq]=${context}&populate=*&sort=rankPosition:asc`;
    } else if (termId) {
      url = `/student-rankings?filters[academic_term][id][$eq]=${termId}&populate=*&sort=rankPosition:asc`;
    }
    const response = await apiClient.get<StrapiCollectionResponse<StudentRanking>>(url);
    return response.data.data;
  },

  getHonorRolls: async (termId?: number) => {
    const url = termId 
      ? `/honor-rolls?filters[academic_term][id][$eq]=${termId}&populate=*` 
      : '/honor-rolls?populate=*';
    const response = await apiClient.get<StrapiCollectionResponse<HonorRoll>>(url);
    return response.data.data;
  },

  // Promotion & Graduation
  getPromotionRecords: async (yearId?: number) => {
    const url = yearId 
      ? `/promotion-records?filters[fromYear][id][$eq]=${yearId}&populate=*` 
      : '/promotion-records?populate=*';
    const response = await apiClient.get<StrapiCollectionResponse<PromotionRecord>>(url);
    return response.data.data;
  },

  getGraduationRecords: async () => {
    const response = await apiClient.get<StrapiCollectionResponse<GraduationRecord>>('/graduation-records?populate=*&sort=graduationDate:desc');
    return response.data.data;
  },

  // Transcripts & Certificates
  getTranscripts: async (studentId?: number) => {
    const url = studentId 
      ? `/academic-transcripts?filters[student][id][$eq]=${studentId}&populate=*` 
      : '/academic-transcripts?populate=*';
    const response = await apiClient.get<StrapiCollectionResponse<AcademicTranscript>>(url);
    return response.data.data;
  },

  getCertificates: async (studentId?: number) => {
    const url = studentId 
      ? `/academic-certificates?filters[student][id][$eq]=${studentId}&populate=*` 
      : '/academic-certificates?populate=*';
    const response = await apiClient.get<StrapiCollectionResponse<AcademicCertificate>>(url);
    return response.data.data;
  },

  // Student Grades & Moderation
  getStudentGrades: async (filters?: { termId?: number; courseId?: number; sectionId?: number }) => {
    let url = '/student-grades?populate=*&sort=createdAt:desc';
    if (filters) {
      const queryParams = [];
      if (filters.termId) queryParams.push(`filters[academic_term][id][$eq]=${filters.termId}`);
      if (filters.courseId) queryParams.push(`filters[subject][id][$eq]=${filters.courseId}`);
      if (filters.sectionId) queryParams.push(`filters[student][sections][id][$eq]=${filters.sectionId}`);
      if (queryParams.length) url = `/student-grades?${queryParams.join('&')}&populate=*`;
    }
    const response = await apiClient.get<StrapiCollectionResponse<any>>(url);
    return response.data.data;
  },

  saveStudentGrade: async (id: number | string, data: any) => {
    if (typeof id === 'number' && id < 10000) {
      const response = await apiClient.put(`/student-grades/${id}`, { data });
      return response.data.data;
    } else {
      const response = await apiClient.post('/student-grades', { data });
      return response.data.data;
    }
  },

  createAuditLog: async (data: any) => {
    try {
      const response = await apiClient.post('/academic-audit-logs', { data });
      return response.data.data;
    } catch (e) {
      console.error('Failed to log audit:', e);
    }
  },

  // Appeals
  getAppeals: async () => {
    const response = await apiClient.get<StrapiCollectionResponse<any>>('/academic-appeals?populate=*&sort=createdAt:desc');
    return response.data.data;
  },

  updateAppeal: async (id: number, status: string, responseText: string) => {
    const response = await apiClient.put(`/academic-appeals/${id}`, {
      data: { status, response: responseText }
    });
    return response.data.data;
  },

  // Graduation Clearance
  getGraduationClearances: async () => {
    const response = await apiClient.get<StrapiCollectionResponse<any>>('/graduation-clearances?populate=*');
    return response.data.data;
  },

  updateClearanceStatus: async (id: number, departmentField: string, status: string, notes?: string) => {
    const data: any = { [departmentField]: status };
    if (notes) data.notes = notes;
    const response = await apiClient.put(`/graduation-clearances/${id}`, { data });
    return response.data.data;
  },

  // Exam Timetables
  getExamTimetables: async () => {
    const response = await apiClient.get<StrapiCollectionResponse<any>>('/exam-timetables?populate=*&sort=examDate:asc');
    return response.data.data;
  },

  // Academic Configuration
  getGradingSchemes: async () => {
    const response = await apiClient.get<StrapiCollectionResponse<any>>('/grading-schemes?populate=*');
    return response.data.data;
  },

  getGradingPolicies: async () => {
    const response = await apiClient.get<StrapiCollectionResponse<any>>('/grading-policies?populate=*');
    return response.data.data;
  },

  getAcademicRegulations: async () => {
    const response = await apiClient.get<StrapiCollectionResponse<any>>('/academic-regulations?populate=*');
    return response.data.data;
  },

  getAcademicCalendars: async () => {
    const response = await apiClient.get<StrapiCollectionResponse<any>>('/academic-calendars?populate=*&sort=registrationStart:asc');
    return response.data.data;
  },

  getAuditLogs: async () => {
    const response = await apiClient.get<StrapiCollectionResponse<any>>('/academic-audit-logs?populate=*&sort=createdAt:desc');
    return response.data.data;
  }
};
