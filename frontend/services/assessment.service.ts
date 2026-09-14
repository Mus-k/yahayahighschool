import { apiClient } from './api.service';
import type { StrapiCollectionResponse, StrapiSingleResponse } from '../types/api.types';
import type { 
  AssessmentType, AssessmentCategory, GradingScheme, GradeBand, Rubric, 
  ExamSession, Examination, Question, QuestionPool, ExamSchedule, ExamRoom, 
  MarksEntry, GradeModeration 
} from '../types/assessment.types';

export const assessmentService = {
  // ─── Grading & Assessment Setup ──────────────────────────────────────────────
  getGradingSchemes: async () => {
    const response = await apiClient.get<StrapiCollectionResponse<GradingScheme>>('/grading-schemes?populate=*');
    return response.data.data;
  },
  
  getAssessmentTypes: async () => {
    const response = await apiClient.get<StrapiCollectionResponse<AssessmentType>>('/assessment-types?populate=*');
    return response.data.data;
  },

  // ─── Examinations ─────────────────────────────────────────────────────────────
  getExamSessions: async (termId?: number) => {
    const url = termId 
      ? `/exam-sessions?filters[academic_term][id][$eq]=${termId}&populate=*&sort=startDate:desc`
      : '/exam-sessions?populate=*&sort=startDate:desc';
    const response = await apiClient.get<StrapiCollectionResponse<ExamSession>>(url);
    return response.data.data;
  },

  getExaminations: async (sessionId?: number, teacherId?: number) => {
    let url = '/examinations?populate=*&sort=examDate:desc';
    if (sessionId && teacherId) {
      url = `/examinations?filters[exam_session][id][$eq]=${sessionId}&filters[teacher][id][$eq]=${teacherId}&populate=*&sort=examDate:desc`;
    } else if (sessionId) {
      url = `/examinations?filters[exam_session][id][$eq]=${sessionId}&populate=*&sort=examDate:desc`;
    } else if (teacherId) {
      url = `/examinations?filters[teacher][id][$eq]=${teacherId}&populate=*&sort=examDate:desc`;
    }
    const response = await apiClient.get<StrapiCollectionResponse<Examination>>(url);
    return response.data.data;
  },

  // ─── Question Pools ────────────────────────────────────────────────────────────
  getQuestionPools: async () => {
    const response = await apiClient.get<StrapiCollectionResponse<QuestionPool>>('/question-pools?populate=*&sort=name:asc');
    return response.data.data;
  },

  createQuestionPool: async (data: { name: string; description?: string }) => {
    const response = await apiClient.post<StrapiSingleResponse<QuestionPool>>('/question-pools', { data });
    return response.data.data;
  },

  updateQuestionPool: async (id: number | string, data: Partial<QuestionPool>) => {
    const response = await apiClient.put<StrapiSingleResponse<QuestionPool>>(`/question-pools/${id}`, { data });
    return response.data.data;
  },

  deleteQuestionPool: async (id: number | string) => {
    await apiClient.delete(`/question-pools/${id}`);
  },

  // ─── Questions ─────────────────────────────────────────────────────────────────
  getQuestions: async (subjectId?: number, poolId?: number) => {
    let url = '/questions?populate=*&sort=createdAt:desc&pagination[limit]=200';
    if (subjectId && poolId) {
      url = `/questions?filters[subject][id][$eq]=${subjectId}&filters[question_pool][id][$eq]=${poolId}&populate=*&pagination[limit]=200`;
    } else if (subjectId) {
      url = `/questions?filters[subject][id][$eq]=${subjectId}&populate=*&pagination[limit]=200`;
    } else if (poolId) {
      url = `/questions?filters[question_pool][id][$eq]=${poolId}&populate=*&pagination[limit]=200`;
    }
    const response = await apiClient.get<StrapiCollectionResponse<Question>>(url);
    return response.data.data;
  },

  getQuestion: async (id: number | string) => {
    const response = await apiClient.get<StrapiSingleResponse<Question>>(`/questions/${id}?populate=*`);
    return response.data.data;
  },

  createQuestion: async (data: {
    text: string;
    type?: Question['type'];
    difficulty?: Question['difficulty'];
    marks?: number;
    correctAnswer?: string;
    explanation?: string;
    tags?: any;
    optionA?: string;
    optionB?: string;
    optionC?: string;
    optionD?: string;
    subject?: number;
    question_pool?: number;
  }) => {
    const response = await apiClient.post<StrapiSingleResponse<Question>>('/questions', { data });
    return response.data.data;
  },

  updateQuestion: async (id: number | string, data: Partial<{
    text: string;
    type: Question['type'];
    difficulty: Question['difficulty'];
    marks: number;
    correctAnswer: string;
    explanation: string;
    tags: any;
    optionA: string;
    optionB: string;
    optionC: string;
    optionD: string;
  }>) => {
    const response = await apiClient.put<StrapiSingleResponse<Question>>(`/questions/${id}`, { data });
    return response.data.data;
  },

  deleteQuestion: async (id: number | string) => {
    await apiClient.delete(`/questions/${id}`);
  },

  // ─── Marks Entry ───────────────────────────────────────────────────────────────
  getMarksEntries: async (examinationId?: number, studentId?: number) => {
    let url = '/marks-entries?populate=*';
    if (examinationId && studentId) {
      url = `/marks-entries?filters[examination][id][$eq]=${examinationId}&filters[student][id][$eq]=${studentId}&populate=*`;
    } else if (examinationId) {
      url = `/marks-entries?filters[examination][id][$eq]=${examinationId}&populate=*`;
    } else if (studentId) {
      url = `/marks-entries?filters[student][id][$eq]=${studentId}&populate=*`;
    }
    const response = await apiClient.get<StrapiCollectionResponse<MarksEntry>>(url);
    return response.data.data;
  },

  // ─── Grade Moderation ─────────────────────────────────────────────────────────
  getGradeModerations: async (examinationId?: number) => {
    const url = examinationId 
      ? `/grade-moderations?filters[examination][id][$eq]=${examinationId}&populate=*`
      : '/grade-moderations?populate=*';
    const response = await apiClient.get<StrapiCollectionResponse<GradeModeration>>(url);
    return response.data.data;
  },

  // ─── Exam Rooms ────────────────────────────────────────────────────────────────
  getExamRooms: async () => {
    const response = await apiClient.get<StrapiCollectionResponse<ExamRoom>>('/exam-rooms?sort=name:asc');
    return response.data.data;
  },

  createExamRoom: async (data: { name: string; capacity?: number; building?: string; floor?: string }) => {
    const response = await apiClient.post<StrapiSingleResponse<ExamRoom>>('/exam-rooms', { data });
    return response.data.data;
  },

  updateExamRoom: async (id: number | string, data: Partial<ExamRoom>) => {
    const response = await apiClient.put<StrapiSingleResponse<ExamRoom>>(`/exam-rooms/${id}`, { data });
    return response.data.data;
  },

  deleteExamRoom: async (id: number | string) => {
    await apiClient.delete(`/exam-rooms/${id}`);
  },

  // ─── Exam Schedules ────────────────────────────────────────────────────────────
  getExamSchedules: async (examinationId?: number) => {
    const url = examinationId
      ? `/exam-schedules?filters[examination][id][$eq]=${examinationId}&populate=*&sort=startTime:asc`
      : '/exam-schedules?populate=*&sort=startTime:asc&pagination[limit]=200';
    const response = await apiClient.get<StrapiCollectionResponse<ExamSchedule>>(url);
    return response.data.data;
  },

  createExamSchedule: async (data: {
    startTime: string;
    endTime: string;
    status?: ExamSchedule['status'];
    examination?: number;
    exam_room?: number;
    invigilators?: number[];
    notes?: string;
    enrolledCount?: number;
  }) => {
    const response = await apiClient.post<StrapiSingleResponse<ExamSchedule>>('/exam-schedules', { data });
    return response.data.data;
  },

  updateExamSchedule: async (id: number | string, data: Partial<{
    startTime: string;
    endTime: string;
    status: ExamSchedule['status'];
    exam_room: number;
    invigilators: number[];
    notes: string;
    enrolledCount: number;
  }>) => {
    const response = await apiClient.put<StrapiSingleResponse<ExamSchedule>>(`/exam-schedules/${id}`, { data });
    return response.data.data;
  },

  deleteExamSchedule: async (id: number | string) => {
    await apiClient.delete(`/exam-schedules/${id}`);
  },
};


