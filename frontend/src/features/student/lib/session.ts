export type CampusUser = {
  id: number;
  fullName: string;
  collegeId: number;
  collegeName: string;
  email: string;
  role: 'STUDENT' | 'ADMIN' | 'SUPER_ADMIN';
  accountStatus: string;
  trustScore: number;
};

export type CampusSession = {
  accessToken: string;
  refreshToken: string;
  user: CampusUser;
};

const ACCESS_TOKEN_KEY = 'campusHub.auth.accessToken';
const REFRESH_TOKEN_KEY = 'campusHub.auth.refreshToken';
const USER_KEY = 'campusHub.auth.user';

const fallbackUser: CampusUser = {
  id: 0,
  fullName: 'Campus Hub Student',
  collegeId: 0,
  collegeName: 'Your verified college',
  email: 'student@college.edu',
  role: 'STUDENT',
  accountStatus: 'ACTIVE',
  trustScore: 30,
};

export function saveCampusSession(session: CampusSession, persistent = true) {
  clearCampusSession();
  const storage = persistent ? window.localStorage : window.sessionStorage;
  storage.setItem(ACCESS_TOKEN_KEY, session.accessToken);
  storage.setItem(REFRESH_TOKEN_KEY, session.refreshToken);
  storage.setItem(USER_KEY, JSON.stringify(session.user));
}

export function updateCampusUser(updates: Partial<CampusUser>) {
  const user = getStoredCampusUser();
  if (!user) return;
  sessionStorageForUser()?.setItem(
    USER_KEY,
    JSON.stringify({ ...user, ...updates }),
  );
}

export function clearCampusSession() {
  for (const storage of [window.localStorage, window.sessionStorage]) {
    storage.removeItem(ACCESS_TOKEN_KEY);
    storage.removeItem(REFRESH_TOKEN_KEY);
    storage.removeItem(USER_KEY);
  }
}

export function getAccessToken() {
  return getSessionValue(ACCESS_TOKEN_KEY);
}

export function setAccessToken(accessToken: string) {
  sessionStorageForUser()?.setItem(ACCESS_TOKEN_KEY, accessToken);
}

export function getRefreshToken() {
  return getSessionValue(REFRESH_TOKEN_KEY);
}

export function hasStudentSession() {
  const user = getStoredCampusUser();
  return Boolean(
    getAccessToken() &&
    getRefreshToken() &&
    user &&
    user.role === 'STUDENT' &&
    user.accountStatus === 'ACTIVE',
  );
}

export function hasAdminSession() {
  const user = getStoredCampusUser();
  return Boolean(
    getAccessToken() &&
    getRefreshToken() &&
    user &&
    (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') &&
    user.accountStatus === 'ACTIVE',
  );
}

export function hasSuperAdminSession() {
  const user = getStoredCampusUser();
  return Boolean(
    getAccessToken() &&
    getRefreshToken() &&
    user &&
    user.role === 'SUPER_ADMIN' &&
    user.accountStatus === 'ACTIVE',
  );
}

export function getCampusUser(): CampusUser {
  return getStoredCampusUser() ?? fallbackUser;
}

function getStoredCampusUser(): CampusUser | null {
  const storedUser = getSessionValue(USER_KEY);
  if (!storedUser) return null;

  try {
    const parsed = JSON.parse(storedUser) as Partial<CampusUser>;
    if (
      typeof parsed.fullName !== 'string' ||
      typeof parsed.email !== 'string' ||
      typeof parsed.collegeName !== 'string'
    ) {
      return null;
    }

    return {
      id: parsed.id ?? fallbackUser.id,
      fullName: parsed.fullName,
      collegeId: parsed.collegeId ?? fallbackUser.collegeId,
      collegeName: parsed.collegeName,
      email: parsed.email,
      role: parsed.role ?? fallbackUser.role,
      accountStatus: parsed.accountStatus ?? fallbackUser.accountStatus,
      trustScore: parsed.trustScore ?? fallbackUser.trustScore,
    };
  } catch {
    return null;
  }
}

function getSessionValue(key: string) {
  return window.sessionStorage.getItem(key) ?? window.localStorage.getItem(key);
}

function sessionStorageForUser(): Storage | null {
  if (window.sessionStorage.getItem(USER_KEY)) return window.sessionStorage;
  if (window.localStorage.getItem(USER_KEY)) return window.localStorage;
  return null;
}
