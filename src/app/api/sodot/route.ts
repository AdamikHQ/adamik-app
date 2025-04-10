import { NextRequest } from "next/server";

const vertices = [
  {
    url: process.env.SODOT_VERTEX_URL_0,
    apiKey: process.env.SODOT_VERTEX_API_KEY_0,
  },
  {
    url: process.env.SODOT_VERTEX_URL_1,
    apiKey: process.env.SODOT_VERTEX_API_KEY_1,
  },
  {
    url: process.env.SODOT_VERTEX_URL_2,
    apiKey: process.env.SODOT_VERTEX_API_KEY_2,
  },
];

export async function POST(request: NextRequest) {
  try {
    const { vertexIndex, endpoint, method, body } = await request.json();

    const vertex = vertices[vertexIndex];
    if (!vertex) {
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

    // Return the raw response from the vertex
    return new Response(responseText, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...Object.fromEntries(response.headers.entries()),
      },
    });
  } catch (error: any) {
    console.error("Sodot API error:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        message: error.message,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
