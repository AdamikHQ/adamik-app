"use client";

import { useState, useCallback } from "react";
import { Info, Check, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Button } from "~/components/ui/button";
import { Tooltip } from "~/components/ui/tooltip";
import { WalletSelection } from "~/components/wallets/WalletSelection";
import { useToast } from "~/components/ui/use-toast";
import { useEncodeTransaction } from "~/hooks/useEncodeTransaction";
import { TransactionData, TransactionMode } from "~/utils/types";
import { amountToSmallestUnit } from "~/utils/helper";
import { getSignPsbtDefaultOptions, Network } from "~/components/wallets/utils";
import { useBroadcastTransaction } from "~/hooks/useBroadcastTransaction";
import { fromBech32 } from "@cosmjs/encoding";

// Add the Keplr type to the Window interface
declare global {
  interface Window {
    keplr?: any;
  }
}

// Define the staking steps
enum StakingStep {
  FORM_INPUT = 0,
  ENCODE_BTC_TX = 1,
  SIGN_BABYLON_ADDRESS = 2,
  SIGN_BTC_PSBTS = 3,
  ENCODE_BABYLON_TX = 4,
  SIGN_BABYLON_TX = 5,
  BROADCAST_BABYLON_TX = 6, // Commented out as requested
  COMPLETE = 7, // Keep as 7 to maintain existing references
}

const BITCOIN_CHAIN_ID = "bitcoin-signet";
const BABYLON_CHAIN_ID = "babylon-testnet";
const BABYLON_NATIVE_ID = "bbn-test-5";

export default function BabylonStakingPage() {
  const { toast } = useToast();

  // Add a state to track the current step
  const [currentStep, setCurrentStep] = useState<StakingStep>(
    StakingStep.FORM_INPUT
  );
  const [stepStatus, setStepStatus] = useState<
    Record<StakingStep, "pending" | "in-progress" | "complete" | "error">
  >({
    [StakingStep.FORM_INPUT]: "in-progress",
    [StakingStep.ENCODE_BTC_TX]: "pending",
    [StakingStep.SIGN_BABYLON_ADDRESS]: "pending",
    [StakingStep.SIGN_BTC_PSBTS]: "pending",
    [StakingStep.ENCODE_BABYLON_TX]: "pending",
    [StakingStep.SIGN_BABYLON_TX]: "pending",
    [StakingStep.BROADCAST_BABYLON_TX]: "pending",
    [StakingStep.COMPLETE]: "pending",
  });
  const [isNextButtonDisabled, setIsNextButtonDisabled] = useState(false);

  // Plain transaction data
  const [bitcoinTransactionData, setBitcoinTransactionData] =
    useState<any>(null);
  const [babylonTransactionData, setBabylonTransactionData] =
    useState<any>(null);

  // Encoded & signed data
  const [bitcoinSignedPsbts, setBitcoinSignedPsbts] = useState<string[]>([]);
  const [babylonTransactionSignature, setBabylonTransactionSignature] =
    useState<string>("");
  const [babylonAddressSignature, setBabylonAddressSignature] =
    useState<string>("");

  // Hooks
  const encodeTransaction = useEncodeTransaction();
  const broadcastTransaction = useBroadcastTransaction();

  // Existing states
  const [signingStatus, setSigningStatus] = useState<string>("");

  const [formData, setFormData] = useState({
    bitcoinAddress: "",
    bitcoinPubkey: "",
    babylonAddress: "",
    babylonPubkey: "",
    finalityProvider:
      "d23c2c25e1fcf8fd1c21b9a402c19e2e309e531e45e92fb1e9805b6056b0cc76",
    amount: "0.0005",
  });

  // Function to update step status
  const updateStepStatus = useCallback(
    (
      step: StakingStep,
      status: "pending" | "in-progress" | "complete" | "error"
    ) => {
      setStepStatus((prev) => ({
        ...prev,
        [step]: status,
      }));
    },
    []
  );

  // Function to handle next button click
  const handleNextStep = useCallback(async () => {
    setIsNextButtonDisabled(true);

    try {
      switch (currentStep) {
        case StakingStep.FORM_INPUT:
          updateStepStatus(StakingStep.FORM_INPUT, "in-progress");
          await fillFormInput();
          break;

        case StakingStep.ENCODE_BTC_TX:
          updateStepStatus(StakingStep.FORM_INPUT, "complete");
          updateStepStatus(StakingStep.ENCODE_BTC_TX, "in-progress");
          await handleEncodeBitcoinTransaction();
          break;

        case StakingStep.SIGN_BABYLON_ADDRESS:
          updateStepStatus(StakingStep.ENCODE_BTC_TX, "complete");
          updateStepStatus(StakingStep.SIGN_BABYLON_ADDRESS, "in-progress");
          await handleSignBabylonAddress();
          break;

        case StakingStep.SIGN_BTC_PSBTS:
          updateStepStatus(StakingStep.SIGN_BABYLON_ADDRESS, "complete");
          updateStepStatus(StakingStep.SIGN_BTC_PSBTS, "in-progress");
          await handleSignBitcoinPSBTs();
          break;

        case StakingStep.ENCODE_BABYLON_TX:
          updateStepStatus(StakingStep.SIGN_BTC_PSBTS, "complete");
          updateStepStatus(StakingStep.ENCODE_BABYLON_TX, "in-progress");
          await handleEncodeBabylonTransaction();
          break;

        case StakingStep.SIGN_BABYLON_TX:
          updateStepStatus(StakingStep.ENCODE_BABYLON_TX, "complete");
          updateStepStatus(StakingStep.SIGN_BABYLON_TX, "in-progress");
          await handleSignBabylonTransaction();
          break;

        case StakingStep.BROADCAST_BABYLON_TX:
          updateStepStatus(StakingStep.SIGN_BABYLON_TX, "complete");
          updateStepStatus(StakingStep.BROADCAST_BABYLON_TX, "in-progress");
          await handleBroadcastBabylonTransaction();
          break;

        case StakingStep.COMPLETE:
          updateStepStatus(StakingStep.BROADCAST_BABYLON_TX, "complete");
          await handleBroadcastBabylonTransaction();
          toast({
            title: "Success",
            description: "Staking process completed successfully!",
            variant: "default",
          });
          break;

        default:
          break;
      }
    } catch (error) {
      console.error(`Error at step ${currentStep}:`, error);
      updateStepStatus(currentStep, "error");
      toast({
        title: "Error",
        description: `Failed at step ${currentStep + 1}: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        variant: "destructive",
      });
    } finally {
      setIsNextButtonDisabled(false);
    }
  }, [currentStep, toast, updateStepStatus]);

  const fillFormInput = async () => {
    // Variables to store wallet data - will be populated either from form or direct API calls
    let bitcoinAddress = formData.bitcoinAddress;
    let bitcoinPubkey = formData.bitcoinPubkey;
    let babylonAddress = formData.babylonAddress;
    let babylonPubkey = formData.babylonPubkey;

    // Make sure we have the Bitcoin wallet information
    if (!bitcoinAddress || !bitcoinPubkey) {
      setSigningStatus("Connecting to Bitcoin wallet...");

      try {
        // Check if Unisat wallet is available
        if (!window.unisat) {
          throw new Error(
            "Unisat wallet not found. Please install the Unisat extension."
          );
        }

        // Connect to the Bitcoin Signet network
        await window.unisat.switchChain("BITCOIN_SIGNET");

        // Get Bitcoin accounts from Unisat
        const accounts = await window.unisat.requestAccounts();
        if (!accounts || accounts.length === 0) {
          throw new Error(
            "No Bitcoin accounts found. Please connect your Unisat wallet."
          );
        }

        // Get the public key for the first account
        const publicKey = await window.unisat.getPublicKey();

        // Store the values locally for immediate use
        bitcoinAddress = accounts[0];
        bitcoinPubkey = publicKey;

        console.log("Bitcoin wallet connected:", {
          address: bitcoinAddress,
          pubKey: bitcoinPubkey,
        });

        // Also update form data for future steps (async, won't affect current execution)
        setFormData((prev) => ({
          ...prev,
          bitcoinAddress,
          bitcoinPubkey,
        }));

        setSigningStatus("Found bitcoin account");
      } catch (error) {
        console.error("Failed to connect to Bitcoin wallet:", error);
        setSigningStatus("Failed to connect to Bitcoin wallet");
        throw new Error(
          "Please connect your Bitcoin wallet and ensure address and public key are available"
        );
      }
    }

    // Make sure we have the Babylon wallet information
    if (!babylonAddress || !babylonPubkey) {
      setSigningStatus("Connecting to Keplr wallet...");

      try {
        // First check if the Keplr browser extension is installed
        if (!window.keplr) {
          throw new Error(
            "Keplr wallet not found. Please install the Keplr wallet extension."
          );
        }

        // Enable the chain
        await window.keplr.enable(BABYLON_NATIVE_ID);

        // Get the offlineSigner for this chain
        const offlineSigner = await window.keplr.getOfflineSigner(
          BABYLON_NATIVE_ID
        );

        // Get accounts
        const accounts = await offlineSigner.getAccounts();
        if (!accounts || accounts.length === 0) {
          throw new Error("No Babylon accounts found in Keplr wallet");
        }

        // Use the first account
        babylonAddress = accounts[0].address;
        babylonPubkey = Buffer.from(accounts[0].pubkey).toString("hex");

        console.log(`Keplr ${BABYLON_NATIVE_ID} data:`, {
          address: babylonAddress,
          pubkey: babylonPubkey,
        });

        // Update form data with the Babylon address and pubkey
        setFormData((prev) => ({
          ...prev,
          babylonAddress,
          babylonPubkey,
        }));

        setSigningStatus("Found babylon account");
      } catch (error) {
        console.error("Failed to connect to Keplr wallet:", error);
        setSigningStatus("Failed to connect to Keplr wallet");
        throw new Error(
          "Please connect your Keplr wallet and ensure it supports the Babylon testnet"
        );
      }
    }

    setCurrentStep(StakingStep.ENCODE_BTC_TX);
  };

  // Step 1: Encode Bitcoin Transaction
  const handleEncodeBitcoinTransaction = async () => {
    setSigningStatus("Encoding Bitcoin staking transaction...");

    // Double-check that we have the required data before proceeding
    if (!formData.bitcoinAddress || !formData.bitcoinPubkey) {
      throw new Error("Bitcoin address and public key are required to proceed");
    }

    // Create transaction data for encoding - use direct values not state
    const bitcoinTransactionData: TransactionData = {
      chainId: BITCOIN_CHAIN_ID,
      mode: TransactionMode.STAKE,
      senderAddress: formData.bitcoinAddress,
      senderPubKey: formData.bitcoinPubkey,
      targetValidatorAddress: formData.finalityProvider,
      amount: amountToSmallestUnit(parseFloat(formData.amount), 8), // Convert BTC to satoshis (8 decimals)
      useMaxAmount: false,
    };

    console.log("Sending Bitcoin transaction data:", bitcoinTransactionData);

    return new Promise<void>((resolve, reject) => {
      encodeTransaction.mutate(bitcoinTransactionData, {
        onSuccess: (bitcoinData) => {
          console.log("Bitcoin transaction encoded successfully:", bitcoinData);

          // Extract PSBTs from response
          const params = bitcoinData.transaction?.data?.params;
          if (
            params?.stakingPsbt &&
            params?.slashingPsbt &&
            params?.unbondingTransaction &&
            params?.unbondingSlashingPsbt
          ) {
            setBitcoinTransactionData(bitcoinData);

            setSigningStatus("Bitcoin transaction encoded successfully");
            setCurrentStep(StakingStep.SIGN_BABYLON_ADDRESS);
            resolve();
          } else {
            reject(new Error("Required PSBTs not found in the response"));
          }
        },
        onError: (error) => {
          console.error("Error encoding Bitcoin transaction:", error);
          setSigningStatus("Failed to encode Bitcoin transaction");
          reject(error);
        },
      });
    });
  };

  // Step 2: Sign Babylon Address with Unisat
  const handleSignBabylonAddress = async () => {
    try {
      setSigningStatus("Getting Keplr account...");

      // If we still don't have a babylonAddress, something went wrong
      if (!formData.babylonAddress) {
        throw new Error("Could not get Babylon address from Keplr");
      }

      setSigningStatus("Signing Babylon address with Bitcoin wallet...");

      // Check if Unisat is available
      if (!window.unisat) {
        throw new Error(
          "Unisat wallet not found. Please install the Unisat extension."
        );
      }

      // Sign the keplr address with Unisat
      const addressSignature = await window.unisat.signMessage(
        formData.babylonAddress,
        "ecdsa"
      );

      console.log("Babylon address signed with Bitcoin wallet:", {
        address: formData.babylonAddress,
        signature: addressSignature,
      });

      setBabylonAddressSignature(addressSignature);
      setSigningStatus("Babylon address successfully signed");
      setCurrentStep(StakingStep.SIGN_BTC_PSBTS);
    } catch (error) {
      console.error(
        "Failed to sign Babylon address with Bitcoin wallet:",
        error
      );
      setSigningStatus("Failed to sign Babylon address with Bitcoin wallet");
      throw error;
    }
  };

  // Step 3: Sign Bitcoin PSBTs
  const handleSignBitcoinPSBTs = async () => {
    try {
      const signatures = await signPsbts([
        bitcoinTransactionData.transaction?.data?.params?.stakingPsbt,
        bitcoinTransactionData.transaction?.data?.params?.slashingPsbt,
        bitcoinTransactionData.transaction?.data?.params?.unbondingSlashingPsbt,
      ]);
      setBitcoinSignedPsbts(signatures);
      setSigningStatus("All PSBTs signed successfully");
      setCurrentStep(StakingStep.ENCODE_BABYLON_TX);
    } catch (error) {
      console.error("Failed to sign PSBTs:", error);
      setSigningStatus("Failed to sign PSBTs");
      throw error;
    }
  };

  // Step 4: Encode Babylon Registration Transaction
  const handleEncodeBabylonTransaction = async () => {
    try {
      setSigningStatus("Encoding Babylon stake registration transaction...");

      // If we still don't have a babylonAddress, something went wrong
      if (!formData.babylonAddress) {
        throw new Error("Could not get Babylon address from Keplr");
      }

      // Create transaction data for the Babylon stake registration
      const newBabylonTransactionData: TransactionData = {
        chainId: BABYLON_CHAIN_ID,
        mode: TransactionMode.REGISTER_STAKE,
        senderAddress: formData.babylonAddress,
        senderPubKey: formData.babylonPubkey,
        senderForeignPubKey: formData.bitcoinPubkey,
        recipientAddress: "", // Not used but needed to satisfy type
        useMaxAmount: false,
        amount: amountToSmallestUnit(parseFloat(formData.amount), 8).toString(), // Convert to string as expected by TransactionData
        proofOfPossession: Buffer.from(
          babylonAddressSignature,
          "base64"
        ).toString("hex"),
        validatorPubKey: formData.finalityProvider,
        unsignedUnbondingTransaction:
          bitcoinTransactionData.transaction?.data?.params
            ?.unbondingTransaction, // unsigned unbonding tx
        signedStakingTransaction: bitcoinSignedPsbts[0], // signed stakingPsbt
        signedSlashingTransaction: bitcoinSignedPsbts[1], // signed slashingPsbt
        signedUnbondingSlashingTransaction: bitcoinSignedPsbts[2], // signed unbondingSlashingPsbt
        format: "json",
      };

      return new Promise<void>((resolve, reject) => {
        encodeTransaction.mutate(newBabylonTransactionData, {
          onSuccess: (babylonData) => {
            console.log(
              "Babylon stake registration encoded successfully:",
              babylonData
            );
            setSigningStatus("Babylon transaction encoded successfully");

            setBabylonTransactionData(babylonData);

            setCurrentStep(StakingStep.SIGN_BABYLON_TX);
            resolve();
          },
          onError: (error) => {
            console.error("Error encoding Babylon transaction:", error);
            setSigningStatus("Failed to encode Babylon transaction");
            reject(error);
          },
        });
      });
    } catch (error) {
      console.error("Error preparing Babylon stake registration:", error);
      throw error;
    }
  };

  // Step 5: Sign Babylon Registration Transaction with Keplr
  const handleSignBabylonTransaction = async () => {
    try {
      setSigningStatus("Signing Babylon transaction with Keplr wallet...");

      // Check if Keplr is installed
      if (!window.keplr) {
        throw new Error(
          "Keplr wallet not found. Please install the Keplr wallet extension."
        );
      }

      // Make sure we have a Babylon address
      if (!formData.babylonAddress) {
        throw new Error("No Babylon address found");
      }

      // Extract the encoded transaction
      const encodedTransaction = babylonTransactionData.transaction?.encoded;

      if (!encodedTransaction) {
        throw new Error("No encoded transaction found in response");
      }

      // Enable Babylon chain
      await window.keplr.enable(BABYLON_NATIVE_ID);

      // Sign the transaction with Keplr
      const signResponse = await window.keplr.signDirect(
        BABYLON_NATIVE_ID,
        formData.babylonAddress,
        JSON.parse(encodedTransaction),
        { preferNoSetFee: true } // Tell Keplr not to recompute fees after us
      );

      if (!signResponse) {
        throw new Error("Failed to sign transaction with Keplr");
      }

      // Store the signature for the broadcast step
      const signature = Buffer.from(signResponse.signature.signature).toString(
        "hex"
      );
      setBabylonTransactionSignature(signature);

      console.log("Keplr signature:", signResponse);
      setSigningStatus("Babylon transaction successfully signed");
      setCurrentStep(StakingStep.BROADCAST_BABYLON_TX);
    } catch (error) {
      console.error("Error signing Babylon transaction with Keplr:", error);
      setSigningStatus("Failed to sign Babylon transaction with Keplr");
      throw error;
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Function to sign PSBTs one by one
  const signPsbts = async (psbts: string[]) => {
    try {
      const signatures = [];
      setSigningStatus("Signing PSBTs...");

      // Check if Unisat is available
      if (!window.unisat) {
        throw new Error(
          "Unisat wallet not found. Please install the Unisat extension."
        );
      }

      // Sign each PSBT sequentially
      for (let i = 0; i < psbts.length; i++) {
        setSigningStatus(`Signing PSBT ${i + 1} of ${psbts.length}...`);
        const psbt = psbts[i];

        try {
          const unisatParams = getSignPsbtDefaultOptions(
            psbt,
            formData.bitcoinPubkey,
            formData.bitcoinAddress,
            Network.SIGNET
          );

          // Sign the PSBT with Unisat
          const signedPsbt = await window.unisat.signPsbt(psbt, unisatParams);
          signatures.push(signedPsbt);
          console.log(`PSBT ${i + 1} signed:`, signedPsbt);
          setSigningStatus(`PSBT ${i + 1} signed successfully`);
        } catch (error) {
          console.error(`Error signing PSBT ${i + 1}:`, error);
          setSigningStatus(`Error signing PSBT ${i + 1}`);
          throw error;
        }
      }

      setSigningStatus("All PSBTs signed successfully");
      return signatures;
    } catch (error) {
      console.error("Error in signing process:", error);
      setSigningStatus("Signing failed");
      toast({
        title: "Error",
        description: `Failed to sign PSBTs: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        variant: "destructive",
      });
      throw error;
    }
  };

  // Step 6: Broadcast Babylon Registration Transaction
  const handleBroadcastBabylonTransaction = async () => {
    try {
      setSigningStatus("Broadcasting Babylon transaction...");

      // Check if we have the necessary data
      if (!babylonTransactionData || !babylonTransactionData.transaction) {
        throw new Error("No Babylon transaction data available");
      }

      if (!babylonTransactionSignature) {
        throw new Error("No signature available for broadcasting");
      }

      // Create the transaction object for broadcasting
      const transactionToSend = {
        data: {
          ...babylonTransactionData.transaction.data,
          chainId: BABYLON_CHAIN_ID,
        },
        encoded: babylonTransactionData.transaction.encoded,
        signature: babylonTransactionSignature,
      };

      console.log("Broadcasting transaction:", transactionToSend);

      // Return a promise to integrate with our step flow
      return new Promise<void>((resolve, reject) => {
        broadcastTransaction.mutate(transactionToSend, {
          onSuccess: (response) => {
            console.log("Broadcast response:", response);

            // Check if the response contains an error property (non-200 HTTP status)
            if (response.error) {
              // Extract error message from BackendErrorResponse
              let errorMessage = "Unknown error from API";

              if (
                response.error.status &&
                response.error.status.errors &&
                response.error.status.errors.length > 0
              ) {
                errorMessage = response.error.status.errors[0].message;
              }

              console.error("Error in broadcast response:", errorMessage);
              setSigningStatus(
                `Failed to broadcast transaction: ${errorMessage}`
              );
              updateStepStatus(StakingStep.BROADCAST_BABYLON_TX, "error");
              reject(new Error(errorMessage));
              return;
            }

            // If we have a transaction hash, it was successful
            if (response.hash) {
              console.log(
                "Transaction broadcasted successfully, hash:",
                response.hash
              );
              setSigningStatus(
                `Transaction broadcasted successfully. Hash: ${response.hash}`
              );
              setCurrentStep(StakingStep.COMPLETE);
              toast({
                title: "Success",
                description: "Staking process completed successfully!",
                variant: "default",
              });
              resolve();
            } else {
              // No error and no hash - this shouldn't happen but let's handle it
              const message =
                "Unexpected response from broadcast API: no hash and no error";
              console.error(message, response);
              setSigningStatus(message);
              updateStepStatus(StakingStep.BROADCAST_BABYLON_TX, "error");
              reject(new Error(message));
            }
          },
          onError: (error) => {
            console.error("Network error broadcasting transaction:", error);
            setSigningStatus(
              `Failed to broadcast transaction: ${
                error instanceof Error ? error.message : "Network error"
              }`
            );
            reject(error);
          },
        });
      });
    } catch (error) {
      console.error("Error preparing transaction for broadcast:", error);
      setSigningStatus("Failed to prepare transaction for broadcast");
      throw error;
    }
  };

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 max-h-[100vh] overflow-y-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <h1 className="text-lg font-semibold md:text-2xl">Babylon Staking</h1>
          <Tooltip text="Stake your BTC in the Babylon protocol">
            <Info className="w-4 h-4 ml-2 text-gray-500 cursor-pointer" />
          </Tooltip>
        </div>
        <WalletSelection />
      </div>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Stake Your Bitcoins</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Form always displayed at the top but disabled after first step */}
          <form className="space-y-6 mb-8">
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="bitcoinAddress">Bitcoin address</Label>
                <Input
                  id="bitcoinAddress"
                  name="bitcoinAddress"
                  placeholder="Enter your Bitcoin address"
                  value={formData.bitcoinAddress}
                  onChange={handleInputChange}
                  disabled={currentStep !== StakingStep.FORM_INPUT}
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="babylonAddress">Babylon address</Label>
                <Input
                  id="babylonAddress"
                  name="babylonAddress"
                  placeholder="Enter your Babylon address"
                  value={formData.babylonAddress}
                  onChange={handleInputChange}
                  disabled={currentStep !== StakingStep.FORM_INPUT}
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="finalityProvider">Finality provider</Label>
                <Input
                  id="finalityProvider"
                  name="finalityProvider"
                  placeholder="Enter finality provider"
                  value={formData.finalityProvider}
                  onChange={handleInputChange}
                  disabled={currentStep !== StakingStep.FORM_INPUT}
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="amount">Amount (sBTC)</Label>
                <Input
                  id="amount"
                  name="amount"
                  type="number"
                  step="0.00000001"
                  min="0.00000001"
                  placeholder="Enter amount to stake"
                  value={formData.amount}
                  onChange={handleInputChange}
                  disabled={currentStep !== StakingStep.FORM_INPUT}
                  required
                />
              </div>
            </div>
          </form>

          {/* Vertical step indicator */}
          <div className="mb-8 border rounded-lg p-4">
            <h3 className="text-md font-medium mb-4">Staking Process</h3>
            <div className="space-y-4">
              {Object.values(StakingStep)
                .filter((step) => typeof step === "number")
                .map((step) => {
                  if (typeof step === "number" && step < StakingStep.COMPLETE) {
                    const status = stepStatus[step as StakingStep];
                    const isActive = currentStep === step;

                    let stepLabel = "";
                    if (step === StakingStep.FORM_INPUT)
                      stepLabel = "Fill staking details";
                    else if (step === StakingStep.ENCODE_BTC_TX)
                      stepLabel = "Encode Bitcoin transaction";
                    else if (step === StakingStep.SIGN_BABYLON_ADDRESS)
                      stepLabel = "Sign Babylon address";
                    else if (step === StakingStep.SIGN_BTC_PSBTS)
                      stepLabel = "Sign Bitcoin PSBTs";
                    else if (step === StakingStep.ENCODE_BABYLON_TX)
                      stepLabel = "Encode Babylon transaction";
                    else if (step === StakingStep.SIGN_BABYLON_TX)
                      stepLabel = "Sign Babylon transaction";
                    else if (step === StakingStep.BROADCAST_BABYLON_TX)
                      stepLabel = "Broadcast Babylon transaction";

                    return (
                      <div key={step} className="flex items-center">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 flex-shrink-0 ${
                            status === "complete"
                              ? "bg-green-500 text-white"
                              : status === "in-progress"
                              ? "bg-blue-500 text-white"
                              : status === "error"
                              ? "bg-red-500 text-white"
                              : "bg-gray-200 text-gray-500"
                          }`}
                        >
                          {status === "complete" ? (
                            <Check className="w-4 h-4" />
                          ) : (
                            <span>{step + 1}</span>
                          )}
                        </div>
                        <div className="flex-grow">
                          <div
                            className={`font-medium ${
                              isActive ? "text-blue-600" : ""
                            }`}
                          >
                            {stepLabel}
                          </div>
                          {isActive &&
                            currentStep !== StakingStep.FORM_INPUT && (
                              <div className="text-sm text-gray-500 mt-1">
                                {signingStatus}
                              </div>
                            )}
                        </div>
                      </div>
                    );
                  }
                  return null;
                })}

              {/* Completion step */}
              {currentStep === StakingStep.COMPLETE && (
                <div className="flex items-center">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center mr-3 flex-shrink-0 bg-green-500 text-white">
                    <Check className="w-4 h-4" />
                  </div>
                  <div className="flex-grow">
                    <div className="font-medium">Staking complete!</div>
                    <div className="text-sm text-gray-500 mt-1">
                      Your Bitcoin has been successfully staked in the Babylon
                      protocol.
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Next Button (always shown except on completion) */}
          {currentStep !== StakingStep.COMPLETE && (
            <Button
              className="w-full mt-6 bg-blue-600 hover:bg-blue-700"
              disabled={isNextButtonDisabled || encodeTransaction.isPending}
              onClick={handleNextStep}
            >
              {isNextButtonDisabled || encodeTransaction.isPending ? (
                "Processing..."
              ) : (
                <div className="flex items-center justify-center">
                  <span>
                    {currentStep === StakingStep.FORM_INPUT
                      ? "Start Staking"
                      : "Next Step"}
                  </span>
                  <ArrowRight className="ml-2 w-4 h-4" />
                </div>
              )}
            </Button>
          )}

          {/* Success Message on Completion */}
          {currentStep === StakingStep.COMPLETE && (
            <div className="mt-6 text-center">
              <div className="mb-4 inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-100">
                <Check className="w-6 h-6 text-green-600" />
              </div>
              <h2 className="text-lg font-medium text-gray-900">
                Staking Complete!
              </h2>
              <p className="mt-2 text-sm text-gray-500">
                Your Bitcoin has been successfully staked in the Babylon
                protocol.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
