import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { TableCell, TableRow } from "~/components/ui/table";
import { Asset } from "~/utils/types";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "~/components/ui/tooltip";

export const AssetRow: React.FC<{ asset: Asset }> = ({ asset }) => {
  const [openSubAssets, setSubAssets] = useState(false);

  return (
    <>
      <TooltipProvider delayDuration={100}>
        <TableRow
          key={`${asset?.chainId}_${asset.ticker}`}
          className=" cursor-pointer"
          onClick={() => setSubAssets(!openSubAssets)}
        >
          <TableCell className="hidden md:table-cell">
            <div>
              {asset?.logo && (
                <div className="relative">
                  <Tooltip>
                    <TooltipTrigger>
                      <Avatar className="w-[38px] h-[38px]">
                        <AvatarImage src={asset?.logo} alt={asset.name} />
                        <AvatarFallback>{asset.name}</AvatarFallback>
                      </Avatar>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{asset.name}</p>
                    </TooltipContent>
                  </Tooltip>
                  {asset.mainChainLogo && (
                    <Tooltip>
                      <TooltipTrigger>
                        <div className="absolute w-5 h-5 text-xs font-bold text-primary bg-primary-foreground border-2 rounded-full -top-2 end-2">
                          <Avatar className="h-4 w-4">
                            <AvatarImage
                              src={asset.mainChainLogo}
                              alt={asset.chainId}
                            />
                            <AvatarFallback>{asset.chainId}</AvatarFallback>
                          </Avatar>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{asset.chainId}</p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                </div>
              )}
            </div>
          </TableCell>
          <TableCell>{asset?.ticker}</TableCell>
          <TableCell className="hidden md:table-cell">
            {asset?.balanceMainUnit} {asset?.ticker}
          </TableCell>
          <TableCell>{asset?.balanceUSD?.toFixed(2) || "-"}</TableCell>
        </TableRow>
        {openSubAssets &&
          asset.subAssets &&
          asset.subAssets.length > 1 &&
          asset.subAssets.map((subAsset, i) => {
            return (
              <TableRow
                key={`${asset?.chainId}_${i}`}
                className="align-middle bg-primary-foreground"
              >
                <TableCell className="hidden md:table-cell">
                  <div>
                    {subAsset?.logo && (
                      <div className="relative flex">
                        <Tooltip>
                          <TooltipTrigger>
                            <Avatar className="w-[32px] h-[32px]">
                              <AvatarImage
                                src={subAsset?.logo}
                                alt={subAsset.name}
                              />
                              <AvatarFallback>{subAsset.name}</AvatarFallback>
                            </Avatar>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{subAsset.name}</p>
                          </TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger>
                            <div className="absolute w-5 h-5 text-xs font-bold text-primary bg-primary-foreground border-2 rounded-full -top-2 end-2">
                              <Avatar className="h-4 w-4">
                                <AvatarImage
                                  src={subAsset?.mainChainLogo}
                                  alt={subAsset.chainId}
                                />
                                <AvatarFallback>
                                  {subAsset.chainId}
                                </AvatarFallback>
                              </Avatar>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{subAsset.chainId}</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div>{subAsset?.ticker}</div>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  {subAsset?.balanceMainUnit} {subAsset?.ticker}
                </TableCell>
                <TableCell>{subAsset?.balanceUSD?.toFixed(2) || "-"}</TableCell>
              </TableRow>
            );
          })}
      </TooltipProvider>
    </>
  );
};
