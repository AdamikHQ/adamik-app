"use client";

import { ReactNode, useState } from "react";
import { useMediaQuery } from "usehooks-ts";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "~/components/ui/command";
import { Drawer, DrawerContent, DrawerTrigger } from "~/components/ui/drawer";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import { ScrollArea } from "~/components/ui/scroll-area";
import { Tooltip } from "~/components/ui/tooltip";
import { Validator } from "~/utils/types";

type ValidatorSelectorProps = {
  validators: Validator[];
  selectedValue: Validator | undefined;
  onSelect: (validator: Validator, index: number) => void;
};

export function ValidatorSelector({
  validators,
  selectedValue,
  onSelect,
}: ValidatorSelectorProps): ReactNode {
  const [open, setOpen] = useState(false);
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const [selectedChoice, setSelectedChoice] = useState<Validator | undefined>(
    selectedValue
  );

  if (isDesktop) {
    return (
      <Popover open={open} onOpenChange={setOpen} modal={true}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            className="w-full justify-start h-auto min-h-[64px] p-2 overflow-hidden"
          >
            {selectedChoice ? (
              <ValidatorView validator={selectedChoice} isSelected={true} />
            ) : (
              <span className="text-muted-foreground">Select a validator</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[580px] p-0">
          <ValidatorSelectorList
            setOpen={setOpen}
            setSelectedChoice={setSelectedChoice}
            validators={validators}
            onSelect={onSelect}
          />
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          className="w-full justify-start h-auto min-h-[64px] p-2 overflow-hidden"
        >
          {selectedChoice ? (
            <ValidatorView validator={selectedChoice} isSelected={true} />
          ) : (
            <span className="text-muted-foreground">Select a validator</span>
          )}
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <div className="mt-4 border-t">
          <ValidatorSelectorList
            setOpen={setOpen}
            setSelectedChoice={setSelectedChoice}
            validators={validators}
            onSelect={onSelect}
          />
        </div>
      </DrawerContent>
    </Drawer>
  );
}

const ValidatorSelectorList = ({
  setOpen,
  setSelectedChoice,
  validators,
  onSelect,
}: {
  setOpen: (open: boolean) => void;
  setSelectedChoice: (choice: Validator | undefined) => void;
  validators: Validator[];
  onSelect: (validator: Validator, index: number) => void;
}) => {
  return (
    <Command>
      <CommandInput placeholder="Filter validators..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <ScrollArea className="h-[240px] overflow-auto">
          <CommandGroup>
            {validators.map((validator, i) => (
              <CommandItem
                key={`${validator.address}_${i}`}
                value={`${validator.name}_${i.toString()}`}
                onSelect={(value) => {
                  const [name, index] = value.split("_");
                  setSelectedChoice(validators[Number(index)]);
                  setOpen(false);
                  onSelect(validator, i);
                }}
              >
                <ValidatorView validator={validator} />
              </CommandItem>
            ))}
          </CommandGroup>
        </ScrollArea>
      </CommandList>
    </Command>
  );
};

const ValidatorView = ({ validator, isSelected = false }: { validator: Validator; isSelected?: boolean }) => {
  // Helper function to truncate address
  const truncateAddress = (address: string, startLength = 10, endLength = 10) => {
    if (address.length <= startLength + endLength + 3) return address;
    return `${address.slice(0, startLength)}...${address.slice(-endLength)}`;
  };

  // Check if commission is valid (not NaN, undefined, or containing "NaN")
  const hasValidCommission = 
    validator.commission && 
    validator.commission !== 'NaN' && 
    !validator.commission.toString().includes('NaN') &&
    !isNaN(parseFloat(validator.commission.toString().replace('%', '')));

  // For selected state, always show the truncated address
  if (isSelected) {
    return (
      <div className="flex items-center gap-2 w-full overflow-hidden">
        <div className="relative flex-shrink-0">
          <Tooltip text={validator.address}>
            <Avatar className="w-[32px] h-[32px]">
              <AvatarFallback>
                {validator?.name?.[0]?.toUpperCase() ||
                  validator.address[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </Tooltip>
          {validator.chainLogo && (
            <Tooltip text={validator.chainId}>
              <div className="absolute w-4 h-4 text-xs font-bold text-primary bg-primary-foreground border-2 rounded-full -top-[6px] -end-1">
                <Avatar className="h-3 w-3">
                  <AvatarImage
                    src={validator.chainLogo}
                    alt={validator.chainId}
                  />
                  <AvatarFallback>{validator.chainId}</AvatarFallback>
                </Avatar>
              </div>
            </Tooltip>
          )}
        </div>
        <div className="flex-1 min-w-0 overflow-hidden">
          {validator?.name ? (
            <>
              <div className="text-sm font-medium truncate">{validator.name}</div>
              <Tooltip text={validator.address}>
                <div className="text-xs text-muted-foreground font-mono truncate">
                  {truncateAddress(validator.address, 8, 8)}
                </div>
              </Tooltip>
            </>
          ) : (
            <Tooltip text={validator.address}>
              <div className="text-sm font-mono truncate">
                {truncateAddress(validator.address, 12, 12)}
              </div>
            </Tooltip>
          )}
        </div>
        {hasValidCommission && (
          <div className="font-bold flex-shrink-0 text-right text-sm whitespace-nowrap">
            Commission: {validator.commission}
          </div>
        )}
      </div>
    );
  }

  // For list view
  return (
    <div className="flex items-center gap-2 w-full">
      {validator?.name ? (
        <>
          <div className="relative flex-shrink-0">
            <Tooltip text={validator.address}>
              <Avatar className="w-[32px] h-[32px]">
                <AvatarFallback>
                  {validator?.name[0].toUpperCase() ||
                    validator.address[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </Tooltip>
            {validator.chainLogo && (
              <Tooltip text={validator.chainId}>
                <div className="absolute w-4 h-4 text-xs font-bold text-primary bg-primary-foreground border-2 rounded-full -top-[6px] -end-1">
                  <Avatar className="h-3 w-3">
                    <AvatarImage
                      src={validator.chainLogo}
                      alt={validator.chainId}
                    />
                    <AvatarFallback>{validator.chainId}</AvatarFallback>
                  </Avatar>
                </div>
              </Tooltip>
            )}
          </div>
          <div className="flex-1 text-left truncate">{validator.name}</div>
          {hasValidCommission && (
            <div className="font-bold flex-shrink-0 text-right">
              Commission: {validator.commission}
            </div>
          )}
        </>
      ) : (
        <>
          <Tooltip text={validator.address}>
            <div className="flex-1 text-left font-mono text-sm">
              {truncateAddress(validator.address)}
            </div>
          </Tooltip>
          {hasValidCommission && (
            <div className="font-bold flex-shrink-0 text-right">
              Commission: {validator.commission}
            </div>
          )}
        </>
      )}
    </div>
  );
};
