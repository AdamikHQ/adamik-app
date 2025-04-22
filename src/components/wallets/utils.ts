import {
  Psbt,
  address as btcAddress,
  initEccLib,
  networks,
} from "bitcoinjs-lib";
import * as ecc from "@bitcoin-js/tiny-secp256k1-asmjs";

export enum Network {
  MAINNET = "mainnet",
  CANARY = "canary",
  TESTNET = "testnet",
  SIGNET = "signet",
}

// From https://github.com/babylonlabs-io/wallet-connector/blob/015652062695c84b6fdff3f294f13114d46b48c7/src/core/wallets/btc/unisat/provider.ts#L107
export function getSignPsbtDefaultOptions(
  psbtHex: string,
  walletPubkey: string,
  walletAddress: string,
  network: Network
) {
  const toSignInputs: any[] = [];
  const psbt = Psbt.fromHex(psbtHex);
  psbt.data.inputs.forEach((input, index) => {
    let useTweakedSigner = false;
    if (input.witnessUtxo && input.witnessUtxo.script) {
      let btcNetwork = networks.bitcoin;

      if (network === Network.TESTNET || network === Network.SIGNET) {
        btcNetwork = networks.testnet;
      }

      let addressToBeSigned;
      try {
        addressToBeSigned = btcAddress.fromOutputScript(
          input.witnessUtxo.script,
          btcNetwork
        );
      } catch (error: Error | any) {
        if (
          error instanceof Error &&
          error.message.toLowerCase().includes("has no matching address")
        ) {
          initEccLib(ecc);
          console.log("XXX - (initBTCCurve called)");
          addressToBeSigned = btcAddress.fromOutputScript(
            input.witnessUtxo.script,
            btcNetwork
          );
        } else {
          throw new Error(error);
        }
      }
      // check if the address is a taproot address
      const isTaproot =
        addressToBeSigned.indexOf("tb1p") === 0 ||
        addressToBeSigned.indexOf("bc1p") === 0;
      // check if the address is the same as the wallet address
      const isWalletAddress = addressToBeSigned === walletAddress;
      // tweak the signer if needed
      if (isTaproot && isWalletAddress) {
        useTweakedSigner = true;
      }
    }

    const signed = input.finalScriptSig || input.finalScriptWitness;

    if (!signed) {
      toSignInputs.push({
        index,
        publicKey: walletPubkey,
        sighashTypes: undefined,
        useTweakedSigner,
      });
    }
  });

  return {
    autoFinalized: true,
    toSignInputs,
  };
}
