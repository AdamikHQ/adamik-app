import {
  AdamikCurve,
  AdamikHashFunction,
  AdamikSignerSpec,
} from "~/utils/types";
import { encodePubKeyToAddress } from "~/api/adamik/encode";

// Helper function to determine if we're running in a production environment
const isProduction = (): boolean => {
  return (
    process.env.NODE_ENV === "production" ||
    window.location.hostname !== "localhost"
  );
};

// Helper function to ensure URLs have proper format
const ensureUrlFormat = (url: string): string => {
  if (!url) return url;
  // If URL doesn't start with http:// or https://, add https://
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    return `https://${url}`;
  }
  return url;
};

export class SodotSigner {
  private chainId: string;
  private signerSpec: AdamikSignerSpec;
  private n = 3;
  private t = 2;
  private keyIds: string[] = [];

  // Define vertices based on the environment - all API calls go through the proxy
  private SODOT_VERTICES = [
    {
      url: "/api/sodot-proxy",
      vertexParam: "0",
    },
    {
      url: "/api/sodot-proxy",
      vertexParam: "1",
    },
    {
      url: "/api/sodot-proxy",
      vertexParam: "2",
    },
  ];

  constructor(chainId: string, signerSpec: AdamikSignerSpec) {
    this.chainId = chainId;
    this.signerSpec = signerSpec;

    // Initialize key IDs based on curve type - these will be managed by the server
    console.log(`[Sodot] Initialized for ${signerSpec.curve} chain ${chainId}`);
  }

  private adamikCurveToSodotCurve(curve: AdamikCurve): "ecdsa" | "ed25519" {
    return curve === AdamikCurve.SECP256K1 ? "ecdsa" : "ed25519";
  }

  private async callVertexEndpoint(
    vertexId: number,
    path: string,
    method: string = "GET",
    body?: any,
    retryCount: number = 0
  ): Promise<any> {
    const vertex = this.SODOT_VERTICES[vertexId];
    if (!vertex) throw new Error(`Vertex ${vertexId} not found`);

    console.log(`[Sodot] Making request to vertex ${vertexId}:`, {
      path,
      method,
      body,
      retryCount,
    });

    try {
      // Add a unique timestamp to prevent caching issues
      const timestamp = new Date().getTime();
      const url = `${vertex.url}${path}?vertex=${vertex.vertexParam}&t=${timestamp}`;

      const options: RequestInit = {
        method: method,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
        },
        cache: "no-store",
      };

      // Add body for POST, PUT, PATCH requests
      if (["POST", "PUT", "PATCH"].includes(method) && body) {
        options.body = JSON.stringify(body);
      }

      console.log(`[Sodot] Fetching ${url} with options:`, options);
      const response = await fetch(url, options);

      console.log(
        `[Sodot] Response status from vertex ${vertexId}:`,
        response.status
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error(
          `[Sodot] Error response from vertex ${vertexId}:`,
          errorText
        );
        throw new Error(
          `Request failed: ${response.statusText} - ${errorText}`
        );
      }

      const contentType = response.headers.get("content-type") || "";

      // Handle response based on content type
      if (contentType.includes("application/json")) {
        try {
          const data = await response.json();
          console.log(`[Sodot] Parsed JSON from vertex ${vertexId}:`, data);
          return data;
        } catch (e) {
          console.error(
            `[Sodot] Failed to parse response as JSON from vertex ${vertexId}:`,
            e
          );

          // Retry on JSON parse error
          if (retryCount < 3) {
            console.log(
              `[Sodot] Retrying request to vertex ${vertexId} (${
                retryCount + 1
              }/3)`
            );
            await new Promise((resolve) => setTimeout(resolve, 500));
            return this.callVertexEndpoint(
              vertexId,
              path,
              method,
              body,
              retryCount + 1
            );
          }

          throw e;
        }
      } else {
        // Handle text response
        const text = await response.text();
        console.log(`[Sodot] Text response from vertex ${vertexId}:`, text);
        return text;
      }
    } catch (error: any) {
      console.error(`[Sodot] Request error for vertex ${vertexId}:`, error);

      // Retry on network errors
      if (retryCount < 3) {
        console.log(
          `[Sodot] Retrying request to vertex ${vertexId} (${retryCount + 1}/3)`
        );
        await new Promise((resolve) => setTimeout(resolve, 500));
        return this.callVertexEndpoint(
          vertexId,
          path,
          method,
          body,
          retryCount + 1
        );
      }

      throw error;
    }
  }

  private async createRoomWithVertex(vertexId: number, roomSize: number) {
    return this.callVertexEndpoint(vertexId, "/create-room", "POST", {
      room_size: roomSize,
    });
  }

  private async getKeyId(vertexId: number, curve: "ecdsa" | "ed25519") {
    try {
      // In client-side code, we need to use the NEXT_PUBLIC_ environment variables
      // or server environment variables proxied through API routes
      let keyIdsStr: string | undefined;

      // First try using the browser-accessible environment variables
      if (typeof window !== "undefined") {
        const envVar =
          curve === "ecdsa"
            ? "NEXT_PUBLIC_SODOT_EXISTING_ECDSA_KEY_IDS"
            : "NEXT_PUBLIC_SODOT_EXISTING_ED25519_KEY_IDS";

        keyIdsStr = process.env[envVar];
        console.log(
          `[Sodot] Attempting to use client-side env var ${envVar}:`,
          keyIdsStr ? "found" : "not found"
        );
      }

      // If not found, try to fetch the key IDs from the server
      if (!keyIdsStr) {
        console.log(
          `[Sodot] Client-side key IDs not found, fetching from server API`
        );
        try {
          const response = await fetch(
            `/api/sodot-proxy/get-key-ids?curve=${curve}`,
            {
              method: "GET",
              headers: { "Content-Type": "application/json" },
            }
          );

          if (response.ok) {
            const data = await response.json();
            keyIdsStr = data.keyIds;
            console.log(
              `[Sodot] Server provided key IDs:`,
              keyIdsStr ? "success" : "failed"
            );
          } else {
            console.error(
              `[Sodot] Failed to get key IDs from server:`,
              await response.text()
            );
          }
        } catch (err) {
          console.error(`[Sodot] Error fetching key IDs from server:`, err);
        }
      }

      // If we have key IDs, use them
      if (keyIdsStr) {
        const keyIds = keyIdsStr.split(",");
        if (keyIds.length > vertexId && keyIds[vertexId]) {
          console.log(
            `[Sodot] Using key ID for vertex ${vertexId}: ${keyIds[
              vertexId
            ].substring(0, 8)}...`
          );
          return keyIds[vertexId];
        }
      }

      throw new Error("No existing key ID found in environment variables");
    } catch (error) {
      console.error(
        `[Sodot] Error getting key ID for vertex ${vertexId}:`,
        error
      );
      throw error;
    }
  }

  private async derivePubkeyWithVertex(
    vertexId: number,
    derivationPath: number[],
    curve: "ecdsa" | "ed25519"
  ) {
    // First, get the key ID if we don't have it yet
    if (!this.keyIds[vertexId]) {
      const keyId = await this.getKeyId(vertexId, curve);
      this.keyIds[vertexId] = keyId;
      console.log(
        `[Sodot] Retrieved key ID for vertex ${vertexId}: ${this.keyIds[vertexId]}`
      );
    }

    const keyId = this.keyIds[vertexId];
    console.log(`[Sodot] Using key ID for derivation: ${keyId}`);

    const result = await this.callVertexEndpoint(
      vertexId,
      `/${curve}/derive-pubkey`,
      "POST",
      {
        key_id: keyId,
        derivation_path: derivationPath,
      }
    );

    // Handle different response formats based on curve and chain
    if (curve === "ed25519" && result.pubkey) {
      return result.pubkey;
    } else if (curve === "ecdsa") {
      // For Ethereum and EVM chains, use uncompressed format
      if (
        this.chainId === "ethereum" ||
        this.chainId === "base" ||
        this.chainId === "arbitrum" ||
        this.chainId === "linea"
      ) {
        return result.uncompressed || result.pubkey;
      } else {
        // For other chains like Bitcoin, use compressed format
        return result.compressed || result.pubkey;
      }
    }

    // Fallback to any available format
    return result.pubkey || result.compressed || result.uncompressed;
  }

  public async getPubkey(): Promise<string> {
    try {
      const curve = this.adamikCurveToSodotCurve(this.signerSpec.curve);

      console.log(
        `[Sodot] Getting pubkey for chain ${this.chainId} with curve ${curve}`
      );

      const pubkey = await this.derivePubkeyWithVertex(
        0,
        [44, Number(this.signerSpec.coinType), 0, 0, 0],
        curve
      );

      console.log(`[Sodot] Retrieved pubkey: ${pubkey}`);
      return pubkey;
    } catch (error: any) {
      console.error(`[Sodot] Error getting pubkey:`, error);
      throw new Error(`Failed to get pubkey: ${error.message}`);
    }
  }

  public async signTransaction(encodedMessage: string): Promise<string> {
    try {
      // Ensure we have key IDs
      const curve = this.adamikCurveToSodotCurve(this.signerSpec.curve);

      // Get key IDs if we don't have them yet
      if (this.keyIds.length === 0 || this.keyIds.some((id) => !id)) {
        for (let i = 0; i < this.n; i++) {
          if (!this.keyIds[i]) {
            const keysResult = await this.callVertexEndpoint(
              i,
              `/v1/keys?curve=${curve}`,
              "GET"
            );

            if (keysResult && keysResult.keyId) {
              this.keyIds[i] = keysResult.keyId;
              console.log(
                `[Sodot] Retrieved key ID for vertex ${i}: ${this.keyIds[i]}`
              );
            } else {
              throw new Error(`Failed to get key ID for vertex ${i}`);
            }
          }
        }
      }

      // Create a signing room
      const roomResponse = await this.createRoomWithVertex(0, this.n);
      const roomUuid = roomResponse.room_uuid;
      console.log(`[Sodot] Created signing room: ${roomUuid}`);

      // Ensure the message is properly formatted
      let formattedMsg = encodedMessage;
      if (formattedMsg.startsWith("0x")) {
        formattedMsg = formattedMsg.substring(2);
      }

      // Sign the transaction with each vertex
      console.log(`[Sodot] Signing message with room ${roomUuid}`);
      const signatures = await Promise.all(
        this.keyIds.map((keyId, index) =>
          this.callVertexEndpoint(index, `/${curve}/sign`, "POST", {
            room_uuid: roomUuid,
            key_id: keyId,
            msg: formattedMsg,
            derivation_path: [44, Number(this.signerSpec.coinType), 0, 0, 0],
          })
        )
      );

      // Handle different signature formats
      const signature = signatures[0]; // Use the first signature
      console.log(`[Sodot] Received signature:`, signature);

      if ("signature" in signature) {
        return signature.signature;
      } else if ("r" in signature && "s" in signature) {
        // For ECDSA signatures
        const format = this.signerSpec.signatureFormat;
        if (format === "der") {
          return signature.der;
        } else {
          // Handle other formats as needed
          return `${signature.r}${signature.s}${signature.v.toString(16)}`;
        }
      }

      // Fallback for unknown formats
      return JSON.stringify(signature);
    } catch (error: any) {
      console.error(`[Sodot] Error signing transaction:`, error);
      throw new Error(`Failed to sign transaction: ${error.message}`);
    }
  }

  public async getAddress(): Promise<string> {
    console.log(`[Sodot] Starting getAddress for chain ${this.chainId}`);

    try {
      // First get the pubkey
      const pubkey = await this.getPubkey();
      console.log(`[Sodot] Got pubkey for chain ${this.chainId}:`, pubkey);

      // Use the Adamik API to encode the pubkey to an address
      console.log(
        `[Sodot] Calling encodePubKeyToAddress for chain ${this.chainId} with pubkey ${pubkey}`
      );

      const { address } = await encodePubKeyToAddress(pubkey, this.chainId);
      console.log(
        `[Sodot] Successfully derived address for chain ${this.chainId}:`,
        address
      );
      return address;
    } catch (error: any) {
      console.error(`[Sodot] Error getting address:`, error);
      throw new Error(`Failed to get address: ${error.message}`);
    }
  }
}
