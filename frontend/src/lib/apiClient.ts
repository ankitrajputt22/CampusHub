import axios from 'axios';
import type { AxiosError, InternalAxiosRequestConfig } from 'axios';

import {
  clearCampusSession,
  getAccessToken,
  getRefreshToken,
  setAccessToken,
} from '../features/student/lib/session';

const baseURL =
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080/api';

export function resolveApiAssetUrl(url?: string | null) {
  if (!url) return null;
  if (/^https?:\/\//i.test(url)) return url;
  try {
    return new URL(url, new URL(baseURL).origin).toString();
  } catch {
    return null;
  }
}

type RetryableRequest = InternalAxiosRequestConfig & {
  _campusHubRetry?: boolean;
};

type RefreshResponse = {
  data: {
    accessToken: string;
  };
};

export const apiClient = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

const sessionClient = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

let refreshRequest: Promise<string> | null = null;

apiClient.interceptors.request.use((config) => {
  const accessToken = getAccessToken();
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const request = error.config as RetryableRequest | undefined;

    if (
      error.response?.status !== 401 ||
      !request ||
      request._campusHubRetry ||
      isSessionEndpoint(request.url)
    ) {
      return Promise.reject(error);
    }

    const refreshToken = getRefreshToken();
    if (!refreshToken) {
      expireSession();
      return Promise.reject(error);
    }

    request._campusHubRetry = true;

    try {
      refreshRequest ??= sessionClient
        .post<RefreshResponse>('/auth/refresh', { refreshToken })
        .then((response) => response.data.data.accessToken)
        .finally(() => {
          refreshRequest = null;
        });

      const accessToken = await refreshRequest;
      setAccessToken(accessToken);
      request.headers.Authorization = `Bearer ${accessToken}`;
      return apiClient(request);
    } catch {
      expireSession();
      return Promise.reject(error);
    }
  },
);

function isSessionEndpoint(url?: string) {
  return Boolean(
    url?.includes('/auth/login') ||
    url?.includes('/auth/refresh') ||
    url?.includes('/auth/logout'),
  );
}

function expireSession() {
  clearCampusSession();
  window.dispatchEvent(new Event('campusHub:session-expired'));
}
