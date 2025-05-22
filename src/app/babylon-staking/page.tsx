"use client";

import { useWalletClient } from "@cosmos-kit/react-lite";
import { ArrowRight, Check, Info, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ValidatorSelector } from "~/app/stake/ValidatorSelector";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Tooltip } from "~/components/ui/tooltip";
import { useToast } from "~/components/ui/use-toast";
import { getSignPsbtDefaultOptions, Network } from "~/components/wallets/utils";
import { WalletSelection } from "~/components/wallets/WalletSelection";
import { useBroadcastTransaction } from "~/hooks/useBroadcastTransaction";
import { useEncodeTransaction } from "~/hooks/useEncodeTransaction";
import { useValidators } from "~/hooks/useValidators";
import { amountToSmallestUnit } from "~/utils/helper";
import { TransactionData, TransactionMode, Validator } from "~/utils/types";

// Define the staking steps
enum StakingStep {
  FORM_INPUT = 0,
  ENCODE_BTC_TX = 1,
  SIGN_BTC_PSBTS = 2,
  SIGN_BABYLON_ADDRESS = 3,
  ENCODE_BABYLON_TX = 4,
  SIGN_BABYLON_TX = 5,
  BROADCAST_BABYLON_TX = 6,
  BROADCAST_BITCOIN_TX = 7,
  COMPLETE = 8,
}

const getBabylonNativeId = (babylonChainId: string): string => {
  switch (babylonChainId) {
    case "babylon":
      return "bbn-1";
    case "babylon-testnet":
      return "bbn-test-5";
    default:
      throw new Error(`Unsupported Babylon chain ID: ${babylonChainId}`);
  }
};

const MERIA_VALIDATOR_MAINNET_ADDRESS =
  "a1f39ed29581fb6ad54be8cdf1a8838b3429e87bdfdd2652c47946221c360f10";
const MERIA_VALIDATOR_TESTNET_ADDRESS =
  "5cae74c45754c89c3a225163a2176de64c25719fbf358b02ef79bf8b0e23f40f";

export default function BabylonStakingPage() {
  const { toast } = useToast();

  const { status, client: keplrClient } = useWalletClient("keplr-extension");

  // Add a state to track the current step
  const [currentStep, setCurrentStep] = useState<StakingStep>(
    StakingStep.FORM_INPUT
  );
  // Add state for Bitcoin chain ID
  const [bitcoinChainId, setBitcoinChainId] = useState<string | undefined>(
    undefined
  );

  // Add state for Babylon chain ID
  const [babylonChainId, setBabylonChainId] = useState<string | undefined>(
    undefined
  );

  const [stepStatus, setStepStatus] = useState<
    Record<StakingStep, "pending" | "in-progress" | "complete" | "error">
  >({
    [StakingStep.FORM_INPUT]: "in-progress",
    [StakingStep.ENCODE_BTC_TX]: "pending",
    [StakingStep.SIGN_BTC_PSBTS]: "pending",
    [StakingStep.SIGN_BABYLON_ADDRESS]: "pending",
    [StakingStep.ENCODE_BABYLON_TX]: "pending",
    [StakingStep.SIGN_BABYLON_TX]: "pending",
    [StakingStep.BROADCAST_BABYLON_TX]: "pending",
    [StakingStep.BROADCAST_BITCOIN_TX]: "pending",
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
    finalityProvider: "",
    amount: "",
  });

  // Fetch the bitcoin chain's validators (finality providers)
  const { data: validatorsData, isLoading: isValidatorsLoading } =
    useValidators({ chainId: bitcoinChainId });

  // Need to convert them to the expected Validator type
  const validators = useMemo(() => {
    if (!validatorsData) return [];

    return validatorsData.validators.map((validator) => ({
      chainId: validatorsData.chainId,
      address: validator.address,
      name: validator.name || validator.address.substring(0, 10) + "...",
      commission: parseFloat(validator.commission),
      stakedAmount: parseFloat(validator.stakedAmount),
      chainName:
        bitcoinChainId === "bitcoin" ? "Bitcoin Mainnet" : "Bitcoin Signet",
      decimals: 8,
      ticker: bitcoinChainId === "bitcoin" ? "BTC" : "sBTC",
      chainLogo:
        bitcoinChainId === "bitcoin" ? "/assets/btc.svg" : "/assets/sbtc.svg",
    }));
  }, [validatorsData, bitcoinChainId]);

  // Set the appropriate amount and validator address based on the chain
  useEffect(() => {
    if (bitcoinChainId && validators.length > 0) {
      const amount =
        formData.amount ||
        // Higher minimum on bitcoin mainnet that on testnet
        (bitcoinChainId === "bitcoin" ? "0.005" : "0.0005");

      // FIXME Validator is only set by default, user can't actually choose
      const meriaAddress =
        bitcoinChainId === "bitcoin"
          ? MERIA_VALIDATOR_MAINNET_ADDRESS
          : MERIA_VALIDATOR_TESTNET_ADDRESS;

      // Check if MERIA validator exists in the list
      const meriaValidator = validators.find((v) => v.address === meriaAddress);

      // Use MERIA validator if found, otherwise use the first validator
      const selectedValidator = meriaValidator
        ? meriaValidator.address
        : validators[0].address;

      setFormData((prev) => ({
        ...prev,
        finalityProvider: selectedValidator,
        amount,
      }));
    }
  }, [bitcoinChainId, validators, formData.amount]);

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

  const fillFormInput = useCallback(async () => {
    let selectedBitcoinChainId: string | undefined = undefined;
    let selectedBabylonChainId: string | undefined = undefined;

    // Variables to store wallet data - will be populated either from form or direct API calls
    let bitcoinAddress = formData.bitcoinAddress;
    let bitcoinPubkey = formData.bitcoinPubkey;
    let babylonAddress = formData.babylonAddress;
    let babylonPubkey = formData.babylonPubkey;

    // Make sure we have the Bitcoin wallet information
    if (!bitcoinAddress || !bitcoinPubkey) {
      setSigningStatus("Connecting to Bitcoin wallet...");

      // Check if Unisat wallet is available
      if (!window.unisat) {
        throw new Error(
          "Unisat wallet not found. Please install the Unisat extension."
        );
      }

      let chainInfo;
      // Get the current Bitcoin chain from Unisat
      try {
        chainInfo = await window.unisat.getChain();
      } catch (error) {
        console.error("Failed to connect to Bitcoin wallet:", error);
        setSigningStatus("Failed to connect to Bitcoin wallet");
        throw new Error("Failed to connect to Unisat wallet.");
      }

      // Explicitly handle only BITCOIN_MAINNET and BITCOIN_SIGNET
      if (chainInfo.enum === "BITCOIN_MAINNET") {
        selectedBitcoinChainId = "bitcoin";
        selectedBabylonChainId = "babylon";
        setBitcoinChainId(selectedBitcoinChainId);
        setBabylonChainId(selectedBabylonChainId);
        console.log(`Connected to ${chainInfo.name}`);
      } else if (chainInfo.enum === "BITCOIN_SIGNET") {
        selectedBitcoinChainId = "bitcoin-signet";
        selectedBabylonChainId = "babylon-testnet";
        setBitcoinChainId(selectedBitcoinChainId);
        setBabylonChainId(selectedBabylonChainId);
        console.log(`Connected to ${chainInfo.name}`);
      } else {
        // Any other chain type (like testnet) is not supported
        console.error(`Unsupported Bitcoin chain: ${chainInfo.enum}`);
        throw new Error(
          `Unsupported chain selected in Unisat wallet: ${chainInfo.name}. Please use Bitcoin Mainnet or Signet.`
        );
      }

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
        chain: selectedBitcoinChainId,
      });

      // Also update form data for future steps (async, won't affect current execution)
      setFormData((prev) => ({
        ...prev,
        bitcoinAddress,
        bitcoinPubkey,
      }));

      setSigningStatus("Found bitcoin account");
    }

    // Make sure we have the Babylon wallet information
    if (!babylonAddress || !babylonPubkey) {
      setSigningStatus("Connecting to Keplr wallet...");

      if (!selectedBabylonChainId) {
        throw new Error(
          "Babylon chain ID is not set. Please reconnect your wallet."
        );
      }

      try {
        // Check if Keplr client is available
        if (!keplrClient) {
          throw new Error(
            "Keplr wallet not found. Please install the Keplr wallet extension."
          );
        }

        // Get the offline signer
        const offlineSigner = await keplrClient.getOfflineSigner?.(
          getBabylonNativeId(selectedBabylonChainId)
        );
        if (!offlineSigner) {
          throw new Error("Failed to get offline signer");
        }

        // Get accounts from the signer
        const accounts = await offlineSigner.getAccounts();
        if (!accounts || accounts.length === 0) {
          throw new Error("No Babylon accounts found in wallet");
        }

        // Use the first account
        babylonAddress = accounts[0].address;
        babylonPubkey = Buffer.from(accounts[0].pubkey).toString("hex");

        console.log(`Babylon wallet data:`, {
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
        console.error("Failed to connect to Babylon wallet:", error);
        setSigningStatus("Failed to connect to Babylon wallet");
        throw new Error(
          "Please connect your wallet and ensure it supports the Babylon chain"
        );
      }
    }

    setCurrentStep(StakingStep.ENCODE_BTC_TX);
  }, [formData, setFormData, setSigningStatus, setCurrentStep, keplrClient]);

  // Step 1: Encode Bitcoin Transaction
  const handleEncodeBitcoinTransaction = useCallback(async () => {
    setSigningStatus("Encoding Bitcoin staking transaction...");

    // Double-check that we have the required data before proceeding
    if (!formData.bitcoinAddress || !formData.bitcoinPubkey) {
      throw new Error("Bitcoin address and public key are required to proceed");
    }

    if (!bitcoinChainId) {
      throw new Error(
        "Bitcoin chain ID is not set. Please reconnect your wallet."
      );
    }

    // Create transaction data for encoding - use direct values not state
    const bitcoinTransactionData: TransactionData = {
      chainId: bitcoinChainId,
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
            setCurrentStep(StakingStep.SIGN_BTC_PSBTS);
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
  }, [
    formData,
    setBitcoinTransactionData,
    setSigningStatus,
    setCurrentStep,
    encodeTransaction,
    bitcoinChainId,
  ]);

  // Step 2: Sign Bitcoin PSBTs
  const handleSignBitcoinPSBTs = useCallback(async () => {
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
              bitcoinChainId === "bitcoin-signet"
                ? Network.SIGNET
                : Network.MAINNET
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

    try {
      const signatures = await signPsbts([
        bitcoinTransactionData.transaction?.data?.params?.stakingPsbt,
        bitcoinTransactionData.transaction?.data?.params?.slashingPsbt,
        bitcoinTransactionData.transaction?.data?.params?.unbondingSlashingPsbt,
      ]);

      setBitcoinSignedPsbts(signatures);
      setSigningStatus("All PSBTs signed successfully");
      setCurrentStep(StakingStep.SIGN_BABYLON_ADDRESS);
    } catch (error) {
      console.error("Failed to sign PSBTs:", error);
      setSigningStatus("Failed to sign PSBTs");
      throw error;
    }
  }, [
    bitcoinChainId,
    bitcoinTransactionData,
    setBitcoinSignedPsbts,
    setSigningStatus,
    setCurrentStep,
    formData.bitcoinAddress,
    formData.bitcoinPubkey,

    toast,
  ]);

  // Step 3: Sign Babylon Address with Unisat
  const handleSignBabylonAddress = useCallback(async () => {
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
      setCurrentStep(StakingStep.ENCODE_BABYLON_TX);
    } catch (error) {
      console.error(
        "Failed to sign Babylon address with Bitcoin wallet:",
        error
      );
      setSigningStatus("Failed to sign Babylon address with Bitcoin wallet");
      throw error;
    }
  }, [
    formData.babylonAddress,
    setBabylonAddressSignature,
    setSigningStatus,
    setCurrentStep,
  ]);

  // Step 4: Encode Babylon Registration Transaction
  const handleEncodeBabylonTransaction = useCallback(async () => {
    try {
      setSigningStatus("Encoding Babylon stake registration transaction...");

      // If we still don't have a babylonAddress, something went wrong
      if (!formData.babylonAddress) {
        throw new Error("Could not get Babylon address from Keplr");
      }

      // Check if we have determined the Babylon chain
      if (!babylonChainId) {
        throw new Error(
          "Babylon chain ID is not set. Please reconnect your wallet."
        );
      }

      // Create transaction data for the Babylon stake registration
      const newBabylonTransactionData: TransactionData = {
        chainId: babylonChainId,
        mode: TransactionMode.REGISTER_STAKE,
        senderAddress: formData.babylonAddress,
        senderPubKey: formData.babylonPubkey,
        senderForeignPubKey: formData.bitcoinPubkey,
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
  }, [
    formData,
    babylonAddressSignature,
    bitcoinTransactionData,
    bitcoinSignedPsbts,
    setBabylonTransactionData,
    setSigningStatus,
    setCurrentStep,
    encodeTransaction,
    babylonChainId,
  ]);

  // Step 5: Sign Babylon Registration Transaction with Keplr
  const handleSignBabylonTransaction = useCallback(async () => {
    try {
      setSigningStatus("Signing Babylon transaction with Keplr wallet...");

      // Check if Keplr client is available
      if (!keplrClient) {
        throw new Error(
          "Keplr wallet not found. Please install the Keplr wallet extension."
        );
      }

      // Check if we have determined the Babylon chain
      if (!babylonChainId) {
        throw new Error(
          "Babylon chain ID is not set. Please reconnect your wallet."
        );
      }

      // Make sure we have a Babylon address
      if (!formData.babylonAddress) {
        throw new Error("No Babylon address found");
      }

      // Extract the encoded transaction
      const encodedTransaction =
        babylonTransactionData.transaction?.encoded.find(
          (encoded: any) => encoded.raw?.format === "SIGNDOC_DIRECT_JSON"
        );

      if (!encodedTransaction || !encodedTransaction.raw?.value) {
        throw new Error("No transaction to sign found");
      }

      // Sign the transaction with Keplr client
      const signResponse = await keplrClient.signDirect?.(
        getBabylonNativeId(babylonChainId),
        formData.babylonAddress,
        JSON.parse(encodedTransaction),
        { preferNoSetFee: true, preferNoSetMemo: true } // Tell Keplr not to recompute fees after us
      );

      if (!signResponse) {
        throw new Error("Failed to sign transaction with Keplr");
      }

      console.log("Transaction signature:", signResponse);
      setBabylonTransactionSignature(signResponse.signature.signature);

      setSigningStatus("Babylon transaction successfully signed");
      setCurrentStep(StakingStep.BROADCAST_BABYLON_TX);
    } catch (error) {
      console.error("Error signing Babylon transaction:", error);
      setSigningStatus("Failed to sign Babylon transaction");
      throw error;
    }
  }, [
    formData.babylonAddress,
    babylonTransactionData,
    setBabylonTransactionSignature,
    setSigningStatus,
    setCurrentStep,
    keplrClient,
    babylonChainId,
  ]);

  // Step 6: Broadcast Babylon Registration Transaction
  const handleBroadcastBabylonTransaction = useCallback(async () => {
    try {
      setSigningStatus("Broadcasting Babylon transaction...");

      // Check if we have the necessary data
      if (!babylonTransactionData || !babylonTransactionData.transaction) {
        throw new Error("No Babylon transaction data available");
      }

      if (!babylonTransactionSignature) {
        throw new Error("No signature available for broadcasting");
      }

      if (!babylonChainId) {
        throw new Error(
          "Babylon chain ID is not set. Please reconnect your wallet."
        );
      }

      // Create the transaction object for broadcasting
      const transactionToSend = {
        data: {
          ...babylonTransactionData.transaction.data,
          chainId: babylonChainId,
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
              setSigningStatus(`Babylon transaction broadcasted successfully`);
              updateStepStatus(StakingStep.BROADCAST_BABYLON_TX, "complete");
              setCurrentStep(StakingStep.BROADCAST_BITCOIN_TX);
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
  }, [
    babylonTransactionData,
    babylonTransactionSignature,
    setSigningStatus,
    updateStepStatus,
    setCurrentStep,
    broadcastTransaction,
    babylonChainId,
  ]);

  // Step 7: Broadcast Bitcoin Staking Transaction
  const handleBroadcastBitcoinTransaction = useCallback(async () => {
    try {
      setSigningStatus("Broadcasting Bitcoin transaction...");

      // Check if we have the necessary data
      if (!bitcoinTransactionData || !bitcoinTransactionData.transaction) {
        throw new Error("No Bitcoin transaction data available");
      }

      if (!bitcoinSignedPsbts || bitcoinSignedPsbts.length === 0) {
        throw new Error("No signed Bitcoin PSBTs available for broadcasting");
      }

      if (!bitcoinChainId) {
        throw new Error(
          "Bitcoin chain ID is not set. Please reconnect your wallet."
        );
      }

      // Create the transaction object for broadcasting
      const transactionToSend = {
        data: {
          ...bitcoinTransactionData.transaction.data,
          chainId: bitcoinChainId,
        },
        encoded: bitcoinTransactionData.transaction.data.params.stakingPsbt,
        signature: bitcoinSignedPsbts[0],
      };

      console.log("Broadcasting Bitcoin transaction:", transactionToSend);

      // Return a promise to integrate with our step flow
      return new Promise<void>((resolve, reject) => {
        broadcastTransaction.mutate(transactionToSend, {
          onSuccess: (response) => {
            console.log("Bitcoin broadcast response:", response);

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

              console.error(
                "Error in Bitcoin broadcast response:",
                errorMessage
              );
              setSigningStatus(
                `Failed to broadcast Bitcoin transaction: ${errorMessage}`
              );
              updateStepStatus(StakingStep.BROADCAST_BITCOIN_TX, "error");
              reject(new Error(errorMessage));
              return;
            }

            // If we have a transaction hash, it was successful
            if (response.hash) {
              console.log(
                "Bitcoin transaction broadcasted successfully, hash:",
                response.hash
              );
              setSigningStatus(`Bitcoin transaction broadcasted successfully`);
              updateStepStatus(StakingStep.BROADCAST_BITCOIN_TX, "complete");
              setCurrentStep(StakingStep.COMPLETE);
              toast({
                title: "Success",
                description: "Bitcoin transaction broadcasted successfully!",
                variant: "default",
              });
              resolve();
            } else {
              // No error and no hash - this shouldn't happen but let's handle it
              const message =
                "Unexpected response from broadcast API: no hash and no error";
              console.error(message, response);
              setSigningStatus(message);
              updateStepStatus(StakingStep.BROADCAST_BITCOIN_TX, "error");
              reject(new Error(message));
            }
          },
          onError: (error) => {
            console.error(
              "Network error broadcasting Bitcoin transaction:",
              error
            );
            setSigningStatus(
              `Failed to broadcast Bitcoin transaction: ${
                error instanceof Error ? error.message : "Network error"
              }`
            );
            reject(error);
          },
        });
      });
    } catch (error) {
      console.error(
        "Error preparing Bitcoin transaction for broadcast:",
        error
      );
      setSigningStatus("Failed to prepare Bitcoin transaction for broadcast");
      throw error;
    }
  }, [
    bitcoinTransactionData,
    bitcoinSignedPsbts,
    setSigningStatus,
    updateStepStatus,
    setCurrentStep,
    toast,
    broadcastTransaction,
    bitcoinChainId,
  ]);

  // Function to handle validator selection
  const handleValidatorSelect = useCallback(
    (validator: Validator) => {
      setFormData((prev) => ({
        ...prev,
        finalityProvider: validator.address,
      }));
    },
    [setFormData]
  );

  // Function to reset the form to initial state
  const handleReset = useCallback(() => {
    // Reset step and status tracking
    setCurrentStep(StakingStep.FORM_INPUT);
    setStepStatus({
      [StakingStep.FORM_INPUT]: "in-progress",
      [StakingStep.ENCODE_BTC_TX]: "pending",
      [StakingStep.SIGN_BTC_PSBTS]: "pending",
      [StakingStep.SIGN_BABYLON_ADDRESS]: "pending",
      [StakingStep.ENCODE_BABYLON_TX]: "pending",
      [StakingStep.SIGN_BABYLON_TX]: "pending",
      [StakingStep.BROADCAST_BABYLON_TX]: "pending",
      [StakingStep.BROADCAST_BITCOIN_TX]: "pending",
      [StakingStep.COMPLETE]: "pending",
    });

    // Reset chain IDs
    setBitcoinChainId(undefined);
    setBabylonChainId(undefined);

    // Reset transaction data
    setBitcoinTransactionData(null);
    setBabylonTransactionData(null);
    setBitcoinSignedPsbts([]);
    setBabylonTransactionSignature("");
    setBabylonAddressSignature("");

    // Reset UI state
    setSigningStatus("");
    setIsNextButtonDisabled(false);

    // Reset form data to initial values
    setFormData({
      bitcoinAddress: "",
      bitcoinPubkey: "",
      babylonAddress: "",
      babylonPubkey: "",
      finalityProvider: "",
      amount: "",
    });
  }, [
    setCurrentStep,
    setStepStatus,
    setBitcoinChainId,
    setBabylonChainId,
    setBitcoinTransactionData,
    setBabylonTransactionData,
    setBitcoinSignedPsbts,
    setBabylonTransactionSignature,
    setBabylonAddressSignature,
    setSigningStatus,
    setIsNextButtonDisabled,
    setFormData,
  ]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

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

        case StakingStep.SIGN_BTC_PSBTS:
          updateStepStatus(StakingStep.ENCODE_BTC_TX, "complete");
          updateStepStatus(StakingStep.SIGN_BTC_PSBTS, "in-progress");
          await handleSignBitcoinPSBTs();
          break;

        case StakingStep.SIGN_BABYLON_ADDRESS:
          updateStepStatus(StakingStep.SIGN_BTC_PSBTS, "complete");
          updateStepStatus(StakingStep.SIGN_BABYLON_ADDRESS, "in-progress");
          await handleSignBabylonAddress();
          break;

        case StakingStep.ENCODE_BABYLON_TX:
          updateStepStatus(StakingStep.SIGN_BABYLON_ADDRESS, "complete");
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

        case StakingStep.BROADCAST_BITCOIN_TX:
          updateStepStatus(StakingStep.BROADCAST_BABYLON_TX, "complete");
          updateStepStatus(StakingStep.BROADCAST_BITCOIN_TX, "in-progress");
          await handleBroadcastBitcoinTransaction();
          break;

        case StakingStep.COMPLETE:
          updateStepStatus(StakingStep.BROADCAST_BITCOIN_TX, "complete");
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
  }, [
    currentStep,
    toast,
    updateStepStatus,
    fillFormInput,
    handleEncodeBitcoinTransaction,
    handleSignBitcoinPSBTs,
    handleSignBabylonAddress,
    handleEncodeBabylonTransaction,
    handleSignBabylonTransaction,
    handleBroadcastBabylonTransaction,
    handleBroadcastBitcoinTransaction,
    setIsNextButtonDisabled,
  ]);

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
          <div className="flex items-center justify-between">
            <CardTitle>Stake Your Bitcoins</CardTitle>
            <Tooltip text="Restart">
              <Button onClick={handleReset} className="p-2 h-8 w-8">
                <RefreshCw className="hover:animate-spin w-4 h-4" />
              </Button>
            </Tooltip>
          </div>
        </CardHeader>
        <CardContent>
          {/* Form always displayed at the top but disabled after first step */}
          <form className="mb-8">
            <div className="grid grid-cols-2 gap-x-6 gap-y-4">
              {/* Bitcoin Address Field */}
              <div className="w-full">
                <div className="flex items-center gap-2 mb-2">
                  <Label htmlFor="bitcoinAddress">Bitcoin address</Label>
                  {bitcoinChainId && (
                    <Badge
                      className={`text-xs font-medium ${
                        bitcoinChainId === "bitcoin"
                          ? "bg-amber-200 text-amber-800 hover:bg-amber-200"
                          : "bg-green-200 text-green-800 hover:bg-green-200"
                      }`}
                    >
                      {bitcoinChainId === "bitcoin" ? "Mainnet" : "Signet"}
                    </Badge>
                  )}
                </div>
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

              {/* Babylon Address Field */}
              <div className="w-full">
                <div className="flex items-center gap-2 mb-2">
                  <Label htmlFor="babylonAddress">Babylon address</Label>
                  {babylonChainId && (
                    <Badge
                      className={`text-xs font-medium ${
                        babylonChainId === "babylon"
                          ? "bg-amber-200 text-amber-800 hover:bg-amber-200"
                          : "bg-green-200 text-green-800 hover:bg-green-200"
                      }`}
                    >
                      {babylonChainId === "babylon" ? "Mainnet" : "Testnet"}
                    </Badge>
                  )}
                </div>
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

              {/* Amount Field */}
              <div className="w-full">
                <Label htmlFor="amount" className="block mb-2">
                  Amount (sBTC)
                </Label>
                <Input
                  id="amount"
                  name="amount"
                  type="number"
                  step="0.0001"
                  min="0.0001"
                  placeholder="Enter amount to stake"
                  value={formData.amount}
                  onChange={handleInputChange}
                  disabled={currentStep !== StakingStep.FORM_INPUT}
                  required
                />
              </div>

              {/* Finality Provider Field */}
              <div className="w-full">
                <div className="flex items-center gap-2 mb-2">
                  <Label htmlFor="finalityProvider">Finality provider</Label>
                  {isValidatorsLoading && (
                    <span className="text-xs text-gray-500">
                      Loading validators...
                    </span>
                  )}
                </div>
                <div className="h-10 flex items-center">
                  <ValidatorSelector
                    validators={validators}
                    selectedValue={validators.find(
                      (v) => v.address === formData.finalityProvider
                    )}
                    onSelect={(validator) => handleValidatorSelect(validator)}
                    compact={true}
                  />
                </div>
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
                    else if (step === StakingStep.SIGN_BTC_PSBTS)
                      stepLabel = "Sign Bitcoin PSBTs";
                    else if (step === StakingStep.SIGN_BABYLON_ADDRESS)
                      stepLabel = "Sign Babylon address";
                    else if (step === StakingStep.ENCODE_BABYLON_TX)
                      stepLabel = "Encode Babylon transaction";
                    else if (step === StakingStep.SIGN_BABYLON_TX)
                      stepLabel = "Sign Babylon transaction";
                    else if (step === StakingStep.BROADCAST_BABYLON_TX)
                      stepLabel = "Broadcast Babylon transaction";
                    else if (step === StakingStep.BROADCAST_BITCOIN_TX)
                      stepLabel = "Broadcast Bitcoin transaction";

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
              disabled={
                isNextButtonDisabled ||
                isValidatorsLoading ||
                encodeTransaction.isPending
              }
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
