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
  {
    url:
      process.env.SODOT_VERTEX_URL_1 ||
      process.env.NEXT_PUBLIC_SODOT_VERTEX_URL_1,
    apiKey:
      process.env.SODOT_VERTEX_API_KEY_1 ||
      process.env.NEXT_PUBLIC_SODOT_VERTEX_API_KEY_1 ||
      "",
  },
  {
    url:
      process.env.SODOT_VERTEX_URL_2 ||
      process.env.NEXT_PUBLIC_SODOT_VERTEX_URL_2,
    apiKey:
      process.env.SODOT_VERTEX_API_KEY_2 ||
      process.env.NEXT_PUBLIC_SODOT_VERTEX_API_KEY_2 ||
      "",
  },
];

const corsHeaders = {
  "Content-Type": "application/json",
  "Cache-Control": "no-cache, no-store, must-revalidate",
  Pragma: "no-cache",
  Expires: "0",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function POST(request: NextRequest) {
  let responseClone;

  try {
    console.log("[PubkeyAPI] Request received");
    const { curve, keyId, derivationPath } = await request.json();

    if (!curve || !keyId || !derivationPath) {
      return new Response(
        JSON.stringify({
          error: "Missing required parameters",
        }),
        {
          status: 400,
          headers: corsHeaders,
        }
      );
    }

    // Use vertex 0 for all pubkey requests
    const vertex = vertices[0];
    if (!vertex || !vertex.url) {
      return new Response(
        JSON.stringify({
          error: "Vertex configuration is missing",
        }),
        {
          status: 500,
          headers: corsHeaders,
        }
      );
    }

    // Construct the full URL to the SODOT vertex
    const targetUrl = `${vertex.url}/${curve}/derive-pubkey`;
    console.log(`[PubkeyAPI] Proxying request to: ${targetUrl}`);

    // Forward the request to the SODOT vertex
    const response = await fetch(targetUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: vertex.apiKey || "",
      },
      body: JSON.stringify({
        key_id: keyId,
        derivation_path: derivationPath,
      }),
    });

    // Clone the response for debugging
    responseClone = response.clone();

    // Log response details for debugging
    console.log(`[PubkeyAPI] Response status: ${response.status}`);

    // Get the response text
    const responseText = await response.text();
    console.log(`[PubkeyAPI] Response text:`, responseText);

    if (!response.ok) {
      return new Response(
        JSON.stringify({
          error: "Request failed",
          status: response.status,
          details: responseText,
        }),
        {
          status: response.status,
          headers: corsHeaders,
        }
      );
    }

    // Check if the response is empty
    if (!responseText || responseText.trim() === "") {
      return new Response(
        JSON.stringify({
          error: "Empty response from vertex",
        }),
        {
          status: 500,
          headers: corsHeaders,
        }
      );
    }

    // Parse the response as JSON
    try {
      const parsedResponse = JSON.parse(responseText);
      console.log(
        "[PubkeyAPI] Parsed response:",
        JSON.stringify(parsedResponse)
      );

      // Check if the response has a 'pubkey' field
      if (parsedResponse.pubkey) {
        // Transform the response based on the curve type
        if (curve === "ed25519") {
          // For ED25519, use pubkey as both compressed and uncompressed
          const transformedResponse = {
            compressed: parsedResponse.pubkey,
            uncompressed: parsedResponse.pubkey,
            pubkey: parsedResponse.pubkey,
          };

          console.log(
            "[PubkeyAPI] Transformed ED25519 response:",
            JSON.stringify(transformedResponse)
          );

          // Return the transformed response with proper headers
          return new Response(JSON.stringify(transformedResponse), {
            status: 200,
            headers: corsHeaders,
          });
        } else {
          // For other curves, if they only have pubkey (unlikely), still transform
          const transformedResponse = {
            compressed: parsedResponse.pubkey,
            uncompressed: parsedResponse.pubkey,
            pubkey: parsedResponse.pubkey,
          };

          console.log(
            "[PubkeyAPI] Transformed response:",
            JSON.stringify(transformedResponse)
          );

          return new Response(JSON.stringify(transformedResponse), {
            status: 200,
            headers: corsHeaders,
          });
        }
      }

      // If it has compressed/uncompressed fields, use those directly
      if (parsedResponse.compressed) {
        return new Response(JSON.stringify(parsedResponse), {
          status: 200,
          headers: corsHeaders,
        });
      }

      // Unexpected response format
      return new Response(
        JSON.stringify({
          error: "Unexpected response format",
          details: parsedResponse,
        }),
        {
          status: 500,
          headers: corsHeaders,
        }
      );
    } catch (e) {
      console.error("[PubkeyAPI] Failed to parse response as JSON:", e);

      return new Response(
        JSON.stringify({
          error: "Invalid JSON response",
          details: responseText,
        }),
        {
          status: 500,
          headers: corsHeaders,
        }
      );
    }
  } catch (error: any) {
    console.error("[PubkeyAPI] Error:", error);

    return new Response(
      JSON.stringify({
        error: "Internal server error",
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
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Max-Age": "86400",
    },
  });
}
