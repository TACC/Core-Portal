export function getNumberOfUnreadNotifications(notifications) {
  return (
    notifications.filter(
      (n) =>
        !n.read &&
        n.event_type !== 'job' &&
        n.event_type !== `interactive_session_ready` &&
        n.event_type !== 'projects'
    ).length + getNumberOfUnreadJobNotifications(notifications)
  );
}

export function getNumberOfUnreadJobNotifications(notifications) {
  const unreadJobs = new Set(
    notifications
      .filter(
        (n) =>
          !n.read &&
          (n.event_type === 'job' ||
            n.event_type === `interactive_session_ready`)
      )
      .map((n) => n.extra.uuid)
  );
  return unreadJobs.size;
}
