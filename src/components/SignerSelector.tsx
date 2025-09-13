"use client";

import React, { useState, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { SignerFactory } from "~/signers/SignerFactory";
import { SignerType } from "~/signers/types";
import { Shield, Vault } from "lucide-react";
import { useWallet } from "~/hooks/useWallet";

interface SignerSelectorProps {
  className?: string;
  showLabel?: boolean;
}

export function SignerSelector({
  className,
  showLabel = true,
}: SignerSelectorProps) {
  // Use state to handle client-side value to avoid hydration mismatch
  const [currentSigner, setCurrentSigner] = useState<SignerType>(SignerType.SODOT);
  const { isShowroom } = useWallet();

  useEffect(() => {
    // Only read from localStorage after component mounts on client
    setCurrentSigner(SignerFactory.getSelectedSignerType());
  }, []);

  const handleSignerChange = (value: string) => {
    SignerFactory.setSelectedSignerType(value as SignerType);
    // Reload to apply the new signer
    window.location.reload();
  };

  const getSignerIcon = (signer: SignerType) => {
    switch (signer) {
      case SignerType.SODOT:
        return <Shield className="h-3 w-3" />;
      case SignerType.IOFINNET:
        return <Shield className="h-3 w-3" />;
      case SignerType.TURNKEY:
        return <Shield className="h-3 w-3" />;
      default:
        return null;
    }
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {showLabel && (
        <span className="text-xs font-medium text-muted-foreground">
          Signer:
        </span>
      )}
      <Select
        value={currentSigner}
        onValueChange={handleSignerChange}
        disabled={isShowroom}
      >
        <SelectTrigger className="h-9 w-[140px] text-sm font-medium" disabled={isShowroom}>
          <SelectValue>
            <div className="flex items-center gap-1.5">
              {getSignerIcon(currentSigner)}
              <span>
                {currentSigner === SignerType.SODOT ? "Sodot" : 
                 currentSigner === SignerType.IOFINNET ? "IoFinnet" :
                 currentSigner === SignerType.TURNKEY ? "Turnkey" : "Unknown"}
              </span>
            </div>
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={SignerType.SODOT}>
            <div className="flex items-center gap-2">
              <Shield className="h-3 w-3" />
              <span>Sodot</span>
            </div>
          </SelectItem>
          <SelectItem value={SignerType.IOFINNET}>
            <div className="flex items-center gap-2">
              <Shield className="h-3 w-3" />
              <span>IoFinnet</span>
            </div>
          </SelectItem>
          <SelectItem value={SignerType.TURNKEY}>
            <div className="flex items-center gap-2">
              <Shield className="h-3 w-3" />
              <span>Turnkey</span>
            </div>
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
