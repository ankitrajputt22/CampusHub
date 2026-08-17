import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import {
  blockSuperAdminCollege,
  createSuperAdminCollege,
  deactivateSuperAdminCollege,
  getSuperAdminColleges,
  type CollegeItem,
  type CollegePayload,
} from '../api/superAdminApi';
import {
  EmptyState,
  ErrorState,
  LoadingState,
  PageHeader,
  Panel,
  StatusPill,
} from '../components/SuperAdminUi';

const emptyCollege: CollegePayload = {
  collegeName: '',
  collegeCode: '',
  emailDomain: '',
  city: '',
  state: '',
  country: 'India',
  description: '',
  status: 'ACTIVE',
};

export function SuperAdminCollegesPage() {
  const [colleges, setColleges] = useState<CollegeItem[]>([]);
  const [form, setForm] = useState<CollegePayload>(emptyCollege);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  async function load() {
    setLoading(true);
    setError(false);
    try {
      setColleges((await getSuperAdminColleges()).items);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function createCollege(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage('Creating college...');
    try {
      await createSuperAdminCollege(form);
      setForm(emptyCollege);
      setMessage('College created successfully.');
      await load();
    } catch {
      setMessage('Unable to create college.');
    }
  }

  async function changeStatus(college: CollegeItem, action: 'inactive' | 'blocked') {
    const confirmed = window.confirm(`${action === 'blocked' ? 'Block' : 'Mark inactive'} ${college.name}?`);
    if (!confirmed) return;
    if (action === 'blocked') await blockSuperAdminCollege(college.id);
    else await deactivateSuperAdminCollege(college.id);
    setMessage(action === 'blocked' ? 'College blocked successfully.' : 'College updated successfully.');
    await load();
  }

  if (loading) return <LoadingState label="Loading colleges..." />;
  if (error) return <ErrorState onRetry={() => void load()} title="Unable to load colleges." />;

  return (
    <>
      <PageHeader
        description="Manage signup-ready colleges, marketplace availability, and campus status without deleting existing users."
        eyebrow="Colleges"
        title="Manage Colleges"
      />
      <div className="grid gap-5 xl:grid-cols-[1fr_400px]">
        <Panel title="Colleges">
          {colleges.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[820px] text-left text-sm">
                <thead className="text-xs uppercase tracking-[0.12em] text-[#64748b]">
                  <tr>
                    <th className="py-3">College</th>
                    <th>Location</th>
                    <th>Domain</th>
                    <th>Students</th>
                    <th>Listings</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#edf1f7]">
                  {colleges.map((college) => (
                    <tr key={college.id}>
                      <td className="py-3">
                        <Link className="font-black text-[#0f2747]" to={`/super-admin/colleges/${college.id}`}>
                          {college.name}
                        </Link>
                        <p className="text-xs text-[#64748b]">{college.code}</p>
                      </td>
                      <td>{college.city}, {college.state}</td>
                      <td>{college.emailDomain ?? 'Optional'}</td>
                      <td>{college.verifiedStudentsCount}</td>
                      <td>{college.activeListingsCount}</td>
                      <td><StatusPill value={college.status} /></td>
                      <td className="space-x-2">
                        <button className="rounded-lg border border-[#d7dfeb] px-3 py-2 text-xs font-black" onClick={() => void changeStatus(college, 'inactive')} type="button">
                          Inactive
                        </button>
                        <button className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-black text-rose-700" onClick={() => void changeStatus(college, 'blocked')} type="button">
                          Block
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState>No colleges found.</EmptyState>
          )}
        </Panel>
        <Panel title="Add College">
          <form className="space-y-3" onSubmit={(event) => void createCollege(event)}>
            <CollegeField label="College Name" value={form.collegeName} onChange={(value) => setForm({ ...form, collegeName: value })} />
            <CollegeField label="College Code" value={form.collegeCode} onChange={(value) => setForm({ ...form, collegeCode: value.toUpperCase() })} />
            <CollegeField label="Email Domain Optional" required={false} value={form.emailDomain ?? ''} onChange={(value) => setForm({ ...form, emailDomain: value })} />
            <CollegeField label="City" value={form.city} onChange={(value) => setForm({ ...form, city: value })} />
            <CollegeField label="State" value={form.state} onChange={(value) => setForm({ ...form, state: value })} />
            <CollegeField label="Country" value={form.country} onChange={(value) => setForm({ ...form, country: value })} />
            <button className="h-11 w-full rounded-xl bg-[#111827] text-sm font-black text-white" type="submit">
              Add College
            </button>
            {message && <p className="text-sm font-bold text-[#475569]">{message}</p>}
          </form>
        </Panel>
      </div>
    </>
  );
}

function CollegeField({
  label,
  value,
  onChange,
  required = true,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}) {
  return (
    <label className="block text-sm font-bold text-[#1e2f46]">
      {label}
      <input
        className="mt-1 h-11 w-full rounded-xl border border-[#d7dfeb] px-3 outline-none focus:border-rose-600"
        onChange={(event) => onChange(event.target.value)}
        required={required}
        value={value}
      />
    </label>
  );
}
