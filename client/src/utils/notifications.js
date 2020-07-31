export function getNumberOfUnreadNotifications(notifications) {
  return (
    notifications.filter(n => !n.read && n.event_type !== 'job').length +
    getNumberOfUnreadJobNotifications(notifications)
  );
}

export function getNumberOfUnreadJobNotifications(notifications) {
  const unreadJobs = new Set(
    notifications
      .filter(n => !n.read && n.event_type === 'job')
      .map(n => n.extra.id)
  );
  return unreadJobs.size;
}
