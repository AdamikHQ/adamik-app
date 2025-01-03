"use client";

import * as React from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { cn } from "~/utils/helper";
import { TableCell } from "./table";
import { useEffect, useRef } from "react";

const TooltipProvider = TooltipPrimitive.Provider;

const TooltipTrigger = TooltipPrimitive.Trigger;

const TooltipContent = ({
  className,
  sideOffset = 4,
  ...props
}: React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>) => (
  <TooltipPrimitive.Content
    sideOffset={sideOffset}
    className={cn(
      "z-50 overflow-hidden rounded-md border bg-popover px-3 py-1.5 text-sm text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
      className
    )}
    {...props}
  />
);
TooltipContent.displayName = TooltipPrimitive.Content.displayName;

const CustomTooltip = ({
  children,
  text,
}: {
  children: React.ReactNode;
  text: string;
}) => (
  <TooltipProvider>
    <TooltipPrimitive.Root delayDuration={100}>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent
        sideOffset={4}
        className={cn(
          "whitespace-pre-line z-50 overflow-hidden rounded-md border bg-popover px-3 py-1.5 text-sm text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2"
        )}
      >
        {text}
      </TooltipContent>
    </TooltipPrimitive.Root>
  </TooltipProvider>
);

const TableCellWithTooltip = ({
  children,
  text,
}: {
  children: React.ReactNode;
  text: string;
}) => {
  const tooltipRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleCopy = (event: ClipboardEvent) => {
      if (
        tooltipRef.current &&
        tooltipRef.current.contains(event.target as Node)
      ) {
        event.preventDefault();
        event.clipboardData?.setData("text/plain", text);
      }
    };

    document.addEventListener("copy", handleCopy);

    return () => {
      document.removeEventListener("copy", handleCopy);
    };
  }, [text]);

  return (
    <TableCell>
      <TooltipProvider>
        <TooltipPrimitive.Root delayDuration={100}>
          <TooltipTrigger asChild>
            <span>{children}</span>
          </TooltipTrigger>
          <TooltipContent
            sideOffset={4}
            className="whitespace-pre-line z-50 overflow-hidden rounded-md border bg-popover px-3 py-1.5 text-sm text-popover-foreground shadow-md"
          >
            {text}
          </TooltipContent>
        </TooltipPrimitive.Root>
      </TooltipProvider>
    </TableCell>
  );
};

export {
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
  CustomTooltip as Tooltip,
  TableCellWithTooltip,
};
