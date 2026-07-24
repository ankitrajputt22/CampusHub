import { CheckCircle2, Circle, Lightbulb } from 'lucide-react';
import { Link } from 'react-router-dom';

import { formatRelativeTime } from '../lib/format';
import type { StudentDashboard } from '../types';

export function DashboardSummaryPanel({
  dashboard,
}: {
  dashboard: StudentDashboard;
}) {
  const missing = new Set(dashboard.profileCompletion.missingFields);
  const trustColor = trustRingColor(dashboard.trustScore.score);
  const tip =
    dashboard.trustScore.suggestions[0] ??
    'Keep trading safely and communicate clearly with other students.';

  const profileItems = [
    {
      label: 'University ID Verified',
      completed: !missing.has('verifiedEmail'),
    },
    {
      label: 'Contact Information',
      completed: !missing.has('verifiedEmail') && !missing.has('verifiedPhone'),
    },
    { label: 'Profile Photo', completed: !missing.has('profilePhoto') },
    { label: 'Short Student Bio', completed: !missing.has('bio') },
    {
      label: 'LinkedIn or GitHub',
      completed: !missing.has('linkedinUrl') || !missing.has('githubUrl'),
    },
  ];

  return (
    <aside className="min-w-0 space-y-8 xl:sticky xl:top-[96px] xl:self-start">
      <section className="rounded-2xl border border-[#c5c6cf] bg-white p-6 text-center shadow-[0_4px_12px_rgba(3,22,53,0.05)]">
        <h2 className="text-xs font-bold uppercase tracking-[0.14em] text-[#44474e]">
          Campus Trust Score
        </h2>
        <div
          aria-label={`Campus Trust Score ${dashboard.trustScore.score} out of 100`}
          className="mx-auto mt-5 flex h-32 w-32 items-center justify-center rounded-full"
          role="img"
          style={{
            background: `conic-gradient(${trustColor} ${dashboard.trustScore.score * 3.6}deg, #edf2ff 0deg)`,
          }}
        >
          <div className="flex h-[108px] w-[108px] flex-col items-center justify-center rounded-full bg-white">
            <span className="font-display text-3xl font-extrabold text-[#031635]">
              {dashboard.trustScore.score}
            </span>
            <span className="text-[10px] font-bold uppercase text-[#5d6470]">
              / 100
            </span>
          </div>
        </div>
        <p className="mt-5 font-display text-base font-bold text-[#031635]">
          Level: {dashboard.trustScore.level}
        </p>
        <p className="mx-auto mt-2 max-w-60 text-sm leading-5 text-[#5d6470]">
          {trustMessage(dashboard.trustScore.score)}
        </p>
        <div className="mt-5 rounded-xl border border-[#c5c6cf] bg-[#eff4ff] p-3 text-left">
          <p className="flex items-center gap-1.5 text-xs font-bold text-[#00677f]">
            <Lightbulb aria-hidden="true" className="h-4 w-4" />
            Quick Tip
          </p>
          <p className="mt-2 text-sm leading-5 text-[#44474e]">{tip}</p>
        </div>
      </section>

      <section>
        <div className="flex items-end justify-between gap-4">
          <h2 className="text-xs font-bold uppercase tracking-[0.14em] text-[#44474e]">
            Profile Completion
          </h2>
          <span className="font-display text-xl font-extrabold text-[#031635]">
            {dashboard.profileCompletion.percentage}%
          </span>
        </div>
        <div
          aria-label={`${dashboard.profileCompletion.percentage}% profile completion`}
          aria-valuemax={100}
          aria-valuemin={0}
          aria-valuenow={dashboard.profileCompletion.percentage}
          className="mt-4 h-2 overflow-hidden rounded-full bg-[#edf2ff]"
          role="progressbar"
        >
          <div
            className="h-full rounded-full bg-[#00677f] transition-[width] duration-500"
            style={{ width: `${dashboard.profileCompletion.percentage}%` }}
          />
        </div>
        <ul className="mt-5 space-y-3">
          {profileItems.map((item) => (
            <li
              className={`flex items-center gap-2 text-sm ${item.completed ? 'text-[#0b1c30]' : 'text-[#68707d]'}`}
              key={item.label}
            >
              {item.completed ? (
                <CheckCircle2
                  aria-hidden="true"
                  className="h-[18px] w-[18px] text-[#00875f]"
                />
              ) : (
                <Circle
                  aria-hidden="true"
                  className="h-[18px] w-[18px] text-[#c5c6cf]"
                />
              )}
              {item.label}
            </li>
          ))}
        </ul>
        <Link
          className="mt-6 flex h-12 w-full items-center justify-center rounded-xl bg-[#031635] text-sm font-bold text-white hover:bg-[#1a2b4b]"
          to="/student/profile"
        >
          Complete Profile
        </Link>
      </section>

      <section>
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xs font-bold uppercase tracking-[0.14em] text-[#44474e]">
            Notifications
          </h2>
          {dashboard.stats.unreadNotifications > 0 && (
            <span className="rounded-full bg-[#ba1a1a] px-2 py-1 text-[10px] font-bold text-white">
              {dashboard.stats.unreadNotifications} New
            </span>
          )}
        </div>
        {dashboard.notifications.length > 0 ? (
          <div className="mt-4 space-y-1">
            {dashboard.notifications.slice(0, 3).map((notification) => (
              <Link
                className="flex gap-3 rounded-lg p-2.5 hover:bg-[#eff4ff]"
                key={notification.id}
                to="/student/notifications"
              >
                <span
                  className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${notification.isRead ? 'bg-[#c5c6cf]' : 'bg-[#ba1a1a]'}`}
                />
                <span className="min-w-0">
                  <span
                    className={`block text-sm ${notification.isRead ? 'font-medium text-[#44474e]' : 'font-bold text-[#0b1c30]'}`}
                  >
                    {notification.title}
                  </span>
                  <span className="mt-1 line-clamp-2 block text-xs leading-5 text-[#5d6470]">
                    {notification.message}
                  </span>
                  <span className="mt-1 block text-[11px] text-[#8a8e97]">
                    {formatRelativeTime(notification.createdAt)}
                  </span>
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <p className="mt-4 rounded-lg border border-dashed border-[#c5c6cf] px-4 py-6 text-center text-sm text-[#68707d]">
            No new notifications.
          </p>
        )}
        <Link
          className="mt-3 inline-flex text-sm font-semibold text-[#00677f] hover:underline"
          to="/student/notifications"
        >
          View all notifications
        </Link>
      </section>
    </aside>
  );
}

function trustRingColor(score: number) {
  if (score <= 40) return '#ba1a1a';
  if (score <= 70) return '#b86e00';
  return '#00875f';
}

function trustMessage(score: number) {
  if (score <= 40) {
    return "You're just getting started. Complete your profile to build trust.";
  }
  if (score <= 70) {
    return 'Your campus reputation is growing. Keep transactions reliable.';
  }
  return 'Students can see that you have a strong campus reputation.';
}
