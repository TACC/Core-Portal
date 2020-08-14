export function applyTimezoneOffset(timeDateValue) {
  return new Date(
    timeDateValue.getTime() - timeDateValue.getTimezoneOffset() * 60000
  );
}

export function formatDate(timeDateValue) {
  return applyTimezoneOffset(timeDateValue).toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'numeric',
    year: 'numeric',
    timeZone: 'America/Chicago'
  });
}

export function formatTime(timeDateValue) {
  return applyTimezoneOffset(timeDateValue).toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Chicago'
  });
}

export function formatDateTime(timeDateValue) {
  return `${formatDate(timeDateValue)} ${formatTime(timeDateValue)}`;
}
