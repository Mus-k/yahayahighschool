import { StrapiSingleResponse, StrapiCollectionResponse } from './api.types';
import { Student, Teacher, AcademicTerm } from './erp.types';

export interface QuranProgram {
  id: number;
  documentId: string;
  name: string;
  code: string;
  description?: string;
  durationMonths?: number;
  targetJuz?: number;
  ageGroup?: string;
  isActive: boolean;
}

export interface QuranGroup {
  id: number;
  documentId: string;
  name: string;
  code?: string;
  capacity?: number;
  meetingSchedule?: string;
  location?: string;
  isActive: boolean;
  teacher?: { data: StrapiSingleResponse<Teacher> };
  quran_program?: { data: StrapiSingleResponse<QuranProgram> };
  students?: { data: StrapiCollectionResponse<Student> };
}

export interface Memorization {
  id: number;
  documentId: string;
  juzNumber: number;
  surah: string;
  startingAyah?: number;
  endingAyah?: number;
  pagesCovered?: number;
  linesCovered?: number;
  recordType?: 'New' | 'Revision' | 'Correction' | 'Assessment';
  status?: 'Completed' | 'Needs Revision' | 'Partially Memorized';
  teacherNotes?: string;
  studentReflection?: string;
  date: string;
  student?: { data: StrapiSingleResponse<Student> };
  teacher?: { data: StrapiSingleResponse<Teacher> };
  quran_group?: { data: StrapiSingleResponse<QuranGroup> };
}

export interface Murajaah {
  id: number;
  documentId: string;
  assignedPortions?: string;
  completedPortions?: string;
  revisionScore?: number;
  mistakesCount?: number;
  teacherNotes?: string;
  status?: 'Pending' | 'In Progress' | 'Completed' | 'Needs Retest';
  dueDate?: string;
  completionDate?: string;
  student?: { data: StrapiSingleResponse<Student> };
  teacher?: { data: StrapiSingleResponse<Teacher> };
}

export interface TajweedEvaluation {
  id: number;
  documentId: string;
  makharij?: number;
  sifaat?: number;
  ghunnah?: number;
  madd?: number;
  qalqalah?: number;
  waqf?: number;
  noonSaakin?: number;
  meemSaakin?: number;
  fluency?: number;
  overallScore?: number;
  teacherComments?: string;
  evaluationDate: string;
  student?: { data: StrapiSingleResponse<Student> };
  teacher?: { data: StrapiSingleResponse<Teacher> };
}

export interface Halaqah {
  id: number;
  documentId: string;
  topic: string;
  versesCovered?: string;
  corrections?: string;
  teacherNotes?: string;
  date: string;
  teacher?: { data: StrapiSingleResponse<Teacher> };
  quran_group?: { data: StrapiSingleResponse<QuranGroup> };
}

export interface QuranAttendance {
  id: number;
  documentId: string;
  date: string;
  status: 'Present' | 'Absent' | 'Late' | 'Excused';
  arrivalTime?: string;
  departureTime?: string;
  lateReason?: string;
  recitationStatus?: string;
  participationScore?: number;
  remarks?: string;
  student?: { data: StrapiSingleResponse<Student> };
  quran_group?: { data: StrapiSingleResponse<QuranGroup> };
}

export interface QuranAssessment {
  id: number;
  documentId: string;
  title: string;
  type?: 'Daily Recitation' | 'Weekly Test' | 'Monthly Test' | 'Quarterly Test' | 'Half Juz' | 'Full Juz' | 'Half Hifz' | 'Complete Hifz';
  portion?: string;
  score?: number;
  maxScore?: number;
  mistakes?: number;
  comments?: string;
  date: string;
  student?: { data: StrapiSingleResponse<Student> };
}

export interface DawahActivity {
  id: number;
  documentId: string;
  title: string;
  description?: string;
  location?: string;
  date: string;
  photos?: any;
  teacher?: any;
  students?: any;
}

export interface QuranCompetition {
  id: number;
  documentId: string;
  name: string;
  category?: string;
  date?: string;
  judges?: string;
  ranking?: number;
  awards?: string;
}

export interface QuranAchievement {
  id: number;
  documentId: string;
  title: string;
  description?: string;
  dateEarned: string;
  student?: { data: StrapiSingleResponse<Student> };
}

export interface QuranCertificate {
  id: number;
  documentId: string;
  type?: 'Juz Completion' | 'Half Quran' | 'Full Quran' | 'Excellent Memorization' | 'Perfect Attendance' | 'Outstanding Tajweed' | 'Competition Winner';
  issueDate: string;
  status?: 'Draft' | 'Issued' | 'Revoked';
  certificateUrl?: string;
  student?: { data: StrapiSingleResponse<Student> };
}
