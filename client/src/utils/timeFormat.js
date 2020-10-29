export function formatDate(timeDateValue) {
  return timeDateValue.toLocaleDateString('en-US', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

export function formatTime(timeDateValue) {
  return timeDateValue.toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function formatDateTime(timeDateValue) {
  return `${formatDate(timeDateValue)} ${formatTime(timeDateValue)}`;
}
