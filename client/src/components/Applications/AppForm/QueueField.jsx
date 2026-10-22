import React, { useEffect, useState } from 'react';
import { useSystemQueue } from 'hooks/system-monitor/useSystemMonitor';
import { isTACCHost } from 'utils/systems';
import { Alert } from 'reactstrap';
import FormField from '_common/Form/FormField';

export default function QueueField({ hostname, queueName, children }) {
  const [status, setStatus] = useState(null);

  useEffect(() => {
    setStatus(null);
    if (!hostname || !isTACCHost(hostname)) return;

    let active = true;
    useSystemQueue(hostname)
      .then((queues) => {
        if (active) {
          setStatus({ hostname, queues: Array.isArray(queues) ? queues : [] });
        }
      })
      .catch(() => {
        // Queue status is advisory; a failed request must not block submission.
      });

    return () => {
      active = false;
    };
  }, [hostname]);

  const queue =
    status?.hostname === hostname
      ? status?.queues.find((item) => item.name === queueName)
      : undefined;
  const isAlmostFull = queue?.load >= 0.9;

  return (
    <FormField
      label="Queue"
      name="execSystemLogicalQueue"
      type="select"
      required
      aria-describedby="queue-description"
      description={
        <div id="queue-description">
          Select the queue this job will execute on.
          <div role="status" aria-live="polite">
            {isAlmostFull && (
              <Alert color="warning" className="mb-0" role="presentation">
                This queue is at least 90% full. Consider another compatible
                queue.
              </Alert>
            )}
          </div>
        </div>
      }
    >
      {children}
    </FormField>
  );
}
