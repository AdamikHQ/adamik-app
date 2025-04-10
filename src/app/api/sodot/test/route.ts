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
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function POST(request: NextRequest) {
  console.log("[TestAPI] Request received");

  try {
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

    // Use vertex 0 for testing
    const vertex = vertices[0];
    if (!vertex || !vertex.url) {
      return new Response(
        JSON.stringify({
          error: "Vertex configuration is missing",
          env: {
            vertex0Url: process.env.SODOT_VERTEX_URL_0 ? "Set" : "Missing",
            vertex0ApiKey: process.env.SODOT_VERTEX_API_KEY_0
              ? "Set"
              : "Missing",
          },
        }),
        {
          status: 500,
          headers: corsHeaders,
        }
      );
    }

    // Construct the full URL to the SODOT vertex
    const targetUrl = `${vertex.url}/${curve}/derive-pubkey`;
    console.log(`[TestAPI] Making request to: ${targetUrl}`);
    console.log(`[TestAPI] Request body:`, {
      key_id: keyId,
      derivation_path: derivationPath,
    });

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

    // Log response details for debugging
    console.log(`[TestAPI] Response status: ${response.status}`);
    console.log(
      `[TestAPI] Response headers:`,
      Object.fromEntries(response.headers.entries())
    );

    // Get the response text
    const responseText = await response.text();
    console.log(`[TestAPI] Raw response text:`, responseText);

    // Return detailed information about the request and response
    return new Response(
      JSON.stringify(
        {
          request: {
            url: targetUrl,
            body: {
              key_id: keyId,
              derivation_path: derivationPath,
            },
          },
          response: {
            status: response.status,
            headers: Object.fromEntries(response.headers.entries()),
            body: responseText
              ? responseText.startsWith("{")
                ? JSON.parse(responseText)
                : responseText
              : null,
            rawText: responseText,
          },
        },
        null,
        2
      ),
      {
        status: 200,
        headers: corsHeaders,
      }
    );
  } catch (error: any) {
    console.error("[TestAPI] Error:", error);

    return new Response(
      JSON.stringify({
        error: "Internal server error",
        message: error.message,
        stack: error.stack,
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
