// ─────────────────────────────────────────────────────────────────────────────
// YAHAYASCOOL — API Response Types
// Typed wrappers for all Strapi REST API responses
// ─────────────────────────────────────────────────────────────────────────────

/** Standard Strapi v5 single entity response */
export interface StrapiSingleResponse<T> {
  data: T;
  meta: Record<string, unknown>;
}

/** Standard Strapi v5 collection response */
export interface StrapiCollectionResponse<T> {
  data: T[];
  meta: {
    pagination: StrapiPagination;
  };
}

/** Strapi pagination metadata */
export interface StrapiPagination {
  page: number;
  pageSize: number;
  pageCount: number;
  total: number;
}

/** Strapi entity base fields */
export interface StrapiEntity {
  id: number;
  documentId: string;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string | null;
}

/** Strapi error response */
export interface StrapiError {
  status: number;
  name: string;
  message: string;
  details?: Record<string, unknown>;
}

/** Strapi error envelope */
export interface StrapiErrorEnvelope {
  data: null;
  error: StrapiError;
}

/** Normalized API error for frontend use */
export interface ApiError {
  message: string;
  status: number;
  code?: string;
  details?: Record<string, unknown>;
}

/** Generic paginated API response */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    pageCount: number;
    total: number;
  };
}

/** Query parameters for Strapi collection endpoints */
export interface StrapiQueryParams {
  pagination?: {
    page?: number;
    pageSize?: number;
    start?: number;
    limit?: number;
  };
  sort?: string | string[];
  filters?: Record<string, unknown>;
  populate?: string | string[] | Record<string, unknown>;
  fields?: string[];
  locale?: string;
  publicationState?: 'live' | 'preview';
}

/** API request configuration */
export interface ApiRequestConfig {
  params?: StrapiQueryParams;
  headers?: Record<string, string>;
  signal?: AbortSignal;
}
