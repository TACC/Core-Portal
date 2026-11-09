'use client';

import { Button } from '@tacc/core-components/ui/button';
import { toast, Toaster } from '@tacc/core-components/ui/toast';

export function UIPatternsToast() {
  function showToast() {
    const id = toast.add({
      title: 'Event created',
      description: 'Sunday, December 3 at 9:00 AM',
      actionProps: {
        children: 'Undo',
        onClick() {
          toast.close(id);
        },
      },
    });
  }

  return (
    <>
      <div className="tw:flex tw:flex-wrap tw:gap-2">
        <Button
          variant="outline"
          onClick={() => toast.add({ description: 'Event has been created.' })}
        >
          Default
        </Button>
        <Button
          variant="outline"
          onClick={() =>
            toast.add({
              type: 'success',
              description: 'Event has been created.',
            })
          }
        >
          Success
        </Button>
        <Button
          variant="outline"
          onClick={() =>
            toast.add({
              type: 'info',
              description: 'Arrive 10 minutes before the event.',
            })
          }
        >
          Info
        </Button>
        <Button
          variant="outline"
          onClick={() =>
            toast.add({
              type: 'warning',
              description: 'The event cannot start before 8:00 AM.',
            })
          }
        >
          Warning
        </Button>
        <Button
          variant="outline"
          onClick={() =>
            toast.add({
              type: 'error',
              description: 'The event could not be created.',
              priority: 'high',
            })
          }
        >
          Error
        </Button>
        <Button variant="outline" onClick={showToast}>
          With Action
        </Button>
      </div>
      <Toaster />
    </>
  );
}
