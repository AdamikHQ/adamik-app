"use client";

import { ReactNode, useMemo, useState } from "react";
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
import { Tooltip, TooltipTrigger } from "~/components/ui/tooltip";
import { StakingPosition } from "./helpers";
import { Validator } from "~/utils/types";

type StakingPositionSelectorProps = {
  stakingPositions: StakingPosition[];
  validators: Validator[];
  selectedValue: StakingPosition | undefined;
  onSelect: (stakingPosition: StakingPosition, index: number) => void;
};

export function StakingPositionSelector({
  stakingPositions,
  validators,
  selectedValue,
  onSelect,
}: StakingPositionSelectorProps): ReactNode {
  const [open, setOpen] = useState(false);
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const [selectedChoice, setSelectedChoice] = useState<
    StakingPosition | undefined
  >(selectedValue);

  if (isDesktop) {
    return (
      <Popover open={open} onOpenChange={setOpen} modal={true}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            className="w-full justify-between h-[64px]"
          >
            {selectedChoice ? (
              <StakingPositionView
                stakingPosition={selectedChoice}
                validators={validators}
              />
            ) : (
              <>Select a position</>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[400px] p-0">
          <StakingPositionSelectorList
            setOpen={setOpen}
            setSelectedChoice={setSelectedChoice}
            onSelect={onSelect}
            stakingPositions={stakingPositions}
            validators={validators}
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
          className="w-full justify-between h-[64px]"
        >
          {selectedChoice ? (
            <StakingPositionView
              stakingPosition={selectedChoice}
              validators={validators}
            />
          ) : (
            <>Select a position</>
          )}
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <div className="mt-4 border-t">
          <StakingPositionSelectorList
            setOpen={setOpen}
            setSelectedChoice={setSelectedChoice}
            onSelect={onSelect}
            stakingPositions={stakingPositions}
            validators={validators}
          />
        </div>
      </DrawerContent>
    </Drawer>
  );
}

const StakingPositionSelectorList = ({
  setOpen,
  setSelectedChoice,
  onSelect,
  stakingPositions,
  validators,
}: {
  setOpen: (open: boolean) => void;
  setSelectedChoice: (choice: StakingPosition | undefined) => void;
  onSelect: (stakingPosition: StakingPosition, index: number) => void;
  stakingPositions: StakingPosition[];
  validators: Validator[];
}) => {
  return (
    <Command>
      <CommandInput placeholder="Filter positions..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <ScrollArea className="h-[240px] overflow-auto">
          <CommandGroup>
            {stakingPositions.map((stakingPosition, i) => (
              <CommandItem
                key={`${stakingPosition.validatorAddresses[0]}_${i}`}
                value={`${stakingPosition.validatorName}_${i.toString()}`}
                onSelect={(value) => {
                  const [name, index] = value.split("_");
                  setSelectedChoice(stakingPositions[Number(index)]);
                  setOpen(false);
                  onSelect(stakingPosition, i);
                }}
              >
                <StakingPositionView
                  stakingPosition={stakingPosition}
                  validators={validators}
                />
              </CommandItem>
            ))}
          </CommandGroup>
        </ScrollArea>
      </CommandList>
    </Command>
  );
};

const StakingPositionView = ({
  stakingPosition,
  validators,
}: {
  stakingPosition: StakingPosition;
  validators: Validator[];
}) => {
  const validator = useMemo(() => {
    // FIXME Hack for Cosmos, all validatorAddresses should be handled not just the 1st one
    return (
      stakingPosition &&
      validators.find(
        (validator) =>
          validator.address === stakingPosition.validatorAddresses[0]
      )
    );
  }, [stakingPosition, validators]);

  return (
    validator && (
      <div className="flex items-center justify-between w-full">
        {validator.name && (
          <div className="relative">
            <Tooltip text={validator?.address}>
              <TooltipTrigger>
                <Avatar className="w-[32px] h-[32px]">
                  <AvatarFallback>
                    {validator.name[0].toUpperCase() ||
                      validator?.address[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </TooltipTrigger>
            </Tooltip>
            {validator.chainLogo && (
              <Tooltip text={validator.chainId}>
                <TooltipTrigger>
                  <div className="absolute w-4 h-4 text-xs font-bold text-primary bg-primary-foreground border-2 rounded-full -top-[6px] -end-1">
                    <Avatar className="h-3 w-3">
                      <AvatarImage
                        src={validator.chainLogo}
                        alt={validator.chainId}
                      />
                      <AvatarFallback>{validator.chainId}</AvatarFallback>
                    </Avatar>
                  </div>
                </TooltipTrigger>
              </Tooltip>
            )}
          </div>
        )}
        <div className="flex-1 text-right">{validator.name}</div>
        <div className="font-bold flex-1 text-right">
          Stake: {stakingPosition.amount}
          {/* FIXME Need to display the unit too */}
        </div>
      </div>
    )
  );
};
