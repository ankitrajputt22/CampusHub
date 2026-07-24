import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

import { getApiErrorMessage } from '../../../auth/api/authApi';
import { updateCampusUser } from '../../lib/session';
import { getStudentDashboard } from '../api/dashboardApi';
import type { StudentDashboard } from '../types';
import { StudentDashboardContext } from './studentDashboardContext';

export function StudentDashboardProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [data, setData] = useState<StudentDashboard | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setError('');
    try {
      const dashboard = await getStudentDashboard(signal);
      setData(dashboard);
      updateCampusUser({
        id: dashboard.user.id,
        fullName: dashboard.user.fullName,
        email: dashboard.user.email,
        collegeId: dashboard.user.collegeId,
        collegeName: dashboard.user.collegeName,
        role: dashboard.user.role,
        accountStatus: dashboard.user.accountStatus,
        trustScore: dashboard.trustScore.score,
      });
    } catch (requestError) {
      if (signal?.aborted) return;
      setError(getApiErrorMessage(requestError));
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void refresh(controller.signal);
    return () => controller.abort();
  }, [refresh]);

  const value = useMemo(
    () => ({
      data,
      error,
      loading,
      refresh: () => refresh(),
    }),
    [data, error, loading, refresh],
  );

  return (
    <StudentDashboardContext.Provider value={value}>
      {children}
    </StudentDashboardContext.Provider>
  );
}
