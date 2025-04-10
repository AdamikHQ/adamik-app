import { AdamikCurve, AdamikSignerSpec } from "~/adamik/types";

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
    this.vertices = [
      {
        url: process.env.NEXT_PUBLIC_SODOT_VERTEX_URL_0 || "",
        apiKey: process.env.NEXT_PUBLIC_SODOT_VERTEX_API_KEY_0 || "",
      },
      {
        url: process.env.NEXT_PUBLIC_SODOT_VERTEX_URL_1 || "",
        apiKey: process.env.NEXT_PUBLIC_SODOT_VERTEX_API_KEY_1 || "",
      },
      {
        url: process.env.NEXT_PUBLIC_SODOT_VERTEX_URL_2 || "",
        apiKey: process.env.NEXT_PUBLIC_SODOT_VERTEX_API_KEY_2 || "",
      },
    ];

    // Initialize key IDs based on curve type
    switch (signerSpec.curve) {
      case AdamikCurve.SECP256K1:
        this.keyIds = (
          process.env.NEXT_PUBLIC_SODOT_EXISTING_ECDSA_KEY_IDS || ""
        )
          .split(",")
          .filter(Boolean);
        break;
      case AdamikCurve.ED25519:
        this.keyIds = (
          process.env.NEXT_PUBLIC_SODOT_EXISTING_ED25519_KEY_IDS || ""
        )
          .split(",")
          .filter(Boolean);
        break;
      default:
        throw new Error(`Unsupported curve: ${signerSpec.curve}`);
    }

    // Validate vertices configuration
    if (this.vertices.some((v) => !v.url || !v.apiKey)) {
      throw new Error(
        "Sodot vertices configuration is incomplete. Please check your environment variables."
      );
    }
  }

  private async makeRequest(
    vertexIndex: number,
    endpoint: string,
    method: string = "POST",
    body?: any
  ) {
    const vertex = this.vertices[vertexIndex];
    if (!vertex) throw new Error(`Vertex ${vertexIndex} not found`);

    try {
      const response = await fetch("/api/sodot", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          vertexIndex,
          endpoint,
          method,
          body,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Error response:", errorText);
        throw new Error(
          `Request failed: ${response.statusText} - ${errorText}`
        );
      }

      // Get the response text
      const responseText = await response.text();
      console.log("Response text:", responseText);

      // Parse the JSON response
      try {
        const data = JSON.parse(responseText);
        return data;
      } catch (e) {
        console.error("Failed to parse response as JSON:", e);
        console.error("Raw response:", responseText);
        throw new Error("Invalid JSON response from server");
      }
    } catch (error: any) {
      console.error("Request error:", error);
      throw new Error(
        `Failed to make request to vertex ${vertexIndex}: ${error.message}`
      );
    }
  }

  private adamikCurveToSodotCurve(curve: AdamikCurve): "ecdsa" | "ed25519" {
    return curve === AdamikCurve.SECP256K1 ? "ecdsa" : "ed25519";
  }

  public async getPubkey(): Promise<string> {
    if (this.keyIds.length === 0) {
      throw new Error(
        "No key IDs available. Please set the appropriate environment variables."
      );
    }

    const curve = this.adamikCurveToSodotCurve(this.signerSpec.curve);
    const response = await this.makeRequest(
      0,
      `/${curve}/derive-pubkey`,
      "POST",
      {
        key_id: this.keyIds[0],
        derivation_path: [44, Number(this.signerSpec.coinType), 0, 0, 0],
      }
    );

    return response.pubkey;
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

    // Return the first signature (they should all be identical)
    return signatures[0].signature;
  }
}
