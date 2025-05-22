import { StarknetClient } from "@ledgerhq/hw-app-starknet";
import Transport from "@ledgerhq/hw-transport";
import TransportWebHID from "@ledgerhq/hw-transport-webhid";
import { useCallback, useEffect, useState } from "react";
import { encodePubkeyToAddress } from "~/api/adamik/encodePubkeyToAddress";

export const PATH = "m/2645'/1195502025'/1148870696'/0'/0'/0";

interface LedgerState {
  isConnected: boolean;
  isConnecting: boolean;
  transport: Transport | null;
  starknetClient: StarknetClient | null;
  publicKey: string | null;
  address: string | null;
  error: Error | null;
}

export const useLedger = () => {
  const [state, setState] = useState<LedgerState>({
    isConnected: false,
    isConnecting: false,
    address: null,
    transport: null,
    starknetClient: null,
    publicKey: null,
    error: null,
  });

  const connect = useCallback(async () => {
    setState((prev) => ({ ...prev, isConnecting: true, error: null }));
    const transport = await TransportWebHID.create();
    try {
      // Create transport
      const starknetClient = new StarknetClient(transport);

      const { starkKey } = await starknetClient.getStarkKey(PATH, false);
      const hex = Buffer.from(starkKey).toString("hex");
      const ledgerKey = `0x${hex}`;

      const { addresses } = await encodePubkeyToAddress("starknet", ledgerKey);
      console.log({
        addresses: addresses[0].address,
        length: addresses[0].address.length,
      });

      // Update state with new values
      setState({
        isConnected: true,
        isConnecting: false,
        transport,
        starknetClient,
        publicKey: ledgerKey,
        address: addresses[0].address,
        error: null,
      });

      return { transport, starknetClient, publicKey: ledgerKey };
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error
          : new Error("Failed to connect to Ledger");
      if (transport) {
        await transport.close();
      }
      setState((prev) => ({
        ...prev,
        isConnected: false,
        isConnecting: false,
        error: errorMessage,
      }));
      throw errorMessage;
    }
  }, []);

  const disconnect = useCallback(async () => {
    try {
      if (state.transport) {
        await state.transport.close();
      }
      setState({
        isConnected: false,
        isConnecting: false,
        transport: null,
        starknetClient: null,
        publicKey: null,
        address: null,
        error: null,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error
          : new Error("Failed to disconnect from Ledger");
      setState((prev) => ({
        ...prev,
        error: errorMessage,
      }));
      throw errorMessage;
    }
  }, [state.transport]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (state.transport) {
        state.transport.close().catch(console.error);
      }
    };
  }, [state.transport]);

  // Debug state changes
  useEffect(() => {
    console.log("Ledger state updated:", state);
  }, [state]);

  return {
    ...state,
    connect,
    disconnect,
  };
};
