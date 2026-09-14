import { apiClient, normalizeError } from './api.service';
import { PAGINATION } from '@/lib/constants';
import type { SchoolUser, CreateUserPayload, UpdateUserPayload, UserFilterParams, EmailAvailabilityResponse } from '@/types/user.types';
import type { PaginatedResponse } from '@/types/api.types';

// ─────────────────────────────────────────────────────────────────────────────
// YAHAYASCOOL — User Service
// ─────────────────────────────────────────────────────────────────────────────

export const userService = {
  /**
   * Get a paginated list of users with optional filtering.
   */
  async getUsers(params: UserFilterParams = {}): Promise<PaginatedResponse<SchoolUser>> {
    try {
      const {
        search,
        role,
        isActive,
        page = PAGINATION.DEFAULT_PAGE,
        pageSize = PAGINATION.DEFAULT_PAGE_SIZE,
        sort = 'createdAt:desc',
      } = params;

      const filters: Record<string, unknown> = {};

      if (search) {
        filters.$or = [
          { firstName: { $containsi: search } },
          { lastName: { $containsi: search } },
          { email: { $containsi: search } },
          { schoolId: { $containsi: search } },
          { username: { $containsi: search } },
        ];
      }

      if (role) {
        filters.role = { type: { $eq: role } };
      }

      if (isActive !== '' && isActive !== undefined) {
        filters.isActive = { $eq: isActive };
      }

      const { data } = await apiClient.get('/users', {
        params: {
          filters,
          pagination: { page, pageSize },
          sort,
          populate: ['role', 'avatar'],
        },
      });

      // Strapi /users endpoint returns an array directly (not wrapped)
      // Need to handle both formats
      const rawUsers = Array.isArray(data) ? data : data.data ?? [];
      const total = Array.isArray(data) ? rawUsers.length : data.meta?.pagination?.total ?? rawUsers.length;

      const normalizedUsers = rawUsers.map((u: any, idx: number) => {
        const idVal = u.id || u.documentId || idx + 1;
        const nameVal = u.displayName || (u.firstName && u.lastName ? `${u.firstName} ${u.lastName}` : null) || u.fullName || u.username || `User #${idVal}`;
        const schoolIdVal = u.schoolId || u.studentId || u.teacherId || u.employeeId || u.customId || (idVal ? (typeof idVal === 'string' && idVal.startsWith('AC') ? idVal : 'AC' + String(idVal).padStart(8, '0')) : `AC${String(idx + 1).padStart(8, '0')}`);
        
        let rawPhoto = u.avatarUrl || u.photoUrl || 
          u.avatar?.url || u.avatar?.data?.attributes?.url || u.avatar?.data?.url || 
          u.photo?.url || u.photo?.data?.attributes?.url || u.photo?.data?.url;

        const baseUrl = process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1339';
        const resolvedPhotoUrl = rawPhoto ? (rawPhoto.startsWith('http') || rawPhoto.startsWith('data:') ? rawPhoto : `${baseUrl}${rawPhoto.startsWith('/') ? '' : '/'}${rawPhoto}`) : null;

        return {
          ...u,
          id: idVal,
          displayName: nameVal,
          schoolId: schoolIdVal,
          avatarUrl: resolvedPhotoUrl,
          photoUrl: resolvedPhotoUrl,
        } as SchoolUser;
      });

      return {
        data: normalizedUsers,
        pagination: {
          page,
          pageSize,
          pageCount: Math.ceil(total / pageSize),
          total,
        },
      };
    } catch (error) {
      throw normalizeError(error);
    }
  },

  /**
   * Get a single user by ID.
   */
  async getUserById(id: number): Promise<SchoolUser> {
    try {
      const { data } = await apiClient.get<SchoolUser>(`/users/${id}`, {
        params: { populate: ['role', 'avatar'] },
      });
      const u: any = data || {};
      const idVal = u.id || id;
      const nameVal = u.displayName || (u.firstName && u.lastName ? `${u.firstName} ${u.lastName}` : null) || u.fullName || u.username || `User #${idVal}`;
      const schoolIdVal = u.schoolId || u.studentId || u.teacherId || u.employeeId || (idVal ? (typeof idVal === 'string' && idVal.startsWith('AC') ? idVal : 'AC' + String(idVal).padStart(8, '0')) : 'AC000000001');
      
      let rawPhoto = u.avatarUrl || u.photoUrl || 
        u.avatar?.url || u.avatar?.data?.attributes?.url || u.avatar?.data?.url || 
        u.photo?.url || u.photo?.data?.attributes?.url || u.photo?.data?.url;

      const baseUrl = process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1339';
      const resolvedPhotoUrl = rawPhoto ? (rawPhoto.startsWith('http') || rawPhoto.startsWith('data:') ? rawPhoto : `${baseUrl}${rawPhoto.startsWith('/') ? '' : '/'}${rawPhoto}`) : null;

      return {
        ...u,
        id: idVal,
        displayName: nameVal,
        schoolId: schoolIdVal,
        avatarUrl: resolvedPhotoUrl,
        photoUrl: resolvedPhotoUrl,
      } as SchoolUser;
    } catch (error) {
      throw normalizeError(error);
    }
  },

  /**
   * Create a new user.
   */
  async createUser(payload: CreateUserPayload): Promise<SchoolUser> {
    try {
      const { data } = await apiClient.post<SchoolUser>(
        '/users',
        {
          username: payload.username,
          email: payload.email,
          password: payload.password,
          firstName: payload.firstName,
          lastName: payload.lastName,
          displayName: payload.displayName,
          phone: payload.phone,
          nationality: payload.nationality,
          gender: payload.gender,
          dateOfBirth: payload.dateOfBirth,
          address: payload.address,
          preferredLanguage: payload.preferredLanguage ?? 'en',
          isActive: payload.isActive ?? true,
          confirmed: payload.confirmed ?? true,
          blocked: payload.blocked ?? false,
          role: payload.roleId,
        }
      );
      return data;
    } catch (error) {
      throw normalizeError(error);
    }
  },

  /**
   * Update an existing user.
   */
  async updateUser(id: number, payload: UpdateUserPayload): Promise<SchoolUser> {
    try {
      const { data } = await apiClient.put<SchoolUser>(`/users/${id}`, payload);
      return data;
    } catch (error) {
      throw normalizeError(error);
    }
  },

  /**
   * Delete a user by ID.
   */
  async deleteUser(id: number): Promise<void> {
    try {
      await apiClient.delete(`/users/${id}`);
    } catch (error) {
      throw normalizeError(error);
    }
  },

  /**
   * Check if an email address is available (not already registered).
   */
  async checkEmailAvailability(email: string): Promise<EmailAvailabilityResponse> {
    try {
      const { data } = await apiClient.get('/users', {
        params: {
          filters: { email: { $eq: email.toLowerCase() } },
          pagination: { page: 1, pageSize: 1 },
          fields: ['id'],
        },
      });

      const users = Array.isArray(data) ? data : data.data ?? [];
      return {
        available: users.length === 0,
        message: users.length > 0 ? 'This email address is already registered.' : undefined,
      };
    } catch (error) {
      throw normalizeError(error);
    }
  },

  /**
   * Get all available roles.
   */
  async getRoles() {
    try {
      const { data } = await apiClient.get('/users-permissions/roles');
      return data.roles ?? [];
    } catch (error) {
      throw normalizeError(error);
    }
  },

  /**
   * Toggle user active status.
   */
  async toggleUserStatus(id: number, isActive: boolean): Promise<SchoolUser> {
    return userService.updateUser(id, { isActive });
  },
};
