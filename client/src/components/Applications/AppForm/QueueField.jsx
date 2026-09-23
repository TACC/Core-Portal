import React, { useEffect, useState } from 'react';
import { fetchUtil } from 'utils/fetchUtil';
import { isTACCHost } from 'utils/systems';
import FormField from '_common/Form/FormField';

export default function QueueField({ hostname, queueName, children }) {
  const [status, setStatus] = useState(null);

  useEffect(() => {
    if (!hostname || !isTACCHost(hostname)) return;

    const controller = new AbortController();
    setStatus(null);
    fetchUtil({
      url: `/api/system-monitor/${encodeURIComponent(hostname)}`,
      signal: controller.signal,
    })
      .then((queues) => {
        if (!controller.signal.aborted) {
          setStatus({ hostname, queues: Array.isArray(queues) ? queues : [] });
        }
      })
      .catch(() => {
        // Status is advisory; an unavailable monitor must not block submission.
      });

    return () => controller.abort();
  }, [hostname]);

  const queue =
    status && status.hostname === hostname
      ? status.queues.find((item) => item?.name === queueName)
      : undefined;
  const isAlmostFull =
    typeof queue?.load === 'number' &&
    Number.isFinite(queue.load) &&
    queue.load >= 0.9;

  return (
    <FormField
      label="Queue"
      name="execSystemLogicalQueue"
      type="select"
      required
      aria-describedby="queue-description"
      description={
        <span id="queue-description">
          Select the queue this job will execute on.
          <span className="d-block" role="status" aria-live="polite">
            {isAlmostFull &&
              'This queue is at least 90% full. Consider another compatible queue.'}
          </span>
        </span>
      }
    >
      {children}
    </FormField>
  );
}
