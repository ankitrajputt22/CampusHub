import {
  Camera,
  Check,
  Github,
  Linkedin,
  LockKeyhole,
  MailCheck,
  Phone,
  Save,
  ShieldCheck,
  UserRound,
} from 'lucide-react';
import { useState } from 'react';

import { PageHeader } from '../components/StudentUi';
import { getCampusUser } from '../lib/session';

const inputClass =
  'h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-cyan-600 focus:ring-2 focus:ring-cyan-100 disabled:bg-slate-100 disabled:text-slate-500';

export function ProfilePage() {
  const user = getCampusUser();
  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState(false);

  return (
    <div className="space-y-6">
      <PageHeader
        action={
          <button
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#071b33] px-4 text-sm font-semibold text-white"
            onClick={() => {
              if (editing) setSaved(true);
              setEditing((current) => !current);
            }}
            type="button"
          >
            {editing ? (
              <>
                <Save aria-hidden="true" className="h-4 w-4" />
                Save profile
              </>
            ) : (
              'Edit profile'
            )}
          </button>
        }
        description="Keep your academic identity and public seller profile accurate."
        eyebrow="Your account"
        title="Profile"
      />
      {saved && (
        <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm font-semibold text-emerald-800">
          <Check aria-hidden="true" className="h-4 w-4" />
          Profile changes saved locally for testing.
        </div>
      )}
      <section className="grid gap-6 xl:grid-cols-[300px_1fr]">
        <aside className="space-y-4">
          <article className="rounded-lg border border-slate-200 bg-white p-5 text-center shadow-sm">
            <div className="relative mx-auto h-24 w-24">
              <span className="flex h-full w-full items-center justify-center rounded-lg bg-cyan-100 text-2xl font-black text-cyan-800">
                AR
              </span>
              <button
                aria-label="Update profile photo"
                className="absolute -bottom-2 -right-2 flex h-9 w-9 items-center justify-center rounded-lg border-2 border-white bg-[#071b33] text-white"
                title="Update profile photo"
                type="button"
              >
                <Camera aria-hidden="true" className="h-4 w-4" />
              </button>
            </div>
            <h2 className="mt-5 text-lg font-bold text-slate-950">
              {user.fullName}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Computer Science · 3rd year
            </p>
            <div className="mt-5 rounded-lg bg-cyan-50 p-4">
              <p className="text-sm font-semibold text-cyan-900">
                Campus Trust Score
              </p>
              <p className="mt-1 text-3xl font-black text-cyan-900">
                {user.trustScore}
                <span className="text-sm font-medium">/100</span>
              </p>
            </div>
          </article>
          <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="font-bold text-slate-950">Account signals</h2>
            <div className="mt-4 space-y-3 text-sm">
              <Signal icon={MailCheck} label="College email verified" />
              <Signal icon={Phone} label="Phone verified" />
              <Signal icon={ShieldCheck} label="2 successful deals" />
            </div>
          </article>
        </aside>
        <form
          className="space-y-7 rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
          onSubmit={(event) => event.preventDefault()}
        >
          <ProfileSection title="Personal details">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Full name">
                <input
                  className={inputClass}
                  defaultValue={user.fullName}
                  disabled={!editing}
                />
              </Field>
              <Field label="Phone number">
                <input
                  className={inputClass}
                  defaultValue="+91 98765 43210"
                  disabled={!editing}
                />
              </Field>
            </div>
            <Field label="Bio">
              <textarea
                className={`${inputClass} min-h-24 py-3`}
                defaultValue="Computer Science student interested in practical tech and useful campus projects."
                disabled={!editing}
              />
            </Field>
          </ProfileSection>
          <ProfileSection title="Academic identity">
            <Field label="College">
              <input
                className={inputClass}
                defaultValue={user.collegeName}
                disabled
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="College email">
                <input
                  className={inputClass}
                  defaultValue={user.email}
                  disabled
                />
              </Field>
              <Field label="Department">
                <input
                  className={inputClass}
                  defaultValue="Computer Science and Engineering"
                  disabled={!editing}
                />
              </Field>
              <Field label="Course">
                <input
                  className={inputClass}
                  defaultValue="Bachelor of Technology"
                  disabled={!editing}
                />
              </Field>
              <Field label="Year of study">
                <select
                  className={inputClass}
                  defaultValue="Third year"
                  disabled={!editing}
                >
                  <option>First year</option>
                  <option>Second year</option>
                  <option>Third year</option>
                  <option>Fourth year</option>
                </select>
              </Field>
              <Field label="Hostel / campus area">
                <input
                  className={inputClass}
                  defaultValue="Boys Hostel, Block B"
                  disabled={!editing}
                />
              </Field>
            </div>
          </ProfileSection>
          <ProfileSection title="Links">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field icon={Linkedin} label="LinkedIn">
                <input
                  className={inputClass}
                  defaultValue="linkedin.com/in/ankit"
                  disabled={!editing}
                />
              </Field>
              <Field icon={Github} label="GitHub">
                <input
                  className={inputClass}
                  defaultValue="github.com/ankit"
                  disabled={!editing}
                />
              </Field>
            </div>
          </ProfileSection>
        </form>
      </section>
    </div>
  );
}

export function SettingsPage() {
  const [settings, setSettings] = useState({
    order: true,
    wishlist: true,
    messages: true,
    marketing: false,
    publicProfile: true,
  });
  return (
    <div className="space-y-6">
      <PageHeader
        description="Control notifications, visibility, and account security preferences."
        eyebrow="Preferences"
        title="Settings"
      />
      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <section className="divide-y divide-slate-100 rounded-lg border border-slate-200 bg-white shadow-sm">
          <SettingToggle
            checked={settings.order}
            description="Pickup changes, cancellations, and completed handovers."
            label="Order updates"
            onChange={(checked) => setSettings({ ...settings, order: checked })}
          />
          <SettingToggle
            checked={settings.wishlist}
            description="Availability and status changes for saved items."
            label="Wishlist alerts"
            onChange={(checked) =>
              setSettings({ ...settings, wishlist: checked })
            }
          />
          <SettingToggle
            checked={settings.messages}
            description="New messages from verified buyers and sellers."
            label="Chat notifications"
            onChange={(checked) =>
              setSettings({ ...settings, messages: checked })
            }
          />
          <SettingToggle
            checked={settings.marketing}
            description="Occasional product updates and campus campaigns."
            label="Campus Hub news"
            onChange={(checked) =>
              setSettings({ ...settings, marketing: checked })
            }
          />
          <SettingToggle
            checked={settings.publicProfile}
            description="Let verified students view seller reputation and public details."
            label="Public seller profile"
            onChange={(checked) =>
              setSettings({ ...settings, publicProfile: checked })
            }
          />
        </section>
        <aside className="space-y-4">
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-50 text-cyan-800">
              <LockKeyhole aria-hidden="true" className="h-5 w-5" />
            </span>
            <h2 className="mt-4 font-bold text-slate-950">
              Password and security
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Review your password and signed-in sessions.
            </p>
            <button
              className="mt-4 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-800"
              type="button"
            >
              Change password
            </button>
          </div>
          <div className="rounded-lg border border-red-200 bg-red-50 p-5">
            <h2 className="font-bold text-red-900">Deactivate account</h2>
            <p className="mt-2 text-sm leading-6 text-red-800">
              Your listings will become inactive while the request is reviewed.
            </p>
            <button
              className="mt-4 text-sm font-semibold text-red-800 underline"
              type="button"
            >
              Request deactivation
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Field({
  label,
  icon: Icon,
  children,
}: {
  label: string;
  icon?: typeof UserRound;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-800">
        {Icon && <Icon aria-hidden="true" className="h-4 w-4 text-slate-400" />}
        {label}
      </span>
      {children}
    </label>
  );
}
function ProfileSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4">
      <h2 className="border-b border-slate-100 pb-3 text-lg font-bold text-slate-950">
        {title}
      </h2>
      {children}
    </section>
  );
}
function Signal({ icon: Icon, label }: { icon: typeof Phone; label: string }) {
  return (
    <p className="flex items-center gap-2 text-slate-600">
      <Icon aria-hidden="true" className="h-4 w-4 text-emerald-600" />
      {label}
    </p>
  );
}
function SettingToggle({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-5 p-5">
      <span>
        <span className="block font-semibold text-slate-900">{label}</span>
        <span className="mt-1 block text-sm leading-6 text-slate-500">
          {description}
        </span>
      </span>
      <input
        checked={checked}
        className="peer sr-only"
        onChange={(event) => onChange(event.target.checked)}
        type="checkbox"
      />
      <span className="relative h-6 w-11 shrink-0 rounded-full bg-slate-300 transition peer-checked:bg-cyan-700 after:absolute after:left-1 after:top-1 after:h-4 after:w-4 after:rounded-full after:bg-white after:transition peer-checked:after:translate-x-5" />
    </label>
  );
}
