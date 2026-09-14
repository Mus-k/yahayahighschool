import { StrapiSingleResponse, StrapiCollectionResponse } from './api.types';
import { Student, AcademicYear, AcademicTerm, Section } from './erp.types';
import { Subject } from './lms.types';

export interface ReportTemplate {
  id: number;
  documentId: string;
  name: string;
  layoutType: 'Primary' | 'Secondary' | 'Quran' | 'Arabic' | 'English' | 'Boarding' | 'Custom';
  brandingConfig?: any;
  signatureConfig?: any;
  version: number;
}

export interface StudentResult {
  id: number;
  documentId: string;
  caTotal?: number;
  examTotal?: number;
  overallScore?: number;
  letterGrade?: string;
  gradePoint?: number;
  teacherComments?: string;
  directorComments?: string;
  isPass?: boolean;
  student?: { data: StrapiSingleResponse<Student> };
  academic_year?: { data: StrapiSingleResponse<AcademicYear> };
  academic_term?: { data: StrapiSingleResponse<AcademicTerm> };
  subject?: { data: StrapiSingleResponse<Subject> };
}

export interface ReportCard {
  id: number;
  documentId: string;
  workflowStatus: 'Draft' | 'DepartmentReview' | 'DirectorApproval' | 'Published' | 'Rejected';
  dataSnapshot?: any;
  issueDate?: string;
  verificationQR?: string;
  student?: { data: StrapiSingleResponse<Student> };
  academic_year?: { data: StrapiSingleResponse<AcademicYear> };
  academic_term?: { data: StrapiSingleResponse<AcademicTerm> };
  report_template?: { data: StrapiSingleResponse<ReportTemplate> };
}

export interface StudentRanking {
  id: number;
  documentId: string;
  rankContext: 'School' | 'Department' | 'Section' | 'Subject' | 'Program';
  rankPosition?: number;
  averageScore?: number;
  isTied?: boolean;
  student?: { data: StrapiSingleResponse<Student> };
  academic_year?: { data: StrapiSingleResponse<AcademicYear> };
  academic_term?: { data: StrapiSingleResponse<AcademicTerm> };
  subject?: { data: StrapiSingleResponse<Subject> };
}

export interface PromotionRecord {
  id: number;
  documentId: string;
  decision: 'Promoted' | 'Conditionally Promoted' | 'Repeat Class' | 'Graduated' | 'Transferred' | 'Withdrawn';
  remarks?: string;
  student?: { data: StrapiSingleResponse<Student> };
  fromYear?: { data: StrapiSingleResponse<AcademicYear> };
  fromSection?: { data: StrapiSingleResponse<Section> };
  toYear?: { data: StrapiSingleResponse<AcademicYear> };
  toSection?: { data: StrapiSingleResponse<Section> };
}

export interface AcademicTranscript {
  id: number;
  documentId: string;
  transcriptNumber: string;
  verificationID: string;
  dataSnapshot?: any;
  issueDate?: string;
  status: 'Draft' | 'Published' | 'Revoked';
  student?: { data: StrapiSingleResponse<Student> };
}

export interface GraduationRecord {
  id: number;
  documentId: string;
  graduationDate?: string;
  className?: string;
  awards?: any;
  student?: { data: StrapiSingleResponse<Student> };
  finalTranscript?: { data: StrapiSingleResponse<AcademicTranscript> };
}

export interface AcademicCertificateTemplate {
  id: number;
  documentId: string;
  name: string;
  category: 'Excellence' | 'Graduation' | 'Completion' | 'Attendance' | 'Behavior' | 'Custom';
  designConfig?: any;
}

export interface AcademicCertificate {
  id: number;
  documentId: string;
  serialNumber: string;
  verificationID: string;
  achievementName?: string;
  issueDate?: string;
  status: 'Valid' | 'Revoked';
  student?: { data: StrapiSingleResponse<Student> };
  template?: { data: StrapiSingleResponse<AcademicCertificateTemplate> };
}

export interface HonorRoll {
  id: number;
  documentId: string;
  name: string;
  category: "Dean's List" | "Principal's List" | "Perfect Attendance" | "Most Improved" | "Custom";
  academic_year?: { data: StrapiSingleResponse<AcademicYear> };
  academic_term?: { data: StrapiSingleResponse<AcademicTerm> };
  students?: { data: StrapiCollectionResponse<Student> };
}
