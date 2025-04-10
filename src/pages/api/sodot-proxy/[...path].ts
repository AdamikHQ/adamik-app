import { NextApiRequest, NextApiResponse } from "next";
import { env } from "~/env"; // Assuming t3-env setup

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    // Extract vertex number and path from query parameters
    const { vertex } = req.query;
    const pathSegments = req.query.path as string[] | undefined;

    if (typeof vertex !== "string" || !vertex) {
      return res
        .status(400)
        .json({ error: "Missing or invalid vertex parameter" });
    }

    const pathStr = pathSegments ? `/${pathSegments.join("/")}` : "";
    console.log(`Proxying request for vertex: ${vertex}, path: ${pathStr}`);

    // Special handling for health check (if needed)
    if (pathStr === "/health") {
      return res.status(200).send("OK");
    }

    // Get the environment variables for the specific vertex
    const vertexUrl = env[`SODOT_VERTEX_URL_${vertex}` as keyof typeof env];
    const apiKey = env[`SODOT_VERTEX_API_KEY_${vertex}` as keyof typeof env];

    if (!vertexUrl || !apiKey) {
      return res.status(500).json({
        error: `Missing environment variables for vertex ${vertex}`,
        details: {
          url: vertexUrl ? "Set" : "Missing",
          apiKey: apiKey ? "Set" : "Missing",
        },
      });
    }

    // Construct the full URL to the SODOT vertex endpoint
    const targetUrl = new URL(`${vertexUrl}${pathStr}`);

    // Forward relevant query parameters (excluding 'vertex' and 'path')
    Object.entries(req.query).forEach(([key, value]) => {
      if (key !== "vertex" && key !== "path" && typeof value === "string") {
        targetUrl.searchParams.append(key, value);
      }
    });

    console.log(`Forwarding to: ${targetUrl.toString()}`);
    console.log(`Method: ${req.method}`);

    // Forward the request to the actual SODOT vertex
    const response = await fetch(targetUrl.toString(), {
      method: req.method || "GET",
      headers: {
        "Content-Type": "application/json", // Assume JSON, adjust if needed
        Authorization: apiKey,
        // Add other headers if necessary
      },
      // Only include body for relevant methods
      body:
        (req.method === "POST" ||
          req.method === "PUT" ||
          req.method === "PATCH") &&
        req.body
          ? JSON.stringify(req.body)
          : undefined,
    });

    // Handle the response from the SODOT vertex
    const contentType = response.headers.get("content-type");

    if (!response.ok) {
      // Handle upstream errors
      let errorData: any = `Upstream error: ${response.status}`;
      try {
        if (contentType?.includes("application/json")) {
          errorData = await response.json();
        } else {
          errorData = await response.text();
        }
      } catch (parseError) {
        console.error("Failed to parse upstream error response:", parseError);
        errorData = await response.text(); // Fallback to text
      }
      console.error(
        `Error from vertex ${vertex} (${targetUrl}):`,
        response.status,
        errorData
      );
      // Forward the upstream error status and data
      return res.status(response.status).json({
        status: response.status,
        error: "Upstream vertex error",
        details: errorData,
      });
    }

    // Handle successful responses
    if (contentType?.includes("application/json")) {
      const data = await response.json();
      return res.status(response.status).json({
        status: response.status,
        data: data, // Forward the JSON data
      });
    } else {
      const text = await response.text();
      // Decide how to handle non-JSON success responses
      // Option 1: Forward as text within a JSON structure
      return res.status(response.status).json({
        status: response.status,
        data: text,
      });
      // Option 2: Forward directly as text (adjust content type)
      // res.setHeader('Content-Type', contentType || 'text/plain');
      // return res.status(response.status).send(text);
    }
  } catch (error: any) {
    // Handle errors within the proxy handler itself
    console.error("Proxy handler error:", error);
    return res.status(500).json({
      status: 500,
      error: "Internal Proxy Error",
      message: error.message,
    });
  }
}
