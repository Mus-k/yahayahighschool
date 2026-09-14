import { StrapiSingleResponse, StrapiCollectionResponse } from './api.types';
import { Student, Teacher, AcademicTerm, Section } from './erp.types';

export interface LanguageProgram {
  id: number;
  documentId: string;
  name: string;
  code: string;
  description?: string;
  language: 'Arabic' | 'English';
  targetLevel?: string;
  ageGroup?: string;
  durationMonths?: number;
  isActive: boolean;
  teachers?: { data: StrapiCollectionResponse<Teacher> };
  students?: { data: StrapiCollectionResponse<Student> };
  sections?: { data: StrapiCollectionResponse<Section> };
}

export interface LanguageLevel {
  id: number;
  documentId: string;
  code: string;
  name: string;
  expectedCompetencies?: string;
  learningOutcomes?: string;
  minPassingScore?: number;
  language_program?: { data: StrapiSingleResponse<LanguageProgram> };
}

export interface PlacementTest {
  id: number;
  documentId: string;
  language: 'Arabic' | 'English';
  readingScore?: number;
  writingScore?: number;
  listeningScore?: number;
  speakingScore?: number;
  grammarScore?: number;
  vocabularyScore?: number;
  overallScore?: number;
  recommendedLevel?: string;
  teacherNotes?: string;
  dateTaken: string;
  student?: { data: StrapiSingleResponse<Student> };
  teacher?: { data: StrapiSingleResponse<Teacher> };
}

export interface SkillAssessment {
  id: number;
  documentId: string;
  skillType: 'Reading' | 'Writing' | 'Listening' | 'Speaking' | 'Grammar' | 'Vocabulary' | 'Conversation' | 'Pronunciation' | 'Comprehension';
  title: string;
  score?: number;
  maxScore?: number;
  rubric?: any;
  teacherFeedback?: string;
  date: string;
  student?: { data: StrapiSingleResponse<Student> };
  teacher?: { data: StrapiSingleResponse<Teacher> };
  language_program?: { data: StrapiSingleResponse<LanguageProgram> };
}

export interface LanguagePortfolio {
  id: number;
  documentId: string;
  title: string;
  itemType?: 'Writing Sample' | 'Reading Record' | 'Audio Recording' | 'Video Presentation' | 'Project' | 'Grammar Exercise';
  content?: string;
  attachments?: any;
  teacherFeedback?: string;
  dateAdded: string;
  student?: { data: StrapiSingleResponse<Student> };
  teacher?: { data: StrapiSingleResponse<Teacher> };
}

export interface ObservationJournal {
  id: number;
  documentId: string;
  participation?: number;
  confidence?: number;
  motivation?: number;
  behavior?: number;
  strengths?: string;
  weaknesses?: string;
  recommendations?: string;
  visibility?: 'Teacher Only' | 'Parent' | 'Director';
  date: string;
  student?: { data: StrapiSingleResponse<Student> };
  teacher?: { data: StrapiSingleResponse<Teacher> };
}

export interface LanguageCompetition {
  id: number;
  documentId: string;
  title: string;
  category?: 'Debate' | 'Speech Contest' | 'Essay Competition' | 'Reading Competition' | 'Spelling Bee' | 'Poetry Recitation' | 'Translation' | 'Storytelling';
  date?: string;
  judges?: string;
  ranking?: number;
  awards?: string;
  media?: any;
  students?: { data: StrapiCollectionResponse<Student> };
}

export interface LanguageAchievement {
  id: number;
  documentId: string;
  title: string;
  description?: string;
  dateEarned: string;
  student?: { data: StrapiSingleResponse<Student> };
}

export interface LanguageCertificate {
  id: number;
  documentId: string;
  type?: 'Course Completion' | 'Level Completion' | 'Reading Excellence' | 'Writing Excellence' | 'Listening Excellence' | 'Speaking Excellence' | 'Grammar Excellence' | 'Vocabulary Excellence' | 'Competition Winner';
  issueDate: string;
  status?: 'Draft' | 'Issued' | 'Revoked';
  certificateUrl?: string;
  student?: { data: StrapiSingleResponse<Student> };
  language_program?: { data: StrapiSingleResponse<LanguageProgram> };
}
