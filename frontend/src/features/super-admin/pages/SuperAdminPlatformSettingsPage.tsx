import { useEffect, useMemo, useState } from 'react';

import {
  getSuperAdminPlatformSettings,
  updateSuperAdminPlatformSettings,
  type PlatformSetting,
} from '../api/superAdminApi';
import {
  ErrorState,
  LoadingState,
  PageHeader,
  Panel,
  StatusPill,
} from '../components/SuperAdminUi';

export function SuperAdminPlatformSettingsPage() {
  const [settings, setSettings] = useState<PlatformSetting[]>([]);
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  async function load() {
    setLoading(true);
    setError(false);
    try {
      const response = await getSuperAdminPlatformSettings();
      setSettings(response.settings);
      setDraft(
        Object.fromEntries(
          response.settings.map((item) => [item.key, item.value]),
        ),
      );
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const changed = useMemo(() => {
    return Object.fromEntries(
      settings
        .filter((item) => draft[item.key] !== item.value)
        .map((item) => [item.key, draft[item.key] ?? '']),
    );
  }, [draft, settings]);

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (Object.keys(changed).length === 0) {
      setMessage('No settings changed.');
      return;
    }
    const confirmed = window.confirm('Update platform-wide settings?');
    if (!confirmed) return;
    setSaving(true);
    setMessage('Saving platform settings...');
    try {
      const response = await updateSuperAdminPlatformSettings(changed);
      setSettings(response.settings);
      setDraft(
        Object.fromEntries(
          response.settings.map((item) => [item.key, item.value]),
        ),
      );
      setMessage('Platform settings updated successfully.');
    } catch {
      setMessage('Unable to update platform settings.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <LoadingState label="Loading platform settings..." />;
  if (error)
    return (
      <ErrorState
        onRetry={() => void load()}
        title="Unable to load platform settings."
      />
    );

  return (
    <>
      <PageHeader
        description="Control global platform behavior. Sensitive changes require confirmation because they affect every user."
        eyebrow="Settings"
        title="Platform Settings"
      />
      <Panel title="Global Controls">
        <form className="space-y-4" onSubmit={(event) => void save(event)}>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {settings.map((setting) => (
              <label
                className="rounded-xl border border-[#edf1f7] p-4"
                key={setting.key}
              >
                <div className="mb-3 flex items-center justify-between gap-3">
                  <span className="text-sm font-black text-[#09172d]">
                    {labelFor(setting.key)}
                  </span>
                  <StatusPill value={setting.type} />
                </div>
                <p className="mb-3 min-h-10 text-xs font-medium text-[#64748b]">
                  {setting.description}
                </p>
                {setting.type === 'BOOLEAN' ? (
                  <select
                    className="h-11 w-full rounded-xl border border-[#d7dfeb] px-3 text-sm font-bold outline-none focus:border-rose-600"
                    onChange={(event) =>
                      setDraft({ ...draft, [setting.key]: event.target.value })
                    }
                    value={draft[setting.key] ?? setting.value}
                  >
                    <option value="true">Enabled</option>
                    <option value="false">Disabled</option>
                  </select>
                ) : (
                  <input
                    className="h-11 w-full rounded-xl border border-[#d7dfeb] px-3 text-sm font-bold outline-none focus:border-rose-600"
                    onChange={(event) =>
                      setDraft({ ...draft, [setting.key]: event.target.value })
                    }
                    type={setting.type === 'NUMBER' ? 'number' : 'text'}
                    value={draft[setting.key] ?? setting.value}
                  />
                )}
              </label>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <button
              className="rounded-xl bg-[#111827] px-5 py-3 text-sm font-black text-white disabled:opacity-60"
              disabled={saving}
              type="submit"
            >
              {saving ? 'Saving platform settings...' : 'Save Settings'}
            </button>
            {message && (
              <p className="text-sm font-bold text-[#475569]">{message}</p>
            )}
          </div>
        </form>
      </Panel>
    </>
  );
}

function labelFor(key: string) {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (character) => character.toUpperCase());
}
