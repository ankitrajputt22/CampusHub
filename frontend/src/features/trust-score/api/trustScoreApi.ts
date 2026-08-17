import { apiClient } from '../../../lib/apiClient';

type ApiResponse<T> = { success: boolean; message: string; data: T };

export type TrustScoreBreakdown = {
  verification: number;
  profileCompletion: number;
  marketplaceActivity: number;
  orderCompletion: number;
  reviews: number;
  accountSecurity: number;
  penalties: number;
  totalPositive: number;
  totalDeductions: number;
};

export type TrustScoreDetails = {
  userId: number;
  score: number;
  level: string;
  levelLabel: string;
  breakdown: TrustScoreBreakdown;
  suggestions: string[];
  updatedAt: string;
};

export type TrustScoreHistoryEntry = {
  id: number;
  scoreBefore: number;
  scoreAfter: number;
  change: number;
  reason: string;
  description: string | null;
  sourceType: string | null;
  createdAt: string;
};

export async function getOwnTrustScore() {
  const response =
    await apiClient.get<ApiResponse<TrustScoreDetails>>('/user/trust-score');
  return response.data.data;
}

export async function getOwnTrustScoreHistory() {
  const response = await apiClient.get<
    ApiResponse<{ entries: TrustScoreHistoryEntry[] }>
  >('/user/trust-score/history');
  return response.data.data.entries;
}

export async function getPublicTrustScore(userId: number) {
  const response = await apiClient.get<ApiResponse<TrustScoreDetails>>(
    `/users/${userId}/trust-score/public`,
  );
  return response.data.data;
}

export async function getAdminTrustScore(userId: number) {
  const response = await apiClient.get<ApiResponse<TrustScoreDetails>>(
    `/admin/users/${userId}/trust-score`,
  );
  return response.data.data;
}

export async function recalculateAdminTrustScore(userId: number) {
  const response = await apiClient.post<ApiResponse<TrustScoreDetails>>(
    `/admin/users/${userId}/trust-score/recalculate`,
  );
  return response.data.data;
}
