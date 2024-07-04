"use client";

import * as React from "react";

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
import { formatAmount } from "~/utils/helper";
import { Asset } from "~/utils/types";

type AssetSelectorProps = {
  assets: Asset[];
  selectedValue: Asset | undefined;
  onSelect: (asset: Asset, index: number) => void;
};

export const AssetView = ({ asset }: { asset: Asset }) => {
  return (
    <div className="flex items-center justify-between w-full">
      {asset?.logo && (
        <div className="relative">
          <Tooltip text={asset.name}>
            <TooltipTrigger>
              <Avatar className="w-[32px] h-[32px]">
                <AvatarImage src={asset?.logo} alt={asset.name} />
                <AvatarFallback>{asset.name}</AvatarFallback>
              </Avatar>
            </TooltipTrigger>
          </Tooltip>
          {asset.mainChainLogo && (
            <Tooltip text={asset.chainId}>
              <TooltipTrigger>
                <div className="absolute w-4 h-4 text-xs font-bold text-primary bg-primary-foreground border-2 rounded-full -top-[6px] -end-1">
                  <Avatar className="h-3 w-3">
                    <AvatarImage
                      src={asset.mainChainLogo}
                      alt={asset.chainId}
                    />
                    <AvatarFallback>{asset.chainId}</AvatarFallback>
                  </Avatar>
                </div>
              </TooltipTrigger>
            </Tooltip>
          )}
        </div>
      )}
      <div className="flex-1 text-right">
        {asset?.balanceMainUnit ? formatAmount(asset.balanceMainUnit, 5) : ""}
      </div>
      <div className="font-bold flex-1 text-right">{asset.ticker}</div>
    </div>
  );
};

export function AssetSelector({
  assets,
  selectedValue,
  onSelect,
}: AssetSelectorProps): React.ReactNode {
  const [open, setOpen] = React.useState(false);
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const [selectedChoice, setSelectedChoice] = React.useState<Asset | undefined>(
    selectedValue
  );

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
              <AssetView asset={selectedChoice} />
            ) : (
              <>Select an asset</>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[400px] p-0">
          <AssetList
            setOpen={setOpen}
            setSelectedChoice={setSelectedChoice}
            assets={assets}
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
          className="w-full justify-between h-[64px]"
        >
          {selectedChoice ? (
            <AssetView asset={selectedChoice} />
          ) : (
            <>Select an asset</>
          )}
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <div className="mt-4 border-t">
          <AssetList
            setOpen={setOpen}
            setSelectedChoice={setSelectedChoice}
            assets={assets}
            onSelect={onSelect}
          />
        </div>
      </DrawerContent>
    </Drawer>
  );
}

function AssetList({
  setOpen,
  setSelectedChoice,
  assets,
  onSelect,
}: {
  setOpen: (open: boolean) => void;
  setSelectedChoice: (choice: Asset | undefined) => void;
  assets: Asset[];
  onSelect: (asset: Asset, index: number) => void;
}) {
  return (
    <Command>
      <CommandInput placeholder="Filter assets..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <ScrollArea className="h-[240px] overflow-auto">
          <CommandGroup>
            {assets.map((asset, i) => (
              <CommandItem
                key={`${asset.address}_${i}`}
                value={i.toString()}
                onSelect={(value) => {
                  setSelectedChoice(assets[Number(value)]);
                  setOpen(false);
                  onSelect(asset, i);
                }}
              >
                <AssetView asset={asset} />
              </CommandItem>
            ))}
          </CommandGroup>
        </ScrollArea>
      </CommandList>
    </Command>
  );
}
