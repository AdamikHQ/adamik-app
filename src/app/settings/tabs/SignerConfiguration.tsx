"use client";

import { useState } from "react";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "~/components/ui/card";
import { AlertCircle, CheckCircle2, Loader2, Shield, Server, Cloud, Lock } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { SignerType, SIGNER_CONFIGS } from "~/signers/types";
import { SignerFactory } from "~/signers/SignerFactory";
import { useFilteredChains } from "~/hooks/useChains";
import { Badge } from "~/components/ui/badge";

type TestResult = {
  success: boolean;
  message: string;
  details?: any;
};

type SignerTestState = {
  testing: boolean;
  testResult: TestResult | null;
  selectedChain: string;
};

const signerInfo = {
  [SignerType.SODOT]: {
    icon: Shield,
    name: "Sodot MPC",
    shortDesc: "Secure multi-party computation",
    type: "2-of-3 threshold MPC",
    color: "blue",
  },
  [SignerType.IOFINNET]: {
    icon: Lock,
    name: "IoFinnet Vault",
    shortDesc: "Enterprise MPC with approvals",
    type: "Mobile approval required",
    color: "purple",
  },
  [SignerType.TURNKEY]: {
    icon: Cloud,
    name: "Turnkey",
    shortDesc: "Cloud-based key management",
    type: "API-based signing",
    color: "green",
  },
  [SignerType.BLOCKDAEMON]: {
    icon: Server,
    name: "BlockDaemon Vault",
    shortDesc: "Enterprise TSM",
    type: "2-of-3 threshold signing",
    color: "orange",
  },
};

export function SignerConfigurationContent() {
  const currentSigner = SignerFactory.getSelectedSignerType();
  const { data: chains } = useFilteredChains();
  
  // Separate state for each signer test
  const [sodotState, setSodotState] = useState<SignerTestState>({
    testing: false,
    testResult: null,
    selectedChain: "",
  });
  
  const [iofinnetState, setIofinnetState] = useState<SignerTestState>({
    testing: false,
    testResult: null,
    selectedChain: "",
  });
  
  const [turnkeyState, setTurnkeyState] = useState<SignerTestState>({
    testing: false,
    testResult: null,
    selectedChain: "",
  });
  
  const [blockdaemonState, setBlockdaemonState] = useState<SignerTestState>({
    testing: false,
    testResult: null,
    selectedChain: "",
  });

  // Test Sodot connection
  const testSodotConnection = async () => {
    if (!sodotState.selectedChain || !chains) {
      setSodotState(prev => ({
        ...prev,
        testResult: {
          success: false,
          message: "Please select a chain first",
        }
      }));
      return;
    }

    setSodotState(prev => ({ ...prev, testing: true, testResult: null }));

    try {
      const response = await fetch(`/api/sodot-proxy/derive-chain-pubkey?chain=${sodotState.selectedChain}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `Connection test failed: ${response.status}`);
      }

      setSodotState(prev => ({
        ...prev,
        testResult: {
          success: true,
          message: "Successfully connected to Sodot",
          details: {
            chain: sodotState.selectedChain,
            pubkey: data.data?.pubkey || data.pubkey,
            address: data.data?.address,
          }
        }
      }));
    } catch (error: any) {
      setSodotState(prev => ({
        ...prev,
        testResult: {
          success: false,
          message: error.message || "Failed to test Sodot connection",
        }
      }));
    } finally {
      setSodotState(prev => ({ ...prev, testing: false }));
    }
  };

  // Test IoFinnet connection
  const testIoFinnetConnection = async () => {
    setIofinnetState(prev => ({ ...prev, testing: true, testResult: null }));

    try {
      const response = await fetch("/api/iofinnet-proxy/test-connection", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || "Connection test failed");
      }

      setIofinnetState(prev => ({
        ...prev,
        testResult: {
          success: true,
          message: data.message || "Successfully connected to IoFinnet",
          details: data.details,
        }
      }));
    } catch (error: any) {
      setIofinnetState(prev => ({
        ...prev,
        testResult: {
          success: false,
          message: error.message || "Failed to test IoFinnet connection",
        }
      }));
    } finally {
      setIofinnetState(prev => ({ ...prev, testing: false }));
    }
  };

  // Test Turnkey connection
  const testTurnkeyConnection = async () => {
    setTurnkeyState(prev => ({ ...prev, testing: true, testResult: null }));

    try {
      const response = await fetch("/api/turnkey-proxy/test-connection", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || "Connection test failed");
      }

      setTurnkeyState(prev => ({
        ...prev,
        testResult: {
          success: true,
          message: data.message || "Successfully connected to Turnkey",
          details: data.details,
        }
      }));
    } catch (error: any) {
      setTurnkeyState(prev => ({
        ...prev,
        testResult: {
          success: false,
          message: error.message || "Failed to test Turnkey connection",
        }
      }));
    } finally {
      setTurnkeyState(prev => ({ ...prev, testing: false }));
    }
  };

  // Test BlockDaemon connection
  const testBlockdaemonConnection = async () => {
    setBlockdaemonState(prev => ({ ...prev, testing: true, testResult: null }));

    try {
      const response = await fetch("/api/blockdaemon-proxy/test-connection", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || "Connection test failed");
      }

      setBlockdaemonState(prev => ({
        ...prev,
        testResult: {
          success: true,
          message: data.message || "Successfully connected to BlockDaemon TSM",
          details: data.details,
        }
      }));
    } catch (error: any) {
      setBlockdaemonState(prev => ({
        ...prev,
        testResult: {
          success: false,
          message: error.message || "Failed to test BlockDaemon connection",
        }
      }));
    } finally {
      setBlockdaemonState(prev => ({ ...prev, testing: false }));
    }
  };

  const getStateForSigner = (signer: SignerType) => {
    switch (signer) {
      case SignerType.SODOT:
        return sodotState;
      case SignerType.IOFINNET:
        return iofinnetState;
      case SignerType.TURNKEY:
        return turnkeyState;
      case SignerType.BLOCKDAEMON:
        return blockdaemonState;
      default:
        return { testing: false, testResult: null, selectedChain: "" };
    }
  };

  const getTestFunction = (signer: SignerType) => {
    switch (signer) {
      case SignerType.SODOT:
        return testSodotConnection;
      case SignerType.IOFINNET:
        return testIoFinnetConnection;
      case SignerType.TURNKEY:
        return testTurnkeyConnection;
      case SignerType.BLOCKDAEMON:
        return testBlockdaemonConnection;
      default:
        return () => {};
    }
  };

  const SignerCard = ({ signer }: { signer: SignerType }) => {
    const info = signerInfo[signer];
    const config = SIGNER_CONFIGS[signer];
    const state = getStateForSigner(signer);
    const testFunction = getTestFunction(signer);
    const isActive = currentSigner === signer;
    const Icon = info.icon;

    return (
      <Card className={`relative overflow-hidden transition-all duration-200 ${
        isActive 
          ? 'ring-2 ring-primary shadow-lg' 
          : 'hover:shadow-md'
      }`}>
        {/* Active indicator bar */}
        {isActive && (
          <div className="absolute top-0 left-0 right-0 h-1 bg-primary" />
        )}
        
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className={
                info.color === 'blue' ? 'p-2 rounded-lg bg-blue-100 dark:bg-blue-900/20' :
                info.color === 'purple' ? 'p-2 rounded-lg bg-purple-100 dark:bg-purple-900/20' :
                info.color === 'green' ? 'p-2 rounded-lg bg-green-100 dark:bg-green-900/20' :
                'p-2 rounded-lg bg-orange-100 dark:bg-orange-900/20'
              }>
                <Icon className={
                  info.color === 'blue' ? 'h-5 w-5 text-blue-600 dark:text-blue-400' :
                  info.color === 'purple' ? 'h-5 w-5 text-purple-600 dark:text-purple-400' :
                  info.color === 'green' ? 'h-5 w-5 text-green-600 dark:text-green-400' :
                  'h-5 w-5 text-orange-600 dark:text-orange-400'
                } />
              </div>
              <div>
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  {info.name}
                  {isActive && (
                    <Badge variant="default" className="text-xs">Active</Badge>
                  )}
                </CardTitle>
                <CardDescription className="text-sm mt-0.5">
                  {info.shortDesc}
                </CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Signer details */}
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between py-1">
              <span className="text-muted-foreground">Type</span>
              <span className="font-medium">{info.type}</span>
            </div>
            <div className="flex items-center justify-between py-1">
              <span className="text-muted-foreground">Supported curves</span>
              <span className="font-medium">{config.supportedCurves.length} curves</span>
            </div>
          </div>

          <div className="border-t" />

          {/* Chain selector for Sodot */}
          {signer === SignerType.SODOT && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Test Chain</label>
              <Select
                value={sodotState.selectedChain}
                onValueChange={(value) => setSodotState(prev => ({ ...prev, selectedChain: value }))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a chain to test" />
                </SelectTrigger>
                <SelectContent>
                  {chains && Object.entries(chains).map(([chainId, chain]) => (
                    <SelectItem key={chainId} value={chainId}>
                      {chain.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Test result */}
          {state.testResult && (
            <div className={`p-3 rounded-lg border ${
              state.testResult.success 
                ? 'border-green-200 bg-green-50 dark:bg-green-900/10' 
                : 'border-destructive/50 bg-destructive/5'
            }`}>
              <div className="flex items-start gap-2">
                {state.testResult.success ? (
                  <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400 mt-0.5" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-destructive mt-0.5" />
                )}
                <div className="text-sm flex-1">
                  {state.testResult.message}
                  {state.testResult.success && state.testResult.details && (
                    <div className="mt-2 text-xs opacity-80 space-y-0.5">
                      {state.testResult.details.vaultId && (
                        <div>Vault: {state.testResult.details.vaultId}</div>
                      )}
                      {state.testResult.details.walletName && (
                        <div>Wallet: {state.testResult.details.walletName}</div>
                      )}
                      {state.testResult.details.endpoint && (
                        <div>Endpoint: {state.testResult.details.endpoint}</div>
                      )}
                      {state.testResult.details.chain && (
                        <div>Chain: {chains?.[state.testResult.details.chain]?.name}</div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Test button */}
          <Button 
            onClick={testFunction} 
            disabled={state.testing || (signer === SignerType.SODOT && !state.selectedChain)}
            className="w-full"
            variant={isActive ? "default" : "outline"}
          >
            {state.testing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Testing Connection...
              </>
            ) : (
              "Test Connection"
            )}
          </Button>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold">Signer Connections</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Test connectivity with different signing providers. The active signer is used for all transactions.
        </p>
      </div>

      {/* Signer cards grid */}
      <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2">
        <SignerCard signer={SignerType.SODOT} />
        <SignerCard signer={SignerType.IOFINNET} />
        <SignerCard signer={SignerType.TURNKEY} />
        <SignerCard signer={SignerType.BLOCKDAEMON} />
      </div>

      {/* Info section */}
      <div className="p-4 rounded-lg border bg-muted/50">
        <div className="flex items-start gap-2">
          <AlertCircle className="h-4 w-4 text-muted-foreground mt-0.5" />
          <p className="text-sm text-muted-foreground">
            To switch between signers, use the signer selector in the application header. 
            Each signer maintains its own set of addresses and configurations.
          </p>
        </div>
      </div>
    </div>
  );
}