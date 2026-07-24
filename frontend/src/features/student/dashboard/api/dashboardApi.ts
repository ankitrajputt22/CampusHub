import { apiClient } from '../../../../lib/apiClient';
import type { StudentDashboard } from '../types';

type ApiResponse<T> = {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
};

export async function getStudentDashboard(signal?: AbortSignal) {
  const response = await apiClient.get<ApiResponse<StudentDashboard>>(
    '/student/dashboard',
    { signal },
  );
  return response.data.data;
}
