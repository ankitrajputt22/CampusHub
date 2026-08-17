import axios from 'axios';

import { apiClient } from '../../../lib/apiClient';

const publicSupportClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080/api',
});

export type SupportCategory =
  | 'ACCOUNT'
  | 'SIGNUP_LOGIN'
  | 'OTP_VERIFICATION'
  | 'PROFILE'
  | 'LISTING'
  | 'ORDER'
  | 'PAYMENT'
  | 'REFUND_REQUEST'
  | 'REPORT_MODERATION'
  | 'REVIEW_RATING'
  | 'TECHNICAL_BUG'
  | 'COLLEGE_VERIFICATION'
  | 'SAFETY_CONCERN'
  | 'GENERAL';

export type SupportStatus =
  | 'OPEN'
  | 'IN_PROGRESS'
  | 'WAITING_FOR_USER'
  | 'RESOLVED'
  | 'CLOSED'
  | 'REJECTED'
  | 'SPAM';

export type SupportPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export type SupportRelatedEntityType =
  'LISTING' | 'ORDER' | 'PAYMENT' | 'REPORT' | 'REVIEW' | 'USER' | 'NONE';

export type SupportTicketSummary = {
  id: number;
  ticketNumber: string;
  category: SupportCategory;
  subject: string;
  status: SupportStatus;
  priority: SupportPriority;
  createdAt: string;
  updatedAt: string;
  lastReplyBy: string;
  submittedBy: string;
  userEmail: string;
  collegeName: string | null;
  assignedAdmin: string | null;
};

export type SupportTicketPage = {
  stats: {
    total: number;
    open: number;
    inProgress: number;
    resolved: number;
    closed: number;
  };
  tickets: SupportTicketSummary[];
  pagination: {
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
    hasMore: boolean;
  };
};

export type SupportReply = {
  id: number;
  senderType: 'STUDENT' | 'ADMIN' | 'SYSTEM' | 'GUEST';
  senderName: string;
  message: string;
  internalNote: boolean;
  createdAt: string;
};

export type SupportAttachment = {
  id: number;
  fileName: string;
  fileType: string;
  fileSize: number;
  downloadUrl: string;
  replyId: number | null;
  createdAt: string;
};

export type SupportTicketDetails = {
  id: number;
  ticketNumber: string;
  category: SupportCategory;
  subject: string;
  description: string;
  status: SupportStatus;
  priority: SupportPriority;
  relatedEntityType: SupportRelatedEntityType;
  relatedEntityId: number | null;
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;
  closedAt: string | null;
  submitter: {
    userId: number | null;
    name: string;
    email: string;
    collegeName: string | null;
    guest: boolean;
  };
  assignedAdmin: string | null;
  replies: SupportReply[];
  attachments: SupportAttachment[];
  statusHistory: Array<{
    id: number;
    oldStatus: SupportStatus | null;
    newStatus: SupportStatus;
    changedBy: string | null;
    changedByRole: string;
    note: string | null;
    createdAt: string;
  }>;
};

export type CreateTicketPayload = {
  category: SupportCategory;
  subject: string;
  description: string;
  relatedEntityType: SupportRelatedEntityType;
  relatedEntityId: number | null;
};

type ApiEnvelope<T> = {
  success: boolean;
  message: string;
  data: T;
};

type TicketCreated = {
  id: number;
  ticketNumber: string;
  status: SupportStatus;
  priority: SupportPriority;
  createdAt: string;
};

export const supportCategories: Array<{
  value: SupportCategory;
  label: string;
}> = [
  { value: 'ACCOUNT', label: 'Account Issue' },
  { value: 'SIGNUP_LOGIN', label: 'Signup / Login Issue' },
  { value: 'OTP_VERIFICATION', label: 'OTP Verification Issue' },
  { value: 'PROFILE', label: 'Profile Issue' },
  { value: 'LISTING', label: 'Listing Issue' },
  { value: 'ORDER', label: 'Order Issue' },
  { value: 'PAYMENT', label: 'Payment Issue' },
  { value: 'REFUND_REQUEST', label: 'Refund Request' },
  { value: 'REPORT_MODERATION', label: 'Report / Moderation Issue' },
  { value: 'REVIEW_RATING', label: 'Review / Rating Issue' },
  { value: 'TECHNICAL_BUG', label: 'Technical Bug' },
  { value: 'COLLEGE_VERIFICATION', label: 'College Verification Issue' },
  { value: 'SAFETY_CONCERN', label: 'Safety Concern' },
  { value: 'GENERAL', label: 'General Help' },
];

export async function getSupportTickets(
  params: {
    status?: SupportStatus;
    search?: string;
    page?: number;
    size?: number;
  },
  signal?: AbortSignal,
) {
  const response = await apiClient.get<ApiEnvelope<SupportTicketPage>>(
    '/support/tickets',
    { params, signal },
  );
  return response.data.data;
}

export async function createSupportTicket(
  payload: CreateTicketPayload,
  files: File[],
) {
  const response = await apiClient.post<ApiEnvelope<TicketCreated>>(
    '/support/tickets',
    multipart(payload, files),
    { headers: { 'Content-Type': 'multipart/form-data' } },
  );
  return response.data.data;
}

export async function getSupportTicket(ticketId: number, signal?: AbortSignal) {
  const response = await apiClient.get<ApiEnvelope<SupportTicketDetails>>(
    `/support/tickets/${ticketId}`,
    { signal },
  );
  return response.data.data;
}

export async function replyToSupportTicket(
  ticketId: number,
  message: string,
  files: File[],
) {
  const response = await apiClient.post(
    `/support/tickets/${ticketId}/replies`,
    multipart({ message }, files),
    { headers: { 'Content-Type': 'multipart/form-data' } },
  );
  return response.data;
}

export async function closeSupportTicket(ticketId: number) {
  const response = await apiClient.patch(`/support/tickets/${ticketId}/close`);
  return response.data;
}

export async function submitPublicSupport(
  payload: {
    fullName: string;
    email: string;
    category: SupportCategory;
    subject: string;
    description: string;
  },
  files: File[],
) {
  const response = await publicSupportClient.post<
    ApiEnvelope<{ ticketNumber: string; submittedAt: string }>
  >('/public/support/contact', multipart(payload, files), {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data.data;
}

export async function getAdminSupportTickets(
  params: {
    status?: SupportStatus;
    priority?: SupportPriority;
    category?: SupportCategory;
    search?: string;
    collegeId?: number;
    page?: number;
    size?: number;
  },
  signal?: AbortSignal,
) {
  const response = await apiClient.get<ApiEnvelope<SupportTicketPage>>(
    '/admin/support/tickets',
    { params, signal },
  );
  return response.data.data;
}

export async function getAdminSupportTicket(
  ticketId: number,
  signal?: AbortSignal,
) {
  const response = await apiClient.get<ApiEnvelope<SupportTicketDetails>>(
    `/admin/support/tickets/${ticketId}`,
    { signal },
  );
  return response.data.data;
}

export async function replyToAdminSupportTicket(
  ticketId: number,
  message: string,
  files: File[],
) {
  const response = await apiClient.post(
    `/admin/support/tickets/${ticketId}/replies`,
    multipart({ message }, files),
    { headers: { 'Content-Type': 'multipart/form-data' } },
  );
  return response.data;
}

export async function updateSupportTicketStatus(
  ticketId: number,
  status: SupportStatus,
  note?: string,
) {
  const response = await apiClient.patch(
    `/admin/support/tickets/${ticketId}/status`,
    { status, note: note || null },
  );
  return response.data;
}

export async function addSupportInternalNote(
  ticketId: number,
  message: string,
) {
  const response = await apiClient.post(
    `/admin/support/tickets/${ticketId}/internal-notes`,
    { message },
  );
  return response.data;
}

export async function downloadSupportAttachment(
  attachmentId: number,
  fileName: string,
) {
  const response = await apiClient.get<Blob>(
    `/support/attachments/${attachmentId}`,
    { responseType: 'blob' },
  );
  const url = URL.createObjectURL(response.data);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
}

function multipart(payload: object, files: File[]) {
  const form = new FormData();
  form.append(
    'request',
    new Blob([JSON.stringify(payload)], { type: 'application/json' }),
  );
  files.forEach((file) => form.append('files', file));
  return form;
}
