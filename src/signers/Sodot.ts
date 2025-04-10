import {
  AdamikCurve,
  AdamikHashFunction,
  AdamikSignerSpec,
} from "~/adamik/types";
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
  private vertices: Array<{ url: string; apiKey: string }>;
  private keyIds: string[] = [];

  constructor(chainId: string, signerSpec: AdamikSignerSpec) {
    this.chainId = chainId;
    this.signerSpec = signerSpec;

    // Initialize vertices from environment variables
    // First try server-side env vars (preferred), then fallback to client-side
    const vertexUrl0 =
      process.env.SODOT_VERTEX_URL_0 ||
      process.env.NEXT_PUBLIC_SODOT_VERTEX_URL_0 ||
      "";
    const vertexApiKey0 =
      process.env.SODOT_VERTEX_API_KEY_0 ||
      process.env.NEXT_PUBLIC_SODOT_VERTEX_API_KEY_0 ||
      "";
    const vertexUrl1 =
      process.env.SODOT_VERTEX_URL_1 ||
      process.env.NEXT_PUBLIC_SODOT_VERTEX_URL_1 ||
      "";
    const vertexApiKey1 =
      process.env.SODOT_VERTEX_API_KEY_1 ||
      process.env.NEXT_PUBLIC_SODOT_VERTEX_API_KEY_1 ||
      "";
    const vertexUrl2 =
      process.env.SODOT_VERTEX_URL_2 ||
      process.env.NEXT_PUBLIC_SODOT_VERTEX_URL_2 ||
      "";
    const vertexApiKey2 =
      process.env.SODOT_VERTEX_API_KEY_2 ||
      process.env.NEXT_PUBLIC_SODOT_VERTEX_API_KEY_2 ||
      "";

    this.vertices = [
      {
        url: ensureUrlFormat(vertexUrl0),
        apiKey: vertexApiKey0,
      },
      {
        url: ensureUrlFormat(vertexUrl1),
        apiKey: vertexApiKey1,
      },
      {
        url: ensureUrlFormat(vertexUrl2),
        apiKey: vertexApiKey2,
      },
    ];

    // Log the vertex URLs for debugging
    console.log(
      `[Sodot] Vertex URLs:`,
      this.vertices.map((v) => v.url)
    );

    // Initialize key IDs based on curve type
    const serverSideKeyIds =
      process.env.SODOT_EXISTING_ECDSA_KEY_IDS ||
      process.env.SODOT_EXISTING_ED25519_KEY_IDS ||
      "";
    const clientSideKeyIds =
      process.env.NEXT_PUBLIC_SODOT_EXISTING_ECDSA_KEY_IDS ||
      process.env.NEXT_PUBLIC_SODOT_EXISTING_ED25519_KEY_IDS ||
      "";

    switch (signerSpec.curve) {
      case AdamikCurve.SECP256K1:
        this.keyIds = (
          process.env.SODOT_EXISTING_ECDSA_KEY_IDS ||
          process.env.NEXT_PUBLIC_SODOT_EXISTING_ECDSA_KEY_IDS ||
          ""
        )
          .split(",")
          .filter(Boolean);
        console.log(
          `[Sodot] Initialized SECP256K1 key IDs for chain ${chainId}:`,
          this.keyIds
        );
        break;
      case AdamikCurve.ED25519:
        this.keyIds = (
          process.env.SODOT_EXISTING_ED25519_KEY_IDS ||
          process.env.NEXT_PUBLIC_SODOT_EXISTING_ED25519_KEY_IDS ||
          ""
        )
          .split(",")
          .filter(Boolean);
        console.log(
          `[Sodot] Initialized ED25519 key IDs for chain ${chainId}:`,
          this.keyIds
        );
        break;
      default:
        throw new Error(`Unsupported curve: ${signerSpec.curve}`);
    }

    // Warn if vertices configuration is incomplete, but don't throw an error
    if (this.vertices.some((v) => !v.url || !v.apiKey)) {
      console.warn(
        "[Sodot] Vertices configuration is incomplete. Some vertices may not work."
      );
    }

    // Log the full configuration
    console.log(`[Sodot] Initialized for chain ${chainId} with:`, {
      curve: signerSpec.curve,
      keyIds: this.keyIds,
      vertices: this.vertices.map((v) => ({
        url: v.url,
        hasApiKey: !!v.apiKey,
      })),
    });
  }

  private async makeRequest(
    vertexIndex: number,
    endpoint: string,
    method: string = "POST",
    body?: any,
    retryCount: number = 0
  ): Promise<any> {
    const vertex = this.vertices[vertexIndex];
    if (!vertex) throw new Error(`Vertex ${vertexIndex} not found`);

    console.log(`[Sodot] Making request to vertex ${vertexIndex}:`, {
      endpoint,
      method,
      body,
      retryCount,
    });

    try {
      // Add a unique timestamp to prevent caching issues
      const timestamp = new Date().getTime();

      const response = await fetch(`/api/sodot?t=${timestamp}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
        },
        body: JSON.stringify({
          vertexIndex,
          endpoint,
          method,
          body,
        }),
        // Prevent caching issues
        cache: "no-store",
      });

      console.log(
        `[Sodot] Response status from vertex ${vertexIndex}:`,
        response.status
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error(
          `[Sodot] Error response from vertex ${vertexIndex}:`,
          errorText
        );
        throw new Error(
          `Request failed: ${response.statusText} - ${errorText}`
        );
      }

      // Get the response text
      const responseText = await response.text();
      console.log(
        `[Sodot] Raw response text from vertex ${vertexIndex}:`,
        responseText
      );

      // Check if the response is empty
      if (!responseText || responseText.trim() === "") {
        console.error(`[Sodot] Empty response from vertex ${vertexIndex}`);

        // Retry up to 3 times on empty response
        if (retryCount < 3) {
          console.log(
            `[Sodot] Retrying request to vertex ${vertexIndex} (${
              retryCount + 1
            }/3)`
          );
          // Wait a short time before retrying
          await new Promise((resolve) => setTimeout(resolve, 500));
          return this.makeRequest(
            vertexIndex,
            endpoint,
            method,
            body,
            retryCount + 1
          );
        }

        throw new Error("Empty response from server");
      }

      // Parse the JSON response
      try {
        const data = JSON.parse(responseText);
        console.log(`[Sodot] Parsed JSON from vertex ${vertexIndex}:`, data);
        return data;
      } catch (e) {
        console.error(
          `[Sodot] Failed to parse response as JSON from vertex ${vertexIndex}:`,
          e
        );
        console.error(
          `[Sodot] Raw response that failed to parse:`,
          responseText
        );

        // Retry up to 3 times on JSON parse error
        if (retryCount < 3) {
          console.log(
            `[Sodot] Retrying request to vertex ${vertexIndex} (${
              retryCount + 1
            }/3)`
          );
          // Wait a short time before retrying
          await new Promise((resolve) => setTimeout(resolve, 500));
          return this.makeRequest(
            vertexIndex,
            endpoint,
            method,
            body,
            retryCount + 1
          );
        }

        throw new Error("Invalid JSON response from server");
      }
    } catch (error: any) {
      console.error(`[Sodot] Request error for vertex ${vertexIndex}:`, error);

      // Retry up to 3 times on network errors
      if (error.message.includes("Failed to fetch") && retryCount < 3) {
        console.log(
          `[Sodot] Retrying request to vertex ${vertexIndex} (${
            retryCount + 1
          }/3)`
        );
        // Wait a short time before retrying
        await new Promise((resolve) => setTimeout(resolve, 500));
        return this.makeRequest(
          vertexIndex,
          endpoint,
          method,
          body,
          retryCount + 1
        );
      }

      throw new Error(
        `Failed to make request to vertex ${vertexIndex}: ${error.message}`
      );
    }
  }

  private adamikCurveToSodotCurve(curve: AdamikCurve): "ecdsa" | "ed25519" {
    return curve === AdamikCurve.SECP256K1 ? "ecdsa" : "ed25519";
  }

  public async getPubkey(): Promise<string> {
    try {
      if (this.keyIds.length === 0) {
        throw new Error("No key IDs available");
      }

      const keyId = this.keyIds[0];
      const curve = this.adamikCurveToSodotCurve(this.signerSpec.curve);

      console.log(
        `[Sodot] Getting pubkey for chain ${this.chainId} with curve ${curve}, keyId: ${keyId}`
      );

      // Make a POST request directly to the API route
      const response = await fetch("/api/sodot", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          vertexIndex: 0,
          endpoint: `/${curve}/derive-pubkey`,
          method: "POST",
          body: {
            key_id: keyId,
            derivation_path: [44, Number(this.signerSpec.coinType), 0, 0, 0],
          },
        }),
      });

      // Get the response text
      const responseText = await response.text();
      console.log(`[Sodot] Raw response:`, responseText);

      // If the response is empty, throw an error
      if (!responseText || responseText.trim() === "") {
        throw new Error("Empty response received");
      }

      // Parse the response
      try {
        const data = JSON.parse(responseText);
        console.log(`[Sodot] Parsed response:`, data);

        // Handle different response formats based on curve
        if (curve === "ed25519" && data.pubkey) {
          // For ED25519, return the pubkey directly
          console.log(`[Sodot] Using ED25519 pubkey:`, data.pubkey);
          return data.pubkey;
        } else if (curve === "ecdsa") {
          // For ECDSA, use the appropriate format based on the chain
          if (
            this.chainId === "ethereum" ||
            this.chainId === "base" ||
            this.chainId === "arbitrum" ||
            this.chainId === "linea"
          ) {
            // Ethereum and EVM chains need uncompressed format
            if (data.uncompressed) {
              console.log(
                `[Sodot] Using uncompressed pubkey for EVM chain:`,
                data.uncompressed
              );
              return data.uncompressed;
            }
          } else {
            // Non-EVM chains like Bitcoin use compressed format
            if (data.compressed) {
              console.log(
                `[Sodot] Using compressed pubkey for non-EVM chain:`,
                data.compressed
              );
              return data.compressed;
            }
          }
        }

        // Fallback handling for any format
        if (data.pubkey) {
          console.log(`[Sodot] Using pubkey:`, data.pubkey);
          return data.pubkey;
        } else if (data.compressed) {
          console.log(`[Sodot] Using compressed pubkey:`, data.compressed);
          return data.compressed;
        } else if (data.uncompressed) {
          console.log(`[Sodot] Using uncompressed pubkey:`, data.uncompressed);
          return data.uncompressed;
        } else {
          throw new Error(`Unknown response format: ${JSON.stringify(data)}`);
        }
      } catch (e: any) {
        console.error(`[Sodot] Failed to parse JSON:`, e);
        throw new Error(`Failed to parse response as JSON: ${e.message}`);
      }
    } catch (error: any) {
      console.error(`[Sodot] Error getting pubkey:`, error);
      throw new Error(`Failed to get pubkey: ${error.message}`);
    }
  }

  public async signTransaction(encodedMessage: string): Promise<string> {
    // Create a signing room
    const roomResponse = await this.makeRequest(0, "/create-room", "POST", {
      room_size: this.vertices.length,
    });

    // Sign the transaction with each vertex
    const curve = this.adamikCurveToSodotCurve(this.signerSpec.curve);
    const signatures = await Promise.all(
      this.vertices.map((_, index) =>
        this.makeRequest(index, `/${curve}/sign`, "POST", {
          room_uuid: roomResponse.room_uuid,
          key_id: this.keyIds[index],
          msg: encodedMessage,
          derivation_path: [44, Number(this.signerSpec.coinType), 0, 0, 0],
        })
      )
    );

    // Handle different signature formats
    const signature = signatures[0]; // Use the first signature (they should all be identical)

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
