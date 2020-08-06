export function getNumberOfUnreadNotifications(notifications) {
  return (
    notifications.filter(
      n =>
        !n.read &&
        n.event_type !== 'job' &&
        n.event_type !== `interactive_session_ready`
    ).length + getNumberOfUnreadJobNotifications(notifications)
  );
}

export function getNumberOfUnreadJobNotifications(notifications) {
  const unreadJobs = new Set(
    notifications
      .filter(
        n =>
          !n.read &&
          (n.event_type === 'job' ||
            n.event_type === `interactive_session_ready`)
      )
      .map(n => n.extra.id)
  );
  return unreadJobs.size;
}
