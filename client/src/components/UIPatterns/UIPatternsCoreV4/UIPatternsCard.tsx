import { Button } from '@tacc/core-components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@tacc/core-components/ui/card';

import { ChevronRightIcon } from 'lucide-react';

export function CardSpacing() {
  const featureName = 'Scheduled reports';
  return (
    <Card size="sm" className="tw:w-full tw:max-w-sm">
      <CardHeader>
        <CardTitle>{featureName}</CardTitle>
        <CardDescription>
          Weekly snapshots. No more manual exports.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="tw:grid tw:gap-2 tw:py-2 tw:text-sm">
          <li className="tw:flex tw:gap-2">
            <ChevronRightIcon className="tw:mt-0.5 tw:size-4 tw:shrink-0 tw:text-muted-foreground" />
            <span>Choose a schedule (daily, or weekly).</span>
          </li>
          <li className="tw:flex tw:gap-2">
            <ChevronRightIcon className="tw:mt-0.5 tw:size-4 tw:shrink-0 tw:text-muted-foreground" />
            <span>Send to channels or specific teammates.</span>
          </li>
          <li className="tw:flex tw:gap-2">
            <ChevronRightIcon className="tw:mt-0.5 tw:size-4 tw:shrink-0 tw:text-muted-foreground" />
            <span>Include charts, tables, and key metrics.</span>
          </li>
        </ul>
      </CardContent>
      <CardFooter className="tw:flex-col tw:gap-2">
        <Button className="tw:w-full">Set up scheduled reports</Button>
        <Button variant="outline" className="tw:w-full">
          See what&apos;s new
        </Button>
      </CardFooter>
    </Card>
  );
}
