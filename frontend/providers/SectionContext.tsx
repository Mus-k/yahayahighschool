'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import { apiClient } from '@/services/api.service';

// ─────────────────────────────────────────────────────────────────────────────
// YAHAYASCOOL — Section (Academic Workspace) Context
// Provides the currently active Academic Section to all child pages.
// The [sectionId] layout fetches the section once and exposes it here.
// ─────────────────────────────────────────────────────────────────────────────

export interface SectionData {
  id: number;
  documentId: string;
  name: string;
  code: string;
  color?: string;
  icon?: string;
  sectionType?: string;
  capacity?: number;
  description?: string;
  active?: boolean;
  academicHead?: { id: number; documentId: string; name?: string; displayName?: string; schoolId?: string };
  academicYear?: { id: number; documentId: string; name: string; code: string };
  department?: { id: number; name: string };
  program?: { id: number; name: string };
  gradeLevels?: Array<{ id: number; documentId: string; name: string; code: string; order: number }>;
}

interface SectionContextValue {
  section: SectionData | null;
  isLoading: boolean;
  error: string | null;
  reload: () => void;
}

const SectionContext = createContext<SectionContextValue>({
  section: null,
  isLoading: true,
  error: null,
  reload: () => {},
});

interface SectionProviderProps {
  children: ReactNode;
  sectionId: string; // documentId from URL param
}

export function SectionProvider({ children, sectionId }: SectionProviderProps) {
  const [section, setSection] = useState<SectionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSection = useCallback(async () => {
    if (!sectionId) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await apiClient.get(`/sections/${sectionId}`, {
        params: {
          populate: [
            'academicHead',
            'academicYear',
            'department',
            'program',
            'gradeLevels',
          ],
        },
      });
      setSection(res.data?.data ?? null);
    } catch (err) {
      console.error('[SectionContext] Failed to load section:', err);
      setError('Failed to load section data.');
    } finally {
      setIsLoading(false);
    }
  }, [sectionId]);

  useEffect(() => {
    fetchSection();
  }, [fetchSection]);

  return (
    <SectionContext.Provider value={{ section, isLoading, error, reload: fetchSection }}>
      {children}
    </SectionContext.Provider>
  );
}

export function useSection(): SectionContextValue {
  return useContext(SectionContext);
}
