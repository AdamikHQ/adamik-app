import { NextRequest } from "next/server";

const vertices = [
  {
    url:
      process.env.SODOT_VERTEX_URL_0 ||
      process.env.NEXT_PUBLIC_SODOT_VERTEX_URL_0,
    apiKey:
      process.env.SODOT_VERTEX_API_KEY_0 ||
      process.env.NEXT_PUBLIC_SODOT_VERTEX_API_KEY_0 ||
      "",
  },
];

const corsHeaders = {
  "Content-Type": "application/json",
  "Cache-Control": "no-cache, no-store, must-revalidate",
  Pragma: "no-cache",
  Expires: "0",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function GET(request: NextRequest) {
  console.log("[ConnectionTest] Request received");

  try {
    // Check environment variables
    const envStatus = {
      serverSide: {
        SODOT_VERTEX_URL_0: process.env.SODOT_VERTEX_URL_0 ? "Set" : "Missing",
        SODOT_VERTEX_API_KEY_0: process.env.SODOT_VERTEX_API_KEY_0
          ? "Set"
          : "Missing",
        SODOT_EXISTING_ECDSA_KEY_IDS:
          process.env.SODOT_EXISTING_ECDSA_KEY_IDS?.split(",").length || 0,
        SODOT_EXISTING_ED25519_KEY_IDS:
          process.env.SODOT_EXISTING_ED25519_KEY_IDS?.split(",").length || 0,
      },
      clientSide: {
        NEXT_PUBLIC_SODOT_VERTEX_URL_0: process.env
          .NEXT_PUBLIC_SODOT_VERTEX_URL_0
          ? "Set"
          : "Missing",
        NEXT_PUBLIC_SODOT_VERTEX_API_KEY_0: process.env
          .NEXT_PUBLIC_SODOT_VERTEX_API_KEY_0
          ? "Set"
          : "Missing",
        NEXT_PUBLIC_SODOT_EXISTING_ECDSA_KEY_IDS:
          process.env.NEXT_PUBLIC_SODOT_EXISTING_ECDSA_KEY_IDS?.split(",")
            .length || 0,
        NEXT_PUBLIC_SODOT_EXISTING_ED25519_KEY_IDS:
          process.env.NEXT_PUBLIC_SODOT_EXISTING_ED25519_KEY_IDS?.split(",")
            .length || 0,
      },
    };

    console.log("[ConnectionTest] Environment status:", envStatus);

    // Check if we have a valid vertex
    const vertex = vertices[0];
    if (!vertex || !vertex.url) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Vertex configuration is missing",
          envStatus: envStatus,
        }),
        {
          status: 500,
          headers: corsHeaders,
        }
      );
    }

    // Try to connect to the Sodot vertex health endpoint
    const healthUrl = `${vertex.url}/health`;
    console.log(`[ConnectionTest] Testing connection to: ${healthUrl}`);

    const response = await fetch(healthUrl, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    });

    const status = response.status;
    console.log(`[ConnectionTest] Health check status: ${status}`);

    let responseBody;
    try {
      responseBody = await response.text();
      console.log(`[ConnectionTest] Health check response: ${responseBody}`);
    } catch (e) {
      responseBody = "Could not read response body";
      console.error(`[ConnectionTest] Error reading response: ${e}`);
    }

    // Now try to get a pubkey for verification
    console.log("[ConnectionTest] Testing pubkey retrieval");

    const ecdsaKeyId = (
      process.env.SODOT_EXISTING_ECDSA_KEY_IDS ||
      process.env.NEXT_PUBLIC_SODOT_EXISTING_ECDSA_KEY_IDS ||
      ""
    ).split(",")[0];

    let pubkeyStatus = "Not tested";
    let pubkeyData = null;

    if (ecdsaKeyId) {
      try {
        const pubkeyUrl = `${vertex.url}/ecdsa/derive-pubkey`;
        console.log(`[ConnectionTest] Testing pubkey at: ${pubkeyUrl}`);

        const pubkeyResponse = await fetch(pubkeyUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: vertex.apiKey || "",
          },
          body: JSON.stringify({
            key_id: ecdsaKeyId,
            derivation_path: [44, 60, 0, 0, 0],
          }),
        });

        const pubkeyStatus = pubkeyResponse.status;
        console.log(`[ConnectionTest] Pubkey status: ${pubkeyStatus}`);

        const pubkeyText = await pubkeyResponse.text();
        console.log(`[ConnectionTest] Pubkey response: ${pubkeyText}`);

        if (pubkeyText && pubkeyText.trim() !== "") {
          try {
            pubkeyData = JSON.parse(pubkeyText);
          } catch (e) {
            console.error(`[ConnectionTest] Error parsing pubkey JSON: ${e}`);
          }
        }
      } catch (e: any) {
        pubkeyStatus = `Error: ${e.message}`;
        console.error(`[ConnectionTest] Pubkey error: ${e}`);
      }
    } else {
      pubkeyStatus = "No ECDSA key ID available";
    }

    // Return the results
    return new Response(
      JSON.stringify({
        success: status === 200,
        vertex: {
          url: vertex.url,
          hasApiKey: !!vertex.apiKey,
        },
        health: {
          status: status,
          response: responseBody,
        },
        pubkey: {
          status: pubkeyStatus,
          keyId: ecdsaKeyId || "None",
          data: pubkeyData,
        },
        envStatus: envStatus,
      }),
      {
        status: 200,
        headers: corsHeaders,
      }
    );
  } catch (error: any) {
    console.error("[ConnectionTest] Error:", error);

    return new Response(
      JSON.stringify({
        success: false,
        error: "Connection test failed",
        message: error.message,
      }),
      {
        status: 500,
        headers: corsHeaders,
      }
    );
  }
}

// Handle OPTIONS request for CORS
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: corsHeaders,
  });
}
