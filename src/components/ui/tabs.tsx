"use client";

import * as React from "react";
import { cn } from "~/utils/helper";

interface TabsContextValue {
  value: string;
  onValueChange: (value: string) => void;
  triggerRefs: React.RefObject<Map<string, HTMLButtonElement>>;
  contentRefs: React.RefObject<Map<string, HTMLDivElement>>;
}

const TabsContext = React.createContext<TabsContextValue | undefined>(
  undefined
);

function useTabsContext() {
  const context = React.useContext(TabsContext);
  if (!context) {
    throw new Error("Tabs components must be used within a Tabs provider");
  }
  return context;
}

interface TabsProps extends React.HTMLAttributes<HTMLDivElement> {
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
}

const Tabs = React.forwardRef<HTMLDivElement, TabsProps>(
  ({ defaultValue, value, onValueChange, children, ...props }, ref) => {
    const [tabValue, setTabValue] = React.useState<string>(() => {
      if (value !== undefined) return value;
      if (defaultValue !== undefined) return defaultValue;
      return "";
    });

    const triggerRefsMap = React.useRef<Map<string, HTMLButtonElement>>(
      new Map()
    );
    const contentRefsMap = React.useRef<Map<string, HTMLDivElement>>(new Map());

    React.useEffect(() => {
      if (value !== undefined) {
        setTabValue(value);
      }
    }, [value]);

    const handleValueChange = React.useCallback(
      (newValue: string) => {
        setTabValue(newValue);
        onValueChange?.(newValue);
      },
      [onValueChange]
    );

    return (
      <TabsContext.Provider
        value={{
          value: tabValue,
          onValueChange: handleValueChange,
          triggerRefs: triggerRefsMap,
          contentRefs: contentRefsMap,
        }}
      >
        <div ref={ref} role="tablist" {...props}>
          {children}
        </div>
      </TabsContext.Provider>
    );
  }
);
Tabs.displayName = "Tabs";

const TabsList = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground",
      className
    )}
    {...props}
  />
));
TabsList.displayName = "TabsList";

interface TabsTriggerProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string;
}

const TabsTrigger = React.forwardRef<HTMLButtonElement, TabsTriggerProps>(
  ({ className, value, ...props }, ref) => {
    const {
      value: selectedValue,
      onValueChange,
      triggerRefs,
      contentRefs,
    } = useTabsContext();
    const isSelected = selectedValue === value;
    const internalRef = React.useRef<HTMLButtonElement>(null);

    React.useEffect(() => {
      if (internalRef.current) {
        const refMap = triggerRefs.current;
        const currentValue = value;
        refMap.set(currentValue, internalRef.current);

        return () => {
          refMap.delete(currentValue);
        };
      }
    }, [value, triggerRefs]);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
      const triggers = Array.from(triggerRefs.current.values());
      const currentIndex = triggers.indexOf(e.currentTarget);
      let nextIndex: number;

      switch (e.key) {
        case "ArrowRight":
        case "ArrowDown":
          nextIndex = (currentIndex + 1) % triggers.length;
          triggers[nextIndex]?.focus();
          onValueChange(Array.from(triggerRefs.current.keys())[nextIndex]);
          e.preventDefault();
          break;
        case "ArrowLeft":
        case "ArrowUp":
          nextIndex = (currentIndex - 1 + triggers.length) % triggers.length;
          triggers[nextIndex]?.focus();
          onValueChange(Array.from(triggerRefs.current.keys())[nextIndex]);
          e.preventDefault();
          break;
        case "Home":
          triggers[0]?.focus();
          onValueChange(Array.from(triggerRefs.current.keys())[0]);
          e.preventDefault();
          break;
        case "End":
          triggers[triggers.length - 1]?.focus();
          onValueChange(
            Array.from(triggerRefs.current.keys())[triggers.length - 1]
          );
          e.preventDefault();
          break;
      }
    };

    React.useImperativeHandle(ref, () => internalRef.current!, []);

    return (
      <button
        ref={internalRef}
        type="button"
        role="tab"
        aria-selected={isSelected}
        aria-controls={`panel-${value}`}
        tabIndex={isSelected ? 0 : -1}
        data-state={isSelected ? "active" : "inactive"}
        onClick={() => onValueChange(value)}
        onKeyDown={handleKeyDown}
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm",
          className
        )}
        {...props}
      />
    );
  }
);
TabsTrigger.displayName = "TabsTrigger";

interface TabsContentProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
}

const TabsContent = React.forwardRef<HTMLDivElement, TabsContentProps>(
  ({ className, value, children, ...props }, ref) => {
    const { value: selectedValue, contentRefs } = useTabsContext();
    const isSelected = selectedValue === value;
    const internalRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
      if (internalRef.current) {
        const refMap = contentRefs.current;
        const currentValue = value;
        refMap.set(currentValue, internalRef.current);

        return () => {
          refMap.delete(currentValue);
        };
      }
    }, [value, contentRefs]);

    React.useImperativeHandle(ref, () => internalRef.current!, []);

    return (
      <div
        ref={internalRef}
        role="tabpanel"
        id={`panel-${value}`}
        aria-labelledby={`tab-${value}`}
        hidden={!isSelected}
        tabIndex={isSelected ? 0 : -1}
        data-state={isSelected ? "active" : "inactive"}
        className={cn(
          "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          isSelected ? "animate-in fade-in-0" : "hidden",
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
TabsContent.displayName = "TabsContent";

export { Tabs, TabsList, TabsTrigger, TabsContent };
