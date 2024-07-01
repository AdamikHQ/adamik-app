"use client";

import Image from "next/image";
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
import { Asset } from "~/utils/types";

type AssetSelectorProps = {
  assets: Asset[];
  onSelect: (asset: Asset) => void;
};

export const AssetView = ({ asset }: { asset: Asset }) => {
  return (
    <div className="flex items-center justify-between w-full">
      <Avatar className="w-[32px] h-[32px] mr-6">
        <AvatarImage src={asset?.logo} alt={asset.name} />
        <AvatarFallback>{asset.name}</AvatarFallback>
      </Avatar>
      <div className="flex-1 text-right">{asset.balanceMainUnit}</div>
      <div className="font-bold flex-1 text-right">{asset.ticker}</div>
    </div>
  );
};

export function AssetSelector({
  assets,
  onSelect,
}: AssetSelectorProps): React.ReactNode {
  const [open, setOpen] = React.useState(false);
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const [selectedChoice, setSelectedChoice] = React.useState<Asset | null>(
    null
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
  setSelectedChoice: (choice: Asset | null) => void;
  assets: Asset[];
  onSelect: (asset: Asset) => void;
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
                key={`${asset.ticker}_${i}`}
                value={asset.ticker}
                onSelect={(value) => {
                  setSelectedChoice(
                    assets.find((asset) => asset.ticker === value) || null
                  );
                  setOpen(false);
                  onSelect(asset);
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
