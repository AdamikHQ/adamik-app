"use client";

import { useState, useEffect } from "react";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "~/components/ui/card";
import { AlertCircle, CheckCircle2, Loader2, Shield, AlertTriangle, ChevronDown, ChevronUp } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "~/components/ui/alert-dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "~/components/ui/collapsible";
import { SignerType, SIGNER_CONFIGS } from "~/signers/types";
import { useFilteredChains } from "~/hooks/useChains";
import { useWallet } from "~/hooks/useWallet";
import { WalletName } from "~/components/wallets/types";

type TestResult = {
  success: boolean;
  message: string;
  details?: any;
};

export function SignerConfigurationContent() {
  const [selectedSigner, setSelectedSigner] = useState<SignerType>(SignerType.SODOT);
  const [showWarning, setShowWarning] = useState(false);
  const [pendingSigner, setPendingSigner] = useState<SignerType | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [selectedChain, setSelectedChain] = useState<string>("");
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const { data: chains, isLoading: chainsLoading } = useFilteredChains();
  const { addresses } = useWallet();
  
  // Load saved signer preference
  useEffect(() => {
    const savedSigner = localStorage.getItem("preferredSigner") as SignerType;
    if (savedSigner && Object.values(SignerType).includes(savedSigner)) {
      setSelectedSigner(savedSigner);
    }
  }, []);

  // Check if changing signer would hide addresses
  const checkSignerSwitch = (newSigner: SignerType) => {
    const newWalletName = newSigner === SignerType.IOFINNET 
      ? WalletName.IOFINNET 
      : WalletName.SODOT;
    
    // Count addresses that would be hidden
    const hiddenAddresses = addresses.filter(addr => addr.signer !== newWalletName);
    
    if (hiddenAddresses.length > 0) {
      // Show warning if addresses would be hidden
      setPendingSigner(newSigner);
      setShowWarning(true);
    } else {
      // No addresses to hide, proceed directly
      handleSignerChange(newSigner);
    }
  };

  // Save signer preference
  const handleSignerChange = (value: SignerType) => {
    setSelectedSigner(value);
    localStorage.setItem("preferredSigner", value);
    // Dispatch event to notify other components
    window.dispatchEvent(new Event("adamik-settings-changed"));
    setTestResult(null);
  };

  // Confirm signer change after warning
  const confirmSignerChange = () => {
    if (pendingSigner) {
      handleSignerChange(pendingSigner);
    }
    setShowWarning(false);
    setPendingSigner(null);
  };

  // Cancel signer change
  const cancelSignerChange = () => {
    setShowWarning(false);
    setPendingSigner(null);
  };

  // Test connection with selected signer
  const testSignerConnection = async () => {
    if (selectedSigner === SignerType.SODOT && (!selectedChain || !chains)) {
      setTestResult({
        success: false,
        message: "Please select a chain first",
      });
      return;
    }

    setTesting(true);
    setTestResult(null);

    try {
      // Call the appropriate API endpoint based on signer
      const endpoint = selectedSigner === SignerType.SODOT 
        ? `/api/sodot-proxy/derive-chain-pubkey`
        : `/api/iofinnet-proxy/get-all-pubkeys`;

      const url = selectedSigner === SignerType.SODOT
        ? `${endpoint}?chain=${selectedChain}`
        : endpoint;

      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `Connection test failed: ${response.status}`);
      }

      setTestResult({
        success: true,
        message: `Successfully connected to ${SIGNER_CONFIGS[selectedSigner].displayName}`,
        details: selectedSigner === SignerType.SODOT 
          ? {
              chain: selectedChain,
              pubkey: data.data?.pubkey || data.pubkey,
              address: data.data?.address,
            }
          : {
              ecdsa: data.publicKeys?.ECDSA_SECP256K1,
              eddsa: data.publicKeys?.EDDSA_ED25519,
            },
      });
    } catch (error: any) {
      setTestResult({
        success: false,
        message: error.message || "Connection test failed",
      });
    } finally {
      setTesting(false);
    }
  };

  const signerConfig = SIGNER_CONFIGS[selectedSigner];

  return (
    <div className="container mx-auto space-y-6">
      {/* Main Signer Selection Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Signer Configuration
          </CardTitle>
          <CardDescription>
            Choose which signing method to use for all wallet operations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Signer Selection */}
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Active Signer</label>
              <Select
                value={selectedSigner}
                onValueChange={(value) => checkSignerSwitch(value as SignerType)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a signer" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(SIGNER_CONFIGS).map(([key, config]) => (
                    <SelectItem key={key} value={key}>
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        <span>{config.displayName}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Signer Info Box */}
            <div className="bg-muted p-4 rounded-lg">
              <h3 className="font-semibold mb-2">{signerConfig.displayName}</h3>
              <p className="text-sm text-muted-foreground mb-3">
                {signerConfig.description}
              </p>
              <div className="text-sm space-y-1">
                <div>
                  <span className="font-medium">Supported Curves: </span>
                  <span className="text-muted-foreground">{signerConfig.supportedCurves.join(", ")}</span>
                </div>
                <div>
                  <span className="font-medium">Security: </span>
                  <span className="text-muted-foreground">
                    {selectedSigner === SignerType.SODOT 
                      ? "2-of-3 threshold MPC"
                      : "Enterprise MPC with approval workflows"}
                  </span>
                </div>
              </div>
            </div>

            {/* Setup Instructions if needed */}
            {signerConfig.requiresSetup && (
              <div className="p-3 bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-400 rounded-lg flex items-start gap-2">
                <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span className="text-sm">
                  {signerConfig.setupInstructions}
                </span>
              </div>
            )}
          </div>

          {/* Advanced Options - Collapsible */}
          <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between">
                <span className="text-sm font-medium">Advanced: Test Connection</span>
                {showAdvanced ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-4">
              <div className="space-y-4 border-t pt-4">
                {/* Chain Selection for Testing */}
                {selectedSigner === SignerType.SODOT && chains ? (
                  <div>
                    <label className="text-sm font-medium mb-2 block">Test Chain</label>
                    <Select
                      value={selectedChain}
                      onValueChange={setSelectedChain}
                      disabled={testing}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a chain to test" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(chains)
                          .filter(([_, chain]) => {
                            // Filter chains based on signer's supported curves
                            const curveType = chain.signerSpec?.curve === "secp256k1" 
                              ? "secp256k1" 
                              : "ed25519";
                            return signerConfig.supportedCurves.includes(curveType);
                          })
                          .sort(([, a], [, b]) => a.name.localeCompare(b.name))
                          .map(([chainId, chain]) => (
                            <SelectItem key={chainId} value={chainId}>
                              {chain.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                ) : null}

                {/* Test Button */}
                <Button 
                  onClick={testSignerConnection} 
                  disabled={testing || (selectedSigner === SignerType.SODOT && !selectedChain)}
                  className="w-full"
                  variant="outline"
                >
                  {testing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Testing Connection...
                    </>
                  ) : (
                    <>Test Connection</>
                  )}
                </Button>

                {/* Test Results */}
                {testResult && (
                  <div
                    className={`p-4 rounded-lg flex items-start gap-3 ${
                      testResult.success
                        ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                        : "bg-destructive/10 text-destructive"
                    }`}
                  >
                    {testResult.success ? (
                      <CheckCircle2 className="h-5 w-5 mt-0.5 flex-shrink-0" />
                    ) : (
                      <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                    )}
                    <div className="flex-1">
                      <p className="font-medium">{testResult.message}</p>
                      {testResult.success && testResult.details && (
                        <div className="mt-2 text-sm space-y-1">
                          {selectedSigner === SignerType.SODOT ? (
                            <>
                              {testResult.details.chain && (
                                <div>
                                  <span className="font-medium">Chain:</span> {testResult.details.chain}
                                </div>
                              )}
                              {testResult.details.pubkey && (
                                <div className="break-all">
                                  <span className="font-medium">Public Key:</span> {testResult.details.pubkey.substring(0, 20)}...
                                </div>
                              )}
                            </>
                          ) : (
                            <>
                              {testResult.details.ecdsa && (
                                <div className="break-all">
                                  <span className="font-medium">ECDSA Key:</span> {testResult.details.ecdsa.substring(0, 20)}...
                                </div>
                              )}
                              {testResult.details.eddsa && (
                                <div className="break-all">
                                  <span className="font-medium">EdDSA Key:</span> {testResult.details.eddsa.substring(0, 20)}...
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </CollapsibleContent>
          </Collapsible>
        </CardContent>
      </Card>

      {/* Warning Dialog */}
      <AlertDialog open={showWarning} onOpenChange={setShowWarning}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              Switching Signer
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p>
                  You are about to switch from <strong>{SIGNER_CONFIGS[selectedSigner].displayName}</strong> to{" "}
                  <strong>{pendingSigner ? SIGNER_CONFIGS[pendingSigner].displayName : ""}</strong>.
                </p>
                <p>
                  This will hide {addresses.filter(addr => {
                    const newWalletName = pendingSigner === SignerType.IOFINNET 
                      ? WalletName.IOFINNET 
                      : WalletName.SODOT;
                    return addr.signer !== newWalletName;
                  }).length} wallet address(es) from your portfolio that were created with the previous signer.
                </p>
                <p className="text-sm text-muted-foreground">
                  Note: Your addresses are not deleted and will reappear when you switch back to the original signer.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={cancelSignerChange}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={confirmSignerChange}>
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}