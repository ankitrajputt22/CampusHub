import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import {
  createSuperAdminAdmin,
  getSuperAdminAdmins,
  reactivateSuperAdminAdmin,
  suspendSuperAdminAdmin,
  type AdminItem,
} from '../api/superAdminApi';
import {
  EmptyState,
  ErrorState,
  LoadingState,
  PageHeader,
  Panel,
  StatusPill,
} from '../components/SuperAdminUi';

export function SuperAdminAdminsPage() {
  const [admins, setAdmins] = useState<AdminItem[]>([]);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ fullName: '', email: '', username: '' });
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  async function load() {
    setLoading(true);
    setError(false);
    try {
      setAdmins((await getSuperAdminAdmins(search ? { search } : undefined)).items);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function createAdmin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage('Creating admin...');
    try {
      await createSuperAdminAdmin(form);
      setForm({ fullName: '', email: '', username: '' });
      setMessage('Admin created successfully.');
      await load();
    } catch {
      setMessage('Unable to create admin.');
    }
  }

  async function toggle(admin: AdminItem) {
    const confirmed = window.confirm(
      admin.status === 'ACTIVE'
        ? `Suspend ${admin.fullName}?`
        : `Reactivate ${admin.fullName}?`,
    );
    if (!confirmed) return;
    if (admin.status === 'ACTIVE') {
      await suspendSuperAdminAdmin(admin.id);
      setMessage('Admin suspended successfully.');
    } else {
      await reactivateSuperAdminAdmin(admin.id);
      setMessage('Admin reactivated successfully.');
    }
    await load();
  }

  if (loading) return <LoadingState label="Loading admins..." />;
  if (error) return <ErrorState onRetry={() => void load()} title="Unable to load admins." />;

  return (
    <>
      <PageHeader
        action={
          <form className="flex gap-2" onSubmit={(event) => { event.preventDefault(); void load(); }}>
            <input
              className="h-11 rounded-xl border border-[#d7dfeb] px-4 text-sm font-semibold outline-none focus:border-rose-600"
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search admins"
              value={search}
            />
            <button className="rounded-xl bg-[#111827] px-4 text-sm font-black text-white" type="submit">
              Search
            </button>
          </form>
        }
        description="Create and manage platform admins without exposing passwords or Super Admin controls."
        eyebrow="Access"
        title="Manage Admins"
      />
      <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
        <Panel title="Admins">
          {admins.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="text-xs uppercase tracking-[0.12em] text-[#64748b]">
                  <tr>
                    <th className="py-3">Admin</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Created By</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#edf1f7]">
                  {admins.map((admin) => (
                    <tr key={admin.id}>
                      <td className="py-3">
                        <Link className="font-black text-[#0f2747]" to={`/super-admin/admins/${admin.id}`}>
                          {admin.fullName}
                        </Link>
                        <p className="text-xs text-[#64748b]">@{admin.username}</p>
                      </td>
                      <td>{admin.email}</td>
                      <td>{admin.role.replace('_', ' ')}</td>
                      <td><StatusPill value={admin.status} /></td>
                      <td>{admin.createdByName ?? 'System'}</td>
                      <td>
                        {admin.role !== 'SUPER_ADMIN' && (
                          <button
                            className="rounded-lg border border-[#d7dfeb] px-3 py-2 text-xs font-black"
                            onClick={() => void toggle(admin)}
                            type="button"
                          >
                            {admin.status === 'ACTIVE' ? 'Suspend' : 'Reactivate'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState>No admins found.</EmptyState>
          )}
        </Panel>
        <Panel title="Create Admin">
          <form className="space-y-3" onSubmit={(event) => void createAdmin(event)}>
            <Field label="Full Name" value={form.fullName} onChange={(value) => setForm({ ...form, fullName: value })} />
            <Field label="Email" type="email" value={form.email} onChange={(value) => setForm({ ...form, email: value })} />
            <Field label="Username" value={form.username} onChange={(value) => setForm({ ...form, username: value })} />
            <button className="h-11 w-full rounded-xl bg-[#111827] text-sm font-black text-white" type="submit">
              Create Admin
            </button>
            {message && <p className="text-sm font-bold text-[#475569]">{message}</p>}
          </form>
        </Panel>
      </div>
    </>
  );
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <label className="block text-sm font-bold text-[#1e2f46]">
      {label}
      <input
        className="mt-1 h-11 w-full rounded-xl border border-[#d7dfeb] px-3 outline-none focus:border-rose-600"
        onChange={(event) => onChange(event.target.value)}
        required
        type={type}
        value={value}
      />
    </label>
  );
}
