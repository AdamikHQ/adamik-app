import { Turnkey } from "@turnkey/sdk-server";
import { BaseSigner } from "./types";
import { Chain } from "~/utils/types";
import { compressPublicKey } from "~/utils/publicKeyUtils";

export class TurnkeySigner implements BaseSigner {
  private turnkeyClient: Turnkey | null = null;
  public chainId: string;
  public signerSpec: any;
  public signerName = "Turnkey";
  private chain: Chain;
  private pubKey: string | undefined;
  private cachedAccounts: Map<string, string> = new Map();

  constructor(chainId: string, signerSpec: any, chain: Chain) {
    console.log("Initializing Turnkey signer for chain:", chainId);
    this.chainId = chainId;
    this.signerSpec = signerSpec;
    this.chain = chain;
  }

  private async initializeClient() {
    if (this.turnkeyClient) return;

    // In browser environment, use fetch API with proxy
    if (typeof window !== "undefined") {
      // Client-side initialization will use API proxy
      this.turnkeyClient = null; // Will use API proxy instead
    } else {
      // Server-side initialization (for API routes)
      if (!process.env.TURNKEY_BASE_URL) {
        throw new Error("TURNKEY_BASE_URL is not configured");
      }
      if (!process.env.TURNKEY_API_PUBLIC_KEY) {
        throw new Error("TURNKEY_API_PUBLIC_KEY is not configured");
      }
      if (!process.env.TURNKEY_API_PRIVATE_KEY) {
        throw new Error("TURNKEY_API_PRIVATE_KEY is not configured");
      }
      if (!process.env.TURNKEY_ORGANIZATION_ID) {
        throw new Error("TURNKEY_ORGANIZATION_ID is not configured");
      }

      this.turnkeyClient = new Turnkey({
        apiBaseUrl: process.env.TURNKEY_BASE_URL,
        apiPublicKey: process.env.TURNKEY_API_PUBLIC_KEY,
        apiPrivateKey: process.env.TURNKEY_API_PRIVATE_KEY,
        defaultOrganizationId: process.env.TURNKEY_ORGANIZATION_ID,
      });
    }
  }

  private convertAdamikCurveToTurnkeyCurve(
    curve: string
  ): "CURVE_SECP256K1" | "CURVE_ED25519" {
    switch (curve) {
      case "secp256k1":
        return "CURVE_SECP256K1";
      case "ed25519":
        return "CURVE_ED25519";
      default:
        throw new Error(`Unsupported curve: ${curve}`);
    }
  }

  private getCoinTypeFromDerivationPath(derivationPath: string): number | null {
    // Check if it's a valid BIP44 path
    if (!derivationPath.startsWith("m/")) {
      return null;
    }

    const segments = derivationPath.split("/");
    if (segments.length < 3) {
      return null;
    }

    const coinTypeSegment = segments[2];
    const coinType = parseInt(coinTypeSegment.replace("'", ""));
    return isNaN(coinType) ? null : coinType;
  }

  async getAddress(): Promise<string> {
    // For Turnkey, we don't directly get addresses, only public keys
    // The address derivation is handled by the Adamik API
    throw new Error("getAddress not implemented for Turnkey. Use getPubkey instead.");
  }

  async getPubkey(): Promise<string> {
    if (this.pubKey) {
      return this.pubKey;
    }

    try {
      // Check cache first
      const cacheKey = `${this.chainId}_${this.signerSpec.curve}_${this.signerSpec.coinType}`;
      if (this.cachedAccounts.has(cacheKey)) {
        this.pubKey = this.cachedAccounts.get(cacheKey)!;
        return this.pubKey;
      }

      // In browser, use API proxy
      if (typeof window !== "undefined") {
        const response = await fetch("/api/turnkey-proxy/get-pubkey", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            curve: this.signerSpec.curve,
            coinType: this.signerSpec.coinType,
            chainId: this.chainId,
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Failed to get public key from Turnkey");
        }

        const data = await response.json();
        let pubKey = data.pubkey;

        // Apply compression if needed for specific chains
        if (this.shouldCompressKey()) {
          pubKey = compressPublicKey(pubKey);
        }

        this.pubKey = pubKey;
        this.cachedAccounts.set(cacheKey, pubKey);
        return pubKey;
      } else {
        // Server-side logic
        await this.initializeClient();
        if (!this.turnkeyClient) {
          throw new Error("Turnkey client not initialized");
        }

        if (!process.env.TURNKEY_WALLET_ID) {
          throw new Error("TURNKEY_WALLET_ID is not configured");
        }

        const { accounts } = await this.turnkeyClient
          .apiClient()
          .getWalletAccounts({
            walletId: process.env.TURNKEY_WALLET_ID,
            paginationOptions: {
              limit: "100",
            },
          });

        // Look for account with matching curve and coin type
        const accountCompressed = accounts.find(
          (account) =>
            account.curve === this.convertAdamikCurveToTurnkeyCurve(this.signerSpec.curve) &&
            this.getCoinTypeFromDerivationPath(account.path) === Number(this.signerSpec.coinType) &&
            account.addressFormat === "ADDRESS_FORMAT_COMPRESSED"
        );

        if (!accountCompressed) {
          // Create new account if it doesn't exist
          const createAccount = await this.turnkeyClient
            .apiClient()
            .createWalletAccounts({
              walletId: process.env.TURNKEY_WALLET_ID,
              accounts: [
                {
                  curve: this.convertAdamikCurveToTurnkeyCurve(this.signerSpec.curve),
                  path: `m/44'/${this.signerSpec.coinType}'/0'/0/0`,
                  pathFormat: "PATH_FORMAT_BIP32",
                  addressFormat: "ADDRESS_FORMAT_COMPRESSED",
                },
              ],
            });

          this.pubKey = createAccount.addresses[0];
        } else {
          this.pubKey = accountCompressed.address;
        }

        // Apply compression if needed
        if (this.pubKey && this.shouldCompressKey()) {
          this.pubKey = compressPublicKey(this.pubKey);
        }

        this.cachedAccounts.set(cacheKey, this.pubKey!);
        return this.pubKey!;
      }
    } catch (error) {
      console.error("Error getting Turnkey public key:", error);
      throw error;
    }
  }

  private shouldCompressKey(): boolean {
    // Similar logic to IoFinnet - compress for Bitcoin family and Cosmos chains
    const bitcoinFamily = ["bitcoin", "bitcoin-testnet", "dogecoin", "litecoin", "bitcoin-cash"];
    const cosmosFamily = ["cosmoshub", "osmosis", "juno", "stargaze", "evmos", "injective", "axelar"];
    
    return bitcoinFamily.includes(this.chainId) || cosmosFamily.includes(this.chainId);
  }

  async signTransaction(encodedMessage: string): Promise<string> {
    console.log("Turnkey signing transaction for chain:", this.chainId);

    try {
      if (!this.pubKey) {
        this.pubKey = await this.getPubkey();
      }

      // In browser, use API proxy
      if (typeof window !== "undefined") {
        const response = await fetch("/api/turnkey-proxy/sign-transaction", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chainId: this.chainId,
            encodedMessage,
            pubKey: this.pubKey,
            signerSpec: this.signerSpec,
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Failed to sign transaction with Turnkey");
        }

        const data = await response.json();
        return data.signature;
      } else {
        throw new Error("Server-side signing not implemented");
      }
    } catch (error) {
      console.error("Error signing with Turnkey:", error);
      throw error;
    }
  }

  async signHash(hash: string): Promise<string> {
    console.log("Turnkey signing hash for chain:", this.chainId);

    try {
      if (!this.pubKey) {
        this.pubKey = await this.getPubkey();
      }

      // In browser, use API proxy
      if (typeof window !== "undefined") {
        const response = await fetch("/api/turnkey-proxy/sign-hash", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chainId: this.chainId,
            hash,
            pubKey: this.pubKey,
            signerSpec: this.signerSpec,
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Failed to sign hash with Turnkey");
        }

        const data = await response.json();
        return data.signature;
      } else {
        throw new Error("Server-side hash signing not implemented");
      }
    } catch (error) {
      console.error("Error signing hash with Turnkey:", error);
      throw error;
    }
  }
}