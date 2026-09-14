import axios, {
  type AxiosInstance,
  type AxiosResponse,
  type AxiosError,
  type InternalAxiosRequestConfig,
} from 'axios';
import { API_URL, API_TIMEOUT_MS, COOKIE_NAMES } from '@/lib/constants';
import type { ApiError, StrapiErrorEnvelope } from '@/types/api.types';

// ─────────────────────────────────────────────────────────────────────────────
// YAHAYASCOOL — Base API Service
// Axios instance with JWT authentication, error normalization, and token refresh
// ─────────────────────────────────────────────────────────────────────────────

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: unknown) => void;
  reject: (reason: unknown) => void;
}> = [];

const processQueue = (error: Error | null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

/** Normalize a Strapi/Axios error into a consistent ApiError object */
export function normalizeError(error: unknown): ApiError {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<StrapiErrorEnvelope>;
    const responseError = axiosError.response?.data?.error;

    if (responseError) {
      return {
        message: responseError.message,
        status: responseError.status,
        code: responseError.name,
        details: responseError.details,
      };
    }

    if (axiosError.response) {
      return {
        message: `Request failed with status ${axiosError.response.status}`,
        status: axiosError.response.status,
      };
    }

    if (axiosError.code === 'ECONNABORTED') {
      return { message: 'Request timed out. Please try again.', status: 408 };
    }

    if (axiosError.message === 'Network Error') {
      return {
        message: 'Unable to connect to the server. Please check your connection.',
        status: 0,
      };
    }
  }

  if (error instanceof Error) {
    return { message: error.message, status: 500 };
  }

  return { message: 'An unexpected error occurred.', status: 500 };
}

/** Get JWT from cookie */
const getToken = (): string | null => {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp(`(^| )${COOKIE_NAMES.JWT}=([^;]+)`));
  return match ? match[2] : null;
};

/** Create the main Axios instance */
const createApiClient = (): AxiosInstance => {
  const instance = axios.create({
    baseURL: API_URL,
    timeout: API_TIMEOUT_MS,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // ── Request Interceptor: Attach JWT and Auto-Locale ──────────────────────
  instance.interceptors.request.use(
    (config: InternalAxiosRequestConfig & { _retryWithoutLocale?: boolean }) => {
      const token = getToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      const isProfileEndpoint = config.url && (
        config.url.startsWith('/teachers') ||
        config.url.startsWith('/students') ||
        config.url.startsWith('/parents') ||
        config.url.startsWith('/workers')
      );

      // Auto-inject locale for Strapi query strings — always wins over default 'en'
      if (typeof window !== 'undefined' && !config._retryWithoutLocale && !isProfileEndpoint) {
        const path = window.location.pathname;
        const match = path.match(/^\/(en|ar|fr|tr)\b/);
        if (match) {
          const currentLocale = match[1];
          // Current URL locale always overrides any default passed in params
          config.params = {
            ...config.params,
            locale: currentLocale,
          };
        }
      }
      return config;
    },
    (error: unknown) => Promise.reject(error)
  );

  // ── Response Interceptor: Handle 401 + Token Refresh ────────────────────
  instance.interceptors.response.use(
    (response: AxiosResponse) => response,
    async (error: AxiosError) => {
      const originalRequest = error.config as InternalAxiosRequestConfig & {
        _retry?: boolean;
        _retryWithoutLocale?: boolean;
      };

      if (error.response?.status === 404 && originalRequest.method === 'get' && originalRequest.params?.locale && !originalRequest._retryWithoutLocale) {
        originalRequest._retryWithoutLocale = true;
        const newParams = { ...originalRequest.params };
        delete newParams.locale;
        originalRequest.params = newParams;
        return instance(originalRequest);
      }

      if (error.response?.status === 401 && !originalRequest._retry) {
        if (isRefreshing) {
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          })
            .then((token) => {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              return instance(originalRequest);
            })
            .catch((err) => Promise.reject(err));
        }

        originalRequest._retry = true;
        isRefreshing = true;

        try {
          // Strapi v5 refresh token is handled via httpOnly cookie automatically
          // by the /api/auth/local/refresh endpoint
          const { data } = await axios.post(
            `${API_URL}/auth/local/refresh`,
            {},
            { withCredentials: true }
          );

          const newToken = data.jwt as string;

          // Update cookie
          document.cookie = `${COOKIE_NAMES.JWT}=${newToken}; path=/; max-age=${7 * 24 * 3600}; SameSite=Lax`;

          processQueue(null, newToken);
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return instance(originalRequest);
        } catch (refreshError) {
          processQueue(refreshError as Error, null);
          // Clear auth state and redirect to login
          document.cookie = `${COOKIE_NAMES.JWT}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
          if (typeof window !== 'undefined') {
            window.location.href = '/login';
          }
          return Promise.reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      }

      return Promise.reject(error);
    }
  );

  return instance;
};

/** Singleton API client instance */
export const apiClient = createApiClient();

/** Upload-specific client (multipart/form-data, no JSON header) */
export const uploadClient = axios.create({
  baseURL: `${API_URL.replace('/api', '')}/api`,
  timeout: 120_000, // 2 minutes for uploads
});

uploadClient.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // Auto-inject locale for upload request parameters
  if (typeof window !== 'undefined') {
    const path = window.location.pathname;
    const match = path.match(/^\/(en|ar|fr|tr)\b/);
    if (match) {
      config.params = {
        locale: match[1],
        ...config.params,
      };
    }
  }
  return config;
});
