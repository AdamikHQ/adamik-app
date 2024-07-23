import * as React from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { cn } from "~/utils/helper";

const TooltipProvider = TooltipPrimitive.Provider;
const TooltipTrigger = TooltipPrimitive.Trigger;
const TooltipContent = TooltipPrimitive.Content;

const FirstVisitTooltip = ({
  children,
  text,
  showOnFirstVisit = false,
}: {
  children: React.ReactNode;
  text: string;
  showOnFirstVisit?: boolean;
}) => {
  const [shouldRenderTooltip, setShouldRenderTooltip] = React.useState(false);

  React.useEffect(() => {
    const tooltipShown = localStorage.getItem("tooltipShown") === "true";

    if (showOnFirstVisit && !tooltipShown) {
      setShouldRenderTooltip(true);
    }
  }, [showOnFirstVisit]);

  const handleDismiss = () => {
    localStorage.setItem("tooltipShown", "true");
    setShouldRenderTooltip(false);
  };

  if (!shouldRenderTooltip) {
    return <>{children}</>;
  }

  return (
    <TooltipProvider>
      <TooltipPrimitive.Root open={true} delayDuration={100}>
        <TooltipTrigger asChild>{children}</TooltipTrigger>
        <TooltipContent
          sideOffset={4}
          className={cn(
            "whitespace-pre-line z-50 overflow-hidden rounded-md border bg-popover px-3 py-1.5 text-sm text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95",
            "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
            "data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
            "sm:max-w-xs sm:text-xs sm:px-2 sm:py-1"
          )}
        >
          {text}
          <div className="flex justify-end mt-2">
            <button
              onClick={handleDismiss}
              className="text-blue-500 text-sm sm:text-xs"
            >
              Got it
            </button>
          </div>
        </TooltipContent>
      </TooltipPrimitive.Root>
    </TooltipProvider>
  );
};

export { FirstVisitTooltip };
