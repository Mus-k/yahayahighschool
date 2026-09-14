import { FileTypeEnum } from './enums';

// ─────────────────────────────────────────────────────────────────────────────
// YAHAYASCOOL — Upload Types
// ─────────────────────────────────────────────────────────────────────────────

/** Uploaded file as returned by Strapi */
export interface UploadedFile {
  id: number;
  documentId: string;
  name: string;
  alternativeText: string | null;
  caption: string | null;
  width: number | null;
  height: number | null;
  formats: {
    thumbnail?: UploadedFileFormat;
    small?: UploadedFileFormat;
    medium?: UploadedFileFormat;
    large?: UploadedFileFormat;
  } | null;
  hash: string;
  ext: string;
  mime: string;
  size: number;
  url: string;
  previewUrl: string | null;
  provider: string;
  createdAt: string;
  updatedAt: string;
}

export interface UploadedFileFormat {
  name: string;
  hash: string;
  ext: string;
  mime: string;
  width: number;
  height: number;
  size: number;
  url: string;
}

/** Upload configuration for FileUpload component */
export interface UploadConfig {
  accept?: FileTypeEnum[];
  maxSizeBytes?: number;
  multiple?: boolean;
  maxFiles?: number;
}

/** Upload progress event */
export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

/** Upload state for the useUpload hook */
export interface UploadState {
  files: UploadedFile[];
  isUploading: boolean;
  progress: UploadProgress | null;
  error: string | null;
}

/** MIME type to FileTypeEnum mapping */
export const getMimeFileType = (mime: string): FileTypeEnum => {
  if (mime.startsWith('image/')) return FileTypeEnum.Image;
  if (mime.startsWith('video/')) return FileTypeEnum.Video;
  if (mime.startsWith('audio/')) return FileTypeEnum.Audio;
  if (mime === 'application/pdf') return FileTypeEnum.PDF;
  if (mime.includes('word') || mime.includes('document')) return FileTypeEnum.Word;
  if (mime.includes('sheet') || mime.includes('excel') || mime === 'text/csv')
    return FileTypeEnum.Excel;
  return FileTypeEnum.Other;
};

/** Format bytes to human-readable string */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
};
