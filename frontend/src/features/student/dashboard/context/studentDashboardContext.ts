import { createContext, useContext } from 'react';

import type { StudentDashboard } from '../types';

export type StudentDashboardContextValue = {
  data: StudentDashboard | null;
  error: string;
  loading: boolean;
  refresh: () => Promise<void>;
};

export const StudentDashboardContext =
  createContext<StudentDashboardContextValue | null>(null);

export function useStudentDashboard() {
  const context = useContext(StudentDashboardContext);
  if (!context) {
    throw new Error(
      'useStudentDashboard must be used inside StudentDashboardProvider.',
    );
  }
  return context;
}
