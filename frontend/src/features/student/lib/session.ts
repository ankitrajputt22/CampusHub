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

export function saveCampusSession(session: CampusSession) {
  window.localStorage.setItem(ACCESS_TOKEN_KEY, session.accessToken);
  window.localStorage.setItem(REFRESH_TOKEN_KEY, session.refreshToken);
  window.localStorage.setItem(USER_KEY, JSON.stringify(session.user));
}

export function updateCampusUser(updates: Partial<CampusUser>) {
  const user = getStoredCampusUser();
  if (!user) return;
  window.localStorage.setItem(
    USER_KEY,
    JSON.stringify({ ...user, ...updates }),
  );
}

export function clearCampusSession() {
  window.localStorage.removeItem(ACCESS_TOKEN_KEY);
  window.localStorage.removeItem(REFRESH_TOKEN_KEY);
  window.localStorage.removeItem(USER_KEY);
}

export function getAccessToken() {
  return window.localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function setAccessToken(accessToken: string) {
  window.localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
}

export function getRefreshToken() {
  return window.localStorage.getItem(REFRESH_TOKEN_KEY);
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

export function getCampusUser(): CampusUser {
  return getStoredCampusUser() ?? fallbackUser;
}

function getStoredCampusUser(): CampusUser | null {
  const storedUser = window.localStorage.getItem(USER_KEY);
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
