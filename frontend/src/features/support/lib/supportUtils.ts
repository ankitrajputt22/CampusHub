export function supportLabel(value: string) {
  return value
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function formatSupportDate(value: string) {
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

export function supportErrorMessage(error: unknown, fallback: string) {
  if (
    typeof error === 'object' &&
    error !== null &&
    'response' in error &&
    typeof error.response === 'object' &&
    error.response !== null &&
    'data' in error.response
  ) {
    const data = error.response.data;
    if (
      typeof data === 'object' &&
      data !== null &&
      'message' in data &&
      typeof data.message === 'string'
    ) {
      return data.message;
    }
  }
  return fallback;
}

export function validateSupportFiles(files: File[]) {
  if (files.length > 3) return 'You can attach a maximum of 3 files.';
  const allowed = new Set([
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/pdf',
  ]);
  for (const file of files) {
    if (!allowed.has(file.type)) return 'Unsupported attachment type.';
    if (file.size > 5 * 1024 * 1024)
      return 'Attachment file size is too large.';
  }
  return '';
}
