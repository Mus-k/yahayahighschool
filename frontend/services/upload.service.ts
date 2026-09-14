import axios from 'axios';
import { STRAPI_URL, COOKIE_NAMES } from '@/lib/constants';
import { normalizeError } from './api.service';
import type { UploadedFile } from '@/types/upload.types';

// ─────────────────────────────────────────────────────────────────────────────
// YAHAYASCOOL — Upload Service
// ─────────────────────────────────────────────────────────────────────────────

const getToken = (): string | null => {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp(`(^| )${COOKIE_NAMES.JWT}=([^;]+)`));
  return match ? match[2] : null;
};

export const uploadService = {
  /**
   * Upload one or more files to Strapi.
   */
  async uploadFiles(
    files: File[],
    options: {
      ref?: string;
      refId?: number;
      field?: string;
      onProgress?: (percentage: number) => void;
    } = {}
  ): Promise<UploadedFile[]> {
    try {
      const formData = new FormData();

      files.forEach((file) => formData.append('files', file));

      if (options.ref) formData.append('ref', options.ref);
      if (options.refId) formData.append('refId', String(options.refId));
      if (options.field) formData.append('field', options.field);

      const token = getToken();

      const { data } = await axios.post<UploadedFile[]>(
        `${STRAPI_URL}/api/upload`,
        formData,
        {
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          onUploadProgress: (progressEvent) => {
            if (options.onProgress && progressEvent.total) {
              const percentage = Math.round(
                (progressEvent.loaded / progressEvent.total) * 100
              );
              options.onProgress(percentage);
            }
          },
        }
      );

      return Array.isArray(data) ? data : [data];
    } catch (error) {
      throw normalizeError(error);
    }
  },

  /**
   * Upload a single file.
   */
  async uploadFile(
    file: File,
    options?: {
      ref?: string;
      refId?: number;
      field?: string;
      onProgress?: (percentage: number) => void;
    }
  ): Promise<UploadedFile> {
    const results = await uploadService.uploadFiles([file], options);
    return results[0];
  },

  /**
   * Delete an uploaded file by ID.
   */
  async deleteFile(id: number): Promise<void> {
    try {
      const token = getToken();
      await axios.delete(`${STRAPI_URL}/api/upload/files/${id}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
    } catch (error) {
      throw normalizeError(error);
    }
  },

  /**
   * Get the full URL for a Strapi media file.
   */
  getFileUrl(url: string | null | undefined): string {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return `${STRAPI_URL}${url}`;
  },

  /**
   * Get the best available format URL (thumbnail for images).
   */
  getThumbnailUrl(file: UploadedFile | null | undefined): string {
    if (!file) return '';
    const thumbUrl =
      file.formats?.thumbnail?.url ??
      file.formats?.small?.url ??
      file.url;
    return uploadService.getFileUrl(thumbUrl);
  },
};
