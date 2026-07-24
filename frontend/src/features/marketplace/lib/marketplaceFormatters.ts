export function conditionLabel(condition: string) {
  return condition
    .toLowerCase()
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function formatPrice(price: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(price);
}

export function relativeTime(createdAt: string) {
  const elapsedSeconds = Math.max(
    0,
    Math.round((Date.now() - new Date(createdAt).getTime()) / 1000),
  );
  if (elapsedSeconds < 60) return 'Just now';
  if (elapsedSeconds < 3600)
    return `${Math.floor(elapsedSeconds / 60)} min ago`;
  if (elapsedSeconds < 86400)
    return `${Math.floor(elapsedSeconds / 3600)} hr ago`;
  const days = Math.floor(elapsedSeconds / 86400);
  return days === 1 ? 'Yesterday' : `${days} days ago`;
}
