import type { StrapiSingleResponse, StrapiCollectionResponse } from './api.types';
import type { Department, Program } from './cms.types';
import type {
  Section,
  Student,
  Teacher,
  AcademicYear,
  AcademicTerm,
  Campus
} from './erp.types';

// ─────────────────────────────────────────────────────────────────────────────
// Subject Module
// ─────────────────────────────────────────────────────────────────────────────

export interface Subject {
  id: number;
  name: string;
  code: string;
  description?: string;
  subjectType: 'Core' | 'Elective' | 'Extracurricular';
  activeStatus: boolean;
  color?: string;
  icon?: string;
  defaultWeeklyHours?: number;
  passingScore?: number;
  creditValue?: number;
  displayOrder?: number;
  department?: Department;
  programs?: Program[];
  sections?: Section[];
  teachers?: Teacher[];
  students?: Student[];
  createdAt: string;
  updatedAt: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Curriculum & Topics
// ─────────────────────────────────────────────────────────────────────────────

export interface Topic {
  id: number;
  title: string;
  description?: string;
  learningObjectives?: string;
  estimatedTime?: string;
  teachingMethod?: string;
  completionStatus: 'Pending' | 'In Progress' | 'Completed';
  orderNumber?: number;
  curriculum?: Curriculum;
  attachments?: any;
  createdAt: string;
  updatedAt: string;
}

export interface Curriculum {
  id: number;
  title: string;
  version: string;
  description?: string;
  objectives?: string;
  learningOutcomes?: string;
  estimatedDuration?: string;
  status: 'Active' | 'Draft' | 'Archived';
  subject?: Subject;
  academicYear?: AcademicYear;
  program?: Program;
  department?: Department;
  section?: Section;
  topics?: Topic[];
  attachments?: any;
  createdAt: string;
  updatedAt: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Classrooms & Timetables
// ─────────────────────────────────────────────────────────────────────────────

export interface Classroom {
  id: number;
  name: string;
  code: string;
  capacity?: number;
  building?: string;
  floor?: string;
  roomType: 'Lecture Room' | 'Laboratory' | 'Library' | 'Auditorium' | 'Mosque' | 'Gym' | 'Other';
  resources?: Record<string, any>;
  status: 'Active' | 'Maintenance' | 'Inactive';
  campus?: Campus;
  createdAt: string;
  updatedAt: string;
}

export interface TimetableSlot {
  id: number;
  dayOfWeek: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';
  startTime: string; // e.g. "08:00:00.000"
  endTime: string;
  durationMinutes?: number;
  status: 'Active' | 'Cancelled' | 'Rescheduled';
  academicYear?: AcademicYear;
  academicTerm?: AcademicTerm;
  section?: Section;
  teacher?: Teacher;
  subject?: Subject;
  classroom?: Classroom;
  campus?: Campus;
  createdAt: string;
  updatedAt: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Lesson Planning
// ─────────────────────────────────────────────────────────────────────────────

export interface LessonPlan {
  id: number;
  title: string;
  lessonNumber?: string;
  objectives?: string;
  teachingMethod?: string;
  homework?: string;
  assessmentMethod?: string;
  status: 'Draft' | 'Pending Approval' | 'Approved' | 'Rejected';
  teacher?: Teacher;
  subject?: Subject;
  section?: Section;
  curriculum?: Curriculum;
  academicYear?: AcademicYear;
  academicTerm?: AcademicTerm;
  attachments?: any;
  createdAt: string;
  updatedAt: string;
}

export interface LessonDelivery {
  id: number;
  actualStartTime?: string;
  actualEndTime?: string;
  topicsCovered?: any;
  teacherReflection?: string;
  completionPercentage?: number;
  lessonPlan?: LessonPlan;
  attachments?: any;
  createdAt: string;
  updatedAt: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Attendance, Homework & Gradebook
// ─────────────────────────────────────────────────────────────────────────────

export interface AttendanceRecord {
  id: number;
  date: string; // YYYY-MM-DD
  status: 'Present' | 'Absent' | 'Late' | 'Excused' | 'Medical' | 'Holiday' | 'Suspended' | 'Remote';
  comments?: string;
  student?: Student;
  teacher?: Teacher;
  section?: Section;
  subject?: Subject;
  academicYear?: AcademicYear;
  academicTerm?: AcademicTerm;
  createdAt: string;
  updatedAt: string;
}

export interface Homework {
  id: number;
  title: string;
  instructions?: string;
  assignedDate: string;
  dueDate: string;
  maxScore?: number;
  submissionType: 'Individual' | 'Group';
  category: 'Reading' | 'Writing' | 'Research' | 'Project' | 'Presentation' | 'Practical' | 'Memorization' | 'Listening' | 'Speaking' | 'Other';
  visibility: 'Draft' | 'Published';
  subject?: Subject;
  teacher?: Teacher;
  section?: Section;
  academicYear?: AcademicYear;
  academicTerm?: AcademicTerm;
  attachments?: any;
  createdAt: string;
  updatedAt: string;
}

export interface HomeworkSubmission {
  id: number;
  submissionDate: string;
  isLate: boolean;
  grade?: number;
  feedback?: string;
  textContent?: string;
  homework?: Homework;
  student?: Student;
  attachments?: any;
  createdAt: string;
  updatedAt: string;
}

export interface GradebookEntry {
  id: number;
  assessmentType: 'Homework' | 'Quiz' | 'Project' | 'Participation' | 'Attendance' | 'Exam' | 'Other';
  title: string;
  score: number;
  maxScore: number;
  percentage?: number;
  weight?: number;
  teacherComment?: string;
  status: 'Draft' | 'Published';
  student?: Student;
  teacher?: Teacher;
  subject?: Subject;
  section?: Section;
  academicYear?: AcademicYear;
  academicTerm?: AcademicTerm;
  createdAt: string;
  updatedAt: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Academic Resources & Calendar Events
// ─────────────────────────────────────────────────────────────────────────────

export interface AcademicResource {
  id: number;
  title: string;
  category?: 'Document' | 'Video' | 'Audio' | 'Image' | 'Archive' | 'Link' | 'Other';
  description?: string;
  version?: string;
  isShared: boolean;
  url?: string;
  file?: any;
  subject?: Subject;
  section?: Section;
  author?: Teacher;
  createdAt: string;
  updatedAt: string;
}

export interface AcademicCalendarEvent {
  id: number;
  title: string;
  eventType: 'Holiday' | 'Exam' | 'Meeting' | 'Custom';
  startDate: string;
  endDate: string;
  description?: string;
  academicYear?: AcademicYear;
  academicTerms?: AcademicTerm[];
  createdAt: string;
  updatedAt: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Response Types
// ─────────────────────────────────────────────────────────────────────────────
export type SubjectResponse = StrapiSingleResponse<Subject>;
export type SubjectsResponse = StrapiCollectionResponse<Subject>;

export type CurriculumResponse = StrapiSingleResponse<Curriculum>;
export type CurriculumsResponse = StrapiCollectionResponse<Curriculum>;

export type TimetableSlotResponse = StrapiSingleResponse<TimetableSlot>;
export type TimetableSlotsResponse = StrapiCollectionResponse<TimetableSlot>;

export type HomeworkResponse = StrapiSingleResponse<Homework>;
export type HomeworksResponse = StrapiCollectionResponse<Homework>;

export type AttendanceResponse = StrapiCollectionResponse<AttendanceRecord>;
export type GradebookResponse = StrapiCollectionResponse<GradebookEntry>;
