import { StrapiSingleResponse, StrapiCollectionResponse } from './api.types';
import { Student, Teacher, AcademicTerm, Section, AcademicYear } from './erp.types';
import { Subject } from './lms.types';

export interface AssessmentCategory {
  id: number;
  documentId: string;
  name: string;
  description?: string;
}

export interface AssessmentType {
  id: number;
  documentId: string;
  name: string;
  code: string;
  weight?: number;
  passingScore?: number;
  isActive: boolean;
  assessment_category?: { data: StrapiSingleResponse<AssessmentCategory> };
}

export interface GradingScheme {
  id: number;
  documentId: string;
  name: string;
  calculationMethod?: 'Percentage' | 'Grade Points' | 'Weighted Average' | 'Rubric Based';
  promotionRules?: string;
  isActive: boolean;
  version: number;
  grade_bands?: { data: StrapiCollectionResponse<GradeBand> };
}

export interface GradeBand {
  id: number;
  documentId: string;
  minScore: number;
  maxScore: number;
  letterGrade?: string;
  gradePoint?: number;
  performanceLevel?: string;
  color?: string;
  isPass: boolean;
  grading_scheme?: { data: StrapiSingleResponse<GradingScheme> };
}

export interface Rubric {
  id: number;
  documentId: string;
  criteria: string;
  description?: string;
  maxPoints?: number;
  levels?: any;
}

export interface ExamSession {
  id: number;
  documentId: string;
  name: string;
  startDate: string;
  endDate: string;
  status: 'Upcoming' | 'Active' | 'Completed';
  academic_year?: { data: StrapiSingleResponse<AcademicYear> };
  academic_term?: { data: StrapiSingleResponse<AcademicTerm> };
}

export interface Examination {
  id: number;
  documentId: string;
  title: string;
  durationMinutes?: number;
  totalMarks: number;
  passingScore?: number;
  examDate?: string;
  instructions?: string;
  status: 'Draft' | 'Published' | 'Completed';
  subject?: { data: StrapiSingleResponse<Subject> };
  teacher?: { data: StrapiSingleResponse<Teacher> };
  section?: { data: StrapiSingleResponse<Section> };
  assessment_type?: { data: StrapiSingleResponse<AssessmentType> };
  exam_session?: { data: StrapiSingleResponse<ExamSession> };
}

export interface QuestionPool {
  id: number;
  documentId: string;
  name: string;
  description?: string;
}

export interface Question {
  id: number;
  documentId: string;
  text: string;
  type?: 'MCQ' | 'True/False' | 'Short Answer' | 'Essay' | 'Practical' | 'Oral' | 'Other';
  difficulty?: 'Easy' | 'Medium' | 'Hard';
  marks?: number;
  correctAnswer?: string;
  explanation?: string;
  tags?: any;
  optionA?: string;
  optionB?: string;
  optionC?: string;
  optionD?: string;
  subject?: { data: StrapiSingleResponse<Subject> };
  question_pool?: { data: StrapiSingleResponse<QuestionPool> };
}

export interface ExamRoom {
  id: number;
  documentId: string;
  name: string;
  capacity?: number;
  building?: string;
  floor?: string;
}

export interface ExamSchedule {
  id: number;
  documentId: string;
  startTime: string;
  endTime: string;
  status: 'Scheduled' | 'InProgress' | 'Completed' | 'Cancelled';
  examination?: { data: StrapiSingleResponse<Examination> };
  exam_room?: { data: StrapiSingleResponse<ExamRoom> };
  invigilators?: { data: StrapiCollectionResponse<Teacher> };
}

export interface MarksEntry {
  id: number;
  documentId: string;
  rawScore?: number;
  percentage?: number;
  gradePoint?: number;
  teacherNotes?: string;
  status: 'Draft' | 'Submitted' | 'Approved';
  student?: { data: StrapiSingleResponse<Student> };
  examination?: { data: StrapiSingleResponse<Examination> };
  teacher?: { data: StrapiSingleResponse<Teacher> };
  grading_scheme?: { data: StrapiSingleResponse<GradingScheme> };
}

export interface GradeModeration {
  id: number;
  documentId: string;
  workflowStatus: 'Submitted' | 'DepartmentReview' | 'Approved' | 'Rejected';
  comments?: string;
  examination?: { data: StrapiSingleResponse<Examination> };
  submittedBy?: { data: StrapiSingleResponse<Teacher> };
  approvedBy?: { data: StrapiSingleResponse<Teacher> };
}
