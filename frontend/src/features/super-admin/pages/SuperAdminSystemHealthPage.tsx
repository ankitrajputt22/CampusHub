import { useEffect, useState } from 'react';

import {
  getSuperAdminSystemHealth,
  type SystemHealth,
} from '../api/superAdminApi';
import {
  ErrorState,
  LoadingState,
  PageHeader,
  Panel,
  StatCard,
  StatusPill,
} from '../components/SuperAdminUi';

export function SuperAdminSystemHealthPage() {
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  async function load() {
    setLoading(true);
    setError(false);
    try {
      setHealth(await getSuperAdminSystemHealth());
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  if (loading) return <LoadingState label="Loading system health..." />;
  if (error || !health) {
    return (
      <ErrorState
        onRetry={() => void load()}
        title="Unable to load system health."
      />
    );
  }

  return (
    <>
      <PageHeader
        action={
          <button
            className="rounded-xl bg-[#111827] px-4 py-3 text-sm font-black text-white"
            onClick={() => void load()}
            type="button"
          >
            Refresh
          </button>
        }
        description="Version 1 health visibility for backend, database, local storage, and payment gateway configuration."
        eyebrow="Health"
        title="System Health"
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Backend" value={health.backendStatus} tone="success" />
        <StatCard
          label="Database"
          value={health.databaseStatus}
          tone="success"
        />
        <StatCard label="Storage" value={health.storageStatus} />
        <StatCard label="Payment Gateway" value={health.paymentGatewayStatus} />
      </div>
      <div className="mt-6">
        <Panel title="Last Health Check">
          <div className="flex items-center justify-between rounded-xl border border-[#edf1f7] p-4">
            <p className="font-bold text-[#09172d]">
              {new Date(health.checkedAt).toLocaleString()}
            </p>
            <StatusPill value={health.backendStatus} />
          </div>
        </Panel>
      </div>
    </>
  );
}
