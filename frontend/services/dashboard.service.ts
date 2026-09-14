/* eslint-disable @typescript-eslint/no-explicit-any */
import { apiClient } from './api.service';

export interface AdminDashboardData {
  counts: {
    students: number; teachers: number; parents: number; workers: number;
    sections: number; academicYears: number; departments: number; programs: number;
    subjects: number; curriculums: number; notifications: number; admissions: number;
    announcements: number; lessonPlans: number; homework: number; attendanceRecords: number;
    examinations: number; certificates: number; events: number; auditLogs: number;
  };
  recentActivity: any[]; upcomingEvents: any[]; recentAnnouncements: any[];
  generatedAt: string;
}

export interface TeacherDashboardData {
  teacherId: number | null; assignedSections: number; subjectCount: number;
  pendingHomework: number; pendingAssessments: number; attendanceRecordsMarked: number;
  recentActivity: any[]; generatedAt: string;
}

export interface StudentDashboardData {
  studentId: number | null; schoolId: string | null; sections: number; teachers: number;
  pendingHomework: number; upcomingExams: number; attendanceMarked: number;
  announcements: any[]; generatedAt: string;
}

export interface ParentDashboardData {
  parentId: number | null; childrenCount: number; upcomingEvents: number;
  announcements: any[]; generatedAt: string;
}

export interface DirectorDashboardData {
  counts: { students: number; teachers: number; sections: number; departments: number;
    examinations: number; lessonPlans: number; homework: number; attendanceRecords: number; };
  recentAnnouncements: any[]; generatedAt: string;
}

export interface AccountantDashboardData {
  counts: { donations: number; workers: number; };
  donationRecords: any[]; announcements: any[]; generatedAt: string;
}

export interface WorkerDashboardData {
  workerId: number | null; workerName: string | null; workerRole: string | null;
  announcements: any[]; generatedAt: string;
}

export const dashboardService = {
  async getAdminDashboard(): Promise<AdminDashboardData> {
    const res = await apiClient.get('/dashboard/admin');
    return res.data.data;
  },
  async getDirectorDashboard(): Promise<DirectorDashboardData> {
    const res = await apiClient.get('/dashboard/director');
    return res.data.data;
  },
  async getTeacherDashboard(): Promise<TeacherDashboardData> {
    const res = await apiClient.get('/dashboard/teacher');
    return res.data.data;
  },
  async getStudentDashboard(): Promise<StudentDashboardData> {
    const res = await apiClient.get('/dashboard/student');
    return res.data.data;
  },
  async getParentDashboard(): Promise<ParentDashboardData> {
    const res = await apiClient.get('/dashboard/parent');
    return res.data.data;
  },
  async getAccountantDashboard(): Promise<AccountantDashboardData> {
    const res = await apiClient.get('/dashboard/accountant');
    return res.data.data;
  },
  async getAccountLeadDashboard(): Promise<AccountantDashboardData> {
    const res = await apiClient.get('/dashboard/account-lead');
    return res.data.data;
  },
  async getWorkerDashboard(): Promise<WorkerDashboardData> {
    const res = await apiClient.get('/dashboard/worker');
    return res.data.data;
  },
  async getDriverDashboard(): Promise<WorkerDashboardData> {
    const res = await apiClient.get('/dashboard/driver');
    return res.data.data;
  },
};
