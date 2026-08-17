import { useEffect, useState } from 'react';

import {
  createSuperAdminCategory,
  disableSuperAdminCategory,
  enableSuperAdminCategory,
  getSuperAdminCategories,
  type CategoryItem,
  type CategoryPayload,
} from '../api/superAdminApi';
import {
  EmptyState,
  ErrorState,
  LoadingState,
  PageHeader,
  Panel,
  StatusPill,
} from '../components/SuperAdminUi';

const emptyCategory: CategoryPayload = {
  name: '',
  slug: '',
  description: '',
  iconUrl: '',
  status: 'ACTIVE',
  sortOrder: 100,
};

export function SuperAdminCategoriesPage() {
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [form, setForm] = useState<CategoryPayload>(emptyCategory);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  async function load() {
    setLoading(true);
    setError(false);
    try {
      setCategories((await getSuperAdminCategories()).items);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function createCategory(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage('Creating category...');
    try {
      await createSuperAdminCategory(form);
      setForm(emptyCategory);
      setMessage('Category created successfully.');
      await load();
    } catch {
      setMessage('Unable to create category.');
    }
  }

  async function toggle(category: CategoryItem) {
    const confirmed = window.confirm(`${category.status === 'ACTIVE' ? 'Disable' : 'Enable'} ${category.name}?`);
    if (!confirmed) return;
    if (category.status === 'ACTIVE') await disableSuperAdminCategory(category.id);
    else await enableSuperAdminCategory(category.id);
    setMessage('Category updated successfully.');
    await load();
  }

  if (loading) return <LoadingState label="Loading categories..." />;
  if (error) return <ErrorState onRetry={() => void load()} title="Unable to load categories." />;

  return (
    <>
      <PageHeader
        description="Manage the global marketplace category set. Categories are disabled instead of deleted so old listings stay stable."
        eyebrow="Categories"
        title="Manage Categories"
      />
      <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
        <Panel title="Categories">
          {categories.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[680px] text-left text-sm">
                <thead className="text-xs uppercase tracking-[0.12em] text-[#64748b]">
                  <tr>
                    <th className="py-3">Category</th>
                    <th>Slug</th>
                    <th>Sort</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#edf1f7]">
                  {categories.map((category) => (
                    <tr key={category.id}>
                      <td className="py-3">
                        <p className="font-black text-[#0f2747]">{category.name}</p>
                        <p className="text-xs text-[#64748b]">{category.description ?? 'No description'}</p>
                      </td>
                      <td>{category.slug}</td>
                      <td>{category.sortOrder}</td>
                      <td><StatusPill value={category.status} /></td>
                      <td>
                        <button className="rounded-lg border border-[#d7dfeb] px-3 py-2 text-xs font-black" onClick={() => void toggle(category)} type="button">
                          {category.status === 'ACTIVE' ? 'Disable' : 'Enable'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState>No categories found.</EmptyState>
          )}
        </Panel>
        <Panel title="Add Category">
          <form className="space-y-3" onSubmit={(event) => void createCategory(event)}>
            <CategoryField label="Name" value={form.name} onChange={(value) => setForm({ ...form, name: value })} />
            <CategoryField label="Slug Optional" required={false} value={form.slug ?? ''} onChange={(value) => setForm({ ...form, slug: value })} />
            <CategoryField label="Description Optional" required={false} value={form.description ?? ''} onChange={(value) => setForm({ ...form, description: value })} />
            <label className="block text-sm font-bold text-[#1e2f46]">
              Sort Order
              <input
                className="mt-1 h-11 w-full rounded-xl border border-[#d7dfeb] px-3 outline-none focus:border-rose-600"
                min={0}
                onChange={(event) => setForm({ ...form, sortOrder: Number(event.target.value) })}
                type="number"
                value={form.sortOrder}
              />
            </label>
            <button className="h-11 w-full rounded-xl bg-[#111827] text-sm font-black text-white" type="submit">
              Add Category
            </button>
            {message && <p className="text-sm font-bold text-[#475569]">{message}</p>}
          </form>
        </Panel>
      </div>
    </>
  );
}

function CategoryField({
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
