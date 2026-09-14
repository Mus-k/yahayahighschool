import { apiClient } from './api.service';
import type {
  SubjectResponse,
  SubjectsResponse,
  CurriculumResponse,
  CurriculumsResponse,
  TimetableSlotResponse,
  TimetableSlotsResponse,
  HomeworkResponse,
  HomeworksResponse,
  AttendanceResponse,
  GradebookResponse,
  AcademicResource,
} from '@/types/lms.types';
import type { StrapiCollectionResponse, StrapiSingleResponse } from '@/types/api.types';
import qs from 'qs';

// ─────────────────────────────────────────────────────────────────────────────
// Subject & Curriculum Services
// ─────────────────────────────────────────────────────────────────────────────

export const getSubjects = async (params = {}) => {
  const query = qs.stringify({ populate: '*', ...params }, { encodeValuesOnly: true });
  const res = await apiClient.get<SubjectsResponse>(`/subjects?${query}`);
  return res.data;
};

export const getCurriculums = async (params = {}) => {
  const query = qs.stringify({ populate: '*', ...params }, { encodeValuesOnly: true });
  const res = await apiClient.get<CurriculumsResponse>(`/curriculums?${query}`);
  return res.data;
};

// ─────────────────────────────────────────────────────────────────────────────
// Timetable Services
// ─────────────────────────────────────────────────────────────────────────────

export const getTimetables = async (params = {}) => {
  const query = qs.stringify(
    {
      populate: ['teacher', 'subject', 'classroom', 'section', 'academicYear', 'academicTerm', 'campus', 'courseOffering.subject', 'courseOffering.teacher', 'courseOffering.academicSection', 'courseOffering.gradeLevel'],
      ...params,
    },
    { encodeValuesOnly: true }
  );
  const res = await apiClient.get<TimetableSlotsResponse>(`/timetable-slots?${query}`);
  return res.data;
};

// ─────────────────────────────────────────────────────────────────────────────
// Homework Services
// ─────────────────────────────────────────────────────────────────────────────

export const getHomeworks = async (params = {}) => {
  const query = qs.stringify(
    {
      populate: ['subject', 'teacher', 'section'],
      ...params,
    },
    { encodeValuesOnly: true }
  );
  const res = await apiClient.get<HomeworksResponse>(`/homeworks?${query}`);
  return res.data;
};

// ─────────────────────────────────────────────────────────────────────────────
// Attendance & Gradebook Services
// ─────────────────────────────────────────────────────────────────────────────

export const getAttendanceRecords = async (params = {}) => {
  const query = qs.stringify(
    {
      populate: ['student', 'section', 'subject'],
      ...params,
    },
    { encodeValuesOnly: true }
  );
  const res = await apiClient.get<AttendanceResponse>(`/attendance-records?${query}`);
  return res.data;
};

export const getGradebookEntries = async (params = {}) => {
  const query = qs.stringify(
    {
      populate: ['student', 'section', 'subject', 'teacher'],
      ...params,
    },
    { encodeValuesOnly: true }
  );
  const res = await apiClient.get<GradebookResponse>(`/gradebook-entries?${query}`);
  return res.data;
};

// ─────────────────────────────────────────────────────────────────────────────
// Academic Resource Library
// ─────────────────────────────────────────────────────────────────────────────

export const getResources = async (params: {
  category?: AcademicResource['category'];
  subject?: number;
  isShared?: boolean;
  limit?: number;
} = {}) => {
  const filters: Record<string, any> = {};
  if (params.category) filters['category'] = { $eq: params.category };
  if (params.subject)  filters['subject']  = { id: { $eq: params.subject } };
  if (typeof params.isShared === 'boolean') filters['isShared'] = { $eq: params.isShared };

  const query = qs.stringify(
    {
      populate: ['file', 'subject', 'section', 'author'],
      filters,
      sort: ['createdAt:desc'],
      pagination: { limit: params.limit ?? 200 },
    },
    { encodeValuesOnly: true }
  );
  const res = await apiClient.get<StrapiCollectionResponse<AcademicResource>>(`/academic-resources?${query}`);
  return res.data;
};

export const getResource = async (id: number | string) => {
  const res = await apiClient.get<StrapiSingleResponse<AcademicResource>>(
    `/academic-resources/${id}?populate=*`
  );
  return res.data;
};

export const createResource = async (data: {
  title: string;
  category?: AcademicResource['category'];
  description?: string;
  version?: string;
  isShared: boolean;
  url?: string;
  tags?: any;
  file?: number;          // Strapi upload file ID
  subject?: number;       // relation ID
  section?: number;       // relation ID
  author?: number;
}) => {
  const res = await apiClient.post<StrapiSingleResponse<AcademicResource>>(
    '/academic-resources',
    { data }
  );
  return res.data;
};

export const updateResource = async (
  id: number | string,
  data: Partial<{
    title: string;
    category: AcademicResource['category'];
    description: string;
    version: string;
    isShared: boolean;
    url: string;
    tags: any;
    file: number;
    subject: number;
    section: number;
    author: number;
  }>
) => {
  const res = await apiClient.put<StrapiSingleResponse<AcademicResource>>(
    `/academic-resources/${id}`,
    { data }
  );
  return res.data;
};

export const deleteResource = async (id: number | string) => {
  await apiClient.delete(`/academic-resources/${id}`);
};

export const incrementDownloadCount = async (id: number | string, currentCount: number) => {
  try {
    await apiClient.put(`/academic-resources/${id}`, {
      data: { downloadCount: currentCount + 1 }
    });
  } catch { /* non-critical */ }
};
