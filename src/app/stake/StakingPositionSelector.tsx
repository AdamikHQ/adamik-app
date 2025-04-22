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
import { Tooltip } from "~/components/ui/tooltip";
import { StakingPosition } from "./helpers";
import { TransactionMode, Validator } from "~/utils/types";
import { formatAmount } from "~/utils/helper";

type StakingPositionSelectorProps = {
  stakingPositions: StakingPosition[];
  validators: Validator[];
  selectedValue: StakingPosition | undefined;
  onSelect: (stakingPosition: StakingPosition, index: number) => void;
  mode: TransactionMode;
};

export function StakingPositionSelector({
  stakingPositions,
  validators,
  selectedValue,
  onSelect,
  mode,
}: StakingPositionSelectorProps): ReactNode {
  const [open, setOpen] = useState(false);
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const [selectedChoice, setSelectedChoice] = useState<
    StakingPosition | undefined
  >(selectedValue);

  const label =
    mode === TransactionMode.CLAIM_REWARDS
      ? "Select rewards to claim"
      : "Select a position";

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
                mode={mode}
              />
            ) : (
              <>{label}</>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[580px] p-0">
          <StakingPositionSelectorList
            setOpen={setOpen}
            setSelectedChoice={setSelectedChoice}
            onSelect={onSelect}
            stakingPositions={stakingPositions}
            validators={validators}
            mode={mode}
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
              mode={mode}
            />
          ) : (
            <>{label}</>
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
            mode={mode}
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
  mode,
}: {
  setOpen: (open: boolean) => void;
  setSelectedChoice: (choice: StakingPosition | undefined) => void;
  onSelect: (stakingPosition: StakingPosition, index: number) => void;
  stakingPositions: StakingPosition[];
  validators: Validator[];
  mode: TransactionMode;
}) => {
  const filteredPositions = useMemo(() => {
    if (mode === TransactionMode.CLAIM_REWARDS) {
      return stakingPositions
        .filter((position) => {
          const rewardAmount = position.rewardAmount
            ? parseFloat(position.rewardAmount)
            : 0;
          return position.rewardAmount && rewardAmount > 0;
        })
        .sort(
          (a, b) => parseFloat(b.rewardAmount!) - parseFloat(a.rewardAmount!)
        );
    } else if (mode === TransactionMode.UNSTAKE) {
      return stakingPositions.filter(
        (position) => position.status === "locked"
      );
    } else if (mode === TransactionMode.WITHDRAW) {
      return stakingPositions.filter(
        (position) => position.status === "unlocked"
      );
    } else {
      return stakingPositions;
    }
  }, [stakingPositions, mode]);

  return (
    <Command>
      <CommandInput placeholder="Filter positions..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <ScrollArea className="h-[240px] overflow-auto">
          <CommandGroup>
            {filteredPositions.map((stakingPosition, i) => (
              <CommandItem
                key={`${stakingPosition.validatorAddresses[0]}_${i}`}
                value={`${stakingPosition.validatorName}_${i.toString()}`}
                onSelect={(value) => {
                  const [name, index] = value.split("_");
                  const originalIndex = stakingPositions.findIndex(
                    (pos) => pos === stakingPosition
                  );
                  setSelectedChoice(stakingPosition);
                  setOpen(false);
                  onSelect(stakingPosition, originalIndex);
                }}
              >
                <StakingPositionView
                  stakingPosition={stakingPosition}
                  validators={validators}
                  mode={mode}
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
  mode,
}: {
  stakingPosition: StakingPosition;
  validators: Validator[];
  mode: TransactionMode;
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

  // Define the threshold for showing rewards
  const MIN_REWARD_THRESHOLD = 0.00001;

  const formattedRewardAmount = stakingPosition.rewardAmount
    ? parseFloat(stakingPosition.rewardAmount)
    : 0;

  const displayReward =
    formattedRewardAmount >= MIN_REWARD_THRESHOLD
      ? formatAmount(formattedRewardAmount, 3)
      : `>${MIN_REWARD_THRESHOLD}`;

  return (
    <div className="flex items-center justify-between w-full">
      {validator ? (
        <>
          {validator.name && (
            <div className="relative">
              <Tooltip text={validator?.address}>
                <Avatar className="w-[32px] h-[32px]">
                  <AvatarImage
                    src={validator.chainLogo}
                    alt={validator.chainId}
                  />
                </Avatar>
              </Tooltip>
            </div>
          )}
          <div className="flex-1 text-right truncate max-w-[200px]">
            {stakingPosition.validatorName ||
              `${stakingPosition.validatorAddresses[0].slice(
                0,
                12
              )}...${stakingPosition.validatorAddresses[0].slice(-6)}`}
          </div>
        </>
      ) : (
        <>
          <div className="relative">
            <Avatar className="w-[32px] h-[32px]">
              <AvatarImage
                src={stakingPosition.chainLogo}
                alt={stakingPosition.chainId}
              />
            </Avatar>
          </div>
          <div className="flex-1 text-right truncate max-w-[200px]">
            {`${stakingPosition.validatorAddresses[0].slice(
              0,
              6
            )}...${stakingPosition.validatorAddresses[0].slice(-6)}`}
          </div>
        </>
      )}

      <div className="font-bold flex-1 text-right">
        {mode === TransactionMode.CLAIM_REWARDS ? (
          <>
            {stakingPosition.rewardAmount ? (
              <div>
                {displayReward} {stakingPosition.ticker}
              </div>
            ) : (
              "0 Rewards"
            )}
          </>
        ) : (
          <>
            {parseFloat(stakingPosition.amount)} {stakingPosition.ticker}
          </>
        )}
      </div>
    </div>
  );
};
