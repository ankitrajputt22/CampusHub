import { beforeEach, describe, expect, it } from 'vitest';

import {
  clearCampusSession,
  getAccessToken,
  getCampusUser,
  getRefreshToken,
  hasStudentSession,
  saveCampusSession,
  setAccessToken,
  updateCampusUser,
  type CampusSession,
} from './session';

const session: CampusSession = {
  accessToken: 'access-one',
  refreshToken: 'refresh-one',
  user: {
    id: 42,
    fullName: 'Ankit Rajput',
    email: 'ankit241011@recmainpuri.in',
    collegeId: 7,
    collegeName: 'Rajkiya Engineering College, Mainpuri',
    role: 'STUDENT',
    accountStatus: 'ACTIVE',
    trustScore: 60,
  },
};

describe('campus session storage', () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });

  it('keeps a non-remembered login in session storage only', () => {
    saveCampusSession(session, false);

    expect(window.localStorage.length).toBe(0);
    expect(window.sessionStorage.length).toBe(3);
    expect(getAccessToken()).toBe('access-one');
    expect(getRefreshToken()).toBe('refresh-one');
    expect(getCampusUser().id).toBe(42);
    expect(hasStudentSession()).toBe(true);

    setAccessToken('access-two');
    updateCampusUser({ trustScore: 80 });
    expect(getAccessToken()).toBe('access-two');
    expect(getCampusUser().trustScore).toBe(80);
    expect(window.localStorage.length).toBe(0);
  });

  it('persists a remembered login and clears both storage locations', () => {
    saveCampusSession(session, true);

    expect(window.localStorage.length).toBe(3);
    expect(window.sessionStorage.length).toBe(0);
    expect(hasStudentSession()).toBe(true);

    clearCampusSession();
    expect(window.localStorage.length).toBe(0);
    expect(window.sessionStorage.length).toBe(0);
    expect(hasStudentSession()).toBe(false);
  });
});
