import React from 'react';
import { useSelector } from 'react-redux';
import { Alert } from 'reactstrap';
import FormField from '_common/Form/FormField';

export default function QueueField({ hostname, queueName, children }) {
  const system = useSelector((state) =>
    state.systemMonitor?.list.find((item) => item.hostname === hostname)
  );
  const queue = system?.queues?.find((item) => item.name === queueName);
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
