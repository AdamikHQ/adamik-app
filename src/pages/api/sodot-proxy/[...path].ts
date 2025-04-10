import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    // Extract vertex number from query parameter
    const { vertex } = req.query;
    const path = req.query.path as string[];

    if (!vertex) {
      return res.status(400).json({ error: "Missing vertex parameter" });
    }

    // Get the path from the URL path segments
    const pathStr = path ? `/${path.join("/")}` : "";
    console.log(`Path segments:`, path);
    console.log(`Constructed path: ${pathStr}`);

    // Special handling for health check
    if (pathStr === "/health") {
      return res.status(200).send("OK");
    }

    // Get the environment variables for the vertex
    const vertexUrl =
      process.env[`VITE_SODOT_VERTEX_URL_${vertex}`] ||
      process.env[`SODOT_VERTEX_URL_${vertex}`];
    const apiKey =
      process.env[`VITE_SODOT_VERTEX_API_KEY_${vertex}`] ||
      process.env[`SODOT_VERTEX_API_KEY_${vertex}`];

    if (!vertexUrl || !apiKey) {
      return res.status(500).json({
        error: `Missing environment variables for vertex ${vertex}`,
        details: {
          url: vertexUrl ? "Set" : "Missing",
          apiKey: apiKey ? "Set" : "Missing",
        },
      });
    }

    // Construct the full URL to the SODOT vertex
    const targetUrl = new URL(`${vertexUrl}${pathStr}`);

    // Copy all query parameters except 'vertex' and 'path'
    Object.entries(req.query).forEach(([key, value]) => {
      if (key !== "vertex" && key !== "path") {
        targetUrl.searchParams.append(key, value as string);
      }
    });

    console.log(`Proxying request to: ${targetUrl.toString()}`);
    console.log(`Request method: ${req.method}`);
    if (req.body) {
      console.log(`Request body:`, req.body);
    }

    // Forward the request to the SODOT vertex
    const response = await fetch(targetUrl.toString(), {
      method: req.method || "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: apiKey,
      },
      body: req.body ? JSON.stringify(req.body) : undefined,
    });

    const contentType = response.headers.get("content-type");

    try {
      if (contentType?.includes("application/json")) {
        const data = await response.json();
        return res.status(response.status).json({
          status: response.status,
          data,
        });
      } else {
        const text = await response.text();
        return res.status(response.status).json({
          status: response.status,
          data: text,
        });
      }
    } catch (e: any) {
      console.error("Error reading response:", e);
      return res.status(500).json({
        status: 500,
        error: "Error reading response",
        message: e.message,
      });
    }
  } catch (error: any) {
    console.error("Proxy error:", error);
    return res.status(500).json({
      error: "Internal Server Error",
      message: error.message,
      stack: error.stack,
    });
  }
}
