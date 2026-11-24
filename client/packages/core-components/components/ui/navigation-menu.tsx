import { NavigationMenu as NavigationMenuPrimitive } from '@base-ui/react/navigation-menu';
import { cva } from 'class-variance-authority';
import { cn } from 'cn';
import { ChevronDownIcon } from 'lucide-react';

function NavigationMenu({
  align = 'start',
  className,
  children,
  ...props
}: NavigationMenuPrimitive.Root.Props &
  Pick<NavigationMenuPrimitive.Positioner.Props, 'align'>) {
  return (
    <NavigationMenuPrimitive.Root
      data-slot="navigation-menu"
      className={cn(
        'tw:group/navigation-menu tw:relative tw:flex tw:max-w-max tw:flex-1 tw:items-center tw:justify-center',
        className
      )}
      {...props}
    >
      {children}
      <NavigationMenuPositioner align={align} />
    </NavigationMenuPrimitive.Root>
  );
}

function NavigationMenuList({
  className,
  ...props
}: React.ComponentPropsWithRef<typeof NavigationMenuPrimitive.List>) {
  return (
    <NavigationMenuPrimitive.List
      data-slot="navigation-menu-list"
      className={cn(
        'tw:group tw:flex tw:flex-1 tw:list-none tw:items-center tw:justify-center tw:gap-0',
        className
      )}
      {...props}
    />
  );
}

function NavigationMenuItem({
  className,
  ...props
}: React.ComponentPropsWithRef<typeof NavigationMenuPrimitive.Item>) {
  return (
    <NavigationMenuPrimitive.Item
      data-slot="navigation-menu-item"
      className={cn('tw:relative', className)}
      {...props}
    />
  );
}

const navigationMenuTriggerStyle = cva(
  'tw:group/navigation-menu-trigger tw:inline-flex tw:h-9 tw:w-max tw:items-center tw:justify-center tw:rounded-lg tw:px-2.5 tw:py-1.5 tw:text-sm tw:font-medium tw:transition-all tw:outline-none tw:hover:bg-muted tw:focus:bg-muted tw:focus-visible:ring-3 tw:focus-visible:ring-ring/50 tw:focus-visible:outline-1 tw:disabled:pointer-events-none tw:disabled:opacity-50 tw:data-popup-open:bg-muted/50 tw:data-popup-open:hover:bg-muted tw:data-open:bg-muted/50 tw:data-open:hover:bg-muted tw:data-open:focus:bg-muted'
);

function NavigationMenuTrigger({
  className,
  children,
  ...props
}: NavigationMenuPrimitive.Trigger.Props) {
  return (
    <NavigationMenuPrimitive.Trigger
      data-slot="navigation-menu-trigger"
      className={cn(navigationMenuTriggerStyle(), 'tw:group', className)}
      {...props}
    >
      {children}{' '}
      <ChevronDownIcon
        className="tw:relative tw:top-px tw:ml-1 tw:size-3 tw:transition tw:duration-300 tw:group-data-popup-open/navigation-menu-trigger:rotate-180 tw:group-data-open/navigation-menu-trigger:rotate-180"
        aria-hidden="true"
      />
    </NavigationMenuPrimitive.Trigger>
  );
}

function NavigationMenuContent({
  className,
  ...props
}: NavigationMenuPrimitive.Content.Props) {
  return (
    <NavigationMenuPrimitive.Content
      data-slot="navigation-menu-content"
      className={cn(
        'tw:data-ending-style:data-activation-direction=left:translate-x-[50%] tw:data-ending-style:data-activation-direction=right:translate-x-[-50%] tw:data-starting-style:data-activation-direction=left:translate-x-[-50%] tw:data-starting-style:data-activation-direction=right:translate-x-[50%] tw:h-full tw:w-auto tw:p-1 tw:transition-[opacity,transform,translate] tw:duration-[0.35s] tw:ease-[cubic-bezier(0.22,1,0.36,1)] tw:group-data-[viewport=false]/navigation-menu:rounded-lg tw:group-data-[viewport=false]/navigation-menu:bg-popover tw:group-data-[viewport=false]/navigation-menu:text-popover-foreground tw:group-data-[viewport=false]/navigation-menu:shadow tw:group-data-[viewport=false]/navigation-menu:ring-1 tw:group-data-[viewport=false]/navigation-menu:ring-foreground/10 tw:group-data-[viewport=false]/navigation-menu:duration-300 tw:data-ending-style:opacity-0 tw:data-starting-style:opacity-0 tw:data-[motion=from-end]:slide-in-from-right-52 tw:data-[motion=from-start]:slide-in-from-left-52 tw:data-[motion=to-end]:slide-out-to-right-52 tw:data-[motion=to-start]:slide-out-to-left-52 tw:data-[motion^=from-]:animate-in tw:data-[motion^=from-]:fade-in tw:data-[motion^=to-]:animate-out tw:data-[motion^=to-]:fade-out tw:**:data-[slot=navigation-menu-link]:focus:ring-0 tw:**:data-[slot=navigation-menu-link]:focus:outline-none tw:group-data-[viewport=false]/navigation-menu:data-open:animate-in tw:group-data-[viewport=false]/navigation-menu:data-open:fade-in-0 tw:group-data-[viewport=false]/navigation-menu:data-open:zoom-in-95 tw:group-data-[viewport=false]/navigation-menu:data-closed:animate-out tw:group-data-[viewport=false]/navigation-menu:data-closed:fade-out-0 tw:group-data-[viewport=false]/navigation-menu:data-closed:zoom-out-95',
        className
      )}
      {...props}
    />
  );
}

function NavigationMenuPositioner({
  className,
  side = 'bottom',
  sideOffset = 8,
  align = 'start',
  alignOffset = 0,
  ...props
}: NavigationMenuPrimitive.Positioner.Props) {
  return (
    <NavigationMenuPrimitive.Portal>
      <NavigationMenuPrimitive.Positioner
        side={side}
        sideOffset={sideOffset}
        align={align}
        alignOffset={alignOffset}
        className={cn(
          'tw:isolate tw:z-50 tw:h-(--positioner-height) tw:w-(--positioner-width) tw:max-w-(--available-width) tw:transition-[top,left,right,bottom] tw:duration-[0.35s] tw:ease-[cubic-bezier(0.22,1,0.36,1)] tw:data-instant:transition-none tw:data-[side=bottom]:before:top-[-10px] tw:data-[side=bottom]:before:right-0 tw:data-[side=bottom]:before:left-0',
          className
        )}
        {...props}
      >
        <NavigationMenuPrimitive.Popup className="tw:data-[ending-style]:easing-[ease] tw:xs:w-(--popup-width) tw:relative tw:h-(--popup-height) tw:w-(--popup-width) tw:origin-(--transform-origin) tw:rounded-lg tw:bg-popover tw:text-popover-foreground tw:shadow tw:ring-1 tw:ring-foreground/10 tw:transition-[opacity,transform,width,height,scale,translate] tw:duration-[0.35s] tw:ease-[cubic-bezier(0.22,1,0.36,1)] tw:outline-none tw:data-ending-style:scale-90 tw:data-ending-style:opacity-0 tw:data-ending-style:duration-150 tw:data-starting-style:scale-90 tw:data-starting-style:opacity-0">
          <NavigationMenuPrimitive.Viewport className="tw:relative tw:size-full tw:overflow-hidden" />
        </NavigationMenuPrimitive.Popup>
      </NavigationMenuPrimitive.Positioner>
    </NavigationMenuPrimitive.Portal>
  );
}

function NavigationMenuLink({
  className,
  ...props
}: NavigationMenuPrimitive.Link.Props) {
  return (
    <NavigationMenuPrimitive.Link
      data-slot="navigation-menu-link"
      className={cn(
        'tw:flex tw:items-center tw:gap-2 tw:rounded-lg tw:p-2 tw:text-sm tw:transition-all tw:outline-none tw:hover:bg-muted tw:focus:bg-muted tw:focus-visible:ring-3 tw:focus-visible:ring-ring/50 tw:focus-visible:outline-1 tw:in-data-[slot=navigation-menu-content]:rounded-md tw:data-active:bg-muted/50 tw:data-active:hover:bg-muted tw:data-active:focus:bg-muted tw:[&_svg:not([class*=size-])]:size-4',
        className
      )}
      {...props}
    />
  );
}

function NavigationMenuIndicator({
  className,
  ...props
}: React.ComponentPropsWithRef<typeof NavigationMenuPrimitive.Icon>) {
  return (
    <NavigationMenuPrimitive.Icon
      data-slot="navigation-menu-indicator"
      className={cn(
        'tw:top-full tw:z-1 tw:flex tw:h-1.5 tw:items-end tw:justify-center tw:overflow-hidden tw:data-[state=hidden]:animate-out tw:data-[state=hidden]:fade-out tw:data-[state=visible]:animate-in tw:data-[state=visible]:fade-in',
        className
      )}
      {...props}
    >
      <div className="tw:relative tw:top-[60%] tw:h-2 tw:w-2 tw:rotate-45 tw:rounded-tl-sm tw:bg-border tw:shadow-md" />
    </NavigationMenuPrimitive.Icon>
  );
}

export {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuIndicator,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
  NavigationMenuPositioner,
};
