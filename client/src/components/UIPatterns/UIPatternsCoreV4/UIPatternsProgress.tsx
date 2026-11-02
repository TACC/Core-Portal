import * as React from 'react';
import { Progress } from '@tacc/core-components/ui/progress';
import { Slider } from '@tacc/core-components/ui/slider';

export function UIPatternsProgress() {
  const [value, setValue] = React.useState(50);
  return (
    <div className="tw:flex tw:w-full tw:max-w-sm tw:flex-col tw:gap-4">
      <Progress value={value} className="tw:w-full" />
      <Slider
        value={value}
        onValueChange={(value) => setValue(value as number)}
        min={0}
        max={100}
        step={1}
      />
    </div>
  );
}
