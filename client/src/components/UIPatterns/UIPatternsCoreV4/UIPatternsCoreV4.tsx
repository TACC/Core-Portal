import React from 'react';
import styles from '../UIPatterns.module.scss';
import { Button } from '@tacc/core-components/ui/button';
import { InfoIcon } from 'lucide-react';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@tacc/core-components/ui/dialog';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@tacc/core-components/ui/alert-dialog';

import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@tacc/core-components/ui/drawer';

import { format } from 'date-fns';
import { Calendar } from '@tacc/core-components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@tacc/core-components/ui/popover';

import {
  Alert,
  AlertAction,
  AlertDescription,
  AlertTitle,
} from '@tacc/core-components/ui/alert';
import { TableFooterExample } from './UIPatternsTable';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@tacc/core-components/ui/accordion';
import { CardSpacing } from './UIPatternsCard';

import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@tacc/core-components/ui/hover-card';
import { Separator } from '@tacc/core-components/components/ui/separator';
import { UIPatternsCodeBlock } from './UIPatternsCodeBlock';
import { UIPatternsCombobox } from './UIPatternsComboboxSimple';
import { UIPatternsDropdown } from './UIPatternsDropdown';
import { UIPatternsFileTree } from './UIPatternsFileTree';
import { UIPatternsProgress } from './UIPatternsProgress';
import { UIPatternsToast } from './UIPatternsToast';
import { UIPatternsFlexTable } from './UIPatternsFlexTable';

function DatePickerSimple() {
  const [date, setDate] = React.useState<Date>();
  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button
            variant="outline"
            id="date-picker-simple"
            className="justify-start font-normal"
          >
            {date ? format(date, 'PPP') : <span>Pick a date</span>}
          </Button>
        }
      />
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={setDate}
          defaultMonth={date}
        />
      </PopoverContent>
    </Popover>
  );
}

const BUTTON_VARIANTS = [
  'default',
  'outline',
  'secondary',
  'ghost',
  'destructive',
  'link',
] as const;
const BUTTON_TEXT_SIZES = ['xs', 'sm', 'default', 'lg'] as const;
const BUTTON_ICON_SIZES = ['icon-xs', 'icon-sm', 'icon', 'icon-lg'] as const;

export function UIPatternsCoreV4() {
  return (
    <>
      <h1 style={{ marginTop: '2rem' }}>Version 4</h1>
      <div className={styles['list-item']}>
        <h6>Button (ShadCN) &mdash; variant &times; size</h6>
        {BUTTON_VARIANTS.map((variant) => (
          <div
            key={variant}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              flexWrap: 'wrap',
              marginBottom: '0.5rem',
            }}
          >
            <span
              style={{
                width: 80,
                fontFamily: 'monospace',
                fontSize: '0.75rem',
              }}
            >
              {variant}
            </span>
            {BUTTON_TEXT_SIZES.map((size) => (
              <Button key={size} variant={variant} size={size}>
                {size}
              </Button>
            ))}
            {BUTTON_ICON_SIZES.map((size) => (
              <Button
                key={size}
                variant={variant}
                size={size}
                aria-label={size}
              >
                &#9733;
              </Button>
            ))}
          </div>
        ))}
      </div>
      <div className={styles['list-item']}>
        <h6>Button (ShadCN) &mdash; disabled</h6>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {BUTTON_VARIANTS.map((variant) => (
            <Button key={variant} variant={variant} disabled>
              {variant}
            </Button>
          ))}
        </div>
      </div>

      <h6 className="tw:my-4">Combobox</h6>
      <div className="tw:my-4 tw:max-w-xs tw:w-full">
        <UIPatternsCombobox />
      </div>
      <h6 className="tw:my-4">Dialog</h6>
      <div className="tw:flex tw:gap-2 tw:mb-4">
        <Dialog>
          <DialogTrigger
            render={<Button variant="outline">Open Dialog</Button>}
          >
            Open
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="">Are you absolutely sure?</DialogTitle>
              <DialogDescription>
                This action cannot be undone. This will permanently delete your
                account and remove your data from our servers.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <DialogClose render={<Button variant="outline">Cancel</Button>} />
              <Button type="submit">Save changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <AlertDialog>
          <AlertDialogTrigger render={<Button variant="outline" />}>
            Show Alert Dialog
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete your
                account from our servers.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction>Continue</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        <div>
          <DatePickerSimple />
        </div>

        <div>
          <Drawer swipeDirection="right">
            <DrawerTrigger render={<Button variant="outline" />}>
              Open Drawer
            </DrawerTrigger>
            <DrawerContent>
              <DrawerHeader>
                <DrawerTitle>Are you absolutely sure?</DrawerTitle>
                <DrawerDescription>
                  This action cannot be undone.
                </DrawerDescription>
              </DrawerHeader>
              <div className="tw:p-4">{/* Content here */}</div>
              <DrawerFooter>
                <Button>Submit</Button>
                <DrawerClose render={<Button variant="outline" />}>
                  Cancel
                </DrawerClose>
              </DrawerFooter>
            </DrawerContent>
          </Drawer>
        </div>
        <div>
          <HoverCard>
            <HoverCardTrigger
              delay={100}
              closeDelay={200}
              render={<Button variant="outline">Hover</Button>}
            />
            <HoverCardContent
              side="top"
              className="tw:flex tw:w-64 tw:flex-col tw:gap-0.5"
            >
              <div className="tw:font-semibold">Core Portal</div>
              <div>The portal Framework - created and maintained by @tacc.</div>
              <div className="tw:mt-1 tw:text-xs tw:text-muted-foreground">
                Joined December 2021
              </div>
            </HoverCardContent>
          </HoverCard>
        </div>
        <div>
          <UIPatternsDropdown />
        </div>
      </div>

      <h6 className="tw:my-4">Toast</h6>
      <div>
        <UIPatternsToast />
      </div>
      <h6 className="tw:my-4">Alert</h6>
      <Alert>
        <InfoIcon />
        <AlertTitle>Heads up!</AlertTitle>
        <AlertDescription>
          You can add components and dependencies to your app using the cli.
        </AlertDescription>
        <AlertAction>
          <Button variant="outline">Enable</Button>
        </AlertAction>
      </Alert>
      <h6 className="tw:my-4">Table</h6>
      <div>
        <TableFooterExample />
      </div>

      <div>
        <div className="tw:h-100 tw:flex tw:flex-col tw:pr-6">
          <UIPatternsFlexTable />
        </div>
      </div>
      <Separator className="tw:my-4" />
      <h6 className="tw:mt-4">Accordion</h6>
      <div>
        <Accordion defaultValue={['shipping']} className="max-w-lg">
          <AccordionItem value="shipping">
            <AccordionTrigger>What are your shipping options?</AccordionTrigger>
            <AccordionContent>
              We offer standard (5-7 days), express (2-3 days), and overnight
              shipping. Free shipping on international orders.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="returns">
            <AccordionTrigger>What is your return policy?</AccordionTrigger>
            <AccordionContent>
              Returns accepted within 30 days. Items must be unused and in
              original packaging. Refunds processed within 5-7 business days.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="support">
            <AccordionTrigger>
              How can I contact customer support?
            </AccordionTrigger>
            <AccordionContent>
              Reach us via email, live chat, or phone. We respond within 24
              hours during business days.
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
      <h6 className="tw:my-4">Card</h6>
      <div>
        <CardSpacing />
      </div>

      <h6 className="tw:my-4">Code Block</h6>
      <UIPatternsCodeBlock />

      <h6 className="tw:my-4">File Tree</h6>
      <div>
        <UIPatternsFileTree />
      </div>
      <h6 className="tw:my-4">Progress</h6>
      <div>
        <UIPatternsProgress />
      </div>
    </>
  );
}
