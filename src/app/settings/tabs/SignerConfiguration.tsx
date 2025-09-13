"use client";

import { useState } from "react";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "~/components/ui/card";
import { AlertCircle, CheckCircle2, Loader2, Shield } from "lucide-react";
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
          message: error.message || "Connection test failed",
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
      const response = await fetch("/api/iofinnet-proxy/get-all-pubkeys", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `Connection test failed: ${response.status}`);
      }

      setIofinnetState(prev => ({
        ...prev,
        testResult: {
          success: true,
          message: "Successfully connected to IoFinnet",
          details: {
            ecdsa: data.publicKeys?.ECDSA_SECP256K1,
            eddsa: data.publicKeys?.EDDSA_ED25519,
            vaultId: data.vaultId,
          }
        }
      }));
    } catch (error: any) {
      setIofinnetState(prev => ({
        ...prev,
        testResult: {
          success: false,
          message: error.message || "Connection test failed",
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
          message: data.message,
          details: data.details,
        }
      }));
    } catch (error: any) {
      setTurnkeyState(prev => ({
        ...prev,
        testResult: {
          success: false,
          message: error.message || "Connection test failed",
        }
      }));
    } finally {
      setTurnkeyState(prev => ({ ...prev, testing: false }));
    }
  };

  const getSignerIcon = (signer: SignerType) => {
    return <Shield className="h-5 w-5" />;
  };

  return (
    <div className="space-y-6">
      {/* Test Signers Section */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Test Signer Connections</h3>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Sodot Test Card */}
          <Card className={currentSigner === SignerType.SODOT ? "ring-2 ring-primary" : ""}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Sodot MPC
                </div>
                {currentSigner === SignerType.SODOT && (
                  <Badge variant="default" className="text-xs">Active</Badge>
                )}
              </CardTitle>
              <CardDescription>
                {SIGNER_CONFIGS[SignerType.SODOT].description}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col space-y-4">
              <div className="flex-1 space-y-4">
                <div className="text-sm space-y-2">
                  <div>
                    <span className="font-medium">Type:</span>{" "}
                    <span className="text-muted-foreground">2-of-3 threshold MPC</span>
                  </div>
                  <div>
                    <span className="font-medium">Curves:</span>{" "}
                    <span className="text-muted-foreground">
                      {SIGNER_CONFIGS[SignerType.SODOT].supportedCurves.join(", ")}
                    </span>
                  </div>
                </div>

                {/* Chain Selection for Sodot */}
                {chains && (
                  <div>
                    <label className="text-sm font-medium mb-2 block">Test Chain</label>
                    <Select
                      value={sodotState.selectedChain}
                      onValueChange={(value) => setSodotState(prev => ({ ...prev, selectedChain: value }))}
                      disabled={sodotState.testing}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a chain to test" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(chains)
                          .filter(([_, chain]) => {
                            const curveType = chain.signerSpec?.curve === "secp256k1" 
                              ? "secp256k1" 
                              : "ed25519";
                            return SIGNER_CONFIGS[SignerType.SODOT].supportedCurves.includes(curveType);
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
                )}

                {/* Test Result */}
                {sodotState.testResult && (
                  <div
                    className={`p-3 rounded-lg text-sm ${
                      sodotState.testResult.success
                        ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                        : "bg-destructive/10 text-destructive"
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      {sodotState.testResult.success ? (
                        <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      ) : (
                        <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      )}
                      <div className="flex-1">
                        <p className="font-medium">{sodotState.testResult.message}</p>
                        {sodotState.testResult.success && sodotState.testResult.details?.pubkey && (
                          <p className="mt-1 text-xs break-all opacity-80">
                            Pubkey: {sodotState.testResult.details.pubkey.substring(0, 20)}...
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Test Button at bottom */}
              <Button 
                onClick={testSodotConnection} 
                disabled={sodotState.testing || !sodotState.selectedChain}
                className="w-full mt-auto"
                variant="outline"
              >
                {sodotState.testing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Testing...
                  </>
                ) : (
                  "Test Connection"
                )}
              </Button>
            </CardContent>
          </Card>

          {/* IoFinnet Test Card */}
          <Card className={currentSigner === SignerType.IOFINNET ? "ring-2 ring-primary" : ""}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  IoFinnet Vault
                </div>
                {currentSigner === SignerType.IOFINNET && (
                  <Badge variant="default" className="text-xs">Active</Badge>
                )}
              </CardTitle>
              <CardDescription>
                {SIGNER_CONFIGS[SignerType.IOFINNET].description}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col space-y-4">
              <div className="flex-1 space-y-4">
                <div className="text-sm space-y-2">
                  <div>
                    <span className="font-medium">Type:</span>{" "}
                    <span className="text-muted-foreground">Enterprise MPC with approvals</span>
                  </div>
                  <div>
                    <span className="font-medium">Curves:</span>{" "}
                    <span className="text-muted-foreground">
                      {SIGNER_CONFIGS[SignerType.IOFINNET].supportedCurves.join(", ")}
                    </span>
                  </div>
                </div>

                {/* Spacer to match Sodot's chain selector height */}
                <div className="h-[70px]" />

                {/* Test Result */}
                {iofinnetState.testResult && (
                  <div
                    className={`p-3 rounded-lg text-sm ${
                      iofinnetState.testResult.success
                        ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                        : "bg-destructive/10 text-destructive"
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      {iofinnetState.testResult.success ? (
                        <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      ) : (
                        <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      )}
                      <div className="flex-1">
                        <p className="font-medium">{iofinnetState.testResult.message}</p>
                        {iofinnetState.testResult.success && iofinnetState.testResult.details && (
                          <div className="mt-1 text-xs opacity-80 space-y-1">
                            {iofinnetState.testResult.details.vaultId && (
                              <p>Vault ID: {iofinnetState.testResult.details.vaultId}</p>
                            )}
                            {iofinnetState.testResult.details.ecdsa && (
                              <p className="break-all">
                                ECDSA: {iofinnetState.testResult.details.ecdsa.substring(0, 20)}...
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Test Button at bottom */}
              <Button 
                onClick={testIoFinnetConnection} 
                disabled={iofinnetState.testing}
                className="w-full mt-auto"
                variant="outline"
              >
                {iofinnetState.testing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Testing...
                  </>
                ) : (
                  "Test Connection"
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Turnkey Test Card */}
          <Card className={currentSigner === SignerType.TURNKEY ? "ring-2 ring-primary" : ""}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Turnkey
                </div>
                {currentSigner === SignerType.TURNKEY && (
                  <Badge variant="default" className="text-xs">Active</Badge>
                )}
              </CardTitle>
              <CardDescription>
                {SIGNER_CONFIGS[SignerType.TURNKEY].description}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col space-y-4">
              <div className="flex-1 space-y-4">
                <div className="text-sm space-y-2">
                  <div>
                    <span className="font-medium">Type:</span>{" "}
                    <span className="text-muted-foreground">Cloud-based key management</span>
                  </div>
                  <div>
                    <span className="font-medium">Curves:</span>{" "}
                    <span className="text-muted-foreground">
                      {SIGNER_CONFIGS[SignerType.TURNKEY].supportedCurves.join(", ")}
                    </span>
                  </div>
                </div>

                {/* Spacer to match other cards' height */}
                <div className="h-[70px]" />

                {/* Test Result */}
                {turnkeyState.testResult && (
                  <div
                    className={`p-3 rounded-lg text-sm ${
                      turnkeyState.testResult.success
                        ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                        : "bg-destructive/10 text-destructive"
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      {turnkeyState.testResult.success ? (
                        <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      ) : (
                        <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      )}
                      <div className="flex-1">
                        <p className="font-medium">{turnkeyState.testResult.message}</p>
                        {turnkeyState.testResult.success && turnkeyState.testResult.details && (
                          <div className="mt-1 text-xs opacity-80 space-y-1">
                            {turnkeyState.testResult.details.walletName && (
                              <p>Wallet: {turnkeyState.testResult.details.walletName}</p>
                            )}
                            {turnkeyState.testResult.details.accountCount !== undefined && (
                              <p>Accounts: {turnkeyState.testResult.details.accountCount}</p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Test Button at bottom */}
              <Button 
                onClick={testTurnkeyConnection} 
                disabled={turnkeyState.testing}
                className="w-full mt-auto"
                variant="outline"
              >
                {turnkeyState.testing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Testing...
                  </>
                ) : (
                  "Test Connection"
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}