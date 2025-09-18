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
import { Shield } from "lucide-react";
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
    const newSigner = value as SignerType;
    const oldSigner = currentSigner;
    
    // Update the local state immediately for UI responsiveness
    setCurrentSigner(newSigner);
    
    // Save to SignerFactory (localStorage)
    SignerFactory.setSelectedSignerType(newSigner);
    
    // Dispatch custom events to notify all components
    window.dispatchEvent(new CustomEvent("adamik-signer-changed", { 
      detail: { oldSigner, newSigner } 
    }));
    
    // Also dispatch the settings changed event for backward compatibility
    window.dispatchEvent(new Event("adamik-settings-changed"));
  };

  const getSignerIcon = (signer: SignerType) => {
    switch (signer) {
      case SignerType.SODOT:
        return <Shield className="h-3 w-3" />;
      case SignerType.IOFINNET:
        return <Shield className="h-3 w-3" />;
      case SignerType.TURNKEY:
        return <Shield className="h-3 w-3" />;
      case SignerType.BLOCKDAEMON:
        return <Shield className="h-3 w-3" />;
      case SignerType.DFNS:
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
                 currentSigner === SignerType.TURNKEY ? "Turnkey" :
                 currentSigner === SignerType.BLOCKDAEMON ? "BlockDaemon" :
                 currentSigner === SignerType.DFNS ? "Dfns" : "Unknown"}
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
          <SelectItem value={SignerType.BLOCKDAEMON}>
            <div className="flex items-center gap-2">
              <Shield className="h-3 w-3" />
              <span>BlockDaemon</span>
            </div>
          </SelectItem>
          <SelectItem value={SignerType.DFNS}>
            <div className="flex items-center gap-2">
              <Shield className="h-3 w-3" />
              <span>Dfns</span>
            </div>
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
