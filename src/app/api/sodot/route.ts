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

export async function POST(request: NextRequest) {
  let responseClone; // For debugging

  try {
    console.log("API route received request");
    const requestBody = await request.json();
    console.log("Request body:", JSON.stringify(requestBody));

    const { vertexIndex, endpoint, method, body } = requestBody;

    const vertex = vertices[vertexIndex];
    if (!vertex) {
      console.error(`Vertex ${vertexIndex} not found`);
      return new Response(JSON.stringify({ error: "Vertex not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Construct the full URL to the SODOT vertex
    const targetUrl = `${vertex.url}${endpoint}`;
    console.log(`Proxying request to: ${targetUrl}`);

    // Forward the request to the SODOT vertex
    const response = await fetch(targetUrl, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: vertex.apiKey || "",
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    // Clone the response for debugging
    responseClone = response.clone();

    // Log response details for debugging
    console.log(`Response status: ${response.status}`);
    console.log(
      `Response headers:`,
      Object.fromEntries(response.headers.entries())
    );

    // Get the response text
    const responseText = await response.text();
    console.log(`Response text:`, responseText);

    if (!response.ok) {
      console.error(`Request failed with status ${response.status}`);
      return new Response(
        JSON.stringify({
          error: "Request failed",
          status: response.status,
          details: responseText,
        }),
        {
          status: response.status,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Check if the response is empty
    if (!responseText || responseText.trim() === "") {
      console.error("Empty response from vertex");
      return new Response(
        JSON.stringify({
          error: "Empty response from vertex",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Parse the response as JSON
    try {
      const parsedResponse = JSON.parse(responseText);
      console.log("Parsed response:", JSON.stringify(parsedResponse));

      // Check if the response has a 'pubkey' field (Sodot vertex format)
      if (parsedResponse.pubkey) {
        // Transform the response based on the curve type
        // For ED25519, the vertex only returns a 'pubkey' field
        // For ECDSA, it returns 'compressed' and 'uncompressed'
        const isEd25519 = endpoint.includes("/ed25519/");

        if (isEd25519) {
          // For ED25519, use the pubkey as both compressed and uncompressed
          const transformedResponse = {
            compressed: parsedResponse.pubkey,
            uncompressed: parsedResponse.pubkey,
            // Preserve the original pubkey field as well
            pubkey: parsedResponse.pubkey,
          };

          console.log(
            "Transformed ED25519 response:",
            JSON.stringify(transformedResponse)
          );

          // Return the transformed response with proper headers
          return new Response(JSON.stringify(transformedResponse), {
            status: 200,
            headers: {
              "Content-Type": "application/json",
              "Cache-Control": "no-cache, no-store, must-revalidate",
              Pragma: "no-cache",
              Expires: "0",
            },
          });
        } else {
          // For other curves, just pass through the pubkey
          return new Response(JSON.stringify(parsedResponse), {
            status: 200,
            headers: {
              "Content-Type": "application/json",
              "Cache-Control": "no-cache, no-store, must-revalidate",
              Pragma: "no-cache",
              Expires: "0",
            },
          });
        }
      }

      // If it doesn't have a 'pubkey' field, return the original response
      return new Response(JSON.stringify(parsedResponse), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      });
    } catch (e) {
      console.error("Failed to parse response as JSON:", e);
      console.error("Raw response text:", responseText);
      return new Response(
        JSON.stringify({
          error: "Invalid JSON response",
          details: responseText,
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  } catch (error: any) {
    console.error("Sodot API error:", error);

    // If it's a fetch error and we have the response clone, try to get more info
    if (responseClone) {
      try {
        const cloneText = await responseClone.text();
        console.error("Response clone text:", cloneText);
      } catch (e) {
        console.error("Failed to read response clone:", e);
      }
    }

    return new Response(
      JSON.stringify({
        error: "Internal server error",
        message: error.message,
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      }
    );
  }
}
