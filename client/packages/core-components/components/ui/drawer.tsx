'use client';

import * as React from 'react';
import { Drawer as DrawerPrimitive } from '@base-ui/react/drawer';
import { cn } from 'cn';

type DrawerContextProps = {
  hasSnapPoints: boolean;
  modal: DrawerPrimitive.Root.Props['modal'];
  showSwipeHandle: boolean;
  swipeDirection: NonNullable<DrawerPrimitive.Root.Props['swipeDirection']>;
};

const DrawerContext = React.createContext<DrawerContextProps | null>(null);

function useDrawer() {
  const context = React.useContext(DrawerContext);

  if (!context) {
    throw new Error('useDrawer must be used within a Drawer.');
  }

  return context;
}

function Drawer({
  modal = true,
  showSwipeHandle = false,
  snapPoints,
  swipeDirection = 'down',
  ...props
}: DrawerPrimitive.Root.Props & {
  showSwipeHandle?: boolean;
}) {
  const hasSnapPoints = snapPoints != null && snapPoints.length > 0;
  const contextValue = React.useMemo(
    () => ({ hasSnapPoints, modal, showSwipeHandle, swipeDirection }),
    [hasSnapPoints, modal, showSwipeHandle, swipeDirection]
  );

  return (
    <DrawerContext.Provider value={contextValue}>
      <DrawerPrimitive.Root
        data-slot="drawer"
        modal={modal}
        snapPoints={snapPoints}
        swipeDirection={swipeDirection}
        {...props}
      />
    </DrawerContext.Provider>
  );
}

function DrawerTrigger({ ...props }: DrawerPrimitive.Trigger.Props) {
  return <DrawerPrimitive.Trigger data-slot="drawer-trigger" {...props} />;
}

function DrawerPortal({ ...props }: DrawerPrimitive.Portal.Props) {
  return <DrawerPrimitive.Portal data-slot="drawer-portal" {...props} />;
}

function DrawerClose({ ...props }: DrawerPrimitive.Close.Props) {
  return <DrawerPrimitive.Close data-slot="drawer-close" {...props} />;
}

function DrawerOverlay({
  className,
  ...props
}: DrawerPrimitive.Backdrop.Props) {
  return (
    <DrawerPrimitive.Backdrop
      data-slot="drawer-overlay"
      className={cn(
        'tw:fixed tw:inset-0 tw:z-50 tw:min-h-dvh tw:bg-black/10 tw:opacity-[max(var(--drawer-overlay-min-opacity,0),calc(1-var(--drawer-swipe-progress)))] tw:transition-opacity tw:duration-450 tw:ease-[cubic-bezier(0.32,0.72,0,1)] tw:select-none tw:data-ending-style:pointer-events-none tw:data-ending-style:opacity-0 tw:data-ending-style:duration-[calc(var(--drawer-swipe-strength)*400ms)] tw:data-snap-points:[--drawer-overlay-min-opacity:0.5] tw:data-starting-style:opacity-0 tw:data-swiping:duration-0 tw:supports-backdrop-filter:backdrop-blur-xs tw:supports-[-webkit-touch-callout:none]:absolute',
        className
      )}
      {...props}
    />
  );
}

function DrawerSwipeHandle({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="drawer-swipe-handle"
      aria-hidden="true"
      className={cn(
        'tw:relative tw:z-10 tw:flex tw:shrink-0 tw:cursor-grab tw:transition-opacity tw:duration-200 tw:group-data-nested-drawer-open/drawer-popup:opacity-0 tw:group-data-nested-drawer-swiping/drawer-popup:opacity-100 tw:group-data-[swipe-axis=x]/drawer-popup:h-full tw:group-data-[swipe-axis=x]/drawer-popup:w-3 tw:group-data-[swipe-axis=x]/drawer-popup:items-center tw:group-data-[swipe-axis=y]/drawer-popup:h-3 tw:group-data-[swipe-axis=y]/drawer-popup:w-full tw:group-data-[swipe-axis=y]/drawer-popup:justify-center tw:group-data-[swipe-direction=down]/drawer-popup:items-end tw:group-data-[swipe-direction=left]/drawer-popup:order-last tw:group-data-[swipe-direction=left]/drawer-popup:justify-start tw:group-data-[swipe-direction=right]/drawer-popup:justify-end tw:group-data-[swipe-direction=up]/drawer-popup:order-last tw:group-data-[swipe-direction=up]/drawer-popup:items-start tw:after:block tw:after:shrink-0 tw:after:rounded-full tw:after:bg-muted tw:group-data-[swipe-axis=x]/drawer-popup:after:h-24 tw:group-data-[swipe-axis=x]/drawer-popup:after:w-1 tw:group-data-[swipe-axis=y]/drawer-popup:after:h-1 tw:group-data-[swipe-axis=y]/drawer-popup:after:w-24 tw:active:cursor-grabbing',
        className
      )}
      {...props}
    />
  );
}

function DrawerContent({
  className,
  children,
  ...props
}: DrawerPrimitive.Popup.Props) {
  const { hasSnapPoints, modal, showSwipeHandle, swipeDirection } = useDrawer();
  const swipeAxis =
    swipeDirection === 'down' || swipeDirection === 'up' ? 'y' : 'x';

  return (
    <DrawerPortal data-slot="drawer-portal">
      {modal === true && (
        <DrawerOverlay data-snap-points={hasSnapPoints ? '' : undefined} />
      )}
      <DrawerPrimitive.Viewport
        data-slot="drawer-viewport"
        data-modal={modal}
        className="tw:pointer-events-none tw:fixed tw:inset-0 tw:z-50 tw:select-none tw:data-[modal=true]:pointer-events-auto"
      >
        <DrawerPrimitive.Popup
          data-slot="drawer-popup"
          data-swipe-axis={swipeAxis}
          data-snap-points={hasSnapPoints ? '' : undefined}
          className={cn(
            // Base.
            'tw:group/drawer-popup tw:pointer-events-auto tw:fixed tw:z-50 tw:m-(--drawer-inset,0px) tw:flex tw:h-(--drawer-content-height) tw:max-h-(--drawer-content-max-height,none) tw:min-h-0 tw:w-(--drawer-content-width,auto) tw:transform-[translate3d(var(--translate-x,0px),var(--translate-y,0px),0)_scale(var(--stack-scale))] tw:flex-col tw:bg-popover tw:text-sm tw:text-popover-foreground tw:transition-[transform,height,opacity,filter] tw:duration-450 tw:ease-[cubic-bezier(0.22,1,0.36,1)] tw:will-change-transform tw:outline-none tw:select-none tw:[interpolate-size:allow-keywords] tw:data-[swipe-direction=down]:rounded-t-xl tw:data-[swipe-direction=down]:border-t tw:data-[swipe-direction=left]:rounded-r-xl tw:data-[swipe-direction=left]:border-r tw:data-[swipe-direction=right]:rounded-l-xl tw:data-[swipe-direction=right]:border-l tw:data-[swipe-direction=up]:rounded-b-xl tw:data-[swipe-direction=up]:border-b',
            // Nested.
            'tw:data-nested-drawer-open:overflow-hidden tw:data-nested-drawer-open:brightness-95',
            // Bleed.
            'tw:after:pointer-events-none tw:after:absolute tw:after:bg-(--drawer-bleed-background,var(--color-popover)) tw:data-[swipe-axis=x]:after:inset-y-0 tw:data-[swipe-axis=x]:after:w-(--bleed) tw:data-[swipe-axis=y]:after:inset-x-0 tw:data-[swipe-axis=y]:after:h-(--bleed) tw:data-[swipe-direction=down]:after:top-full tw:data-[swipe-direction=left]:after:right-full tw:data-[swipe-direction=right]:after:left-full tw:data-[swipe-direction=up]:after:bottom-full',
            // Sizing.
            'tw:[--drawer-content-height:var(--drawer-height,auto)] tw:data-[swipe-axis=x]:[--drawer-content-width:75%] tw:data-[swipe-axis=y]:[--drawer-content-max-height:calc(100dvh-6rem)] tw:data-[swipe-axis=y]:data-snap-points:[--drawer-content-height:100dvh] tw:data-[swipe-axis=x]:sm:[--drawer-content-width:24rem]',
            // Stack.
            'tw:[--bleed:3rem] tw:[--peek:1rem] tw:[--stack-height:var(--drawer-frontmost-height,var(--drawer-height,0px))] tw:[--stack-peek-offset:max(0px,calc((var(--nested-drawers)-var(--stack-progress))*var(--peek)))] tw:[--stack-progress:clamp(0,var(--drawer-swipe-progress),1)] tw:[--stack-scale-base:max(0,calc(1-(var(--nested-drawers)*var(--stack-step))))] tw:[--stack-scale:clamp(0,calc(var(--stack-scale-base)+(var(--stack-step)*var(--stack-progress))),1)] tw:[--stack-shrink:calc(1-var(--stack-scale))] tw:[--stack-step:0.05]',
            // Transitions.
            'tw:data-ending-style:transform-(--closed-transform) tw:data-ending-style:opacity-[0.9999] tw:data-ending-style:duration-[calc(var(--drawer-swipe-strength)*400ms)] tw:data-nested-drawer-swiping:duration-0 tw:data-ending-style:data-nested-drawer-swiping:duration-[calc(var(--drawer-swipe-strength)*400ms)] tw:data-starting-style:transform-(--closed-transform) tw:data-swiping:duration-0 tw:data-ending-style:data-swiping:duration-[calc(var(--drawer-swipe-strength)*400ms)]',
            // Axis: y.
            'tw:data-[swipe-axis=y]:inset-x-0 tw:data-[swipe-axis=y]:data-nested-drawer-open:h-(--stack-height)',
            // Axis: x.
            'tw:data-[swipe-axis=x]:inset-y-0 tw:data-[swipe-axis=x]:flex-row',
            // Direction: down.
            'tw:data-[swipe-direction=down]:bottom-0 tw:data-[swipe-direction=down]:origin-bottom tw:data-[swipe-direction=down]:[--closed-transform:translate3d(0,calc(100%+var(--drawer-inset,0px)+2px),0)] tw:data-[swipe-direction=down]:[--translate-y:calc(var(--drawer-snap-point-offset,0px)+var(--drawer-swipe-movement-y)-var(--stack-peek-offset)-(var(--stack-shrink)*var(--stack-height)))]',
            // Direction: up.
            'tw:data-[swipe-direction=up]:top-0 tw:data-[swipe-direction=up]:origin-top tw:data-[swipe-direction=up]:[--closed-transform:translate3d(0,calc(-100%-var(--drawer-inset,0px)-2px),0)] tw:data-[swipe-direction=up]:[--translate-y:calc(var(--drawer-snap-point-offset,0px)+var(--drawer-swipe-movement-y)+var(--stack-peek-offset)+(var(--stack-shrink)*var(--stack-height)))]',
            // Direction: left.
            'tw:data-[swipe-direction=left]:left-0 tw:data-[swipe-direction=left]:origin-left tw:data-[swipe-direction=left]:[--closed-transform:translate3d(calc(-100%-var(--drawer-inset,0px)-2px),0,0)] tw:data-[swipe-direction=left]:[--translate-x:calc(var(--drawer-swipe-movement-x)+var(--stack-peek-offset)+(var(--stack-shrink)*100%))]',
            // Direction: right.
            'tw:data-[swipe-direction=right]:right-0 tw:data-[swipe-direction=right]:origin-right tw:data-[swipe-direction=right]:[--closed-transform:translate3d(calc(100%+var(--drawer-inset,0px)+2px),0,0)] tw:data-[swipe-direction=right]:[--translate-x:calc(var(--drawer-swipe-movement-x)-var(--stack-peek-offset)-(var(--stack-shrink)*100%))]',
            className
          )}
          {...props}
        >
          {showSwipeHandle && <DrawerSwipeHandle />}
          <DrawerPrimitive.Content
            data-slot="drawer-content"
            className={cn(
              'tw:flex tw:min-h-0 tw:flex-1 tw:flex-col tw:overflow-hidden tw:overscroll-contain tw:rounded-[inherit] tw:transition-opacity tw:duration-300 tw:ease-[cubic-bezier(0.45,1.005,0,1.005)] tw:select-text tw:group-data-nested-drawer-open/drawer-popup:opacity-0 tw:group-data-nested-drawer-swiping/drawer-popup:opacity-100 tw:group-data-swiping/drawer-popup:select-none'
            )}
          >
            {children}
          </DrawerPrimitive.Content>
        </DrawerPrimitive.Popup>
      </DrawerPrimitive.Viewport>
    </DrawerPortal>
  );
}

function DrawerHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="drawer-header"
      className={cn(
        'tw:flex tw:shrink-0 tw:flex-col tw:gap-0.5 tw:p-4 tw:pb-0 tw:group-data-[swipe-axis=y]/drawer-popup:text-center tw:md:gap-0.5 tw:md:text-left',
        className
      )}
      {...props}
    />
  );
}

function DrawerFooter({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="drawer-footer"
      className={cn(
        'tw:mt-auto tw:flex tw:shrink-0 tw:flex-col tw:gap-2 tw:p-4 tw:pt-0',
        className
      )}
      {...props}
    />
  );
}

function DrawerTitle({ className, ...props }: DrawerPrimitive.Title.Props) {
  return (
    <DrawerPrimitive.Title
      data-slot="drawer-title"
      className={cn(
        'tw:font-heading tw:text-base tw:font-medium tw:text-foreground',
        className
      )}
      {...props}
    />
  );
}

function DrawerDescription({
  className,
  ...props
}: DrawerPrimitive.Description.Props) {
  return (
    <DrawerPrimitive.Description
      data-slot="drawer-description"
      className={cn(
        'tw:text-sm tw:text-balance tw:text-muted-foreground',
        className
      )}
      {...props}
    />
  );
}

export {
  Drawer,
  DrawerPortal,
  DrawerOverlay,
  DrawerSwipeHandle,
  DrawerTrigger,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerFooter,
  DrawerTitle,
  DrawerDescription,
};
