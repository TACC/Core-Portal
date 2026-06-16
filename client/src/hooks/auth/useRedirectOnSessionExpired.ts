import { useEffect, useState } from 'react';
import { useSessionLifetime } from './useSessionLifetime';

/* Redirect to the home page if the browser is open when the session expires. */
export function useRedirectOnSessionExpired({
  location,
}: {
  location?: string;
}) {
  const [timeoutId, setTimeoutId] = useState<number>();
  const { data: sessionRemaining } = useSessionLifetime();
  useEffect(() => {
    if (sessionRemaining) {
      const newTimeoutId = setTimeout(
        () => window.location.replace(location ?? '/'),
        sessionRemaining
      );
      setTimeoutId(newTimeoutId);
    }
    return () => {
      //Only maintain one active timeout
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [sessionRemaining]);
}
