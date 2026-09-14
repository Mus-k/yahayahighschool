import { apiClient } from './api.service';
import type {
  Student,
  Teacher,
  Parent,
  Worker,
  Section,
  Campus,
  AcademicYear,
  AcademicTerm,
  GradeLevel,
  DirectorySearchParams,
  PaginatedERPResponse,
} from '../types/erp.types';

// Helper to normalize entities across Strapi v4/v5 format variations
function normalizeEntity<T>(item: any, idx = 0): T {
  if (!item || typeof item !== 'object') return item as T;
  const idVal = item.id || item.documentId || idx + 1;
  const nameVal = item.name || item.fullName || item.displayName || [item.firstName, item.lastName].filter(Boolean).join(' ') || item.title || item.username;
  const schoolIdVal = item.schoolId || item.studentId || item.teacherId || item.employeeId || item.admissionNumber || item.code || item.documentId || (idVal ? (typeof idVal === 'string' && idVal.startsWith('AC') ? idVal : 'AC' + String(idVal).padStart(8, '0')) : `AC${String(idx + 1).padStart(8, '0')}`);

  // Resolve media URLs safely
  let rawPhoto = item.photoUrl || item.avatarUrl || 
    item.photo?.url || item.photo?.data?.attributes?.url || item.photo?.data?.url || 
    item.avatar?.url || item.avatar?.data?.attributes?.url || item.avatar?.data?.url ||
    item.user?.avatar?.url || item.user?.avatar?.data?.attributes?.url || item.user?.avatar?.data?.url || item.user?.avatarUrl || item.user?.photoUrl || item.user?.photo?.url;

  const baseUrl = process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1339';
  const resolvedPhotoUrl = rawPhoto ? (rawPhoto.startsWith('http') || rawPhoto.startsWith('data:') ? rawPhoto : `${baseUrl}${rawPhoto.startsWith('/') ? '' : '/'}${rawPhoto}`) : null;

  // Normalize nested children / students relations if present
  const rawChildren = item.children?.data || item.children || item.students?.data || item.students || [];
  const normalizedChildren = (Array.isArray(rawChildren) ? rawChildren : [rawChildren].filter(Boolean)).map((c: any, i: number) => {
    if (!c) return { name: `Scholar #${i + 1}` };
    if (typeof c === 'string') return { name: c };
    const cName = c.name || c.fullName || c.displayName || c.attributes?.name || [c.firstName || c.attributes?.firstName, c.lastName || c.attributes?.lastName].filter(Boolean).join(' ') || `Scholar #${c.id || i + 1}`;
    return {
      ...c,
      name: cName || `Scholar #${i + 1}`,
      fullName: cName || `Scholar #${i + 1}`,
      studentId: c.studentId || c.schoolId || c.attributes?.studentId || c.attributes?.schoolId || `AC${String(c.id || i + 1).padStart(8, '0')}`
    };
  });

  return {
    ...item,
    id: idVal,
    name: nameVal || `Entity #${idVal}`,
    fullName: nameVal || `Entity #${idVal}`,
    displayName: nameVal || `Entity #${idVal}`,
    schoolId: schoolIdVal,
    studentId: item.studentId || schoolIdVal,
    teacherId: item.teacherId || schoolIdVal,
    photoUrl: resolvedPhotoUrl,
    avatarUrl: resolvedPhotoUrl,
    children: normalizedChildren,
    students: normalizedChildren,
  } as T;
}

// Helper to unwrap Strapi v5 responses which may be `{ data: [...], meta: {...} }` or `[...]`
function unwrapPaginated<T>(res: unknown): PaginatedERPResponse<T> {
  if (res && typeof res === 'object' && 'data' in res) {
    const response = res as { data: T[]; meta?: any };
    const rawArr = Array.isArray(response.data) ? response.data : [response.data].filter(Boolean);
    const normalized = rawArr.map((item, idx) => normalizeEntity<T>(item, idx));
    return {
      data: normalized,
      meta: response.meta || { pagination: { page: 1, pageSize: 25, pageCount: 1, total: normalized.length } },
    };
  }
  const arr = Array.isArray(res) ? res : [res].filter(Boolean);
  const normalized = arr.map((item, idx) => normalizeEntity<T>(item, idx));
  return {
    data: normalized as T[],
    meta: { pagination: { page: 1, pageSize: normalized.length, pageCount: 1, total: normalized.length } },
  };
}

function unwrapSingle<T>(res: unknown): T | null {
  if (!res) return null;
  if (typeof res === 'object' && 'data' in res) {
    const data = (res as { data: any }).data;
    if (Array.isArray(data)) return data[0] ? normalizeEntity<T>(data[0]) : null;
    return data ? normalizeEntity<T>(data) : null;
  }
  return normalizeEntity<T>(res);
}

export const erpService = {
  // ─────────────────────────────────────────────────────────────────────────────
  // Students
  // ─────────────────────────────────────────────────────────────────────────────
  async getStudents(params: DirectorySearchParams = {}, locale = 'en'): Promise<PaginatedERPResponse<Student>> {
    try {
      const filters: any = {};
      if (params.query) {
        filters.$or = [
          { firstName: { $containsi: params.query } },
          { lastName: { $containsi: params.query } },
          { schoolId: { $containsi: params.query } },
          { admissionNumber: { $containsi: params.query } },
        ];
      }
      if (params.gender && params.gender !== 'all') {
        filters.gender = params.gender;
      }
      if (params.status && params.status !== 'all') {
        filters.status = params.status;
      }
      if (params.section && params.section !== 'all') {
        filters.sections = { code: { $eq: params.section } };
      }

      const res = await apiClient.get('/students', {
        params: {
          locale,
          filters: Object.keys(filters).length > 0 ? filters : undefined,
          pagination: {
            page: params.page || 1,
            pageSize: params.pageSize || 12,
          },
          sort: params.sort || 'schoolId:asc',
          populate: ['photo', 'user', 'user.avatar', 'sections', 'parents', 'timeline', 'behaviorRecords', 'enrollmentHistory', 'departments'],
        },
      });
      return unwrapPaginated<Student>(res.data);
    } catch (error) {
      console.warn('[erpService] Failed to fetch students:', error);
      return { data: [], meta: { pagination: { page: 1, pageSize: 12, pageCount: 0, total: 0 } } };
    }
  },

  async getStudentById(id: string | number, locale = 'en'): Promise<Student | null> {
    try {
      const res = await apiClient.get(`/students/${id}`, {
        params: {
          locale,
          populate: ['photo', 'user', 'user.avatar', 'sections', 'parents', 'teachers', 'timeline', 'behaviorRecords', 'enrollmentHistory', 'medicalInfo', 'staffNotes', 'documents', 'departments', 'programs', 'academicYears', 'enrollments.courseOffering.subject', 'enrollments.courseOffering.academicSection', 'enrollments.courseOffering.teacher'],
        },
      });
      return unwrapSingle<Student>(res.data);
    } catch (error) {
      console.warn(`[erpService] Failed to fetch student ${id}:`, error);
      return null;
    }
  },

  /** Returns the student's advance wallet balance (pre-credit from overpayments). */
  async getStudentAdvanceBalance(studentId: string | number): Promise<number> {
    try {
      // Use filter-based query so it works with both numeric id and documentId
      const isDocId = typeof studentId === 'string' && isNaN(Number(studentId));
      const filterParam = isDocId
        ? `filters[documentId][$eq]=${studentId}`
        : `filters[id][$eq]=${studentId}`;
      const res = await apiClient.get(`/students?${filterParam}&fields[0]=advanceBalance&fields[1]=documentId&fields[2]=id&pagination[limit]=1`);
      const student = res.data?.data?.[0];
      return Number(student?.advanceBalance || 0);
    } catch {
      return 0;
    }
  },

  async getStudentBySchoolId(schoolId: string, locale = 'en'): Promise<Student | null> {
    try {
      const res = await apiClient.get('/students', {
        params: {
          locale,
          filters: { schoolId: { $eq: schoolId } },
          populate: ['photo', 'user', 'user.avatar', 'sections', 'parents', 'teachers', 'timeline', 'behaviorRecords', 'enrollmentHistory', 'medicalInfo', 'staffNotes', 'documents', 'departments', 'programs', 'academicYears'],
        },
      });
      const paginated = unwrapPaginated<Student>(res.data);
      return paginated.data[0] || null;
    } catch (error) {
      console.warn(`[erpService] Failed to fetch student by schoolId ${schoolId}:`, error);
      return null;
    }
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // Teachers
  // ─────────────────────────────────────────────────────────────────────────────
  async getTeachers(params: DirectorySearchParams = {}, locale = 'en'): Promise<PaginatedERPResponse<Teacher>> {
    try {
      const filters: any = {};
      if (params.query) {
        filters.$or = [
          { name: { $containsi: params.query } },
          { schoolId: { $containsi: params.query } },
          { specializations: { $containsi: params.query } },
        ];
      }
      if (params.gender && params.gender !== 'all') {
        filters.gender = params.gender;
      }
      if (params.status && params.status !== 'all') {
        filters.employmentStatus = params.status;
      }
      if (params.section && params.section !== 'all') {
        filters.sections = { code: { $eq: params.section } };
      }

      const res = await apiClient.get('/teachers', {
        params: {
          locale,
          filters: Object.keys(filters).length > 0 ? filters : undefined,
          pagination: {
            page: params.page || 1,
            pageSize: params.pageSize || 12,
          },
          sort: params.sort || 'schoolId:asc',
          populate: ['photo', 'user', 'user.avatar', 'departments', 'sections', 'programs'],
        },
      });
      return unwrapPaginated<Teacher>(res.data);
    } catch (error) {
      console.warn('[erpService] Failed to fetch teachers:', error);
      return { data: [], meta: { pagination: { page: 1, pageSize: 12, pageCount: 0, total: 0 } } };
    }
  },

  async getTeacherById(id: string | number, locale = 'en'): Promise<Teacher | null> {
    try {
      const res = await apiClient.get(`/teachers/${id}`, {
        params: {
          locale,
          populate: ['photo', 'user', 'user.avatar', 'departments', 'sections', 'programs', 'students', 'documents'],
        },
      });
      return unwrapSingle<Teacher>(res.data);
    } catch (error) {
      console.warn(`[erpService] Failed to fetch teacher ${id}:`, error);
      return null;
    }
  },

  async getTeacherBySchoolId(schoolId: string, locale = 'en'): Promise<Teacher | null> {
    try {
      const res = await apiClient.get('/teachers', {
        params: {
          locale,
          filters: { schoolId: { $eq: schoolId } },
          populate: ['photo', 'user', 'user.avatar', 'departments', 'sections', 'programs', 'students', 'documents'],
        },
      });
      const paginated = unwrapPaginated<Teacher>(res.data);
      return paginated.data[0] || null;
    } catch (error) {
      console.warn(`[erpService] Failed to fetch teacher by schoolId ${schoolId}:`, error);
      return null;
    }
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // Parents
  // ─────────────────────────────────────────────────────────────────────────────
  async getParents(params: DirectorySearchParams = {}, locale = 'en'): Promise<PaginatedERPResponse<Parent>> {
    try {
      const filters: any = {};
      if (params.query) {
        filters.$or = [
          { name: { $containsi: params.query } },
          { schoolId: { $containsi: params.query } },
          { phone: { $containsi: params.query } },
        ];
      }
      const res = await apiClient.get('/parents', {
        params: {
          locale,
          filters: Object.keys(filters).length > 0 ? filters : undefined,
          pagination: {
            page: params.page || 1,
            pageSize: params.pageSize || 12,
          },
          sort: params.sort || 'schoolId:asc',
          populate: ['photo', 'children'],
        },
      });
      return unwrapPaginated<Parent>(res.data);
    } catch (error) {
      console.warn('[erpService] Failed to fetch parents:', error);
      return { data: [], meta: { pagination: { page: 1, pageSize: 12, pageCount: 0, total: 0 } } };
    }
  },

  async getParentById(id: string | number, locale = 'en'): Promise<Parent | null> {
    try {
      const res = await apiClient.get(`/parents/${id}`, {
        params: {
          locale,
          populate: ['photo', 'children'],
        },
      });
      return unwrapSingle<Parent>(res.data);
    } catch (error) {
      console.warn(`[erpService] Failed to fetch parent ${id}:`, error);
      return null;
    }
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // Workers
  // ─────────────────────────────────────────────────────────────────────────────
  async getWorkers(params: DirectorySearchParams = {}, locale = 'en'): Promise<PaginatedERPResponse<Worker>> {
    try {
      const filters: any = {};
      if (params.query) {
        filters.$or = [
          { name: { $containsi: params.query } },
          { schoolId: { $containsi: params.query } },
          { role: { $containsi: params.query } },
        ];
      }
      const res = await apiClient.get('/workers', {
        params: {
          locale,
          filters: Object.keys(filters).length > 0 ? filters : undefined,
          pagination: {
            page: params.page || 1,
            pageSize: params.pageSize || 12,
          },
          sort: params.sort || 'schoolId:asc',
          populate: ['photo', 'departments'],
        },
      });
      return unwrapPaginated<Worker>(res.data);
    } catch (error) {
      console.warn('[erpService] Failed to fetch workers:', error);
      return { data: [], meta: { pagination: { page: 1, pageSize: 12, pageCount: 0, total: 0 } } };
    }
  },

  async getWorkerById(id: string | number, locale = 'en'): Promise<Worker | null> {
    try {
      const res = await apiClient.get(`/workers/${id}`, {
        params: {
          locale,
          populate: ['photo', 'departments', 'documents'],
        },
      });
      return unwrapSingle<Worker>(res.data);
    } catch (error) {
      console.warn(`[erpService] Failed to fetch worker ${id}:`, error);
      return null;
    }
  },
  
  async createWorker(payload: any): Promise<any> {
    try {
      const res = await apiClient.post('/workers', { data: payload });
      return unwrapSingle<any>(res.data);
    } catch (error) {
      console.warn('[erpService] Failed to create worker:', error);
      return null;
    }
  },

  async updateWorker(id: string | number, payload: any): Promise<any> {
    try {
      const res = await apiClient.put(`/workers/${id}`, { data: payload });
      return unwrapSingle<any>(res.data);
    } catch (error) {
      console.warn(`[erpService] Failed to update worker ${id}:`, error);
      return null;
    }
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // Sections & Infrastructure
  // ─────────────────────────────────────────────────────────────────────────────
  async getSections(locale = 'en'): Promise<Section[]> {
    try {
      const res = await apiClient.get('/sections', {
        params: { locale, populate: ['academicYear', 'department', 'program', 'teachers', 'academicHead', 'gradeLevels'] },
      });
      const paginated = unwrapPaginated<Section>(res.data);
      return paginated.data;
    } catch (error) {
      console.warn('[erpService] Failed to fetch sections:', error);
      return [];
    }
  },

  async getDepartments(locale = 'en'): Promise<any[]> {
    try {
      const res = await apiClient.get('/departments', {
        params: { locale, populate: ['sectionsList', 'teachersList'] },
      });
      const paginated = unwrapPaginated<any>(res.data);
      return paginated.data;
    } catch (error) {
      console.warn('[erpService] Failed to fetch departments:', error);
      return [];
    }
  },

  async getCampuses(locale = 'en'): Promise<Campus[]> {
    try {
      const res = await apiClient.get('/campuses', { params: { locale } });
      const paginated = unwrapPaginated<Campus>(res.data);
      return paginated.data;
    } catch (error) {
      console.warn('[erpService] Failed to fetch campuses:', error);
      return [];
    }
  },

  async getAcademicYears(locale = 'en'): Promise<AcademicYear[]> {
    try {
      const res = await apiClient.get('/academic-years', { params: { locale, populate: ['terms'] } });
      const paginated = unwrapPaginated<AcademicYear>(res.data);
      return paginated.data;
    } catch (error) {
      console.warn('[erpService] Failed to fetch academic years:', error);
      return [];
    }
  },

  async getGradeLevels(locale = 'en'): Promise<GradeLevel[]> {
    try {
      const res = await apiClient.get('/grade-levels', {
        params: { locale, populate: ['curriculum', 'sections'] }
      });
      const paginated = unwrapPaginated<GradeLevel>(res.data);
      if (paginated.data && paginated.data.length > 0) {
        return paginated.data.sort((a, b) => (a.order || 0) - (b.order || 0));
      }
    } catch (error) {
      console.warn('[erpService] Failed to fetch grade levels from /grade-levels:', error);
    }
    return [
      { id: 1, name: 'Kindergarten 1', code: 'KG-1', order: 1, capacity: 25 },
      { id: 2, name: 'Kindergarten 2', code: 'KG-2', order: 2, capacity: 25 },
      { id: 3, name: 'Grade 1 (Primary Hifz & Foundation)', code: 'GRADE-1', order: 3, capacity: 30 },
      { id: 4, name: 'Grade 2 (Primary)', code: 'GRADE-2', order: 4, capacity: 30 },
      { id: 5, name: 'Grade 3 (Primary)', code: 'GRADE-3', order: 5, capacity: 30 },
      { id: 6, name: 'Grade 4 (Primary)', code: 'GRADE-4', order: 6, capacity: 30 },
      { id: 7, name: 'Grade 5 (Primary)', code: 'GRADE-5', order: 7, capacity: 30 },
      { id: 8, name: 'Grade 6 (Primary Graduation)', code: 'GRADE-6', order: 8, capacity: 30 },
      { id: 9, name: 'Grade 7 (Middle School)', code: 'GRADE-7', order: 9, capacity: 35 },
      { id: 10, name: 'Grade 8 (Middle School STEM)', code: 'GRADE-8', order: 10, capacity: 35 },
      { id: 11, name: 'Grade 9 (Middle School)', code: 'GRADE-9', order: 11, capacity: 35 },
      { id: 12, name: 'Grade 10 (Secondary High)', code: 'GRADE-10', order: 12, capacity: 35 },
      { id: 13, name: 'Grade 11 (Advanced Baccalaureate)', code: 'GRADE-11', order: 13, capacity: 35 },
      { id: 14, name: 'Grade 12 (Senior High Graduation)', code: 'GRADE-12', order: 14, capacity: 35 }
    ];
  }
};
