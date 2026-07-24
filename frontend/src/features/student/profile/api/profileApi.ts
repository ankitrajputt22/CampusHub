import { apiClient } from '../../../../lib/apiClient';
import type {
  ChangePasswordPayload,
  ProfilePhotoResult,
  ProfilePrivacySettings,
  ProfileUpdatePayload,
  StudentProfile,
} from '../types';

type ApiResponse<T> = {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
};

export async function getStudentProfile() {
  const response =
    await apiClient.get<ApiResponse<StudentProfile>>('/user/profile');
  return response.data.data;
}

export async function updateStudentProfile(payload: ProfileUpdatePayload) {
  const response = await apiClient.put<ApiResponse<StudentProfile>>(
    '/user/profile',
    payload,
  );
  return response.data.data;
}

export async function updatePrivacySettings(payload: ProfilePrivacySettings) {
  const response = await apiClient.put<ApiResponse<StudentProfile>>(
    '/user/privacy-settings',
    payload,
  );
  return response.data.data;
}

export async function uploadProfilePhoto(photo: File) {
  const body = new FormData();
  body.append('photo', photo);
  const response = await apiClient.post<ApiResponse<ProfilePhotoResult>>(
    '/user/profile/photo',
    body,
    {
      headers: { 'Content-Type': 'multipart/form-data' },
    },
  );
  return response.data.data;
}

export async function changePassword(payload: ChangePasswordPayload) {
  await apiClient.post('/user/change-password', payload);
}

export async function logoutAllDevices() {
  await apiClient.post('/auth/logout-all-devices');
}

export async function requestAccountDeactivation() {
  await apiClient.post('/user/deactivate-request');
}
