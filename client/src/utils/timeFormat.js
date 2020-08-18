export function applyTimezoneOffset(timeDateValue) {
  /*
    For Aloe ISO timestamps that incorrectly add a timezone offset
    but keep the UTC time, it is necessary to subtract
    that timezone offset to determine the correct time
  */
  return new Date(
    timeDateValue.getTime() - timeDateValue.getTimezoneOffset() * 60000
  );
}

export function formatDate(timeDateValue) {
  return timeDateValue.toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'numeric',
    year: 'numeric',
    timeZone: 'America/Chicago'
  });
}

export function formatTime(timeDateValue) {
  return timeDateValue.toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Chicago'
  });
}

export function formatDateTime(timeDateValue) {
  return `${formatDate(timeDateValue)} ${formatTime(timeDateValue)}`;
}
