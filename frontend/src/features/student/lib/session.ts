export type CampusUser = {
  fullName: string;
  collegeName: string;
  email: string;
  trustScore: number;
};

const fallbackUser: CampusUser = {
  fullName: 'Ankit Rajput',
  collegeName: 'Rajkiya Engineering College, Bijnor',
  email: 'student@recb.ac.in',
  trustScore: 30,
};

export function getCampusUser(): CampusUser {
  const storedUser = window.localStorage.getItem('campusHub.auth.user');

  if (!storedUser) {
    return fallbackUser;
  }

  try {
    const parsed = JSON.parse(storedUser) as Partial<CampusUser>;
    return {
      fullName: parsed.fullName ?? fallbackUser.fullName,
      collegeName: parsed.collegeName ?? fallbackUser.collegeName,
      email: parsed.email ?? fallbackUser.email,
      trustScore: parsed.trustScore ?? fallbackUser.trustScore,
    };
  } catch {
    return fallbackUser;
  }
}
